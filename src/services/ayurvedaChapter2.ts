/**
 * AYURVEDA CANÔNICO — CAPÍTULO 2A: "O RITMO DO MEU CORPO"
 * Fome, digestão, eliminação, sono e energia.
 *
 * Princípios e Separação Epistêmica:
 * 1. Resposta vazia (unanswered), "Não sei identificar" (explicit_unsure) e "Prefiro não responder" (explicit_refusal)
 *    são TRÊS estados distintos e não pontuados como zero.
 * 2. Sexo, gênero, pronome ou estética do avatar NUNCA definem ou pré-selecionam resposta clínica.
 * 3. Nenhuma característica isolada define dosha, Agni, Prakriti ou Vikriti.
 * 4. Nenhum dosha, percentual, ranking, pontuação ou diagnóstico automático é gerado.
 * 5. IDs canônicos versionados NOVOS (prefixo `ayv_c2_`), preservando o Capítulo 1 e o questionário legado intactos.
 * 6. Conclusão explícita canônica `ayv_c2_chapter_completion`.
 */

import { ExperienceResponseRecord } from '@/types/cer'

export const AYURVEDA_CHAPTER_2_ID = 'capitulo-2-ritmo-corpo'
export const AYURVEDA_CHAPTER_2_VERSION = '2.0.0'

export type Chapter2TreatmentVariant = 'feminino' | 'masculino' | 'neutro' | 'outro'

export interface AyurvedaCanonicalC2ResponseMetadata {
  prompt_key: string
  canonical_prompt_id: string
  domain: 'corpo_fisiologia' | 'ayurveda'
  chapter_id: string
  moment_id: string
  moment_number: number
  step_order: number
  option_ids: string[]
  raw_text?: string
  time_layer: 'habitual_adult'
  source: 'participant_self_report'
  historical_confidence?: 'high' | 'medium' | 'low' | 'unknown'
  explicit_unsure: boolean
  explicit_refusal: boolean
  answered_at: string
  experience_version: string
  notes_for_professional?: string
}

export interface AyurvedaChapter2State {
  // Momento 1: Fome
  hunger_pattern?: string[] // Pergunta 1 (até duas escolhas)
  delayed_meal_response?: string[] // Pergunta 2 (até duas escolhas)

  // Momento 2: Digestão
  post_meal?: string[] // Pergunta 3 (até duas escolhas)
  hunger_return?: string // Pergunta 4 (escolha única)
  food_demands?: string[] // Pergunta 5 (seleção múltipla)

  // Momento 3: Eliminação
  bowel_rhythm?: string // Pergunta 6 (escolha única)
  stool_pattern?: string[] // Pergunta 7 (até duas escolhas)

  // Momento 4: Sono
  sleep_pattern?: string[] // Pergunta 8 (até duas escolhas)
  waking?: string // Pergunta 9 (escolha única)

  // Momento 5: Energia
  energy_distribution?: string // Pergunta 10 (escolha única)
  body_pace?: string // Pergunta 11 (escolha única)
  historical_confidence?: string // Pergunta 12 (escolha única, segurança histórica)
}

