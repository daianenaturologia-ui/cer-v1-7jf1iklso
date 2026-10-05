import pb from '@/lib/pocketbase/client'
import { demoAdapter } from '@/services/demoAdapter'

export interface LifeDirection {
  id: string
  enrollment_id: string
  kind: 'present' | 'future'
  horizon: 'now' | 'short' | 'medium' | 'long' | 'open'
  title: string
  narrative: string
  meaning: string
  resources: string
  limits: string
  first_step: string
  access_class: 'participant_private' | 'participant_shared'
  created?: string
  updated?: string
}
export type LifeDirectionInput = Omit<LifeDirection, 'id' | 'created' | 'updated'>
export const LIFE_HORIZONS = {
  now: 'Presente',
  short: 'Curto prazo',
  medium: 'Médio prazo',
  long: 'Longo prazo',
  open: 'Ainda sem prazo',
}
export const LIFE_DIRECTION_FIELDS = [
  'title',
  'narrative',
  'meaning',
  'resources',
  'limits',
  'first_step',
] as const
export function validateLifeDirection(value: LifeDirectionInput) {
  if (
    !value.enrollment_id ||
    !['present', 'future'].includes(value.kind) ||
    !(value.kind === 'present'
      ? value.horizon === 'now'
      : ['short', 'medium', 'long', 'open'].includes(value.horizon))
  )
    throw new Error('Confira o momento e o horizonte deste registro.')
  if (!['participant_private', 'participant_shared'].includes(value.access_class))
    throw new Error('Confira a privacidade.')
  for (const field of LIFE_DIRECTION_FIELDS) {
    if (typeof value[field] !== 'string' || value[field].length > (field === 'title' ? 160 : 5000))
      throw new Error(
        'Confira o tamanho dos textos: título até 160 e cada relato até 5.000 caracteres.',
      )
  }
  if (!value.title.trim()) throw new Error('Dê um nome ao seu registro.')
}
export function sharedLifeDirections(values: LifeDirection[], enrollmentId: string) {
  return values
    .filter((v) => v.enrollment_id === enrollmentId && v.access_class === 'participant_shared')
    .map((v) => ({ ...v }))
}
const demoKey = (id: string) => `cer-demo-life-directions-v1:${id}`
export const lifeDirectionsService = {
  async list(enrollmentId: string): Promise<LifeDirection[]> {
    if (demoAdapter.isEnabled()) {
      const values = JSON.parse(localStorage.getItem(demoKey(enrollmentId)) || '[]')
      if (!Array.isArray(values)) throw new Error('Não foi possível ler os registros salvos.')
      for (const value of values) {
        validateLifeDirection(value)
        if (value.enrollment_id !== enrollmentId || typeof value.id !== 'string')
          throw new Error('Registro inválido.')
      }
      return values
    }
    return pb.collection('cer_life_directions').getFullList<LifeDirection>({
      filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
      sort: 'created',
      requestKey: null,
    })
  },
  async save(value: LifeDirectionInput, id?: string): Promise<LifeDirection> {
    validateLifeDirection(value)
    const data = { ...value, title: value.title.trim() }
    if (demoAdapter.isEnabled()) {
      const values = await this.list(value.enrollment_id)
      const previous = id ? values.find((v) => v.id === id) : undefined
      if (id && !previous) throw new Error('Registro não encontrado. Recarregue e tente novamente.')
      const now = new Date().toISOString()
      const record = {
        ...data,
        id: id || `demo-direction-${crypto.randomUUID()}`,
        created: previous?.created || now,
        updated: now,
      }
      localStorage.setItem(
        demoKey(value.enrollment_id),
        JSON.stringify(id ? values.map((v) => (v.id === id ? record : v)) : [...values, record]),
      )
      window.dispatchEvent(
        new CustomEvent('cer-life-records-changed', {
          detail: { enrollmentId: value.enrollment_id },
        }),
      )
      return record
    }
    const record = await (id
      ? pb.collection('cer_life_directions').update<LifeDirection>(id, data)
      : pb.collection('cer_life_directions').create<LifeDirection>(data))
    window.dispatchEvent(
      new CustomEvent('cer-life-records-changed', {
        detail: { enrollmentId: value.enrollment_id },
      }),
    )
    return record
  },
}
