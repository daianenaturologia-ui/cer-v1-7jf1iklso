/**
 * AYURVEDA CANÔNICO — LOTE A: FUNDAÇÃO DA NOVA AVALIAÇÃO + CAPÍTULO 1
 * "Minha estrutura e minhas características"
 *
 * Princípios e Separação Epistêmica:
 * 1. Resposta vazia (unanswered), "Não sei identificar" (explicit_unsure) e "Prefiro não responder" (explicit_refusal)
 *    são TRÊS estados distintos e não pontuados como zero.
 * 2. Sexo, gênero, pronome ou estética do avatar NUNCA definem ou pré-selecionam resposta clínica.
 * 3. Nenhuma característica isolada define dosha, Prakriti ou Vikriti.
 * 4. Nenhum dosha, percentual, ranking, pontuação ou diagnóstico automático é gerado.
 * 5. IDs canônicos versionados NOVOS (prefixo `ayv_c1_`), preservando o questionário legado intacto.
 */

import {
  CerExperienceMomentRecord,
  CerExperienceRecord,
  CerPromptRecord,
  ExperienceResponseRecord,
} from '@/types/cer'

export const AYURVEDA_EXPERIENCE_VERSION = '2.0.0'
export const AYURVEDA_CORPO_EXPERIENCE_ID = 'exp-corpo-fisiologia-07b'
export const AYURVEDA_CHAPTER_1_ID = 'capitulo-1-estrutura-caracteristicas'

export type ClinicalTimeLayer = 'stable_history' | 'habitual'
export type ClinicalStability = 'lifelong' | 'long_term' | 'partial' | 'changed' | 'uncertain'
export type ClinicalHistoricalConfidence = 'high' | 'medium' | 'low' | 'unknown'
export type ClinicalSource = 'participant_self_report'

export interface AyurvedaCanonicalResponseMetadata {
  prompt_key: string
  domain: 'corpo_fisiologia' | 'ayurveda'
  option_ids: string[]
  raw_text?: string
  time_layer: ClinicalTimeLayer
  stability: ClinicalStability
  source: ClinicalSource
  historical_confidence: ClinicalHistoricalConfidence
  explicit_unsure: boolean
  explicit_refusal: boolean
  answered_at: string
  experience_version: string
  chapter_id: string
  contradiction_flag?: boolean
  notes_for_professional?: string
}

export interface AyurvedaChapter1State {
  // Tela 1: Estrutura Corporal Habitual
  structure_choice?: string // 'light_narrow' | 'intermediate' | 'broad_solid' | 'two_figures' | 'changed_lot' | 'dont_know' | 'refusal'
  secondary_structure_choice?: string // preenchido se 'two_figures'
  structure_duration?: string // 'lifelong' | 'most_adult' | 'some_phases' | 'changed_lot' | 'dont_know' | 'refusal'

  // Tela 2: Pele Habitual (máximo 2)
  skin_choices?: string[]

  // Tela 3: Cabelo Habitual (máximo 2)
  hair_choices?: string[]

  // Tela 4: Temperatura Corporal Habitual (seleção única)
  temperature_choice?: string

  // Tela 5: Sede, Bebida e Transpiração (3 blocos independentes)
  thirst_choice?: string
  drink_temperature_choice?: string
  sweat_choice?: string
}