// --------------------------------------------------------------------------
// PROMPTS E IDs CANÔNICOS DO CAPÍTULO 2
// --------------------------------------------------------------------------
export const AYV_C2_PROMPTS = {
  // Momento 1: Fome
  P1_HUNGER_PATTERN: {
    id: 'ayv_c2_hunger_pattern',
    key: 'ayv_c2_hunger_pattern',
    moment: 1,
    step_order: 1,
    title: 'Padrão da fome habitual',
  },
  P2_DELAYED_MEAL: {
    id: 'ayv_c2_delayed_meal_response',
    key: 'ayv_c2_delayed_meal_response',
    moment: 1,
    step_order: 1,
    title: 'Reação ao atraso da refeição',
  },

  // Momento 2: Digestão
  P3_POST_MEAL: {
    id: 'ayv_c2_post_meal',
    key: 'ayv_c2_post_meal',
    moment: 2,
    step_order: 2,
    title: 'Sensação após refeição habitual',
  },
  P4_HUNGER_RETURN: {
    id: 'ayv_c2_hunger_return',
    key: 'ayv_c2_hunger_return',
    moment: 2,
    step_order: 2,
    title: 'Retorno da fome',
  },
  P5_FOOD_DEMANDS: {
    id: 'ayv_c2_food_demands',
    key: 'ayv_c2_food_demands',
    moment: 2,
    step_order: 2,
    title: 'Alimentos que exigem mais da digestão',
  },

  // Momento 3: Eliminação
  P6_BOWEL_RHYTHM: {
    id: 'ayv_c2_bowel_rhythm',
    key: 'ayv_c2_bowel_rhythm',
    moment: 3,
    step_order: 3,
    title: 'Ritmo intestinal habitual',
  },
  P7_STOOL_PATTERN: {
    id: 'ayv_c2_stool_pattern',
    key: 'ayv_c2_stool_pattern',
    moment: 3,
    step_order: 3,
    title: 'Apresentação das fezes',
  },

  // Momento 4: Sono
  P8_SLEEP_PATTERN: {
    id: 'ayv_c2_sleep_pattern',
    key: 'ayv_c2_sleep_pattern',
    moment: 4,
    step_order: 4,
    title: 'Padrão do sono habitual',
  },
  P9_WAKING: {
    id: 'ayv_c2_waking',
    key: 'ayv_c2_waking',
    moment: 4,
    step_order: 4,
    title: 'Despertar e disposição',
  },

  // Momento 5: Energia
  P10_ENERGY_DISTRIBUTION: {
    id: 'ayv_c2_energy_distribution',
    key: 'ayv_c2_energy_distribution',
    moment: 5,
    step_order: 5,
    title: 'Distribuição da energia durante o dia',
  },
  P11_BODY_PACE: {
    id: 'ayv_c2_body_pace',
    key: 'ayv_c2_body_pace',
    moment: 5,
    step_order: 5,
    title: 'Ritmo corporal aproximado',
  },
  P12_HISTORICAL_CONFIDENCE: {
    id: 'ayv_c2_historical_confidence',
    key: 'ayv_c2_historical_confidence',
    moment: 5,
    step_order: 5,
    title: 'Segurança da memória sobre o padrão habitual',
  },

  // Conclusão canônica explícita
  CHAPTER_COMPLETION: {
    id: 'ayv_c2_chapter_completion',
    key: 'ayv_c2_chapter_completion',
    moment: 5,
    step_order: 5,
    title: 'Conclusão canônica do Capítulo 2',
  },
} as const

// Lista de chaves de perguntas canônicas (12 perguntas)
export const AYV_C2_QUESTION_PROMPT_KEYS = [
  AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
  AYV_C2_PROMPTS.P2_DELAYED_MEAL.key,
  AYV_C2_PROMPTS.P3_POST_MEAL.key,
  AYV_C2_PROMPTS.P4_HUNGER_RETURN.key,
  AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key,
  AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key,
  AYV_C2_PROMPTS.P7_STOOL_PATTERN.key,
  AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
  AYV_C2_PROMPTS.P9_WAKING.key,
  AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key,
  AYV_C2_PROMPTS.P11_BODY_PACE.key,
  AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
] as const

export const AYV_C2_QUESTION_PROMPT_IDS = [
  AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
  AYV_C2_PROMPTS.P2_DELAYED_MEAL.id,
  AYV_C2_PROMPTS.P3_POST_MEAL.id,
  AYV_C2_PROMPTS.P4_HUNGER_RETURN.id,
  AYV_C2_PROMPTS.P5_FOOD_DEMANDS.id,
  AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.id,
  AYV_C2_PROMPTS.P7_STOOL_PATTERN.id,
  AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id,
  AYV_C2_PROMPTS.P9_WAKING.id,
  AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.id,
  AYV_C2_PROMPTS.P11_BODY_PACE.id,
  AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.id,
] as const

export const AYV_C2_TOTAL_MOMENTS = 5
export const AYV_C2_TOTAL_QUESTIONS = 12

export const AYV_C2_MOMENTS_METADATA = [
  {
    number: 1,
    name: 'Fome',
    title: 'Momento 1 de 5 — Fome',
    keys: [AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key, AYV_C2_PROMPTS.P2_DELAYED_MEAL.key],
  },
  {
    number: 2,
    name: 'Digestão',
    title: 'Momento 2 de 5 — Digestão',
    keys: [
      AYV_C2_PROMPTS.P3_POST_MEAL.key,
      AYV_C2_PROMPTS.P4_HUNGER_RETURN.key,
      AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key,
    ],
  },
  {
    number: 3,
    name: 'Eliminação',
    title: 'Momento 3 de 5 — Eliminação',
    keys: [AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key, AYV_C2_PROMPTS.P7_STOOL_PATTERN.key],
  },
  {
    number: 4,
    name: 'Sono',
    title: 'Momento 4 de 5 — Sono',
    keys: [AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key, AYV_C2_PROMPTS.P9_WAKING.key],
  },
  {
    number: 5,
    name: 'Energia',
    title: 'Momento 5 de 5 — Energia',
    keys: [
      AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key,
      AYV_C2_PROMPTS.P11_BODY_PACE.key,
      AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
    ],
  },
]

