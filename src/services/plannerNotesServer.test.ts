import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'
const hooks: Record<string, (e: any) => void> = {}
runInNewContext(readFileSync('pocketbase/hooks/on_planner_notes.js', 'utf8'), {
  onRecordCreateRequest: (fn: any) => (hooks.create = fn),
  onRecordUpdateRequest: (fn: any) => (hooks.update = fn),
  ForbiddenError: Error,
  BadRequestError: Error,
})
const note = {
  enrollment_id: 'e',
  title: 'Minha pausa',
  starts_at: '2026-10-05T09:00:00Z',
  ends_at: '2026-10-05T09:30:00Z',
}
const record = (data: any, old = data): any => ({
  getString: (k: string) => data[k] || '',
  original: () => record(old),
})
const event = (data = note, old = note, person = 'owner', status = 'active') => ({
  record: record(data, old),
  auth: record({ person_id: person, status }),
  app: { findRecordById: () => record({ person_id: 'owner' }) },
  next: vi.fn(),
})
it('servidor recusa escrever em agenda alheia ou com conta inativa', () => {
  for (const action of ['create', 'update']) {
    expect(() => hooks[action](event(note, note, 'professional'))).toThrow('Somente')
    expect(() => hooks[action](event(note, note, 'owner', 'inactive'))).toThrow('Somente')
    const e = event()
    hooks[action](e)
    expect(e.next).toHaveBeenCalledOnce()
  }
})
it('servidor preserva pessoa e recusa intervalo inválido', () => {
  expect(() => hooks.update(event({ ...note, enrollment_id: 'other' }))).toThrow('pessoa')
  for (const action of ['create', 'update'])
    expect(() => hooks[action](event({ ...note, ends_at: note.starts_at }))).toThrow('horários')
})
it('regras de leitura permanecem privadas e exclusão física está bloqueada', () => {
  const collections: any[] = []
  runInNewContext(readFileSync('pocketbase/migrations/0073_create_planner_notes.js', 'utf8'), {
    migrate: (up: any) =>
      up({ save: (c: any) => collections.push(c), findCollectionByNameOrId: () => ({ id: 'e' }) }),
    Collection: class {
      constructor(data: any) {
        Object.assign(this, data)
      }
    },
  })
  expect(collections[0].listRule).toContain('users_via_person_id.id ?= @request.auth.id')
  expect(collections[0].listRule).not.toContain('professional_enrollment_access')
  expect(collections[0].viewRule).toBe(collections[0].listRule)
  expect(collections[0].deleteRule).toBeNull()
})
