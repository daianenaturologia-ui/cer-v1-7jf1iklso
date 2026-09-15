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
  RELATIONAL_ORBIT_MAP: 'RelationalOrbitMap',
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
  // Ações de auditoria do Experience Orchestration (Build 07A)
  ORCHESTRATION_RUNTIME_INVALID: 'ORCHESTRATION_RUNTIME_INVALID',
  REUSED_CONTEXT_PRESENTED: 'REUSED_CONTEXT_PRESENTED',
  SKIP_DECLARED: 'SKIP_DECLARED',
  // Ações de auditoria do Practice Library & Safety Gates (Build 08C)
  PRACTICE_CREATED: 'PRACTICE_CREATED',
  PRACTICE_VERSION_PUBLISHED: 'PRACTICE_VERSION_PUBLISHED',
  PRACTICE_VERSION_DEPRECATED: 'PRACTICE_VERSION_DEPRECATED',
  PRACTICE_RETIRED: 'PRACTICE_RETIRED',
  SAFETY_PROFILE_UPDATED: 'SAFETY_PROFILE_UPDATED',
  SAFETY_RULE_ADDED: 'SAFETY_RULE_ADDED',
  EVIDENCE_REVIEWED: 'EVIDENCE_REVIEWED',
  SAFETY_CHECK_RECORDED: 'SAFETY_CHECK_RECORDED',
  SAFETY_CHECK_SOURCE_ADDED: 'SAFETY_CHECK_SOURCE_ADDED',
  CONSENT_PRESENTED: 'CONSENT_PRESENTED',
  CONSENT_ACCEPTED: 'CONSENT_ACCEPTED',
  CONSENT_DECLINED: 'CONSENT_DECLINED',
  CONSENT_WITHDRAWN: 'CONSENT_WITHDRAWN',
  PROFESSIONAL_CLEARANCE_RECORDED: 'PROFESSIONAL_CLEARANCE_RECORDED',
  PRACTICE_CANDIDATE_PROPOSED: 'PRACTICE_CANDIDATE_PROPOSED',
  PRACTICE_CANDIDATE_REVIEWED: 'PRACTICE_CANDIDATE_REVIEWED',
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
  timezone?: string // IANA, ex: 'America/Sao_Paulo'
  created: string
  updated: string
}

// ------------------------------------------
// ENTIDADES DO BUILD 06 — MAPA CER V1
// ------------------------------------------

export const CER_MAP_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  SUPERSEDED: 'superseded',
  DISCARDED: 'discarded',
} as const

export type CerMapStatus = (typeof CER_MAP_STATUS)[keyof typeof CER_MAP_STATUS]

export const CER_MAP_SECTIONS = {
  MINHA_NATUREZA: 'minha_natureza',
  MEU_MOMENTO: 'meu_momento',
  QUANDO_ESTOU_NO_MEU_EIXO: 'quando_estou_no_meu_eixo',
  QUANDO_SAIO_DO_MEU_EIXO: 'quando_saio_do_meu_eixo',
  O_QUE_ME_MOBILIZA: 'o_que_me_mobiliza',
  MEUS_PADROES: 'meus_padroes',
  MEUS_RECURSOS: 'meus_recursos',
  MINHAS_RELACOES: 'minhas_relacoes',
  MINHA_HISTORIA: 'minha_historia',
  O_QUE_TEM_SENTIDO_PARA_MIM: 'o_que_tem_sentido_para_mim',
  O_QUE_RECONHECI_SOBRE_MIM: 'o_que_reconheci_sobre_mim',
} as const

export type CerMapSection = (typeof CER_MAP_SECTIONS)[keyof typeof CER_MAP_SECTIONS]

export const CER_MAP_SECTION_LABELS: Record<CerMapSection, string> = {
  minha_natureza: 'Minha Natureza',
  meu_momento: 'Meu Momento',
  quando_estou_no_meu_eixo: 'Quando estou no meu eixo',
  quando_saio_do_meu_eixo: 'Quando saio do meu eixo',
  o_que_me_mobiliza: 'O que me mobiliza',
  meus_padroes: 'Meus Padrões',
  meus_recursos: 'Meus Recursos',
  minhas_relacoes: 'Minhas Relações',
  minha_historia: 'Minha História',
  o_que_tem_sentido_para_mim: 'O que tem sentido para mim',
  o_que_reconheci_sobre_mim: 'O que reconheci sobre mim',
}

export const CER_MAP_SECTION_DESCRIPTIONS: Record<CerMapSection, string> = {
  minha_natureza: 'Traços mais perenes, ritmo intrínseco e tendências essenciais.',
  meu_momento: 'O estado e as circunstâncias atuais pelas quais você está passando.',
  quando_estou_no_meu_eixo:
    'Como você se sente, age e vive quando está em equilíbrio consigo mesma.',
  quando_saio_do_meu_eixo:
    'Sinais e manifestações que surgem quando o ritmo ou o estresse desequilibram.',
  o_que_me_mobiliza:
    'Motivações vitais, interesses profundos e o que desperta sua energia de ação.',
  meus_padroes: 'Padrões recorrentes observados e compreendidos ao longo do processo.',
  meus_recursos: 'Fontes de suporte, forças internas, práticas e apoios que fortalecem você.',
  minhas_relacoes: 'Dinâmicas relacionais, limites e conexão com as pessoas ao redor.',
  minha_historia: 'Marcos, continuidades e raízes que ajudam a entender onde você está hoje.',
  o_que_tem_sentido_para_mim: 'Valores centrais, propósito e direções de significado pessoal.',
  o_que_reconheci_sobre_mim:
    'Percepções e revelações que você mesma acolheu e reconheceu como suas.',
}

export const CER_MAP_SOURCE_TYPES = {
  KNOWLEDGE_ITEM: 'knowledge_item',
  PARTICIPANT_RECOGNITION: 'participant_recognition',
  PRESENTATION_CONTEXT: 'presentation_context',
} as const

export type CerMapSourceType = (typeof CER_MAP_SOURCE_TYPES)[keyof typeof CER_MAP_SOURCE_TYPES]

