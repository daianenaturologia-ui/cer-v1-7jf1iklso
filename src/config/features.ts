/**
 * FEATURE FLAGS DO SISTEMA CER
 * Centraliza as chaves e estados default de ativação de funcionalidades.
 *
 * NOTA DE SEGURANÇA E CONFORMIDADE:
 * Novas funcionalidades sensíveis de interagentes mantêm feature flag desligada por padrão
 * até comprovação total de privacidade e RLS em produção.
 */

export const CER_FEATURE_FLAGS = {
  // Experience Engine
  EXPERIENCE_ENGINE: 'experience_engine',
  // Care Planning & Priorities (Build 08B)
  BUILD_08B: 'build_08b',
  // Practice Library & Safety (Build 08C)
  BUILD_08C: 'build_08c',
  // Practice Assignment & Minimal Planner (Build 08D)
  BUILD_08D: 'build_08d',
  // Care Review & Response (Build 08E)
  BUILD_08E: 'build_08e',
  // Caderno Privado & Recados para Próxima Sessão (CER V1)
  // SEGURANÇA: Mantida false por padrão no build para proteção até liberação explícita
  CADERNO_JOURNAL: 'cer_caderno_v1',
} as const

export type CerFeatureFlagKey = (typeof CER_FEATURE_FLAGS)[keyof typeof CER_FEATURE_FLAGS]

/**
 * Defaults embutidos no cliente (fail-closed)
 */
export const FEATURE_FLAG_DEFAULTS: Record<string, boolean> = {
  [CER_FEATURE_FLAGS.EXPERIENCE_ENGINE]: true,
  [CER_FEATURE_FLAGS.BUILD_08B]: true,
  [CER_FEATURE_FLAGS.BUILD_08C]: true,
  [CER_FEATURE_FLAGS.BUILD_08D]: true,
  [CER_FEATURE_FLAGS.BUILD_08E]: true,
  [CER_FEATURE_FLAGS.CADERNO_JOURNAL]: false, // FAIL-CLOSED por padrão
}
