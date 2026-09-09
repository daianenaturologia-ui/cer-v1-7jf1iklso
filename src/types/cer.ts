/**
 * CER V1 — Constantes Constitucionais e Arquiteturais (BUILD 01 - Pacote de Correção)
 *
 * Entidades canônicas:
 * PERSON, USER_ACCOUNT, USER_ROLE, CER_PRODUCT, ENROLLMENT,
 * PROFESSIONAL_ENROLLMENT_ACCESS, JOURNEY_STATE, AUDIT_EVENT.
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
 * As 6 Dimensões Congeladas da Consciência CER
 * Regra: Não criar novas dimensões nem alterar nomenclatura.
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
 * Independente do status de enrollment!
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
 * Nomenclatura em inglês oficializada no Build 01:
 * invited, onboarding, active, paused, completed, cancelled.
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
 * Nomenclatura técnica canônica: onboarding, consciousness, equilibrium_realization.
 * Evolution não é tratada como quarta etapa sequencial obrigatória, mas sim como eixo longitudinal.
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

/**
 * PERSON: a pessoa humana real, independente de conta de acesso.
 */
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

/**
 * USER_ACCOUNT: conta de autenticação (coleção nativa 'users' do PocketBase)
 */
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

/**
 * USER_ROLE: papéis atribuídos a uma conta de acesso.
 */
export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRoleType
  is_active: boolean
  created: string
  updated: string
}

/**
 * CER_PRODUCT: catálogo de produtos/modalidades CER
 */
export interface CerProductRecord {
  id: string
  code: string
  name: string
  description?: string
  is_active: boolean
  created: string
  updated: string
}

/**
 * ENROLLMENT: vínculo de acompanhamento de uma PERSON a um produto CER.
 * Não contém mais colunas legadas 'interagente', 'profissional' ou 'product' texto livre.
 */
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

/**
 * PROFESSIONAL_ENROLLMENT_ACCESS: permissão granular da profissional ao enrollment
 */
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

/**
 * JOURNEY_STATE: estado estrutural mínimo da jornada do enrollment
 */
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

/**
 * AUDIT_EVENT: evento imutável de auditoria de segurança e trilha de conformidade
 */
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
