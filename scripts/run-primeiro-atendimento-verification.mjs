#!/usr/bin/env node

/**
 * EXECUTOR DIRETO E INDEPENDENTE DA VERIFICAÇÃO DO PRIMEIRO ATENDIMENTO (CER V1 — 0.0.70)
 *
 * Objetivo:
 * Executar os 6 pontos de verificação funcional do Primeiro Atendimento
 * apontando estritamente para a bancada descartável local (127.0.0.1:8090).
 *
 * Regras estritas:
 * 1. Falha imediatamente se não for ambiente local com flag explícita (safeMutableGate).
 * 2. Imprime o resultado individual detalhado de cada cenário (PAV-01..PAV-06).
 * 3. Encerra com código não-zero (exit code 1) se QUALQUER cenário não for PASS
 *    (inclusive BLOCKED, FAIL ou SKIPPED).
 * 4. Superuser apenas prepara os dados de semeadura.
 *    As sondas e provas de RLS utilizam exclusivamente contas comuns.
 */

import { inspectTestEnvironment } from '../src/services/safeMutableGate.ts'
import { runPrimeiroAtendimentoVerificationTests } from '../src/services/testsPrimeiroAtendimentoVerification.ts'

async function main() {
  console.log('\n======================================================================')
  console.log('  VERIFICAÇÃO DO PRIMEIRO ATENDIMENTO — PAV-01 A PAV-06 (CER V1)')
  console.log('======================================================================')

  const inspection = inspectTestEnvironment()
  console.log(`[INSPEÇÃO DO AMBIENTE]`)
  console.log(`- Backend URL (sanitizada): ${inspection.backendUrl}`)
  console.log(`- Host local (127.0.0.1 / localhost): ${inspection.isLocalhost}`)
  console.log(`- Flag explícita CER_ALLOW_MUTABLE_TESTS: ${inspection.explicitFlagPresent}`)
  console.log(`- Autorização para execução mutável: ${inspection.isAllowed}`)

  if (!inspection.isAllowed) {
    console.error('\n[ERRO CRÍTICO] O ambiente NÃO está autorizado para a verificação.')
    console.error(`Motivo: ${inspection.blockReason || 'Backend vivo não isolado'}`)
    console.error(
      'A bancada descartável em 127.0.0.1 com CER_ALLOW_MUTABLE_TESTS="true" é obrigatória.',
    )
    process.exit(1)
  }

  console.log(
    '\n[INICIANDO EXECUÇÃO] Disparando suíte runPrimeiroAtendimentoVerificationTests()...\n',
  )
  const startTime = Date.now()
  let results
  try {
    results = await runPrimeiroAtendimentoVerificationTests()
  } catch (err) {
    console.error('\n[EXCEÇÃO NÃO TRATADA NA SUÍTE]:', err)
    process.exit(1)
  }
  const totalDuration = Date.now() - startTime

  console.log('======================================================================')
  console.log('           TABELA DE RESULTADOS INDIVIDUAIS PAV-01 A PAV-06           ')
  console.log('======================================================================')
  console.log('ID'.padEnd(10) + 'STATUS'.padEnd(12) + 'DETALHES / ASSERÇÃO')
  console.log('----------------------------------------------------------------------')

  const expectedIds = ['PAV-01', 'PAV-02', 'PAV-03', 'PAV-04', 'PAV-05', 'PAV-06']
  let allPass = true
  let failCount = 0
  let blockedCount = 0
  let passCount = 0

  for (const r of results) {
    const idPad = r.id.padEnd(10)
    const statusPad = r.status.padEnd(12)
    console.log(`${idPad}${statusPad}${r.name}`)
    if (r.details) {
      console.log(`          ↳ Detalhes: ${r.details}`)
    }

    if (r.status === 'PASS') {
      passCount++
    } else if (r.status === 'BLOCKED') {
      blockedCount++
      allPass = false
    } else {
      failCount++
      allPass = false
    }
  }

  console.log('----------------------------------------------------------------------')
  console.log(`Duração total: ${totalDuration}ms`)
  console.log(`Total de cenários executados: ${results.length}`)
  console.log(`- PASS:    ${passCount}`)
  console.log(`- FAIL:    ${failCount}`)
  console.log(`- BLOCKED: ${blockedCount}`)
  console.log('======================================================================')

  const reportedIds = results.map((r) => r.id)
  const missingIds = expectedIds.filter((id) => !reportedIds.includes(id))
  if (missingIds.length > 0) {
    console.error(
      `[FALHA DE COBERTURA] Cenários obrigatórios ausentes no relatório: ${missingIds.join(', ')}`,
    )
    allPass = false
  }

  if (allPass && results.length === 6) {
    console.log(
      '\n[CONCLUSÃO] SUCESSO COMPROVADO: Todos os cenários PAV-01 a PAV-06 passaram com status PASS.',
    )
    process.exit(0)
  } else {
    console.error(
      '\n[CONCLUSÃO] FALHA: Pelo menos um cenário falhou, foi bloqueado ou não foi executado.',
    )
    console.error('BLOCKED no runner da bancada constitui falha de execução.')
    process.exit(1)
  }
}

main()
