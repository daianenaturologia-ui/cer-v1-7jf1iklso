import { describe, expect, it } from 'vitest'
import { buildCerLiveIntegration } from './cerLiveIntegration'
import { buildCerMapReadings } from './cerMapReadings'
import { BUILD_07C_MENTE_PROMPTS, BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'
import { BUILD_07D_RELACOES_PROMPTS } from './build07dPrompts'
import { BUILD_07E_SEXUALIDADE_PROMPTS } from './build07ePrompts'
import { BUILD_07F_SENTIDO_PROMPTS } from './build07fPrompts'
import { createDemoCerMapReading } from './demoCerMapReading'
const prompts = [
  ...BUILD_07C_MENTE_PROMPTS,
  ...BUILD_07C_REGULACAO_PROMPTS,
  ...BUILD_07D_RELACOES_PROMPTS,
  ...BUILD_07E_SEXUALIDADE_PROMPTS,
  ...BUILD_07F_SENTIDO_PROMPTS,
]
function response(key: string, value: string[], overrides = {}) {
  const p = prompts.find((p) => (p.schema_config as any).prompt_key === key)!
  return {
    id: key,
    enrollment_id: 'enr',
    experience_id: p.experience_id,
    prompt_id: p.id,
    access_class: 'participant_shared',
    status: 'saved',
    created: '2026-10-01',
    updated: '2026-10-02',
    structured_value: { value },
    ...overrides,
  } as any
}
const event = (overrides = {}) =>
  ({
    id: 'life',
    enrollment_id: 'enr',
    title: 'Uma mudança',
    time_kind: 'year',
    time_value: '2020',
    emotions: ['Medo'],
    narrative: 'Relato meu, não uma interpretação automática.',
    access_class: 'participant_shared',
    updated: '2026-10-03',
    ...overrides,
  }) as any
function project(
  responses: any[],
  events: any[] = [],
  audience: 'participant' | 'professional' = 'participant',
) {
  return buildCerLiveIntegration({
    snapshot: buildCerMapReadings(responses, 'enr', 'Lia'),
    responses,
    events,
    audience,
  })
}
describe('Integração viva do Mapa SER', () => {
  it('cruza dimensões em uma síntese com recursos, custos e prioridades, sem copiar narrativas', () => {
    const responses = [
      response('emocoes_recorrentes', ['medo']),
      response('resposta_tendencia', ['resolver_imediatamente']),
      response('limites_cena_adaptativa', ['tento_me_adaptar']),
      response('pedir_apoio_tendencia', ['tento_resolver_sozinha']),
      response('disponibilidade_camada_experiencia', ['quero_mas_sem_espaco']),
      response('espaco_para_o_que_importa_sc2', ['sim_pouco_espaco']),
    ]
    const snapshot = buildCerMapReadings(responses, 'enr', 'Lia')
    snapshot.dimensions[0] = createDemoCerMapReading().dimensions[0]
    const reading = buildCerLiveIntegration({ snapshot, responses, events: [event()] })
    expect(new Set(reading.sections.flatMap((s) => s.dimensionIds))).toEqual(
      new Set(['corpo', 'mente', 'regulacao', 'relacoes', 'sexualidade', 'sentido']),
    )
    expect(reading.summary).toMatch(/busca de segurança.*ação/)
    expect(reading.summary).toContain('intimidade quanto para o que dá sentido')
    expect(reading.summary).toContain('sua história')
    expect(reading.sections.find((s) => s.id === 'alert-action')!.responseIds).toEqual([
      'emocoes_recorrentes',
      'resposta_tendencia',
    ])
    expect(reading.sections.find((s) => s.id === 'history-emotions')!.eventIds).toEqual(['life'])
    expect(JSON.stringify(reading)).not.toContain('Relato meu')
    expect(reading.priorities.length).toBeGreaterThan(2)
    expect(reading.updatedAt).toBe('2026-10-03')
  })
  it('retira interpretações antigas quando uma resposta muda, inclusive não sei e salto legítimo', () => {
    const initial = response('resposta_tendencia', ['resolver_imediatamente'])
    const fear = response('emocoes_recorrentes', ['medo'])
    const changed = response('resposta_tendencia', ['afastar_recolher'], {
      id: 'new',
      updated: '2026-10-04',
    })
    const reading = project([initial, fear, changed])
    expect(reading.sections.some((s) => s.id === 'alert-action')).toBe(false)
    expect(reading.sections.some((s) => s.id === 'alert-retreat')).toBe(true)
    const skip = {
      ...changed,
      structured_value: { value: ['resolver_imediatamente'], is_legitimate_skip: true },
    }
    expect(
      project([initial, fear, skip]).sections.some((s) => s.dimensionIds.includes('regulacao')),
    ).toBe(false)
  })
  it('exclui respostas de terceiros, privadas, rascunhos e versões descartadas', () => {
    const fear = response('emocoes_recorrentes', ['medo'])
    for (const overrides of [
      { enrollment_id: 'other' },
      { access_class: 'participant_private' },
      { status: 'draft' },
      { status: 'superseded' },
      { status: 'discarded' },
    ]) {
      expect(
        project([fear, response('resposta_tendencia', ['resolver_imediatamente'], overrides)])
          .sections,
      ).toEqual([])
    }
  })
  it('não transforma narrativa livre, nem emoções diferentes, em causalidade histórica', () => {
    const rows = [
      response('emocoes_recorrentes', ['ansiedade_apreensao'], {
        free_text: 'Trauma medo luta abandono',
      }),
    ]
    const reading = project(rows, [event()])
    expect(reading.sections.map((s) => s.id)).toEqual(['history-context'])
    expect(reading.summary).toBe('')
  })
  it('refaz a conexão histórica após editar ou excluir um marco', () => {
    const rows = [response('emocoes_recorrentes', ['medo'])]
    expect(project(rows, [event()]).sections[0].id).toBe('history-emotions')
    expect(project(rows, [event({ emotions: ['Alegria'] })]).sections[0].id).toBe('history-context')
    expect(project(rows, []).sections).toEqual([])
  })
  it('mantém marcos particulares apenas na projeção da interagente e isola matrículas', () => {
    const rows = [response('emocoes_recorrentes', ['medo'])]
    const events = [
      event({ access_class: 'participant_private' }),
      event({ id: 'other', enrollment_id: 'other' }),
    ]
    expect(project(rows, events).sections[0].eventIds).toEqual(['life'])
    const professional = project(rows, events, 'professional')
    expect(professional.sections).toEqual([])
    expect(professional.historyAvailable).toBe(false)
    expect(professional.updatedAt).toBe('2026-10-02')
  })
  it('acolhe recursos e dificuldade coexistentes sem apagar uma das leituras', () => {
    const reading = project([
      response('emocoes_recorrentes', ['medo']),
      response('limites_cena_adaptativa', ['percebo_e_falo', 'percebo_mas_demoro']),
    ])
    expect(reading.sections.find((s) => s.id === 'available-support')!.text).toContain(
      'podem coexistir',
    )
  })
  it('não preenche lacunas com uma personalidade padrão nem modifica a publicação', () => {
    const snapshot = buildCerMapReadings([], 'enr', 'Lia')
    snapshot.integration = 'Texto revisado, preservado'
    const before = JSON.stringify(snapshot)
    const reading = buildCerLiveIntegration({ snapshot, responses: [] })
    expect(reading.sections).toEqual([])
    expect(reading.summary).toBe('')
    expect(reading.missingDimensions).toHaveLength(6)
    expect(reading.updatedAt).toBeUndefined()
    expect(JSON.stringify(snapshot)).toBe(before)
  })
})