export const AYV_C2_MOMENT_PROMPT_KEYS: Record<number, string[]> = {
  1: [AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key, AYV_C2_PROMPTS.P2_DELAYED_MEAL.key],
  2: [
    AYV_C2_PROMPTS.P3_POST_MEAL.key,
    AYV_C2_PROMPTS.P4_HUNGER_RETURN.key,
    AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key,
  ],
  3: [AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key, AYV_C2_PROMPTS.P7_STOOL_PATTERN.key],
  4: [AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key, AYV_C2_PROMPTS.P9_WAKING.key],
  5: [
    AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key,
    AYV_C2_PROMPTS.P11_BODY_PACE.key,
    AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
  ],
}

// --------------------------------------------------------------------------
// TEXTOS LITERAIS CANÔNICOS DA ESPECIFICAÇÃO
// --------------------------------------------------------------------------
export const AYV_C2_TEXTS = {
  OPENING_TITLE: 'O ritmo do meu corpo',
  OPENING_BODY:
    'O seu corpo tem um ritmo próprio. A fome, a digestão, o sono, a eliminação e a energia formam sinais que ajudam a compreender esse funcionamento.\n\nNesta etapa, procure responder pensando em como o seu corpo funcionou repetidamente durante a maior parte da sua vida adulta — especialmente antes de mudanças recentes de saúde, estresse, rotina, alimentação ou uso de medicamentos.\n\nNão existe resposta certa. Quando mais de uma opção fizer sentido, você poderá escolher até duas.\n\nCom carinho,\nDaia',
  OPENING_ESTIMATED_DURATION: 'Cerca de 4 a 6 minutos.',
  OPENING_START_BTN: 'Começar a observar meu ritmo',

  COMPLETED_TITLE: 'Capítulo 2 concluído',
  COMPLETED_SUBTITLE: 'Seu ritmo corporal foi registrado.',
  COMPLETED_BODY:
    'Você observou como funcionam sua fome, digestão, eliminação, sono e energia. Essas informações serão reunidas às demais etapas para formar uma compreensão mais completa do seu corpo.\n\nNenhuma característica isolada define quem você é. Daiane analisará o conjunto das respostas e poderá conversar com você sobre pontos que ainda precisem ser compreendidos.\n\nCom carinho,\nDaia',

  FOOD_DEMANDS_NOTE:
    'Esta resposta registra apenas a sua percepção e não identifica alergias ou intolerâncias.',

  REVISION_BANNER: 'Revisão das suas respostas — Modo somente-leitura',
  REVISION_RETURN_CMD: 'Voltar ao encerramento',
  CORRECTION_CONFIRMATION_PROMPT:
    'Ao confirmar, você poderá corrigir suas respostas. A versão anterior será preservada no histórico profissional.',
}

// --------------------------------------------------------------------------
// OPÇÕES CANÔNICAS DAS PERGUNTAS (1 A 12)
// --------------------------------------------------------------------------

// Pergunta 1 — Fome (escolha até duas)
export const AYV_C2_P1_HUNGER_OPTIONS = [
  { id: 'regular_hours', label: 'Aparece em horários relativamente previsíveis.' },
  { id: 'sudden_intense', label: 'Surge de repente e pode ficar muito intensa.' },
  {
    id: 'variable_intensity',
    label: 'Às vezes aparece com força e outras vezes quase não aparece.',
  },
  { id: 'light_slow', label: 'Costuma ser leve e demorar para surgir.' },
  { id: 'long_without_hunger', label: 'Posso passar muito tempo sem perceber fome.' },
  {
    id: 'changes_routine_emotion',
    label: 'Minha fome muda muito conforme a rotina ou o estado emocional.',
  },
  { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true, exclusive: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true, exclusive: true },
]

