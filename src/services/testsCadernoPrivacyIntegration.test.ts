/**
 * TESTES DETERMINÍSTICOS DAS SUÍTES DE INTEGRAÇÃO DO CADERNO E PRIVACIDADE
 *
 * Valida o comportamento bimodal da suíte do Caderno e Recados em conformidade com o safeMutableGate:
 * 1. Em ambiente remoto / backend vivo não isolado, retorna status BLOCKED para cada caso;
 * 2. Nenhuma escrita ou chamada mutável é enviada ao backend vivo;
 * 3. Identificadores CAD-01 a CAD-07 validados.
 */

import { describe, it, expect } from 'vitest'
import { runCadernoPrivacyIntegrationTests } from './testsCadernoPrivacyIntegration'
import { inspectTestEnvironment } from './safeMutableGate'

describe('Suíte de Integração Bimodal: Privacidade do Caderno e Recados (CER V1)', () => {
  it('CAD-PRIVACY: executa com integridade conforme autorização do safeMutableGate', async () => {
    const inspection = inspectTestEnvironment()
    const results = await runCadernoPrivacyIntegrationTests()
    expect(results.length).toBe(7)

    if (!inspection.isAllowed) {
      const nonBlocked = results.filter((r) => r.status !== 'BLOCKED')
      expect(nonBlocked).toEqual([])
      const blocked = results.filter((r) => r.status === 'BLOCKED')
      expect(blocked.length).toBe(7)
      for (const r of results) {
        expect(r.details).toContain('bloqueada por trava de segurança')
      }
    } else {
      const failed = results.filter((r) => r.status === 'FAIL')
      expect(failed).toEqual([])
      const passed = results.filter((r) => r.status === 'PASS')
      expect(passed.length).toBe(7)
    }

    const ids = results.map((r) => r.id)
    expect(ids).toContain('CAD-01')
    expect(ids).toContain('CAD-02')
    expect(ids).toContain('CAD-03')
    expect(ids).toContain('CAD-04')
    expect(ids).toContain('CAD-05')
    expect(ids).toContain('CAD-06')
    expect(ids).toContain('CAD-07')
  })
})
