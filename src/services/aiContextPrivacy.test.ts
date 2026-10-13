import { beforeEach, expect, it, vi } from 'vitest'
const { collection, rows } = vi.hoisted(() => ({
  collection: vi.fn(),
  rows: {} as Record<string, any[]>,
}))
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection } }))
vi.mock('@/services/orchestrationResolver', () => ({
  deriveEvidenceCurrency: () => ({
    historicalResponseIds: new Set(),
    historicalSignalIds: new Set(),
  }),
}))
import { resolveAuthorizedContext } from './aiContextResolver'

beforeEach(() => {
  vi.clearAllMocks()
  for (const key of Object.keys(rows)) delete rows[key]
  collection.mockImplementation((name: string) => ({
    create: vi.fn(async () => ({})),
    getFullList: vi.fn(async () =>
      name === 'professional_enrollment_access' ? [{ id: 'active-link' }] : rows[name] || [],
    ),
  }))
})

it('does not expose private records returned despite query filters to AI or its audit', async () => {
  rows.experience_responses = [
    { id: 'private', access_class: 'participant_private', free_text: 'PRIVATE_MARKER' },
    { id: 'shared', access_class: 'shared_care', free_text: 'Shared choice' },
  ]
  rows.cer_knowledge_items = [
    { id: 'private-ki', access_class: 'professional_private', statement: 'CLINICAL_MARKER' },
    { id: 'shared-ki', access_class: 'participant_shared', statement: 'Shared hypothesis' },
  ]
  const result = await resolveAuthorizedContext({
    humanUserId: 'professional',
    enrollmentId: 'enrollment',
    purpose: 'brief',
    requestedCategories: ['experience_responses', 'cer_knowledge_items'],
  })
  expect(result.isAuthorized).toBe(true)
  expect(result.sources.map((s) => s.source_id)).toEqual(['shared', 'shared-ki'])
  expect(JSON.stringify(result)).not.toMatch(/PRIVATE_MARKER|CLINICAL_MARKER/)
  const auditClients = collection.mock.results.filter(
    (_, i) => collection.mock.calls[i][0] === 'audit_events',
  )
  for (const client of auditClients) {
    expect(JSON.stringify(client.value.create.mock.calls)).not.toMatch(
      /PRIVATE_MARKER|CLINICAL_MARKER/,
    )
  }
})

it('does not query journals or next-session messages even if requested at runtime', async () => {
  const result = await resolveAuthorizedContext({
    humanUserId: 'professional',
    enrollmentId: 'enrollment',
    purpose: 'brief',
    requestedCategories: [
      'cer_journal_entries',
      'cer_journal_entry_versions',
      'cer_next_session_messages',
    ] as any,
  })
  expect(result.sources).toEqual([])
  expect(collection.mock.calls.map((c) => c[0])).not.toEqual(
    expect.arrayContaining(['cer_journal_entries']),
  )
  expect(collection.mock.calls.map((c) => c[0])).not.toEqual(
    expect.arrayContaining(['cer_journal_entry_versions']),
  )
  expect(collection.mock.calls.map((c) => c[0])).not.toEqual(
    expect.arrayContaining(['cer_next_session_messages']),
  )
})

it('denies context without active professional access before reading care records', async () => {
  collection.mockImplementation(() => ({
    create: vi.fn(async () => ({})),
    getFullList: vi.fn(async () => []),
  }))
  const result = await resolveAuthorizedContext({
    humanUserId: 'unlinked',
    enrollmentId: 'enrollment',
    purpose: 'brief',
  })
  expect(result.isAuthorized).toBe(false)
  expect(result.sources).toEqual([])
  expect(collection.mock.calls.map((c) => c[0])).toEqual([
    'audit_events',
    'professional_enrollment_access',
    'audit_events',
  ])
})
