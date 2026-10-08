import pb from '@/lib/pocketbase/client'
import { demoAdapter } from './demoAdapter'
import type { CerResourceInsight } from '@/types/cerMapReadings'

export interface PersonalResourceItem {
  id: string
  kind: 'strength' | 'difficulty'
  label: string
}
export interface ResourceConnection {
  strengthId: string
  difficultyId: string
  strategy: string
}
export interface ResourceExercise {
  schemaVersion: 1
  enrollmentId: string
  sourceFingerprint: string
  customItems: PersonalResourceItem[]
  hiddenIds: string[]
  connections: ResourceConnection[]
}
export interface SavedResourceExercise {
  id: string
  revision: number
  data: ResourceExercise
}
export function emptyResourceExercise(
  enrollmentId: string,
  sourceFingerprint: string,
): ResourceExercise {
  return {
    schemaVersion: 1,
    enrollmentId,
    sourceFingerprint,
    customItems: [],
    hiddenIds: [],
    connections: [],
  }
}
export function validateResourceExercise(
  value: unknown,
  enrollmentId: string,
): asserts value is ResourceExercise {
  const v = value as ResourceExercise
  const text = (x: unknown, max: number) => typeof x === 'string' && x.length <= max
  if (
    !v ||
    v.schemaVersion !== 1 ||
    v.enrollmentId !== enrollmentId ||
    !text(v.sourceFingerprint, 100) ||
    !Array.isArray(v.customItems) ||
    v.customItems.length > 100 ||
    !Array.isArray(v.hiddenIds) ||
    v.hiddenIds.length > 500 ||
    !Array.isArray(v.connections) ||
    v.connections.length > 500 ||
    !v.customItems.every(
      (i) =>
        i &&
        text(i.id, 200) &&
        i.id.startsWith('personal:') &&
        ['strength', 'difficulty'].includes(i.kind) &&
        text(i.label, 240) &&
        i.label.trim(),
    ) ||
    new Set(v.customItems.map((i) => i.id)).size !== v.customItems.length ||
    !v.hiddenIds.every((id) => text(id, 1000)) ||
    !v.connections.every(
      (c) => c && text(c.strengthId, 1000) && text(c.difficultyId, 1000) && text(c.strategy, 2000),
    ) ||
    new Set(v.connections.map((c) => `${c.strengthId}|${c.difficultyId}`)).size !==
      v.connections.length
  )
    throw new Error('Não foi possível ler este exercício. Seus registros salvos foram preservados.')
}
export function visibleResourceItems(pool: CerResourceInsight[], exercise: ResourceExercise) {
  return [
    ...pool.map((i) => ({ id: i.id, kind: i.kind, label: i.label })),
    ...exercise.customItems,
  ].filter((i) => !exercise.hiddenIds.includes(i.id))
}
export function connectResource(
  exercise: ResourceExercise,
  pool: CerResourceInsight[],
  strengthId: string,
  difficultyId: string,
): ResourceExercise {
  const items = visibleResourceItems(pool, exercise)
  if (
    !items.some((i) => i.id === strengthId && i.kind === 'strength') ||
    !items.some((i) => i.id === difficultyId && i.kind === 'difficulty')
  )
    return exercise
  if (
    exercise.connections.some((c) => c.strengthId === strengthId && c.difficultyId === difficultyId)
  )
    return exercise
  return {
    ...exercise,
    connections: [...exercise.connections, { strengthId, difficultyId, strategy: '' }],
  }
}
const demoKey = (id: string) =>
  `cer-demo-resource-exercise-v1:${demoAdapter.getCurrentUser().id}:${id}`
export const resourceExerciseService = {
  async load(enrollmentId: string): Promise<SavedResourceExercise | null> {
    if (demoAdapter.isEnabled()) {
      if (demoAdapter.getCurrentUser().role !== 'interagente')
        throw new Error('Este exercício é pessoal da interagente.')
      const raw = localStorage.getItem(demoKey(enrollmentId))
      if (!raw) return null
      const record = JSON.parse(raw)
      validateResourceExercise(record.data, enrollmentId)
      if (!record.id || !Number.isInteger(record.revision))
        throw new Error('Registro inválido. Seus dados foram preservados.')
      return record
    }
    const records = await pb.collection('cer_resource_exercises').getFullList({
      filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
      requestKey: null,
    })
    if (!records.length) return null
    const r = records[0]
    validateResourceExercise(r.exercise, enrollmentId)
    return { id: r.id, revision: r.revision, data: r.exercise }
  },
  async save(
    data: ResourceExercise,
    previous: SavedResourceExercise | null,
  ): Promise<SavedResourceExercise> {
    validateResourceExercise(data, data.enrollmentId)
    if (previous && previous.data.enrollmentId !== data.enrollmentId)
      throw new Error('Confira a pessoa deste exercício.')
    if (demoAdapter.isEnabled()) {
      const current = await this.load(data.enrollmentId)
      if ((current?.revision || 0) !== (previous?.revision || 0))
        throw new Error('O exercício foi atualizado em outra janela. Reabra antes de salvar.')
      const record = {
        id: previous?.id || `demo-exercise-${crypto.randomUUID()}`,
        revision: (previous?.revision || 0) + 1,
        data: structuredClone(data),
      }
      localStorage.setItem(demoKey(data.enrollmentId), JSON.stringify(record))
      return record
    }
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Entre novamente para salvar seu exercício.')
    const payload = {
      enrollment_id: data.enrollmentId,
      owner_id: userId,
      revision: (previous?.revision || 0) + 1,
      exercise: data,
    }
    const r = previous
      ? await pb.collection('cer_resource_exercises').update(previous.id, payload)
      : await pb.collection('cer_resource_exercises').create(payload)
    return { id: r.id, revision: r.revision, data: r.exercise }
  },
}
