import { describe, it, expect } from 'vitest'
import { buildAyurvedaInterpretation } from '../ayurvedaInterpretationEngine'
import { AYV_C1_PROMPTS } from '../ayurvedaChapter1'
import { AYV_C2_PROMPTS } from '../ayurvedaChapter2'
import type { ExperienceResponseRecord } from '@/types/cer'

describe('MICROBLOCO 1B-b: Normalização Multi-Seleção e Coerência de Agni', () => {
  const enrollmentId = 'enr-test-1bb'
  const experienceId = 'exp-test-ayurveda'
  const respondentUserId = 'user-test-1bb'

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

  const makeCompletedC2Baseline = (
    extraRecords: ExperienceResponseRecord[],
  ): ExperienceResponseRecord[] => {
    return [
      makeRecord({
        id: 'c2-completion',
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
        created: '2026-03-01T12:00:00.000Z',
      }),
      ...extraRecords,
    ]
  }

  // 1. Duas escolhas de fome (ex. ['regular_hours','sudden_intense']) processam multi-seleção de C2
  // NOTA 1B-c: C2 é habitual e não vira Vikriti ativa (arrays de evidências atuais vazios, confidence 'Em observação')
  it('1. Duas escolhas de fome (regular_hours e sudden_intense em array) normalizam valores e alimentam leitura de Agni Pitta', () => {
    const responses = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: ['regular_hours', 'sudden_intense'] },
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    expect(result.hasCompletedRevision).toBe(true)
    // Microbloco 1B-c: C2 é habitual e não vira evidência de Vikriti aguda/ativa
    expect(result.vikritiHypothesis.evidencesPitta).toHaveLength(0)
    expect(result.vikritiHypothesis.confidence).toBe('Em observação')
    // A escolha súbita/intensa é capturada no Agni correspondente (Tikshna)
    expect(result.agniReading.type).toBe('Tikshna Agni')
  })

  // 2. Duas escolhas de eliminação e de sono no formato selectedOptionIds (plural) processam multi-seleção
  // NOTA 1B-c: Sinais do C2 são funcionamento habitual; Vikriti permanece em observação sem primaryImbalance
  it('2. Duas escolhas de eliminação e de sono no formato selectedOptionIds (plural) normalizam corretamente sem virar Vikriti ativa', () => {
    const responses = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-bowel',
        prompt_id: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.id,
        prompt_key: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key,
        revision_number: 1,
        structured_value: {
          selectedOptionIds: ['constipated', 'skips_days'],
        },
      }),
      makeRecord({
        id: 'c2-sleep',
        prompt_id: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
        revision_number: 1,
        structured_value: {
          selectedOptionIds: ['light_interrupted', 'difficulty_falling_asleep'],
        },
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    // Microbloco 1B-c: C2 é habitual_adult; não vira desequilíbrio ativo nem primaryImbalance
    expect(result.vikritiHypothesis.confidence).toBe('Em observação')
    expect(result.vikritiHypothesis.primaryImbalance).toBeUndefined()
    expect(result.vikritiHypothesis.evidencesVata).toHaveLength(0)
  })

  // 3. Pós-refeição com duas escolhas (ex. ['heavy_slow_digestion','bloating_gas']) alimenta Agni/Ama conforme mapeamentos
  it('3. Pós-refeição com duas escolhas (heavy_slow_digestion e bloating_gas) alimenta Agni/Ama conforme mapeamentos', () => {
    const responses = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-post-meal',
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
        structured_value: {
          value: ['heavy_slow_digestion', 'bloating_gas'],
        },
      }),
      // Adiciona segunda categoria de Ama para validar presença convergente
      makeRecord({
        id: 'c2-stool',
        prompt_id: AYV_C2_PROMPTS.P7_STOOL_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P7_STOOL_PATTERN.key,
        revision_number: 1,
        structured_value: { value: 'sticky_incomplete' },
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    // Ama deve identificar a categoria pós-refeição e a categoria fezes
    expect(result.amaReading.categoriesInvolved).toContain('Digestão e sensação pós-refeição')
    expect(result.amaReading.categoriesInvolved).toContain('Eliminação intestinal')
    expect(result.amaReading.presence).toBe('Sinalizada')

    // Como há sinais de Vata (bloating_gas) e Kapha (heavy_slow_digestion), Agni deve acusar sinais mistos
    expect(result.agniReading.type).toBe('Indefinido / Em observação')
    expect(result.agniReading.description).toMatch(/Sinais mistos/)
  })

  // 4. Formato singular legado (selectedOptionId / value string) continua funcionando como antes
  // NOTA 1B-c: C2 não vira Vikriti ativa; a extração normaliza e alimenta Agni e atenção
  it('4. Formato singular legado (selectedOptionId e value string) continua funcionando perfeitamente na extração de escolhas', () => {
    const responses = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger-legacy-string',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: 'intense' },
      }),
      makeRecord({
        id: 'c2-sleep-legacy-option-id',
        prompt_id: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
        revision_number: 1,
        structured_value: { selectedOptionId: 'moderate_hot' },
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    // Microbloco 1B-c: C2 habitual alimenta Agni (intense -> Tikshna Agni) sem gerar Vikriti ativa
    expect(result.agniReading.type).toBe('Tikshna Agni')
    expect(result.vikritiHypothesis.confidence).toBe('Em observação')
    expect(result.vikritiHypothesis.primaryImbalance).toBeUndefined()
  })

  // 5. Inversão da ordem das opções no array produz resultado idêntico (toEqual)
  it('5. Inversão da ordem das opções no array produz resultado idêntico (toEqual)', () => {
    const responsesA = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: {
          selectedOptionIds: ['regular_hours', 'sudden_intense', 'variable_intensity'],
        },
      }),
      makeRecord({
        id: 'c2-post-meal',
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
        structured_value: {
          value: ['bloating_gas', 'heavy_slow_digestion'],
        },
      }),
    ])

    const responsesB = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: {
          selectedOptionIds: ['variable_intensity', 'sudden_intense', 'regular_hours'],
        },
      }),
      makeRecord({
        id: 'c2-post-meal',
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
        structured_value: {
          value: ['heavy_slow_digestion', 'bloating_gas'],
        },
      }),
    ])

    const resultA = buildAyurvedaInterpretation(responsesA)
    const resultB = buildAyurvedaInterpretation(responsesB)

    expect(resultA).toEqual(resultB)
  })

  // 6. Incerteza/recusa EXPLÍCITA — ids dont_know/refusal e flags de metadata explicit_unsure/explicit_refusal
  // — não geram evidência nem equilíbrio
  it('6. Incerteza/recusa explícita (ids dont_know/refusal e flags metadata) não geram evidência nem Sama Agni', () => {
    const responsesWithIds = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger-dont-know',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: ['dont_know', 'refusal', 'unknown'] },
      }),
      makeRecord({
        id: 'c2-post-meal-refusal',
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
        structured_value: { selectedOptionId: 'dont_know' },
      }),
    ])

    const resIds = buildAyurvedaInterpretation(responsesWithIds)
    expect(resIds.vikritiHypothesis.evidencesVata).toHaveLength(0)
    expect(resIds.vikritiHypothesis.evidencesPitta).toHaveLength(0)
    expect(resIds.vikritiHypothesis.evidencesKapha).toHaveLength(0)
    // NUNCA pode ser tratado como prova de equilíbrio (Sama Agni)
    expect(resIds.agniReading.type).toBe('Indefinido / Em observação')

    const responsesWithMetadataFlags = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger-unsure-flag',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: {
          value: 'regular_hours',
          metadata: { explicit_unsure: true },
        },
      }),
      makeRecord({
        id: 'c2-post-meal-refusal-flag',
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
        structured_value: {
          value: 'light_comfortable',
          metadata: { explicit_refusal: true },
        },
      }),
    ])

    const resFlags = buildAyurvedaInterpretation(responsesWithMetadataFlags)
    expect(resFlags.agniReading.type).toBe('Indefinido / Em observação')
    expect(resFlags.agniReading.type).not.toBe('Sama Agni')
  })

  // 7. Id desconhecido (não catalogado) não vira evidência
  it('7. Id desconhecido (não catalogado) não vira evidência', () => {
    const responses = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger-random',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: {
          selectedOptionIds: ['some_random_unregistered_choice_xyz'],
        },
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    expect(result.vikritiHypothesis.evidencesVata).toHaveLength(0)
    expect(result.vikritiHypothesis.evidencesPitta).toHaveLength(0)
    expect(result.vikritiHypothesis.evidencesKapha).toHaveLength(0)
    expect(result.agniReading.type).toBe('Indefinido / Em observação')
  })

  // 8. Agni com sinais mistos (combinação de sinais de tipos distintos) resulta "Indefinido / Em observação" com explicação
  // e NÃO o tipo que vinha primeiro no if/else
  it('8. Agni com sinais mistos de tipos distintos resulta em Indefinido / Em observação com explicação de sinais mistos', () => {
    // Sinais de Vishama (fome irregular) + Tikshna (azia/queimação pós refeição)
    const responses = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: 'irregular' },
      }),
      makeRecord({
        id: 'c2-post-meal',
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
        structured_value: { value: 'heat_burning_acidity' },
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    // No if/else antigo, Vishama Agni vencia porque vinha antes. Agora deve ser Indefinido / Em observação.
    expect(result.agniReading.type).toBe('Indefinido / Em observação')
    expect(result.agniReading.description).toContain('Sinais mistos')
    expect(result.agniReading.description).toContain('Vishama')
    expect(result.agniReading.description).toContain('Tikshna')
    expect(result.agniReading.evidences).toContain('Padrão de fome irregular ou imprevisível')
    expect(result.agniReading.evidences).toContain(
      'Sensação de queimação ou refluxo após refeições',
    )
  })

  // 9. Agni explicitamente estável (fome regular + pós-refeição sem desconforto, sem sinais conflitantes) resulta Sama
  it('9. Agni explicitamente estável (fome regular + pós-refeição confortável, sem sinais conflitantes) resulta Sama Agni', () => {
    const responses = makeCompletedC2Baseline([
      makeRecord({
        id: 'c2-hunger-regular',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: 'regular_hours' },
      }),
      makeRecord({
        id: 'c2-post-meal-comfort',
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
        structured_value: { value: 'light_comfortable' },
      }),
    ])

    const result = buildAyurvedaInterpretation(responses)

    expect(result.agniReading.type).toBe('Sama Agni')
    expect(result.agniReading.description).toContain('Agni equilibrado')
    expect(result.agniReading.evidences).toContain(
      'Fome previsível e sensação pós-refeição estável',
    )
  })
})
