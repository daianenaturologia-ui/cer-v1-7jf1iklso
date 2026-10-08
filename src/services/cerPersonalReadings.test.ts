import { describe, it, expect } from 'vitest'
import { buildCerMapReadings, isCerMapReadingSnapshot } from './cerMapReadings'
import { BUILD_07C_MENTE_PROMPTS, BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'
import { BUILD_07D_RELACOES_PROMPTS } from './build07dPrompts'
import { BUILD_07E_SEXUALIDADE_PROMPTS } from './build07ePrompts'
import { BUILD_07F_SENTIDO_PROMPTS } from './build07fPrompts'
import { integratedResources, resourceMapFingerprint } from './cerIntegratedResources'
import { selectedReadingChoices } from './cerPersonalReadings'
const prompts = [
  ...BUILD_07C_MENTE_PROMPTS,
  ...BUILD_07C_REGULACAO_PROMPTS,
  ...BUILD_07D_RELACOES_PROMPTS,
  ...BUILD_07E_SEXUALIDADE_PROMPTS,
  ...BUILD_07F_SENTIDO_PROMPTS,
]
function response(key: string, value: any, overrides: any = {}) {
  const p = prompts.find((p) => (p.schema_config as any).prompt_key === key)!
  return {
    id: `r-${key}`,
    enrollment_id: 'enr',
    experience_id: p.experience_id,
    prompt_id: p.id,
    access_class: 'participant_shared',
    status: 'saved',
    created: '2026-10-08',
    updated: '2026-10-08',
    structured_value: { value },
    ...overrides,
  } as any
}
describe('Interpretação compartilhada com evidências', () => {
  it('interpreta escolhas em todas as cinco dimensões sem inventar causas ou repetir perguntas', () => {
    const rows = [
      response('pensamento_associado', ['preciso_dar_conta']),
      response('resposta_tendencia', ['resolver_imediatamente', 'ceder_agradar']),
      response('pedir_apoio_tendencia', 'tento_resolver_sozinha'),
      response('disponibilidade_camada_experiencia', 'quero_mas_sem_espaco'),
      response('espaco_para_o_que_importa_sc2', 'sim_pouco_espaco'),
    ]
    const s = buildCerMapReadings(rows, 'enr', 'Lia')
    for (const d of s.dimensions.slice(1)) {
      expect(d.personalSections?.length).toBeGreaterThan(0)
      expect(d.insights?.length).toBeGreaterThan(0)
      expect(d.personalSections?.[0].sourceResponseIds).toContain(
        `r-${d.detailedRows[0].sourcePromptKey}`,
      )
    }
    expect(JSON.stringify(s.dimensions.slice(1).map((d) => d.personalSections))).not.toMatch(
      /\?|infância|trauma|diagnóstic/,
    )
    const reactions = s.elementReadings!
    expect(reactions.luta.summary).toContain('resolver e intervir')
    expect(reactions.submissao.summary).toContain('apaziguar e ceder')
    expect(isCerMapReadingSnapshot(s)).toBe(true)
  })
  it('não inclui conteúdo privado, rascunhos, recusa, campos privados mal classificados ou outra pessoa', () => {
    const rows = [
      response('pedir_apoio_tendencia', 'tento_resolver_sozinha', {
        status: 'draft',
        free_text: 'SEGREDO',
      }),
      response('disponibilidade_camada_experiencia', 'quero_mas_sem_espaco', {
        access_class: 'participant_private',
      }),
      response('espaco_para_o_que_importa_sc2', 'sim_pouco_espaco', { enrollment_id: 'outro' }),
      response('resposta_corporal_camada', 'resposta_facil', { free_text: 'PRIVADO' }),
      response('pensamento_associado', [], {
        structured_value: { is_legitimate_skip: true, skip_reason: 'prefiro_nao_responder' },
      }),
    ]
    const s = buildCerMapReadings(rows, 'enr', 'Lia')
    expect(integratedResources(s)).toEqual([])
    expect(JSON.stringify(s)).not.toMatch(/SEGREDO|PRIVADO/)
  })
  it('seleciona a resposta mais recente e não atribui recursos inacessíveis como sempre disponíveis', () => {
    const s = buildCerMapReadings(
      [
        response('resource_access_under_stress_layer', 'consigo_recorrer', {
          id: 'old',
          updated: '2026-10-01',
        }),
        response('resource_access_under_stress_layer', 'sei_que_ajuda_mas_dificil', { id: 'new' }),
      ],
      'enr',
      'Lia',
    )
    expect(integratedResources(s).some((i) => i.label === 'Mobilizar meus recursos')).toBe(false)
    expect(
      integratedResources(s).some((i) => i.label === 'Acessar meus recursos no calor do momento'),
    ).toBe(true)
    expect(s.dimensions[2].personalSections?.[0].sourceResponseIds).toEqual(['new'])
  })
  it('preserva respostas abertas sem classificar por palavras, incluindo negativas', () => {
    const s = buildCerMapReadings(
      [response('self_dialogue_erro', '', { free_text: 'Não sou perfeccionista, não me cobro.' })],
      'enr',
      'Lia',
    )
    expect(s.dimensions[1].personalSections?.[0].text).toContain('Não sou perfeccionista')
    expect(integratedResources(s)).toEqual([])
  })
  it('mostra nomes de apoios open-first e não expõe identificadores internos', () => {
    const s = buildCerMapReadings(
      [response('pensamento_associado', ['preciso_dar_conta'])],
      'enr',
      'Lia',
    )
    expect(s.dimensions[1].detailedRows[0].text).toContain('Preciso dar conta')
    expect(s.dimensions[1].detailedRows[0].text).not.toContain('preciso_dar_conta')
  })
  it('ignora escolhas desconhecidas e combinações contraditórias para inferências', () => {
    const p = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => (p.schema_config as any).prompt_key === 'custo_posterior',
    )!
    expect(
      selectedReadingChoices(
        p,
        response('custo_posterior', ['volto_rapido', 'corpo_tenso_cansado']),
      ),
    ).toEqual([])
    expect(
      integratedResources(
        buildCerMapReadings([response('custo_posterior', 'future_option')], 'enr', 'Lia'),
      ),
    ).toEqual([])
  })
  it('somente padrões relatados ativos entram; frequência desconhecida ou quase nunca não vira vulnerabilidade', () => {
    const s = buildCerMapReadings(
      [
        response('movimentos_automaticos_frequencia_p1', null, {
          structured_value: {
            ratings: {
              cartao_1_fazer_certo: 'Repete-se com frequência',
              cartao_2_agradar_cuidar: 'Quase nunca acontece comigo',
              cartao_3_realizar: 'Ainda não sei dizer',
            },
          },
        }),
      ],
      'enr',
      'Lia',
    )
    const items = integratedResources(s)
    expect(items.some((i) => i.label === 'Cobrança por fazer tudo certo')).toBe(true)
    expect(items.some((i) => i.label === 'Colocar minhas necessidades depois')).toBe(false)
    expect(items.filter((i) => i.kind === 'difficulty')).toHaveLength(1)
  })
  it('deduplica recursos iguais preservando as origens e mantém o documento imutável', () => {
    const s = buildCerMapReadings(
      [
        response('limites_cena_adaptativa', 'percebo_e_falo'),
        response('comunicacao_desconforto_cena', 'percebo_e_falo'),
      ],
      'enr',
      'Lia',
    )
    const before = JSON.stringify(s)
    const pool = integratedResources(s)
    const limits = pool.filter((i) => i.label === 'Comunicar meus limites')
    expect(limits).toHaveLength(1)
    expect(limits[0].origins.map((o) => o.dimensionId)).toEqual(['relacoes', 'sexualidade'])
    expect(JSON.stringify(s)).toBe(before)
    const next = { ...s, generatedAt: 'another-time' }
    expect(resourceMapFingerprint(integratedResources(next))).toBe(resourceMapFingerprint(pool))
  })
  it('rejeita proveniência que não faz parte do documento', () => {
    const s = buildCerMapReadings(
      [response('pedir_apoio_tendencia', 'tento_resolver_sozinha')],
      'enr',
      'Lia',
    )
    s.dimensions[3].personalSections![0].sourceResponseIds = ['private-response']
    expect(isCerMapReadingSnapshot(s)).toBe(false)
  })
})