// Pergunta 2 — Atraso da refeição (escolha até duas)
export function getAyvC2P2Options(variant: Chapter2TreatmentVariant = 'neutro') {
  const irritadaLabel =
    variant === 'feminino'
      ? 'Fico irritada ou impaciente.'
      : variant === 'masculino'
        ? 'Fico irritado ou impaciente.'
        : 'Fico com irritação ou impaciência.'

  return [
    { id: 'irritation', label: irritadaLabel },
    { id: 'weakness_dizziness', label: 'Sinto fraqueza, tremor, tontura ou mal-estar.' },
    { id: 'hunger_disappears', label: 'Minha fome desaparece depois de algum tempo.' },
    { id: 'can_wait', label: 'Consigo esperar sem grande desconforto.' },
    { id: 'sluggish_low_energy', label: 'Sinto o corpo mais lento ou sem energia.' },
    { id: 'varies_lot', label: 'Isso varia bastante.' },
    { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true, exclusive: true },
    { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true, exclusive: true },
  ]
}

// Pergunta 3 — Pós-refeição (escolha até duas)
export function getAyvC2P3Options(variant: Chapter2TreatmentVariant = 'neutro') {
  const leveLabel =
    variant === 'feminino'
      ? 'Leve, confortável e satisfeita.'
      : variant === 'masculino'
        ? 'Leve, confortável e satisfeito.'
        : 'Sensação leve, confortável e com satisfação.'

  const pesadaLabel =
    variant === 'feminino'
      ? 'Pesada, como se a digestão demorasse.'
      : variant === 'masculino'
        ? 'Pesado, como se a digestão demorasse.'
        : 'Sensação de peso, como se a digestão demorasse.'

  return [
    { id: 'light_satisfied', label: leveLabel },
    { id: 'heavy_slow_digestion', label: pesadaLabel },
    { id: 'bloating_gas', label: 'Com estufamento, gases ou movimentos no abdômen.' },
    { id: 'heat_burning_acidity', label: 'Com calor, queimação, azia ou acidez.' },
    { id: 'sleepy_energy_drop', label: 'Com sono ou queda de energia.' },
    {
      id: 'unclear_pattern',
      label: 'Às vezes muito bem e outras vezes com desconforto, sem um padrão claro.',
    },
    { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true, exclusive: true },
    { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true, exclusive: true },
  ]
}

// Pergunta 4 — Retorno da fome (escolha única)
export const AYV_C2_P4_HUNGER_RETURN_OPTIONS = [
  { id: 'returns_quickly', label: 'A fome volta rapidamente.' },
  { id: 'regular_intervals', label: 'Retorna em intervalos relativamente regulares.' },
  { id: 'takes_long', label: 'Demora bastante para voltar.' },
  { id: 'wants_to_continue', label: 'Mesmo depois de comer, ainda sinto vontade de continuar.' },
  { id: 'varies_by_day', label: 'O intervalo varia muito de um dia para outro.' },
  { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true },
]

// Pergunta 5 — Alimentos exigentes (seleção múltipla, 3 exclusivos)
export const AYV_C2_P5_FOOD_DEMANDS_OPTIONS = [
  { id: 'fatty_heavy', label: 'Alimentos muito gordurosos ou pesados.' },
  { id: 'spicy_acidic', label: 'Alimentos apimentados, ácidos ou muito temperados.' },
  { id: 'raw_cold', label: 'Alimentos crus ou muito frios.' },
  { id: 'dairy', label: 'Leite e derivados.' },
  { id: 'beans_legumes_gas', label: 'Feijões, leguminosas ou alimentos que produzem gases.' },
  {
    id: 'digests_variety',
    label: 'Consigo digerir uma grande variedade sem desconforto frequente.',
    exclusive: true,
  },
  { id: 'no_pattern', label: 'Não percebo um padrão.', is_unsure: true, exclusive: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true, exclusive: true },
]

// Pergunta 6 — Ritmo intestinal (escolha única)
export const AYV_C2_P6_BOWEL_RHYTHM_OPTIONS = [
  { id: 'daily_regular', label: 'Evacuo de forma regular, geralmente todos os dias.' },
  { id: 'skips_days', label: 'Posso passar um ou mais dias sem evacuar.' },
  { id: 'multiple_daily', label: 'Evacuo mais de uma vez ao dia com frequência.' },
  { id: 'alternates_constip_loose', label: 'Alterno períodos de intestino preso e solto.' },
  {
    id: 'depends_routine_emotion',
    label: 'Depende muito da alimentação, da rotina ou do estado emocional.',
  },
  { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true },
]

