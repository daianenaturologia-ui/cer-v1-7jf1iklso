// Exercise request guards without a live database or user data.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
const source = readFileSync('pocketbase/hooks/on_cer_cycle_invitation.js', 'utf8')
function record(data: Record<string, string>, original = { ...data }) {
  return {
    getString: (k: string) => data[k] || '',
    set: (k: string, v: string) => {
      data[k] = v
    },
    original: () => record(original),
  }
}
function guards() {
  const handlers: Record<string, (e: any) => void> = {}
  runInNewContext(source, {
    onRecordCreateRequest: (fn: any) => {
      handlers.create = fn
    },
    onRecordUpdateRequest: (fn: any) => {
      handlers.update = fn
    },
    BadRequestError: Error,
    ForbiddenError: Error,
    $app: {
      findRecordById: (collection: string) =>
        record(
          collection === 'cer_care_cycles'
            ? { enrollment_id: 'e', status: 'active' }
            : { person_id: 'p' },
        ),
      findRecordsByFilter: () => [{ id: 'participant' }],
    },
  })
  return handlers
}
describe('Convite compartilhado: autoria e imutabilidade no servidor', () => {
  it('deriva a interagente da matrícula e remove resposta forjada na criação', () => {
    const data = {
      enrollment_id: 'e',
      care_cycle_id: 'c',
      participant_user_id: 'forged',
      participant_reflection: 'forged',
      completed_at: 'forged',
    }
    let advanced = false
    guards().create({
      record: record(data),
      auth: { id: 'professional' },
      next: () => {
        advanced = true
      },
    })
    expect(data.participant_user_id).toBe('participant')
    expect(data.participant_reflection).toBe('')
    expect(data.completed_at).toBe('')
    expect(advanced).toBe(true)
  })
  it('não permite à profissional escrever na voz da interagente', () => {
    expect(() =>
      guards().update({
        record: record({ participant_user_id: 'participant' }),
        auth: { id: 'professional' },
      }),
    ).toThrow('interagente')
  })
  it('recusa alterações ao convite e impede sobrescrever retorno compartilhado', () => {
    const original = {
      participant_user_id: 'participant',
      shared_prompt: 'Original',
      completed_at: '',
    }
    expect(() =>
      guards().update({
        record: record(
          { ...original, shared_prompt: 'Alterado', participant_reflection: 'Relato' },
          original,
        ),
        auth: { id: 'participant' },
      }),
    ).toThrow('imutável')
    expect(() =>
      guards().update({
        record: record({ ...original, completed_at: '2026-10-01' }),
        auth: { id: 'participant' },
      }),
    ).toThrow('já foi')
  })
})