export interface CerMapRecord {
  id: string
  enrollment_id: string
  version_number: number
  status: CerMapStatus
  created_by_user_id: string
  published_by_user_id?: string
  published_at?: string
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    created_by_user_id?: UserAccountRecord
    published_by_user_id?: UserAccountRecord
    cer_map_items_via_map_id?: CerMapItemRecord[]
  }
}

export interface CerMapItemRecord {
  id: string
  map_id: string
  section: CerMapSection
  item_text: string
  position: number
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    map_id?: CerMapRecord
    created_by_user_id?: UserAccountRecord
    cer_map_item_sources_via_map_item_id?: CerMapItemSourceRecord[]
  }
}

export interface CerMapItemSourceRecord {
  id: string
  map_item_id: string
  source_type: CerMapSourceType
  knowledge_item_id?: string
  recognition_id?: string
  presentation_id?: string
  knowledge_version_number?: number
  knowledge_version_id?: string
  created: string
  updated: string
  expand?: {
    map_item_id?: CerMapItemRecord
    knowledge_item_id?: CerKnowledgeItemRecord
    recognition_id?: CerParticipantRecognitionRecord
    presentation_id?: CerKnowledgePresentationRecord
    knowledge_version_id?: CerKnowledgeItemVersionRecord
  }
}

export const MAP_EMPTY_MICROCOPY = 'Ainda estou descobrindo isso.'

// ------------------------------------------
// ENTIDADES DO BUILD 05 — AI CORE V1
// ------------------------------------------

export const AI_PROPOSAL_TYPES = {
  ASSOCIATION_SUGGESTION: 'association_suggestion',
  KNOWLEDGE_SUGGESTION: 'knowledge_suggestion',
  INTEGRATIVE_HYPOTHESIS: 'integrative_hypothesis',
  PRIORITY_SUGGESTION: 'priority_suggestion',
  PRACTICE_CANDIDATE_SUGGESTION: 'practice_candidate_suggestion',
  ASSIGNMENT_ADAPTATION_SUGGESTION: 'assignment_adaptation_suggestion',
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

// ------------------------------------------
// TIPOS DO EXPERIENCE ORCHESTRATION (BUILD 07A)
// ------------------------------------------

export type PathRole = 'essential' | 'adaptive'

export type OrchestrationAction = 'open_branch' | 'skip_branch' | 'goto'

export interface OrchestrationCondition {
  field?: string // default: 'structured_value'
  operator?: 'equals' | 'contains' | 'concept_key_exists'
  value?: unknown
  concept_key?: string
  temporality?: SignalTemporality
}

export interface OrchestrationRoute {
  id: string
  when?: {
    any_of?: OrchestrationCondition[]
    all_of?: OrchestrationCondition[]
  }
  then: {
    action: OrchestrationAction
    target_prompt_key: string
  }
}

export interface OrchestrationConfig {
  path_role?: PathRole
  requires_branch_open?: boolean
  routes?: OrchestrationRoute[]
  fallback?: {
    action: OrchestrationAction
    target_prompt_key: string
  }
}

export interface OpenFirstConfig {
  enabled: boolean
  allow_skip?: boolean
  help_label: string
  option_set_ref: string
}

export type CollectionOrigin = 'newly_collected' | 'contextualized' | 'reused'

export type NamingOrigin = 'spontaneous' | 'selected_after_prompting' | 'not_applicable'

export interface StructuredValueWithProvenance {
  value?: unknown
  selectedOptionId?: string
  collection_origin?: CollectionOrigin
  naming_origin?: NamingOrigin
  context_reference?: string
  source_response_id?: string
  concept_key?: string
  is_legitimate_skip?: boolean
  skip_reason?: 'nao_sei' | 'prefiro_nao_responder' | 'optional_skip'
  [key: string]: unknown
}

export interface CerPromptSchemaConfig {
  prompt_key?: string
  access_destination?: 'participant_private' | 'participant_shared' | 'shared_care'
  orchestration?: OrchestrationConfig
  open_first?: OpenFirstConfig
  [key: string]: unknown
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
  schema_config: CerPromptSchemaConfig & Record<string, unknown>
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

// ==========================================
// BUILD 08B — CARE PLANNING & OPERATIONAL CYCLES
// ==========================================

export const CARE_PLAN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SUPERSEDED: 'superseded',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const
export type CarePlanStatus = (typeof CARE_PLAN_STATUS)[keyof typeof CARE_PLAN_STATUS]

export const CARE_PLAN_DIRECTION_MODE = {
  REUSED: 'reused',
  CONTEXTUALIZED: 'contextualized',
  STILL_DISCOVERING: 'still_discovering',
} as const
export type CarePlanDirectionMode =
  (typeof CARE_PLAN_DIRECTION_MODE)[keyof typeof CARE_PLAN_DIRECTION_MODE]

export const CARE_PLAN_PRIORITY_STATUS = {
  CANDIDATE: 'candidate',
  ACTIVE: 'active',
  ACTIVE_PENDING_ADAPTATION: 'active_pending_adaptation',
  DEFERRED: 'deferred',
  SUPERSEDED: 'superseded',
  ARCHIVED: 'archived',
} as const
export type CarePlanPriorityStatus =
  (typeof CARE_PLAN_PRIORITY_STATUS)[keyof typeof CARE_PLAN_PRIORITY_STATUS]

export const CARE_PLAN_PRIORITY_SOURCE_TYPE = {
  KNOWLEDGE_ITEM: 'knowledge_item',
  PARTICIPANT_RECOGNITION: 'participant_recognition',
  MAP_ITEM: 'map_item',
  PRESENTATION: 'presentation',
  ASSOCIATION: 'association',
  SIGNAL: 'signal',
  AI_PROPOSAL: 'ai_proposal',
  PROFESSIONAL_INPUT: 'professional_input',
} as const
export type CarePlanPrioritySourceType =
  (typeof CARE_PLAN_PRIORITY_SOURCE_TYPE)[keyof typeof CARE_PLAN_PRIORITY_SOURCE_TYPE]

export const CARE_PLAN_PRESENTATION_STATUS = {
  DRAFT: 'draft',
  PRESENTED: 'presented',
  WITHDRAWN: 'withdrawn',
  SUPERSEDED: 'superseded',
} as const
export type CarePlanPresentationStatus =
  (typeof CARE_PLAN_PRESENTATION_STATUS)[keyof typeof CARE_PLAN_PRESENTATION_STATUS]

export const CARE_CYCLE_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
} as const
export type CareCycleStatus = (typeof CARE_CYCLE_STATUS)[keyof typeof CARE_CYCLE_STATUS]

export const CARE_CYCLE_REVIEW_EVENT_TYPE = {
  SESSION: 'session',
  PARTICIPANT_CHECKIN: 'participant_checkin',
  SCHEDULED: 'scheduled',
  MANUAL: 'manual',
  FUTURE_CONDITION: 'future_condition',
} as const
export type CareCycleReviewEventType =
  (typeof CARE_CYCLE_REVIEW_EVENT_TYPE)[keyof typeof CARE_CYCLE_REVIEW_EVENT_TYPE]

export const OPERATIONAL_ACCEPTANCE_RESPONSE_TYPE = {
  ACCEPTED: 'accepted',
  WANTS_TO_TRY: 'wants_to_try',
  TOO_MUCH: 'too_much',
  WANTS_TO_ADAPT: 'wants_to_adapt',
  NOT_NOW: 'not_now',
  ALTERNATIVE_REQUESTED: 'alternative_requested',
  WANTS_TO_TALK: 'wants_to_talk',
} as const
export type OperationalAcceptanceResponseType =
  (typeof OPERATIONAL_ACCEPTANCE_RESPONSE_TYPE)[keyof typeof OPERATIONAL_ACCEPTANCE_RESPONSE_TYPE]

export const RECORD_LIFECYCLE_STATUS = {
  CURRENT: 'current',
  SUPERSEDED: 'superseded',
} as const
export type RecordLifecycleStatus =
  (typeof RECORD_LIFECYCLE_STATUS)[keyof typeof RECORD_LIFECYCLE_STATUS]

export interface CerCarePlanRecord {
  id: string
  enrollment_id: string
  revision_number: number
  status: CarePlanStatus
  direction_mode: CarePlanDirectionMode
  direction_statement?: string
  direction_source_id?: string
  professional_context?: string
  professional_rationale?: string
  previous_plan_id?: string
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    created_by_user_id?: UserAccountRecord
  }
}

