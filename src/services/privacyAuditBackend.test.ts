import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

describe('Security audit patches — simulated events, not live RLS certification', () => {
  it('prepares scoped identity rules and refuses to silently restore public access', () => {
    let up: any, down: any
    vm.runInNewContext(readFileSync('pocketbase/migrations/0074_harden_identity_access.js', 'utf8'), { migrate: (first: any, second: any) => { up = first; down = second } })
    const persons: any = { name: 'persons', listRule: 'active users', viewRule: 'active users' }
    const users: any = { name: 'users', createRule: '' }
    const save = vi.fn()
    up({ findCollectionByNameOrId: (name: string) => name === 'persons' ? persons : users, save })
    expect(persons.listRule).toContain('professional_enrollment_access:access.enrollment_id ?= @collection.enrollments:scope.id')
    expect(persons.listRule).toContain('id = @request.auth.person_id')
    expect(persons.listRule).toContain('is_active ?= true')
    expect(persons.viewRule).toBe(persons.listRule)
    expect(persons.updateRule).toContain('@request.body.email:changed = false')
    expect(users.createRule).toContain('@request.body.status = "invited"')
    expect(users.createRule).not.toBe('')
    expect(save).toHaveBeenCalledTimes(2)
    expect(() => down({})).toThrow('Reversão')
  })
  it('does not copy a free-text withdrawal reason to the audit event', () => {
    const updates: any[] = []
    const audit: any[] = []
    vm.runInNewContext(readFileSync('pocketbase/hooks/on_consent_lifecycle.js', 'utf8'), {
      onRecordCreate: () => {}, onRecordAfterCreateSuccess: () => {}, onRecordUpdate: () => {}, onRecordDelete: () => {},
      onRecordAfterUpdateSuccess: (fn: any) => updates.push(fn),
      Record: function(this: any) { this.fields = {}; this.set = (key: string, value: any) => { this.fields[key] = value } },
      $app: { findCollectionByNameOrId: () => ({}), save: (r: any) => audit.push(r), findRecordsByFilter: () => [] },
    })
    const values: Record<string, string> = { record_status: 'withdrawn', participant_user_id: 'participant', withdrawal_reason: 'FICTITIOUS_PRIVATE_HEALTH_TEXT', enrollment_id: 'enrollment', practice_version_id: 'version' }
    const e = { record: { id: 'consent', getString: (key: string) => values[key] || '', original: () => ({ getString: () => 'current' }) }, next: vi.fn() }
    updates[0](e)
    expect(audit).toHaveLength(1)
    expect(JSON.parse(audit[0].fields.metadata).has_withdrawal_reason).toBe(true)
    expect(JSON.stringify(audit)).not.toContain('FICTITIOUS_PRIVATE_HEALTH_TEXT')
    expect(e.next).toHaveBeenCalled()
  })
})
