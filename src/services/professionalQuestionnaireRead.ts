import type { ExperienceResponseRecord } from '@/types/cer'
import { BUILD_07C_MENTE_PROMPTS, BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'
import { BUILD_07D_RELACOES_PROMPTS } from './build07dPrompts'
import { BUILD_07E_SEXUALIDADE_PROMPTS } from './build07ePrompts'
import { BUILD_07F_SENTIDO_PROMPTS } from './build07fPrompts'

const prompts = [...BUILD_07C_MENTE_PROMPTS, ...BUILD_07C_REGULACAO_PROMPTS,
  ...BUILD_07D_RELACOES_PROMPTS, ...BUILD_07E_SEXUALIDADE_PROMPTS, ...BUILD_07F_SENTIDO_PROMPTS]
export function isSharedQuestionnaireRecord(record: { access_class?: string; structured_value?: unknown }) {
  if (!['shared_care', 'participant_shared'].includes(record.access_class || '')) return false
  const value = record.structured_value as any
  return !value || typeof value !== 'object' ||
    (!('private_text' in value || 'share_private_text_with_professional' in value) ||
      value.share_private_text_with_professional === true)
}
export function professionalQuestionnaireResponses(records: ExperienceResponseRecord[], enrollmentId: string) {
  return records.filter(r => r.enrollment_id === enrollmentId &&
    ['saved','revised'].includes(r.status) && isSharedQuestionnaireRecord(r)).map(r => {
      const value = r.structured_value as any
      const key = (r as any).prompt_key || value?.prompt_key || value?.metadata?.prompt_key
      const prompt = r.expand?.prompt_id || prompts.find(p => p.id === r.prompt_id ||
        (p.schema_config as any)?.prompt_key === key)
      return prompt ? { ...r, expand: { ...r.expand, prompt_id: prompt } } : { ...r }
    }).filter(r => (r.expand?.prompt_id?.schema_config as any)?.access_destination !== 'participant_private')
}
