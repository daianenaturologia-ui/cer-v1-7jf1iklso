/**
 * CER V1 — Constantes Constitucionais e Arquiteturais (BUILD 01 + BUILD 02 EXPERIENCE ENGINE)
 *
 * Entidades canônicas:
 * PERSON, USER_ACCOUNT, USER_ROLE, CER_PRODUCT, ENROLLMENT,
 * PROFESSIONAL_ENROLLMENT_ACCESS, JOURNEY_STATE, AUDIT_EVENT,
 * CER_DIMENSION, CER_EXPERIENCE, CER_PROMPT, ENROLLMENT_EXPERIENCE,
 * EXPERIENCE_RESPONSE, EXPERIENCE_RESPONSE_VERSION, FEATURE_FLAG.
 */

/**
 * Classes conceituais de visibilidade (Privacy by Design)
 * Conforme Seção 11 da Constituição CER V1.
 */
export const VISIBILITY_CLASSES = {
  PARTICIPANT_PRIVATE: 'participant_private',
  PARTICIPANT_SHARED: 'participant_shared',
  PROFESSIONAL_PRIVATE: 'professional_private',
  SHARED_CARE: 'shared_care',
  ADMINISTRATIVE: 'administrative',
  SYSTEM_INTERNAL: 'system_internal',
} as const

export type VisibilityClass = (typeof VISIBILITY_CLASSES)[keyof typeof VISIBILITY_CLASSES]

/**
 * As 6 Dimensões Oficiais e Congeladas da Consciência CER
 * Regra: Não criar novas dimensões nem alterar nomenclatura.
 * Energia, Consciência, Identidade e Evolução NÃO são dimensões separadas.
 */
export const CONSCIENCIA_DIMENSIONS = [
  {
    id: 'corpo_fisiologia',
    title: 'Corpo & Fisiologia',
    order: 1,
    description: 'Ritmos biológicos, sono, digestão, vitalidade corporal e sensações somáticas.',
  },
  {
    id: 'mente_emocoes',
    title: 'Mente & Emoções',
    order: 2,
    description: 'Processamento mental, estados emocionais, clareza e sobrecarga psíquica.',
  },
  {
    id: 'regulacao_respostas',
    title: 'Regulação & Padrões de Resposta',
    order: 3,
    description: 'Respostas ao estresse, autorregulação, co-regulação, reatividade e presença.',
  },
  {
    id: 'relacoes',
    title: 'Relações',
    order: 4,
    description: 'Vínculos significativos, comunicação, limites interpessoais e convivência.',
  },
  {
    id: 'sexualidade',
    title: 'Sexualidade',
    order: 5,
    description: 'Vitalidade íntima, desejo, relação com o prazer e autonomia erótica.',
  },
  {
    id: 'sentido_conexao',
    title: 'Sentido & Conexão',
    order: 6,
    description: 'Propósito, espiritualidade experiencial, pertencimento e valores estruturantes.',
  },
] as const

export type ConscienciaDimensionId = (typeof CONSCIENCIA_DIMENSIONS)[number]['id']

/**
 * Papéis de usuário (USER_ROLE)
 * Nota formal: 'admin' representa platform_admin (administrador técnico da plataforma),
 * sem acesso clínico ou metodológico automático ao conteúdo de interagentes.
 */
export const USER_ROLES = {
  INTERAGENTE: 'interagente',
  PROFISSIONAL: 'profissional',
  ADMIN: 'admin',
} as const

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Status da conta de autenticação (USER_ACCOUNT)
 */
export const USER_ACCOUNT_STATUS = {
  INVITED: 'invited',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
} as const

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUS)[keyof typeof USER_ACCOUNT_STATUS]

/**
 * Estados oficiais do ciclo de vida de Matrícula / Acompanhamento (ENROLLMENT)
 */
export const ENROLLMENT_STATUS = {
  INVITED: 'invited',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS]

/**
 * Níveis de Acesso da Profissional ao Enrollment (PROFESSIONAL_ENROLLMENT_ACCESS)
 */
export const PROFESSIONAL_ACCESS_ROLES = {
  PRIMARY: 'primary',
  COLLABORATOR: 'collaborator',
  SUPERVISOR: 'supervisor',
} as const

