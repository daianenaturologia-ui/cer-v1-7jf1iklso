import {
  addDays,
  distanceDays,
  localDay,
  validDay,
  type CycleEntry,
  type CycleProfile,
} from './cycleJournal'
/** Descriptive calendar estimate, not an ovulation or fertility model. All calculations stay local. */
export function cycleHistory(entries: CycleEntry[], profile: CycleProfile, today = localDay()) {
  const starts = [
    ...new Set(
      entries
        .filter(
          (e) =>
            e.enrollment_id === profile.enrollment_id &&
            e.period_start &&
            validDay(e.day) &&
            e.day <= today &&
            ['Leve', 'Moderado', 'Intenso'].includes(e.bleeding),
        )
        .map((e) => e.day),
    ),
  ].sort()
  const intervals = starts.slice(1).map((s, i) => distanceDays(starts[i], s))
  const recent = intervals.slice(-6)
  const sorted = [...recent].sort((a, b) => a - b)
  const median = sorted.length
    ? Math.round(
        (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2,
      )
    : 0
  const min = recent.length ? Math.min(...recent) : 0,
    max = recent.length ? Math.max(...recent) : 0
  let reason = '',
    next: string | undefined,
    basis: 'history' | 'reported' | undefined
  if (profile.context !== 'natural')
    reason =
      'Neste momento de vida, acompanhe os inícios e os sintomas; o calendário não oferece uma previsão confiável para você.'
  else if (!starts.length)
    reason = 'Marque o primeiro dia da menstruação para começar a acompanhar os intervalos.'
  else if (recent.some((n) => n < 21 || n > 45) || max - min > 7)
    reason =
      'Os intervalos registrados variam ou pedem conferência. Vamos observar mais ciclos, conferir as datas de início e conversar sobre as mudanças antes de estimar a próxima menstruação.'
  else if (recent.length >= 3) {
    next = addDays(starts.at(-1)!, median)
    basis = 'history'
  } else if (profile.cycle_length) {
    next = addDays(starts.at(-1)!, profile.cycle_length)
    basis = 'reported'
  } else
    reason =
      'Ainda há poucos ciclos completos para uma estimativa pessoal. Continue marcando cada início; com três intervalos registrados, o calendário poderá sugerir uma referência.'
  return {
    starts,
    intervals,
    recent,
    median,
    min,
    max,
    next,
    basis,
    reason,
    pastReference: !!next && next < today,
  }
}
