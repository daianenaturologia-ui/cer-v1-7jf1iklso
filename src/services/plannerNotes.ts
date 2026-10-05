import pb from '@/lib/pocketbase/client'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
export interface PlannerNote {
  id: string
  enrollment_id: string
  title: string
  note: string
  starts_at: string
  ends_at: string
  kind: 'focus' | 'rest' | 'life'
  status: 'planned' | 'completed' | 'archived'
}
export type PlannerNoteInput = Omit<PlannerNote, 'id'>
const key = 'cer-demo-planner-notes-v1'
export function validatePlannerNote(value: PlannerNoteInput) {
  if (
    !value.enrollment_id ||
    !value.title?.trim() ||
    value.title.length > 160 ||
    typeof value.note !== 'string' ||
    value.note.length > 5000
  )
    throw new Error('Dê um nome curto ao seu momento. A anotação pode ter até 5.000 caracteres.')
  const start = Date.parse(value.starts_at),
    end = Date.parse(value.ends_at)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 86400000)
    throw new Error('Escolha um horário final depois do início, com duração de até um dia.')
  if (
    !['focus', 'rest', 'life'].includes(value.kind) ||
    !['planned', 'completed', 'archived'].includes(value.status)
  )
    throw new Error('Confira o tipo e a situação do momento.')
}
function assertDemo(id: string, write = false) {
  if (id !== DEMO_ENROLLMENT_ID || (write && demoAdapter.getActivePersona() !== 'mariana'))
    throw new Error('Esta agenda pertence à interagente da demonstração.')
}
function read(): PlannerNote[] {
  const result = JSON.parse(localStorage.getItem(key) || '[]')
  if (!Array.isArray(result)) throw new Error('Não foi possível ler a agenda.')
  result.forEach(validatePlannerNote)
  return result
}
export const plannerNotesService = {
  async list(enrollmentId: string): Promise<PlannerNote[]> {
    if (demoAdapter.isEnabled()) {
      assertDemo(enrollmentId)
      return demoAdapter.getActivePersona() === 'mariana'
        ? read().filter((r) => r.enrollment_id === enrollmentId)
        : []
    }
    return pb.collection('cer_planner_notes').getFullList<PlannerNote>({
      filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
      requestKey: null,
    })
  },
  async save(value: PlannerNoteInput, id?: string): Promise<PlannerNote> {
    validatePlannerNote(value)
    const payload: PlannerNoteInput = {
      enrollment_id: value.enrollment_id,
      title: value.title.trim(),
      note: value.note,
      starts_at: value.starts_at,
      ends_at: value.ends_at,
      kind: value.kind,
      status: value.status,
    }
    if (demoAdapter.isEnabled()) {
      assertDemo(value.enrollment_id, true)
      const records = read()
      if (id && !records.find((r) => r.id === id && r.enrollment_id === value.enrollment_id))
        throw new Error('Momento não encontrado.')
      const saved = { ...payload, id: id || `demo-agenda-${crypto.randomUUID()}` }
      localStorage.setItem(
        key,
        JSON.stringify(id ? records.map((r) => (r.id === id ? saved : r)) : [...records, saved]),
      )
      return saved
    }
    return id
      ? pb.collection('cer_planner_notes').update<PlannerNote>(id, payload)
      : pb.collection('cer_planner_notes').create<PlannerNote>(payload)
  },
}
