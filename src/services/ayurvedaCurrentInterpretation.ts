import type { ExperienceResponseRecord } from '@/types/cer'
import {
  AYV_C3_CURRENT_DURATION_OPTIONS,
  AYV_C3_FREQUENCY_OPTIONS,
  AYV_C3_PROMPTS,
  AYV_C3_AREA_DEFINITIONS,
  getResponseAnsweredAt,
  loadChapter3State,
  type AyurvedaC3AreaId,
} from './ayurvedaChapter3'
import {
  AYURVEDA_C3_CURRENT_AREA_IDS,
  getCurrentAreaRecordFromState,
} from './ayurvedaCurrentBodyFactual'
import type { DoshaEvidence } from './ayurvedaInterpretationEngine'

/** Only a completed C3 snapshot enters interpretation; later drafts cannot overwrite it. */
export function completedCurrentResponses(responses: ExperienceResponseRecord[]) {
  const key = (r: ExperienceResponseRecord) =>
    (r as any).prompt_key || (r.structured_value as any)?.metadata?.prompt_key || r.prompt_id
  const active = responses.filter(
    (r) =>
      !['draft', 'discarded', 'superseded'].includes(r.status) &&
      !(
        (r.structured_value as any)?.metadata?.explicit_unsure ||
        (r.structured_value as any)?.metadata?.explicit_refusal
      ),
  )
  const completions = active
    .filter(
      (r) =>
        key(r) === AYV_C3_PROMPTS.COMPLETION.key && (r.structured_value as any)?.completed === true,
    )
    .sort(
      (a, b) =>
        getResponseAnsweredAt(a).localeCompare(getResponseAnsweredAt(b)) ||
        a.id.localeCompare(b.id),
    )
  const completion = completions.at(-1)
  if (!completion) return []
  const revision =
    (completion.structured_value as any)?.metadata?.chapter_revision_number ??
    (completion.structured_value as any)?.revision_number ??
    (completion.structured_value as any)?.metadata?.revision_number
  return active.filter((r) => {
    const recordRevision =
      (r.structured_value as any)?.metadata?.chapter_revision_number ??
      (r.structured_value as any)?.revision_number ??
      (r.structured_value as any)?.metadata?.revision_number
    return (
      String(key(r)).startsWith('ayv_c3_') &&
      getResponseAnsweredAt(r) <= getResponseAnsweredAt(completion) &&
      (revision === undefined || recordRevision === revision)
    )
  })
}