export interface CerCarePlanPriorityRecord {
  id: string
  plan_id: string
  title: string
  description?: string
  status: CarePlanPriorityStatus
  is_therapeutic_priority?: boolean
  is_possible_now?: boolean
  order_index?: number
  deferral_reason?: string
  professional_rationale?: string
  access_class: VisibilityClass
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    plan_id?: CerCarePlanRecord
    created_by_user_id?: UserAccountRecord
  }
}

export interface CerCarePlanPrioritySourceRecord {
  id: string
  priority_id: string
  enrollment_id: string
  source_type: CarePlanPrioritySourceType
  source_id: string
  source_version_anchor?: string
  access_class: VisibilityClass
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    priority_id?: CerCarePlanPriorityRecord
    enrollment_id?: EnrollmentRecord
    created_by_user_id?: UserAccountRecord
  }
}

export interface CerCarePlanPresentationRecord {
  id: string
  enrollment_id: string
  plan_id: string
  priority_id?: string
  status: CarePlanPresentationStatus
  participant_title: string
  participant_summary?: string
  practical_invitation?: string
  presented_at?: string
  withdrawn_at?: string
  channel: 'app' | 'session'
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    plan_id?: CerCarePlanRecord
    priority_id?: CerCarePlanPriorityRecord
    created_by_user_id?: UserAccountRecord
  }
}

export interface CerCareCycleRecord {
  id: string
  enrollment_id: string
  plan_id: string
  cycle_number: number
  status: CareCycleStatus
  start_date?: string
  planned_end_date?: string
  extended_until?: string
  closed_at?: string
  review_event_type: CareCycleReviewEventType
  capacity_context_ref?: string
  focus_summary?: string
  professional_notes?: string
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    plan_id?: CerCarePlanRecord
    created_by_user_id?: UserAccountRecord
  }
}

export interface CerOperationalAcceptanceRecord {
  id: string
  presentation_id: string
  plan_id: string
  priority_id?: string
  enrollment_id: string
  participant_user_id: string
  response_type: OperationalAcceptanceResponseType
  shared_comment?: string
  access_class: 'shared_care'
  record_status: RecordLifecycleStatus
  created: string
  updated: string
  expand?: {
    presentation_id?: CerCarePlanPresentationRecord
    plan_id?: CerCarePlanRecord
    priority_id?: CerCarePlanPriorityRecord
    enrollment_id?: EnrollmentRecord
    participant_user_id?: UserAccountRecord
  }
}

export interface CerOperationalAcceptancePrivateNoteRecord {
  id: string
  acceptance_id: string
  participant_user_id: string
  enrollment_id: string
  note_text: string
  status: RecordLifecycleStatus
  created: string
  updated: string
  expand?: {
    acceptance_id?: CerOperationalAcceptanceRecord
    enrollment_id?: EnrollmentRecord
    participant_user_id?: UserAccountRecord
  }
}

// ==========================================
// ENTIDADES DO BUILD 08C — PRACTICE LIBRARY & SAFETY GATES
// ==========================================

export const PRACTICE_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
  RETIRED: 'retired',
} as const

export type PracticeStatus = (typeof PRACTICE_STATUS)[keyof typeof PRACTICE_STATUS]

export const PRACTICE_GOVERNANCE_MODES = {
  SELF_GUIDED: 'self_guided',
  GROUP_GUIDED: 'group_guided',
  PROFESSIONAL_GUIDED: 'professional_guided',
  SUPERVISED_ONLY: 'supervised_only',
  SESSION_ONLY: 'session_only',
} as const

export type PracticeGovernanceMode =
  (typeof PRACTICE_GOVERNANCE_MODES)[keyof typeof PRACTICE_GOVERNANCE_MODES]

export const PRACTICE_INTENSITY = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  EXPANSIVE: 'expansive',
} as const

export type PracticeIntensity = (typeof PRACTICE_INTENSITY)[keyof typeof PRACTICE_INTENSITY]

