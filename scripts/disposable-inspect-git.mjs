import fs from 'node:fs'
import zlib from 'node:zlib'

function readObject(hash) {
  const dir = hash.slice(0, 2)
  const file = hash.slice(2)
  const buf = fs.readFileSync(`.git/objects/${dir}/${file}`)
  const decompressed = zlib.inflateSync(buf)
  const nulIdx = decompressed.indexOf(0)
  const header = decompressed.slice(0, nulIdx).toString('utf8')
  const content = decompressed.slice(nulIdx + 1)
  return { header, content }
}

const obj = readObject('800336e4ec30f92b91efb95246985e1f229d1517')
console.log('START_GIT_OBJ')
console.log(obj.content.toString('utf8'))
console.log('END_GIT_OBJ')
throw new Error('STOP: ' + obj.content.toString('utf8').slice(0, 200))
