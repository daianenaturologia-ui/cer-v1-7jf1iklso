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