export type ProfessionalAccessRole =
  (typeof PROFESSIONAL_ACCESS_ROLES)[keyof typeof PROFESSIONAL_ACCESS_ROLES]

/**
 * Estágios estruturais da Jornada (JOURNEY_STATE)
 */
export const JOURNEY_STAGES = {
  ONBOARDING: 'onboarding',
  CONSCIOUSNESS: 'consciousness',
  EQUILIBRIUM_REALIZATION: 'equilibrium_realization',
} as const

export type JourneyStage = (typeof JOURNEY_STAGES)[keyof typeof JOURNEY_STAGES]

export const STAGE_STATUS = {
  NOT_STARTED: 'nao_iniciado',
  IN_PROGRESS: 'em_andamento',
  INTEGRATED: 'integrado',
} as const

export type StageStatus = (typeof STAGE_STATUS)[keyof typeof STAGE_STATUS]

export const EVOLUTION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  INTEGRATED: 'integrated',
} as const

export type EvolutionStatus = (typeof EVOLUTION_STATUS)[keyof typeof EVOLUTION_STATUS]

/**
 * Progressive Release da EXPERIENCE (Estados permitidos)
 */
export const EXPERIENCE_RELEASE_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
} as const

export type ExperienceReleaseStatus =
  (typeof EXPERIENCE_RELEASE_STATUS)[keyof typeof EXPERIENCE_RELEASE_STATUS]

/**
 * Progresso técnico interno da EXPERIENCE
 * Regra de UX: Na interface, evitar porcentagens de desempenho, rankings, pontos ou medalhas.
 * Progresso significa somente posição dentro da experiência.
 */
export const EXPERIENCE_PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

export type ExperienceProgressStatus =
  (typeof EXPERIENCE_PROGRESS_STATUS)[keyof typeof EXPERIENCE_PROGRESS_STATUS]

/**
 * Os 8 tipos de componentes reutilizáveis do Experience Engine
 */
export const COMPONENT_TYPES = {
  CHOICE_CARDS: 'ChoiceCards',
  MULTI_SELECT_CARDS: 'MultiSelectCards',
  SIMPLE_SCALE: 'SimpleScale',
  ORDERING: 'Ordering',
  BODY_MAP: 'BodyMap',
  TIMELINE: 'Timeline',
  FREE_REFLECTION: 'FreeReflection',
  SCENARIO_CHOICE: 'ScenarioChoice',
} as const

export type ComponentType = (typeof COMPONENT_TYPES)[keyof typeof COMPONENT_TYPES]

/**
 * Ações auditadas em AUDIT_EVENT
 */