// Prompt IDs e Keys canônicos do Capítulo 1
export const AYV_C1_PROMPTS = {
  P1_STRUCTURE: {
    id: 'ayv_c1_p1_estrutura_corporal',
    key: 'ayv_c1_estrutura_corporal',
    step_order: 1,
    title: 'Estrutura corporal habitual',
  },
  P1_DURATION: {
    id: 'ayv_c1_p1_estrutura_duracao',
    key: 'ayv_c1_estrutura_duracao',
    step_order: 1,
    title: 'Duração da estrutura habitual',
  },
  P2_SKIN: {
    id: 'ayv_c1_p2_pele_habitual',
    key: 'ayv_c1_pele_habitual',
    step_order: 2,
    title: 'Pele habitual',
  },
  P3_HAIR: {
    id: 'ayv_c1_p3_cabelo_habitual',
    key: 'ayv_c1_cabelo_habitual',
    step_order: 3,
    title: 'Cabelo habitual',
  },
  P4_TEMPERATURE: {
    id: 'ayv_c1_p4_temperatura_habitual',
    key: 'ayv_c1_temperatura_habitual',
    step_order: 4,
    title: 'Temperatura corporal habitual',
  },
  P5_THIRST: {
    id: 'ayv_c1_p5a_sede_habitual',
    key: 'ayv_c1_sede_habitual',
    step_order: 5,
    title: 'Sede habitual',
  },
  P5_DRINK_TEMP: {
    id: 'ayv_c1_p5b_temperatura_bebida',
    key: 'ayv_c1_temperatura_bebida',
    step_order: 5,
    title: 'Temperatura de bebida confortável',
  },
  P5_SWEAT: {
    id: 'ayv_c1_p5c_transpiracao_habitual',
    key: 'ayv_c1_transpiracao_habitual',
    step_order: 5,
    title: 'Transpiração habitual',
  },
  CHAPTER_COMPLETION: {
    id: 'ayv_c1_chapter1_completion',
    key: 'ayv_c1_chapter1_completion',
    step_order: 5,
    title: 'Conclusão canônica do Capítulo 1',
  },
} as const

// Definição dos 4 Capítulos
export interface AyurvedaChapterDefinition {
  id: string
  number: number
  title: string
  shortTitle: string
  subtitle: string
  active: boolean
  statusLabel?: string
}

export const AYURVEDA_FOUR_CHAPTERS: AyurvedaChapterDefinition[] = [
  {
    id: 'capitulo-1-estrutura-caracteristicas',
    number: 1,
    title: 'Capítulo 1 — Minha estrutura e minhas características',
    shortTitle: 'Estrutura e características',
    subtitle: 'Estrutura corporal, pele, cabelo, temperatura e sensações basais',
    active: true,
  },
  {
    id: 'capitulo-2-ritmo-corpo',
    number: 2,
    title: 'Capítulo 2 — O ritmo do meu corpo',
    shortTitle: 'O ritmo do meu corpo',
    subtitle: 'Digestão, fome, rotina, eliminação e sono',
    active: false,
    statusLabel: 'Será liberado na continuação desta experiência',
  },
  {
    id: 'capitulo-3-diferente-agora',
    number: 3,
    title: 'Capítulo 3 — O que está diferente agora',
    shortTitle: 'O que está diferente agora',
    subtitle: 'Sintomas recentes, variações sazonais e mudanças percebidas',
    active: false,
    statusLabel: 'Será liberado na continuação desta experiência',
  },
  {
    id: 'capitulo-4-corpo-sintese',
    number: 4,
    title: 'Capítulo 4 — Meu corpo em síntese',
    shortTitle: 'Meu corpo em síntese',
    subtitle: 'Visão integrativa preparada para a conversa com Daiane',
    active: false,
    statusLabel: 'Será liberado na continuação desta experiência',
  },
]

