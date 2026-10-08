import type { ExperienceResponseRecord } from '@/types/cer'
import {
  AYV_C1_PROMPTS,
  AYV_TELA1_DURATION_OPTIONS,
  AYV_TELA1_STRUCTURE_OPTIONS,
  AYV_TELA2_SKIN_OPTIONS,
  AYV_TELA3_HAIR_OPTIONS,
  AYV_TELA4_TEMPERATURE_OPTIONS,
  AYV_TELA5_DRINK_TEMP_OPTIONS,
  AYV_TELA5_SWEAT_OPTIONS,
  AYV_TELA5_THIRST_OPTIONS,
  getChapter1BasePromptId,
  getChapter1ResponseRevisionNumber,
  migrateLegacyChapter1Responses,
} from './ayurvedaChapter1'
import {
  AYV_C2_P10_ENERGY_OPTIONS,
  AYV_C2_P11_BODY_PACE_OPTIONS,
  AYV_C2_P12_CONFIDENCE_OPTIONS,
  AYV_C2_P1_HUNGER_OPTIONS,
  AYV_C2_P4_HUNGER_RETURN_OPTIONS,
  AYV_C2_P5_FOOD_DEMANDS_OPTIONS,
  AYV_C2_P6_BOWEL_RHYTHM_OPTIONS,
  AYV_C2_P7_STOOL_OPTIONS,
  AYV_C2_P8_SLEEP_OPTIONS,
  AYV_C2_P9_WAKING_OPTIONS,
  AYV_C2_PROMPTS,
  getAyvC2P2Options,
  getAyvC2P3Options,
  getChapter2BasePromptId,
  getResponseRevisionNumber,
  migrateLegacyChapter2Responses,
} from './ayurvedaChapter2'
import {
  AYV_C3_CONTEXT_OPTIONS,
  chapter3DirectionOptions,
  AYV_C3_DOMAIN_OPTIONS,
  AYV_C3_MEDICATION_STATUS_OPTIONS,
  AYV_C3_MEDICATION_TIMING_OPTIONS,
  AYV_C3_STARTED_OPTIONS,
  chapter3Label,
  deriveChapter3Status,
} from './ayurvedaChapter3'

export const AYURVEDA_CHAPTER_4_ID = 'capitulo-4-corpo-sintese'
export const AYURVEDA_CHAPTER_4_VERSION = '1.0.0'
export const AYV_C4_COMPLETION = {
  id: 'ayv_c4_chapter_completion',
  key: 'ayv_c4_chapter_completion',
  step_order: 1,
} as const

export interface Chapter4LiteralItem {
  title: string
  value: string
}

import {
  AYURVEDA_C3_CURRENT_AREA_IDS,
  buildAyurvedaCurrentBodyFactualBlock,
  getCurrentAreaRecordFromState,
  type AyurvedaCurrentBodyFactualBlock,
} from './ayurvedaCurrentBodyFactual'

export interface Chapter4Synthesis {
  historical: Chapter4LiteralItem[]
  habitual: Chapter4LiteralItem[]
  current: Chapter4LiteralItem[]
  currentBody?: AyurvedaCurrentBodyFactualBlock
  questionsForSession: Chapter4LiteralItem[]
}

const rawValue = (response: ExperienceResponseRecord) => {
  const value = response.structured_value as any
  return value?.selectedOptionIds ?? value?.value ?? value?.choice
}

const labelValue = (raw: unknown, options: readonly { id: string; label: string }[]) => {
  const ids = Array.isArray(raw) ? raw : raw == null ? [] : [raw]
  return ids.map((id) => options.find((option) => option.id === id)?.label || String(id)).join('; ')
}

const latestCompletedRevision = (
  responses: ExperienceResponseRecord[],
  completionKey: string,
  getRevision: (response: ExperienceResponseRecord) => number,
  getBase: (value: string) => string,
) => {
  const completed = responses
    .filter((response) => {
      const key =
        (response as any).prompt_key ||
        (response.structured_value as any)?.metadata?.prompt_key ||
        response.prompt_id
      return (
        getBase(key || '') === completionKey &&
        (response.structured_value as any)?.completed === true
      )
    })
    .map(getRevision)
  return completed.length ? Math.max(...completed) : null
}