export const AUDIT_ACTIONS = {
  ACCOUNT_INVITED: 'ACCOUNT_INVITED',
  ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  ENROLLMENT_CREATED: 'ENROLLMENT_CREATED',
  ENROLLMENT_PAUSED: 'ENROLLMENT_PAUSED',
  ENROLLMENT_RESUMED: 'ENROLLMENT_RESUMED',
  ENROLLMENT_COMPLETED: 'ENROLLMENT_COMPLETED',
  ENROLLMENT_CANCELLED: 'ENROLLMENT_CANCELLED',
  PROFESSIONAL_ACCESS_GRANTED: 'PROFESSIONAL_ACCESS_GRANTED',
  PROFESSIONAL_ACCESS_REVOKED: 'PROFESSIONAL_ACCESS_REVOKED',
  // Ações de auditoria do Experience Engine (Build 02)
  EXPERIENCE_RELEASED: 'EXPERIENCE_RELEASED',
  EXPERIENCE_STARTED: 'EXPERIENCE_STARTED',
  EXPERIENCE_COMPLETED: 'EXPERIENCE_COMPLETED',
  EXPERIENCE_PAUSED: 'EXPERIENCE_PAUSED',
  EXPERIENCE_REOPENED: 'EXPERIENCE_REOPENED',
  // Ações de auditoria do Knowledge & Provenance Layer (Build 03A)
  SIGNAL_CREATED: 'SIGNAL_CREATED',
  // Ações de auditoria do Conhecimento Longitudinal (Build 03B)
  ASSOCIATION_CREATED: 'ASSOCIATION_CREATED',
  KNOWLEDGE_ITEM_CREATED: 'KNOWLEDGE_ITEM_CREATED',
  KNOWLEDGE_ITEM_UPDATED: 'KNOWLEDGE_ITEM_UPDATED',
  KNOWLEDGE_ITEM_REVIEWED: 'KNOWLEDGE_ITEM_REVIEWED',
  PARTICIPANT_RECOGNITION_CREATED: 'PARTICIPANT_RECOGNITION_CREATED',
  // Ações de auditoria do Session Core (Build 04A)
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_COMPLETED: 'SESSION_COMPLETED',
  SESSION_CANCELLED: 'SESSION_CANCELLED',
  SESSION_NOTE_CREATED: 'SESSION_NOTE_CREATED',
  SESSION_NOTE_UPDATED: 'SESSION_NOTE_UPDATED',
  // Ações de auditoria de Presentation & Continuity (Build 04C)
  PRESENTATION_CREATED: 'PRESENTATION_CREATED',
  PRESENTATION_UPDATED_DRAFT: 'PRESENTATION_UPDATED_DRAFT',
  PRESENTATION_PRESENTED: 'PRESENTATION_PRESENTED',
  PRESENTATION_WITHDRAWN: 'PRESENTATION_WITHDRAWN',
  // Ações de auditoria do AI Core V1 (Build 05)
  AI_REQUESTED: 'AI_REQUESTED',
  AI_CONTEXT_RESOLVED: 'AI_CONTEXT_RESOLVED',
  AI_PROPOSAL_CREATED: 'AI_PROPOSAL_CREATED',
  AI_PROPOSAL_REVIEWED: 'AI_PROPOSAL_REVIEWED',
  AI_REQUEST_REFUSED: 'AI_REQUEST_REFUSED',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

/**
 * Produtos CER
 */
export const CER_PRODUCTS = {
  ACOMPANHAMENTO_INDIVIDUAL: 'acompanhamento_individual_cer',
} as const

export type CerProductId = (typeof CER_PRODUCTS)[keyof typeof CER_PRODUCTS]

// ==========================================
// INTERFACES DAS ENTIDADES DO BANCO DE DADOS
// ==========================================

export interface PersonRecord {
  id: string
  full_name: string
  preferred_name?: string
  email?: string
  phone?: string
  notes?: string
  created: string
  updated: string
}

// ------------------------------------------
// ENTIDADES DO BUILD 05 — AI CORE V1
// ------------------------------------------

export const AI_PROPOSAL_TYPES = {
  ASSOCIATION_SUGGESTION: 'association_suggestion',
  KNOWLEDGE_SUGGESTION: 'knowledge_suggestion',
  INTEGRATIVE_HYPOTHESIS: 'integrative_hypothesis',
} as const

export type AiProposalType = (typeof AI_PROPOSAL_TYPES)[keyof typeof AI_PROPOSAL_TYPES]

export const AI_PROPOSAL_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  DISCARDED: 'discarded',
  OBSERVING: 'observing',
} as const

export type AiProposalStatus = (typeof AI_PROPOSAL_STATUS)[keyof typeof AI_PROPOSAL_STATUS]

export const AI_REVIEW_ACTIONS = {
  APPROVED: 'approved',
  EDITED_AND_APPROVED: 'edited_and_approved',
  DISCARDED: 'discarded',
  OBSERVING: 'observing',
} as const

export type AiReviewAction = (typeof AI_REVIEW_ACTIONS)[keyof typeof AI_REVIEW_ACTIONS]

export const AI_OUTPUT_STATUS = {
  ANSWERED: 'answered',
  INSUFFICIENT_INFORMATION: 'insufficient_information',
  CONFLICTING_INFORMATION: 'conflicting_information',
  REFUSED: 'refused',
} as const

export type AiOutputStatus = (typeof AI_OUTPUT_STATUS)[keyof typeof AI_OUTPUT_STATUS]

export const AI_PROPOSAL_SOURCE_TYPES = {
  EXPERIENCE_RESPONSE: 'experience_response',
  SIGNAL: 'signal',
  ASSOCIATION: 'association',
  KNOWLEDGE_ITEM: 'knowledge_item',
  PARTICIPANT_RECOGNITION: 'participant_recognition',
  SESSION_OBSERVATION: 'session_observation',
} as const

export type AiProposalSourceType =
  (typeof AI_PROPOSAL_SOURCE_TYPES)[keyof typeof AI_PROPOSAL_SOURCE_TYPES]