export const PRACTICE_CONSENT_REQUIREMENT = {
  NOT_REQUIRED: 'not_required',
  REQUIRED: 'required',
  CONDITIONAL: 'conditional',
} as const

export type PracticeConsentRequirement =
  (typeof PRACTICE_CONSENT_REQUIREMENT)[keyof typeof PRACTICE_CONSENT_REQUIREMENT]

export const PRACTICE_CONTEXT_TAGS = {
  MORNING: 'morning',
  EVENING: 'evening',
  DURING_OVERLOAD: 'during_overload',
  AFTER_CONFLICT: 'after_conflict',
  HOME: 'home',
  WORK: 'work',
  IN_SESSION: 'in_session',
  PAIRED_WITH_PRACTICE: 'paired_with_practice',
  ACCOMPANIED_ONLY: 'accompanied_only',
  STABLE_ONLY: 'stable_only',
  OTHER_CONTEXT: 'other_context',
} as const

export type PracticeContextTag = (typeof PRACTICE_CONTEXT_TAGS)[keyof typeof PRACTICE_CONTEXT_TAGS]

export const PRACTICE_VARIANT_TYPES = {
  IDEAL: 'ideal',
  ADAPTED: 'adapted',
  MINIMAL_POSSIBLE: 'minimal_possible',
} as const

export type PracticeVariantType =
  (typeof PRACTICE_VARIANT_TYPES)[keyof typeof PRACTICE_VARIANT_TYPES]

export const PRACTICE_FRAMEWORK_USAGE_ROLES = {
  ORIGIN: 'origin',
  INDICATION: 'indication',
  ADAPTATION: 'adaptation',
  SAFETY_FRAMEWORK: 'safety_framework',
} as const

export type PracticeFrameworkUsageRole =
  (typeof PRACTICE_FRAMEWORK_USAGE_ROLES)[keyof typeof PRACTICE_FRAMEWORK_USAGE_ROLES]

export const EVIDENCE_BASIS_TYPES = {
  SCIENTIFIC_RESEARCH: 'scientific_research',
  TRADITIONAL_KNOWLEDGE: 'traditional_knowledge',
  CLINICAL_PRACTICE_FRAMEWORK: 'clinical_practice_framework',
  EXPERIENTIAL_SUPPORT: 'experiential_support',
  CER_PROFESSIONAL_HYPOTHESIS: 'cer_professional_hypothesis',
} as const

export type EvidenceBasisType = (typeof EVIDENCE_BASIS_TYPES)[keyof typeof EVIDENCE_BASIS_TYPES]

export const EVIDENCE_CONFIDENCE = {
  HIGH: 'high',
  MODERATE: 'moderate',
  LOW: 'low',
  UNCERTAIN: 'uncertain',
} as const

export type EvidenceConfidence = (typeof EVIDENCE_CONFIDENCE)[keyof typeof EVIDENCE_CONFIDENCE]

export const EVIDENCE_MATURITY = {
  ESTABLISHED: 'established',
  DEVELOPING: 'developing',
  PRELIMINARY: 'preliminary',
} as const

export type EvidenceMaturity = (typeof EVIDENCE_MATURITY)[keyof typeof EVIDENCE_MATURITY]

export const REGULATORY_PROFILES = {
  NONE: 'none',
  HEALTH_ADJACENT: 'health_adjacent',
  REGULATED_PRODUCT: 'regulated_product',
  MEDICAL_COORDINATION_REQUIRED: 'medical_coordination_required',
} as const

export type RegulatoryProfile = (typeof REGULATORY_PROFILES)[keyof typeof REGULATORY_PROFILES]

export const SAFETY_RULE_TYPES = {
  ABSOLUTE_CONTRAINDICATION: 'absolute_contraindication',
  RELATIVE_CONTRAINDICATION: 'relative_contraindication',
  CAUTION: 'caution',
  REQUIRES_MEDICAL_CLEARANCE: 'requires_medical_clearance',
  REQUIRES_PROFESSIONAL_ASSESSMENT: 'requires_professional_assessment',
} as const

export type SafetyRuleType = (typeof SAFETY_RULE_TYPES)[keyof typeof SAFETY_RULE_TYPES]

export const SAFETY_RULE_SOURCES = {
  EVIDENCE_SOURCE: 'evidence_source',
  PROFESSIONAL_POLICY: 'professional_policy',
  TRADITIONAL_FRAMEWORK: 'traditional_framework',
  REGULATORY_GUIDANCE: 'regulatory_guidance',
  MANUFACTURER: 'manufacturer',
  CER_SAFETY_POLICY: 'cer_safety_policy',
} as const

export type SafetyRuleSource = (typeof SAFETY_RULE_SOURCES)[keyof typeof SAFETY_RULE_SOURCES]

export const SAFETY_CHECK_OUTCOMES = {
  ELIGIBLE: 'eligible',
  ELIGIBLE_WITH_CAUTION: 'eligible_with_caution',
  REQUIRES_PROFESSIONAL_REVIEW: 'requires_professional_review',
  REQUIRES_SUPERVISION: 'requires_supervision',
  NOT_CURRENTLY_INDICATED: 'not_currently_indicated',
  INSUFFICIENT_INFORMATION: 'insufficient_information',
} as const

export type SafetyCheckOutcome = (typeof SAFETY_CHECK_OUTCOMES)[keyof typeof SAFETY_CHECK_OUTCOMES]

export const SAFETY_CHECK_SOURCE_TYPES = {
  EXPERIENCE_RESPONSE: 'experience_response',
  SIGNAL: 'signal',
  ASSOCIATION: 'association',
  KNOWLEDGE_ITEM: 'knowledge_item',
  PARTICIPANT_RECOGNITION: 'participant_recognition',
  SESSION_OBSERVATION: 'session_observation',
} as const

export type SafetyCheckSourceType =
  (typeof SAFETY_CHECK_SOURCE_TYPES)[keyof typeof SAFETY_CHECK_SOURCE_TYPES]

export const CONSENT_UNDERSTANDING_RESPONSES = {
  UNDERSTOOD: 'understood',
  WANT_TO_ASK: 'want_to_ask',
  DID_NOT_UNDERSTAND: 'did_not_understand',
  DO_NOT_WANT: 'do_not_want',
  WANT_ALTERNATIVE: 'want_alternative',
} as const

