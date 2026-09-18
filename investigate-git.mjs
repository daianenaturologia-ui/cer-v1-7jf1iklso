import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import child_process from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const rootDir = path.dirname(__filename)

console.log('=== STARTING GIT INVESTIGATION SCRIPT ===')

const results = {}

// 1. Check if git CLI is available and test commands
results.gitCli = {
  available: false,
  version: null,
  log10: null,
  showClient: null,
  catE4: null,
  catE3: null,
  catOrig: null,
  branchA: null,
  reflog: null,
  errors: {},
}

try {
  const version = child_process
    .execSync('git --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    .trim()
  results.gitCli.available = true
  results.gitCli.version = version

  try {
    results.gitCli.log10 = child_process.execSync('git log --oneline -10', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  } catch (e) {
    results.gitCli.errors.log10 = e.message
  }

  try {
    results.gitCli.branchA = child_process.execSync('git branch -a', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  } catch (e) {
    results.gitCli.errors.branchA = e.message
  }

  try {
    results.gitCli.showClient = child_process.execSync(
      'git show 038cf2905995a62d90f8a377135321b031c25938:src/lib/pocketbase/client.ts',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
    )
  } catch (e) {
    results.gitCli.errors.showClient = e.message
  }

  try {
    results.gitCli.catE4 = child_process
      .execSync('git cat-file -t e436df84ff576111a4df28741f613a36e35589fb', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      .trim()
  } catch (e) {
    results.gitCli.errors.catE4 = e.message
  }

  try {
    results.gitCli.catE3 = child_process
      .execSync('git cat-file -t e33274f04a3dcba563ab2e11a8ab481aa886f8e3', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      .trim()
  } catch (e) {
    results.gitCli.errors.catE3 = e.message
  }

  try {
    results.gitCli.catOrig = child_process
      .execSync('git cat-file -t 06a1d142dbfb96a73c67622ff4c1801b921dcd6a', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      .trim()
  } catch (e) {
    results.gitCli.errors.catOrig = e.message
  }

  try {
    results.gitCli.reflog = child_process.execSync('git reflog -20', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  } catch (e) {
    results.gitCli.errors.reflog = e.message
  }
} catch (e) {
  results.gitCli.available = false
  results.gitCli.errors.main = e.message
}

// 2. Manual Git Object parser with zlib
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

function parseTree(treeSha) {
  const treeObj = readGitObject(treeSha)
  if (!treeObj) return []
  const entries = []
  let buf = treeObj.data
  let pos = 0
  while (pos < buf.length) {
    const spaceIdx = buf.indexOf(0x20, pos)
    if (spaceIdx === -1) break
    const mode = buf.slice(pos, spaceIdx).toString('utf8')
    const nullIdx = buf.indexOf(0, spaceIdx)
    if (nullIdx === -1) break
    const name = buf.slice(spaceIdx + 1, nullIdx).toString('utf8')
    const sha = buf.slice(nullIdx + 1, nullIdx + 21).toString('hex')
    entries.push({ mode, name, sha })
    pos = nullIdx + 21
  }
  return entries
}

// Check pack files
const packDir = path.join(rootDir, '.git', 'objects', 'pack')
const packShas = []
if (fs.existsSync(packDir)) {
  const idxFiles = fs.readdirSync(packDir).filter((f) => f.endsWith('.idx'))
  for (const idxFile of idxFiles) {
    const idxBuf = fs.readFileSync(path.join(packDir, idxFile))
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
results.packObjectsCount = packShas.length

// 2.1 Item 1: 038cf2905995a62d90f8a377135321b031c25938:src/lib/pocketbase/client.ts
const commit038 = readGitObject('038cf2905995a62d90f8a377135321b031c25938')
const commit038Text = commit038 ? commit038.data.toString('utf8') : null
const tree038Match = commit038Text ? commit038Text.match(/^tree ([0-9a-f]{40})/m) : null
const tree038Sha = tree038Match ? tree038Match[1] : null

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

results.item1_clientTs = {
  commitSha: '038cf2905995a62d90f8a377135321b031c25938',
  commitFound: !!commit038,
  commitText: commit038Text,
  treeSha: tree038Sha,
  blobSha: clientTsBlobSha,
  literalContent: clientTsContent,
}

// 2.2 Item 2: Objects e436df84ff576111a4df28741f613a36e35589fb, e33274f04a3dcba563ab2e11a8ab481aa886f8e3, 06a1d142dbfb96a73c67622ff4c1801b921dcd6a
function inspectTargetObject(sha) {
  const loose = readGitObject(sha)
  const inPack = packShas.includes(sha)
  let looseType = loose ? loose.type : null
  let looseText = loose ? loose.data.toString('utf8') : null
  let treeLine = null
  let commitMessage = null

  if (loose && loose.type === 'commit') {
    const lines = looseText.split('\n')
    const treeMatch = looseText.match(/^tree ([0-9a-f]{40})/m)
    treeLine = treeMatch ? treeMatch[0] : null
    const emptyLineIdx = lines.findIndex((l) => l === '')
    if (emptyLineIdx !== -1) {
      commitMessage = lines
        .slice(emptyLineIdx + 1)
        .join('\n')
        .trim()
    }
  }

  return {
    sha,
    looseFound: !!loose,
    looseType,
    inPack,
    treeLine,
    commitMessage,
    fullText: looseText,
  }
}

results.item2_objects = {
  e436df84ff576111a4df28741f613a36e35589fb: inspectTargetObject(
    'e436df84ff576111a4df28741f613a36e35589fb',
  ),
  e33274f04a3dcba563ab2e11a8ab481aa886f8e3: inspectTargetObject(
    'e33274f04a3dcba563ab2e11a8ab481aa886f8e3',
  ),
  '06a1d142dbfb96a73c67622ff4c1801b921dcd6a': inspectTargetObject(
    '06a1d142dbfb96a73c67622ff4c1801b921dcd6a',
  ),
}

// 2.3 Item 3: Reflog check in .git/logs
const logsDir = path.join(rootDir, '.git', 'logs')
results.item3_logs = {
  logsDirExists: fs.existsSync(logsDir),
  files: [],
}

if (fs.existsSync(logsDir)) {
  function scanDirRecursive(dir) {
    const list = fs.readdirSync(dir)
    let found = []
    for (const item of list) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        found = found.concat(scanDirRecursive(fullPath))
      } else {
        const rel = path.relative(logsDir, fullPath)
        const content = fs.readFileSync(fullPath, 'utf8')
        found.push({ relativePath: rel, content })
      }
    }
    return found
  }
  results.item3_logs.files = scanDirRecursive(logsDir)
}

// Check specifically: .git/logs/refs/heads/main and .git/logs/refs/remotes/origin/main
results.item3_logs.headsMainExists = fs.existsSync(path.join(logsDir, 'refs', 'heads', 'main'))
results.item3_logs.remotesOriginMainExists = fs.existsSync(
  path.join(logsDir, 'refs', 'remotes', 'origin', 'main'),
)

// 2.4 Item 4: Check run-status branch
const runStatusHeads = path.join(rootDir, '.git', 'refs', 'heads', 'run-status')
const runStatusRemotes = path.join(rootDir, '.git', 'refs', 'remotes', 'origin', 'run-status')
const packedRefsPath = path.join(rootDir, '.git', 'packed-refs')
let packedRefsContent = null
if (fs.existsSync(packedRefsPath)) {
  packedRefsContent = fs.readFileSync(packedRefsPath, 'utf8')
}

let runStatusCommitSha = null
if (fs.existsSync(runStatusHeads)) {
  runStatusCommitSha = fs.readFileSync(runStatusHeads, 'utf8').trim()
} else if (fs.existsSync(runStatusRemotes)) {
  runStatusCommitSha = fs.readFileSync(runStatusRemotes, 'utf8').trim()
} else if (packedRefsContent) {
  const m = packedRefsContent.match(
    /^([0-9a-f]{40})\s+refs\/(?:heads|remotes\/origin)\/run-status/m,
  )
  if (m) runStatusCommitSha = m[1]
}

results.item4_runStatus = {
  headsExists: fs.existsSync(runStatusHeads),
  remotesExists: fs.existsSync(runStatusRemotes),
  commitSha: runStatusCommitSha,
  jsonResults: null,
  filesInCommit: [],
}

if (runStatusCommitSha) {
  const commitObj = readGitObject(runStatusCommitSha)
  if (commitObj) {
    const text = commitObj.data.toString('utf8')
    const tMatch = text.match(/^tree ([0-9a-f]{40})/m)
    if (tMatch) {
      const treeEntries = parseTree(tMatch[1])
      results.item4_runStatus.filesInCommit = treeEntries.map((e) => e.name)
      // Look for json files or results
      for (const entry of treeEntries) {
        if (
          entry.name.endsWith('.json') ||
          entry.name.includes('result') ||
          entry.name.includes('cad') ||
          entry.name.includes('pav')
        ) {
          const blob = readGitObject(entry.sha)
          if (blob) {
            results.item4_runStatus.jsonResults = {
              fileName: entry.name,
              content: blob.data.toString('utf8'),
            }
          }
        }
      }
    }
  }
}

// 2.5 Also inspect all refs in .git/refs
const refsDir = path.join(rootDir, '.git', 'refs')
results.allRefs = []
if (fs.existsSync(refsDir)) {
  function scanRefs(dir) {
    const list = fs.readdirSync(dir)
    let found = []
    for (const item of list) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        found = found.concat(scanRefs(fullPath))
      } else {
        const rel = path.relative(refsDir, fullPath)
        const content = fs.readFileSync(fullPath, 'utf8').trim()
        found.push({ ref: rel, sha: content })
      }
    }
    return found
  }
  results.allRefs = scanRefs(refsDir)
}

// Also check loose objects list
const objectsDir = path.join(rootDir, '.git', 'objects')
const looseObjects = []
if (fs.existsSync(objectsDir)) {
  const subdirs = fs.readdirSync(objectsDir).filter((d) => /^[0-9a-f]{2}$/.test(d))
  for (const sd of subdirs) {
    const files = fs.readdirSync(path.join(objectsDir, sd))
    for (const f of files) {
      looseObjects.push(sd + f)
    }
  }
}
results.totalLooseObjects = looseObjects.length
results.looseObjectShas = looseObjects

// Write results out to investigation-output.json for safe reading
fs.writeFileSync(
  path.join(rootDir, 'investigation-output.json'),
  JSON.stringify(results, null, 2),
  'utf8',
)
console.log('=== INVESTIGATION COMPLETED SUCCESSFULLY ===')