export interface CerAiProposalRecord {
  id: string
  enrollment_id: string
  requested_by_user_id: string
  proposal_type: AiProposalType
  proposal_text: string
  edited_text?: string
  status: AiProposalStatus
  review_action?: AiReviewAction
  framework_id?: string
  target_knowledge_item_id?: string
  target_association_id?: string
  reviewed_by_user_id?: string
  reviewed_at?: string
  purpose?: string
  model_metadata?: {
    provider: string
    model: string
    model_version?: string
    prompt_version?: string
    schema_version?: string
  }
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    requested_by_user_id?: UserAccountRecord
    reviewed_by_user_id?: UserAccountRecord
    framework_id?: CerFrameworkRecord
    target_knowledge_item_id?: CerKnowledgeItemRecord
    target_association_id?: CerAssociationRecord
    cer_ai_proposal_sources_via_proposal_id?: CerAiProposalSourceRecord[]
  }
}

export interface CerAiProposalSourceRecord {
  id: string
  proposal_id: string
  source_type: AiProposalSourceType
  source_id: string
  source_version?: number
  relation_type?: EvidenceRelationType
  access_class?: VisibilityClass
  created: string
  updated: string
  expand?: {
    proposal_id?: CerAiProposalRecord
  }
}

/**
 * Contrato canônico de output estruturado AI V1
 */
export interface AiOutputContract {
  status: AiOutputStatus
  basis: Array<{
    source_type: AiProposalSourceType
    source_id: string
    source_version?: number
    concept_key?: string
    access_class: VisibilityClass
    relation_type?: EvidenceRelationType
  }>
  proposal_or_answer: string
  uncertainty: 'low' | 'medium' | 'high'
  missing_information: string[]
  conflicting_information: boolean | { description: string; paths: string[] }
  framework_id?: string
  epistemic_classification?: SignalSourceType | KnowledgeType
  suggested_question?: string
}

// ------------------------------------------
// ENTIDADES DO BUILD 04A — SESSION CORE
// ------------------------------------------

export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS]

export interface CerSessionRecord {
  id: string
  enrollment_id: string
  professional_user_id: string
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  status: SessionStatus
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    professional_user_id?: UserAccountRecord
    cer_session_notes_via_session_id?: CerSessionNoteRecord[]
  }
}

export interface CerSessionNoteRecord {
  id: string
  session_id: string
  enrollment_id: string
  author_user_id: string
  text?: string
  created: string
  updated: string
  expand?: {
    session_id?: CerSessionRecord
    enrollment_id?: EnrollmentRecord
    author_user_id?: UserAccountRecord
  }
}

// ------------------------------------------
// ENTIDADES DO BUILD 04B — KNOWLEDGE FROM SESSION
// ------------------------------------------

export const SESSION_OBSERVATION_TYPES = {
  PARTICIPANT_REPORT: 'participant_report',
  PROFESSIONAL_OBSERVATION: 'professional_observation',
} as const

export type SessionObservationType =
  (typeof SESSION_OBSERVATION_TYPES)[keyof typeof SESSION_OBSERVATION_TYPES]

export interface CerSessionObservationRecord {
  id: string
  session_id: string
  enrollment_id: string
  recorded_by_user_id: string
  observation_type: SessionObservationType
  text: string
  access_class: VisibilityClass
  created: string
  updated: string
  expand?: {
    session_id?: CerSessionRecord
    enrollment_id?: EnrollmentRecord
    recorded_by_user_id?: UserAccountRecord
  }
}

/**
 * Estrutura determinística de preparação pré-encontro (sem persistência)
 */
export interface SessionPreparationData {
  enrollment: EnrollmentRecord
  participantName: string
  lastCompletedSession?: CerSessionRecord
  lastSessionNote?: CerSessionNoteRecord
  recentKnowledgeItems: CerKnowledgeItemRecord[]
  recentRecognitions: CerParticipantRecognitionRecord[]
  recentCompletedExperiences: EnrollmentExperienceRecord[]
  // Build 04C aditivo: Continuity
  recentPresentations: CerKnowledgePresentationRecord[]
  continuityHighlights: {
    criticalRecognitions: CerParticipantRecognitionRecord[]
    supportiveRecognitions: CerParticipantRecognitionRecord[]
  }
}

