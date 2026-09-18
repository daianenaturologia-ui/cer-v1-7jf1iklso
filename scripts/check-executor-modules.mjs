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
try {
  const fs = await import('node:fs')
  const zlib = await import('node:zlib')
  const child_process = await import('node:child_process')
  let gitAvailable = false
  let gitOutput = {}
  try {
    const gitLog = child_process.execSync('git log --oneline -10', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const gitShowClient = child_process.execSync(
      'git show 038cf2905995a62d90f8a377135321b031c25938:src/lib/pocketbase/client.ts',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    )
    let gitCatE4 = ''
    try {
      gitCatE4 = child_process.execSync(
        'git cat-file -p e436df84ff576111a4df28741f613a36e35589fb',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      )
    } catch (e) {
      gitCatE4 = 'ERR_CAT_E4: ' + e.message
    }
    let gitReflog = ''
    try {
      gitReflog = child_process.execSync('git reflog -20', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (e) {
      gitReflog = 'ERR_REFLOG: ' + e.message
    }
    gitAvailable = true
    gitOutput = { gitLog, gitShowClient, gitCatE4, gitReflog }
  } catch (e) {
    gitAvailable = false
  }

  // Manual object inspection
  function readGitObject(sha) {
    const p = path.join(rootDir, '.git', 'objects', sha.slice(0, 2), sha.slice(2))
    if (!fs.existsSync(p)) return null
    const buf = fs.readFileSync(p)
    const decompressed = zlib.inflateSync(buf)
    const nullIdx = decompressed.indexOf(0)
    const header = decompressed.slice(0, nullIdx).toString('utf8')
    const data = decompressed.slice(nullIdx + 1)
    const [type, size] = header.split(' ')
    return { type, size: parseInt(size, 10), data }
  }

  const commit038 = readGitObject('038cf2905995a62d90f8a377135321b031c25938')
  const commit038Text = commit038 ? commit038.data.toString('utf8') : null
  const tree038Match = commit038Text ? commit038Text.match(/^tree ([0-9a-f]{40})/m) : null
  const tree038Sha = tree038Match ? tree038Match[1] : null

  function parseTree(treeSha) {
    const treeObj = readGitObject(treeSha)
    if (!treeObj) return []
    const entries = []
    let buf = treeObj.data
    let pos = 0
    while (pos < buf.length) {
      const spaceIdx = buf.indexOf(0x20, pos)
      const mode = buf.slice(pos, spaceIdx).toString('utf8')
      const nullIdx = buf.indexOf(0, spaceIdx)
      const name = buf.slice(spaceIdx + 1, nullIdx).toString('utf8')
      const sha = buf.slice(nullIdx + 1, nullIdx + 21).toString('hex')
      entries.push({ mode, name, sha })
      pos = nullIdx + 21
    }
    return entries
  }

  // Walk tree to find src/lib/pocketbase/client.ts
  let clientTsBlobSha = null
  let clientTsContent = null
  if (tree038Sha) {
    const rootEntries = parseTree(tree038Sha)
    const srcEntry = rootEntries.find((e) => e.name === 'src')
    if (srcEntry) {
      const srcEntries = parseTree(srcEntry.sha)
      const libEntry = srcEntries.find((e) => e.name === 'lib')
      if (libEntry) {
        const libEntries = parseTree(libEntry.sha)
        const pbEntry = libEntries.find((e) => e.name === 'pocketbase')
        if (pbEntry) {
          const pbEntries = parseTree(pbEntry.sha)
          const clientEntry = pbEntries.find((e) => e.name === 'client.ts')
          if (clientEntry) {
            clientTsBlobSha = clientEntry.sha
            const blobObj = readGitObject(clientEntry.sha)
            if (blobObj) clientTsContent = blobObj.data.toString('utf8')
          }
        }
      }
    }
  }

  // Inspect e436df84ff576111a4df28741f613a36e35589fb
  const e4Obj = readGitObject('e436df84ff576111a4df28741f613a36e35589fb')
  const e4Text = e4Obj ? e4Obj.data.toString('utf8') : null

  // Inspect e33274f04a3dcba563ab2e11a8ab481aa886f8e3
  const e3Obj = readGitObject('e33274f04a3dcba563ab2e11a8ab481aa886f8e3')
  const e3Text = e3Obj ? e3Obj.data.toString('utf8') : null

  // Inspect 06a1d142dbfb96a73c67622ff4c1801b921dcd6a (ORIG_HEAD)
  const origObj = readGitObject('06a1d142dbfb96a73c67622ff4c1801b921dcd6a')
  const origText = origObj ? origObj.data.toString('utf8') : null

  // Inspect pack idx
  const packDir = path.join(rootDir, '.git', 'objects', 'pack')
  let packShas = []
  if (fs.existsSync(packDir)) {
    const idxFiles = fs.readdirSync(packDir).filter((f) => f.endsWith('.idx'))
    for (const idxFile of idxFiles) {
      const idxBuf = fs.readFileSync(path.join(packDir, idxFile))
      // Check magic \xfftOc (0xff, 0x74, 0x4f, 0x63)
      if (
        idxBuf.length >= 8 &&
        idxBuf[0] === 0xff &&
        idxBuf[1] === 0x74 &&
        idxBuf[2] === 0x4f &&
        idxBuf[3] === 0x63
      ) {
        const version = idxBuf.readUInt32BE(4)
        const totalObjects = idxBuf.readUInt32BE(8 + 255 * 4)
        const shaTableOffset = 8 + 256 * 4
        for (let i = 0; i < totalObjects; i++) {
          const sha = idxBuf
            .slice(shaTableOffset + i * 20, shaTableOffset + (i + 1) * 20)
            .toString('hex')
          packShas.push(sha)
        }
      }
    }
  }

  const report = {
    gitAvailable,
    gitOutput,
    commit038: {
      header: commit038 ? commit038.type + ' ' + commit038.size : null,
      text: commit038Text,
      treeSha: tree038Sha,
    },
    clientTsIn038: {
      blobSha: clientTsBlobSha,
      content: clientTsContent,
    },
    e436df8: {
      looseFound: !!e4Obj,
      type: e4Obj?.type,
      text: e4Text,
      inPack: packShas.includes('e436df84ff576111a4df28741f613a36e35589fb'),
    },
    e33274f: {
      looseFound: !!e3Obj,
      type: e3Obj?.type,
      text: e3Text,
      inPack: packShas.includes('e33274f04a3dcba563ab2e11a8ab481aa886f8e3'),
    },
    origHead06a1d14: {
      looseFound: !!origObj,
      type: origObj?.type,
      text: origText,
    },
    packCount: packShas.length,
    samplePackShas: packShas.slice(0, 5),
  }

  throw new Error('INVESTIGATION_REPORT: ' + JSON.stringify(report))
} catch (invErr) {
  throw invErr
}

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
