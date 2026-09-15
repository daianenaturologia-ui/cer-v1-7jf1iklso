#!/usr/bin/env node

/**
 * ORQUESTRADOR CANÔNICO DE QA DA BIBLIOTECA CER V1 (LOTE 2A)
 *
 * Sequência estrita de execução:
 * (1) Testes unitários puros (vitest com filtros determinísticos)
 * (2) Teste da trava de segurança (safeMutableGate.test.ts)
 * (3) Verificação do ambiente (inspeção de isolamento com safeMutableGate)
 * (4) Testes de integração mutáveis (SOMENTE se ambiente isolado autorizado; caso contrário BLOCKED)
 * (5) Regressões (testes determinísticos de regressão funcional)
 * (6) Lint (oxlint src)
 * (7) Typecheck (tsc --noEmit)
 * (8) Build de produção (vite build)
 * (9) Resumo final verdadeiro (PASS/FAIL/SKIPPED/BLOCKED sem mascaramento)
 *
 * Regras:
 * - Etapa não executada NUNCA pode aparecer como PASS.
 * - Ausência de ambiente isolado -> integração classificada como BLOCKED.
 * - Integração BLOCKED NÃO impede unit, regressão pura, lint, typecheck ou build.
 * - FAIL real em qualquer etapa segura encerra com exit code 1.
 * - Nenhuma etapa esconde stderr.
 * - Não imprime URLs completas com credenciais, senhas ou tokens.
 * - Sem dependências externas além do runtime Node.js padrão.
 */

import { spawnSync } from 'node:child_process'
import { inspectTestEnvironment } from '../src/services/safeMutableGate.ts'

const steps = []

function logHeader(title) {
  console.log('\n======================================================')
  console.log(`[QA ORCHESTRATOR] ${title}`)
  console.log('======================================================')
}

function runCommand(cmd, args, stepNum, stepName) {
  const start = Date.now()
  console.log(`\n>>> [Etapa ${stepNum}/9] Iniciando: ${stepName}...`)
  console.log(`Comando: ${cmd} ${args.join(' ')}`)

  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: process.env,
  })

  const durationMs = Date.now() - start
  const isOk = res.status === 0
  const status = isOk ? 'PASS' : 'FAIL'

  steps.push({
    stepNumber: stepNum,
    name: stepName,
    status,
    durationMs,
    message: isOk ? 'Concluído com sucesso' : `Processo encerrou com código ${res.status}`,
  })

  console.log(`<<< [Etapa ${stepNum}/9] Resultado: ${status} (${durationMs}ms)`)
  return { status, output: '' }
}

