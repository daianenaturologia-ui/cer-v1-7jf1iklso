import {
  AYV_C3_AREA_DEFINITIONS,
  AYV_C3_COMPARISON_OPTIONS,
  AYV_C3_CONTEXT_OPTIONS,
  AYV_C3_CURRENT_DURATION_OPTIONS,
  AYV_C3_FREQUENCY_OPTIONS,
  AYV_C3_OPERATIONAL_REFERENCE_TEXT,
  type AyurvedaC3AreaId,
  type AyurvedaChapter3State,
  type AyurvedaCurrentAreaRecord,
} from './ayurvedaChapter3'

export const AYURVEDA_C3_CURRENT_AREA_IDS: readonly AyurvedaC3AreaId[] = [
  'hunger',
  'post_meal',
  'elimination',
  'sleep',
  'temperature',
  'skin',
] as const

export interface AyurvedaCurrentAreaFactualItem {
  areaId: AyurvedaC3AreaId
  title: string
  currentStates: string[]
  comparison?: string
  comparisonId?: string
  isDifferent: boolean
  duration?: string
  frequency?: string
  contexts: string[]
  /**
   * Resumo em texto compacto ou linhas estruturadas compartilhado por C4 e pela visão profissional
   */
  summaryLines: { label: string; value: string }[]
}

export interface AyurvedaCurrentBodyFactualBlock {
  title: string
  referenceText: string
  hasAnyData: boolean
  items: AyurvedaCurrentAreaFactualItem[]
}

export function getCurrentAreaRecordFromState(
  state: AyurvedaChapter3State,
  areaId: AyurvedaC3AreaId,
): AyurvedaCurrentAreaRecord | undefined {
  switch (areaId) {
    case 'hunger':
      return state.current_hunger
    case 'post_meal':
      return state.current_post_meal
    case 'elimination':
      return state.current_elimination
    case 'sleep':
      return state.current_sleep
    case 'temperature':
      return state.current_temperature
    case 'skin':
      return state.current_skin
    default:
      return undefined
  }
}

/**
 * Formata os dados factuais registrados das 6 áreas de "Como meu corpo está agora" (últimos 14 dias).
 *
 * Regras estritas:
 * - Duração, frequência e contexto aparecem SOMENTE quando a comparação for "different".
 *   Se for same_as_usual, hard_to_compare, dont_know ou refusal, detalhes obsoletos NÃO aparecem.
 * - Incerteza e recusa aparecem literais quando registradas.
 * - Múltiplas seleções preservadas literalmente (ex: até 2 seleções).
 * - Ausência do bloco nunca vira equilíbrio/normalidade.
 */
export function formatCurrentAreaRecord(
  areaId: AyurvedaC3AreaId,
  record?: AyurvedaCurrentAreaRecord,
): AyurvedaCurrentAreaFactualItem | null {
  if (!record) return null
  const def = AYV_C3_AREA_DEFINITIONS[areaId]
  if (!def) return null

  const hasStates = Boolean(record.current_states && record.current_states.length > 0)
  const hasComparison = Boolean(record.comparison)

  if (!hasStates && !hasComparison) {
    return null
  }

  const currentStates = (record.current_states || []).map(
    (id) => def.options.find((o) => o.id === id)?.label || id,
  )

  const compOption = record.comparison
    ? AYV_C3_COMPARISON_OPTIONS.find((c) => c.id === record.comparison)
    : undefined
  const comparison = compOption ? compOption.label : record.comparison

  const isDifferent = record.comparison === 'different'

  const duration =
    isDifferent && record.duration
      ? AYV_C3_CURRENT_DURATION_OPTIONS.find((d) => d.id === record.duration)?.label ||
        record.duration
      : undefined

  const frequency =
    isDifferent && record.frequency
      ? AYV_C3_FREQUENCY_OPTIONS.find((f) => f.id === record.frequency)?.label || record.frequency
      : undefined

  const contexts =
    isDifferent && record.contexts && record.contexts.length > 0
      ? record.contexts.map((cId) => AYV_C3_CONTEXT_OPTIONS.find((c) => c.id === cId)?.label || cId)
      : []

  const summaryLines: { label: string; value: string }[] = []
  if (currentStates.length > 0) {
    summaryLines.push({ label: 'Percepção atual', value: currentStates.join('; ') })
  }
  if (comparison) {
    summaryLines.push({ label: 'Comparação com o habitual', value: comparison })
  }
  if (duration) {
    summaryLines.push({ label: 'Duração da mudança', value: duration })
  }
  if (frequency) {
    summaryLines.push({ label: 'Frequência', value: frequency })
  }
  if (contexts.length > 0) {
    summaryLines.push({ label: 'Contexto', value: contexts.join('; ') })
  }

  return {
    areaId,
    title: def.title,
    currentStates,
    comparison,
    comparisonId: record.comparison,
    isDifferent,
    duration,
    frequency,
    contexts,
    summaryLines,
  }
}

export function buildAyurvedaCurrentBodyFactualBlock(
  state: AyurvedaChapter3State,
): AyurvedaCurrentBodyFactualBlock {
  const items: AyurvedaCurrentAreaFactualItem[] = []

  for (const areaId of AYURVEDA_C3_CURRENT_AREA_IDS) {
    const rec = getCurrentAreaRecordFromState(state, areaId)
    const formatted = formatCurrentAreaRecord(areaId, rec)
    if (formatted) {
      items.push(formatted)
    }
  }

  return {
    title: 'Como meu corpo está agora',
    referenceText: 'últimos 14 dias',
    hasAnyData: items.length > 0,
    items,
  }
}