export type ConsentUnderstandingResponse =
  (typeof CONSENT_UNDERSTANDING_RESPONSES)[keyof typeof CONSENT_UNDERSTANDING_RESPONSES]

export const CONSENT_DECISIONS = {
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const

export type ConsentDecision = (typeof CONSENT_DECISIONS)[keyof typeof CONSENT_DECISIONS]

export const CONSENT_RECORD_STATUS = {
  CURRENT: 'current',
  WITHDRAWN: 'withdrawn',
  SUPERSEDED: 'superseded',
} as const

export type ConsentRecordStatus = (typeof CONSENT_RECORD_STATUS)[keyof typeof CONSENT_RECORD_STATUS]

// BUILD 09D-A: Item Natures
export const PRACTICE_ITEM_NATURES = {
  PRACTICE: 'practice',
  GUIDED_EXPERIENCE: 'guided_experience',
  CONTINUED_CARE: 'continued_care',
  SUPPORT_RESOURCE: 'support_resource',
} as const

export type PracticeItemNature = (typeof PRACTICE_ITEM_NATURES)[keyof typeof PRACTICE_ITEM_NATURES]

// BUILD 09D-A: Asset Types
export const PRACTICE_ASSET_TYPES = {
  AUDIO: 'audio',
  DOCUMENT: 'document',
  VIDEO: 'video',
  EXTERNAL_LINK: 'external_link',
} as const

export type PracticeAssetType = (typeof PRACTICE_ASSET_TYPES)[keyof typeof PRACTICE_ASSET_TYPES]

// BUILD 09D-A: Resource Recommendation Status & Channels
export const RESOURCE_RECOMMENDATION_STATUS = {
  RECOMMENDED: 'recommended',
  VIEWED: 'viewed',
  WITHDRAWN: 'withdrawn',
  SUPERSEDED: 'superseded',
} as const

export type ResourceRecommendationStatus =
  (typeof RESOURCE_RECOMMENDATION_STATUS)[keyof typeof RESOURCE_RECOMMENDATION_STATUS]

export const RESOURCE_RECOMMENDATION_CHANNELS = {
  APP: 'app',
  SESSION: 'session',
} as const

export type ResourceRecommendationChannel =
  (typeof RESOURCE_RECOMMENDATION_CHANNELS)[keyof typeof RESOURCE_RECOMMENDATION_CHANNELS]

// 1. cer_practices
export interface CerPracticeRecord {
  id: string
  internal_name: string
  participant_facing_name_base: string
  family: string
  item_nature: PracticeItemNature
  target_concept_keys?: string[]
  governance_modes: PracticeGovernanceMode[]
  is_system_curated: boolean
  provenance_editorial?: Record<string, unknown>
  status: PracticeStatus
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    created_by_user_id?: UserAccountRecord
    cer_practice_versions_via_practice_id?: CerPracticeVersionRecord[]
  }
}

// 2. cer_practice_versions
export interface CerPracticeVersionRecord {
  id: string
  practice_id: string
  version_number: number
  previous_version_id?: string
  participant_title: string
  participant_summary?: string
  description?: string
  instructions?: string
  preparation?: string
  stop_conditions?: string
  grounding?: string
  integration?: string
  intent_goal?: string
  context_tags?: PracticeContextTag[]
  other_context_text?: string
  duration?: string
  frequency?: string
  repetitions?: string
  quantity?: string
  time_window?: string
  progression?: string
  rest?: string
  max_exposure?: string
  guidance_requirements?: string
  intensity: PracticeIntensity
  consent_required: PracticeConsentRequirement
  author_user_id: string
  reviewer_user_id?: string
  reviewed_at?: string
  safety_reviewed_at?: string
  review_due_at?: string
  status: PracticeStatus
  created: string
  updated: string
  expand?: {
    practice_id?: CerPracticeRecord
    author_user_id?: UserAccountRecord
    reviewer_user_id?: UserAccountRecord
    cer_practice_variants_via_practice_version_id?: CerPracticeVariantRecord[]
    cer_practice_frameworks_via_practice_version_id?: CerPracticeFrameworkRecord[]
    cer_practice_evidence_via_practice_version_id?: CerPracticeEvidenceRecord[]
    cer_practice_safety_profiles_via_practice_version_id?: CerPracticeSafetyProfileRecord[]
    cer_practice_safety_rules_via_practice_version_id?: CerPracticeSafetyRuleRecord[]
    cer_practice_version_assets_via_practice_version_id?: CerPracticeVersionAssetRecord[]
    cer_practice_steps_via_practice_version_id?: CerPracticeStepRecord[]
    cer_practice_reflections_via_practice_version_id?: CerPracticeReflectionRecord[]
  }
}

// ------------------------------------------
// LOTE 3A: PASSOS ESTRUTURADOS E REFLEXÃO CORPO, MENTE E EMOÇÕES
// ------------------------------------------

export const PRACTICE_STEP_TYPES = {
  PREPARATION: 'preparation',
  POSTURE: 'posture',
  BREATHING: 'breathing',
  REPETITION: 'repetition',
  CYCLE: 'cycle',
  SERIES: 'series',
  NATURAL_PAUSE: 'natural_pause',
  RETENTION: 'retention',
  GROUNDING: 'grounding',
  INTEGRATION: 'integration',
  CLOSING: 'closing',
} as const

export type PracticeStepType = (typeof PRACTICE_STEP_TYPES)[keyof typeof PRACTICE_STEP_TYPES]

export const PRACTICE_BREAK_TYPES = {
  NATURAL_BREATHING: 'natural_breathing',
  STILLNESS: 'stillness',
  POSTURAL_TRANSITION: 'postural_transition',
  NONE: 'none',
} as const

export type PracticeBreakType = (typeof PRACTICE_BREAK_TYPES)[keyof typeof PRACTICE_BREAK_TYPES]

export const PRACTICE_RETENTION_TYPES = {
  NONE: 'none',
  ANTARA: 'antara',
  BAHYA: 'bahya',
} as const

