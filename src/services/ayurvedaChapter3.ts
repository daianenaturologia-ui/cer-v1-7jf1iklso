import type { ExperienceResponseRecord } from '@/types/cer'

export const AYURVEDA_CHAPTER_3_ID = 'capitulo-3-diferente-agora'
export const AYURVEDA_CHAPTER_3_VERSION = '1.1.0'

export const AYV_C3_PROMPTS = {
  DOMAINS: { id: 'ayv_c3_changed_domains', key: 'ayv_c3_changed_domains', step_order: 1 },
  DIRECTIONS: { id: 'ayv_c3_change_directions', key: 'ayv_c3_change_directions', step_order: 2 },
  STARTED_AT: { id: 'ayv_c3_started_change_at', key: 'ayv_c3_started_change_at', step_order: 3 },
  CONTEXTS: { id: 'ayv_c3_change_contexts', key: 'ayv_c3_change_contexts', step_order: 4 },
  MEDICATION_STATUS: {
    id: 'ayv_c3_medication_status',
    key: 'ayv_c3_medication_status',
    step_order: 5,
  },
  MEDICATION_DETAILS: {
    id: 'ayv_c3_medication_details',
    key: 'ayv_c3_medication_details',
    step_order: 5,
  },
  NOTE: { id: 'ayv_c3_optional_note', key: 'ayv_c3_optional_note', step_order: 5 },
  COMPLETION: { id: 'ayv_c3_chapter_completion', key: 'ayv_c3_chapter_completion', step_order: 5 },

  // Novas coletas opcionais por área atual (Microbloco 3B)
  CURRENT_HUNGER: { id: 'ayv_c3_current_hunger', key: 'ayv_c3_current_hunger', step_order: 5 },
  CURRENT_POST_MEAL: {
    id: 'ayv_c3_current_post_meal',
    key: 'ayv_c3_current_post_meal',
    step_order: 5,
  },
  CURRENT_ELIMINATION: {
    id: 'ayv_c3_current_elimination',
    key: 'ayv_c3_current_elimination',
    step_order: 5,
  },
  CURRENT_SLEEP: { id: 'ayv_c3_current_sleep', key: 'ayv_c3_current_sleep', step_order: 5 },
  CURRENT_TEMPERATURE: {
    id: 'ayv_c3_current_temperature',
    key: 'ayv_c3_current_temperature',
    step_order: 5,
  },
  CURRENT_SKIN: { id: 'ayv_c3_current_skin', key: 'ayv_c3_current_skin', step_order: 5 },
} as const

