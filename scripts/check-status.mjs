import fs from 'node:fs'
import path from 'node:path'

const files = [
  'lote_0a_base64/ayv-feminino-leve.png.base64.txt',
  'lote_0a_base64/ayv-feminino-intermediario.png.base64.txt',
  'lote_0a_base64/ayv-feminino-amplo.png.base64.txt',
  'lote_0a_base64/ayv-masculino-leve.png.base64.txt',
  'lote_0a_base64/ayv-masculino-intermediario.png.base64.txt',
  'lote_0a_base64/ayv-masculino-amplo.png.base64.txt',
  'lote_0a_base64/decode-ayurveda-assets.mjs',
]

for (const f of files) {
  const p = path.resolve(f)
  const exists = fs.existsSync(p)
  const size = exists ? fs.statSync(p).size : 0
  console.log(`${f}: exists=${exists}, size=${size}`)
}
