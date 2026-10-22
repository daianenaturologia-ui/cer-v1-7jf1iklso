import type { DevelopmentResource } from './developmentCatalog'
import { validateResource } from './selfDevelopment'
import type { AgendaEvent } from './weeklyAgenda'

export interface PlanAction {
  id: string
  title: string
  context: string
  fallback: string
  resource?: DevelopmentResource
}
export interface PlanGoal {
  id: string
  title: string
  progress: string
  actions: PlanAction[]
}
export interface PlanDocument {
  title: string
  moment: string
  priorities: string
  goals: PlanGoal[]
  next_session: string
}
export interface PlanDraft {
  id: string
  enrollment_id: string
  author_id: string
  revision: number
  document: PlanDocument
  private_notes: string
}
export interface PlanVersion {
  id: string
  enrollment_id: string
  draft_id: string
  revision: number
  stage: 'building' | 'agreed'
  document: PlanDocument
  created: string
}
export interface RoutineSchedule {
  days: number[]
  time: string
  duration: number
  timezone: string
  until?: string
}
export interface PlanRoutine {
  id: string
  enrollment_id: string
  version_id: string
  action_id: string
  effective_day: string
  enabled: boolean
  schedule: RoutineSchedule
  snapshot: { goal: string; progress: string; action: PlanAction }
  command_key: string
  created: string
}
export const emptyPlanDocument = (): PlanDocument => ({
  title: 'Plano de Desenvolvimento',
  moment: '',
  priorities: '',
  goals: [],
  next_session: '',
})
export const newPlanAction = (): PlanAction => ({
  id: crypto.randomUUID(),
  title: '',
  context: '',
  fallback: '',
})
export const newPlanGoal = (): PlanGoal => ({
  id: crypto.randomUUID(),
  title: '',
  progress: '',
  actions: [],
})
export function validatePlanDocument(doc: PlanDocument, stage?: PlanVersion['stage']) {
  if (!doc || typeof doc !== 'object') throw new Error('Confira o plano.')
  for (const key of ['title', 'moment', 'priorities', 'next_session'] as const) {
    if (typeof doc[key] !== 'string' || doc[key].length > (key === 'title' ? 160 : 10000))
      throw new Error('Confira os textos do plano.')
  }
  if (!doc.title.trim() || !Array.isArray(doc.goals) || doc.goals.length > 12)
    throw new Error('Informe o título e até 12 metas.')
  const ids = new Set<string>()
  function identifier(id: string) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id) || ids.has(id))
      throw new Error('Cada meta e ação precisa de uma identificação única.')
    ids.add(id)
  }
  for (const goal of doc.goals) {
    identifier(goal.id)
    for (const text of [goal.title, goal.progress])
      if (typeof text !== 'string' || text.length > 5000) throw new Error('Confira a meta.')
    if (!Array.isArray(goal.actions) || goal.actions.length > 12)
      throw new Error('Use até 12 ações por meta.')
    for (const action of goal.actions) {
      identifier(action.id)
      for (const text of [action.title, action.context, action.fallback])
        if (typeof text !== 'string' || text.length > 5000) throw new Error('Confira a ação.')
      if (action.resource) validateResource(action.resource)
      if (stage === 'agreed' && (!action.title.trim() || !action.context.trim()))
        throw new Error('Complete a ação e como ela será experimentada antes de combinar o plano.')
    }
    if (stage === 'agreed' && (!goal.title.trim() || !goal.progress.trim() || !goal.actions.length))
      throw new Error('Cada meta combinada precisa de um sinal de avanço e ao menos uma ação.')
  }
  if (stage === 'agreed' && doc.goals.filter((g) => g.id !== 'cer-integrative-care').length > 1)
    throw new Error(
      'Escolham uma meta principal para este ciclo. As demais podem ficar na lista de possibilidades.',
    )
  if (stage && !doc.moment.trim())
    throw new Error('Escreva a síntese do momento antes de compartilhar.')
  if (
    stage === 'agreed' &&
    (!doc.priorities.trim() || !doc.goals.some((g) => g.id !== 'cer-integrative-care'))
  )
    throw new Error('Definam as prioridades e ao menos uma meta antes de combinar o plano.')
}
export function dayInZone(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const get = (type: string) => parts.find((p) => p.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}
export function validDay(day: string) {
  const date = new Date(day + 'T12:00:00Z')
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === day
  )
}
export function validateRoutine(schedule: RoutineSchedule, day: string) {
  if (schedule?.until && (!validDay(schedule.until) || schedule.until < day))
    throw new Error('A data final precisa ser igual ou posterior ao início.')
  if (!validDay(day)) throw new Error('Escolha a data de início.')
  if (
    !schedule ||
    !Array.isArray(schedule.days) ||
    !schedule.days.length ||
    schedule.days.length > 7 ||
    new Set(schedule.days).size !== schedule.days.length ||
    schedule.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
  )
    throw new Error('Escolha os dias da semana.')
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time) ||
    !Number.isInteger(schedule.duration) ||
    schedule.duration < 5 ||
    schedule.duration > 240
  )
    throw new Error('Confira horário e duração (5 a 240 minutos).')
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: schedule.timezone }).format()
  } catch {
    throw new Error('Confira o fuso horário.')
  }
}
/** Convert wall-clock time to an instant; reject nonexistent DST times. */
export function zonedInstant(day: string, time: string, timezone: string): string | null {
  const target = Date.parse(`${day}T${time}:00Z`)
  let candidate = target
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  for (let i = 0; i < 4; i++) {
    const parts = format.formatToParts(new Date(candidate))
    const part = (key: string) => parts.find((p) => p.type === key)!.value
    const wall = `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}Z`
    const delta = target - Date.parse(wall)
    if (!delta) return new Date(candidate).toISOString()
    candidate += delta
  }
  return null
}
/** Append-only routine revisions keep previous weeks intact. No background writes. */
export function routineEvents(routines: PlanRoutine[], week: Date): AgendaEvent[] {
  const end = new Date(week)
  end.setDate(end.getDate() + 7)
  const result: AgendaEvent[] = []
  const groups = new Map<string, PlanRoutine[]>()
  for (const routine of routines)
    groups.set(routine.action_id, [...(groups.get(routine.action_id) || []), routine])
  for (const versions of groups.values()) {
    for (let offset = -1; offset <= 8; offset++) {
      const ref = new Date(week)
      ref.setDate(ref.getDate() + offset)
      ref.setHours(12, 0, 0, 0)
      // All revisions use the requested calendar day; timezone changes remain explicit.
      const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-${String(ref.getDate()).padStart(2, '0')}`
      const current = versions
        .filter((v) => v.effective_day <= key)
        .sort(
          (a, b) =>
            b.effective_day.localeCompare(a.effective_day) ||
            b.created.localeCompare(a.created) ||
            b.id.localeCompare(a.id),
        )[0]
      if (
        !current?.enabled ||
        (!!current.schedule.until && key > current.schedule.until) ||
        !current.schedule.days.includes(new Date(key + 'T12:00:00Z').getUTCDay())
      )
        continue
      const start = zonedInstant(key, current.schedule.time, current.schedule.timezone)
      if (!start || Date.parse(start) < week.getTime() || Date.parse(start) >= end.getTime())
        continue
      result.push({
        id: `routine:${current.id}:${key}`,
        title: current.snapshot.action.title,
        start,
        end: new Date(Date.parse(start) + current.schedule.duration * 60000).toISOString(),
        kind: 'development',
      })
    }
  }
  return result
}
