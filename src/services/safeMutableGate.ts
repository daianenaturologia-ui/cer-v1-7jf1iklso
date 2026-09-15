/**
 * Trava de Segurança Canônica contra Escritas Mutáveis em Backend Vivo
 *
 * Objetivo:
 * Impedir categoricamente que suítes de teste mutáveis (criação, atualização ou
 * exclusão de registros de práticas, versões, evidências, perfis de segurança,
 * assignments, consentimentos, etc.) sejam executadas acidentalmente contra
 * a instância viva de produção do PocketBase.
 *
 * Regras:
 * 1. Falhar ANTES da primeira escrita.
 * 2. Bloquear por padrão se o ambiente não estiver comprovada e explicitamente isolado.
 * 3. NODE_ENV=test NÃO é suficiente isoladamente para autorizar escrita em backend remoto.
 * 4. URLs que apontam para Skip Cloud ou domínios remotos desconhecidos são bloqueadas sumariamente.
 * 5. Somente instâncias locais conhecidas (127.0.0.1, localhost) COM flag explícita de autorização
 *    (CER_ALLOW_MUTABLE_TESTS === 'true' ou CER_TEST_ENV === 'isolated') são autorizadas.
 * 6. Nenhuma credencial ou URL sensível é exibida nas mensagens de erro.
 */

export interface TestEnvInspection {
  isAllowed: boolean
  backendUrl: string
  isLocalhost: boolean
  explicitFlagPresent: boolean
  blockReason?: string
}

export class LiveBackendMutationBlockedError extends Error {
  public readonly code = 'LIVE_BACKEND_MUTATION_BLOCKED'

  constructor(reason: string) {
    super(
      `[TRAVA DE SEGURANÇA QA] Execução mutável bloqueada: ${reason}. ` +
        `Para proteger a integridade do backend vivo, testes de integração mutáveis exigem um ambiente ` +
        `de testes estritamente isolado/local com a flag explícita CER_ALLOW_MUTABLE_TESTS="true". ` +
        `Nenhuma mutação foi enviada ao banco de dados.`,
    )
    this.name = 'LiveBackendMutationBlockedError'
  }
}

/**
 * Inspeciona o ambiente atual para determinar se escritas mutáveis de teste são seguras.
 */
export function inspectTestEnvironment(customUrl?: string): TestEnvInspection {
  // Obter URL do PocketBase a partir do client ou do ambiente Vite / Node
  let rawUrl = customUrl
  if (!rawUrl && typeof import.meta !== 'undefined' && import.meta.env) {
    rawUrl = import.meta.env.VITE_POCKETBASE_URL
  }
  if (!rawUrl && typeof process !== 'undefined' && process.env) {
    rawUrl = process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL
  }

  const backendUrl = (rawUrl || '').trim()

  // Flag explícita obrigatória
  let flagVal = ''
  if (typeof process !== 'undefined' && process.env) {
    flagVal = process.env.CER_ALLOW_MUTABLE_TESTS || process.env.CER_TEST_ENV || ''
  }
  if (!flagVal && typeof import.meta !== 'undefined' && import.meta.env) {
    flagVal =
      (import.meta.env.VITE_CER_ALLOW_MUTABLE_TESTS as string) ||
      (import.meta.env.VITE_CER_TEST_ENV as string) ||
      ''
  }

  const explicitFlagPresent =
    flagVal.toLowerCase() === 'true' ||
    flagVal.toLowerCase() === 'isolated' ||
    flagVal.toLowerCase() === 'local_test'

  // Identificar se aponta para localhost / 127.0.0.1
  let isLocalhost = false
  try {
    if (backendUrl) {
      const parsed = new URL(backendUrl)
      const host = parsed.hostname.toLowerCase()
      if (host === '127.0.0.1' || host === 'localhost' || host === '0.0.0.0' || host === '::1') {
        isLocalhost = true
      }
    }
  } catch {
    isLocalhost = false
  }

  // Se URL não foi configurada
  if (!backendUrl) {
    return {
      isAllowed: false,
      backendUrl: '[NÃO CONFIGURADA]',
      isLocalhost: false,
      explicitFlagPresent,
      blockReason: 'URL do backend PocketBase não configurada ou vazia',
    }
  }

  // Se URL aponta para domínio de nuvem (ex: skipcloud.app, fly.dev, etc.)
  if (!isLocalhost) {
    return {
      isAllowed: false,
      backendUrl: sanitizeUrlForDisplay(backendUrl),
      isLocalhost: false,
      explicitFlagPresent,
      blockReason:
        'A URL aponta para uma instância remota/nuvem (não-localhost). Testes mutáveis são expressamente proibidos em instâncias remotas',
    }
  }

  // Se é localhost mas falta a flag explícita de permissão
  if (!explicitFlagPresent) {
    return {
      isAllowed: false,
      backendUrl: sanitizeUrlForDisplay(backendUrl),
      isLocalhost: true,
      explicitFlagPresent: false,
      blockReason:
        'Instância local detectada, mas falta a flag explícita de autorização CER_ALLOW_MUTABLE_TESTS="true" no ambiente',
    }
  }

  return {
    isAllowed: true,
    backendUrl: sanitizeUrlForDisplay(backendUrl),
    isLocalhost: true,
    explicitFlagPresent: true,
  }
}

/**
 * Remove credenciais, tokens ou query params sensíveis antes de exibir a URL em relatórios.
 */
export function sanitizeUrlForDisplay(urlStr: string): string {
  try {
    const u = new URL(urlStr)
    return `${u.protocol}//${u.host}`
  } catch {
    return '[URL FORMATO INVÁLIDO]'
  }
}

/**
 * Exige ambiente seguro de testes antes de prosseguir com qualquer mutação.
 * Lança LiveBackendMutationBlockedError caso a trava bloqueie a execução.
 */
export function assertSafeMutableTestEnvironment(customUrl?: string): void {
  const inspection = inspectTestEnvironment(customUrl)
  if (!inspection.isAllowed) {
    throw new LiveBackendMutationBlockedError(
      inspection.blockReason || 'Ambiente não autorizado para operações de teste mutáveis',
    )
  }
}
