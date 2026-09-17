#!/usr/bin/env node

/**
 * CI GATE / TRAVA DE INTEGRIDADE DOS MÓDULOS DE EXECUTORES EM NODE PURO
 *
 * Objetivo:
 * Garantir que os módulos compartilhados importados pelos executores em Node
 * (run-caderno-privacy.mjs e run-primeiro-atendimento-verification.mjs)
 * não sofram regressão que impeça o carregamento no runtime Node (ex: leitura de import.meta.env
 * sem guarda, falha na exportação de funções canônicas do gate, ausência de tratamento de URL).
 *
 * Verificações:
 * 1. Com VITE_POCKETBASE_URL=http://127.0.0.1:8090:
 *    - Carrega src/lib/pocketbase/client.ts e verifica pb.baseUrl === 'http://127.0.0.1:8090'
 *    - Carrega src/services/safeMutableGate.ts e verifica que exporta inspectTestEnvironment,
 *      assertSafeMutableTestEnvironment e LiveBackendMutationBlockedError.
 * 2. Sem VITE_POCKETBASE_URL:
 *    - Em processo filho Node limpo, tenta carregar src/lib/pocketbase/client.ts
 *    - EXIGE que a falha seja o erro claro "Backend não configurado: defina VITE_POCKETBASE_URL no ambiente"
 *    - Se vier TypeError (ex: reading 'VITE_POCKETBASE_URL' of undefined) ou qualquer outro erro, FALHA
 *      com a mensagem explícita de regressão.
 * 3. node --check nos dois executores .mjs (validação de sintaxe).
 */

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('\n======================================================================')
console.log('  TRAVA DE CI: VERIFICAÇÃO DE MÓDULOS EXECUTORES EM NODE PURO')
console.log('======================================================================\n')

let hasFailure = false

// -----------------------------------------------------------------------------
// CENÁRIO 1: Com VITE_POCKETBASE_URL=http://127.0.0.1:8090
// -----------------------------------------------------------------------------
console.log('[ETAPA 1] Testando importação em Node puro com VITE_POCKETBASE_URL configurada...')
const expectedUrl = 'http://127.0.0.1:8090'
const clientFile =
  process.env.CER_CLIENT_FILE || path.join(rootDir, 'src', 'lib', 'pocketbase', 'client.ts')
const gateFile =
  process.env.CER_GATE_FILE || path.join(rootDir, 'src', 'services', 'safeMutableGate.ts')

try {
  const runnerScript = `
    const { pathToFileURL } = await import('node:url');
    const clientUrl = pathToFileURL(${JSON.stringify(clientFile)}).href;
    const gateUrl = pathToFileURL(${JSON.stringify(gateFile)}).href;

    const { default: pb, getPocketBaseUrl } = await import(clientUrl);
    if (!pb || typeof pb.baseUrl !== 'string') {
      throw new Error('Falha: client.ts não exportou default PocketBase válido.');
    }
    if (pb.baseUrl !== ${JSON.stringify(expectedUrl)}) {
      throw new Error('Falha: pb.baseUrl esperado ' + ${JSON.stringify(expectedUrl)} + ', obtido: ' + pb.baseUrl);
    }
    if (typeof getPocketBaseUrl !== 'function') {
      throw new Error('Falha: getPocketBaseUrl não foi exportada de client.ts');
    }

    const gate = await import(gateUrl);
    if (typeof gate.inspectTestEnvironment !== 'function') {
      throw new Error('Falha: safeMutableGate não exporta inspectTestEnvironment');
    }
    if (typeof gate.assertSafeMutableTestEnvironment !== 'function') {
      throw new Error('Falha: safeMutableGate não exporta assertSafeMutableTestEnvironment');
    }
    if (typeof gate.LiveBackendMutationBlockedError !== 'function') {
      throw new Error('Falha: safeMutableGate não exporta LiveBackendMutationBlockedError');
    }
    console.log('OK_ETAPA_1');
  `

  const out = execFileSync(process.execPath, ['--input-type=module', '-e', runnerScript], {
    cwd: rootDir,
    env: {
      ...process.env,
      VITE_POCKETBASE_URL: expectedUrl,
    },
    encoding: 'utf8',
  })

  if (out.includes('OK_ETAPA_1')) {
    console.log(
      '  -> SUCESSO: client.ts instanciou com baseUrl correta e safeMutableGate exporta suas funções.',
    )
  } else {
    throw new Error('Saída inesperada da etapa 1: ' + out)
  }
} catch (err) {
  hasFailure = true
  console.error(
    '\n[ERRO NA ETAPA 1] Falha ao carregar módulos com VITE_POCKETBASE_URL:',
    err.message || err,
  )
  if (err.stderr) console.error('Stderr:', err.stderr)
}