// ------------------------------------------
// ENTIDADES DO BUILD 03B — CONHECIMENTO LONGITUDINAL
// ------------------------------------------

export const ASSOCIATION_TYPES = {
  RECURRENCE: 'recurrence',
  CONTRAST: 'contrast',
  CONTEXT_DEPENDENCY: 'context_dependency',
  CO_OCCURRENCE: 'co_occurrence',
  CHANGE_OVER_TIME: 'change_over_time',
  POSSIBLE_RELATIONSHIP: 'possible_relationship',
} as const

export type AssociationType = (typeof ASSOCIATION_TYPES)[keyof typeof ASSOCIATION_TYPES]

export const ASSOCIATION_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  SUPERSEDED: 'superseded',
  REJECTED: 'rejected',
} as const

export type AssociationStatus = (typeof ASSOCIATION_STATUS)[keyof typeof ASSOCIATION_STATUS]

export const EVIDENCE_RELATION_TYPES = {
  SUPPORTS: 'supports',
  CONTRASTS: 'contrasts',
  QUALIFIES: 'qualifies',
  CONTEXTUALIZES: 'contextualizes',
  UPDATES: 'updates',
} as const

export type EvidenceRelationType =
  (typeof EVIDENCE_RELATION_TYPES)[keyof typeof EVIDENCE_RELATION_TYPES]

export const KNOWLEDGE_TYPES = {
  REPORTED_FACT: 'reported_fact',
  RESOURCE: 'resource',
  CHALLENGE: 'challenge',
  PROTECTION_PATTERN: 'protection_pattern',
  CURRENT_STATE: 'current_state',
  VALUE_MEANING: 'value_meaning',
  REALIZATION_RELEVANT: 'realization_relevant',
  CONTEXTUAL_UNDERSTANDING: 'contextual_understanding',
  PATTERN_HYPOTHESIS: 'pattern_hypothesis',
  FRAMEWORK_READING: 'framework_reading',
  INTEGRATIVE_HYPOTHESIS: 'integrative_hypothesis',
} as const

export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[keyof typeof KNOWLEDGE_TYPES]

export const KNOWLEDGE_STATUS = {
  REPORTED: 'reported',
  OBSERVED: 'observed',
  REVIEWED: 'reviewed',
  UPDATED: 'updated',
  WITHDRAWN: 'withdrawn',
  NEW: 'new',
  OBSERVING: 'observing',
  SUPPORTED: 'supported',
  RECOGNIZED: 'recognized',
  NOT_CONFIRMED: 'not_confirmed',
  DISCARDED: 'discarded',
} as const

export type KnowledgeStatus = (typeof KNOWLEDGE_STATUS)[keyof typeof KNOWLEDGE_STATUS]

export const RECOGNITION_TYPES = {
  MAKES_SENSE: 'makes_sense',
  PARTIALLY_MAKES_SENSE: 'partially_makes_sense',
  DOES_NOT_RECOGNIZE: 'does_not_recognize',
  DEPENDS_ON_CONTEXT: 'depends_on_context',
  WANTS_TO_ADD: 'wants_to_add',
} as const

export type RecognitionType = (typeof RECOGNITION_TYPES)[keyof typeof RECOGNITION_TYPES]

export const KNOWLEDGE_EVIDENCE_TYPES = {
  RESPONSE: 'response',
  SIGNAL: 'signal',
  ASSOCIATION: 'association',
  PARTICIPANT_RECOGNITION: 'participant_recognition',
  PROFESSIONAL_OBSERVATION: 'professional_observation',
  PARTICIPANT_REPORT_IN_SESSION: 'participant_report_in_session',
} as const

export type KnowledgeEvidenceType =
  (typeof KNOWLEDGE_EVIDENCE_TYPES)[keyof typeof KNOWLEDGE_EVIDENCE_TYPES]

export interface CerAssociationRecord {
  id: string
  enrollment_id: string
  concept_key: string
  association_type: AssociationType
  temporality: SignalTemporality
  status: AssociationStatus
  access_class: VisibilityClass
  created_by_user_id?: string
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    created_by_user_id?: UserAccountRecord
    cer_association_evidence_via_association_id?: CerAssociationEvidenceRecord[]
  }
}