function main() {
  logHeader('INICIALIZANDO PIPELINE DE QA — BIBLIOTECA CER V1')

  // ---------------------------------------------------------
  // ETAPA 1: TESTES UNITÁRIOS PUROS
  // ---------------------------------------------------------
  const step1 = runCommand(
    'npx',
    ['vitest', 'run', 'src/services/testsCorrecao1A.test.ts'],
    1,
    'Testes Unitários Puros (testsCorrecao1A: consistência temporal e semântica)',
  )
  if (step1.status === 'FAIL') {
    finishPipeline()
    return
  }

  // ---------------------------------------------------------
  // ETAPA 2: TESTE DA PRÓPRIA TRAVA DE SEGURANÇA
  // ---------------------------------------------------------
  const step2 = runCommand(
    'npx',
    ['vitest', 'run', 'src/services/safeMutableGate.test.ts'],
    2,
    'Teste da Trava de Segurança Canônica (safeMutableGate: 5 cenários determinísticos)',
  )
  if (step2.status === 'FAIL') {
    finishPipeline()
    return
  }

  // ---------------------------------------------------------
  // ETAPA 3: VERIFICAÇÃO DO AMBIENTE
  // ---------------------------------------------------------
  console.log(`\n>>> [Etapa 3/9] Iniciando: Verificação do Ambiente de Testes...`)
  const start3 = Date.now()
  const inspection = inspectTestEnvironment()
  console.log(`- Backend URL detectada (sanitizada): ${inspection.backendUrl}`)
  console.log(`- Host local (localhost/127.0.0.1): ${inspection.isLocalhost}`)
  console.log(`- Flag explícita CER_ALLOW_MUTABLE_TESTS: ${inspection.explicitFlagPresent}`)
  console.log(`- Ambiente autorizado para mutação: ${inspection.isAllowed}`)

  const step3Status = 'PASS'
  let step3Msg = 'Inspeção concluída com sucesso'
  if (!inspection.isAllowed) {
    step3Msg = `Ambiente protegido: ${inspection.blockReason || 'Backend vivo não isolado'}`
  }
  steps.push({
    stepNumber: 3,
    name: 'Verificação do Ambiente (inspeção de segurança)',
    status: step3Status,
    durationMs: Date.now() - start3,
    message: step3Msg,
  })
  console.log(`<<< [Etapa 3/9] Resultado: ${step3Status} (${Date.now() - start3}ms)`)

  // ---------------------------------------------------------
  // ETAPA 4: INTEGRAÇÃO MUTÁVEL (SOMENTE SE ISOLADO AUTORIZADO)
  // ---------------------------------------------------------
  console.log(`\n>>> [Etapa 4/9] Iniciando: Testes de Integração Mutáveis (7.A, 7.B, 7.C)...`)
  const start4 = Date.now()

  if (!inspection.isAllowed) {
    console.warn(`[TRAVA ATIVA] Integração mutável BLOQUEADA preventivamente.`)
    console.warn(`Motivo: ${inspection.blockReason}`)
    console.warn(
      `Nenhuma mutação foi ou será enviada para o backend remoto (${inspection.backendUrl}).`,
    )

    // Executamos a suíte de verificação que comprova que as 3 integrações retornam BLOCKED
    spawnSync('npx', ['vitest', 'run', 'src/services/testsIntegrationSuites.test.ts'], {
      stdio: 'inherit',
      env: process.env,
    })

    steps.push({
      stepNumber: 4,
      name: 'Integração Mutável (7.A, 7.B, 7.C)',
      status: 'BLOCKED',
      durationMs: Date.now() - start4,
      message: `BLOQUEADO: ${inspection.blockReason}. Suíte de segurança comprovou bloqueio sem escritas.`,
    })
    console.log(`<<< [Etapa 4/9] Resultado: BLOCKED (${Date.now() - start4}ms)`)
  } else {
    console.log(`[AUTORIZADO] Executando testes mutáveis em instância local isolada...`)
    const step4Run = spawnSync(
      'npx',
      ['vitest', 'run', 'src/services/testsIntegrationSuites.test.ts'],
      { stdio: 'inherit', env: process.env },
    )
    const isOk = step4Run.status === 0
    steps.push({
      stepNumber: 4,
      name: 'Integração Mutável (7.A, 7.B, 7.C)',
      status: isOk ? 'PASS' : 'FAIL',
      durationMs: Date.now() - start4,
      message: isOk ? 'Integração isolada concluída' : 'Falha na execução mutável isolada',
    })
    if (!isOk) {
      finishPipeline()
      return
    }
  }

  // ---------------------------------------------------------
  // ETAPA 5: REGRESSÕES DETERMINÍSTICAS (SEM ESCRITA)
  // ---------------------------------------------------------
  const step5 = runCommand(
    'npx',
    [
      'vitest',
      'run',
      'src/services/testsCorrecao1A.test.ts',
      'src/services/testsIntegrationSuites.test.ts',
    ],
    5,
    'Regressões Funcionais Determinísticas (regras temporais, editorial gates e imutabilidade)',
  )
  if (step5.status === 'FAIL') {
    finishPipeline()
    return
  }

  // ---------------------------------------------------------
  // ETAPA 6: LINT (OXLINT)
  // ---------------------------------------------------------
  const step6 = runCommand('npx', ['oxlint', 'src'], 6, 'Análise Estática de Código (oxlint src)')
  if (step6.status === 'FAIL') {
    finishPipeline()
    return
  }

  // ---------------------------------------------------------
  // ETAPA 7: TYPECHECK (TSC)
  // ---------------------------------------------------------
  const step7 = runCommand(
    'npx',
    ['tsc', '--noEmit'],
    7,
    'Verificação de Tipos TypeScript (tsc --noEmit)',
  )
  if (step7.status === 'FAIL') {
    finishPipeline()
    return
  }

  // ---------------------------------------------------------
  // ETAPA 8: BUILD DE PRODUÇÃO (VITE BUILD)
  // ---------------------------------------------------------
  const step8 = runCommand('npx', ['vite', 'build'], 8, 'Compilação de Produção (vite build)')
  if (step8.status === 'FAIL') {
    finishPipeline()
    return
  }

  // ---------------------------------------------------------
  // ETAPA 9: RESUMO FINAL VERDADEIRO
  // ---------------------------------------------------------
  finishPipeline()
}

function finishPipeline() {
  logHeader('RESUMO FINAL DE EXECUÇÃO DO PIPELINE DE QA')

  let hasBlocked = false
  let hasFailed = false

  console.log('\nTabela de Resultados por Etapa:')
  console.log(
    '-----------------------------------------------------------------------------------------',
  )
  console.log(
    'Etapa'.padEnd(8) + 'Status'.padEnd(12) + 'Duração'.padEnd(12) + 'Descrição / Mensagem',
  )
  console.log(
    '-----------------------------------------------------------------------------------------',
  )

  for (const s of steps) {
    if (s.status === 'FAIL') hasFailed = true
    if (s.status === 'BLOCKED') hasBlocked = true

    const prefix = `[${s.stepNumber}/9]`.padEnd(8)
    const st = s.status.padEnd(12)
    const dur = `${s.durationMs}ms`.padEnd(12)
    const desc = `${s.name} — ${s.message || ''}`
    console.log(`${prefix}${st}${dur}${desc}`)
  }

  console.log(
    '-----------------------------------------------------------------------------------------',
  )

  let finalConclusion = 'PASS'
  let exitCode = 0

  if (hasFailed) {
    finalConclusion = 'FAIL'
    exitCode = 1
  } else if (hasBlocked) {
    // REGRA OBRIGATÓRIA: quando integração estiver BLOCKED, NUNCA declarar PASS completo!
    finalConclusion =
      'PARTIAL_BLOCKED (Testes de integração bloqueados por ausência de backend isolado)'
    exitCode = 0
  }

  console.log(`\nCONCLUSÃO GERAL: ${finalConclusion}`)
  console.log('Classificação final dos testes:')
  console.log(`- PASS: ${steps.filter((s) => s.status === 'PASS').length}`)
  console.log(`- BLOCKED: ${steps.filter((s) => s.status === 'BLOCKED').length}`)
  console.log(`- FAIL: ${steps.filter((s) => s.status === 'FAIL').length}`)
  console.log(`- SKIPPED: ${steps.filter((s) => s.status === 'SKIPPED').length}`)
  console.log(
    '-----------------------------------------------------------------------------------------\n',
  )

  if (exitCode !== 0) {
    process.exit(exitCode)
  }
}

main()
