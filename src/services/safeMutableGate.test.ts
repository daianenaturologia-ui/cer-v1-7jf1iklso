import { describe, it, expect } from 'vitest'
import {
  inspectTestEnvironment,
  assertSafeMutableTestEnvironment,
  LiveBackendMutationBlockedError,
  sanitizeUrlForDisplay,
} from './safeMutableGate'

describe('Trava Canônica de Segurança contra Escritas Mutáveis (safeMutableGate)', () => {
  it('diagnostics test', () => {
    throw new Error('FAIL_WITH_INFO')
  })

  it('Cenário 1: Tentativa simulada contra backend remoto/vivo -> BLOCKED antes de escrever', () => {
    const remoteUrl = 'https://cer-production-skipcloud.app'
    const inspection = inspectTestEnvironment(remoteUrl)

    expect(inspection.isAllowed).toBe(false)
    expect(inspection.isLocalhost).toBe(false)
    expect(inspection.blockReason).toContain('instância remota/nuvem')

    expect(() => assertSafeMutableTestEnvironment(remoteUrl)).toThrow(
      LiveBackendMutationBlockedError,
    )
    expect(() => assertSafeMutableTestEnvironment(remoteUrl)).toThrow(/Execução mutável bloqueada/)
  })

  it('Cenário 2: Ambiente sem identificação explícita (URL local mas sem CER_ALLOW_MUTABLE_TESTS) -> BLOCKED', () => {
    const localUrl = 'http://127.0.0.1:8090'
    // Garantir que flag não está setada
    const oldVal = process.env.CER_ALLOW_MUTABLE_TESTS
    delete process.env.CER_ALLOW_MUTABLE_TESTS
    delete process.env.CER_TEST_ENV

    try {
      const inspection = inspectTestEnvironment(localUrl)
      expect(inspection.isAllowed).toBe(false)
      expect(inspection.isLocalhost).toBe(true)
      expect(inspection.explicitFlagPresent).toBe(false)
      expect(inspection.blockReason).toContain('falta a flag explícita de autorização')

      expect(() => assertSafeMutableTestEnvironment(localUrl)).toThrow(
        LiveBackendMutationBlockedError,
      )
    } finally {
      if (oldVal) process.env.CER_ALLOW_MUTABLE_TESTS = oldVal
    }
  })

  it('Cenário 3: Backend remoto mesmo com NODE_ENV=test e flag de teste ativa -> AINDA ASSIM BLOCKED', () => {
    const remoteUrl = 'https://api.cer.skipcloud.io'
    const oldEnv = process.env.NODE_ENV
    const oldFlag = process.env.CER_ALLOW_MUTABLE_TESTS
    process.env.NODE_ENV = 'test'
    process.env.CER_ALLOW_MUTABLE_TESTS = 'true'

    try {
      const inspection = inspectTestEnvironment(remoteUrl)
      expect(inspection.isAllowed).toBe(false)
      expect(inspection.isLocalhost).toBe(false)
      expect(inspection.explicitFlagPresent).toBe(true)
      expect(inspection.blockReason).toContain('instância remota/nuvem')

      expect(() => assertSafeMutableTestEnvironment(remoteUrl)).toThrow(
        LiveBackendMutationBlockedError,
      )
    } finally {
      process.env.NODE_ENV = oldEnv
      if (oldFlag) process.env.CER_ALLOW_MUTABLE_TESTS = oldFlag
      else delete process.env.CER_ALLOW_MUTABLE_TESTS
    }
  })

  it('Cenário 4: Ambiente isolado local com flag explícita -> PERMITIDO', () => {
    const localUrl = 'http://localhost:8090'
    const oldFlag = process.env.CER_ALLOW_MUTABLE_TESTS
    process.env.CER_ALLOW_MUTABLE_TESTS = 'true'

    try {
      const inspection = inspectTestEnvironment(localUrl)
      expect(inspection.isAllowed).toBe(true)
      expect(inspection.isLocalhost).toBe(true)
      expect(inspection.explicitFlagPresent).toBe(true)
      expect(inspection.blockReason).toBeUndefined()

      expect(() => assertSafeMutableTestEnvironment(localUrl)).not.toThrow()
    } finally {
      if (oldFlag) process.env.CER_ALLOW_MUTABLE_TESTS = oldFlag
      else delete process.env.CER_ALLOW_MUTABLE_TESTS
    }
  })

  it('Cenário 5: Sanitização de URL não vaza senhas, query params ou tokens', () => {
    const sensitiveUrl =
      'https://admin:SuperSecretPassword123@api.cer.skipcloud.io/api?token=secret123'
    const sanitized = sanitizeUrlForDisplay(sensitiveUrl)
    expect(sanitized).toBe('https://api.cer.skipcloud.io')
    expect(sanitized).not.toContain('SuperSecretPassword123')
    expect(sanitized).not.toContain('secret123')
  })
})