export type PracticeRetentionType =
  (typeof PRACTICE_RETENTION_TYPES)[keyof typeof PRACTICE_RETENTION_TYPES]

export const REFLECTION_TARGETS = {
  CORPO: 'corpo',
  MENTE: 'mente',
  EMOCAO: 'emocao',
} as const

export type ReflectionTarget = (typeof REFLECTION_TARGETS)[keyof typeof REFLECTION_TARGETS]

export const CANONICAL_REFLECTION_PROMPTS: Record<ReflectionTarget, string> = {
  corpo: 'O que você percebe agora no seu corpo?',
  mente: 'O que você percebe agora na sua mente?',
  emocao: 'O que você percebe agora nas suas emoções?',
}

export const REFLECTION_VISIBILITY = {
  PARTICIPANT_PRIVATE: 'participant_private',
  SHARED_CARE: 'shared_care',
} as const

export type ReflectionVisibility =
  (typeof REFLECTION_VISIBILITY)[keyof typeof REFLECTION_VISIBILITY]

export interface CerPracticeStepRecord {
  id: string
  practice_version_id: string
  stable_step_id: string
  step_order: number
  step_type: PracticeStepType
  title: string
  participant_instruction: string
  professional_note?: string
  duration_seconds?: number
  target_repetitions?: number
  target_cycles?: number
  target_series?: number
  rest_seconds?: number
  break_type?: PracticeBreakType
  retention_type: PracticeRetentionType
  retention_duration_seconds?: number
  breathing_ratio?: string
  allow_early_stop?: boolean
  stop_signs?: string
  grounding_instruction?: string
  is_optional?: boolean
  metadata?: Record<string, unknown>
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
  }
}

export interface CerPracticeReflectionRecord {
  id: string
  assignment_id: string
  practice_version_id: string
  participant_user_id: string
  enrollment_id: string
  reflection_target: ReflectionTarget
  question_prompt: string
  reflection_text?: string
  prefer_not_to_answer?: boolean
  visibility: ReflectionVisibility
  record_status: 'current' | 'superseded'
  previous_reflection_id?: string
  metadata?: Record<string, unknown>
  created: string
  updated: string
  expand?: {
    assignment_id?: CerPracticeAssignmentRecord
    practice_version_id?: CerPracticeVersionRecord
    participant_user_id?: UserAccountRecord
    enrollment_id?: EnrollmentRecord
  }
}

// BUILD 09D-A: cer_practice_version_assets
export interface CerPracticeVersionAssetRecord {
  id: string
  practice_version_id: string
  asset_type: PracticeAssetType
  role?: string
  file?: string
  url_identifier?: string
  title?: string
  sort_order?: number
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
  }
}

// BUILD 09D-A: cer_resource_recommendations
export interface CerResourceRecommendationRecord {
  id: string
  enrollment_id: string
  participant_user_id: string
  resource_version_id: string
  professional_user_id: string
  participant_safe_message?: string
  status: ResourceRecommendationStatus
  channel: ResourceRecommendationChannel
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    participant_user_id?: UserAccountRecord
    resource_version_id?: CerPracticeVersionRecord
    professional_user_id?: UserAccountRecord
  }
}

// 3. cer_practice_variants
export interface CerPracticeVariantRecord {
  id: string
  practice_version_id: string
  variant_type: PracticeVariantType
  title: string
  description?: string
  duration?: string
  frequency?: string
  repetitions?: string
  quantity?: string
  notes?: string
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
    created_by_user_id?: UserAccountRecord
  }
}

// 4. cer_practice_frameworks
export interface CerPracticeFrameworkRecord {
  id: string
  practice_version_id: string
  framework_id: string
  usage_role: PracticeFrameworkUsageRole
  notes?: string
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
    framework_id?: CerFrameworkRecord
    created_by_user_id?: UserAccountRecord
  }
}

// 5. cer_practice_evidence
export interface CerPracticeEvidenceRecord {
  id: string
  practice_version_id: string
  evidence_basis_type: EvidenceBasisType
  confidence: EvidenceConfidence
  maturity: EvidenceMaturity
  population_context_applicability?: string
  safety_evidence_note?: string
  supported_claim_text?: string
  author_user_id: string
  reviewer_user_id?: string
  reviewed_at?: string
  review_due_at?: string
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
    author_user_id?: UserAccountRecord
    reviewer_user_id?: UserAccountRecord
    cer_practice_evidence_sources_via_evidence_id?: CerPracticeEvidenceSourceRecord[]
  }
}

// 6. cer_practice_evidence_sources
export interface CerPracticeEvidenceSourceRecord {
  id: string
  evidence_id: string
  citation_title: string
  author_source: string
  publication_year?: number
  url_identifier?: string
  evidence_type?: string
  notes?: string
  reviewed_at?: string
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    evidence_id?: CerPracticeEvidenceRecord
    created_by_user_id?: UserAccountRecord
  }
}

// 7. cer_practice_safety_profiles
export interface CerPracticeSafetyProfileRecord {
  id: string
  practice_version_id: string
  intensity_implications?: string
  consent_required: PracticeConsentRequirement
  supervision_requirements?: string
  monitoring?: string
  aftercare?: string
  regulatory_profile: RegulatoryProfile
  safety_requirements?: string
  required_dynamic_inputs?: string[]
  informed_choice?: string
  orientation?: string
  body_contact_policy?: string
  capacity_to_stop?: string
  return_grounding?: string
  integration?: string
  daily_life_reorientation?: string
  escalation_pathway?: string
  reviewed_by_user_id?: string
  reviewed_at?: string
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
    reviewed_by_user_id?: UserAccountRecord
  }
}

// 8. cer_practice_safety_rules
export interface CerPracticeSafetyRuleRecord {
  id: string
  practice_version_id: string
  rule_type: SafetyRuleType
  description: string
  participant_facing_text?: string
  source_of_rule: SafetyRuleSource
  source_ref?: string
  created_by_user_id: string
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
    created_by_user_id?: UserAccountRecord
  }
}

