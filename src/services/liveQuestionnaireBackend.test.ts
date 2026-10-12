import fs from 'node:fs'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import { questionnaireRecordId } from './liveQuestionnaire'

class BackendRecord {
  id: string
  values: Record<string, any>
  constructor(public collection: any, values: Record<string, any> = {}) { this.values = { ...values }; this.id = values.id || `record${Math.random().toString(36).slice(2)}` }
  get(key: string) { return this.values[key] }
  getString(key: string) { return String(this.values[key] || '') }
  set(key: string, value: any) { if (key === 'id') this.id = value; else this.values[key] = value }
  publicExport() { return { ...this.values, id: this.id } }
}

function fixture() {
  const records = new Map<string, BackendRecord>()
  const enums = new Map<string, any>()
  const collections = new Map<string, any>()
  const app: any = {
    findCollectionByNameOrId(name: string) {
      if (!collections.has(name)) {
        const field = { values: ['ChoiceCards'] }
        enums.set(name, field)
        collections.set(name, { name, createRule: 'original-rule', fields: { getByName: () => field } })
      }
      return collections.get(name)
    },
    findRecordById(name: string, id: string) { const record = records.get(`${name}:${id}`); if (!record) throw new Error('not found'); return record },
    save(record: any) { if (record instanceof BackendRecord) records.set(`${record.collection.name}:${record.id}`, record) },
    runInTransaction(callback: any) { callback(app) },
    findFirstRecordByFilter(name: string, _filter: string, params: any) {
      const found = [...records.values()].find(record => record.collection.name === name && record.getString('enrollment_id') === params.enrollment && (params.experience ? record.getString('experience_id') === params.experience : record.getString('professional_user_id') === params.user && record.get('is_active') === true))
      if (!found) throw new Error('not found')
      return found
    },
    findRecordsByFilter(name: string, _filter: string, _sort: string, _limit: number, _offset: number, params: any) {
      return [...records.values()].filter(record => record.collection.name === name && record.getString('enrollment_id') === params.enrollment && record.getString('experience_id') === params.experience && record.getString('response_type') === 'ChapterCompletion')
    },
  }
  let up: any
  vm.runInNewContext(fs.readFileSync('pocketbase/migrations/0076_live_questionnaire_catalog.js', 'utf8'), { migrate: (callback: any) => { up = callback }, Record: BackendRecord })
  up(app)
  const add = (collection: string, id: string, values: any) => { const record = new BackendRecord(app.findCollectionByNameOrId(collection), values); record.id = id; app.save(record); return record }
  const enrollment = add('enrollments', 'enrollment12345', { person_id: 'person123456789', status: 'active' })
  const auth = add('users', 'user12345678901', { person_id: 'person123456789' })
  let endpoint: any
  vm.runInNewContext(fs.readFileSync('pocketbase/hooks/on_live_questionnaire.js', 'utf8'), { routerAdd: (_method: string, _path: string, callback: any) => { endpoint = callback }, $app: app, $apis: { requireAuth: () => true }, Record: BackendRecord, ForbiddenError: Error, BadRequestError: Error })
  const call = (body: any, user = auth) => endpoint({ auth: user, requestInfo: () => ({ body: { enrollment_id: enrollment.id, experience_id: 'exp-corpo-fisiologia-07b', ...body } }), json: (_status: number, data: any) => data })
  return { app, records, collections, enums, up, add, call, auth, enrollment }
}

describe('Live catalog repair and enrollment boundary', () => {
  it('seeds real relations once, extends completion types and preserves existing data/rules', () => {
    const f = fixture()
    const original = f.add('cer_prompts', 'legacy123456789', { prompt_text: 'Existing answer catalog' })
    const before = f.records.size
    f.up(f.app)
    expect(f.records.size).toBe(before)
    expect(f.records.get('cer_prompts:legacy123456789')).toBe(original)
    expect(f.enums.get('experience_responses').values).toContain('ChapterCompletion')
    expect([...f.collections.values()].every(collection => collection.createRule === 'original-rule')).toBe(true)
    const prompts = [...f.records.values()].filter(record => record.collection.name === 'cer_prompts' && record !== original)
    expect(prompts).toHaveLength(131)
    expect(prompts.every(record => /^[a-z0-9]{15}$/.test(record.id) && f.records.has('cer_experiences:' + record.getString('experience_id')))).toBe(true)
  })
  it('prepares and resumes the same enrollment progress record', () => {
    const f = fixture()
    const one = f.call({ prompt_id: 'ayv_c1_p1_estrutura_corporal' })
    const two = f.call({ prompt_id: 'ayv_c1_p1_estrutura_corporal' })
    expect(one.experience_id).toBe(questionnaireRecordId('experience', 'exp-corpo-fisiologia-07b'))
    expect(one.prompt_id).toBe(questionnaireRecordId('prompt', 'ayv_c1_p1_estrutura_corporal'))
    expect(one.enrollment_experience.id).toBe(two.enrollment_experience.id)
  })
  it('rejects other participants, inactive enrollments and arbitrary catalog entries', () => {
    const f = fixture()
    const other = f.add('users', 'otheruser123456', { person_id: 'otherperson1234' })
    expect(() => f.call({}, other)).toThrow('Sem acesso')
    expect(() => f.call({ experience_id: 'anything' })).toThrow('não disponível')
    f.enrollment.set('status', 'paused')
    expect(() => f.call({})).toThrow('não está ativo')
  })
  it('does not reopen locked chapters', () => {
    const f = fixture()
    const prepared = f.call({})
    const progress = f.app.findRecordById('enrollment_experiences', prepared.enrollment_experience.id)
    progress.set('release_status', 'locked')
    expect(() => f.call({ prompt_id: 'ayv_c1_p1_estrutura_corporal' })).toThrow('não está disponível')
    expect(progress.getString('release_status')).toBe('locked')
  })
  it('creates only the next revision of an owned completed chapter and preserves its original prompt', () => {
    const f = fixture()
    const base = f.call({ prompt_id: 'ayv_c1_p1_estrutura_corporal' })
    expect(() => f.call({ prompt_id: 'ayv_c1_p1_estrutura_corporal_rev2' })).toThrow('revisão anterior')
    f.add('experience_responses', 'completion12345', { enrollment_id: f.enrollment.id, experience_id: base.experience_id, response_type: 'ChapterCompletion', structured_value: { completed: true, revision_number: 1, metadata: { prompt_key: 'ayv_c1_chapter1_completion' } } })
    const revised = f.call({ prompt_id: 'ayv_c1_p1_estrutura_corporal_rev2' })
    expect(revised.prompt_id).not.toBe(base.prompt_id)
    expect(f.app.findRecordById('cer_prompts', revised.prompt_id).get('schema_config').cer_logical_prompt_id).toBe('ayv_c1_p1_estrutura_corporal_rev2')
    expect(f.app.findRecordById('cer_prompts', base.prompt_id).get('schema_config').cer_logical_prompt_id).toBe('ayv_c1_p1_estrutura_corporal')
    expect(() => f.call({ prompt_id: 'ayv_c1_p1_estrutura_corporal_rev99' })).toThrow('revisão anterior')
  })
})