// Pergunta 7 — Apresentação das fezes (escolha até duas)
export const AYV_C2_P7_STOOL_OPTIONS = [
  { id: 'dry_hard_difficult', label: 'Secas, duras ou difíceis de eliminar.' },
  { id: 'formed_easy', label: 'Formadas e eliminadas com facilidade.' },
  { id: 'soft_poorly_formed', label: 'Moles ou pouco formadas.' },
  { id: 'very_loose_watery', label: 'Muito soltas ou aquosas.' },
  { id: 'sticky_incomplete', label: 'Pegajosas ou com sensação de eliminação incompleta.' },
  { id: 'varies_lot', label: 'Variam bastante.' },
  { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true, exclusive: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true, exclusive: true },
]

// Pergunta 8 — Padrão do sono (escolha até duas)
export const AYV_C2_P8_SLEEP_OPTIONS = [
  { id: 'easy_deep', label: 'Adormeço com facilidade e durmo profundamente.' },
  { id: 'light_wakes_easy', label: 'Meu sono é leve e acordo com facilidade.' },
  { id: 'difficulty_falling_asleep', label: 'Tenho dificuldade para desligar e adormecer.' },
  { id: 'wakes_night', label: 'Acordo algumas vezes durante a noite.' },
  {
    id: 'long_sleep_hard_to_wake',
    label: 'Durmo por bastante tempo e ainda assim tenho dificuldade para levantar.',
  },
  { id: 'varies_period', label: 'Meu sono varia muito conforme o período.' },
  { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true, exclusive: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true, exclusive: true },
]

// Pergunta 9 — Despertar (escolha única)
export const AYV_C2_P9_WAKING_OPTIONS = [
  { id: 'rested_ready', label: 'Com sensação de recuperação e disposição.' },
  { id: 'quick_wake_little_sleep', label: 'Desperto rapidamente, mesmo tendo dormido pouco.' },
  { id: 'tired_insufficient', label: 'Com cansaço, como se o sono não tivesse sido suficiente.' },
  { id: 'heavy_body_slow_start', label: 'Com o corpo pesado e demorando para começar o dia.' },
  { id: 'depends_phase', label: 'Depende muito da fase que estou vivendo.' },
  { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true },
]

// Pergunta 10 — Distribuição de energia (escolha única)
export const AYV_C2_P10_ENERGY_OPTIONS = [
  { id: 'bursts_fluctuates', label: 'Surge rapidamente, mas pode oscilar ou acabar de repente.' },
  {
    id: 'intense_focused',
    label: 'Costuma ser intensa e direcionada, principalmente quando tenho um objetivo.',
  },
  { id: 'stable_throughout', label: 'Mantém-se relativamente estável ao longo do dia.' },
  {
    id: 'slow_to_appear_sustained',
    label: 'Demora para aparecer, mas consigo sustentar o que começo.',
  },
  { id: 'peaks_and_crashes', label: 'Tenho períodos de muita energia seguidos de cansaço.' },
  { id: 'varies_context', label: 'Varia muito conforme sono, alimentação, emoções ou rotina.' },
  { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true },
]

// Pergunta 11 — Ritmo corporal (escolha única)
export const AYV_C2_P11_BODY_PACE_OPTIONS = [
  { id: 'fast', label: 'Rápido: faço várias coisas e mudo de direção com facilidade.' },
  { id: 'intense', label: 'Intenso: concentro muita energia no que considero importante.' },
  { id: 'constant', label: 'Constante: prefiro seguir em um ritmo estável e previsível.' },
  {
    id: 'slow_persistent',
    label: 'Lento para começar, mas persistente depois que entro no ritmo.',
  },
  { id: 'varies_context', label: 'Meu ritmo muda bastante conforme o contexto.' },
  { id: 'dont_know', label: 'Não sei identificar.', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true },
]

// Pergunta 12 — Confiança histórica (escolha única)
export const AYV_C2_P12_CONFIDENCE_OPTIONS = [
  { id: 'many_years', label: 'Meu funcionamento habitual durante muitos anos.' },
  {
    id: 'mostly_habitual_recent_changes',
    label: 'Meu funcionamento habitual, embora algumas coisas tenham mudado recentemente.',
  },
  { id: 'mixture_past_present', label: 'Uma mistura entre como eu era e como estou atualmente.' },
  { id: 'mainly_present', label: 'Principalmente o meu momento atual.' },
  {
    id: 'hard_to_remember',
    label: 'Tenho dificuldade para lembrar como eu funcionava antes.',
    is_unsure: true,
  },
  { id: 'refusal', label: 'Prefiro não responder.', is_refusal: true },
]