// 9. cer_practice_safety_checks
export interface CerPracticeSafetyCheckRecord {
  id: string
  practice_version_id: string
  enrollment_id: string
  outcome: SafetyCheckOutcome
  reviewed_by_user_id: string
  professional_rationale?: string
  reviewed_at: string
  record_status: 'current' | 'superseded'
  metadata?: {
    evaluated_safety_inputs?: string[]
    is_professional_clearance?: boolean
    [key: string]: unknown
  }
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
    enrollment_id?: EnrollmentRecord
    reviewed_by_user_id?: UserAccountRecord
    cer_practice_safety_check_sources_via_safety_check_id?: CerPracticeSafetyCheckSourceRecord[]
  }
}

// 10. cer_practice_safety_check_sources
export interface CerPracticeSafetyCheckSourceRecord {
  id: string
  safety_check_id: string
  source_type: SafetyCheckSourceType
  source_id: string
  source_version_anchor?: string
  enrollment_id: string
  access_class: VisibilityClass
  created: string
  updated: string
  expand?: {
    safety_check_id?: CerPracticeSafetyCheckRecord
    enrollment_id?: EnrollmentRecord
  }
}

// 11. cer_practice_consents
export interface CerPracticeConsentRecord {
  id: string
  practice_version_id: string
  participant_user_id: string
  enrollment_id: string
  consent_text_version_ref?: string
  risks_cautions_shown?: string[]
  understanding_response: ConsentUnderstandingResponse
  decision: ConsentDecision
  questions_opportunity?: boolean
  context_notes?: string
  record_status: ConsentRecordStatus
  withdrawn_at?: string
  withdrawal_reason?: string
  created: string
  updated: string
  expand?: {
    practice_version_id?: CerPracticeVersionRecord
    participant_user_id?: UserAccountRecord
    enrollment_id?: EnrollmentRecord
  }
}

// 12. cer_practice_consent_private_notes
export interface CerPracticeConsentPrivateNoteRecord {
  id: string
  consent_id: string
  participant_user_id: string
  enrollment_id: string
  note_text: string
  status: 'current' | 'superseded'
  created: string
  updated: string
  expand?: {
    consent_id?: CerPracticeConsentRecord
    participant_user_id?: UserAccountRecord
    enrollment_id?: EnrollmentRecord
  }
}

// ------------------------------------------
// ENTIDADES DO BUILD 08D — ASSIGNMENT E PLANNER MÍNIMO
// ------------------------------------------

export const PRACTICE_ASSIGNMENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  STOPPED: 'stopped',
  SUPERSEDED: 'superseded',
} as const

export type PracticeAssignmentStatus =
  (typeof PRACTICE_ASSIGNMENT_STATUS)[keyof typeof PRACTICE_ASSIGNMENT_STATUS]

export const PARTICIPANT_CONFIRMATION_RESPONSE = {
  CONFIRMED: 'confirmed',
  WANTS_ADAPTATION: 'wants_adaptation',
  TOO_MUCH_RIGHT_NOW: 'too_much_right_now',
  NOT_NOW: 'not_now',
  UNCONFIRMED: 'unconfirmed',
} as const

export type ParticipantConfirmationResponse =
  (typeof PARTICIPANT_CONFIRMATION_RESPONSE)[keyof typeof PARTICIPANT_CONFIRMATION_RESPONSE]

export const CAPACITY_RESPONSE_VALUES = {
  CABE_BEM: 'cabe_bem',
  CABE_SE_ADAPTAR: 'cabe_se_adaptar',
  PARECE_DEMAIS: 'parece_demais',
  NAO_CABE_AGORA: 'nao_cabe_agora',
  AINDA_NAO_SEI: 'ainda_nao_sei',
} as const

export type CapacityResponseValue =
  (typeof CAPACITY_RESPONSE_VALUES)[keyof typeof CAPACITY_RESPONSE_VALUES]

export const PLANNER_ITEM_TYPES = {
  SCHEDULED_ACTION: 'scheduled_action',
  FLEXIBLE_PRACTICE: 'flexible_practice',
  CONTEXTUAL_RESOURCE: 'contextual_resource',
  SESSION_LINKED: 'session_linked',
} as const

export type PlannerItemType = (typeof PLANNER_ITEM_TYPES)[keyof typeof PLANNER_ITEM_TYPES]

export const PLANNER_SCHEDULING_MODES = {
  EXACT: 'exact',
  WINDOW: 'window',
  FLEXIBLE: 'flexible',
  CONTEXTUAL: 'contextual',
  SESSION_LINKED: 'session_linked',
} as const

export type PlannerSchedulingMode =
  (typeof PLANNER_SCHEDULING_MODES)[keyof typeof PLANNER_SCHEDULING_MODES]

export const PLANNER_DAYPARTS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  ANY: 'any',
} as const

export type PlannerDaypart = (typeof PLANNER_DAYPARTS)[keyof typeof PLANNER_DAYPARTS]

export const PLANNER_ITEM_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  SUPERSEDED: 'superseded',
} as const

export type PlannerItemStatus = (typeof PLANNER_ITEM_STATUS)[keyof typeof PLANNER_ITEM_STATUS]

// 1. cer_practice_assignments
export interface CerPracticeAssignmentRecord {
  id: string
  enrollment_id: string
  participant_user_id: string
  care_plan_priority_id: string
  care_cycle_id: string
  practice_version_id: string
  variant_id?: string
  safety_check_id: string
  consent_id?: string
  operational_acceptance_id: string
  assigned_by_user_id: string
  previous_assignment_id?: string
  status: PracticeAssignmentStatus
  stop_reason_code?: string
  internal_title: string
  internal_context?: string
  participant_safe_title: string
  participant_safe_summary?: string
  assigned_duration?: string
  assigned_frequency?: string
  assigned_repetitions?: string
  assigned_quantity?: string
  assigned_time_window?: string
  context_tags?: string[]
  participant_response_type?: ParticipantConfirmationResponse
  capacity_response?: CapacityResponseValue
  confirmed_at?: string
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    participant_user_id?: UserAccountRecord
    care_plan_priority_id?: CerCarePlanPriorityRecord
    care_cycle_id?: CerCareCycleRecord
    practice_version_id?: CerPracticeVersionRecord
    variant_id?: CerPracticeVariantRecord
    safety_check_id?: CerPracticeSafetyCheckRecord
    consent_id?: CerPracticeConsentRecord
    operational_acceptance_id?: CerOperationalAcceptanceRecord
    assigned_by_user_id?: UserAccountRecord
  }
}

