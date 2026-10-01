import pb from '@/lib/pocketbase/client'
import { demoAdapter } from '@/services/demoAdapter'

export interface LifeEvent {
  id: string
  enrollment_id: string
  title: string
  time_kind: 'date' | 'year' | 'age' | 'unknown'
  time_value: string
  emotions: string[]
  narrative: string
  access_class: 'participant_private' | 'participant_shared'
  updated?: string
}
export type LifeEventInput = Omit<LifeEvent, 'id' | 'updated'>
export const LIFE_EMOTIONS = [
  'Alegria',
  'Tristeza',
  'Medo',
  'Raiva',
  'Vergonha',
  'Culpa',
  'Alívio',
  'Gratidão',
  'Não sei nomear',
]
export function validateLifeEvent(event: LifeEventInput, today = new Date()) {
  if (!event.title.trim() || event.title.length > 160)
    throw new Error('Dê um nome ao acontecimento (até 160 caracteres).')
  if (event.narrative.length > 20000) throw new Error('O relato pode ter até 20.000 caracteres.')
  if (!['date', 'year', 'age', 'unknown'].includes(event.time_kind))
    throw new Error('Escolha como informar quando aconteceu.')
  if (!['participant_private', 'participant_shared'].includes(event.access_class))
    throw new Error('Escolha a privacidade do relato.')
  if (!Array.isArray(event.emotions) || event.emotions.some((e) => !LIFE_EMOTIONS.includes(e)))
    throw new Error('Confira as emoções selecionadas.')
  if (event.time_kind === 'date') {
    const date = new Date(`${event.time_value}T12:00:00`)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(event.time_value) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== event.time_value ||
      event.time_value > today.toISOString().slice(0, 10)
    )
      throw new Error('Informe uma data válida até hoje.')
  }
  if (
    event.time_kind === 'year' &&
    (!/^\d{4}$/.test(event.time_value) ||
      +event.time_value < 1900 ||
      +event.time_value > today.getFullYear())
  )
    throw new Error('Informe um ano válido até o ano atual.')
  if (event.time_kind === 'age' && (!/^\d{1,3}$/.test(event.time_value) || +event.time_value > 130))
    throw new Error('Informe a idade aproximada entre 0 e 130 anos.')
}
export function lifeTimeLabel(event: Pick<LifeEvent, 'time_kind' | 'time_value'>) {
  if (event.time_kind === 'date') return event.time_value.split('-').reverse().join('/')
  if (event.time_kind === 'year') return `Por volta de ${event.time_value}`
  if (event.time_kind === 'age') return `Por volta dos ${event.time_value} anos`
  return 'Época não informada'
}
export function sharedLifeEvents(events: LifeEvent[], enrollmentId: string) {
  return events
    .filter((e) => e.enrollment_id === enrollmentId && e.access_class === 'participant_shared')
    .map((e) => ({ ...e, emotions: [...e.emotions] }))
}
export const demoLifeEvents = new Map<string, LifeEvent[]>()
export const lifeTimelineService = {
  async list(enrollmentId: string): Promise<LifeEvent[]> {
    if (demoAdapter.isEnabled()) {
      const stored = localStorage.getItem(`cer-demo-life-events-v1:${enrollmentId}`)
      const values: LifeEvent[] = stored
        ? JSON.parse(stored)
        : demoLifeEvents.get(enrollmentId) || []
      if (!Array.isArray(values)) throw new Error('Não foi possível ler os acontecimentos salvos.')
      for (const value of values) {
        validateLifeEvent(value)
        if (value.enrollment_id !== enrollmentId || typeof value.id !== 'string')
          throw new Error('Acontecimento inválido.')
      }
      demoLifeEvents.set(enrollmentId, values)
      return values
    }
    return pb.collection('cer_life_events').getFullList<LifeEvent>({
      filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
      sort: 'created',
      requestKey: null,
    })
  },
  async save(event: LifeEventInput, id?: string): Promise<LifeEvent> {
    validateLifeEvent(event)
    const data = {
      ...event,
      title: event.title.trim(),
      time_value: event.time_kind === 'unknown' ? '' : event.time_value,
    }
    if (demoAdapter.isEnabled()) {
      const values = await this.list(event.enrollment_id)
      if (id && !values.some((v) => v.id === id))
        throw new Error('Acontecimento não encontrado. Recarregue e tente novamente.')
      const record = {
        ...data,
        id: id || `demo-life-${crypto.randomUUID()}`,
        updated: new Date().toISOString(),
      }
      const next = id ? values.map((v) => (v.id === id ? record : v)) : [...values, record]
      localStorage.setItem(`cer-demo-life-events-v1:${event.enrollment_id}`, JSON.stringify(next))
      demoLifeEvents.set(event.enrollment_id, next)
      return record
    }
    return id
      ? pb.collection('cer_life_events').update<LifeEvent>(id, data)
      : pb.collection('cer_life_events').create<LifeEvent>(data)
  },
}