export const AYV_C3_DOMAIN_OPTIONS = [
  { id: 'structure_weight', label: 'Estrutura corporal ou peso' },
  { id: 'skin_hair', label: 'Pele ou cabelo' },
  { id: 'temperature_thirst_sweat', label: 'Temperatura, sede ou transpiração' },
  { id: 'hunger_digestion', label: 'Fome ou digestão' },
  { id: 'elimination', label: 'Eliminação intestinal' },
  { id: 'sleep', label: 'Sono e recuperação' },
  { id: 'energy_pace', label: 'Energia ou ritmo do corpo' },
  { id: 'no_current_changes', label: 'Não percebo mudanças importantes agora', exclusive: true },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

export const AYV_C3_MEDICATION_STATUS_OPTIONS = [
  { id: 'current_use', label: 'Uso atualmente' },
  { id: 'recent_change', label: 'Comecei, parei ou alterei algo recentemente' },
  { id: 'no_use', label: 'Não uso medicamentos ou suplementos atualmente' },
  { id: 'dont_know', label: 'Não sei informar' },
  { id: 'prefer_session', label: 'Prefiro conversar sobre isso no encontro' },
] as const

export const AYV_C3_MEDICATION_TIMING_OPTIONS = [
  { id: 'ongoing_stable', label: 'Uso contínuo, sem mudança recente' },
  { id: 'started_recently', label: 'Comecei recentemente' },
  { id: 'dose_changed', label: 'A dose ou frequência mudou' },
  { id: 'stopped_recently', label: 'Parei recentemente' },
  { id: 'as_needed', label: 'Uso somente quando necessário' },
  { id: 'dont_know', label: 'Não sei informar' },
] as const

export type AyurvedaMedicationStatus =
  | 'current_use'
  | 'recent_change'
  | 'no_use'
  | 'dont_know'
  | 'prefer_session'

export interface AyurvedaMedicationItem {
  id: string
  kind: 'medication' | 'supplement'
  name: string
  dose?: string
  frequency?: string
  purpose?: string
  timing?: string
  started_or_changed_at?: string
  perceived_changes?: string
}

export const AYV_C3_DIRECTION_OPTIONS = [
  { id: 'increased', label: 'Aumentou ou ficou mais intenso' },
  { id: 'decreased', label: 'Diminuiu ou ficou mais fraco' },
  { id: 'irregular', label: 'Ficou mais irregular ou variável' },
  { id: 'different', label: 'Está diferente, sem uma direção simples' },
  { id: 'improved', label: 'Melhorou em relação ao meu habitual' },
  { id: 'dont_know', label: 'Não sei identificar' },
] as const

// Same direction identifiers, expressed in the area the participant is observing.
// Examples guide recognition without asserting a symptom or interpreting old responses.
const SKIN_HAIR_DIRECTION_LABELS: Record<string, string> = {
  increased: 'Uma característica da pele ou do cabelo ficou mais intensa',
  decreased: 'Uma característica da pele ou do cabelo diminuiu',
  irregular: 'As características da pele ou do cabelo variam mais',
  different: 'Percebo outra mudança na pele ou no cabelo',
  improved: 'Minha pele ou meu cabelo melhoraram em relação ao habitual',
}

export const AYV_C3_SKIN_HAIR_HELP =
  'Pense no que mudou, como ressecamento, oleosidade, sensibilidade, textura ou queda de cabelo. Escolha a opção que mais se aproxima dessa mudança.'

export function chapter3DirectionOptions(domain: string) {
  return AYV_C3_DIRECTION_OPTIONS.map((option) => ({
    ...option,
    label:
      domain === 'skin_hair' ? SKIN_HAIR_DIRECTION_LABELS[option.id] || option.label : option.label,
  }))
}

export const AYV_C3_STARTED_OPTIONS = [
  { id: 'last_week', label: 'Na última semana' },
  { id: 'last_month', label: 'Nas últimas semanas' },
  { id: 'one_to_three_months', label: 'Entre 1 e 3 meses' },
  { id: 'three_to_six_months', label: 'Entre 3 e 6 meses' },
  { id: 'six_to_twelve_months', label: 'Entre 6 meses e 1 ano' },
  { id: 'more_than_year', label: 'Há mais de 1 ano' },
  { id: 'gradual', label: 'Foi acontecendo aos poucos' },
  { id: 'dont_know', label: 'Não sei identificar' },
] as const

// --------------------------------------------------------------------------
// NOVAS COLETAS OPCIONAIS POR ÁREA (MICROBLOCO 3B)
// --------------------------------------------------------------------------

export const AYV_C3_OPERATIONAL_REFERENCE_TEXT =
  'Pense nos últimos 14 dias. Se algo começou antes, você poderá registrar isso. Compare com o que era habitual para você, especialmente quando se sentia relativamente bem.'

export const AYV_C3_CONTEXT_PROMPT_INSTRUCTION =
  'O que estava acontecendo nesse período? Isso registra contexto, sem afirmar causa.'

export const AYV_C3_COMPARISON_OPTIONS = [
  { id: 'same_as_usual', label: 'Parecido com meu habitual' },
  { id: 'different', label: 'Diferente do meu habitual' },
  { id: 'hard_to_compare', label: 'É difícil comparar' },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

export type AyurvedaC3ComparisonOption =
  | 'same_as_usual'
  | 'different'
  | 'hard_to_compare'
  | 'dont_know'
  | 'refusal'

export const AYV_C3_CURRENT_DURATION_OPTIONS = [
  ...AYV_C3_STARTED_OPTIONS,
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

export const AYV_C3_FREQUENCY_OPTIONS = [
  { id: 'few_days', label: 'Em poucos dias' },
  { id: 'several_days', label: 'Em vários dias' },
  { id: 'almost_every_day', label: 'Quase todos os dias' },
  { id: 'varies_lot', label: 'Varia bastante' },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

export type AyurvedaC3FrequencyOption =
  | 'few_days'
  | 'several_days'
  | 'almost_every_day'
  | 'varies_lot'
  | 'dont_know'
  | 'refusal'

// 1. Fome (espelha C2 P1 no presente, sem "habitual")
export const AYV_C3_CURRENT_HUNGER_OPTIONS = [
  { id: 'regular_hours', label: 'Aparece em horários relativamente previsíveis' },
  { id: 'sudden_intense', label: 'Surge de repente e pode ficar muito intensa' },
  {
    id: 'variable_intensity',
    label: 'Às vezes aparece com força e outras vezes quase não aparece',
  },
  { id: 'light_slow', label: 'Costuma ser leve e demorar para surgir' },
  { id: 'long_without_hunger', label: 'Passo muito tempo sem perceber fome' },
  { id: 'changes_routine_emotion', label: 'Muda muito conforme a rotina ou o estado emocional' },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

// 2. Sensação após comer / digestão (espelha C2 P3 no presente, sem "habitual")
export const AYV_C3_CURRENT_POST_MEAL_OPTIONS = [
  { id: 'light_satisfied', label: 'Sensação leve, confortável e com satisfação' },
  { id: 'heavy_slow_digestion', label: 'Sensação de peso, como se a digestão demorasse' },
  { id: 'bloating_gas', label: 'Com estufamento, gases ou movimentos no abdômen' },
  { id: 'heat_burning_acidity', label: 'Com calor, queimação, azia ou acidez' },
  { id: 'sleepy_energy_drop', label: 'Com sono ou queda de energia' },
  {
    id: 'unclear_pattern',
    label: 'Às vezes muito bem e outras vezes com desconforto, sem um padrão claro',
  },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

// 3. Eliminação intestinal (espelha C2 P6 e P7 no presente, sem "habitual")
export const AYV_C3_CURRENT_ELIMINATION_OPTIONS = [
  { id: 'daily_regular', label: 'Regular, geralmente todos os dias' },
  { id: 'dry_hard_difficult', label: 'Fezes secas, duras ou difíceis de eliminar' },
  { id: 'formed_easy', label: 'Fezes formadas e eliminadas com facilidade' },
  { id: 'soft_or_loose', label: 'Fezes moles, pouco formadas ou muito soltas' },
  { id: 'alternates_constip_loose', label: 'Alterno períodos de intestino preso e solto' },
  { id: 'skips_days', label: 'Passo um ou mais dias sem evacuar' },
  { id: 'multiple_daily', label: 'Evacuo mais de uma vez ao dia com frequência' },
  { id: 'sticky_incomplete', label: 'Pegajosas ou com sensação de eliminação incompleta' },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

// 4. Sono (espelha C2 P8 no presente, sem "habitual")
export const AYV_C3_CURRENT_SLEEP_OPTIONS = [
  { id: 'easy_deep', label: 'Adormeço com facilidade e durmo profundamente' },
  { id: 'light_wakes_easy', label: 'Meu sono está leve e acordo com facilidade' },
  { id: 'difficulty_falling_asleep', label: 'Tenho dificuldade para desligar e adormecer' },
  { id: 'wakes_night', label: 'Acordo algumas vezes durante a noite' },
  {
    id: 'long_sleep_hard_to_wake',
    label: 'Durmo por bastante tempo e ainda assim tenho dificuldade para levantar',
  },
  { id: 'varies_period', label: 'Meu sono varia muito' },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

// 5. Sensação de temperatura (espelha C1 Tela 4 no presente, sem "habitual", nunca combinada com pele)
export const AYV_C3_CURRENT_TEMPERATURE_OPTIONS = [
  { id: 'cold_easily', label: 'Sinto frio com facilidade, especialmente nas mãos e nos pés' },
  { id: 'heat_easily', label: 'Sinto calor com facilidade e desconforto em ambientes quentes' },
  { id: 'stable', label: 'Minha temperatura está relativamente estável' },
  { id: 'alternates', label: 'Alterno bastante entre frio e calor' },
  { id: 'varies_climate', label: 'Depende muito do clima ou do momento' },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

// 6. Pele (espelha C1 Tela 2 no presente, sem "habitual", nunca combinada com temperatura)
export const AYV_C3_CURRENT_SKIN_OPTIONS = [
  { id: 'dry_rough', label: 'Está seca, áspera ou repuxando com facilidade' },
  { id: 'thin_reactive', label: 'Está fina ou delicada e reage facilmente ao ambiente' },
  { id: 'warm_sensitive', label: 'Está quente, sensível ou avermelhando com facilidade' },
  { id: 'balanced', label: 'Mantém textura e hidratação relativamente equilibradas' },
  { id: 'soft_oily', label: 'Está macia, úmida ou naturalmente oleosa' },
  { id: 'varies_region', label: 'Comporta-se de maneiras diferentes conforme a região' },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true, epistemic: 'unsure' },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true, epistemic: 'refusal' },
] as const

export interface AyurvedaCurrentAreaRecord {
  area_key: string
  current_states?: string[]
  comparison?: AyurvedaC3ComparisonOption
  duration?: string
  frequency?: AyurvedaC3FrequencyOption
  contexts?: string[]
}

export type AyurvedaC3AreaId =
  | 'hunger'
  | 'post_meal'
  | 'elimination'
  | 'sleep'
  | 'temperature'
  | 'skin'

export interface AyurvedaC3AreaDefinition {
  id: AyurvedaC3AreaId
  promptKey: string
  title: string
  questionText: string
  options: readonly { id: string; label: string; exclusive?: boolean; epistemic?: string }[]
  maxStates: number
}

export const AYV_C3_AREA_DEFINITIONS: Record<AyurvedaC3AreaId, AyurvedaC3AreaDefinition> = {
  hunger: {
    id: 'hunger',
    promptKey: AYV_C3_PROMPTS.CURRENT_HUNGER.key,
    title: 'Fome',
    questionText: 'Como está sua fome nestes últimos 14 dias?',
    options: AYV_C3_CURRENT_HUNGER_OPTIONS,
    maxStates: 2,
  },
  post_meal: {
    id: 'post_meal',
    promptKey: AYV_C3_PROMPTS.CURRENT_POST_MEAL.key,
    title: 'Sensação após comer / digestão',
    questionText: 'Como está sua sensação após comer ou digestão nestes últimos 14 dias?',
    options: AYV_C3_CURRENT_POST_MEAL_OPTIONS,
    maxStates: 2,
  },
  elimination: {
    id: 'elimination',
    promptKey: AYV_C3_PROMPTS.CURRENT_ELIMINATION.key,
    title: 'Eliminação intestinal',
    questionText: 'Como está sua eliminação intestinal nestes últimos 14 dias?',
    options: AYV_C3_CURRENT_ELIMINATION_OPTIONS,
    maxStates: 2,
  },
  sleep: {
    id: 'sleep',
    promptKey: AYV_C3_PROMPTS.CURRENT_SLEEP.key,
    title: 'Sono',
    questionText: 'Como está seu sono nestes últimos 14 dias?',
    options: AYV_C3_CURRENT_SLEEP_OPTIONS,
    maxStates: 2,
  },
  temperature: {
    id: 'temperature',
    promptKey: AYV_C3_PROMPTS.CURRENT_TEMPERATURE.key,
    title: 'Sensação de temperatura',
    questionText: 'Como está sua sensação de temperatura nestes últimos 14 dias?',
    options: AYV_C3_CURRENT_TEMPERATURE_OPTIONS,
    maxStates: 2,
  },
  skin: {
    id: 'skin',
    promptKey: AYV_C3_PROMPTS.CURRENT_SKIN.key,
    title: 'Pele',
    questionText: 'Como está sua pele nestes últimos 14 dias?',
    options: AYV_C3_CURRENT_SKIN_OPTIONS,
    maxStates: 2,
  },
}

export const AYV_C3_CONTEXT_OPTIONS = [
  { id: 'climate', label: 'Clima ou estação do ano' },
  { id: 'stress', label: 'Estresse ou acontecimentos emocionais' },
  { id: 'routine', label: 'Mudança de rotina' },
  { id: 'sleep', label: 'Mudanças no sono' },
  { id: 'food', label: 'Alimentação' },
  { id: 'hormones', label: 'Hormônios ou ciclo' },
  { id: 'medication', label: 'Medicação' },
  { id: 'supplement', label: 'Suplemento' },
  { id: 'illness', label: 'Doença ou condição de saúde' },
  { id: 'surgery', label: 'Cirurgia ou procedimento' },
  { id: 'other', label: 'Outro contexto' },
  { id: 'none_identified', label: 'Não relaciono a nenhum contexto', exclusive: true },
  { id: 'dont_know', label: 'Não sei identificar', exclusive: true },
  { id: 'refusal', label: 'Prefiro não responder', exclusive: true },
] as const

export interface AyurvedaChapter3State {
  changed_domains?: string[]
  change_directions?: Record<string, string>
  started_change_at?: string
  change_contexts?: string[]
  medication_status?: AyurvedaMedicationStatus
  medication_items?: AyurvedaMedicationItem[]
  optional_note?: string

  // Novas coletas opcionais por área
  current_hunger?: AyurvedaCurrentAreaRecord
  current_post_meal?: AyurvedaCurrentAreaRecord
  current_elimination?: AyurvedaCurrentAreaRecord
  current_sleep?: AyurvedaCurrentAreaRecord
  current_temperature?: AyurvedaCurrentAreaRecord
  current_skin?: AyurvedaCurrentAreaRecord
}

export type AyurvedaChapter3Status =
  | 'not_started'
  | 'in_progress'
  | 'ready_to_complete'
  | 'completed'

const valueOf = (response: ExperienceResponseRecord): any => {
  const value = response.structured_value as any
  return value?.value ?? value?.selectedOptionIds ?? value
}

export function isChapter3Response(response: ExperienceResponseRecord): boolean {
  const id = (response as any).canonical_prompt_id || response.prompt_id
  const key =
    (response as any).prompt_key || (response.structured_value as any)?.metadata?.prompt_key
  return String(id || '').startsWith('ayv_c3_') || String(key || '').startsWith('ayv_c3_')
}

export function getResponseKey(response: ExperienceResponseRecord): string {
  return (
    (response as any).prompt_key ||
    (response.structured_value as any)?.metadata?.prompt_key ||
    (response as any).canonical_prompt_id ||
    response.prompt_id ||
    ''
  )
}

export function getResponseAnsweredAt(response: ExperienceResponseRecord): string {
  const meta = (response.structured_value as any)?.metadata
  return (
    meta?.answered_at ||
    (response.structured_value as any)?.completed_at ||
    response.updated ||
    response.created ||
    ''
  )
}

export function loadChapter3State(responses: ExperienceResponseRecord[]): AyurvedaChapter3State {
  const state: AyurvedaChapter3State = {}
  const filtered = responses.filter(isChapter3Response)

  // Deduplicação estável por prompt_key:
  // Agrupa respostas por key e escolhe a mais recente por answered_at com desempate estável por id/index
  const latestByKey = new Map<string, ExperienceResponseRecord>()

  // Anotamos o índice de entrada para desempate previsível caso answered_at e id sejam iguais
  filtered.forEach((resp, index) => {
    const key = getResponseKey(resp)
    if (!key) return
    const existing = latestByKey.get(key)
    if (!existing) {
      latestByKey.set(key, resp)
      return
    }

    const timeCurrent = getResponseAnsweredAt(resp)
    const timeExisting = getResponseAnsweredAt(existing)

    if (timeCurrent > timeExisting) {
      latestByKey.set(key, resp)
    } else if (timeCurrent === timeExisting) {
      const idCurrent = String(resp.id || '')
      const idExisting = String(existing.id || '')
      if (idCurrent > idExisting) {
        latestByKey.set(key, resp)
      } else if (!idCurrent && !idExisting) {
        // Fallback para manter o último na ordem de varredura
        latestByKey.set(key, resp)
      }
    }
  })

  for (const [key, response] of latestByKey.entries()) {
    const value = valueOf(response)
    if (key === AYV_C3_PROMPTS.DOMAINS.key)
      state.changed_domains = Array.isArray(value) ? value : []
    if (key === AYV_C3_PROMPTS.DIRECTIONS.key) state.change_directions = value || {}
    if (key === AYV_C3_PROMPTS.STARTED_AT.key) state.started_change_at = value
    if (key === AYV_C3_PROMPTS.CONTEXTS.key)
      state.change_contexts = Array.isArray(value) ? value : []
    if (key === AYV_C3_PROMPTS.MEDICATION_STATUS.key) state.medication_status = value
    if (key === AYV_C3_PROMPTS.MEDICATION_DETAILS.key)
      state.medication_items = Array.isArray(value) ? value : []
    if (key === AYV_C3_PROMPTS.NOTE.key) state.optional_note = String(value || '')

    // Novas coletas opcionais por área
    if (key === AYV_C3_PROMPTS.CURRENT_HUNGER.key)
      state.current_hunger = value && typeof value === 'object' ? value : undefined
    if (key === AYV_C3_PROMPTS.CURRENT_POST_MEAL.key)
      state.current_post_meal = value && typeof value === 'object' ? value : undefined
    if (key === AYV_C3_PROMPTS.CURRENT_ELIMINATION.key)
      state.current_elimination = value && typeof value === 'object' ? value : undefined
    if (key === AYV_C3_PROMPTS.CURRENT_SLEEP.key)
      state.current_sleep = value && typeof value === 'object' ? value : undefined
    if (key === AYV_C3_PROMPTS.CURRENT_TEMPERATURE.key)
      state.current_temperature = value && typeof value === 'object' ? value : undefined
    if (key === AYV_C3_PROMPTS.CURRENT_SKIN.key)
      state.current_skin = value && typeof value === 'object' ? value : undefined
  }
  return state
}

export function deriveChapter3Status(responses: ExperienceResponseRecord[]) {
  const chapterResponses = responses.filter(isChapter3Response)
  const state = loadChapter3State(chapterResponses)
  const completed = chapterResponses.some((response) => {
    const key =
      (response as any).prompt_key ||
      (response.structured_value as any)?.metadata?.prompt_key ||
      (response as any).canonical_prompt_id ||
      response.prompt_id
    return (
      key === AYV_C3_PROMPTS.COMPLETION.key &&
      (response.structured_value as any)?.completed === true
    )
  })
  const domains = state.changed_domains || []
  const shortPath = domains.some((id) =>
    ['no_current_changes', 'dont_know', 'refusal'].includes(id),
  )
  const directionsComplete =
    shortPath ||
    (domains.length > 0 && domains.every((domain) => Boolean(state.change_directions?.[domain])))
  const answeredSteps = [
    domains.length > 0,
    directionsComplete,
    shortPath || Boolean(state.started_change_at),
    shortPath || Boolean(state.change_contexts?.length),
  ].filter(Boolean).length
  const ready =
    domains.length > 0 &&
    directionsComplete &&
    (shortPath || (Boolean(state.started_change_at) && Boolean(state.change_contexts?.length)))
  const firstUnansweredStep = !domains.length
    ? 1
    : !directionsComplete
      ? 2
      : !shortPath && !state.started_change_at
        ? 3
        : !shortPath && !state.change_contexts?.length
          ? 4
          : 5
  const status: AyurvedaChapter3Status = completed
    ? 'completed'
    : ready
      ? 'ready_to_complete'
      : chapterResponses.length > 0
        ? 'in_progress'
        : 'not_started'
  return { status, state, answeredSteps, totalSteps: 4, firstUnansweredStep, shortPath }
}

export const chapter3Label = (options: readonly { id: string; label: string }[], id?: string) =>
  options.find((option) => option.id === id)?.label || id || 'Ainda não respondido'
