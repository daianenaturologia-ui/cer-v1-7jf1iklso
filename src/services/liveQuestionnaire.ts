import pb from '@/lib/pocketbase/client'

/** Same stable 15-character key used by the additive catalog migration. */
export function questionnaireRecordId(kind: string, logicalId: string): string {
  const hash = (salt: string) => {
    let value = 2166136261
    for (const char of `${salt}:${kind}:${logicalId}`) {
      value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0
    }
    return value.toString(36).padStart(7, '0')
  }
  return `c${hash('cer1')}${hash('cer2')}`
}

export function normalizeLiveResponse<
  T extends { experience_id: string; prompt_id: string; expand?: any },
>(record: T): T {
  const identity = record as T & {
    structured_value?: { metadata?: { canonical_prompt_id?: unknown } }
    backend_prompt_id?: string
    backend_experience_id?: string
  }
  const candidate =
    record.expand?.prompt_id?.schema_config?.cer_logical_prompt_id ||
    identity.structured_value?.metadata?.canonical_prompt_id
  const logicalId = typeof candidate === 'string' && candidate.trim() ? candidate : undefined
  return {
    ...record,
    ...(logicalId ? { prompt_id: logicalId } : {}),
    // Preserve real relation IDs for consumers that need a backend record.
    backend_prompt_id: identity.backend_prompt_id || record.prompt_id,
    backend_experience_id: identity.backend_experience_id || record.experience_id,
  }
}

export async function prepareLiveQuestionnaire(
  enrollmentId: string,
  experienceId: string,
  promptId?: string,
) {
  return pb.send<{
    experience_id: string
    prompt_id?: string
    enrollment_experience: any
  }>('/backend/v1/cer/questionnaires/prepare', {
    method: 'POST',
    body: { enrollment_id: enrollmentId, experience_id: experienceId, prompt_id: promptId || '' },
  })
}
