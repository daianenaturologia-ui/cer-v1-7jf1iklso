#!/usr/bin/env node

/**
 * EXECUTOR DIRETO E INDEPENDENTE DA PROVA DE PRIVACIDADE DO CADERNO (CAD-01 A CAD-07)
 *
 * Objetivo:
 * Executar isoladamente os cenários CAD-01 a CAD-07 da suíte bimodal de privacidade,
 * apontando estritamente para a bancada descartável local (127.0.0.1:8090).
 *
 * Regras estritas:
 * 1. Falha imediatamente se não for ambiente local com flag explícita.
 * 2. Imprime o resultado individual detalhado de cada cenário (CAD-01..CAD-07).
 * 3. Encerra com código não-zero (exit code 1) se QUALQUER cenário não for PASS
 *    (inclusive BLOCKED, FAIL ou SKIPPED).
 * 4. Superuser apenas prepara os dados (usado internamente em runCadernoPrivacyIntegrationTests).
 *    As sondas e provas de RLS utilizam exclusivamente contas comuns.
 */

import { inspectTestEnvironment } from '../src/services/safeMutableGate.ts'
import { runCadernoPrivacyIntegrationTests } from '../src/services/testsCadernoPrivacyIntegration.ts'

async function main() {
  console.log('\n======================================================================')
  console.log('  PROVA DE PRIVACIDADE DO CADERNO E RECADOS — CAD-01 A CAD-07 (CER V1)')
  console.log('======================================================================')

  const inspection = inspectTestEnvironment()
  console.log(`[INSPEÇÃO DO AMBIENTE]`)
  console.log(`- Backend URL (sanitizada): ${inspection.backendUrl}`)
  console.log(`- Host local (127.0.0.1 / localhost): ${inspection.isLocalhost}`)
  console.log(`- Flag explícita CER_ALLOW_MUTABLE_TESTS: ${inspection.explicitFlagPresent}`)
  console.log(`- Autorização para execução mutável: ${inspection.isAllowed}`)

  if (!inspection.isAllowed) {
    console.error('\n[ERRO CRÍTICO] O ambiente NÃO está autorizado para a prova de privacidade.')
    console.error(`Motivo: ${inspection.blockReason || 'Backend vivo não isolado'}`)
    console.error(
      'A bancada descartável em 127.0.0.1 com CER_ALLOW_MUTABLE_TESTS="true" é obrigatória.',
    )
    process.exit(1)
  }

  console.log('\n[INICIANDO EXECUÇÃO] Disparando suíte runCadernoPrivacyIntegrationTests()...\n')
  const startTime = Date.now()
  let results
  try {
    results = await runCadernoPrivacyIntegrationTests()
  } catch (err) {
    console.error('\n[EXCEÇÃO NÃO TRATADA NA SUÍTE]:', err)
    process.exit(1)
  }
  const totalDuration = Date.now() - startTime

  console.log('======================================================================')
  console.log('           TABELA DE RESULTADOS INDIVIDUAIS CAD-01 A CAD-07           ')
  console.log('======================================================================')
  console.log('ID'.padEnd(10) + 'STATUS'.padEnd(12) + 'DETALHES / ASSERÇÃO')
  console.log('----------------------------------------------------------------------')

  const expectedIds = ['CAD-01', 'CAD-02', 'CAD-03', 'CAD-04', 'CAD-05', 'CAD-06', 'CAD-07']
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

  // Verificar se todos os 7 IDs esperados foram avaliados
  const reportedIds = results.map((r) => r.id)
  const missingIds = expectedIds.filter((id) => !reportedIds.includes(id))
  if (missingIds.length > 0) {
    console.error(
      `[FALHA DE COBERTURA] Cenários obrigatórios ausentes no relatório: ${missingIds.join(', ')}`,
    )
    allPass = false
  }

  // Emissão de arquivo JSON de resultados caso configurado (ex: CER_REPORT_JSON_PATH)
  const reportJsonPath = process.env.CER_REPORT_JSON_PATH || 'caderno-report.json'
  try {
    const fs = await import('node:fs')
    const scenarios = expectedIds.map((expectedId) => {
      const found = results.find((r) => r.id === expectedId)
      return {
        id: expectedId,
        status: found ? found.status : 'NÃO EXECUTADO',
        description: found?.name || 'Cenário não reportado na suíte',
        details: found?.details || 'Ausente do resultado',
      }
    })

    const payload = {
      job_name: 'Caderno Privacy Proof (CAD-01..07)',
      timestamp: new Date().toISOString(),
      duration_ms: totalDuration,
      summary: {
        total: results.length,
        pass: passCount,
        fail: failCount,
        blocked: blockedCount,
        all_pass: allPass && results.length === 7,
      },
      scenarios,
    }
    fs.writeFileSync(reportJsonPath, JSON.stringify(payload, null, 2), 'utf8')
    console.log(`[RELATO] Relatório JSON emitido com sucesso em: ${reportJsonPath}`)
  } catch (jsonErr) {
    console.warn(
      `[AVISO] Não foi possível gravar relatório JSON em ${reportJsonPath}: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`,
    )
  }

  // Emissão da tabela individual CAD-01..CAD-07 no $GITHUB_STEP_SUMMARY se presente
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (summaryFile) {
    try {
      const fs = await import('node:fs')
      const summaryLines = []
      summaryLines.push('### 🛡️ Prova de Privacidade do Caderno e Recados (CAD-01..07)')
      summaryLines.push('')
      summaryLines.push('| Cenário | Status | Descrição / Asserção | Detalhes |')
      summaryLines.push('| :--- | :---: | :--- | :--- |')

      for (const expectedId of expectedIds) {
        const found = results.find((r) => r.id === expectedId)
        if (found) {
          const badge =
            found.status === 'PASS'
              ? '✅ PASS'
              : found.status === 'FAIL'
                ? '❌ FAIL'
                : found.status === 'BLOCKED'
                  ? '⚠️ BLOCKED'
                  : '⚪ SKIPPED'
          const safeName = (found.name || '').replace(/\|/g, '\\|')
          const safeDetails = (found.details || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
          summaryLines.push(`| **${expectedId}** | ${badge} | ${safeName} | ${safeDetails} |`)
        } else {
          summaryLines.push(
            `| **${expectedId}** | ⚪ NÃO EXECUTADO | Cenário não reportado na suíte | Ausente do resultado |`,
          )
        }
      }

      summaryLines.push('')
      summaryLines.push(
        `**Resultado Geral:** ${allPass && results.length === 7 ? '✅ SUCESSO COMPLETO' : '❌ FALHA / BLOQUEIO'} (${passCount} PASS, ${failCount} FAIL, ${blockedCount} BLOCKED)`,
      )
      summaryLines.push('')

      fs.appendFileSync(summaryFile, summaryLines.join('\n') + '\n', 'utf8')
    } catch (sumErr) {
      console.warn(
        `[AVISO] Não foi possível gravar resumo em GITHUB_STEP_SUMMARY: ${sumErr instanceof Error ? sumErr.message : String(sumErr)}`,
      )
    }
  }

  if (allPass && results.length === 7) {
    console.log(
      '\n[CONCLUSÃO] SUCESSO COMPROVADO: Todos os cenários CAD-01 a CAD-07 passaram com status PASS.',
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
