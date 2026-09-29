// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  buildAyurvedaInterpretation,
  AYURVEDA_NON_DIAGNOSTIC_DISCLAIMER,
} from '@/services/ayurvedaInterpretationEngine'
import {
  buildMindEmotionsInterpretation,
  buildRegulacaoInterpretation,
  buildRelacoesInterpretation,
  buildSexualidadeInterpretation,
  buildSentidoInterpretation,
} from '@/services/universalDimensionInterpretationEngine'
import type { ExperienceResponseRecord } from '@/types/cer'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'
import { AYV_C2_PROMPTS } from '@/services/ayurvedaChapter2'

describe('Motor Interpretativo de Ayurveda (Corpo & Fisiologia)', () => {
  const createResp = (
    promptId: string,
    value: any,
    extra: Partial<ExperienceResponseRecord> = {},
  ): ExperienceResponseRecord => ({
    id: `resp-${promptId}`,
    enrollment_id: 'enr-test-01',
    experience_id: 'exp-corpo-fisiologia-07b',
    prompt_id: promptId,
    respondent_user_id: 'usr-test-01',
    response_type: 'ChoiceCards',
    access_class: 'participant_shared',
    version: 1,
    prompt_version: 1,
    status: 'saved',
    created: '2025-05-01T10:00:00.000Z',
    updated: '2025-05-01T10:00:00.000Z',
    structured_value: { value, prompt_key: promptId, revision_number: 1 },
    ...extra,
  })

  it('1. nenhuma interpretação quando não há revisão concluída', () => {
    const uncompletedResponses = [
      createResp(AYV_C1_PROMPTS.P1_STRUCTURE.id, 'slender'),
      createResp(AYV_C1_PROMPTS.P2_SKIN.id, 'dry'),
    ]

    const result = buildAyurvedaInterpretation(uncompletedResponses)
    expect(result.hasCompletedRevision).toBe(false)
    expect(result.prakritiHypothesis.confidence).toBe('Em observação')
    expect(result.prakritiHypothesis.primaryTendency).toBeUndefined()
    expect(result.prakritiHypothesis.evidencesVata).toHaveLength(0)
    expect(result.amaReading.presence).toBe('Não evidenciada')
  })

  it('2. resposta isolada NÃO gera hipótese (exigência estrita de convergência entre perguntas)', () => {
    // Capítulo 1 concluído, mas apenas UMA resposta marcando Vata (estrutura)
    const responses = [
      createResp(AYV_C1_PROMPTS.CHAPTER_COMPLETION.id, { completed: true }),
      createResp(AYV_C1_PROMPTS.P1_STRUCTURE.id, 'slender'), // Vata isolado
    ]

    const result = buildAyurvedaInterpretation(responses)
    expect(result.hasCompletedRevision).toBe(true)
    // Uma única evidência não gera primaryTendency nem confiança alta
    expect(result.prakritiHypothesis.evidencesVata).toHaveLength(1)
    expect(result.prakritiHypothesis.primaryTendency).toBeUndefined()
    expect(result.prakritiHypothesis.confidence).toBe('Em observação')
    expect(result.prakritiHypothesis.summary).toContain(
      'não apresentaram convergência em pelo menos 2 categorias distintas',
    )
  })

  it('3. convergência de ≥2 categorias distintas sustenta hipótese de tendência de Prakriti', () => {
    const responses = [
      createResp(AYV_C1_PROMPTS.CHAPTER_COMPLETION.id, { completed: true }),
      createResp(AYV_C1_PROMPTS.P1_STRUCTURE.id, 'slender'), // Vata: Estrutura corporal
      createResp(AYV_C1_PROMPTS.P2_SKIN.id, 'dry_rough'), // Vata: Pele habitual
      createResp(AYV_C1_PROMPTS.P4_TEMPERATURE.id, 'cold_easily'), // Vata: Regulação térmica
    ]

    const result = buildAyurvedaInterpretation(responses)
    expect(result.prakritiHypothesis.primaryTendency).toBe('Vata')
    expect(result.prakritiHypothesis.evidencesVata).toHaveLength(3)
    expect(result.prakritiHypothesis.confidence).toBe('Moderada')
    expect(result.prakritiHypothesis.summary).toContain('Hipótese de tendência primária Vata')
  })

  it('4. regra estrita de Ama: evidência em 1 categoria NÃO gera Ama sinalizado; exige ≥2 categorias', () => {
    // Caso 1: Apenas digestão pesada (1 categoria)
    const singleAmaResponses = [
      createResp(AYV_C2_PROMPTS.CHAPTER_COMPLETION.id, { completed: true }),
      createResp(AYV_C2_PROMPTS.P3_POST_MEAL.id, 'heavy_slow_digestion'),
    ]

    const resSingle = buildAyurvedaInterpretation(singleAmaResponses)
    expect(resSingle.amaReading.presence).toBe('Possível / Limítrofe')
    expect(resSingle.amaReading.categoriesInvolved).toHaveLength(1)
    expect(resSingle.amaReading.rationale).toContain(
      'um achado isolado não sustenta sinalização de Ama',
    )

    // Caso 2: Digestão pesada + Fezes com aderência/muco + Despertar pesado (3 categorias)
    const multiAmaResponses = [
      createResp(AYV_C2_PROMPTS.CHAPTER_COMPLETION.id, { completed: true }),
      createResp(AYV_C2_PROMPTS.P3_POST_MEAL.id, 'heavy_slow_digestion'), // Categoria: Digestão
      createResp(AYV_C2_PROMPTS.P7_STOOL_PATTERN.id, 'sticky_incomplete'), // Categoria: Eliminação
      createResp(AYV_C2_PROMPTS.P9_WAKING.id, 'heavy_body_slow_start'), // Categoria: Disposição matinal
    ]

    const resMulti = buildAyurvedaInterpretation(multiAmaResponses)
    expect(resMulti.amaReading.presence).toBe('Sinalizada')
    expect(resMulti.amaReading.categoriesInvolved.length).toBeGreaterThanOrEqual(2)
    expect(resMulti.amaReading.rationale).toContain(
      'Sinais convergentes de sobrecarga e acúmulo identificados',
    )
  })

  it('5. ausência, dúvida ou recusa não são tratadas como resposta negativa', () => {
    const responses = [
      createResp(AYV_C1_PROMPTS.CHAPTER_COMPLETION.id, { completed: true }),
      createResp(AYV_C1_PROMPTS.P1_STRUCTURE.id, 'dont_know', {
        structured_value: { value: 'dont_know', metadata: { explicit_unsure: true } },
      }),
      createResp(AYV_C1_PROMPTS.P2_SKIN.id, 'prefiro_nao_responder', {
        structured_value: { value: 'prefiro_nao_responder', metadata: { explicit_refusal: true } },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)
    expect(result.prakritiHypothesis.evidencesVata).toHaveLength(0)
    expect(result.prakritiHypothesis.evidencesPitta).toHaveLength(0)
    expect(result.prakritiHypothesis.evidencesKapha).toHaveLength(0)
    expect(result.prakritiHypothesis.confidence).toBe('Em observação')
  })

  it('6. inclui aviso explícito de que não é diagnóstico clínico', () => {
    const responses = [createResp(AYV_C1_PROMPTS.CHAPTER_COMPLETION.id, { completed: true })]
    const result = buildAyurvedaInterpretation(responses)
    expect(result.disclaimer).toBe(AYURVEDA_NON_DIAGNOSTIC_DISCLAIMER)
    expect(result.disclaimer).toContain('Não representa diagnóstico nosológico')
  })
})

describe('Motores Interpretativos das Dimensões Universais', () => {
  it('7. Mente & Emoções gera resumo essencial + exatamente 4 lentes interpretativas com seções obrigatórias', () => {
    const responses: ExperienceResponseRecord[] = [
      {
        id: 'me-1',
        enrollment_id: 'enr-1',
        experience_id: 'exp-mente-emocoes-07c',
        prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
        respondent_user_id: 'u1',
        response_type: 'ChoiceCards',
        access_class: 'participant_shared',
        version: 1,
        prompt_version: 1,
        status: 'saved',
        created: '2025-05-01',
        updated: '2025-05-01',
        structured_value: { title: 'Emoções sentidas de forma intensa e clara' },
      },
      {
        id: 'me-4',
        enrollment_id: 'enr-1',
        experience_id: 'exp-mente-emocoes-07c',
        prompt_id: 'p-07c-pm2-p4-pensamentos-associados',
        respondent_user_id: 'u1',
        response_type: 'FreeReflection',
        access_class: 'participant_shared',
        version: 1,
        prompt_version: 1,
        status: 'saved',
        created: '2025-05-01',
        updated: '2025-05-01',
        free_text: 'Costumo antecipar problemas para tentar me prevenir.',
      },
    ]

    const result = buildMindEmotionsInterpretation(responses, 'Mariana')
    expect(result.hasResponses).toBe(true)
    expect(result.essentialSummary.length).toBeGreaterThan(30)
    expect(result.fourLenses).toHaveLength(4)

    for (const lens of result.fourLenses) {
      expect(lens.title).toBeDefined()
      expect(lens.synthesis).toBeDefined()
      expect(Array.isArray(lens.evidences)).toBe(true)
      expect(Array.isArray(lens.resources)).toBe(true)
      expect(Array.isArray(lens.attentionPoints)).toBe(true)
      expect(Array.isArray(lens.sessionQuestions)).toBe(true)
      expect(lens.sessionQuestions.length).toBeGreaterThan(0)
    }
  })

  it('8. Regulação, Relações, Sexualidade e Sentido geram relatórios com sínteses simples e profundas, recursos, pontos de atenção e perguntas', () => {
    const mockResp: ExperienceResponseRecord = {
      id: 'mock-1',
      enrollment_id: 'enr-1',
      experience_id: 'exp-dim',
      prompt_id: 'p-test',
      respondent_user_id: 'u1',
      response_type: 'ChoiceCards',
      access_class: 'participant_shared',
      version: 1,
      prompt_version: 1,
      status: 'saved',
      created: '2025-05-01',
      updated: '2025-05-01',
      structured_value: { title: 'Resposta teste' },
    }

    const reg = buildRegulacaoInterpretation([mockResp], 'Mariana')
    const rel = buildRelacoesInterpretation([mockResp], 'Mariana')
    const sex = buildSexualidadeInterpretation([mockResp], 'Mariana')
    const sen = buildSentidoInterpretation([mockResp], 'Mariana')

    for (const dim of [reg, rel, sex, sen]) {
      expect(dim.hasResponses).toBe(true)
      expect(dim.simpleSynthesis).toBeDefined()
      expect(dim.deepSynthesis).toBeDefined()
      expect(Array.isArray(dim.observedEvidences)).toBe(true)
      expect(Array.isArray(dim.perceivedResources)).toBe(true)
      expect(Array.isArray(dim.attentionPoints)).toBe(true)
      expect(Array.isArray(dim.sessionQuestions)).toBe(true)
    }
  })
})
