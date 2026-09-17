import { describe, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

function readGitObj(hash: string) {
  const p = path.resolve('.git/objects', hash.slice(0, 2), hash.slice(2))
  return zlib.inflateSync(fs.readFileSync(p))
}

function parseTree(buf: Buffer) {
  // Tree format: 'tree <size>\0' followed by entries: '<mode> <name>\0<20-byte sha>'
  const nullIdx = buf.indexOf(0)
  let pos = nullIdx + 1
  const entries: { mode: string; name: string; sha: string }[] = []
  while (pos < buf.length) {
    const spaceIdx = buf.indexOf(32, pos)
    const mode = buf.toString('utf-8', pos, spaceIdx)
    const zeroIdx = buf.indexOf(0, spaceIdx)
    const name = buf.toString('utf-8', spaceIdx + 1, zeroIdx)
    const sha = buf.subarray(zeroIdx + 1, zeroIdx + 21).toString('hex')
    entries.push({ mode, name, sha })
    pos = zeroIdx + 21
  }
  return entries
}

describe('git tree inspection', () => {
  it('inspect commit 22607b6', () => {
    const commitBuf = readGitObj('22607b69d3ddc62dfe3f5bb54ed3e000f5ef99fd')
    const commitText = commitBuf.toString('utf-8')
    throw new Error('COMMIT DUMP: ' + commitText.replace(/\n/g, ' ~ '))
  })
})
