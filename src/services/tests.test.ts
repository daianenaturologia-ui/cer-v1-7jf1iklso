import { describe, it, expect } from 'vitest'
import { runBuild01IsolationTests, runBuild02EngineTests } from './tests'
import { runBuild03AKnowledgeTests } from './testsKnowledge'

describe('Gate Final de Segurança & Experience Engine - CER V1', () => {
  it('executa suíte de isolamento, concessão e integridade do Build 01 contra o backend real', async () => {
    const results = await runBuild01IsolationTests()
    console.log(
      'Test results summary:',
      results.map((r) => `${r.name}: ${r.status}`),
    )

    // NENHUM teste deve ter status 'NÃO PASSOU'
    const failedTests = results.filter((r) => r.status === 'NÃO PASSOU')
    expect(failedTests.map((f) => `${f.name}: ${f.details}`)).toEqual([])

    // Verificar se os testes A, B, C, D, E e revogação passaram
    const testA = results.find((r) => r.id === 'TEST_A_PROF_A_SELF_GRANT_BEATRIZ')
    expect(testA?.status).toBe('PASSOU')

    const testB = results.find((r) => r.id === 'TEST_B_PROF_B_SELF_GRANT_ANA')
    expect(testB?.status).toBe('PASSOU')

    const testC = results.find((r) => r.id === 'TEST_C_INTERAGENTE_CREATE_CONCESSION')
    expect(testC?.status).toBe('PASSOU')

    const testD = results.find((r) => r.id === 'TEST_D_LEGITIMATE_ENROLLMENT_CREATION')
    expect(testD?.status).toBe('PASSOU')

    const testE = results.find((r) => r.id === 'TEST_E_ADMIN_GRANT_AND_REVOKE')
    expect(testE?.status).toBe('PASSOU')

    const testRev = results.find((r) => r.id === 'TEST_ACCESS_AFTER_REVOCATION')
    expect(testRev?.status).toBe('PASSOU')

    const mfaGate = results.find((r) => r.id === 'MFA_SECURITY_GATE_STATUS')
    expect(mfaGate?.status).toBe('NÃO IMPLEMENTADO')
  })

  it('executa suíte obrigatória do Build 02 — Experience Engine contra o backend real', async () => {
    const results = await runBuild02EngineTests()

    // NENHUM teste do Build 02 deve ter status 'NÃO PASSOU'
    const failedTests = results.filter((r) => r.status === 'NÃO PASSOU')
    expect(failedTests.map((f) => `${f.name}: ${f.details}`)).toEqual([])

    // Todos os testes do Build 02 devem ser 'PASSOU'
    for (const r of results) {
      expect(r.status, `${r.name}: ${r.details}`).toBe('PASSOU')
    }
  }, 60000)

  it('executa suíte obrigatória do Checkpoint 03A — Knowledge & Provenance Layer contra o backend real', async () => {
    const results = await runBuild03AKnowledgeTests()
    console.log(
      'Checkpoint 03A test results summary:',
      results.map((r) => `${r.name}: ${r.status}`),
    )

    // NENHUM teste do Checkpoint 03A pode falhar
    const failedTests = results.filter((r) => r.status === 'NÃO PASSOU')
    expect(failedTests.map((f) => `${f.name}: ${f.details}`)).toEqual([])

    // Todos os testes do 03A devem ser 'PASSOU'
    for (const r of results) {
      expect(r.status, `${r.name}: ${r.details}`).toBe('PASSOU')
    }
  }, 90000)
})
