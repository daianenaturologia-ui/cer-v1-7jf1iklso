import { beforeEach, expect, it, vi } from 'vitest'
import { enrollmentService } from './cer'
const fns = vi.hoisted(() => ({
  demo: false,
  getOne: vi.fn(),
  getList: vi.fn(),
  filter: vi.fn((f, v) => JSON.stringify([f, v])),
  collection: vi.fn(),
}))
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    authStore: { record: { id: 'account' } },
    filter: fns.filter,
    collection: fns.collection,
  },
}))
vi.mock('@/services/demoAdapter', () => ({
  demoAdapter: { isEnabled: () => fns.demo, getActivePersona: () => 'mariana' },
  DEMO_ENROLLMENT: { id: 'demo' },
  DEMO_USER_MARIANA: { id: 'demo-user' },
}))
beforeEach(() => {
  vi.clearAllMocks()
  fns.demo = false
  fns.collection.mockImplementation((name) =>
    name === 'users' ? { getOne: fns.getOne } : { getList: fns.getList },
  )
})
it('resolve a matrícula pela pessoa da conta autenticada, incluindo início do percurso', async () => {
  fns.getOne.mockResolvedValue({ id: 'account', person_id: 'person', status: 'active' })
  fns.getList.mockResolvedValue({ items: [{ id: 'enrollment' }] })
  expect(await enrollmentService.getActiveForUser('account')).toEqual({ id: 'enrollment' })
  expect(fns.getOne).toHaveBeenCalledWith('account')
  expect(fns.filter).toHaveBeenCalledWith(expect.stringContaining('onboarding'), {
    person: 'person',
  })
  expect(fns.getList.mock.calls[0][2].filter).not.toContain('user_account_id')
})
it('não busca a conta de outra pessoa nem silencia falha do servidor como matrícula vazia', async () => {
  await expect(enrollmentService.getActiveForUser('other')).rejects.toThrow('sua conta')
  expect(fns.collection).not.toHaveBeenCalled()
  fns.getOne.mockRejectedValue(new Error('backend unavailable'))
  await expect(enrollmentService.getActiveForUser('account')).rejects.toThrow('backend unavailable')
})
it('demonstração não consulta servidor e recusa outra identidade', async () => {
  fns.demo = true
  expect(await enrollmentService.getActiveForUser('demo-user')).toEqual({ id: 'demo' })
  expect(await enrollmentService.getActiveForUser('other')).toBeNull()
  expect(fns.collection).not.toHaveBeenCalled()
})
