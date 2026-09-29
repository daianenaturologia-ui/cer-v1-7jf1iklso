/**
 * Fixture de Demonstração e QA das Seis Dimensões da Consciência (Método CER).
 *
 * Características clínicas e técnicas:
 * 1. Isolada e fictícia, sem PocketBase (Zero chamadas remotas).
 * 2. Cobre integralmente as SEIS dimensões da Consciência:
 *    - Corpo & Fisiologia (Capítulo 1 e Capítulo 2 concluídos com revisão 1 canônica,
 *      convergência Vata em 3 categorias, Agni Vishama, e Ama sinalizado com evidências em 3 categorias,
 *      além de um rascunho de correção na revisão 2 para exercitar a visualização de rascunho).
 *    - Mente & Emoções (13 respostas canônicas cobrindo as 4 lentes e resumo essencial,
 *      sem JSON bruto, com convergência de padrões protetivos de alta interferência).
 *    - Regulação & Padrões de Resposta (respostas estruturadas cobrindo contexto, sinais precoces,
 *      timing, resposta, função, custo e recurso de retorno).
 *    - Relações & Vínculos (respostas cobrindo órbita relacional, conforto com proximidade, pertencimento,
 *      confiança/vulnerabilidade, limites, pedir apoio, receber cuidado, conflito e reparação).
 *    - Sexualidade & Intimidade (respostas cobrindo corpo erótico, vitalidade, permissão, segurança,
 *      comunicação, distratores e integração).
 *    - Sentido & Conexão (respostas cobrindo bússola interna, valores fundamentais, transcendência,
 *      práticas de nutrição, travessia de crise e legado).
 * 3. Respeita a estrutura canônica de revisões (revision_number, autoria, datas, conclusão canônica).
 * 4. Contém metadados de alta e baixa confiança histórica e registros de dúvida explícita ("Não sei")
 *    e recusa respeitada ("Prefiro não responder") em pontos adequados para validação completa.
 */

import type { ExperienceResponseRecord, ExperienceResponseVersionRecord } from '@/types/cer'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'
import { AYV_C2_PROMPTS } from '@/services/ayurvedaChapter2'

export const QA_FIXTURE_ENROLLMENT_ID = 'demo-enr-01'
export const QA_FIXTURE_USER_ID = 'demo-user-mariana'

export interface ConscienciaQaFixtureData {
  responses: ExperienceResponseRecord[]
  responseVersions: ExperienceResponseVersionRecord[]
}

