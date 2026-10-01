import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { describe, it, expect } from 'vitest'
function runHook(data: Record<string, unknown>, completed = true) {
  const handlers: Record<string, (e: any) => void> = {}
  const source = readFileSync('pocketbase/hooks/on_cer_life_event.js', 'utf8')
  vm.runInNewContext(source, {
    onRecordCreateRequest: (fn: any) => (handlers.create = fn),
    onRecordUpdateRequest: (fn: any) => (handlers.update = fn),
    BadRequestError: Error,
  })
  const codes = [
    'corpo_fisiologia_ayurveda',
    'mente_emocoes_cer',
    'regulacao_respostas_cer',
    'relacoes_cer',
    'sexualidade_cer',
    'sentido_conexao_cer',
  ]
  let passed = false
  handlers.create({
    record: {
      getString: (key: string) => String(data[key] ?? ''),
      set: (key: string, value: unknown) => (data[key] = value),
    },
    app: {
      findRecordsByFilter: () =>
        completed ? codes.map((code) => ({ getString: () => code })) : [],
      findRecordById: (_collection: string, id: string) => ({ getString: () => id }),
    },
    next: () => (passed = true),
  })
  return passed
}
const data = {
  enrollment_id: 'enr',
  title: 'Uma conquista',
  time_kind: 'age',
  time_value: '10',
  emotions: '["Alegria","Gratidão"]',
}
describe('validação de histórias no servidor', () => {
  it('autoriza passado aproximado com várias emoções após as seis dimensões', () =>
    expect(runHook({ ...data })).toBe(true))
  it('bloqueia criação por chamada direta antes da conclusão', () =>
    expect(() => runHook({ ...data }, false)).toThrow(/seis dimensões/))
  it('bloqueia datas inexistentes independentemente do navegador', () =>
    expect(() => runHook({ ...data, time_kind: 'date', time_value: '2026-02-30' })).toThrow(
      /válida/,
    ))
  it('rejeita emoções adulteradas', () =>
    expect(() => runHook({ ...data, emotions: '["inventada"]' })).toThrow(/Emoções/))
})

import { buildCerMapReadings } from './cerMapReadings'
it('o servidor rejeita uma história privada e exige atualização após mudança da fonte', () => {
  const handlers: Record<string, (e: any) => void> = {}
  vm.runInNewContext(readFileSync('pocketbase/hooks/on_cer_map_reading_snapshot.js', 'utf8'), {
    onRecordUpdate: () => {},
    onRecordCreateRequest: () => {},
    onRecordUpdateRequest: (fn: any) => (handlers.update = fn),
    BadRequestError: Error,
  })
  const event = {
    id: 'story',
    enrollment_id: 'enr',
    title: 'História',
    time_kind: 'unknown',
    time_value: '',
    narrative: 'Relato',
    updated: 'version1',
    emotions: ['Alegria'],
    access_class: 'participant_shared',
  }
  const snapshot = { ...buildCerMapReadings([], 'enr', 'Teste'), lifeEvents: [event] }
  const record = {
    getString: (key: string) =>
      key === 'reading_snapshot' ? JSON.stringify(snapshot) : key === 'enrollment_id' ? 'enr' : '',
    original: () => ({ getString: (key: string) => (key === 'status' ? 'draft' : '') }),
    set: () => {},
  }
  const run = (access: string, updated: string) =>
    handlers.update({
      record,
      app: {
        findRecordById: () => ({
          getString: (key: string) =>
            key === 'access_class'
              ? access
              : key === 'updated'
                ? updated
                : key === 'emotions'
                  ? JSON.stringify(event.emotions)
                  : String((event as any)[key] ?? ''),
        }),
        findRecordsByFilter: () => [{}],
      },
      requestInfo: () => ({ auth: { id: 'prof', getString: () => 'person' } }),
      next: () => {},
    })
  expect(() => run('participant_private', 'version1')).toThrow(/compartilhadas/)
  expect(() => run('participant_shared', 'version2')).toThrow(/mudou/)
  expect(() => run('participant_shared', 'version1')).not.toThrow()
})