// Textos canônicos obrigatórios
export const AYV_TEXTS = {
  AVATAR_CONFIRMATION_TITLE: 'Sua representação está pronta',
  AVATAR_CONFIRMATION_BODY:
    'Agora vamos começar a observar algumas características que acompanham o seu corpo ao longo dos anos. Lembre-se de pensar especialmente nos períodos em que você se sentia relativamente bem.',
  START_CHAPTER_1_BTN: 'Começar o Capítulo 1',
  OPENING_TITLE: 'Minha estrutura e minhas características',
  OPENING_BODY:
    "Algumas características acompanham nosso corpo há muitos anos. Outras mudam conforme a rotina, o clima, os hormônios, a saúde e as diferentes fases da vida.\n\nNeste primeiro capítulo, procure lembrar como seu corpo costuma ser ao longo dos anos, especialmente nos períodos em que você se sentia relativamente bem. Mais adiante, haverá um espaço separado para registrar o que mudou no seu momento atual.\n\nNão existem respostas certas ou erradas. Se tiver dúvida, você poderá marcar 'Não sei identificar'.",
  OPENING_SIGNATURE: 'Com carinho, Daia',
  ESTIMATED_DURATION: 'Cerca de 3 a 4 minutos',
  CLOSING_FINAL_NOTE:
    'Estas informações são pistas sobre o funcionamento do seu corpo e serão reunidas aos seus ritmos de fome, digestão, eliminação, energia e sono. Nenhuma característica isolada define sua constituição.',
  COMPLETED_TITLE: 'Capítulo 1 concluído',
  COMPLETED_BODY:
    'Suas respostas foram registradas. Na continuação desta experiência, vamos observar os ritmos do seu corpo.',
  REVISION_BANNER: 'Revisão das suas respostas',
  REVISION_RETURN_CMD: 'Voltar ao encerramento',
  CORRECTION_CONFIRMATION_PROMPT:
    'Ao confirmar, você poderá corrigir suas respostas. A versão anterior será preservada no histórico profissional.',
}

