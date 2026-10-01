import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import vm from 'node:vm'
import { buildCerMapReadings, isCerMapReadingSnapshot } from './cerMapReadings'
const shared = {
  id: 'direction',
  enrollment_id: 'enr',
  kind: 'future',
  horizon: 'short',
  title: 'Mais descanso',
  narrative: 'Organizar meus horários',
  meaning: '',
  resources: '',
  limits: '',
  first_step: 'Reservar uma pausa',
  access_class: 'participant_shared',
  created: '2026-10-01',
  updated: '2026-10-01',
}
const record = (data: any, previous?: any) => ({
  original: () => previous,
  getString: (key: string) =>
    typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key] ?? ''),
  set: (key: string, value: any) => {
    data[key] = value
  },
})
function invoke(verb: 'create' | 'update', source = shared, published = false) {
  const callbacks: any = {}
  vm.runInNewContext(fs.readFileSync('pocketbase/hooks/on_cer_map_reading_snapshot.js', 'utf8'), {
    BadRequestError: Error,
    onRecordUpdate: () => {},
    onRecordUpdateRequest: (fn: any) => {
      callbacks.update = fn
    },
    onRecordCreateRequest: (fn: any) => {
      callbacks.create = fn
    },
  })
  const snapshot = { ...buildCerMapReadings([], 'enr', 'Fictícia'), lifeDirections: [shared] }
  const previous =
    verb === 'update' ? record({ status: 'draft', reading_snapshot: snapshot }) : undefined
  const next = vi.fn()
  const e = {
    record: record(
      {
        status: published ? 'published' : 'draft',
        enrollment_id: 'enr',
        reading_snapshot: snapshot,
      },
      previous,
    ),
    app: { findRecordById: () => record(source), findRecordsByFilter: () => [{}] },
    requestInfo: () => ({ auth: { id: 'prof', getString: () => 'person' } }),
    next,
  }
  callbacks[verb](e)
  return next
}
describe('Fontes de presente e futuro no Mapa', () => {
  it('aceita fonte compartilhada íntegra ao criar e publicar', () => {
    expect(invoke('create')).toHaveBeenCalledOnce()
    expect(invoke('update', shared, true)).toHaveBeenCalledOnce()
  })
  it('bloqueia fonte privada ou de outra pessoa ao salvar e publicar', () => {
    for (const verb of ['create', 'update'] as const) {
      expect(() => invoke(verb, { ...shared, access_class: 'participant_private' }, true)).toThrow(
        'compartilhados',
      )
      expect(() => invoke(verb, { ...shared, enrollment_id: 'outra' }, true)).toThrow(
        'compartilhados',
      )
    }
  })
  it('exige atualização das fontes se o registro mudou antes da publicação', () => {
    expect(() => invoke('update', { ...shared, first_step: 'Passo atualizado' }, true)).toThrow(
      'mudou',
    )
  })
  it('mantém mapas antigos compatíveis e rejeita direções privadas no leitor', () => {
    const snapshot = buildCerMapReadings([], 'enr', 'Fictícia')
    expect(isCerMapReadingSnapshot(snapshot)).toBe(true)
    expect(isCerMapReadingSnapshot({ ...snapshot, lifeDirections: [shared] })).toBe(true)
    expect(
      isCerMapReadingSnapshot({
        ...snapshot,
        lifeDirections: [{ ...shared, access_class: 'participant_private' }],
      }),
    ).toBe(false)
  })
})
