import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'
const hooks: Record<string, (e: any) => void> = {}
runInNewContext(readFileSync('pocketbase/hooks/on_goal_roadmap.js', 'utf8'), {
  onRecordCreateRequest: (fn: any) => (hooks.create = fn),
  onRecordUpdateRequest: (fn: any) => (hooks.update = fn),
  ForbiddenError: Error,
  BadRequestError: Error,
})
const record = (v: any, old?: any): any => ({
  id: v.id || 'e',
  getString: (k: string) => (typeof v[k] === 'object' ? JSON.stringify(v[k]) : v[k] || ''),
  getInt: (k: string) => v[k],
  original: () => record(old || v),
})
const data = {
  enrollment_id: 'e',
  direction_id: 'd',
  owner_id: 'user',
  revision: 1,
  access_class: 'participant_private',
  roadmap: {
    schemaVersion: 1,
    objective: 'Recuperar energia',
    capacity: 'Uma pausa',
    resources: 'Organização',
    milestones: [{ horizon: 'short', title: 'Pausar', targetDate: '2026-10-23', signal: '' }],
    actions: [],
  },
}
function event(
  v = data,
  old?: any,
  source: any = { kind: 'future', enrollment_id: 'e', access_class: 'participant_private' },
) {
  return {
    record: record(v, old),
    auth: record({ id: 'user', person_id: 'p' }),
    next: vi.fn(),
    app: {
      findRecordById: (name: string) =>
        record(name === 'enrollments' ? { id: 'e', person_id: 'p' } : source),
    },
  }
}
it('servidor recusa outra pessoa, direção de outra matrícula e compartilhamento sem direção compartilhada', () => {
  expect(() => hooks.create(event({ ...data, owner_id: 'other' }))).toThrow('Somente')
  expect(() =>
    hooks.create(event(data, undefined, { kind: 'future', enrollment_id: 'other' })),
  ).toThrow('matrícula')
  expect(() => hooks.create(event({ ...data, access_class: 'participant_shared' }))).toThrow(
    'primeiro',
  )
  const e = event()
  hooks.create(e)
  expect(e.next).toHaveBeenCalledOnce()
})
it('servidor valida calendário e ordem e protege origem e revisão', () => {
  expect(() =>
    hooks.create(
      event({
        ...data,
        roadmap: {
          ...data.roadmap,
          milestones: [{ ...data.roadmap.milestones[0], targetDate: '2026-02-30' }],
        },
      }),
    ),
  ).toThrow('datas')
  expect(() => hooks.update(event({ ...data, revision: 1 }, data))).toThrow('outra janela')
  expect(() =>
    hooks.update(event({ ...data, revision: 2, direction_id: 'changed' }, data)),
  ).toThrow('origem')
  const e = event({ ...data, revision: 2 }, data)
  hooks.update(e)
  expect(e.next).toHaveBeenCalledOnce()
})
it('coleção limita leitura compartilhada à profissional vinculada e preserva direção, matrícula e dono', () => {
  let collection: any
  runInNewContext(readFileSync('pocketbase/migrations/0075_create_goal_roadmaps.js', 'utf8'), {
    migrate: (up: any) =>
      up({
        save: (c: any) => (collection = c),
        findCollectionByNameOrId: (id: string) => ({ id }),
      }),
    Collection: function (this: any, data: any) {
      Object.assign(this, data)
    },
  })
  expect(collection.listRule).toContain("direction_id.access_class = 'participant_shared'")
  expect(collection.listRule).toContain('professional_enrollment_access_via_enrollment_id')
  expect(collection.updateRule).toContain('@request.body.owner_id:changed = false')
  expect(collection.deleteRule).toBeNull()
  expect(collection.indexes[0]).toContain('UNIQUE')
})