type Dosha = 'Vata' | 'Pitta' | 'Kapha'
const rules: Partial<Record<AyurvedaC3AreaId, Partial<Record<Dosha, string[]>>>> = {
  hunger: {
    Vata: ['variable_intensity', 'changes_routine_emotion'],
    Pitta: ['sudden_intense'],
    Kapha: ['light_slow', 'long_without_hunger'],
  },
  post_meal: {
    Vata: ['bloating_gas', 'unclear_pattern'],
    Pitta: ['heat_burning_acidity'],
    Kapha: ['heavy_slow_digestion', 'sleepy_energy_drop'],
  },
  elimination: {
    Vata: ['dry_hard_difficult', 'alternates_constip_loose', 'skips_days'],
    Pitta: ['soft_or_loose'],
    Kapha: ['sticky_incomplete'],
  },
  sleep: {
    Vata: ['light_wakes_easy', 'difficulty_falling_asleep', 'wakes_night', 'varies_period'],
    Kapha: ['long_sleep_hard_to_wake'],
  },
  temperature: { Vata: ['cold_easily', 'alternates'], Pitta: ['heat_easily'] },
  skin: { Vata: ['dry_rough'], Pitta: ['warm_sensitive'] },
}
export function interpretCurrentBody(responses: ExperienceResponseRecord[]) {
  const completed = completedCurrentResponses(responses)
  const state = loadChapter3State(completed)
  const evidences: Record<Dosha, DoshaEvidence[]> = { Vata: [], Pitta: [], Kapha: [] }
  const facts: string[] = []
  const domains = state.changed_domains || []
  const conflicting =
    domains.includes('no_current_changes') &&
    AYURVEDA_C3_CURRENT_AREA_IDS.some(
      (id) => getCurrentAreaRecordFromState(state, id)?.comparison === 'different',
    )
  const blocked = domains.some((d) => ['no_current_changes', 'dont_know', 'refusal'].includes(d))
  for (const id of AYURVEDA_C3_CURRENT_AREA_IDS) {
    const record = getCurrentAreaRecordFromState(state, id)
    if (!record) continue
    const def = AYV_C3_AREA_DEFINITIONS[id]
    const values = record.current_states || []
    const valid = def.options.filter(
      (o) => values.includes(o.id) && !['dont_know', 'refusal'].includes(o.id),
    )
    if (valid.length && !values.some((v) => ['dont_know', 'refusal'].includes(v)))
      facts.push(`${def.title}: ${valid.map((o) => o.label).join('; ')}.`)
    const eligible =
      !blocked &&
      !conflicting &&
      record.comparison === 'different' &&
      AYV_C3_CURRENT_DURATION_OPTIONS.some((o) => o.id === record.duration) &&
      !['dont_know', 'refusal'].includes(record.duration) &&
      AYV_C3_FREQUENCY_OPTIONS.some((o) => o.id === record.frequency) &&
      !['dont_know', 'refusal'].includes(record.frequency) &&
      valid.length === values.length &&
      !values.some((v) => ['dont_know', 'refusal'].includes(v))
    if (!eligible) continue
    for (const dosha of ['Vata', 'Pitta', 'Kapha'] as const) {
      const matching = valid.filter((o) => rules[id]?.[dosha]?.includes(o.id))
      if (matching.length)
        evidences[dosha].push({
          dosha,
          category: def.title,
          sourceQuestionTitle: def.title,
          literalText: matching.map((o) => o.label).join('; '),
          observation: `Mudança declarada em relação ao habitual, com duração e frequência registradas; compatível com ${dosha} na leitura tradicional.`,
        })
    }
  }
  const doshas = (['Vata', 'Pitta', 'Kapha'] as const).filter((d) => evidences[d].length >= 2)
  const basis = doshas.flatMap((d) =>
    evidences[d].map((e) => `${e.sourceQuestionTitle}: ${e.literalText}`),
  )
  const summary = doshas.length
    ? `Suas respostas atuais sugerem alterações de ${doshas.join('–')}, com sinais convergentes em áreas diferentes do corpo: ${[...new Set(basis)].join('; ')}.`
    : conflicting
      ? 'Há registros que não concordam: ausência geral de mudanças e mudanças específicas em algumas áreas. Por isso, a hipótese de Vikriti permanece em observação; os relatos específicos foram preservados.'
      : !completed.length
        ? 'Leitura de Vikriti em observação: faltam dados atuais de um capítulo concluído. Os relatos habituais descrevem sua base e não comprovam mudança recente.'
        : blocked
          ? domains.includes('no_current_changes')
            ? 'Você não relatou mudanças importantes em relação ao habitual. Sua percepção atual mostra continuidade dos ritmos que reconhece como habituais.'
            : 'Seu momento atual ainda precisa ser caracterizado. Os campos que você preferiu deixar em aberto foram preservados dessa forma.'
          : 'Há mudanças relatadas que ainda não sustentam uma combinação de doshas: faltam sinais convergentes em duas áreas distintas, com comparação, duração e frequência definidas. A leitura descreve os sinais registrados e mantém a hipótese de Vikriti em observação.'
  const usable = (id: AyurvedaC3AreaId) => {
    const values = getCurrentAreaRecordFromState(state, id)?.current_states || []
    return values.some((v) => ['dont_know', 'refusal'].includes(v)) ? [] : values
  }
  return {
    completed: completed.length > 0,
    state,
    facts,
    evidences,
    doshas,
    summary,
    hunger: usable('hunger'),
    postMeal: usable('post_meal'),
    elimination: usable('elimination'),
  }
}