// --------------------------------------------------------------------------
// STATUS E DERIVAÇÃO CANÔNICA DO CAPÍTULO 2
// --------------------------------------------------------------------------
export type AyurvedaChapter2Status =
  | 'not_started'
  | 'in_progress'
  | 'ready_to_complete'
  | 'completed'

/**
 * Derivação canônica explícita do status e progresso do Capítulo 2.
 * NUNCA lê enrollmentExp.progress_status.
 *
 * 1. canonicalResponses = registros vinculados estritamente aos prompts ayv_c2_*
 * 2. hasCompletionRecord = registro canônico explícito com completed: true e completed_at real.
 * 3. Status:
 *    - 0 perguntas respondidas -> 'not_started' (0% de progresso);
 *    - hasCompletionRecord && canonicalResponses.length > 0 (com pelo menos uma pergunta real respondida) -> 'completed' (100%);
 *    - todas as 12 perguntas respondidas (ou todos os 5 momentos concluídos), mas sem completion record -> 'ready_to_complete';
 *    - 1 a 11 perguntas respondidas sem completion record -> 'in_progress'.
 * 4. Progresso: percentual baseado nos cinco momentos (de 1 a 5).
 */
export function deriveChapter2Status(
  responses: Array<ExperienceResponseRecord | Record<string, any>> = [],
): {
  status: AyurvedaChapter2Status
  progress: number
  answeredCount: number
  totalQuestions: number
  answeredMomentsCount: number
  totalMoments: number
  firstUnansweredMoment: number
  hasCompletionRecord: boolean
  canonicalResponses: Array<ExperienceResponseRecord | Record<string, any>>
} {
  const totalQuestions = AYV_C2_TOTAL_QUESTIONS
  const totalMoments = AYV_C2_TOTAL_MOMENTS

  // Filtrar apenas respostas canônicas do Capítulo 2 (prefixo ayv_c2_)
  const canonicalResponses = (responses || []).filter((r) => {
    if (!r) return false
    const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id
    const sVal = (r as any).structured_value
    const promptKey =
      (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key

    const matchesId = typeof promptId === 'string' && promptId.startsWith('ayv_c2_')
    const matchesKey = typeof promptKey === 'string' && promptKey.startsWith('ayv_c2_')
    return matchesId || matchesKey
  })

  // Checar se há registro canônico explícito de conclusão do Capítulo 2
  const hasCompletionRecord = canonicalResponses.some((r) => {
    const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id
    const sVal = (r as any).structured_value
    const promptKey =
      (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key

    const isCompletionPrompt =
      promptId === AYV_C2_PROMPTS.CHAPTER_COMPLETION.id ||
      promptKey === AYV_C2_PROMPTS.CHAPTER_COMPLETION.key

    if (!isCompletionPrompt) return false

    const isCompletedVal =
      sVal?.completed === true || sVal?.value?.completed === true || sVal?.status === 'completed'

    const completedAt =
      sVal?.completed_at || sVal?.value?.completed_at || (r as any).updated || (r as any).created

    const hasValidDate = typeof completedAt === 'string' && completedAt.trim().length > 0

    return Boolean(isCompletedVal && hasValidDate)
  })

  // Contabilizar perguntas canônicas respondidas (distintas entre as 12 perguntas)
  const answeredPromptSet = new Set<string>()

  for (const r of canonicalResponses) {
    const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id
    const sVal = (r as any).structured_value
    const promptKey =
      (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key

    for (let i = 0; i < totalQuestions; i++) {
      const qKey = AYV_C2_QUESTION_PROMPT_KEYS[i]
      const qId = AYV_C2_QUESTION_PROMPT_IDS[i]
      if (promptKey === qKey || promptId === qId) {
        const hasValue =
          sVal !== undefined &&
          sVal !== null &&
          (typeof sVal === 'string'
            ? sVal.trim().length > 0
            : Array.isArray(sVal)
              ? sVal.length > 0
              : Array.isArray(sVal?.selectedOptionIds)
                ? sVal.selectedOptionIds.length > 0
                : Array.isArray(sVal?.value)
                  ? sVal.value.length > 0
                  : sVal?.value !== undefined || sVal?.choice !== undefined)

        const rawVal = (r as any).value || (r as any).response_value
        if (hasValue || rawVal !== undefined) {
          answeredPromptSet.add(qKey)
        }
      }
    }
  }

  const answeredCount = answeredPromptSet.size

  // Avaliar quais dos 5 momentos estão integralmente respondidos
  const answeredMoments = new Set<number>()
  for (let m = 1; m <= totalMoments; m++) {
    const requiredKeys = AYV_C2_MOMENT_PROMPT_KEYS[m] || []
    const allRequiredAnswered = requiredKeys.every((k) => answeredPromptSet.has(k))
    if (allRequiredAnswered) {
      answeredMoments.add(m)
    }
  }

  const answeredMomentsCount = answeredMoments.size

  // Identificar o primeiro momento ainda pendente (1 a 5)
  let firstUnansweredMoment = 1
  for (let m = 1; m <= totalMoments; m++) {
    if (!answeredMoments.has(m)) {
      firstUnansweredMoment = m
      break
    }
  }
  if (answeredMomentsCount === totalMoments) {
    firstUnansweredMoment = 5
  }

  // Quatro estados canônicos
  let status: AyurvedaChapter2Status = 'not_started'
  let progress = 0

  if (canonicalResponses.length === 0 || answeredCount === 0) {
    status = 'not_started'
    progress = 0
  } else if (hasCompletionRecord && answeredCount > 0) {
    status = 'completed'
    progress = 100
  } else if (answeredMomentsCount === totalMoments && answeredCount === totalQuestions) {
    status = 'ready_to_complete'
    progress = 95
  } else {
    status = 'in_progress'
    // Progresso baseado nos cinco momentos respondidos
    progress = Math.round((answeredMomentsCount / totalMoments) * 100)
    if (progress === 0 && answeredCount > 0) {
      progress = 15 // pequeno avanço inicial
    }
  }

  return {
    status,
    progress,
    answeredCount,
    totalQuestions,
    answeredMomentsCount,
    totalMoments,
    firstUnansweredMoment,
    hasCompletionRecord,
    canonicalResponses,
  }
}

// --------------------------------------------------------------------------
// RESUMO LITERAL ESTRUTURADO DO CAPÍTULO 2 (SEÇÃO 7 DA ESPECIFICAÇÃO)
// Organizado em:
// 1. Meu ritmo de fome
// 2. Como costumo digerir
// 3. Meu ritmo intestinal
// 4. Como costumo dormir e acordar
// 5. Como minha energia se distribui
// 6. Segurança da memória sobre esse padrão
// --------------------------------------------------------------------------
export interface Chapter2SummarySection {
  title: string
  items: Array<{ promptLabel: string; optionLabel: string; rawId: string }>
}

export function buildChapter2LiteralSummary(
  state: AyurvedaChapter2State,
  variant: Chapter2TreatmentVariant = 'neutro',
): Chapter2SummarySection[] {
  const p2Opts = getAyvC2P2Options(variant)
  const p3Opts = getAyvC2P3Options(variant)

  const findLabels = (
    selected: string[] | string | undefined,
    optionsList: { id: string; label: string }[],
  ): string[] => {
    if (!selected) return []
    const ids = Array.isArray(selected) ? selected : [selected]
    return ids
      .map((id) => {
        const found = optionsList.find((o) => o.id === id)
        return found ? found.label : id
      })
      .filter(Boolean)
  }

  const sections: Chapter2SummarySection[] = []

  // 1. Meu ritmo de fome (P1, P2)
  const hungerItems: Array<{ promptLabel: string; optionLabel: string; rawId: string }> = []
  if (state.hunger_pattern && state.hunger_pattern.length > 0) {
    for (const id of state.hunger_pattern) {
      const opt = AYV_C2_P1_HUNGER_OPTIONS.find((o) => o.id === id)
      hungerItems.push({
        promptLabel: 'Como a fome costuma funcionar',
        optionLabel: opt?.label || id,
        rawId: id,
      })
    }
  }
  if (state.delayed_meal_response && state.delayed_meal_response.length > 0) {
    for (const id of state.delayed_meal_response) {
      const opt = p2Opts.find((o) => o.id === id)
      hungerItems.push({
        promptLabel: 'Ao atrasar a refeição',
        optionLabel: opt?.label || id,
        rawId: id,
      })
    }
  }
  sections.push({ title: 'Meu ritmo de fome', items: hungerItems })

  // 2. Como costumo digerir (P3, P4, P5)
  const digestionItems: Array<{ promptLabel: string; optionLabel: string; rawId: string }> = []
  if (state.post_meal && state.post_meal.length > 0) {
    for (const id of state.post_meal) {
      const opt = p3Opts.find((o) => o.id === id)
      digestionItems.push({
        promptLabel: 'Após uma refeição habitual',
        optionLabel: opt?.label || id,
        rawId: id,
      })
    }
  }
  if (state.hunger_return) {
    const opt = AYV_C2_P4_HUNGER_RETURN_OPTIONS.find((o) => o.id === state.hunger_return)
    digestionItems.push({
      promptLabel: 'Retorno da fome',
      optionLabel: opt?.label || state.hunger_return,
      rawId: state.hunger_return,
    })
  }
  if (state.food_demands && state.food_demands.length > 0) {
    for (const id of state.food_demands) {
      const opt = AYV_C2_P5_FOOD_DEMANDS_OPTIONS.find((o) => o.id === id)
      digestionItems.push({
        promptLabel: 'Exigência na digestão',
        optionLabel: opt?.label || id,
        rawId: id,
      })
    }
  }
  sections.push({ title: 'Como costumo digerir', items: digestionItems })

  // 3. Meu ritmo intestinal (P6, P7)
  const bowelItems: Array<{ promptLabel: string; optionLabel: string; rawId: string }> = []
  if (state.bowel_rhythm) {
    const opt = AYV_C2_P6_BOWEL_RHYTHM_OPTIONS.find((o) => o.id === state.bowel_rhythm)
    bowelItems.push({
      promptLabel: 'Funcionamento do intestino',
      optionLabel: opt?.label || state.bowel_rhythm,
      rawId: state.bowel_rhythm,
    })
  }
  if (state.stool_pattern && state.stool_pattern.length > 0) {
    for (const id of state.stool_pattern) {
      const opt = AYV_C2_P7_STOOL_OPTIONS.find((o) => o.id === id)
      bowelItems.push({
        promptLabel: 'Apresentação das fezes',
        optionLabel: opt?.label || id,
        rawId: id,
      })
    }
  }
  sections.push({ title: 'Meu ritmo intestinal', items: bowelItems })

  // 4. Como costumo dormir e acordar (P8, P9)
  const sleepItems: Array<{ promptLabel: string; optionLabel: string; rawId: string }> = []
  if (state.sleep_pattern && state.sleep_pattern.length > 0) {
    for (const id of state.sleep_pattern) {
      const opt = AYV_C2_P8_SLEEP_OPTIONS.find((o) => o.id === id)
      sleepItems.push({
        promptLabel: 'Padrão do sono',
        optionLabel: opt?.label || id,
        rawId: id,
      })
    }
  }
  if (state.waking) {
    const opt = AYV_C2_P9_WAKING_OPTIONS.find((o) => o.id === state.waking)
    sleepItems.push({
      promptLabel: 'Como costuma acordar',
      optionLabel: opt?.label || state.waking,
      rawId: state.waking,
    })
  }
  sections.push({ title: 'Como costumo dormir e acordar', items: sleepItems })

  // 5. Como minha energia se distribui (P10, P11)
  const energyItems: Array<{ promptLabel: string; optionLabel: string; rawId: string }> = []
  if (state.energy_distribution) {
    const opt = AYV_C2_P10_ENERGY_OPTIONS.find((o) => o.id === state.energy_distribution)
    energyItems.push({
      promptLabel: 'Distribuição ao longo do dia',
      optionLabel: opt?.label || state.energy_distribution,
      rawId: state.energy_distribution,
    })
  }
  if (state.body_pace) {
    const opt = AYV_C2_P11_BODY_PACE_OPTIONS.find((o) => o.id === state.body_pace)
    energyItems.push({
      promptLabel: 'Ritmo corporal aproximado',
      optionLabel: opt?.label || state.body_pace,
      rawId: state.body_pace,
    })
  }
  sections.push({ title: 'Como minha energia se distribui', items: energyItems })

  // 6. Segurança da memória sobre esse padrão (P12)
  const confidenceItems: Array<{ promptLabel: string; optionLabel: string; rawId: string }> = []
  if (state.historical_confidence) {
    const opt = AYV_C2_P12_CONFIDENCE_OPTIONS.find((o) => o.id === state.historical_confidence)
    confidenceItems.push({
      promptLabel: 'Representatividade temporal',
      optionLabel: opt?.label || state.historical_confidence,
      rawId: state.historical_confidence,
    })
  }
  sections.push({ title: 'Segurança da memória sobre esse padrão', items: confidenceItems })

  return sections
}
