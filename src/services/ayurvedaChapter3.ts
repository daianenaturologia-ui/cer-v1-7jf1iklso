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

export function loadChapter3State(responses: ExperienceResponseRecord[]): AyurvedaChapter3State {
  const state: AyurvedaChapter3State = {}
  for (const response of responses.filter(isChapter3Response)) {
    const key =
      (response as any).prompt_key ||
      (response.structured_value as any)?.metadata?.prompt_key ||
      (response as any).canonical_prompt_id ||
      response.prompt_id
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
