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
import {
  CerAssociationRecord,
  CerAssociationEvidenceRecord,
  CerKnowledgeItemRecord,
  CerKnowledgeEvidenceRecord,
  CerParticipantRecognitionRecord,
  CerKnowledgeItemVersionRecord,
  AssociationType,
  KnowledgeType,
  KnowledgeStatus,
  RecognitionType,
  EvidenceRelationType,
  KnowledgeEvidenceType,
} from '@/types/cer'

/**
 * Service de Associações e Evidências (Checkpoint 03B)
 */
export const cerAssociationService = {
  async listByEnrollment(enrollmentId: string): Promise<CerAssociationRecord[]> {
    return pb.collection('cer_associations').getFullList<CerAssociationRecord>({
      filter: `enrollment_id = "${enrollmentId}" && status = "active"`,
      expand: 'created_by_user_id',
      sort: '-created',
    })
  },

  async getById(id: string): Promise<CerAssociationRecord> {
    return pb.collection('cer_associations').getOne<CerAssociationRecord>(id, {
      expand: 'created_by_user_id',
    })
  },

  async createAssociation(data: {
    enrollment_id: string
    concept_key: string
    association_type: AssociationType
    temporality: SignalTemporality
    status?: 'active' | 'archived' | 'superseded' | 'rejected'
    access_class: VisibilityClass
    created_by_user_id?: string
  }): Promise<CerAssociationRecord> {
    return pb.collection('cer_associations').create<CerAssociationRecord>({
      ...data,
      status: data.status || 'active',
    })
  },

  async addEvidence(data: {
    association_id: string
    signal_id: string
    relation_type: EvidenceRelationType
    evidence_group_key?: string
  }): Promise<CerAssociationEvidenceRecord> {
    return pb.collection('cer_association_evidence').create<CerAssociationEvidenceRecord>(data)
  },

  async listEvidenceByAssociation(associationId: string): Promise<CerAssociationEvidenceRecord[]> {
    return pb.collection('cer_association_evidence').getFullList<CerAssociationEvidenceRecord>({
      filter: `association_id = "${associationId}"`,
      expand: 'signal_id,signal_id.dimension_id,signal_id.framework_id',
      sort: 'created',
    })
  },
}

/**
 * Service de Knowledge Items e Evidências (Checkpoint 03B)
 */
export const cerKnowledgeItemService = {
  async listByEnrollment(enrollmentId: string): Promise<CerKnowledgeItemRecord[]> {
    return pb.collection('cer_knowledge_items').getFullList<CerKnowledgeItemRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      expand: 'primary_dimension_id,framework_id,created_by_user_id,reviewed_by_user_id',
      sort: '-updated',
    })
  },

  async getById(id: string): Promise<CerKnowledgeItemRecord> {
    return pb.collection('cer_knowledge_items').getOne<CerKnowledgeItemRecord>(id, {
      expand: 'primary_dimension_id,framework_id,created_by_user_id,reviewed_by_user_id',
    })
  },

  async createKnowledgeItem(data: {
    enrollment_id: string
    concept_key: string
    knowledge_type: KnowledgeType
    statement: string
    epistemic_source: SignalSourceType
    temporality: SignalTemporality
    primary_dimension_id?: string
    framework_id?: string
    status: KnowledgeStatus
    access_class: VisibilityClass
    created_by_user_id?: string
    version?: number
  }): Promise<CerKnowledgeItemRecord> {
    return pb.collection('cer_knowledge_items').create<CerKnowledgeItemRecord>({
      ...data,
      version: data.version || 1,
    })
  },

  async updateKnowledgeItem(
    id: string,
    data: {
      statement?: string
      status?: KnowledgeStatus
      access_class?: VisibilityClass
      reviewed_by_user_id?: string
      knowledge_type?: KnowledgeType
      temporality?: SignalTemporality
      primary_dimension_id?: string
      framework_id?: string
    },
  ): Promise<CerKnowledgeItemRecord> {
    return pb.collection('cer_knowledge_items').update<CerKnowledgeItemRecord>(id, data)
  },

  async addEvidence(data: {
    knowledge_item_id: string
    evidence_type: KnowledgeEvidenceType
    evidence_id: string
    relation_type: EvidenceRelationType
  }): Promise<CerKnowledgeEvidenceRecord> {
    return pb.collection('cer_knowledge_evidence').create<CerKnowledgeEvidenceRecord>(data)
  },

  async listEvidenceByKnowledgeItem(
    knowledgeItemId: string,
  ): Promise<CerKnowledgeEvidenceRecord[]> {
    return pb.collection('cer_knowledge_evidence').getFullList<CerKnowledgeEvidenceRecord>({
      filter: `knowledge_item_id = "${knowledgeItemId}"`,
      sort: 'created',
    })
  },

  async listVersions(knowledgeItemId: string): Promise<CerKnowledgeItemVersionRecord[]> {
    return pb.collection('cer_knowledge_item_versions').getFullList<CerKnowledgeItemVersionRecord>({
      filter: `knowledge_item_id = "${knowledgeItemId}"`,
      sort: 'version_number',
    })
  },
}

/**
 * Service de Reconhecimento pela Participante (Checkpoint 03B)
 */
export const cerParticipantRecognitionService = {
  async listByEnrollment(enrollmentId: string): Promise<CerParticipantRecognitionRecord[]> {
    return pb
      .collection('cer_participant_recognitions')
      .getFullList<CerParticipantRecognitionRecord>({
        filter: `enrollment_id = "${enrollmentId}"`,
        expand: 'knowledge_item_id,participant_user_id',
        sort: '-created',
      })
  },

  async createRecognition(data: {
    enrollment_id: string
    knowledge_item_id: string
    participant_user_id?: string
    recognition_type: RecognitionType
    comment?: string
    access_class?: VisibilityClass
  }): Promise<CerParticipantRecognitionRecord> {
    return pb.collection('cer_participant_recognitions').create<CerParticipantRecognitionRecord>({
      ...data,
      access_class: data.access_class || 'shared_care',
    })
  },
}

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
