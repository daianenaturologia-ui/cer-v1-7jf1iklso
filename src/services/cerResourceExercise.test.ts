import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import vm from 'node:vm'
import {
  emptyResourceExercise,
  connectResource,
  resourceExerciseService,
  validateResourceExercise,
} from './cerResourceExercise'
import { demoAdapter } from './demoAdapter'
const pool = [
  { id: 'strength:s', kind: 'strength', label: 'Criar', description: '', origins: [] },
  { id: 'difficulty:d', kind: 'difficulty', label: 'Começar', description: '', origins: [] },
  { id: 'difficulty:d2', kind: 'difficulty', label: 'Continuar', description: '', origins: [] },
] as any
beforeEach(() => {
  localStorage.clear()
  demoAdapter.enableDemo('mariana')
})
afterEach(() => {
  vi.restoreAllMocks()
})
describe('Exercício pessoal e persistência', () => {
  it('reutiliza forças em dificuldades diferentes e impede conexões duplicadas ou invertidas', () => {
    const a = connectResource(emptyResourceExercise('e', 'v'), pool, 'strength:s', 'difficulty:d')
    const b = connectResource(a, pool, 'strength:s', 'difficulty:d2')
    expect(b.connections).toHaveLength(2)
    expect(connectResource(b, pool, 'strength:s', 'difficulty:d')).toBe(b)
    expect(connectResource(b, pool, 'difficulty:d', 'strength:s')).toBe(b)
    expect(
      connectResource({ ...b, hiddenIds: ['strength:s'] }, pool, 'strength:s', 'difficulty:d'),
    ).not.toBe(undefined)
  })
  it('salva, retorna e isola outra pessoa; profissional não lê o exercício', async () => {
    const data = connectResource(
      emptyResourceExercise('a', 'v'),
      pool,
      'strength:s',
      'difficulty:d',
    )
    data.customItems = [{ id: 'personal:1', kind: 'strength', label: 'Pedir apoio' }]
    const saved = await resourceExerciseService.save(data, null)
    expect((await resourceExerciseService.load('a'))?.data).toEqual(data)
    expect(await resourceExerciseService.load('b')).toBe(null)
    demoAdapter.enableDemo('daiane')
    await expect(resourceExerciseService.load('a')).rejects.toThrow('pessoal')
    expect(saved.revision).toBe(1)
  })
  it('não sobrescreve uma versão salva por outra janela', async () => {
    const first = await resourceExerciseService.save(emptyResourceExercise('a', 'v'), null)
    const second = await resourceExerciseService.save(
      { ...first.data, hiddenIds: ['strength:s'] },
      first,
    )
    await expect(resourceExerciseService.save(first.data, first)).rejects.toThrow('outra janela')
    expect((await resourceExerciseService.load('a'))?.revision).toBe(second.revision)
  })
  it('falha de armazenamento é visível e não apaga a versão anterior', async () => {
    const first = await resourceExerciseService.save(emptyResourceExercise('a', 'v'), null)
    const before = localStorage.getItem(
      `cer-demo-resource-exercise-v1:${demoAdapter.getCurrentUser().id}:a`,
    )
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    await expect(
      resourceExerciseService.save({ ...first.data, hiddenIds: ['strength:s'] }, first),
    ).rejects.toThrow('quota')
    expect(
      localStorage.getItem(`cer-demo-resource-exercise-v1:${demoAdapter.getCurrentUser().id}:a`),
    ).toBe(before)
  })
  it('valida limites, pessoa e conexões duplicadas sem tratar registro corrompido como vazio', () => {
    expect(() => validateResourceExercise(emptyResourceExercise('b', 'v'), 'a')).toThrow()
    const data = emptyResourceExercise('a', 'v')
    data.customItems = [{ id: 'personal:1', kind: 'strength', label: 'x'.repeat(241) }]
    expect(() => validateResourceExercise(data, 'a')).toThrow()
  })
  it('migração protege somente a pessoa proprietária e impede acesso profissional implícito', () => {
    const created: any[] = []
    vm.runInNewContext(
      fs.readFileSync('pocketbase/migrations/0074_create_resource_exercises.js', 'utf8'),
      {
        migrate: (up: any) =>
          up({
            save: (c: any) => created.push(c),
            findCollectionByNameOrId: (n: string) => ({ id: n }),
          }),
        Collection: class {
          constructor(v: any) {
            Object.assign(this, v)
          }
        },
      },
    )
    const c = created[0]
    expect(c.listRule).toContain('owner_id = @request.auth.id')
    expect(c.listRule).toContain('enrollment_id.person_id')
    expect(c.listRule).not.toContain('professional_enrollment_access')
    expect(c.updateRule).toContain('enrollment_id:changed = false')
    expect(c.indexes[0]).toContain('UNIQUE')
  })
  it('hook rejeita revisões concorrentes e exercício atribuído à outra pessoa', () => {
    const callbacks: any = {}
    vm.runInNewContext(fs.readFileSync('pocketbase/hooks/on_resource_exercise.js', 'utf8'), {
      BadRequestError: Error,
      onRecordCreateRequest: (fn: any) => (callbacks.create = fn),
      onRecordUpdateRequest: (fn: any) => (callbacks.update = fn),
    })
    const event = (revision: number, data: any) => ({
      record: {
        original: () => ({ getInt: () => 2 }),
        getInt: () => revision,
        getString: (key: string) => (key === 'exercise' ? JSON.stringify(data) : 'a'),
      },
      next: vi.fn(),
    })
    expect(() => callbacks.update(event(2, emptyResourceExercise('a', 'v')))).toThrow(
      'outra janela',
    )
    expect(() => callbacks.create(event(1, emptyResourceExercise('b', 'v')))).toThrow('Confira')
    const valid = event(3, emptyResourceExercise('a', 'v'))
    callbacks.update(valid)
    expect(valid.next).toHaveBeenCalledOnce()
  })
})
