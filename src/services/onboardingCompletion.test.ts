import { beforeEach, expect, test, vi } from 'vitest'
import { completeOnboarding, hasCompletedOnboarding } from './onboardingCompletion'

const send = vi.hoisted(() => vi.fn())
vi.mock('@/lib/pocketbase/client', () => ({ default: { send } }))
beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

test('an old browser flag cannot hide unfinished real onboarding', () => {
  localStorage.setItem('cer_onboarding_completed_enrollment', 'true')
  expect(hasCompletedOnboarding({ current_stage: 'onboarding' }, false, 'enrollment')).toBe(false)
  expect(hasCompletedOnboarding({ current_stage: 'onboarding' }, true, 'enrollment')).toBe(true)
})

test('confirmed or advanced server progress stays completed on a fresh browser', () => {
  expect(hasCompletedOnboarding({ current_stage: 'onboarding', metadata: { onboarding_completed: true } }, false, 'enrollment')).toBe(true)
  expect(hasCompletedOnboarding({ current_stage: 'consciousness' }, false, 'enrollment')).toBe(true)
  expect(hasCompletedOnboarding({ current_stage: 'equilibrium_realization' }, false, 'enrollment')).toBe(true)
})

test('completion uses the restricted server action, without local completion flags', async () => {
  send.mockResolvedValueOnce({ completed: true, current_stage: 'consciousness' })
  await completeOnboarding('enrollment')
  expect(send).toHaveBeenCalledExactlyOnceWith('/backend/v1/cer/onboarding/complete', {
    method: 'POST', body: { enrollment_id: 'enrollment' }, requestKey: null,
  })
  expect(localStorage.length).toBe(0)
})

test('server failures remain retryable without publishing local success', async () => {
  send.mockRejectedValueOnce({ status: 503 })
  await expect(completeOnboarding('enrollment')).rejects.toMatchObject({ status: 503 })
  expect(hasCompletedOnboarding({ current_stage: 'onboarding' }, false, 'enrollment')).toBe(false)
  expect(localStorage.length).toBe(0)
  send.mockResolvedValueOnce({ completed: true })
  await expect(completeOnboarding('enrollment')).resolves.toBeUndefined()
})

test('a response without server confirmation is not accepted as success', async () => {
  send.mockResolvedValueOnce({})
  await expect(completeOnboarding('enrollment')).rejects.toThrow('ainda não foi confirmado')
})
