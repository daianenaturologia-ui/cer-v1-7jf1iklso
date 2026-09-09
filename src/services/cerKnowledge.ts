import pb from '@/lib/pocketbase/client'
import {
  CerFrameworkRecord,
  CerPromptSignalRuleRecord,
  CerSignalRecord,
  SignalType,
  SignalTemporality,
  SignalSourceType,
  VisibilityClass,
} from '@/types/cer'

/**
 * Service de gerenciamento de Frameworks (Referenciais Epistemológicos)
 */
export const cerFrameworkService = {
  async listFrameworks(): Promise<CerFrameworkRecord[]> {
    return pb.collection('cer_frameworks').getFullList<CerFrameworkRecord>({
      filter: 'is_active = true',
      sort: 'framework_key',
    })
  },

  async getFrameworkByKey(key: string): Promise<CerFrameworkRecord | null> {
    try {
      return await pb
        .collection('cer_frameworks')
        .getFirstListItem<CerFrameworkRecord>(`framework_key = "${key}"`)
    } catch {
      return null
    }
  },
}

/**
 * Service de regras metodológicas Prompt -> Signal
 */
export const cerSignalRuleService = {
  async listRulesByPrompt(promptId: string): Promise<CerPromptSignalRuleRecord[]> {
    return pb.collection('cer_prompt_signal_rules').getFullList<CerPromptSignalRuleRecord>({
      filter: `prompt_id = "${promptId}" && is_active = true`,
      expand: 'framework_id,dimension_id',
    })
  },

  async createRule(data: Partial<CerPromptSignalRuleRecord>): Promise<CerPromptSignalRuleRecord> {
    return pb.collection('cer_prompt_signal_rules').create<CerPromptSignalRuleRecord>(data)
  },
}

/**
 * Service de Signals (Knowledge & Provenance Layer)
 */
export const cerSignalService = {
  async listSignalsByEnrollment(enrollmentId: string): Promise<CerSignalRecord[]> {
    return pb.collection('cer_signals').getFullList<CerSignalRecord>({
      filter: `enrollment_id = "${enrollmentId}" && status = "active"`,
      expand: 'dimension_id,source_response_id,source_prompt_id,framework_id',
      sort: '-created',
    })
  },

  async getSignalById(id: string): Promise<CerSignalRecord> {
    return pb.collection('cer_signals').getOne<CerSignalRecord>(id, {
      expand: 'dimension_id,source_response_id,source_prompt_id,framework_id,created_by_user_id',
    })
  },

  async createSignal(data: {
    enrollment_id: string
    signal_type: SignalType
    concept_key: string
    dimension_id?: string
    temporality: SignalTemporality
    source_type: SignalSourceType
    source_response_id?: string
    source_prompt_id?: string
    source_experience_id?: string
    framework_id?: string
    created_by_user_id?: string
    access_class: VisibilityClass
    status?: 'active' | 'archived' | 'superseded' | 'rejected'
  }): Promise<CerSignalRecord> {
    return pb.collection('cer_signals').create<CerSignalRecord>({
      ...data,
      status: data.status || 'active',
    })
  },
}
