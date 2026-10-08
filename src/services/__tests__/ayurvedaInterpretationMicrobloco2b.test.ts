import { describe, it, expect } from 'vitest'
import { buildAyurvedaInterpretation } from '../ayurvedaInterpretationEngine'
import { AYV_C1_PROMPTS } from '../ayurvedaChapter1'
import type { ExperienceResponseRecord } from '@/types/cer'

describe('MICROBLOCO 2B: P1_DURATION, Desempate Sem Hierarquia e Opções de Variabilidade', () => {
  const enrollmentId = 'enr-test-m2b'
  const experienceId = 'exp-test-ayurveda'
  const respondentUserId = 'user-test-m2b'

  const makeRecord = (params: {
    id: string
    prompt_id: string
    prompt_key?: string
    revision_number: number
    structured_value: any
    metadata?: Record<string, any>
    created?: string
    updated?: string
  }): ExperienceResponseRecord => {
    const combinedMetadata = {
      prompt_key: params.prompt_key || params.prompt_id,
      revision_number: params.revision_number,
      ...(params.metadata || {}),
      ...(params.structured_value?.metadata || {}),
    }

    return {
      id: params.id,
      enrollment_id: enrollmentId,
      experience_id: experienceId,
      prompt_id: params.prompt_id,
      prompt_key: params.prompt_key,
      respondent_user_id: respondentUserId,
      response_type: 'ChoiceCards',
      access_class: 'shared_care',
      structured_value: {
        ...params.structured_value,
        revision_number: params.revision_number,
        metadata: combinedMetadata,
      },
      metadata: combinedMetadata,
      free_text: '',
      prompt_version: 1,
      version: params.revision_number,
      status: 'saved',
      created: params.created || '2026-03-01T10:00:00.000Z',
      updated: params.updated || '2026-03-01T10:00:00.000Z',
    } as ExperienceResponseRecord
  }

  const makeCompletedC1Baseline = (
    extraRecords: ExperienceResponseRecord[],
    revisionNumber: number = 1,
  ): ExperienceResponseRecord[] => {
    return [
      makeRecord({
        id: `c1-completion-rev${revisionNumber}`,
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: revisionNumber,
        structured_value: { completed: true },
        created: '2026-03-01T12:00:00.000Z',
      }),
      ...extraRecords,
    ]
  }

  // 1. Empate Vata 2 / Pitta 2: texto E campos sem hierarquia artificial entre os dois
  it('1. Empate Vata 2 / Pitta 2: sem predominância artificial, primary/secondary indefinidos, texto sem hierarquia e sem inflar confiança', () => {
    // Vata: Pele (dry_rough), Cabelo (fine_delicate) -> 2 categorias
    // Pitta: Temperatura (warm / heat_easily), Estrutura (medium com lifelong) -> 2 categorias
    // Kapha: 0 categorias
    const responses = makeCompletedC1Baseline([
      makeRecord({
        id: 'c1-p1-structure',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'intermediate' }, // Pitta
      }),
      makeRecord({
        id: 'c1-p1-duration',
        prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        revision_number: 1,
        structured_value: { value: 'lifelong' },
      }),
      makeRecord({
        id: 'c1-p2-skin',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        structured_value: { value: 'dry_rough' }, // Vata
      }),
      makeRecord({
        id: 'c1-p3-hair',
        prompt_id: AYV_C1_PROMPTS.P3_HAIR.id,
        prompt_key: AYV_C1_PROMPTS.P3_HAIR.key,
        revision_number: 1,
        structured_value: { value: 'fine_delicate' }, // Vata
      }),
      makeRecord({
        id: 'c1-p4-temp',
        prompt_id: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
        prompt_key: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
        revision_number: 1,
        structured_value: { value: 'heat_easily' }, // Pitta
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    // Não deve definir primária/secundária favorecendo Vata por ordem alfabética ou do array
    expect(result.prakritiHypothesis.primaryTendency).toBeUndefined()
    expect(result.prakritiHypothesis.secondaryTendency).toBeUndefined()
    // Confiança NÃO deve ser inflada para 'Alta'; deve ser Moderada
    expect(result.prakritiHypothesis.confidence).toBe('Moderada')
    // Texto deve descrever convergência entre ambos sem hierarquia
    expect(result.prakritiHypothesis.summary).toContain('Convergência entre Pitta e Vata')
    expect(result.prakritiHypothesis.summary).toContain(
      'sem predominância separável com os dados atuais',
    )
    // Evidências de ambos devem estar presentes
    expect(result.prakritiHypothesis.evidencesVata.length).toBe(2)
    expect(result.prakritiHypothesis.evidencesPitta.length).toBe(2)
  })

  // 2. Ordem invariável: mesmas respostas em ordem invertida no array produzem resultado idêntico
  it('2. Ordem invariável: mesmas respostas em ordem invertida produzem resultado idêntico (toEqual)', () => {
    const listA = makeCompletedC1Baseline([
      makeRecord({
        id: 'rec-1',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'light_narrow' },
        created: '2026-03-01T10:00:00.000Z',
      }),
      makeRecord({
        id: 'rec-2',
        prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        revision_number: 1,
        structured_value: { value: 'lifelong' },
        created: '2026-03-01T10:01:00.000Z',
      }),
      makeRecord({
        id: 'rec-3',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        structured_value: { value: 'warm_sensitive' },
        created: '2026-03-01T10:02:00.000Z',
      }),
      makeRecord({
        id: 'rec-4',
        prompt_id: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
        prompt_key: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
        revision_number: 1,
        structured_value: { value: 'cold_easily' },
        created: '2026-03-01T10:03:00.000Z',
      }),
    ])

    const listB = [...listA].reverse()

    const resA = buildAyurvedaInterpretation(listA)
    const resB = buildAyurvedaInterpretation(listB)

    expect(resA).toEqual(resB)
  })

  // 3. Duração 'lifelong' / 'most_adult' -> estrutura conta normalmente para dosha
  it('3. Duração lifelong / most_adult: estrutura conta normalmente para evidência de dosha', () => {
    const resLifelong = buildAyurvedaInterpretation(
      makeCompletedC1Baseline([
        makeRecord({
          id: 'p1-struct',
          prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
          prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
          revision_number: 1,
          structured_value: { value: 'broad_solid' }, // Kapha
        }),
        makeRecord({
          id: 'p1-dur',
          prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
          prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
          revision_number: 1,
          structured_value: { value: 'lifelong' },
        }),
        makeRecord({
          id: 'p2-skin',
          prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
          prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
          revision_number: 1,
          structured_value: { value: 'soft_oily' }, // Kapha
        }),
      ]),
    )

    expect(
      resLifelong.prakritiHypothesis.evidencesKapha.some(
        (e) => e.category === 'Estrutura corporal',
      ),
    ).toBe(true)
    expect(resLifelong.prakritiHypothesis.primaryTendency).toBe('Kapha')

    const resMostAdult = buildAyurvedaInterpretation(
      makeCompletedC1Baseline([
        makeRecord({
          id: 'p1-struct',
          prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
          prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
          revision_number: 1,
          structured_value: { value: 'broad_solid' }, // Kapha
        }),
        makeRecord({
          id: 'p1-dur',
          prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
          prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
          revision_number: 1,
          structured_value: { value: 'most_adult' },
        }),
        makeRecord({
          id: 'p2-skin',
          prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
          prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
          revision_number: 1,
          structured_value: { value: 'soft_oily' }, // Kapha
        }),
      ]),
    )

    expect(
      resMostAdult.prakritiHypothesis.evidencesKapha.some(
        (e) => e.category === 'Estrutura corporal',
      ),
    ).toBe(true)
  })

  // 4. Duração 'some_phases' / 'changed_lot' -> estrutura EXCLUÍDA da predominância, mas pele/cabelo/temp contam normalmente; explicação presente
  it('4. Duração some_phases / changed_lot: estrutura é excluída da predominância, pele/cabelo contam normalmente e ponto de atenção explica a variação', () => {
    const responses = makeCompletedC1Baseline([
      makeRecord({
        id: 'p1-struct',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'light_narrow' }, // Vata (mas duração variável)
      }),
      makeRecord({
        id: 'p1-dur',
        prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        revision_number: 1,
        structured_value: { value: 'changed_lot' },
      }),
      makeRecord({
        id: 'p2-skin',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        structured_value: { value: 'warm_sensitive' }, // Pitta
      }),
      makeRecord({
        id: 'p3-hair',
        prompt_id: AYV_C1_PROMPTS.P3_HAIR.id,
        prompt_key: AYV_C1_PROMPTS.P3_HAIR.key,
        revision_number: 1,
        structured_value: { value: 'fine_oily' }, // Pitta
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    // Estrutura NÃO deve contar como evidência de Vata
    expect(
      result.prakritiHypothesis.evidencesVata.some((e) => e.category === 'Estrutura corporal'),
    ).toBe(false)
    expect(result.prakritiHypothesis.evidencesVata.length).toBe(0)

    // Pele e cabelo de Pitta continuam contando normalmente (2 categorias -> primary Pitta)
    expect(result.prakritiHypothesis.evidencesPitta.length).toBe(2)
    expect(result.prakritiHypothesis.primaryTendency).toBe('Pitta')

    // Ponto de atenção deve conter explicação sobre estrutura não sustentando hipótese constitucional estável
    const hasStructureVariationExplanation = result.attentionPoints.some(
      (p) =>
        p.toLowerCase().includes('estrutura corporal habitual') &&
        p.toLowerCase().includes('variações') &&
        p.toLowerCase().includes('constitucional estável'),
    )
    expect(hasStructureVariationExplanation).toBe(true)
  })

  // 5. Ausência / legado sem P1_DURATION -> "duração não confirmada", sem estabilidade afirmada
  it('5. Ausência/legado sem P1_DURATION registra "duração não confirmada" nos pontos de atenção sem afirmar estabilidade', () => {
    const responses = makeCompletedC1Baseline([
      makeRecord({
        id: 'p1-struct',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'intermediate' }, // Pitta
      }),
      // Sem P1_DURATION gravado
      makeRecord({
        id: 'p2-skin',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        structured_value: { value: 'warm_sensitive' }, // Pitta
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    const hasUnconfirmedNotice = result.attentionPoints.some(
      (p) =>
        p.toLowerCase().includes('duração da estrutura') &&
        p.toLowerCase().includes('não confirmada'),
    )
    expect(hasUnconfirmedNotice).toBe(true)
  })

  // 6. Rascunho posterior de C1 não contamina a duração lida (só a revisão concluída)
  it('6. Rascunho posterior de C1 (rev 2 sem conclusão) não contamina a duração da rev 1 concluída', () => {
    const responses = [
      // Conclusão canônica da rev 1
      makeRecord({
        id: 'c1-completion-rev1',
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
      }),
      // Respostas da rev 1 com duração estável lifelong
      makeRecord({
        id: 'c1-p1-rev1',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'slender' },
      }),
      makeRecord({
        id: 'c1-dur-rev1',
        prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        revision_number: 1,
        structured_value: { value: 'lifelong' },
      }),
      makeRecord({
        id: 'c1-p2-rev1',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        structured_value: { value: 'dry_rough' },
      }),
      // Respostas em RASCUNHO na rev 2 (sem conclusão) com duração mudada para changed_lot
      makeRecord({
        id: 'c1-p1-rev2-draft',
        prompt_id: 'ayv_c1_p1_estrutura_corporal_rev2',
        prompt_key: 'ayv_c1_estrutura_corporal_rev2',
        revision_number: 2,
        structured_value: { value: 'slender' },
      }),
      makeRecord({
        id: 'c1-dur-rev2-draft',
        prompt_id: 'ayv_c1_p1_estrutura_duracao_rev2',
        prompt_key: 'ayv_c1_estrutura_duracao_rev2',
        revision_number: 2,
        structured_value: { value: 'changed_lot' },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    // A revisão ativa selecionada deve ser a 1
    expect(result.activeRevisionNumber).toBe(1)
    // A estrutura da rev 1 (lifelong) conta como evidência de Vata
    expect(
      result.prakritiHypothesis.evidencesVata.some((e) => e.category === 'Estrutura corporal'),
    ).toBe(true)
    // Não deve acusar a variação do rascunho da rev 2
    expect(
      result.attentionPoints.some((p) =>
        p.includes('não sustenta hipótese de estrutura constitucional estável'),
      ),
    ).toBe(false)
  })

  // 7. Resposta com opção variável (varies_region, mixed_varies, alternates, varies_climate, varies_stress) não gera dosha, apenas ponto a explorar
  it('7. Respostas com opções variáveis de C1 entram como pontos a explorar e não geram evidência de dosha', () => {
    const responses = makeCompletedC1Baseline([
      makeRecord({
        id: 'p1-struct',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'intermediate' },
      }),
      makeRecord({
        id: 'p1-dur',
        prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        revision_number: 1,
        structured_value: { value: 'lifelong' },
      }),
      makeRecord({
        id: 'p2-skin-varies',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        structured_value: { value: 'varies_region' }, // Variabilidade
      }),
      makeRecord({
        id: 'p3-hair-varies',
        prompt_id: AYV_C1_PROMPTS.P3_HAIR.id,
        prompt_key: AYV_C1_PROMPTS.P3_HAIR.key,
        revision_number: 1,
        structured_value: { value: 'mixed_varies' }, // Variabilidade
      }),
      makeRecord({
        id: 'p4-temp-varies',
        prompt_id: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
        prompt_key: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
        revision_number: 1,
        structured_value: { value: 'alternates' }, // Variabilidade
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    // Nenhuma evidência de pele, cabelo ou temperatura para nenhum dosha
    expect(
      result.prakritiHypothesis.evidencesVata.some((e) => e.category === 'Pele habitual'),
    ).toBe(false)
    expect(
      result.prakritiHypothesis.evidencesPitta.some((e) => e.category === 'Pele habitual'),
    ).toBe(false)
    expect(
      result.prakritiHypothesis.evidencesKapha.some((e) => e.category === 'Pele habitual'),
    ).toBe(false)

    // Devem constar como "Ponto a explorar" nos attentionPoints
    expect(
      result.attentionPoints.some((p) => p.includes('Ponto a explorar') && p.includes('Pele')),
    ).toBe(true)
    expect(
      result.attentionPoints.some((p) => p.includes('Ponto a explorar') && p.includes('Cabelo')),
    ).toBe(true)
    expect(
      result.attentionPoints.some(
        (p) => p.includes('Ponto a explorar') && p.includes('Temperatura'),
      ),
    ).toBe(true)
  })

  // 8. Triplo empate (Vata 2 / Pitta 2 / Kapha 2): ambiguidade que requer aprofundamento, sem tridosha confirmada
  it('8. Triplo empate não converte em constituição tridosha/sama confirmada e sinaliza ambiguidade', () => {
    // Vata: Pele (dry_rough), Cabelo (fine_delicate) -> 2
    // Pitta: Temperatura (warm / heat_easily), Estrutura (intermediate + lifelong) -> 2
    // Kapha: vamos simular C1 com múltiplas respostas ou categorias
    // Em C1 as 4 categorias são: Estrutura, Pele, Cabelo, Temperatura.
    // Com multi-seleção de pele ou cabelo, podemos ter 2 de cada dosha:
    // Ex.: Pele com [dry_rough (Vata), warm_sensitive (Pitta)]
    // Cabelo com [fine_delicate (Vata), thick_dense (Kapha)]
    // Estrutura: broad_solid (Kapha) + lifelong
    // Temperatura: heat_easily (Pitta)
    // Resultado: Vata 2 (Pele, Cabelo), Pitta 2 (Pele, Temperatura), Kapha 2 (Cabelo, Estrutura)
    const responses = makeCompletedC1Baseline([
      makeRecord({
        id: 'p1-struct',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'broad_solid' }, // Kapha
      }),
      makeRecord({
        id: 'p1-dur',
        prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        revision_number: 1,
        structured_value: { value: 'lifelong' },
      }),
      makeRecord({
        id: 'p2-skin',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        structured_value: { value: ['dry_rough', 'warm_sensitive'] }, // Vata + Pitta
      }),
      makeRecord({
        id: 'p3-hair',
        prompt_id: AYV_C1_PROMPTS.P3_HAIR.id,
        prompt_key: AYV_C1_PROMPTS.P3_HAIR.key,
        revision_number: 1,
        structured_value: { value: ['fine_delicate', 'thick_dense'] }, // Vata + Kapha
      }),
      makeRecord({
        id: 'p4-temp',
        prompt_id: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
        prompt_key: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
        revision_number: 1,
        structured_value: { value: 'heat_easily' }, // Pitta
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    expect(result.prakritiHypothesis.evidencesVata.length).toBe(2)
    expect(result.prakritiHypothesis.evidencesPitta.length).toBe(2)
    expect(result.prakritiHypothesis.evidencesKapha.length).toBe(2)

    expect(result.prakritiHypothesis.primaryTendency).toBeUndefined()
    expect(result.prakritiHypothesis.secondaryTendency).toBeUndefined()
    expect(result.prakritiHypothesis.confidence).toBe('Em observação')
    expect(result.prakritiHypothesis.summary).toContain(
      'Convergência equilibrada de respostas entre Vata, Pitta e Kapha',
    )
    expect(result.prakritiHypothesis.summary).toContain(
      'sem inferência de constituição tridosha confirmada',
    )
  })
})
