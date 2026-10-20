import pb from '@/lib/pocketbase/client'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'

export interface RoutineMoment {
  time: string
  activity: string
}
export interface DailyRoutine {
  id: string
  enrollment_id: string
  day_label: string
  moments: RoutineMoment[]
  access_class: 'participant_private' | 'participant_shared'
  updated?: string
}
export type DailyRoutineInput = Omit<DailyRoutine, 'id' | 'updated'>
export function validateDailyRoutine(value: DailyRoutineInput) {
  if (typeof value.day_label !== 'string' || value.day_label.length > 100)
    throw new Error('Descreva o dia em até 100 caracteres.')
  if (!['participant_private', 'participant_shared'].includes(value.access_class))
    throw new Error('Confira o compartilhamento da rotina.')
  if (!Array.isArray(value.moments) || !value.moments.length || value.moments.length > 64)
    throw new Error('Registre de 1 a 64 momentos do seu dia.')
  for (const moment of value.moments) {
    if (
      !moment ||
      typeof moment.time !== 'string' ||
      (moment.time !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(moment.time)) ||
      typeof moment.activity !== 'string' ||
      !moment.activity.trim() ||
      moment.activity.length > 500
    )
      throw new Error('Confira os horários e descreva cada atividade em até 500 caracteres.')
  }
}
const storageKey = (id: string) => `cer-demo-daily-routine-v1:${id}`
export const dailyRoutineService = {
  async load(enrollmentId: string, readOnly = false): Promise<DailyRoutine | null> {
    if (demoAdapter.isEnabled()) {
      if (enrollmentId !== DEMO_ENROLLMENT_ID) throw new Error('Rotina de outra pessoa.')
      const value: DailyRoutine | null = JSON.parse(
        localStorage.getItem(storageKey(enrollmentId)) || 'null',
      )
      if (value) {
        validateDailyRoutine(value)
        if (value.enrollment_id !== enrollmentId) throw new Error('Rotina de outra pessoa.')
      }
      return value &&
        (readOnly || demoAdapter.getActivePersona() === 'daiane') &&
        value.access_class !== 'participant_shared'
        ? null
        : value
    }
    const values = await pb.collection('cer_daily_routines').getFullList<DailyRoutine>({
      filter: pb.filter(
        readOnly
          ? 'enrollment_id = {:id} && access_class = "participant_shared"'
          : 'enrollment_id = {:id}',
        { id: enrollmentId },
      ),
      requestKey: null,
    })
    return values[0] || null
  },
  async save(value: DailyRoutineInput, id?: string): Promise<DailyRoutine> {
    validateDailyRoutine(value)
    const data = {
      ...value,
      day_label: value.day_label.trim(),
      moments: value.moments.map((m) => ({ time: m.time, activity: m.activity.trim() })),
    }
    if (demoAdapter.isEnabled()) {
      if (
        value.enrollment_id !== DEMO_ENROLLMENT_ID ||
        demoAdapter.getActivePersona() !== 'mariana'
      )
        throw new Error('Somente a pessoa pode editar sua rotina.')
      const current = await this.load(value.enrollment_id)
      if (id && current?.id !== id) throw new Error('Reabra sua rotina antes de editar.')
      const record = {
        ...data,
        id: current?.id || crypto.randomUUID(),
        updated: new Date().toISOString(),
      }
      localStorage.setItem(storageKey(value.enrollment_id), JSON.stringify(record))
      return record
    }
    return id
      ? pb.collection('cer_daily_routines').update<DailyRoutine>(id, data)
      : pb.collection('cer_daily_routines').create<DailyRoutine>(data)
  },
}
