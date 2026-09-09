/**
 * CER V1 — Constantes Constitucionais e Arquiteturais
 *
 * Este arquivo define as constantes invioláveis da metodologia e da plataforma CER.
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
 * Regra: Não criar novas dimensões.
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
 * Tipos de perfil suportados pela plataforma
 */
export const PROFILE_TYPES = {
  INTERAGENTE: 'interagente',
  PROFISSIONAL: 'profissional',
} as const

export type ProfileType = (typeof PROFILE_TYPES)[keyof typeof PROFILE_TYPES]

/**
 * Estados do ciclo de vida de Matrícula (Enrollment)
 */
export const ENROLLMENT_STATUS = {
  PENDENTE: 'pendente',
  ATIVA: 'ativa',
  ENCERRADA: 'encerrada',
} as const

export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS]

/**
 * Produtos CER
 */
export const CER_PRODUCTS = {
  ACOMPANHAMENTO_INDIVIDUAL: 'acompanhamento_individual_cer',
} as const

export type CerProductId = (typeof CER_PRODUCTS)[keyof typeof CER_PRODUCTS]

/**
 * Tipos de Modelos de Dados Fundamentais
 */
export interface UserRecord {
  id: string
  email: string
  name: string
  avatar?: string
  created: string
  updated: string
}

export interface ProfileRecord {
  id: string
  user: string
  profile_type: ProfileType
  full_name: string
  created: string
  updated: string
}

export interface EnrollmentRecord {
  id: string
  interagente: string
  profissional?: string
  product: string
  status: EnrollmentStatus
  start_date?: string
  end_date?: string
  created: string
  updated: string
}
