import { beforeEach, expect, it, vi } from 'vitest'
import {
  libraryCommunity as lib,
  emptyCommunityPractice,
  validateCommunityPractice,
} from './libraryCommunity'
import { demoAdapter } from './demoAdapter'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    send: vi.fn(() => {
      throw Error('No backend in demonstration')
    }),
  },
}))
const practice = {
  ...emptyCommunityPractice(),
  title: 'Teste fictício de pausa',
  instructions: 'Observe a luz. Pare quando quiser.',
  experience: 'Experiência fictícia de presença.',
  display_name: 'Apelido fictício',
}
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
it('keeps drafts private, requires consent, and exposes only an approved snapshot', async () => {
  const draft = await lib.save(practice, false, false)
  expect((await lib.feed()).items).toEqual([])
  await expect(lib.save(practice, true, false, draft)).rejects.toThrow(/Confirme/)
  const pending = await lib.save(practice, true, true, draft)
  await expect(lib.review(pending, 'approve', '')).rejects.toThrow(/Somente Daiane/)
  demoAdapter.enableDemo('daiane')
  expect((await lib.mine()).items).toEqual([])
  expect((await lib.queue()).items[0].status).toBe('pending')
  await lib.review(pending, 'approve', 'Adequada para o exemplo fictício')
  const post = (await lib.feed()).items[0]
  expect(post.payload).toEqual(practice)
  expect(Object.keys(post).sort()).toEqual(['created', 'id', 'payload'])
})
it('requires feedback and lets the author revise and resubmit', async () => {
  const pending = await lib.save(practice, true, true)
  demoAdapter.enableDemo('daiane')
  await expect(lib.review(pending, 'request_changes', '')).rejects.toThrow(/motivo/)
  await lib.review(pending, 'request_changes', 'Explique como adaptar.')
  demoAdapter.enableDemo('mariana')
  const returned = (await lib.mine()).items[0]
  expect(returned.review_note).toBe('Explique como adaptar.')
  const revised = await lib.save(
    { ...practice, instructions: 'Observe no seu ritmo; se preferir, sente-se.' },
    true,
    true,
    returned,
  )
  expect(revised.status).toBe('pending')
  expect((await lib.feed()).items).toEqual([])
})
it('withdraws approved content when edited and rejects stale approvals', async () => {
  const pending = await lib.save(practice, true, true)
  demoAdapter.enableDemo('daiane')
  const approved = await lib.review(pending, 'approve', '')
  await expect(lib.review(pending, 'approve', '')).rejects.toThrow(/versão mudou/)
  demoAdapter.enableDemo('mariana')
  const draft = await lib.save(
    { ...practice, instructions: 'Nova versão ainda não avaliada' },
    false,
    false,
    approved,
  )
  expect(draft.status).toBe('draft')
  expect((await lib.feed()).items).toEqual([])
  demoAdapter.enableDemo('daiane')
  expect((await lib.queue()).items).toEqual([])
  await expect(lib.save(practice, false, false, draft)).rejects.toThrow(/outra pessoa/)
})
it('publishes comments only after consent and allows owner withdrawal', async () => {
  await expect(
    lib.comment('catalog:cer-ritmo-v1', 'Meu apelido', 'Experiência fictícia', false),
  ).rejects.toThrow(/confirmação/)
  const comment = await lib.comment(
    'catalog:cer-ritmo-v1',
    'Meu apelido',
    'Experiência fictícia',
    true,
  )
  demoAdapter.enableDemo('daiane')
  const reader = (await lib.comments('catalog:cer-ritmo-v1')).items[0]
  expect(reader.mine).toBe(false)
  expect(Object.keys(reader).sort()).toEqual(['body', 'created', 'display_name', 'id', 'mine'])
  await expect(lib.removeComment(comment.id)).rejects.toThrow(/motivo/)
  demoAdapter.enableDemo('mariana')
  await lib.removeComment(comment.id)
  expect((await lib.comments('catalog:cer-ritmo-v1')).items).toEqual([])
})
it('hides removed community practice threads and records audit decisions', async () => {
  const pending = await lib.save(practice, true, true)
  demoAdapter.enableDemo('daiane')
  const approved = await lib.review(pending, 'approve', '')
  const key = 'community:' + (await lib.feed()).items[0].id
  demoAdapter.enableDemo('mariana')
  await lib.comment(key, 'Apelido', 'Relato fictício', true)
  await lib.withdraw(approved)
  expect((await lib.feed()).items).toEqual([])
  await expect(lib.comments(key)).rejects.toThrow(/disponível/)
  await expect(lib.history(pending.id)).rejects.toThrow(/Somente Daiane/)
  demoAdapter.enableDemo('daiane')
  const audit = (await lib.history(pending.id)).items
  expect(audit.map((r) => r.decision)).toContain('approve')
  expect(audit.map((r) => r.decision)).toContain('withdrawn')
})
it('limits shared fields and accepts incomplete private drafts', () => {
  expect(() => validateCommunityPractice(emptyCommunityPractice())).not.toThrow()
  expect(() => validateCommunityPractice(emptyCommunityPractice(), true)).toThrow()
  expect(() =>
    validateCommunityPractice({ ...practice, experience: 'x'.repeat(3001) }, true),
  ).toThrow()
  expect(() =>
    validateCommunityPractice(
      { ...practice, private_notes: 'must not copy' } as typeof practice,
      true,
    ),
  ).toThrow()
})
it('paginates contributions without truncating the accessible archive', async () => {
  for (let i = 0; i < 22; i++) await lib.save({ ...practice, title: 'Fictício ' + i }, false, false)
  const first = await lib.mine(),
    second = await lib.mine(2)
  expect(first.items).toHaveLength(20)
  expect(first.has_more).toBe(true)
  expect(second.items).toHaveLength(2)
  expect(second.has_more).toBe(false)
  expect(new Set([...first.items, ...second.items].map((r) => r.id)).size).toBe(22)
})