export interface CerAssociationEvidenceRecord {
  id: string
  association_id: string
  signal_id: string
  relation_type: EvidenceRelationType
  evidence_group_key?: string
  created: string
  updated: string
  expand?: {
    association_id?: CerAssociationRecord
    signal_id?: CerSignalRecord
  }
}

export interface CerKnowledgeItemRecord {
  id: string
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
  reviewed_by_user_id?: string
  version: number
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    primary_dimension_id?: CerDimensionRecord
    framework_id?: CerFrameworkRecord
    created_by_user_id?: UserAccountRecord
    reviewed_by_user_id?: UserAccountRecord
    cer_knowledge_evidence_via_knowledge_item_id?: CerKnowledgeEvidenceRecord[]
    cer_participant_recognitions_via_knowledge_item_id?: CerParticipantRecognitionRecord[]
    cer_knowledge_item_versions_via_knowledge_item_id?: CerKnowledgeItemVersionRecord[]
  }
}

export interface CerKnowledgeEvidenceRecord {
  id: string
  knowledge_item_id: string
  evidence_type: KnowledgeEvidenceType
  evidence_id: string
  relation_type: EvidenceRelationType
  created: string
  updated: string
  expand?: {
    knowledge_item_id?: CerKnowledgeItemRecord
  }
}

export const PRESENTATION_STATUS = {
  DRAFT: 'draft',
  PRESENTED: 'presented',
  WITHDRAWN: 'withdrawn',
} as const

export type PresentationStatus = (typeof PRESENTATION_STATUS)[keyof typeof PRESENTATION_STATUS]

export const PRESENTATION_CHANNELS = {
  APP: 'app',
  SESSION: 'session',
} as const

export type PresentationChannel = (typeof PRESENTATION_CHANNELS)[keyof typeof PRESENTATION_CHANNELS]

export const RECOGNITION_RECORD_MODES = {
  PARTICIPANT_SELF: 'participant_self',
  PROFESSIONAL_RECORDED_PARTICIPANT_RESPONSE: 'professional_recorded_participant_response',
} as const

export type RecognitionRecordMode =
  (typeof RECOGNITION_RECORD_MODES)[keyof typeof RECOGNITION_RECORD_MODES]

export interface CerKnowledgePresentationRecord {
  id: string
  knowledge_item_id: string
  knowledge_version_number: number
  knowledge_version_id?: string
  enrollment_id: string
  created_by_user_id: string
  presentation_text: string
  status: PresentationStatus
  channel: PresentationChannel
  presented_at?: string
  created: string
  updated: string
  expand?: {
    knowledge_item_id?: CerKnowledgeItemRecord
    knowledge_version_id?: CerKnowledgeItemVersionRecord
    enrollment_id?: EnrollmentRecord
    created_by_user_id?: UserAccountRecord
    cer_participant_recognitions_via_presentation_id?: CerParticipantRecognitionRecord[]
  }
}

export interface CerParticipantRecognitionRecord {
  id: string
  enrollment_id: string
  knowledge_item_id: string
  participant_user_id: string
  presentation_id?: string
  record_mode: RecognitionRecordMode
  recognition_type: RecognitionType
  comment?: string
  access_class: VisibilityClass
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    knowledge_item_id?: CerKnowledgeItemRecord
    presentation_id?: CerKnowledgePresentationRecord
    participant_user_id?: UserAccountRecord
  }
}

export interface CerKnowledgeItemVersionRecord {
  id: string
  knowledge_item_id: string
  version_number: number
  statement: string
  knowledge_type: KnowledgeType
  epistemic_source: SignalSourceType
  temporality: SignalTemporality
  primary_dimension_id?: string
  framework_id?: string
  status: KnowledgeStatus
  access_class: VisibilityClass
  changed_by_user_id?: string
  change_reason?: string
  created: string
  updated: string
  expand?: {
    knowledge_item_id?: CerKnowledgeItemRecord
    primary_dimension_id?: CerDimensionRecord
    framework_id?: CerFrameworkRecord
    changed_by_user_id?: UserAccountRecord
  }
}

export interface UserAccountRecord {
  id: string
  collectionId?: string
  collectionName?: string
  email: string
  name: string
  avatar?: string
  person_id?: string
  status: UserAccountStatus
  mfa_enabled?: boolean
  mfa_secret?: string
  expand?: {
    person_id?: PersonRecord
    user_roles_via_user_id?: UserRoleRecord[]
  }
  created: string
  updated: string
}

