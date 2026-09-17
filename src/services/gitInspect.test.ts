import { describe, it } from 'vitest'
import fs from 'node:fs'
import zlib from 'node:zlib'

function readObj(h: string) {
  const p = `.git/objects/${h.slice(0, 2)}/${h.slice(2)}`
  return zlib.inflateSync(fs.readFileSync(p)).toString('utf-8')
}

describe('git inspection', () => {
  it('reads commit info', () => {
    console.log('22607b6:', readObj('22607b69d3ddc62dfe3f5bb54ed3e000f5ef99fd'))
    console.log('ORIG_HEAD:', readObj('06a1d142dbfb96a73c67622ff4c1801b921dcd6a'))
  })
})
