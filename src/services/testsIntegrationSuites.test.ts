/**
 * TESTES DAS SUÍTES DE INTEGRAÇÃO 7.A, 7.B E 7.C
 *
 * Valida o comportamento das suítes de integração em conformidade com o safeMutableGate:
 * 1. Em ambiente remoto / backend vivo não isolado, as suítes retornam status BLOCKED para cada caso
 * 2. Nenhuma escrita ou chamada mutável é enviada ao backend vivo
 * 3. A estrutura, cobertura de casos e identificadores de cada suíte correspondem estritamente aos requisitos
 */

import { describe, it, expect } from 'vitest'
import { runIntegration7ATests } from './testsIntegration7A'
import { runIntegration7BTests } from './testsIntegration7B'
import { runIntegration7CTests } from './testsIntegration7C'
import { runIntegration3ATests } from './testsIntegration3A'
import { inspectTestEnvironment } from './safeMutableGate'

describe('Suítes de Integração Lote 3A (Passos Estruturados e Reflexões) — Bloqueio Seguro Preventivo', () => {
  it('Suíte 3.A (Passos e Reflexões): executa com integridade conforme autorização do safeMutableGate', async () => {
    const inspection = inspectTestEnvironment()
    const results = await runIntegration3ATests()
    expect(results.length).toBe(8)

    if (!inspection.isAllowed) {
      const nonBlocked = results.filter((r) => r.status !== 'BLOCKED')
      expect(nonBlocked).toEqual([])
      for (const r of results) {
        expect(r.details).toContain('bloqueada por trava de segurança')
      }
    } else {
      const failed = results.filter((r) => r.status === 'FAIL')
      expect(failed).toEqual([])
      const passed = results.filter((r) => r.status === 'PASS')
      expect(passed.length).toBe(8)
    }

    const ids = results.map((r) => r.id)
    expect(ids).toContain('3.A-01')
    expect(ids).toContain('3.A-02')
    expect(ids).toContain('3.A-03')
    expect(ids).toContain('3.A-04')
    expect(ids).toContain('3.A-05')
    expect(ids).toContain('3.A-06')
    expect(ids).toContain('3.A-07')
    expect(ids).toContain('3.A-08')
  })

  it('Total Consolidado de Integração: valida exatamente 34 cenários em 4 suítes (7.A: 11, 7.B: 8, 7.C: 7, 3.A: 8)', async () => {
    const inspection = inspectTestEnvironment()
    const [res7A, res7B, res7C, res3A] = await Promise.all([
      runIntegration7ATests(),
      runIntegration7BTests(),
      runIntegration7CTests(),
      runIntegration3ATests(),
    ])

    expect(res7A.length).toBe(11)
    expect(res7B.length).toBe(8)
    expect(res7C.length).toBe(7)
    expect(res3A.length).toBe(8)

    const allResults = [...res7A, ...res7B, ...res7C, ...res3A]
    expect(allResults.length).toBe(34)

    if (!inspection.isAllowed) {
      const nonBlocked = allResults.filter((r) => r.status !== 'BLOCKED')
      expect(nonBlocked).toEqual([])
      const blocked = allResults.filter((r) => r.status === 'BLOCKED')
      expect(blocked.length).toBe(34)
    } else {
      const passed = allResults.filter((r) => r.status === 'PASS')
      expect(passed.length).toBe(34)
    }
  })
})

