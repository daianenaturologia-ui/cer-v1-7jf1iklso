import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'

function readGitObject(sha) {
  const sub = sha.slice(0, 2)
  const rest = sha.slice(2)
  const p = path.join('.git', 'objects', sub, rest)
  if (!fs.existsSync(p)) return null
  const buf = fs.readFileSync(p)
  const decomp = zlib.inflateSync(buf)
  const nulIdx = decomp.indexOf(0)
  const header = decomp.subarray(0, nulIdx).toString('utf8')
  const content = decomp.subarray(nulIdx + 1)
  const [type, sizeStr] = header.split(' ')
  return { type, size: parseInt(sizeStr, 10), content }
}

function parseCommit(sha) {
  const obj = readGitObject(sha)
  if (!obj || obj.type !== 'commit') return null
  const str = obj.content.toString('utf8')
  const lines = str.split('\n')
  let tree = ''
  const parents = []
  let author = ''
  let committer = ''
  let msgStart = 0
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l === '') {
      msgStart = i + 1
      break
    }
    if (l.startsWith('tree ')) tree = l.slice(5)
    if (l.startsWith('parent ')) parents.push(l.slice(7))
    if (l.startsWith('author ')) author = l.slice(7)
    if (l.startsWith('committer ')) committer = l.slice(10)
  }
  const message = lines.slice(msgStart).join('\n')
  return { sha, tree, parents, author, committer, message }
}

function parseTree(sha) {
  const obj = readGitObject(sha)
  if (!obj || obj.type !== 'tree') return []
  const entries = []
  let buf = obj.content
  let offset = 0
  while (offset < buf.length) {
    const spaceIdx = buf.indexOf(0x20, offset)
    const mode = buf.subarray(offset, spaceIdx).toString('utf8')
    const nulIdx = buf.indexOf(0x00, spaceIdx)
    const name = buf.subarray(spaceIdx + 1, nulIdx).toString('utf8')
    const shaBytes = buf.subarray(nulIdx + 1, nulIdx + 21)
    const entrySha = shaBytes.toString('hex')
    entries.push({ mode, name, sha: entrySha })
    offset = nulIdx + 21
  }
  return entries
}

function findPathInTree(treeSha, pathParts) {
  let currentTreeSha = treeSha
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i]
    const entries = parseTree(currentTreeSha)
    const found = entries.find((e) => e.name === part)
    if (!found) return null
    if (i === pathParts.length - 1) {
      return found.sha
    }
    currentTreeSha = found.sha
  }
  return null
}

fs.writeFileSync('diag_output.txt', 'RUNNING DIAG\n')
function logToFile(msg) {
  fs.appendFileSync('diag_output.txt', msg + '\n')
}
logToFile('=== COMMITS ===')
const v72 = fs.readFileSync('.git/refs/tags/v0.0.72', 'utf8').trim()
const v73 = fs.readFileSync('.git/refs/tags/v0.0.73', 'utf8').trim()
const head = fs.readFileSync('.git/refs/heads/main', 'utf8').trim()

for (const [tag, sha] of [
  ['v0.0.72', v72],
  ['v0.0.73', v73],
  ['HEAD/main', head],
]) {
  const c = parseCommit(sha)
  logToFile(`\nTag/Ref: ${tag} (${sha})`)
  logToFile(`Author: ${c.author}`)
  logToFile(`Committer: ${c.committer}`)
  logToFile(`Parents: ${c.parents.join(', ')}`)
  logToFile(`Message: ${c.message.trim()}`)

  const clientSha = findPathInTree(c.tree, ['src', 'lib', 'pocketbase', 'client.ts'])
  logToFile(`src/lib/pocketbase/client.ts SHA: ${clientSha}`)
  if (clientSha) {
    const blob = readGitObject(clientSha)
    logToFile('--- CONTENT START ---')
    logToFile(blob.content.toString('utf8'))
    logToFile('--- CONTENT END ---')
  }
}