export type UserRecord = UserAccountRecord

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRoleType
  is_active: boolean
  created: string
  updated: string
}

export interface CerProductRecord {
  id: string
  code: string
  name: string
  description?: string
  is_active: boolean
  created: string
  updated: string
}

export interface EnrollmentRecord {
  id: string
  person_id: string
  product_id?: string
  status: EnrollmentStatus
  start_date?: string
  end_date?: string
  notes?: string
  expand?: {
    person_id?: PersonRecord
    product_id?: CerProductRecord
    professional_enrollment_access_via_enrollment_id?: ProfessionalEnrollmentAccessRecord[]
    journey_states_via_enrollment_id?: JourneyStateRecord[]
  }
  created: string
  updated: string
}

export interface ProfessionalEnrollmentAccessRecord {
  id: string
  enrollment_id: string
  professional_user_id: string
  access_role: ProfessionalAccessRole
  is_active: boolean
  expand?: {
    enrollment_id?: EnrollmentRecord
    professional_user_id?: UserAccountRecord
  }
  created: string
  updated: string
}

export interface JourneyStateRecord {
  id: string
  enrollment_id: string
  current_stage: JourneyStage
  stage_status: StageStatus
  evolution_status?: EvolutionStatus
  metadata?: Record<string, unknown>
  created: string
  updated: string
}

export interface AuditEventRecord {
  id: string
  actor_user_id?: string
  action: AuditAction | string
  resource_type: string
  resource_id?: string
  enrollment_id?: string
  timestamp: string
  result: 'success' | 'failure' | 'denied'
  request_context?: string
  metadata?: Record<string, unknown>
  created: string
  updated: string
}

// ------------------------------------------
// ENTIDADES DO EXPERIENCE ENGINE (BUILD 02)
// ------------------------------------------

export interface FeatureFlagRecord {
  id: string
  key: string
  name: string
  description?: string
  is_enabled: boolean
  metadata?: Record<string, unknown>
  created: string
  updated: string
}

export interface CerDimensionRecord {
  id: string
  code: string
  title: string
  order_index: number
  description?: string
  is_active: boolean
  created: string
  updated: string
}

export interface CerExperienceRecord {
  id: string
  dimension_id: string
  code: string
  title: string
  subtitle?: string
  order_index: number
  is_pilot: boolean
  opening_text?: string
  closing_text?: string
  version: number
  expand?: {
    dimension_id?: CerDimensionRecord
  }
  created: string
  updated: string
}

export interface CerExperienceMomentRecord {
  id: string
  experience_id: string
  moment_key: string
  title: string
  subtitle?: string
  order_index: number
  is_active: boolean
  version: number
  expand?: {
    experience_id?: CerExperienceRecord
    cer_prompts_via_moment_id?: CerPromptRecord[]
  }
  created: string
  updated: string
}

export interface CerPromptRecord {
  id: string
  experience_id: string
  moment_id?: string
  prompt_order?: number
  step_order: number
  step_title: string
  step_subtitle?: string
  component_type: ComponentType
  prompt_text: string
  helper_text?: string
  schema_config: Record<string, unknown>
  is_required: boolean
  version: number
  expand?: {
    moment_id?: CerExperienceMomentRecord
    experience_id?: CerExperienceRecord
  }
  created: string
  updated: string
}

export interface CerPromptVersionRecord {
  id: string
  prompt_id: string
  moment_id: string
  version_number: number
  prompt_type: string
  prompt_text: string
  helper_text?: string
  schema_config: Record<string, unknown>
  is_required: boolean
  change_reason?: string
  created: string
  updated: string
}

export interface EnrollmentExperienceRecord {
  id: string
  enrollment_id: string
  experience_id: string
  release_status: ExperienceReleaseStatus
  progress_status: ExperienceProgressStatus
  current_step_order?: number
  started_at?: string
  completed_at?: string
  last_interaction_at?: string
  released_by_user_id?: string
  expand?: {
    experience_id?: CerExperienceRecord
    enrollment_id?: EnrollmentRecord
  }
  created: string
  updated: string
}

