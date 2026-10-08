import { describe, it, expect } from 'vitest'
import type { ExperienceResponseRecord } from '@/types/cer'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'
import { AYV_C2_PROMPTS } from '@/services/ayurvedaChapter2'
import { AYV_C3_PROMPTS } from '@/services/ayurvedaChapter3'
import { buildAyurvedaInterpretation } from '@/services/ayurvedaInterpretationEngine'

function makeRecord(params: {
  prompt_id: string
  prompt_key?: string
  structured_value?: any
  metadata?: Record<string, any>
  created?: string
  updated?: string
}): ExperienceResponseRecord {
  const isC3 = params.prompt_id.startsWith('ayv_c3_')
  const isC2 = params.prompt_id.startsWith('ayv_c2_')
  const combinedMetadata = {
    prompt_key: params.prompt_key || params.prompt_id,
    ...(params.metadata || {}),
    ...(params.structured_value?.metadata || {}),
  }

  return {
    id: `rec-${Math.random().toString(36).slice(2, 9)}`,
    enrollment_id: 'enr-test',
    experience_id: isC3
      ? 'capitulo-3-diferente-agora'
      : isC2
        ? 'exp-corpo-fisiologia-07b'
        : 'exp-corpo-fisiologia-07b',
    prompt_id: params.prompt_id,
    prompt_key: params.prompt_key || params.prompt_id,
    canonical_prompt_id: params.prompt_id,
    respondent_user_id: 'user-test',
    response_type: 'ChoiceCards',
    access_class: 'participant_shared',
    version: 1,
    prompt_version: 1,
    status: 'saved',
    created: params.created || '2026-03-30T10:00:00.000Z',
    updated: params.updated || '2026-03-30T10:00:00.000Z',
    structured_value: {
      ...(params.structured_value || {}),
      metadata: combinedMetadata,
    },
    metadata: combinedMetadata,
    free_text: '',
  } as unknown as ExperienceResponseRecord
}