// Opções da Tela 1 — Estrutura corporal
export const AYV_TELA1_STRUCTURE_OPTIONS = [
  { id: 'light_narrow', label: 'Estrutura leve ou estreita' },
  { id: 'intermediate', label: 'Estrutura intermediária' },
  { id: 'broad_solid', label: 'Estrutura ampla ou sólida' },
  { id: 'two_figures', label: 'Reconheço características de duas figuras' },
  {
    id: 'changed_lot',
    label: 'Meu corpo mudou bastante e tenho dificuldade de comparar',
    low_confidence: true,
  },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

export const AYV_TELA1_DURATION_OPTIONS = [
  { id: 'lifelong', label: 'Desde a juventude ou o início da vida adulta' },
  { id: 'most_adult', label: 'Durante a maior parte da minha vida adulta' },
  { id: 'some_phases', label: 'Apenas em algumas fases' },
  { id: 'changed_lot', label: 'Meu corpo mudou muito ao longo dos anos', low_confidence: true },
  { id: 'dont_know', label: 'Não sei dizer', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

// Opções da Tela 2 — Pele habitual (até 2 escolhas)
export const AYV_TELA2_SKIN_OPTIONS = [
  { id: 'dry_rough', label: 'Tende a ficar seca, áspera ou repuxando com facilidade' },
  { id: 'thin_reactive', label: 'Parece fina ou delicada e reage facilmente ao ambiente' },
  { id: 'warm_sensitive', label: 'Costuma ser quente, sensível ou avermelhar com facilidade' },
  { id: 'balanced', label: 'Geralmente mantém textura e hidratação relativamente equilibradas' },
  { id: 'soft_oily', label: 'Tende a ser macia, úmida ou naturalmente oleosa' },
  {
    id: 'varies_region',
    label: 'Comporta-se de maneiras diferentes conforme a região ou a estação',
  },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true, exclusive: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true, exclusive: true },
]

// Opções da Tela 3 — Cabelo habitual (até 2 escolhas)
export const AYV_TELA3_HAIR_OPTIONS = [
  { id: 'fine_delicate', label: 'Fios finos ou delicados' },
  { id: 'dry_tangled', label: 'Tendem a ressecar, embaraçar ou quebrar com facilidade' },
  { id: 'balanced', label: 'Fios intermediários, com comportamento relativamente equilibrado' },
  { id: 'thick_dense', label: 'Fios grossos, densos ou pesados' },
  { id: 'oily_roots', label: 'Raiz naturalmente oleosa ou cabelo que pesa com facilidade' },
  { id: 'mixed_varies', label: 'Misturam características ou variam bastante' },
  {
    id: 'no_reference',
    label: 'Não tenho referência suficiente sobre meu cabelo natural',
    is_unsure: true,
    exclusive: true,
  },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true, exclusive: true },
]

// Opções da Tela 4 — Temperatura habitual (seleção única)
export const AYV_TELA4_TEMPERATURE_OPTIONS = [
  {
    id: 'cold_easily',
    label: 'Sinto frio com facilidade, especialmente nas mãos e nos pés',
  },
  { id: 'heat_easily', label: 'Sinto calor com facilidade e sofro em ambientes quentes' },
  { id: 'stable', label: 'Minha temperatura costuma ser relativamente estável' },
  { id: 'alternates', label: 'Alterno bastante entre frio e calor' },
  { id: 'varies_climate', label: 'Depende muito do clima, do ciclo ou da fase que estou vivendo' },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

// Opções da Tela 5 — Sede, Bebida e Transpiração (3 blocos)
export const AYV_TELA5_THIRST_OPTIONS = [
  { id: 'varies_late', label: 'Varia bastante ou percebo tarde que preciso beber água' },
  { id: 'frequent', label: 'É frequente e claramente percebida' },
  { id: 'discreet', label: 'É discreta e posso passar bastante tempo sem sentir sede' },
  { id: 'moderate_constant', label: 'É moderada e relativamente constante' },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

export const AYV_TELA5_DRINK_TEMP_OPTIONS = [
  { id: 'warm_hot', label: 'Morna ou quente' },
  { id: 'room_temp', label: 'Em temperatura ambiente' },
  { id: 'cool_cold', label: 'Fresca ou gelada' },
  { id: 'varies_climate', label: 'Varia conforme o clima e o momento' },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

export const AYV_TELA5_SWEAT_OPTIONS = [
  { id: 'sweats_little', label: 'Transpiro pouco, mesmo com calor ou esforço moderado' },
  { id: 'moderate_predictable', label: 'Transpiro de forma moderada e previsível' },
  { id: 'sweats_easily', label: 'Transpiro com facilidade ou em quantidade significativa' },
  {
    id: 'varies_stress',
    label: 'Varia bastante conforme estresse, clima, ciclo ou atividade',
  },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

/**
 * Mapeador determinístico para organização literal do encerramento (Seção 4 da spec):
 * 1. "Características que você reconhece há mais tempo"
 * 2. "Características que parecem variar conforme o contexto"
 * 3. "Pontos que ainda precisam ser compreendidos" (dúvidas, recusas, mudanças acentuadas ou ausência de referência)
 */
export interface CategorizedSummaryItem {
  promptLabel: string
  optionLabel: string
  rawOptionId: string
  category: 'longer_term' | 'context_variable' | 'points_to_clarify'
}

export function categorizeChapter1Responses(state: AyurvedaChapter1State): {
  longerTerm: CategorizedSummaryItem[]
  contextVariable: CategorizedSummaryItem[]
  pointsToClarify: CategorizedSummaryItem[]
} {
  const longerTerm: CategorizedSummaryItem[] = []
  const contextVariable: CategorizedSummaryItem[] = []
  const pointsToClarify: CategorizedSummaryItem[] = []

  const pushItem = (
    promptLabel: string,
    optionId: string | undefined,
    optionsList: {
      id: string
      label: string
      is_unsure?: boolean
      is_refusal?: boolean
      low_confidence?: boolean
    }[],
  ) => {
    if (!optionId) return
    const opt = optionsList.find((o) => o.id === optionId)
    const label = opt ? opt.label : optionId

    if (opt?.is_unsure || opt?.is_refusal || opt?.low_confidence || optionId === 'no_reference') {
      pointsToClarify.push({
        promptLabel,
        optionLabel: label,
        rawOptionId: optionId,
        category: 'points_to_clarify',
      })
    } else if (
      optionId === 'two_figures' ||
      optionId === 'varies_region' ||
      optionId === 'mixed_varies' ||
      optionId === 'alternates' ||
      optionId === 'varies_climate' ||
      optionId === 'varies_late' ||
      optionId === 'varies_stress' ||
      optionId === 'some_phases'
    ) {
      contextVariable.push({
        promptLabel,
        optionLabel: label,
        rawOptionId: optionId,
        category: 'context_variable',
      })
    } else {
      longerTerm.push({
        promptLabel,
        optionLabel: label,
        rawOptionId: optionId,
        category: 'longer_term',
      })
    }
  }

  // 1. Estrutura corporal
  if (state.structure_choice === 'two_figures') {
    const opt = AYV_TELA1_STRUCTURE_OPTIONS.find((o) => o.id === 'two_figures')
    const opt1 = AYV_TELA1_STRUCTURE_OPTIONS.find((o) => o.id === state.structure_choice)
    const opt2 = AYV_TELA1_STRUCTURE_OPTIONS.find((o) => o.id === state.secondary_structure_choice)
    const combinedLabel = `Reconheço características de duas figuras: ${opt1?.label || ''}${opt2 ? ` e ${opt2.label}` : ''}`
    contextVariable.push({
      promptLabel: 'Estrutura corporal habitual',
      optionLabel: combinedLabel,
      rawOptionId: 'two_figures',
      category: 'context_variable',
    })
  } else {
    pushItem('Estrutura corporal habitual', state.structure_choice, AYV_TELA1_STRUCTURE_OPTIONS)
  }

  if (state.structure_duration) {
    pushItem('Duração da estrutura habitual', state.structure_duration, AYV_TELA1_DURATION_OPTIONS)
  }

  // 2. Pele
  if (state.skin_choices && state.skin_choices.length > 0) {
    for (const s of state.skin_choices) {
      pushItem('Pele habitual', s, AYV_TELA2_SKIN_OPTIONS)
    }
  }

  // 3. Cabelo
  if (state.hair_choices && state.hair_choices.length > 0) {
    for (const h of state.hair_choices) {
      pushItem('Cabelo habitual', h, AYV_TELA3_HAIR_OPTIONS)
    }
  }

  // 4. Temperatura
  pushItem('Temperatura corporal habitual', state.temperature_choice, AYV_TELA4_TEMPERATURE_OPTIONS)

  // 5. Sede, bebida e transpiração
  pushItem('Sede habitual', state.thirst_choice, AYV_TELA5_THIRST_OPTIONS)
  pushItem('Temperatura de bebida', state.drink_temperature_choice, AYV_TELA5_DRINK_TEMP_OPTIONS)
  pushItem('Transpiração habitual', state.sweat_choice, AYV_TELA5_SWEAT_OPTIONS)

  return { longerTerm, contextVariable, pointsToClarify }
}

export type AyurvedaChapter1Status =
  | 'not_started'
  | 'in_progress'
  | 'ready_to_complete'
  | 'completed'

/**
 * Total de 5 etapas clínicas (telas 1 a 5) do Capítulo 1.
 */
export const AYV_C1_TOTAL_STEPS = 5

/**
 * Mapeamento canônico das 5 etapas clínicas do Capítulo 1 para seus prompts obrigatórios.
 * Tela 1: P1_STRUCTURE (+ opcionalmente P1_DURATION)
 * Tela 2: P2_SKIN
 * Tela 3: P3_HAIR
 * Tela 4: P4_TEMPERATURE
 * Tela 5: P5_THIRST, P5_DRINK_TEMP, P5_SWEAT
 */
export const AYV_C1_STEP_PROMPT_KEYS: Record<number, string[]> = {
  1: [AYV_C1_PROMPTS.P1_STRUCTURE.key],
  2: [AYV_C1_PROMPTS.P2_SKIN.key],
  3: [AYV_C1_PROMPTS.P3_HAIR.key],
  4: [AYV_C1_PROMPTS.P4_TEMPERATURE.key],
  5: [AYV_C1_PROMPTS.P5_THIRST.key, AYV_C1_PROMPTS.P5_DRINK_TEMP.key, AYV_C1_PROMPTS.P5_SWEAT.key],
}

/**
 * Total de 8 prompts de pergunta canônicos do Capítulo 1
 * (exclui o registro de conclusão CHAPTER_COMPLETION).
 */
export const AYV_C1_QUESTION_PROMPT_KEYS = [
  AYV_C1_PROMPTS.P1_STRUCTURE.key,
  AYV_C1_PROMPTS.P1_DURATION.key,
  AYV_C1_PROMPTS.P2_SKIN.key,
  AYV_C1_PROMPTS.P3_HAIR.key,
  AYV_C1_PROMPTS.P4_TEMPERATURE.key,
  AYV_C1_PROMPTS.P5_THIRST.key,
  AYV_C1_PROMPTS.P5_DRINK_TEMP.key,
  AYV_C1_PROMPTS.P5_SWEAT.key,
] as const

export const AYV_C1_QUESTION_PROMPT_IDS = [
  AYV_C1_PROMPTS.P1_STRUCTURE.id,
  AYV_C1_PROMPTS.P1_DURATION.id,
  AYV_C1_PROMPTS.P2_SKIN.id,
  AYV_C1_PROMPTS.P3_HAIR.id,
  AYV_C1_PROMPTS.P4_TEMPERATURE.id,
  AYV_C1_PROMPTS.P5_THIRST.id,
  AYV_C1_PROMPTS.P5_DRINK_TEMP.id,
  AYV_C1_PROMPTS.P5_SWEAT.id,
] as const

/**
 * Derivação canônica explícita do status e progresso do Capítulo 1.
 * NUNCA lê enrollmentExp.progress_status.
 *
 * 1. canonicalResponses = registros vinculados estritamente aos prompts ayv_c1_*
 *    (NÃO conta IDs não canônicos, legados p-07b-*, avatar, demo flags ou seeds).
 * 2. hasCompletionRecord = registro canônico explícito com completed: true e completed_at real.
 * 3. Status:
 *    - 0 respostas canônicas -> 'not_started' (0% de progresso);
 *    - respostas canônicas presentes sem registro de conclusão -> 'in_progress';
 *    - hasCompletionRecord && canonicalResponses.length > 0 (com pelo menos uma pergunta real respondida) -> 'completed' (100%).
 * 4. Progresso parcial: percentual = blocos canônicos respondidos / 8. 0% se not_started.
 */
export function deriveChapter1Status(
  responses: Array<ExperienceResponseRecord | Record<string, any>> = [],
): {
  status: AyurvedaChapter1Status
  progress: number
  answeredCount: number
  totalQuestions: number
  answeredStepsCount: number
  totalSteps: number
  firstUnansweredStep: number
  hasCompletionRecord: boolean
  canonicalResponses: Array<ExperienceResponseRecord | Record<string, any>>
} {
  const totalQuestions = AYV_C1_QUESTION_PROMPT_KEYS.length
  const totalSteps = AYV_C1_TOTAL_STEPS

  // Filtrar apenas respostas canônicas do Capítulo 1 (prefixo ayv_c1_)
  const canonicalResponses = (responses || []).filter((r) => {
    if (!r) return false
    const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id
    const sVal = (r as any).structured_value
    const promptKey =
      (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key

    const matchesId = typeof promptId === 'string' && promptId.startsWith('ayv_c1_')
    const matchesKey = typeof promptKey === 'string' && promptKey.startsWith('ayv_c1_')
    return matchesId || matchesKey
  })

  // Verificar se há registro canônico explícito de conclusão
  const hasCompletionRecord = canonicalResponses.some((r) => {
    const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id
    const sVal = (r as any).structured_value
    const promptKey =
      (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key

    const isCompletionPrompt =
      promptId === AYV_C1_PROMPTS.CHAPTER_COMPLETION.id ||
      promptKey === AYV_C1_PROMPTS.CHAPTER_COMPLETION.key

    if (!isCompletionPrompt) return false

    const isCompletedVal =
      sVal?.completed === true || sVal?.value?.completed === true || sVal?.status === 'completed'

    const completedAt =
      sVal?.completed_at || sVal?.value?.completed_at || (r as any).updated || (r as any).created

    const hasValidDate = typeof completedAt === 'string' && completedAt.trim().length > 0

    return Boolean(isCompletedVal && hasValidDate)
  })

  // Contabilizar perguntas canônicas respondidas (distintas entre os 8 blocos de perguntas)
  const answeredPromptSet = new Set<string>()

  for (const r of canonicalResponses) {
    const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id
    const sVal = (r as any).structured_value
    const promptKey =
      (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key

    for (let i = 0; i < totalQuestions; i++) {
      const qKey = AYV_C1_QUESTION_PROMPT_KEYS[i]
      const qId = AYV_C1_QUESTION_PROMPT_IDS[i]
      if (promptKey === qKey || promptId === qId) {
        // Checar se possui valor real respondido (não vazio)
        const hasValue =
          sVal !== undefined &&
          sVal !== null &&
          (typeof sVal === 'string'
            ? sVal.trim().length > 0
            : Array.isArray(sVal)
              ? sVal.length > 0
              : Array.isArray(sVal?.selectedOptionIds)
                ? sVal.selectedOptionIds.length > 0
                : sVal?.value !== undefined || sVal?.choice !== undefined)

        const rawVal = (r as any).value || (r as any).response_value
        if (hasValue || rawVal !== undefined) {
          answeredPromptSet.add(qKey)
        }
      }
    }
  }

  const answeredCount = answeredPromptSet.size

  // Avaliar quais das 5 etapas clínicas estão integralmente respondidas
  const answeredSteps = new Set<number>()
  for (let s = 1; s <= totalSteps; s++) {
    const requiredKeys = AYV_C1_STEP_PROMPT_KEYS[s] || []
    // Uma etapa é considerada respondida se todos os seus prompts requeridos estiverem no answeredPromptSet
    // Para Tela 5, pelo menos um dos blocos (ou preferencialmente os respondidos)
    // Se todos requiredKeys estiverem no answeredPromptSet
    const allRequiredAnswered = requiredKeys.every((k) => answeredPromptSet.has(k))
    if (allRequiredAnswered) {
      answeredSteps.add(s)
    }
  }

  const answeredStepsCount = answeredSteps.size

  // Identificar a primeira tela clínica ainda pendente (1 a 5)
  let firstUnansweredStep = 1
  for (let s = 1; s <= totalSteps; s++) {
    if (!answeredSteps.has(s)) {
      firstUnansweredStep = s
      break
    }
  }
  if (answeredStepsCount === totalSteps) {
    firstUnansweredStep = 5
  }

  // 4 ESTADOS CLAROS:
  // 1. not_started: 0 telas/perguntas respondidas
  // 2. completed: hasCompletionRecord === true && pelo menos 1 pergunta real respondida
  // 3. ready_to_complete: todas as 5 telas respondidas (answeredStepsCount === 5), MAS sem completion record
  // 4. in_progress: 1 a 4 telas respondidas (ou perguntas parciais) sem completion record
  let status: AyurvedaChapter1Status = 'not_started'
  let progress = 0

  if (canonicalResponses.length === 0 || answeredCount === 0) {
    status = 'not_started'
    progress = 0
  } else if (hasCompletionRecord && answeredCount > 0) {
    status = 'completed'
    progress = 100
  } else if (answeredStepsCount === totalSteps) {
    status = 'ready_to_complete'
    // Progresso em pronto para concluir não usa 100%
    progress = Math.min(95, Math.round((answeredStepsCount / totalSteps) * 100))
  } else {
    status = 'in_progress'
    // Progresso baseado nas etapas concluídas (de 1 a 4 sobre 5 etapas = 20%, 40%, 60%, 80%)
    progress = Math.round((answeredStepsCount / totalSteps) * 100)
    if (progress === 0 && answeredCount > 0) {
      progress = 15 // pequeno avanço inicial indicando início
    }
  }

  return {
    status,
    progress,
    answeredCount,
    totalQuestions,
    answeredStepsCount,
    totalSteps,
    firstUnansweredStep,
    hasCompletionRecord,
    canonicalResponses,
  }
}