export function buildChapter4Synthesis(responses: ExperienceResponseRecord[]): Chapter4Synthesis {
  const c1 = migrateLegacyChapter1Responses(responses).migratedResponses
  const c2 = migrateLegacyChapter2Responses(responses).migratedResponses
  const c1Revision = latestCompletedRevision(
    c1,
    AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
    getChapter1ResponseRevisionNumber,
    getChapter1BasePromptId,
  )
  const c2Revision = latestCompletedRevision(
    c2,
    AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
    getResponseRevisionNumber,
    getChapter2BasePromptId,
  )

  const historicalDefinitions = [
    [AYV_C1_PROMPTS.P1_STRUCTURE.key, 'Estrutura corporal habitual', AYV_TELA1_STRUCTURE_OPTIONS],
    [AYV_C1_PROMPTS.P1_DURATION.key, 'Estabilidade ao longo da vida', AYV_TELA1_DURATION_OPTIONS],
    [AYV_C1_PROMPTS.P2_SKIN.key, 'Pele habitual', AYV_TELA2_SKIN_OPTIONS],
    [AYV_C1_PROMPTS.P3_HAIR.key, 'Cabelo habitual', AYV_TELA3_HAIR_OPTIONS],
    [
      AYV_C1_PROMPTS.P4_TEMPERATURE.key,
      'Temperatura corporal habitual',
      AYV_TELA4_TEMPERATURE_OPTIONS,
    ],
    [AYV_C1_PROMPTS.P5_THIRST.key, 'Sede habitual', AYV_TELA5_THIRST_OPTIONS],
    [AYV_C1_PROMPTS.P5_DRINK_TEMP.key, 'Bebida mais confortável', AYV_TELA5_DRINK_TEMP_OPTIONS],
    [AYV_C1_PROMPTS.P5_SWEAT.key, 'Transpiração habitual', AYV_TELA5_SWEAT_OPTIONS],
  ] as const
  const habitualDefinitions = [
    [AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key, 'Fome habitual', AYV_C2_P1_HUNGER_OPTIONS],
    [AYV_C2_PROMPTS.P2_DELAYED_MEAL.key, 'Quando demora para comer', getAyvC2P2Options()],
    [AYV_C2_PROMPTS.P3_POST_MEAL.key, 'Depois de comer', getAyvC2P3Options()],
    [AYV_C2_PROMPTS.P4_HUNGER_RETURN.key, 'Retorno da fome', AYV_C2_P4_HUNGER_RETURN_OPTIONS],
    [
      AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key,
      'Alimentos que exigem mais',
      AYV_C2_P5_FOOD_DEMANDS_OPTIONS,
    ],
    [AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key, 'Ritmo intestinal', AYV_C2_P6_BOWEL_RHYTHM_OPTIONS],
    [AYV_C2_PROMPTS.P7_STOOL_PATTERN.key, 'Características da eliminação', AYV_C2_P7_STOOL_OPTIONS],
    [AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key, 'Sono habitual', AYV_C2_P8_SLEEP_OPTIONS],
    [AYV_C2_PROMPTS.P9_WAKING.key, 'Como costuma acordar', AYV_C2_P9_WAKING_OPTIONS],
    [
      AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key,
      'Energia ao longo do dia',
      AYV_C2_P10_ENERGY_OPTIONS,
    ],
    [AYV_C2_PROMPTS.P11_BODY_PACE.key, 'Ritmo de ação', AYV_C2_P11_BODY_PACE_OPTIONS],
    [
      AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
      'Representatividade desse padrão',
      AYV_C2_P12_CONFIDENCE_OPTIONS,
    ],
  ] as const

  const toItems = (
    source: ExperienceResponseRecord[],
    revision: number | null,
    definitions: readonly (readonly [string, string, readonly { id: string; label: string }[]])[],
    getRevision: (response: ExperienceResponseRecord) => number,
    getBase: (value: string) => string,
  ) => {
    if (revision === null) return []
    return definitions.flatMap(([key, title, options]) => {
      const found = source.find((response) => {
        const responseKey =
          (response as any).prompt_key ||
          (response.structured_value as any)?.metadata?.prompt_key ||
          response.prompt_id
        return getRevision(response) === revision && getBase(responseKey || '') === key
      })
      return found ? [{ title, value: labelValue(rawValue(found), options) }] : []
    })
  }

  const historical = toItems(
    c1,
    c1Revision,
    historicalDefinitions,
    getChapter1ResponseRevisionNumber,
    getChapter1BasePromptId,
  )
  const habitual = toItems(
    c2,
    c2Revision,
    habitualDefinitions,
    getResponseRevisionNumber,
    getChapter2BasePromptId,
  )
  const promptTitles = new Map<string, string>([
    ...historicalDefinitions.map(([key, title]) => [key, title] as const),
    ...habitualDefinitions.map(([key, title]) => [key, title] as const),
  ])
  const c3 = deriveChapter3Status(responses).state
  const current: Chapter4LiteralItem[] = []
  const questionsForSession: Chapter4LiteralItem[] = []
  for (const domain of c3.changed_domains || []) {
    if (['no_current_changes', 'dont_know', 'refusal'].includes(domain)) {
      current.push({
        title: 'Mudanças atuais',
        value: chapter3Label(AYV_C3_DOMAIN_OPTIONS, domain),
      })
      continue
    }
    const direction = c3.change_directions?.[domain]
    current.push({
      title: chapter3Label(AYV_C3_DOMAIN_OPTIONS, domain),
      value: direction
        ? chapter3Label(chapter3DirectionOptions(domain), direction)
        : chapter3Label(AYV_C3_DOMAIN_OPTIONS, domain),
    })
  }
  if (c3.started_change_at)
    current.push({
      title: 'Quando começou',
      value: chapter3Label(AYV_C3_STARTED_OPTIONS, c3.started_change_at),
    })
  if (c3.change_contexts?.length)
    current.push({
      title: 'Contextos percebidos',
      value: c3.change_contexts.map((id) => chapter3Label(AYV_C3_CONTEXT_OPTIONS, id)).join('; '),
    })
  if (c3.medication_status)
    current.push({
      title: 'Medicamentos e suplementos',
      value: chapter3Label(AYV_C3_MEDICATION_STATUS_OPTIONS, c3.medication_status),
    })
  for (const item of c3.medication_items || []) {
    const details = [
      item.kind === 'supplement' ? 'Suplemento' : 'Medicamento',
      item.dose,
      item.frequency,
      item.timing ? chapter3Label(AYV_C3_MEDICATION_TIMING_OPTIONS, item.timing) : '',
      item.started_or_changed_at ? `início ou mudança: ${item.started_or_changed_at}` : '',
      item.purpose ? `uso informado: ${item.purpose}` : '',
    ].filter(Boolean)
    current.push({ title: item.name, value: details.join(' • ') })
    if (item.perceived_changes)
      questionsForSession.push({
        title: `Percepção após mudança em ${item.name}`,
        value: item.perceived_changes,
      })
  }
  if (c3.optional_note) current.push({ title: 'Registro espontâneo', value: c3.optional_note })

  const currentBody = buildAyurvedaCurrentBodyFactualBlock(c3)

  const questionResponses = [
    ...c1.filter(
      (response) =>
        c1Revision !== null && getChapter1ResponseRevisionNumber(response) === c1Revision,
    ),
    ...c2.filter(
      (response) => c2Revision !== null && getResponseRevisionNumber(response) === c2Revision,
    ),
  ]
  for (const response of questionResponses) {
    const key =
      (response as any).prompt_key ||
      (response.structured_value as any)?.metadata?.prompt_key ||
      response.prompt_id ||
      ''
    if (String(key).startsWith('ayv_c3_current_')) {
      continue
    }
    const value = response.structured_value as any
    const raw = rawValue(response)
    const metadata = value?.metadata || {}
    const needsConversation =
      metadata.explicit_unsure ||
      metadata.explicit_refusal ||
      metadata.contradiction_flag ||
      raw === 'changed_lot' ||
      (Array.isArray(raw) && raw.some((id) => ['dont_know', 'refusal', 'changed_lot'].includes(id)))
    if (!needsConversation) continue
    const baseKey = String(key).startsWith('ayv_c1_')
      ? getChapter1BasePromptId(String(key))
      : getChapter2BasePromptId(String(key))
    questionsForSession.push({
      title: promptTitles.get(baseKey) || 'Resposta para conversar na sessão',
      value: metadata.explicit_refusal
        ? 'A interagente preferiu não responder.'
        : metadata.explicit_unsure
          ? 'A interagente não soube identificar.'
          : 'Foi registrada mudança ou contradição que merece contexto.',
    })
  }

  // Avaliação de dúvida (dont_know) ou recusa (refusal) ATIVA nos dados atuais ayv_c3_current_*
  // Subcampos de duração, frequência e contexto só existem vigentes quando comparison === 'different'
  let hasActiveCurrentUnsureOrRefusal = false
  for (const areaId of AYURVEDA_C3_CURRENT_AREA_IDS) {
    const areaRecord = getCurrentAreaRecordFromState(c3, areaId)
    if (!areaRecord) continue

    const isUnsureOrRefusal = (val: unknown) =>
      val === 'dont_know' || val === 'refusal' || val === 'unsure'
    const hasInArray = (arr: unknown) => Array.isArray(arr) && arr.some(isUnsureOrRefusal)

    if (isUnsureOrRefusal(areaRecord.comparison)) {
      hasActiveCurrentUnsureOrRefusal = true
      break
    }
    if (hasInArray(areaRecord.current_states)) {
      hasActiveCurrentUnsureOrRefusal = true
      break
    }

    // Subcampos condicionais: apenas se a comparação for 'different'
    if (areaRecord.comparison === 'different') {
      if (isUnsureOrRefusal(areaRecord.duration)) {
        hasActiveCurrentUnsureOrRefusal = true
        break
      }
      if (isUnsureOrRefusal(areaRecord.frequency)) {
        hasActiveCurrentUnsureOrRefusal = true
        break
      }
      if (hasInArray(areaRecord.contexts)) {
        hasActiveCurrentUnsureOrRefusal = true
        break
      }
    }
  }

  if (hasActiveCurrentUnsureOrRefusal) {
    questionsForSession.push({
      title: 'Ponto para conversar com Daiane',
      value:
        'Se quiser, você pode conversar com Daiane sobre as respostas em que marcou dúvida ou preferiu não responder.',
    })
  }

  return { historical, habitual, current, currentBody, questionsForSession }
}

export function isChapter4Completed(responses: ExperienceResponseRecord[]) {
  return responses.some((response) => {
    const key =
      (response as any).prompt_key ||
      (response.structured_value as any)?.metadata?.prompt_key ||
      response.prompt_id
    return key === AYV_C4_COMPLETION.key && (response.structured_value as any)?.completed === true
  })
}