describe('Suítes de Integração Lote 2A (7.A, 7.B, 7.C) — Bloqueio Seguro Preventivo', () => {
  it('inspeção confirma que backend padrão não é localhost autorizado', () => {
    const inspection = inspectTestEnvironment()
    if (inspection.isAllowed) {
      expect(inspection.isLocalhost).toBe(true)
      expect(inspection.explicitFlagPresent).toBe(true)
    } else {
      expect(inspection.isAllowed).toBe(false)
    }
  })

  it('Suíte 7.A (Assignment × review_due_at): executa com integridade conforme autorização do safeMutableGate', async () => {
    const inspection = inspectTestEnvironment()
    const results = await runIntegration7ATests()
    expect(results.length).toBe(11)

    if (!inspection.isAllowed) {
      // Nenhum caso pode ter passado ou falhado como se tivesse executado no backend
      const nonBlocked = results.filter((r) => r.status !== 'BLOCKED')
      expect(nonBlocked).toEqual([])
    } else {
      const failed = results.filter((r) => r.status === 'FAIL')
      expect(failed).toEqual([])
      const passed = results.filter((r) => r.status === 'PASS')
      expect(passed.length).toBe(11)
    }

    // Verificar presença dos casos canônicos
    const ids = results.map((r) => r.id)
    expect(ids).toContain('7.A-01')
    expect(ids).toContain('7.A-02')
    expect(ids).toContain('7.A-03')
    expect(ids).toContain('7.A-04')
    expect(ids).toContain('7.A-05')
    expect(ids).toContain('7.A-06')
    expect(ids).toContain('7.A-07')
    expect(ids).toContain('7.A-08')
    expect(ids).toContain('7.A-09')
    expect(ids).toContain('7.A-10')
    expect(ids).toContain('7.A-11')

    if (!inspection.isAllowed) {
      for (const r of results) {
        expect(r.details).toContain('bloqueada por trava de segurança')
      }
    }
    for (const r of results) {
      // Sanitização de credenciais/URLs
      expect(r.details).not.toContain('Skip@Pass')
      expect(r.details).not.toContain('token=')
    }
  })

  it('Suíte 7.B (Recall: active -> retired): executa com integridade conforme autorização do safeMutableGate', async () => {
    const inspection = inspectTestEnvironment()
    const results = await runIntegration7BTests()
    expect(results.length).toBe(8)

    if (!inspection.isAllowed) {
      const nonBlocked = results.filter((r) => r.status !== 'BLOCKED')
      expect(nonBlocked).toEqual([])
    } else {
      const failed = results.filter((r) => r.status === 'FAIL')
      expect(failed).toEqual([])
      const passed = results.filter((r) => r.status === 'PASS')
      expect(passed.length).toBe(8)
    }

    const ids = results.map((r) => r.id)
    expect(ids).toContain('7.B-01')
    expect(ids).toContain('7.B-02')
    expect(ids).toContain('7.B-03')
    expect(ids).toContain('7.B-04')
    expect(ids).toContain('7.B-05')
    expect(ids).toContain('7.B-06')
    expect(ids).toContain('7.B-07')
    expect(ids).toContain('7.B-08')

    if (!inspection.isAllowed) {
      for (const r of results) {
        expect(r.details).toContain('bloqueada por trava de segurança')
      }
    }
  })

  it('Suíte 7.C (Transições Negadas): executa com integridade conforme autorização do safeMutableGate', async () => {
    const inspection = inspectTestEnvironment()
    const results = await runIntegration7CTests()
    expect(results.length).toBe(7)

    if (!inspection.isAllowed) {
      const nonBlocked = results.filter((r) => r.status !== 'BLOCKED')
      expect(nonBlocked).toEqual([])
    } else {
      const failed = results.filter((r) => r.status === 'FAIL')
      expect(failed).toEqual([])
      const passed = results.filter((r) => r.status === 'PASS')
      expect(passed.length).toBe(7)
    }

    const ids = results.map((r) => r.id)
    expect(ids).toContain('7.C-01')
    expect(ids).toContain('7.C-02')
    expect(ids).toContain('7.C-03')
    expect(ids).toContain('7.C-04')
    expect(ids).toContain('7.C-05')
    expect(ids).toContain('7.C-06')
    expect(ids).toContain('7.C-07')

    if (!inspection.isAllowed) {
      for (const r of results) {
        expect(r.details).toContain('bloqueada por trava de segurança')
      }
    }
  })
})
