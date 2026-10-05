import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'
const hooks: Record<string, (e: any) => void> = {}
runInNewContext(readFileSync('pocketbase/hooks/on_self_development.js', 'utf8'), {
  onRecordCreateRequest: (fn: any, name: string) => {
    hooks[`create:${name}`] = fn
  },
  onRecordUpdateRequest: (fn: any, name: string) => {
    hooks[`update:${name}`] = fn
  },
  ForbiddenError: Error,
  BadRequestError: Error,
})
const record = (values: any, original?: any): any => ({
  id: values.id || 'e',
  getString: (key: string) => values[key] || '',
  get: (key: string) => values[key],
  original: () => record(original || values),
})
function event(values: any, old?: any, person = 'person') {
  return {
    record: record(values, old),
    auth: record({ id: 'user', person_id: person }),
    next: vi.fn(),
    app: {
      findRecordById: (name: string) =>
        name === 'enrollments'
          ? record({ id: 'e', person_id: 'person' })
          : record({ enrollment_id: 'other', kind: 'future' }),
      findRecordsByFilter: () => [record({})],
    },
  }
}
const planned = {
  enrollment_id: 'e',
  direction_id: '',
  resource_snapshot: {
    id: 'r',
    title: 'Recurso',
    lesson: 'Ensinamento',
    instructions: ['Observar'],
  },
  goal: 'Direção',
  action: 'Passo',
  context: 'De manhã',
  status: 'planned',
  access_class: 'participant_private',
}
it('hook recusa outra pessoa e origem de outra matrícula', () => {
  expect(() =>
    hooks['create:cer_development_experiments'](event(planned, undefined, 'other')),
  ).toThrow('Somente')
  expect(() =>
    hooks['create:cer_development_experiments'](event({ ...planned, direction_id: 'f' })),
  ).toThrow('matrícula')
  const e = event(planned)
  hooks['create:cer_development_experiments'](e)
  expect(e.next).toHaveBeenCalledOnce()
})
it('hook preserva conteúdo e matrícula e requer aprendizado na revisão', () => {
  expect(() =>
    hooks['update:cer_development_experiments'](
      event({ ...planned, enrollment_id: 'other' }, planned),
    ),
  ).toThrow('matrícula')
  expect(() =>
    hooks['update:cer_development_experiments'](
      event(
        { ...planned, resource_snapshot: { ...planned.resource_snapshot, title: 'Mudou' } },
        planned,
      ),
    ),
  ).toThrow('conteúdo')
  expect(() =>
    hooks['update:cer_development_experiments'](
      event({ ...planned, status: 'reviewed', reflection: '' }, planned),
    ),
  ).toThrow('aprendizado')
  const e = event(
    {
      ...planned,
      resource_snapshot: {
        instructions: ['Observar'],
        lesson: 'Ensinamento',
        title: 'Recurso',
        id: 'r',
      },
    },
    planned,
  )
  hooks['update:cer_development_experiments'](e)
  expect(e.next).toHaveBeenCalledOnce()
})
it('revisão concluída permite revogar compartilhamento e impede reescrever o aprendizado', () => {
  const old = { ...planned, status: 'reviewed', reflection: 'Aprendi' }
  expect(() =>
    hooks['update:cer_development_experiments'](event({ ...old, reflection: 'Mudou' }, old)),
  ).toThrow('preservada')
  const e = event({ ...old, access_class: 'participant_shared' }, old)
  hooks['update:cer_development_experiments'](e)
  expect(e.next).toHaveBeenCalledOnce()
})
it('publicação educativa exige autoria e papel profissional; conteúdo publicado só pode ser retirado', () => {
  const draft = {
    author_user_id: 'user',
    title: 'Recurso',
    lesson: 'Ensinamento',
    instructions: ['Observar'],
    status: 'draft',
  }
  const denied = event(draft)
  denied.app.findRecordsByFilter = () => []
  expect(() => hooks['create:cer_development_resources'](denied)).toThrow('profissional')
  const published = { ...draft, status: 'published' }
  expect(() =>
    hooks['update:cer_development_resources'](
      event({ ...published, title: 'Mudou', status: 'archived' }, published),
    ),
  ).toThrow('preservado')
  const e = event({ ...published, status: 'archived' }, published)
  hooks['update:cer_development_resources'](e)
  expect(e.next).toHaveBeenCalledOnce()
})
it('migração usa dono autenticado, compartilhamento explícito e bloqueia alteração de matrícula', () => {
  const collections: any[] = []
  runInNewContext(readFileSync('pocketbase/migrations/0072_create_self_development.js', 'utf8'), {
    migrate: (up: any) =>
      up({
        save: (c: any) => collections.push(c),
        findCollectionByNameOrId: (name: string) => ({ id: name }),
      }),
    Collection: function (this: any, value: any) {
      Object.assign(this, value)
    },
  })
  const experiments = collections.find((c) => c.name === 'cer_development_experiments')
  expect(experiments.listRule).toContain("access_class = 'participant_shared'")
  expect(experiments.updateRule).toContain('@request.body.enrollment_id:changed = false')
  expect(experiments.deleteRule).toBeNull()
  expect(collections.find((c) => c.name === 'cer_development_resources').createRule).toContain(
    '@request.auth.user_roles_via_user_id.is_active',
  )
})