// 2. cer_planner_items
export interface CerPlannerItemRecord {
  id: string
  assignment_id: string
  enrollment_id: string
  participant_user_id: string
  care_cycle_id: string
  safe_title: string
  safe_summary?: string
  item_type: PlannerItemType
  scheduling_mode: PlannerSchedulingMode
  scheduled_at?: string
  window_start?: string
  window_end?: string
  daypart?: PlannerDaypart
  timezone_snapshot?: string
  status: PlannerItemStatus
  created_by: string
  created: string
  updated: string
  expand?: {
    assignment_id?: CerPracticeAssignmentRecord
    enrollment_id?: EnrollmentRecord
    participant_user_id?: UserAccountRecord
    care_cycle_id?: CerCareCycleRecord
    created_by?: UserAccountRecord
  }
}

// ==========================================
// BUILD 08E: Resposta ao Experimento, Ajuste & Mandala V1
// ==========================================

export const PRACTICE_RESPONSE_TYPES = {
  HELPED: 'helped',
  HELPED_A_BIT: 'helped_a_bit',
  NO_PERCEIVED_DIFFERENCE: 'no_perceived_difference',
  WAS_DIFFICULT: 'was_difficult',
  WAS_TOO_MUCH: 'was_too_much',
  COULD_NOT_DO: 'could_not_do',
  CHOSE_NOT_TO_DO: 'chose_not_to_do',
  ADAPTED: 'adapted',
  DID_NOT_MAKE_SENSE: 'did_not_make_sense',
  WANTS_TO_TELL: 'wants_to_tell',
} as const

export type PracticeResponseType =
  (typeof PRACTICE_RESPONSE_TYPES)[keyof typeof PRACTICE_RESPONSE_TYPES]

export const PRACTICE_RESPONSE_SAFETY_FLAGS = {
  NONE: 'none',
  NEEDS_REVIEW: 'needs_review',
  ESCALATION_REQUIRED: 'escalation_required',
} as const

export type PracticeResponseSafetyFlag =
  (typeof PRACTICE_RESPONSE_SAFETY_FLAGS)[keyof typeof PRACTICE_RESPONSE_SAFETY_FLAGS]

export const PRACTICE_RESPONSE_STATUS = {
  CURRENT: 'current',
  SUPERSEDED: 'superseded',
} as const

export type PracticeResponseStatus =
  (typeof PRACTICE_RESPONSE_STATUS)[keyof typeof PRACTICE_RESPONSE_STATUS]

export const CYCLE_REVIEW_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
} as const

export type CycleReviewStatus = (typeof CYCLE_REVIEW_STATUS)[keyof typeof CYCLE_REVIEW_STATUS]

export const CYCLE_REVIEW_DECISIONS = {
  CONTINUE: 'continue',
  EXTEND: 'extend',
  ADAPT: 'adapt',
  CLOSE: 'close',
  CARRY_FORWARD: 'carry_forward',
  CHANGE_PRIORITY: 'change_priority',
  REVIEW_PLAN: 'review_plan',
} as const

export type CycleReviewDecision =
  (typeof CYCLE_REVIEW_DECISIONS)[keyof typeof CYCLE_REVIEW_DECISIONS]

// 1. cer_practice_responses
export interface CerPracticeResponseRecord {
  id: string
  assignment_id: string
  planner_item_id?: string
  participant_user_id: string
  enrollment_id: string
  care_cycle_id: string
  practice_version_id: string
  response_type: PracticeResponseType
  perceived_helpfulness?: number
  difficulty?: number
  adaptation_used?: string
  wants_to_continue?: boolean
  safety_flag: PracticeResponseSafetyFlag
  shared_reflection?: string
  record_status: PracticeResponseStatus
  previous_response_id?: string
  created: string
  updated: string
  expand?: {
    assignment_id?: CerPracticeAssignmentRecord
    planner_item_id?: CerPlannerItemRecord
    participant_user_id?: UserAccountRecord
    enrollment_id?: EnrollmentRecord
    care_cycle_id?: CerCareCycleRecord
    practice_version_id?: CerPracticeVersionRecord
  }
}

// 2. cer_practice_response_private_notes (participant-only estrito)
export interface CerPracticeResponsePrivateNoteRecord {
  id: string
  response_id: string
  participant_user_id: string
  enrollment_id: string
  note_text: string
  status: 'current' | 'superseded'
  created: string
  updated: string
}

// 3. cer_cycle_reviews
export interface CerCycleReviewRecord {
  id: string
  enrollment_id: string
  care_cycle_id: string
  created_by_user_id: string
  status: CycleReviewStatus
  decision?: CycleReviewDecision
  participant_highlights?: string
  professional_summary?: string
  participant_review_invited_at?: string
  participant_review_completed_at?: string
  created: string
  updated: string
  expand?: {
    enrollment_id?: EnrollmentRecord
    care_cycle_id?: CerCareCycleRecord
    created_by_user_id?: UserAccountRecord
  }
}

// Mandala Read-Model (Zero tabela, zero score, zero questionário)
export interface MandalaReadModel {
  enrollment_id: string
  care_cycle?: {
    id: string
    cycle_number: number
    status: string
    focus_summary?: string
  }
  direction?: {
    mode: string
    statement?: string
  }
  active_priorities: Array<{
    id: string
    title: string
    description?: string
    is_therapeutic_priority: boolean
    is_possible_now: boolean
  }>
  active_experiments: Array<{
    assignment_id: string
    safe_title: string
    safe_summary?: string
    frequency?: string
    duration?: string
    status: string
  }>
  recognized_resources: Array<{
    id: string
    statement: string
    concept_key?: string
  }>
  current_capacity: {
    last_response?: CapacityResponseValue
    summary: string
  }
  recent_movement: {
    total_recorded_responses: number
    descriptive_digest: string
    recent_responses: Array<{
      id: string
      safe_title: string
      response_type: PracticeResponseType
      date: string
    }>
  }
  evolution_highlights: string[]
}