export function buildConscienciaQaFixture(
  enrollmentId: string = QA_FIXTURE_ENROLLMENT_ID,
  userId: string = QA_FIXTURE_USER_ID,
): ConscienciaQaFixtureData {
  const responses: ExperienceResponseRecord[] = []
  const responseVersions: ExperienceResponseVersionRecord[] = []

  const dateC1 = '2025-05-10T10:00:00.000Z'
  const dateC2 = '2025-05-11T10:00:00.000Z'
  const dateMente = '2025-05-12T14:00:00.000Z'
  const dateReg = '2025-05-13T15:00:00.000Z'
  const dateRel = '2025-05-14T16:00:00.000Z'
  const dateSex = '2025-05-15T17:00:00.000Z'
  const dateSen = '2025-05-16T18:00:00.000Z'

  // Helper para criar ExperienceResponseRecord coerente
  const createResp = (
    params: Partial<ExperienceResponseRecord> & {
      id: string
      experienceId: string
      promptId: string
      promptKey?: string
      responseType?: any
      structuredValue?: any
      freeText?: string
      created?: string
      version?: number
    },
  ): ExperienceResponseRecord => {
    const sVal = params.structuredValue
    const promptKey =
      params.promptKey ||
      (sVal && typeof sVal === 'object'
        ? sVal.prompt_key || sVal.metadata?.prompt_key
        : undefined) ||
      params.promptId

    const resp: ExperienceResponseRecord = {
      id: params.id,
      enrollment_id: enrollmentId,
      experience_id: params.experienceId,
      prompt_id: params.promptId,
      respondent_user_id: userId,
      response_type: params.responseType || 'ChoiceCards',
      access_class: params.access_class || 'shared_care',
      version: params.version || 1,
      prompt_version: params.prompt_version || 1,
      status: params.status || 'saved',
      created: params.created || dateC1,
      updated: params.updated || params.created || dateC1,
      structured_value: sVal,
      free_text: params.freeText || '',
    }
    if (promptKey) (resp as any).prompt_key = promptKey
    ;(resp as any).canonical_prompt_id = params.promptId
    return resp
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. CORPO & FISIOLOGIA (AYURVEDA CER) — CAPÍTULOS 1 E 2 CONCLUÍDOS + RASCUNHO
  // ═════════════════════════════════════════════════════════════════════════════

  // CAPÍTULO 1 (Revisão 1 canônica concluída — Evidências fortes de Vata estrutural)
  // P1 Structure: light_narrow (Vata: Estrutura corporal)
  responses.push(
    createResp({
      id: 'qa-c1-p1',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      responseType: 'ChoiceCards',
      created: dateC1,
      structuredValue: {
        value: 'light_narrow',
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        metadata: {
          prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
          historical_confidence: 'high',
          stability: 'lifelong',
          revision_number: 1,
          chapter_id: 'capitulo-1-estrutura-caracteristicas',
        },
      },
    }),
  )

  // P1 Duration: lifelong
  responses.push(
    createResp({
      id: 'qa-c1-p1b',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P1_DURATION.id,
      promptKey: AYV_C1_PROMPTS.P1_DURATION.key,
      responseType: 'ChoiceCards',
      created: dateC1,
      structuredValue: {
        value: 'lifelong',
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        revision_number: 1,
        metadata: { revision_number: 1 },
      },
    }),
  )

  // P2 Skin: dry_rough (Vata: Pele habitual)
  responses.push(
    createResp({
      id: 'qa-c1-p2',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P2_SKIN.id,
      promptKey: AYV_C1_PROMPTS.P2_SKIN.key,
      responseType: 'MultiSelectCards',
      created: dateC1,
      structuredValue: {
        selectedOptionIds: ['dry_rough'],
        value: 'dry_rough',
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        metadata: {
          prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
          revision_number: 1,
          chapter_id: 'capitulo-1-estrutura-caracteristicas',
        },
      },
    }),
  )

  // P3 Hair: fine_delicate (Vata: Cabelo habitual)
  responses.push(
    createResp({
      id: 'qa-c1-p3',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P3_HAIR.id,
      promptKey: AYV_C1_PROMPTS.P3_HAIR.key,
      responseType: 'MultiSelectCards',
      created: dateC1,
      structuredValue: {
        selectedOptionIds: ['fine_delicate'],
        value: 'fine_delicate',
        prompt_key: AYV_C1_PROMPTS.P3_HAIR.key,
        revision_number: 1,
        metadata: { revision_number: 1 },
      },
    }),
  )

  // P4 Temperature: cold_easily (Vata: Regulação térmica)
  responses.push(
    createResp({
      id: 'qa-c1-p4',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
      promptKey: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
      responseType: 'ChoiceCards',
      created: dateC1,
      structuredValue: {
        value: 'cold_easily',
        prompt_key: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
        revision_number: 1,
        metadata: { revision_number: 1 },
      },
    }),
  )

  // P5 Habits (Thirst, Drink Temp, Sweat)
  responses.push(
    createResp({
      id: 'qa-c1-p5a',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P5_THIRST.id,
      promptKey: AYV_C1_PROMPTS.P5_THIRST.key,
      created: dateC1,
      structuredValue: {
        value: 'varies_late',
        prompt_key: AYV_C1_PROMPTS.P5_THIRST.key,
        revision_number: 1,
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-c1-p5b',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P5_DRINK_TEMP.id,
      promptKey: AYV_C1_PROMPTS.P5_DRINK_TEMP.key,
      created: dateC1,
      structuredValue: {
        value: 'warm_hot',
        prompt_key: AYV_C1_PROMPTS.P5_DRINK_TEMP.key,
        revision_number: 1,
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-c1-p5c',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P5_SWEAT.id,
      promptKey: AYV_C1_PROMPTS.P5_SWEAT.key,
      created: dateC1,
      structuredValue: {
        value: 'sweats_little',
        prompt_key: AYV_C1_PROMPTS.P5_SWEAT.key,
        revision_number: 1,
      },
    }),
  )

  // Capítulo 1 Conclusão Canônica (Revisão 1)
  responses.push(
    createResp({
      id: 'qa-c1-comp',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      created: dateC1,
      structuredValue: {
        completed: true,
        completed_at: dateC1,
        status: 'completed',
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        metadata: {
          revision_number: 1,
          chapter_id: 'capitulo-1-estrutura-caracteristicas',
        },
      },
    }),
  )

  // CAPÍTULO 2 (Revisão 1 canônica concluída — Evidências de Vishama Agni e Ama em 3 categorias)
  // P1 Hunger: irregular (Vata / Vishama Agni)
  responses.push(
    createResp({
      id: 'qa-c2-p1',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
      promptKey: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
      responseType: 'MultiSelectCards',
      created: dateC2,
      structuredValue: {
        selectedOptionIds: ['irregular'],
        value: 'irregular',
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        metadata: { revision_number: 1 },
      },
    }),
  )

  // P2 Delayed Meal: irritability
  responses.push(
    createResp({
      id: 'qa-c2-p2',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P2_DELAYED_MEAL.id,
      promptKey: AYV_C2_PROMPTS.P2_DELAYED_MEAL.key,
      responseType: 'MultiSelectCards',
      created: dateC2,
      structuredValue: {
        selectedOptionIds: ['can_wait'],
        value: 'can_wait',
        prompt_key: AYV_C2_PROMPTS.P2_DELAYED_MEAL.key,
        revision_number: 1,
      },
    }),
  )

  // P3 Post Meal: bloating_gas + heavy_slow_digestion (Ama Categoria 1: Digestão e sensação pós-refeição)
  responses.push(
    createResp({
      id: 'qa-c2-p3',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P3_POST_MEAL.id,
      promptKey: AYV_C2_PROMPTS.P3_POST_MEAL.key,
      responseType: 'MultiSelectCards',
      created: dateC2,
      structuredValue: {
        selectedOptionIds: ['bloating_gas', 'heavy_slow_digestion'],
        value: 'heavy_slow_digestion',
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
        metadata: { revision_number: 1 },
      },
    }),
  )

  // P4 Hunger Return: variable
  responses.push(
    createResp({
      id: 'qa-c2-p4',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P4_HUNGER_RETURN.id,
      promptKey: AYV_C2_PROMPTS.P4_HUNGER_RETURN.key,
      created: dateC2,
      structuredValue: {
        value: 'variable',
        prompt_key: AYV_C2_PROMPTS.P4_HUNGER_RETURN.key,
        revision_number: 1,
      },
    }),
  )

  // P5 Food Demands: fatty_heavy
  responses.push(
    createResp({
      id: 'qa-c2-p5',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P5_FOOD_DEMANDS.id,
      promptKey: AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key,
      responseType: 'MultiSelectCards',
      created: dateC2,
      structuredValue: {
        selectedOptionIds: ['fatty_heavy'],
        value: 'fatty_heavy',
        prompt_key: AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key,
        revision_number: 1,
      },
    }),
  )

  // P6 Bowel: irregular (Vata)
  responses.push(
    createResp({
      id: 'qa-c2-p6',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.id,
      promptKey: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key,
      created: dateC2,
      structuredValue: {
        value: 'irregular',
        prompt_key: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key,
        revision_number: 1,
      },
    }),
  )

  // P7 Stool Pattern: sticky_incomplete (Ama Categoria 2: Eliminação intestinal)
  responses.push(
    createResp({
      id: 'qa-c2-p7',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P7_STOOL_PATTERN.id,
      promptKey: AYV_C2_PROMPTS.P7_STOOL_PATTERN.key,
      responseType: 'MultiSelectCards',
      created: dateC2,
      structuredValue: {
        selectedOptionIds: ['sticky_incomplete'],
        value: 'sticky_incomplete',
        prompt_key: AYV_C2_PROMPTS.P7_STOOL_PATTERN.key,
        revision_number: 1,
      },
    }),
  )

  // P8 Sleep: light_interrupted (Vata)
  responses.push(
    createResp({
      id: 'qa-c2-p8',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id,
      promptKey: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
      responseType: 'MultiSelectCards',
      created: dateC2,
      structuredValue: {
        selectedOptionIds: ['light_interrupted'],
        value: 'light_interrupted',
        prompt_key: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
        revision_number: 1,
      },
    }),
  )

  // P9 Waking: heavy_body_slow_start (Ama Categoria 3: Disposição matinal e energia)
  responses.push(
    createResp({
      id: 'qa-c2-p9',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P9_WAKING.id,
      promptKey: AYV_C2_PROMPTS.P9_WAKING.key,
      created: dateC2,
      structuredValue: {
        value: 'heavy_body_slow_start',
        prompt_key: AYV_C2_PROMPTS.P9_WAKING.key,
        revision_number: 1,
      },
    }),
  )

  // P10 Energy Distribution: varies_drastically (Vata)
  responses.push(
    createResp({
      id: 'qa-c2-p10',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.id,
      promptKey: AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key,
      created: dateC2,
      structuredValue: {
        value: 'varies_drastically',
        prompt_key: AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key,
        revision_number: 1,
      },
    }),
  )

  // P11 Body Pace: fluctuates
  responses.push(
    createResp({
      id: 'qa-c2-p11',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P11_BODY_PACE.id,
      promptKey: AYV_C2_PROMPTS.P11_BODY_PACE.key,
      created: dateC2,
      structuredValue: {
        value: 'fluctuates',
        prompt_key: AYV_C2_PROMPTS.P11_BODY_PACE.key,
        revision_number: 1,
      },
    }),
  )

  // P12 Historical Confidence: many_years
  responses.push(
    createResp({
      id: 'qa-c2-p12',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.id,
      promptKey: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
      created: dateC2,
      structuredValue: {
        value: 'many_years',
        prompt_key: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
        revision_number: 1,
        metadata: {
          prompt_key: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
          historical_confidence: 'high',
          revision_number: 1,
        },
      },
    }),
  )

  // Capítulo 2 Conclusão Canônica (Revisão 1)
  responses.push(
    createResp({
      id: 'qa-c2-comp',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
      created: dateC2,
      structuredValue: {
        completed: true,
        completed_at: dateC2,
        status: 'completed',
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        metadata: {
          revision_number: 1,
          chapter_id: 'capitulo-2-ritmo-corpo',
        },
      },
    }),
  )

  // RASCUNHO DA CORREÇÃO (Revisão 2 não concluída) para exercitar aviso de correção em andamento
  responses.push(
    createResp({
      id: 'qa-c1-p1-rev2-draft',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`,
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      responseType: 'ChoiceCards',
      version: 2,
      created: '2025-05-18T10:00:00.000Z',
      structuredValue: {
        value: 'slender',
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 2,
        metadata: {
          revision_number: 2,
          is_draft: true,
          chapter_id: 'capitulo-1-estrutura-caracteristicas',
        },
      },
    }),
  )

  // Snapshot em versões para integridade de histórico
  responseVersions.push({
    id: 'qa-version-c1-p1-v1',
    response_id: 'qa-c1-p1',
    enrollment_id: enrollmentId,
    experience_id: 'exp-corpo-fisiologia-07b',
    prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
    respondent_user_id: userId,
    response_type: 'ChoiceCards',
    access_class: 'shared_care',
    structured_value: {
      value: 'light_narrow',
      prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      revision_number: 1,
    },
    version_number: 1,
    prompt_version: 1,
    change_reason: 'Revisão 1 concluída',
    created: dateC1,
    updated: dateC1,
  })

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. MENTE & EMOÇÕES (13 PERGUNTAS CANÔNICAS COMPLETAS)
  // ═════════════════════════════════════════════════════════════════════════════
  const menteExpId = 'exp-mente-emocoes-07c'

  // P1: mundo_emocional_geral
  responses.push(
    createResp({
      id: 'qa-me-p1',
      experienceId: menteExpId,
      promptId: 'p-07c-pm1-p1-funcionamento-emocional',
      promptKey: 'mundo_emocional_geral',
      responseType: 'ChoiceCards',
      created: dateMente,
      freeText: 'Sinto as emoções de forma intensa e rápida no corpo.',
      structuredValue: {
        title: 'Sensibilidade vívida e percepção ágil das nuances afetivas',
        prompt_key: 'mundo_emocional_geral',
        metadata: { prompt_key: 'mundo_emocional_geral', step_order: 1 },
      },
    }),
  )

  // P2: emocoes_recorrentes
  responses.push(
    createResp({
      id: 'qa-me-p2',
      experienceId: menteExpId,
      promptId: 'p-07c-pm1-p2-emocoes-presentes',
      promptKey: 'emocoes_recorrentes',
      responseType: 'MultiSelectCards',
      created: dateMente,
      structuredValue: {
        selectedOptionIds: ['ansiedade', 'entusiasmo', 'preocupacao'],
        selected: ['Ansiedade', 'Entusiasmo', 'Preocupação com o futuro'],
        prompt_key: 'emocoes_recorrentes',
        metadata: { prompt_key: 'emocoes_recorrentes', step_order: 2 },
      },
    }),
  )

  // P3: compreensao_despertar_emocoes
  responses.push(
    createResp({
      id: 'qa-me-p3',
      experienceId: menteExpId,
      promptId: 'p-07c-pm1-p3-por-que-se-sente-assim',
      promptKey: 'compreensao_despertar_emocoes',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText:
        'Costumo identificar quando a sobrecarga vem da cobrança no trabalho ou de conversas inacabadas.',
      structuredValue: {
        value: 'Percepção clara dos gatilhos relacionais e exigências',
        prompt_key: 'compreensao_despertar_emocoes',
        metadata: { prompt_key: 'compreensao_despertar_emocoes', step_order: 3 },
      },
    }),
  )

  // P4: pensamento_associado
  responses.push(
    createResp({
      id: 'qa-me-p4',
      experienceId: menteExpId,
      promptId: 'p-07c-pm2-p4-pensamentos-associados',
      promptKey: 'pensamento_associado',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText:
        'Fico calculando os próximos passos para não deixar nada desmoronar nem falhar com ninguém.',
      structuredValue: {
        title: 'Planejamento preventivo e antecipação constante',
        prompt_key: 'pensamento_associado',
        metadata: { prompt_key: 'pensamento_associado', step_order: 4 },
      },
    }),
  )

  // P5: comportamento_associado
  responses.push(
    createResp({
      id: 'qa-me-p5',
      experienceId: menteExpId,
      promptId: 'p-07c-pm2-p5-comportamento-associado',
      promptKey: 'comportamento_associado',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText: 'Assumo a frente para resolver logo e devolver a tranquilidade ao ambiente.',
      structuredValue: {
        value: 'Ação resolutiva imediata',
        prompt_key: 'comportamento_associado',
        metadata: { prompt_key: 'comportamento_associado', step_order: 5 },
      },
    }),
  )

  // P6: self_dialogue_erro
  responses.push(
    createResp({
      id: 'qa-me-p6',
      experienceId: menteExpId,
      promptId: 'p-07c-pm2-p6-dialogo-interno',
      promptKey: 'self_dialogue_erro',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText:
        'Quando cometo um erro, uma voz me cobra severamente que eu deveria ter previsto isso.',
      structuredValue: {
        title: 'Autocrítica exigente e sentimento de responsabilidade desproporcional',
        prompt_key: 'self_dialogue_erro',
        metadata: { prompt_key: 'self_dialogue_erro', step_order: 6 },
      },
    }),
  )

  // P7a: movimentos_automaticos_frequencia_p1
  responses.push(
    createResp({
      id: 'qa-me-p7a',
      experienceId: menteExpId,
      promptId: 'p-07c-pm3-p7a-movimentos-1-5',
      promptKey: 'movimentos_automaticos_frequencia_p1',
      responseType: 'Ordering',
      created: dateMente,
      structuredValue: {
        value: { 'fazer-certo': 'sempre', 'controlar-situacao': 'muitas-vezes' },
        prompt_key: 'movimentos_automaticos_frequencia_p1',
        metadata: { prompt_key: 'movimentos_automaticos_frequencia_p1', step_order: 7 },
      },
    }),
  )

  // P7b: movimentos_automaticos_frequencia_p2
  responses.push(
    createResp({
      id: 'qa-me-p7b',
      experienceId: menteExpId,
      promptId: 'p-07c-pm3-p7b-movimentos-6-10',
      promptKey: 'movimentos_automaticos_frequencia_p2',
      responseType: 'Ordering',
      created: dateMente,
      structuredValue: {
        value: { 'agradar-cuidar': 'as-vezes', 'isolar-se': 'raramente' },
        prompt_key: 'movimentos_automaticos_frequencia_p2',
        metadata: { prompt_key: 'movimentos_automaticos_frequencia_p2', step_order: 8 },
      },
    }),
  )

  // P8: movimentos_interferencia_atual (Proteções prioritárias)
  responses.push(
    createResp({
      id: 'qa-me-p8',
      experienceId: menteExpId,
      promptId: 'p-07c-pm3-p8-interferencia-movimentos',
      promptKey: 'movimentos_interferencia_atual',
      responseType: 'MultiSelectCards',
      created: dateMente,
      structuredValue: {
        selectedOptionIds: ['fazer-certo', 'prevenir-riscos'],
        selected: ['Fazer tudo impecavelmente certo', 'Antecipar e prevenir qualquer risco'],
        prompt_key: 'movimentos_interferencia_atual',
        metadata: { prompt_key: 'movimentos_interferencia_atual', step_order: 9 },
      },
    }),
  )

  // P9: situacoes_ativacao_movimentos
  responses.push(
    createResp({
      id: 'qa-me-p9',
      experienceId: menteExpId,
      promptId: 'p-07c-pm3-p9-situacoes-ativacao',
      promptKey: 'situacoes_ativacao_movimentos',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText:
        'Ambientes de pressão por resultados rápidos e situações onde percebo insegurança nos outros.',
      structuredValue: {
        value: 'Pressão externa e imprevisibilidade coletiva',
        prompt_key: 'situacoes_ativacao_movimentos',
        metadata: { prompt_key: 'situacoes_ativacao_movimentos', step_order: 10 },
      },
    }),
  )

  // P10: dois_retratos_espaco
  responses.push(
    createResp({
      id: 'qa-me-p10',
      experienceId: menteExpId,
      promptId: 'p-07c-pm4-p10-seguranca-bem-estar',
      promptKey: 'dois_retratos_espaco',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText:
        'Sinto meu peito aberto, a respiração fluida e capacidade de escutar sem pressa de responder.',
      structuredValue: {
        title: 'Presença tranquila, relaxamento muscular e acolhimento',
        prompt_key: 'dois_retratos_espaco',
        metadata: { prompt_key: 'dois_retratos_espaco', step_order: 11 },
      },
    }),
  )

  // P11: dois_retratos_sobrecarga
  responses.push(
    createResp({
      id: 'qa-me-p11',
      experienceId: menteExpId,
      promptId: 'p-07c-pm4-p11-sobrecarga',
      promptKey: 'dois_retratos_sobrecarga',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText: 'Tensão na mandíbula, pensamentos acelerados em loop e urgência de controlar tudo.',
      structuredValue: {
        title: 'Hipervigilância, aperto no peito e exaustão física silenciosa',
        prompt_key: 'dois_retratos_sobrecarga',
        metadata: { prompt_key: 'dois_retratos_sobrecarga', step_order: 12 },
      },
    }),
  )

  // P12: recursos_recuperar_espaco
  responses.push(
    createResp({
      id: 'qa-me-p12',
      experienceId: menteExpId,
      promptId: 'p-07c-pm5-p12-recursos-espaco-interno',
      promptKey: 'recursos_recuperar_espaco',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText:
        'Caminhar descalça no jardim, tomar um chá quente em silêncio e respirar com calma.',
      structuredValue: {
        title: 'Pausas em silêncio, contato com a natureza e grounding corporal',
        prompt_key: 'recursos_recuperar_espaco',
        metadata: { prompt_key: 'recursos_recuperar_espaco', step_order: 13 },
      },
    }),
  )

  // P13: campo_final_opcional
  responses.push(
    createResp({
      id: 'qa-me-p13',
      experienceId: menteExpId,
      promptId: 'p-07c-pm5-p13-campo-final-opcional',
      promptKey: 'campo_final_opcional',
      responseType: 'FreeReflection',
      created: dateMente,
      freeText:
        'Percebo que este processo já está me ajudando a enxergar padrões que eu achava que eram apenas "o meu jeito".',
      structuredValue: {
        value: 'Abertura para investigar a autocrítica com compaixão',
        prompt_key: 'campo_final_opcional',
        metadata: { prompt_key: 'campo_final_opcional', step_order: 14 },
      },
    }),
  )

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. REGULAÇÃO & PADRÕES DE RESPOSTA (BUILD 07C)
  // ═════════════════════════════════════════════════════════════════════════════
  const regExpId = 'exp-regulacao-respostas-07c'

  // Contexto de mobilização
  responses.push(
    createResp({
      id: 'qa-reg-p1',
      experienceId: regExpId,
      promptId: 'p-07c-pr1-contexto',
      promptKey: 'contexto_mobilizacao',
      created: dateReg,
      structuredValue: {
        title: 'Sobrecarga de prazos simultâneos e ruídos de comunicação na equipe',
        prompt_key: 'contexto_mobilizacao',
      },
    }),
  )

  // Primeiros sinais
  responses.push(
    createResp({
      id: 'qa-reg-p2',
      experienceId: regExpId,
      promptId: 'p-07c-pr1-primeiros-sinais',
      promptKey: 'primeiros_sinais_mobilizacao',
      created: dateReg,
      structuredValue: {
        title: 'Aceleração do batimento cardíaco, ombros contraídos e respiração superficial',
        prompt_key: 'primeiros_sinais_mobilizacao',
      },
    }),
  )

  // Timing
  responses.push(
    createResp({
      id: 'qa-reg-p3',
      experienceId: regExpId,
      promptId: 'p-07c-pr1-timing',
      promptKey: 'signal_awareness_timing',
      created: dateReg,
      structuredValue: {
        title: 'Percepção alguns minutos após o início da tensão física',
        prompt_key: 'signal_awareness_timing',
      },
    }),
  )

  // Resposta / Tendência
  responses.push(
    createResp({
      id: 'qa-reg-p4',
      experienceId: regExpId,
      promptId: 'p-07c-pr2-resposta',
      promptKey: 'resposta_tendencia',
      created: dateReg,
      structuredValue: {
        title: 'Mobilização hiperativa para resolver tudo de imediato sem pedir auxílio',
        prompt_key: 'resposta_tendencia',
      },
    }),
  )

  // Função protetiva
  responses.push(
    createResp({
      id: 'qa-reg-p5',
      experienceId: regExpId,
      promptId: 'p-07c-pr2-funcao',
      promptKey: 'funcao_percebida',
      created: dateReg,
      freeText: 'Evitar a sensação de desamparo ou incompetência perante as demandas que assumi.',
      structuredValue: {
        value: 'Garantir a previsibilidade e proteger a minha integridade profissional',
        prompt_key: 'funcao_percebida',
      },
    }),
  )

  // Custo posterior
  responses.push(
    createResp({
      id: 'qa-reg-p6',
      experienceId: regExpId,
      promptId: 'p-07c-pr3-custo',
      promptKey: 'custo_posterior',
      created: dateReg,
      structuredValue: {
        title: 'Sensação de estafa mental profunda e dificuldade para relaxar à noite',
        prompt_key: 'custo_posterior',
      },
    }),
  )

  // Recurso de retorno ao eixo
  responses.push(
    createResp({
      id: 'qa-reg-p7',
      experienceId: regExpId,
      promptId: 'p-07c-pr3-recurso',
      promptKey: 'recurso_retorno',
      created: dateReg,
      structuredValue: {
        title: 'Pausa para respiração lenta em 4 tempos e alongamento das costas',
        prompt_key: 'recurso_retorno',
      },
    }),
  )

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. RELAÇÕES & VÍNCULOS (BUILD 07D)
  // ═════════════════════════════════════════════════════════════════════════════
  const relExpId = 'exp-relacoes-07d'

  responses.push(
    createResp({
      id: 'qa-rel-p1',
      experienceId: relExpId,
      promptId: 'p-07d-rm1-conforto-proximidade',
      promptKey: 'proximidade_conforto',
      created: dateRel,
      structuredValue: {
        title: 'Círculo íntimo seleto com alto nível de dedicação e lealdade profunda',
        prompt_key: 'proximidade_conforto',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-rel-p2',
      experienceId: relExpId,
      promptId: 'p-07d-rm1-pertencimento',
      promptKey: 'pertencimento_sentido',
      created: dateRel,
      structuredValue: {
        title: 'Sentimento forte de pertencimento quando há reciprocidade e verdade',
        prompt_key: 'pertencimento_sentido',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-rel-p3',
      experienceId: relExpId,
      promptId: 'p-07d-rm2-confianca-vulnerabilidade',
      promptKey: 'confianca_vulnerabilidade',
      created: dateRel,
      structuredValue: {
        title: 'Abertura lenta e cautelosa com checagem de consistência nas atitudes',
        prompt_key: 'confianca_vulnerabilidade',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-rel-p4',
      experienceId: relExpId,
      promptId: 'p-07d-rm2-limites-cena',
      promptKey: 'limites_dizer_nao',
      created: dateRel,
      structuredValue: {
        title: 'Hesitação inicial em dizer não por receio de sobrecarregar ou ferir o outro',
        prompt_key: 'limites_dizer_nao',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-rel-p5',
      experienceId: relExpId,
      promptId: 'p-07d-rm3-pedir-apoio',
      promptKey: 'pedir_apoio',
      created: dateRel,
      structuredValue: {
        title: 'Tendo a esgotar minhas forças antes de finalmente solicitar suporte',
        prompt_key: 'pedir_apoio',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-rel-p6',
      experienceId: relExpId,
      promptId: 'p-07d-rm3-receber-cuidado',
      promptKey: 'receber_cuidado',
      created: dateRel,
      structuredValue: {
        title: 'Acolhimento sincero e emocionado quando percebo cuidado desinteressado',
        prompt_key: 'receber_cuidado',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-rel-p7',
      experienceId: relExpId,
      promptId: 'p-07d-rm4-conflito-movimento',
      promptKey: 'conflito_movimento',
      created: dateRel,
      structuredValue: {
        title: 'Recuo reflexivo temporário para organizar as ideias antes do confronto',
        prompt_key: 'conflito_movimento',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-rel-p8',
      experienceId: relExpId,
      promptId: 'p-07d-rm5-reparacao-recurso',
      promptKey: 'reparacao_recurso',
      created: dateRel,
      structuredValue: {
        title: 'Conversa franca, escuta atenta e pedido de desculpas autêntico',
        prompt_key: 'reparacao_recurso',
      },
    }),
  )

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. SEXUALIDADE & INTIMIDADE (BUILD 07E)
  // ═════════════════════════════════════════════════════════════════════════════
  const sexExpId = 'exp-sexualidade-07e'

  responses.push(
    createResp({
      id: 'qa-sex-p1',
      experienceId: sexExpId,
      promptId: 'p-07e-sm1-relacao-corpo-erotico',
      promptKey: 'corpo_erotico_percepcao',
      created: dateSex,
      structuredValue: {
        title: 'Percepção positiva do corpo quando há ausência de cansaço acumulado',
        prompt_key: 'corpo_erotico_percepcao',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sex-p2',
      experienceId: sexExpId,
      promptId: 'p-07e-sm1-vitalidade-desejo',
      promptKey: 'vitalidade_energia_desejo',
      created: dateSex,
      structuredValue: {
        title: 'Desejo diretamente conectado ao afeto e à desaceleração da rotina',
        prompt_key: 'vitalidade_energia_desejo',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sex-p3',
      experienceId: sexExpId,
      promptId: 'p-07e-sm2-permissao-prazer',
      promptKey: 'permissao_prazer_entrega',
      created: dateSex,
      structuredValue: {
        title: 'Entrega plena quando sinto cumplicidade e espaço sem julgamentos',
        prompt_key: 'permissao_prazer_entrega',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sex-p4',
      experienceId: sexExpId,
      promptId: 'p-07e-sm2-seguranca-afeto',
      promptKey: 'seguranca_afeto_intimidade',
      created: dateSex,
      structuredValue: {
        title: 'Segurança relacional como requisito indispensável para abertura íntima',
        prompt_key: 'seguranca_afeto_intimidade',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sex-p5',
      experienceId: sexExpId,
      promptId: 'p-07e-sm3-comunicacao-desejos',
      promptKey: 'comunicacao_desejos_limites',
      created: dateSex,
      structuredValue: {
        title: 'Comunicação gradual de vontades e limites com clareza amorosa',
        prompt_key: 'comunicacao_desejos_limites',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sex-p6',
      experienceId: sexExpId,
      promptId: 'p-07e-sm3-bloqueios-distratores',
      promptKey: 'distratores_desconexao_erotica',
      created: dateSex,
      structuredValue: {
        title: 'Ruídos mentais com tarefas pendentes e preocupações do dia seguinte',
        prompt_key: 'distratores_desconexao_erotica',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sex-p7',
      experienceId: sexExpId,
      promptId: 'p-07e-sm4-integracao-erotica',
      promptKey: 'integracao_erotica_vida',
      created: dateSex,
      freeText:
        'A sexualidade vivida como celebração do vínculo e expressão de beleza humana compartilhada.',
      structuredValue: {
        title: 'Integração serena entre espiritualidade, afeto e prazer corporal',
        prompt_key: 'integracao_erotica_vida',
      },
    }),
  )

  // ═════════════════════════════════════════════════════════════════════════════
  // 6. SENTIDO & CONEXÃO (BUILD 07F)
  // ═════════════════════════════════════════════════════════════════════════════
  const senExpId = 'exp-sentido-conexao-07f'

  responses.push(
    createResp({
      id: 'qa-sen-p1',
      experienceId: senExpId,
      promptId: 'p-07f-sc1-bussola-interna',
      promptKey: 'bussola_interna_guia',
      created: dateSen,
      structuredValue: {
        title: 'Coerência ética interna e paz de consciência como referencial primeiro',
        prompt_key: 'bussola_interna_guia',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sen-p2',
      experienceId: senExpId,
      promptId: 'p-07f-sc1-valores-inegociaveis',
      promptKey: 'valores_fundamentais',
      created: dateSen,
      structuredValue: {
        title: 'Verdade, generosidade, respeito à dignidade humana e cuidado com a vida',
        prompt_key: 'valores_fundamentais',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sen-p3',
      experienceId: senExpId,
      promptId: 'p-07f-sc2-conexao-transcendencia',
      promptKey: 'transcendencia_sagrado_natureza',
      created: dateSen,
      structuredValue: {
        title: 'Sentimento de união profunda ao contemplar a natureza e o silêncio',
        prompt_key: 'transcendencia_sagrado_natureza',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sen-p4',
      experienceId: senExpId,
      promptId: 'p-07f-sc2-praticas-nutricao',
      promptKey: 'praticas_espirituais_nutricao',
      created: dateSen,
      structuredValue: {
        title: 'Meditação matinal, leitura reflexiva e momentos de contemplação a sós',
        prompt_key: 'praticas_espirituais_nutricao',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sen-p5',
      experienceId: senExpId,
      promptId: 'p-07f-sc3-momentos-crise-fe',
      promptKey: 'crise_sentido_sustentacao',
      created: dateSen,
      structuredValue: {
        title: 'Confiança na sabedoria dos ciclos e busca por aprendizado na adversidade',
        prompt_key: 'crise_sentido_sustentacao',
      },
    }),
  )

  responses.push(
    createResp({
      id: 'qa-sen-p6',
      experienceId: senExpId,
      promptId: 'p-07f-sc4-visao-futuro-legado',
      promptKey: 'legado_visao_vida',
      created: dateSen,
      freeText:
        'Deixar uma marca de bondade, inspirar pessoas a viverem com mais presença e verdade.',
      structuredValue: {
        title: 'Viver com propósito ativo e servir de ancoragem amorosa para quem caminha junto',
        prompt_key: 'legado_visao_vida',
      },
    }),
  )

  return { responses, responseVersions }
}