export interface ExperienceResponseRecord {
  id: string
  enrollment_id: string
  experience_id: string
  prompt_id: string
  respondent_user_id: string
  response_type: ComponentType
  access_class: VisibilityClass
  structured_value?: unknown
  free_text?: string
  prompt_version: number
  version: number
  status: 'draft' | 'saved' | 'revised'
  expand?: {
    prompt_id?: CerPromptRecord
  }
  created: string
  updated: string
}

export interface ExperienceResponseVersionRecord {
  id: string
  response_id: string
  enrollment_id: string
  experience_id: string
  prompt_id: string
  respondent_user_id: string
  response_type: string
  access_class: VisibilityClass
  structured_value?: unknown
  free_text?: string
  version_number: number
  prompt_version: number
  change_reason?: string
  created: string
  updated: string
}

// ------------------------------------------
// ENTIDADES DO BUILD 03A — KNOWLEDGE & PROVENANCE LAYER
// ------------------------------------------

export const FRAMEWORK_TYPES = {
  SCIENTIFIC: 'scientific',
  CLINICAL_FRAMEWORK: 'clinical_framework',
  TRADITIONAL_SYSTEM: 'traditional_system',
  SELF_REPORT_MODEL: 'self_report_model',
  CER_INTEGRATIVE_MODEL: 'cer_integrative_model',
} as const

export type FrameworkType = (typeof FRAMEWORK_TYPES)[keyof typeof FRAMEWORK_TYPES]

export const SIGNAL_TYPES = {
  RESOURCE: 'resource',
  CHALLENGE: 'challenge',
  PROTECTION_PATTERN: 'protection_pattern',
  CURRENT_STATE: 'current_state',
  VALUE_MEANING: 'value_meaning',
  REALIZATION_RELEVANT: 'realization_relevant',
  CONTEXT: 'context',
} as const

export type SignalType = (typeof SIGNAL_TYPES)[keyof typeof SIGNAL_TYPES]

export const SIGNAL_TEMPORALITIES = {
  CURRENT: 'current',
  HISTORICAL: 'historical',
  RECURRING: 'recurring',
  CONTEXT_DEPENDENT: 'context_dependent',
  LONGITUDINAL: 'longitudinal',
  UNDETERMINED: 'undetermined',
} as const

export type SignalTemporality = (typeof SIGNAL_TEMPORALITIES)[keyof typeof SIGNAL_TEMPORALITIES]

export const SIGNAL_SOURCE_TYPES = {
  PARTICIPANT_REPORT: 'participant_report',
  PROFESSIONAL_OBSERVATION: 'professional_observation',
  FRAMEWORK_READING: 'framework_reading',
  RECURRENCE_ASSOCIATION: 'recurrence_association',
  CER_INTEGRATIVE_HYPOTHESIS: 'cer_integrative_hypothesis',
  PARTICIPANT_RECOGNITION: 'participant_recognition',
} as const

export type SignalSourceType = (typeof SIGNAL_SOURCE_TYPES)[keyof typeof SIGNAL_SOURCE_TYPES]

export const SIGNAL_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  SUPERSEDED: 'superseded',
  REJECTED: 'rejected',
} as const

export type SignalStatus = (typeof SIGNAL_STATUS)[keyof typeof SIGNAL_STATUS]

export interface CerFrameworkRecord {
  id: string
  framework_key: string
  name: string
  framework_type: FrameworkType
  description?: string
  is_active: boolean
  created: string
  updated: string
}

export interface CerPromptSignalRuleRecord {
  id: string
  prompt_id: string
  prompt_version: number
  response_match: string
  signal_type: SignalType
  concept_key: string
  dimension_id?: string
  temporality_default: SignalTemporality
  framework_id?: string
  is_active: boolean
  expand?: {
    prompt_id?: CerPromptRecord
    framework_id?: CerFrameworkRecord
    dimension_id?: CerDimensionRecord
  }
  created: string
  updated: string
}

export interface CerSignalRecord {
  id: string
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
  status: SignalStatus
  expand?: {
    enrollment_id?: EnrollmentRecord
    dimension_id?: CerDimensionRecord
    source_response_id?: ExperienceResponseRecord
    source_prompt_id?: CerPromptRecord
    source_experience_id?: CerExperienceRecord
    framework_id?: CerFrameworkRecord
    created_by_user_id?: UserAccountRecord
  }
  created: string
  updated: string
}
