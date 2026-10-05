import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import vm from 'node:vm'

const source = readFileSync('pocketbase/hooks/on_session_ai_proposal.js', 'utf8')
const sessionId = 'session00000001'
const actorId = 'professional001'
const proposal = { summary: 'Uma hipótese para revisar em conjunto.', changes: [{ dimension: 'Regulação', proposal: 'Explorar o relato, sem afirmar causalidade.', basis: ['session_note'], uncertainty: 'high' }], questions: ['Como você percebe esse recurso?'] }
function record(values: Record<string, unknown>, id = 'record000000001') { return { id, getString: (key: string) => String(values[key] ?? ''), set: vi.fn() } }
function harness(options: Record<string, any> = {}) {
  let handler: any
  const saved: any[] = []
  const noteValues = { author_user_id: actorId, enrollment_id: 'enrollment', session_id: sessionId, text: 'RELATO FICTÍCIO PRIVADO', updated: '2026-10-05' }
  const note = record(noteValues)
  const session = record({ enrollment_id: 'enrollment', professional_user_id: options.otherProfessional ? 'other' : actorId, status: options.cancelled ? 'cancelled' : 'completed' })
  const map = record({ reading_snapshot: JSON.stringify({ participantName: 'NOME NÃO ENVIADO', overview: 'Leitura publicada', lifeEvents: [{ title: 'Marco compartilhado' }] }) }, 'map000000000001')
  let callCount = 0
  const app = {
    findRecordById: vi.fn((collection: string) => collection === 'cer_sessions' ? session : note),
    findFirstRecordByFilter: vi.fn((_collection: string, _filter: string, params: any) => { expect(params.actor).toBe(actorId); if (options.noNote) throw Error('No note'); return note }),
    findRecordsByFilter: vi.fn((collection: string) => {
      if (collection === 'professional_enrollment_access') return options.noAccess || options.revoke && callCount ? [] : [{}]
      if (collection === 'user_roles') return options.noRole ? [] : [{}]
      if (collection === 'audit_events') return options.cooldown ? [{}] : []
      if (collection === 'cer_maps') return options.noMap ? [] : [map]
      throw Error('Unapproved collection: ' + collection)
    }),
    findCollectionByNameOrId: vi.fn(() => ({})),
    save: vi.fn((audit: any) => { saved.push(audit) }),
  }
  const send = vi.fn((_request: any) => {
    callCount++
    if (options.changed) noteValues.text = 'Outra nota'
    if (options.transportFailure) throw Error('PROVIDER BODY SECRET')
    return options.response || { statusCode: 200, json: { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(options.output || proposal) } }] } }
  })
  const env = { CER_SESSION_AI_ENABLED: 'true', CER_SESSION_AI_OPENAI_API_KEY: 'SERVER_ONLY_SECRET', CER_SESSION_AI_MODEL: 'configured-model', ...options.env }
  vm.runInNewContext(source, { routerAdd: (_method: any, _path: any, fn: any) => { handler = fn }, $apis: { requireAuth: () => ({}) }, $os: { getenv: (name: string) => env[name as keyof typeof env] || '' }, $security: { sha256: (text: string) => createHash('sha256').update(text).digest('hex') }, $http: { send }, Record: function(this: any) { this.fields = {}; this.set = (key: string, value: any) => { this.fields[key] = value } }, ForbiddenError: Error, BadRequestError: Error })
  const event = { auth: options.guest ? null : { id: actorId }, requestInfo: () => ({ body: options.body || { sessionId } }), app, response: { header: () => ({ set: vi.fn() }) }, json: (status: number, body: any) => ({ status, body }) }
  return { invoke: () => handler(event), app, send, saved }
}
describe('Dedicated session AI server route (simulated PocketBase events)', () => {
  it('uses only server-resolved sources, removes participant name and never writes a map', () => {
    const h = harness(); const result = h.invoke()
    expect(result.status).toBe(200)
    expect(result.body.status).toBe('pending_review')
    expect(result.body.sources.mapId).toBe('map000000000001')
    const req = h.send.mock.calls[0][0]
    const payload = JSON.parse(req.body)
    expect(req.url).toBe('https://api.openai.com/v1/chat/completions')
    expect(payload.store).toBe(false)
    expect(req.timeout).toBe(45)
    expect(payload.messages[1].content).toContain('RELATO FICTÍCIO PRIVADO')
    expect(payload.messages[1].content).not.toContain('NOME NÃO ENVIADO')
    expect(JSON.stringify(result)).not.toContain('SERVER_ONLY_SECRET')
    expect(h.app.save).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(h.saved)).not.toContain('RELATO FICTÍCIO PRIVADO')
    expect(h.saved[0].fields.result).toBe('success')
  })
  it.each([{ guest: true }, { noAccess: true }, { noRole: true }, { otherProfessional: true }, { cancelled: true }, { noNote: true }, { body: { sessionId, text: 'Injected source' } }])('denies unauthorized or injected context before provider call: %j', (options) => {
    const h = harness(options); expect(h.invoke).toThrow(); expect(h.send).not.toHaveBeenCalled()
  })
  it('stays inactive without server configuration', () => {
    const h = harness({ env: { CER_SESSION_AI_ENABLED: 'false' } })
    expect(h.invoke().body.code).toBe('ai_not_configured'); expect(h.send).not.toHaveBeenCalled()
  })
  it('rejects repeated requests before invoking the provider', () => {
    const h = harness({ cooldown: true }); expect(h.invoke().status).toBe(429); expect(h.send).not.toHaveBeenCalled()
  })
  it.each([
    { transportFailure: true },
    { response: { statusCode: 401, json: { error: 'SERVER_ONLY_SECRET' } } },
    { response: { statusCode: 200, json: { choices: [{ finish_reason: 'length', message: { content: '{}' } }] } } },
    { output: { ...proposal, changes: [{ ...proposal.changes[0], basis: ['participant_private'] }] } },
    { noMap: true, output: { ...proposal, changes: [{ ...proposal.changes[0], basis: ['published_map'] }] } },
    { output: { ...proposal, changes: [{ ...proposal.changes[0], uncertainty: 'low' }] } },
    { output: { ...proposal, rawNote: 'PRIVATE DATA MUST NOT BE RETURNED' } },
  ])('fails closed for incomplete or ungrounded output: %j', (options) => {
    const result = harness(options).invoke(); expect(result.status).toBe(502); expect(JSON.stringify(result)).not.toMatch(/SERVER_ONLY_SECRET|PROVIDER BODY SECRET/)
  })
  it('rejects a note edited while the provider is running', () => { expect(harness({ changed: true }).invoke().status).toBe(409) })
  it('rechecks access after the provider call', () => { expect(harness({ revoke: true }).invoke).toThrow('Encontro fora') })
  it('permits insufficient evidence without fabricating changes', () => {
    const result = harness({ noMap: true, output: { summary: '', changes: [], questions: ['O que falta explorar?'] } }).invoke()
    expect(result.status).toBe(200); expect(result.body.sources.mapId).toBeNull()
  })
})