describe('MICROBLOCO 1B-c — Temporalidade da Vikriti e Integração Conservadora do C3', () => {
  // Teste 1: habitual do C2 sem C3 → NÃO vira Vikriti ativa (confidence "Em observação", sem primaryImbalance, arrays atuais vazios)
  it('1. habitual do C2 sem C3 não vira Vikriti ativa (confidence "Em observação", sem primaryImbalance, arrays atuais vazios)', () => {
    const responses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        structured_value: { value: 'slender' },
      }),
      makeRecord({
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        structured_value: { value: 'dry' },
      }),
      // C2 completo com múltiplos sinais de instabilidade habitual (fome irregular, insônia, etc.)
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        structured_value: { value: 'irregular' },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.id,
        prompt_key: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key,
        structured_value: { value: 'constipated' },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
        structured_value: { value: 'light_interrupted' },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    // Regra 1: Sinais de C2 são padrão habitual, não Vikriti aguda/ativa
    expect(result.vikritiHypothesis.confidence).toBe('Em observação')
    expect(result.vikritiHypothesis.primaryImbalance).toBeUndefined()
    expect(result.vikritiHypothesis.evidencesVata).toHaveLength(0)
    expect(result.vikritiHypothesis.evidencesPitta).toHaveLength(0)
    expect(result.vikritiHypothesis.evidencesKapha).toHaveLength(0)
    expect(result.vikritiHypothesis.summary).toContain('faltam dados atuais')
    expect(result.vikritiHypothesis.summary).not.toContain('oscilação funcional ativa')
  })

  // Teste 2: P12 mainly_present → não comprova mudança/desequilíbrio, pede melhor referência
  it('2. P12 mainly_present não comprova mudança ou desequilíbrio, pede melhor referência histórica formulada como convite', () => {
    const responses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        structured_value: { value: 'irregular' },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.id,
        prompt_key: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
        structured_value: { value: 'mainly_present' },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    // P12 mainly_present deve alimentar attentionPoints e sessionQuestions como convite/pergunta
    const hasP12Attention = result.attentionPoints.some(
      (p) => p.includes('falta melhor referência histórica') || p.includes('momento atual'),
    )
    expect(hasP12Attention).toBe(true)

    const hasP12Question = result.sessionQuestions.some((q) =>
      q.includes('Como seu corpo e seus ritmos costumavam funcionar'),
    )
    expect(hasP12Question).toBe(true)
  })

  // Teste 3: C3 em rascunho → tratado como ausente/incompleto
  it('3. C3 em rascunho (sem completion canônica) é tratado como ausente/incompleto ("faltam dados atuais")', () => {
    const responses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        structured_value: { value: 'regular_hours' },
      }),
      // C3 preenchido parcialmente mas SEM ayv_c3_chapter_completion com completed: true
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.DOMAINS.id,
        prompt_key: AYV_C3_PROMPTS.DOMAINS.key,
        structured_value: { value: ['hunger_digestion'] },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.DIRECTIONS.id,
        prompt_key: AYV_C3_PROMPTS.DIRECTIONS.key,
        structured_value: { hunger_digestion: 'increased' },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    expect(result.vikritiHypothesis.confidence).toBe('Em observação')
    expect(result.vikritiHypothesis.primaryImbalance).toBeUndefined()
    expect(result.vikritiHypothesis.summary).toContain('faltam dados atuais')
    // Atenções não devem incluir integração de C3 rascunho
    const hasC3Attention = result.attentionPoints.some((p) =>
      p.includes('Áreas com alterações relatadas no momento atual'),
    )
    expect(hasC3Attention).toBe(false)
  })

  // Teste 4: C3 concluído com mudanças genéricas (worsened/more) → ponto de conversa, sem dosha deduzido
  it('4. C3 concluído com mudanças relatadas gera ponto de conversa e resumo de necessidade de detalhamento, sem deduzir dosha', () => {
    const responses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        structured_value: { value: 'regular_hours' },
      }),
      // C3 concluído
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.DOMAINS.id,
        prompt_key: AYV_C3_PROMPTS.DOMAINS.key,
        structured_value: { value: ['sleep', 'energy_pace'] },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.DIRECTIONS.id,
        prompt_key: AYV_C3_PROMPTS.DIRECTIONS.key,
        structured_value: { sleep: 'decreased', energy_pace: 'irregular' },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.STARTED_AT.id,
        prompt_key: AYV_C3_PROMPTS.STARTED_AT.key,
        structured_value: { value: 'last_month' },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.CONTEXTS.id,
        prompt_key: AYV_C3_PROMPTS.CONTEXTS.key,
        structured_value: { value: ['stress', 'routine'] },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.COMPLETION.id,
        prompt_key: AYV_C3_PROMPTS.COMPLETION.key,
        structured_value: { completed: true },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    // Resumo de Vikriti deve sinalizar necessidade de detalhamento
    expect(result.vikritiHypothesis.summary).toContain(
      'mudanças relatadas precisam de detalhamento',
    )
    // Não deduz dosha (primaryImbalance indefinido, arrays vazios)
    expect(result.vikritiHypothesis.primaryImbalance).toBeUndefined()
    expect(result.vikritiHypothesis.evidencesVata).toHaveLength(0)
    expect(result.vikritiHypothesis.evidencesPitta).toHaveLength(0)
    expect(result.vikritiHypothesis.evidencesKapha).toHaveLength(0)

    // Domínios, direções e contextos entram como pontos de conversa
    const domainAttention = result.attentionPoints.find((p) =>
      p.includes('Áreas com alterações relatadas'),
    )
    expect(domainAttention).toBeDefined()
    expect(domainAttention).toContain('sem inferência dosha automática')

    const dirAttention = result.attentionPoints.find((p) =>
      p.includes('Direções percebidas nas mudanças'),
    )
    expect(dirAttention).toBeDefined()
    expect(dirAttention).toContain('ponto de conversa')

    const ctxAttention = result.attentionPoints.find((p) =>
      p.includes('Contextos de vida associados'),
    )
    expect(ctxAttention).toBeDefined()
  })

  // Teste 5: C3 concluído com no_current_changes → ausência RELATADA de mudanças, sem afirmar ausência de doença
  it('5. C3 concluído com no_current_changes expressa ausência relatada de mudanças sem afirmar ausência clínica de doença', () => {
    const responses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        structured_value: { value: 'regular_hours' },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.DOMAINS.id,
        prompt_key: AYV_C3_PROMPTS.DOMAINS.key,
        structured_value: { value: ['no_current_changes'] },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.COMPLETION.id,
        prompt_key: AYV_C3_PROMPTS.COMPLETION.key,
        structured_value: { completed: true },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    expect(result.vikritiHypothesis.summary).toContain('ausência relatada de alterações')
    expect(result.vikritiHypothesis.summary).toContain('sem afirmar ausência de doença')
    expect(result.vikritiHypothesis.primaryImbalance).toBeUndefined()
  })

  // Teste 6: C3 com dont_know/refusal → momento atual não caracterizado, sem equivaler a equilíbrio
  it('6. C3 com dont_know ou refusal expressa momento atual não caracterizado sem equivaler a equilíbrio', () => {
    const responses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.DOMAINS.id,
        prompt_key: AYV_C3_PROMPTS.DOMAINS.key,
        structured_value: { value: ['dont_know'] },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.COMPLETION.id,
        prompt_key: AYV_C3_PROMPTS.COMPLETION.key,
        structured_value: { completed: true },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    expect(result.vikritiHypothesis.summary).toContain('Momento atual não caracterizado')
    expect(result.vikritiHypothesis.summary).toContain('não equivale a equilíbrio')
    expect(result.vikritiHypothesis.primaryImbalance).toBeUndefined()
  })

  // Teste 7: medicação no C3 → aparece como contexto/ponto de atenção, sem causa inferida
  it('7. medicação no C3 aparece estritamente como contexto/ponto de atenção sem causa inferida', () => {
    const responses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.DOMAINS.id,
        prompt_key: AYV_C3_PROMPTS.DOMAINS.key,
        structured_value: { value: ['skin_hair'] },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.DIRECTIONS.id,
        prompt_key: AYV_C3_PROMPTS.DIRECTIONS.key,
        structured_value: { skin_hair: 'increased' },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.STARTED_AT.id,
        prompt_key: AYV_C3_PROMPTS.STARTED_AT.key,
        structured_value: { value: 'last_month' },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.CONTEXTS.id,
        prompt_key: AYV_C3_PROMPTS.CONTEXTS.key,
        structured_value: { value: ['medication'] },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.MEDICATION_STATUS.id,
        prompt_key: AYV_C3_PROMPTS.MEDICATION_STATUS.key,
        structured_value: { value: 'current_use' },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.MEDICATION_DETAILS.id,
        prompt_key: AYV_C3_PROMPTS.MEDICATION_DETAILS.key,
        structured_value: {
          value: [
            {
              id: 'med-1',
              kind: 'medication',
              name: 'Levotiroxina',
              dose: '50mcg',
            },
          ],
        },
      }),
      makeRecord({
        prompt_id: AYV_C3_PROMPTS.COMPLETION.id,
        prompt_key: AYV_C3_PROMPTS.COMPLETION.key,
        structured_value: { completed: true },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    const medAttention = result.attentionPoints.find((p) =>
      p.includes('medicamentos ou suplementos'),
    )
    expect(medAttention).toBeDefined()
    expect(medAttention).toContain('sem inferência de nexo causal')
    expect(medAttention).not.toContain('causou')

    const medNameAttention = result.attentionPoints.find((p) => p.includes('Levotiroxina'))
    expect(medNameAttention).toBeDefined()

    const medQuestion = result.sessionQuestions.find((q) => q.includes('medicamentos'))
    expect(medQuestion).toBeDefined()
  })

  // Teste 8: Agni/Ama com dados suficientes → linguagem de padrão habitual/conceito tradicional;
  // sem dados → "dados insuficientes", nunca "nenhum acúmulo identificado".
  it('8. Agni e Ama usam linguagem de padrão habitual e conceito tradicional; sem dados usa "dados insuficientes" e nunca "nenhum acúmulo"', () => {
    // Caso A: C1 concluído, C2 ausente (sem dados de Agni/Ama)
    const emptyC2Responses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        structured_value: { value: 'slender' },
      }),
      makeRecord({
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        structured_value: { value: 'dry' },
      }),
    ]

    const resultEmpty = buildAyurvedaInterpretation(emptyC2Responses)
    expect(resultEmpty.agniReading.description).toContain('Dados insuficientes')
    expect(resultEmpty.amaReading.rationale).toContain('Dados insuficientes')
    expect(resultEmpty.amaReading.rationale).not.toContain(
      'Nenhum acúmulo ou sobrecarga metabólica identificada',
    )
    expect(resultEmpty.amaReading.rationale).not.toContain('Nenhum sinal clínico de acúmulo')

    // Caso B: C2 com dados suficientes para Vishama Agni e Ama sinalizado
    const richResponses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        structured_value: { value: 'irregular' },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        structured_value: { value: 'bloating_gas' },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P7_STOOL_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P7_STOOL_PATTERN.key,
        structured_value: { value: 'sticky_incomplete' },
      }),
    ]

    const resultRich = buildAyurvedaInterpretation(richResponses)
    // Agni: linguagem de padrão habitual e conceito tradicional
    expect(resultRich.agniReading.type).toBe('Vishama Agni')
    expect(resultRich.agniReading.description).toContain('Padrão habitual')
    expect(resultRich.agniReading.description).toContain('conceito tradicional')
    expect(resultRich.agniReading.description).not.toContain('metabolismo medido')

    // Ama: conceito tradicional de resíduos digestivos, sem a palavra "toxinas"
    expect(resultRich.amaReading.presence).toBe('Sinalizada')
    expect(resultRich.amaReading.rationale).toContain('conceito tradicional de Ama')
    expect(resultRich.amaReading.rationale).not.toContain('toxinas')

    // Caso C: C2 com dados preenchidos mas sem sinais de sobrecarga -> "não evidenciada com os dados disponíveis"
    const clearResponses: ExperienceResponseRecord[] = [
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        structured_value: { completed: true },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        structured_value: { value: 'regular_hours' },
      }),
      makeRecord({
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        structured_value: { value: 'light_comfortable' },
      }),
    ]

    const resultClear = buildAyurvedaInterpretation(clearResponses)
    expect(resultClear.amaReading.presence).toBe('Não evidenciada')
    expect(resultClear.amaReading.rationale).toContain('não evidenciada com os dados disponíveis')
    expect(resultClear.amaReading.rationale).toContain('o que não prova ausência clínica')
    expect(resultClear.amaReading.rationale).not.toContain('Nenhum sinal clínico de acúmulo')
  })
})
