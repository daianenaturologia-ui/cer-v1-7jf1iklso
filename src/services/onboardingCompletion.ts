import pb from '@/lib/pocketbase/client'

export function hasCompletedOnboarding(
  journey: { current_stage?: string; metadata?: Record<string, unknown> } | undefined,
  isDemo: boolean,
  enrollmentId: string,
) {
  return Boolean(
    journey?.metadata?.onboarding_completed ||
    (journey?.current_stage && journey.current_stage !== 'onboarding') ||
    (isDemo && localStorage.getItem(`cer_onboarding_completed_${enrollmentId}`)),
  )
}

export async function completeOnboarding(enrollmentId: string) {
  const result = await pb.send<{ completed: boolean }>('/backend/v1/cer/onboarding/complete', {
    method: 'POST', body: { enrollment_id: enrollmentId }, requestKey: null,
  })
  if (result?.completed !== true) throw new Error('O acolhimento ainda não foi confirmado.')
}
