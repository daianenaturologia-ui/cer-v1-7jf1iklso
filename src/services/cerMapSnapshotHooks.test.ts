import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import vm from 'node:vm'
import { buildCerMapReadings } from './cerMapReadings'
class RecordStub {
  constructor(
    public data: any,
    public previous?: RecordStub,
  ) {}
  original() {
    return this.previous
  }
  getString(key: string) {
    const value = this.data[key]
    return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '')
  }
  getInt(key: string) {
    return Number(this.data[key] || 0)
  }
  set(key: string, value: any) {
    this.data[key] = value
  }
}
function hooks(file: string) {
  const callbacks: any = {}
  const context: any = {
    BadRequestError: Error,
    Record: RecordStub,
    console,
    onRecordUpdate: (fn: any) => {
      callbacks.model = fn
    },
    onRecordUpdateRequest: (fn: any) => {
      callbacks.update = fn
    },
    onRecordCreateRequest: (fn: any) => {
      callbacks.create = fn
    },
    onRecordAfterCreateSuccess: () => {},
    onRecordAfterUpdateSuccess: () => {},
    onRecordDelete: () => {},
  }
  vm.runInNewContext(fs.readFileSync(`pocketbase/hooks/${file}`, 'utf8'), context)
  return { callbacks, context }
}
function event(snapshot: any, oldSnapshot: any = null, privateSource = false) {
  const original = new RecordStub({
    status: 'draft',
    enrollment_id: 'enr',
    reading_snapshot: oldSnapshot,
  })
  const record = new RecordStub({ ...original.data, reading_snapshot: snapshot }, original)
  const auth = { id: 'prof', getString: () => 'person' }
  const app = {
    findRecordsByFilter: vi.fn(() => [{}]),
    findRecordById: () =>
      new RecordStub({
        enrollment_id: 'enr',
        access_class: privateSource ? 'participant_private' : 'shared_care',
      }),
  }
  return { record, app, requestInfo: () => ({ auth }), next: vi.fn() }
}
describe('Proteções executáveis dos hooks do Mapa CER', () => {
  it('protege o snapshot publicado também contra escrita fora da API', () => {
    const { callbacks } = hooks('on_cer_map_reading_snapshot.js')
    const e = event(buildCerMapReadings([], 'enr', 'Teste'))
    e.record.previous!.set('status', 'published')
    expect(() => callbacks.model(e)).toThrow('imutáveis')
    expect(e.next).not.toHaveBeenCalled()
  })
  it('rejeita fontes privadas e estrutura de outra interagente', () => {
    const { callbacks } = hooks('on_cer_map_reading_snapshot.js')
    const snapshot = buildCerMapReadings([], 'enr', 'Teste')
    snapshot.dimensions[1].detailedRows.push({
      label: 'Teste',
      text: 'Fictício',
      sourceResponseId: 'resp',
    })
    expect(() => callbacks.update(event(snapshot, null, true))).toThrow('privadas')
    snapshot.enrollmentId = 'outra'
    expect(() => callbacks.create(event(snapshot))).toThrow('estrutura válida')
  })
  it('carimba revisão autorizada e rejeita reaproveitar revisão antiga depois de edição', () => {
    const { callbacks } = hooks('on_cer_map_reading_snapshot.js')
    const old = {
      ...buildCerMapReadings([], 'enr', 'Teste'),
      reviewedBy: 'prof',
      reviewedAt: '2026-01-01',
    }
    const next = structuredClone(old)
    next.overview = 'Texto editado'
    expect(() => callbacks.update(event(next, old))).toThrow('nova revisão')
    next.reviewedAt = '2026-10-01'
    const e = event(next, old)
    callbacks.update(e)
    expect(e.next).toHaveBeenCalledOnce()
    expect(e.record.data.reading_snapshot.reviewedAt).not.toBe('2026-10-01')
  })
  it('bloqueia publicação sem encontro no servidor mesmo com revisão válida', () => {
    const { callbacks, context } = hooks('on_cer_map_lifecycle.js')
    const e = event({
      ...buildCerMapReadings([], 'enr', 'Teste'),
      reviewedBy: 'prof',
      reviewedAt: '2026-10-01',
    })
    e.record.set('status', 'published')
    const app: any = {
      findFirstRecordByData: () => new RecordStub({ full_name: 'Profissional teste' }),
      findRecordsByFilter: (collection: string) =>
        collection === 'cer_sessions'
          ? []
          : collection === 'user_roles'
            ? [new RecordStub({ role: 'profissional' })]
            : [{}],
    }
    e.app = app
    context.$app = app
    expect(() => callbacks.update(e)).toThrow('primeiro encontro')
    expect(e.next).not.toHaveBeenCalled()
  })
})