// -----------------------------------------------------------------------------
// CENÁRIO 2: Sem VITE_POCKETBASE_URL -> Exigir erro claro
// -----------------------------------------------------------------------------
console.log('\n[ETAPA 2] Testando importação em Node puro SEM VITE_POCKETBASE_URL...')

try {
  const runnerScriptNoEnv = `
    const { pathToFileURL } = await import('node:url');
    const clientUrl = pathToFileURL(${JSON.stringify(clientFile)}).href;
    try {
      await import(clientUrl);
      console.log('UNEXPECTED_SUCCESS');
    } catch (err) {
      console.error('CAUGHT_ERROR_NAME=' + (err && err.name));
      console.error('CAUGHT_ERROR_MSG=' + (err && err.message));
      process.exit(2);
    }
  `

  const envWithoutPb = { ...process.env }
  delete envWithoutPb.VITE_POCKETBASE_URL
  delete envWithoutPb.POCKETBASE_URL

  try {
    execFileSync(process.execPath, ['--input-type=module', '-e', runnerScriptNoEnv], {
      cwd: rootDir,
      env: envWithoutPb,
      encoding: 'utf8',
    })
    hasFailure = true
    console.error(
      '\n[FALHA GRAVE] client.ts carregou sem lançar erro quando VITE_POCKETBASE_URL não existe!',
    )
  } catch (procErr) {
    const combinedOutput =
      (procErr.stdout || '') + '\n' + (procErr.stderr || '') + '\n' + (procErr.message || '')
    const expectedErrorFragment = 'Backend não configurado: defina VITE_POCKETBASE_URL no ambiente'

    const isTypeError =
      combinedOutput.includes('TypeError') ||
      combinedOutput.includes("reading 'env'") ||
      combinedOutput.includes("reading 'VITE_POCKETBASE_URL'")

    if (isTypeError) {
      hasFailure = true
      console.error('\n======================================================================')
      console.error(
        'REGRESSÃO: client.ts voltou a ler import.meta.env sem guarda — aplique getPocketBaseUrl()',
      )
      console.error('======================================================================')
      console.error('Detalhe do erro TypeError capturado:\n', combinedOutput)
    } else if (combinedOutput.includes(expectedErrorFragment)) {
      console.log('  -> SUCESSO: client.ts falhou com o erro claro esperado:')
      console.log(`     "${expectedErrorFragment}"`)
    } else {
      hasFailure = true
      console.error('\n[FALHA] client.ts lançou erro inesperado (diferente da mensagem canônica):')
      console.error(combinedOutput)
    }
  }
} catch (outerErr) {
  hasFailure = true
  console.error('\n[ERRO NA ETAPA 2]:', outerErr)
}

// -----------------------------------------------------------------------------
// CENÁRIO 3: node --check nos dois executores .mjs
// -----------------------------------------------------------------------------
console.log('\n[ETAPA 3] Verificação de sintaxe (node --check) nos executores .mjs...')

const executors = [
  'scripts/run-caderno-privacy.mjs',
  'scripts/run-primeiro-atendimento-verification.mjs',
  'scripts/run-pav-visual.mjs',
]

for (const execPath of executors) {
  try {
    execFileSync(process.execPath, ['--check', path.join(rootDir, execPath)], {
      cwd: rootDir,
      encoding: 'utf8',
    })
    console.log(`  -> SUCESSO: node --check passou em ${execPath}`)
  } catch (checkErr) {
    hasFailure = true
    console.error(
      `\n[FALHA DE SINTAXE] node --check falhou em ${execPath}:`,
      checkErr.message || checkErr,
    )
  }
}

// -----------------------------------------------------------------------------
// RESULTADO FINAL
// -----------------------------------------------------------------------------
console.log('\n======================================================================')
if (hasFailure) {
  console.error('RESULTADO: FALHA NA VERIFICAÇÃO DE MÓDULOS EXECUTORES (EXIT 1)')
  console.error(
    'REGRESSÃO: client.ts voltou a ler import.meta.env sem guarda — aplique getPocketBaseUrl()',
  )
  console.error('======================================================================\n')
  process.exit(1)
} else {
  console.log('RESULTADO: SUCESSO COMPLETO EM TODAS AS VERIFICAÇÕES DE MÓDULOS')
  console.log('======================================================================\n')
  process.exit(0)
}
