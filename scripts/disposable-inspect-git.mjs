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

const obj80 = readObject('800336e4ec30f92b91efb95246985e1f229d1517')
console.log('=== 800336e ===')
console.log('Header:', obj80.header)
console.log('Content:\n', obj80.content.toString('utf8'))

const objDb = readObject('dbaac35b1a89888ba3b32537a15b9fa4f29f43e0')
console.log('=== dbaac35 ===')
console.log('Header:', objDb.header)
console.log('Content:\n', objDb.content.toString('utf8'))

const obj8b = readObject('8b92fa0daed4aae8da873f4ac76cc61998e0a626')
console.log('=== 8b92fa0 (HEAD/main) ===')
console.log('Header:', obj8b.header)
console.log('Content:\n', obj8b.content.toString('utf8'))
throw new Error(
  'FORCE_OUTPUT:\n800336e:\n' +
    obj80.content.toString('utf8') +
    '\ndbaac35:\n' +
    objDb.content.toString('utf8') +
    '\n8b92fa0:\n' +
    obj8b.content.toString('utf8'),
)
