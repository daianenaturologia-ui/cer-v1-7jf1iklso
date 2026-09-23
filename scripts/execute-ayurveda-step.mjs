import { decodeAll } from './lote_0a_base64/decode-ayurveda-assets.mjs'
import { validateAssets } from './lote_0a_kit/validate-assets.mjs'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

console.log('=== STEP 1: DECODE ALL ===')
const decodeRes = await decodeAll()
console.log('Decode results:', JSON.stringify(decodeRes, null, 2))

console.log('\n=== STEP 2: CHECK STATS IN lote_0a_kit/assets ===')
for (const item of decodeRes) {
  const p = path.resolve('lote_0a_kit/assets', item.file)
  const st = fs.statSync(p)
  console.log(`- ${item.file}: ${st.size} bytes`)
}

console.log('\n=== STEP 3: VALIDATE ASSETS ===')
const valRes = await validateAssets()
console.log('Validate results:', JSON.stringify(valRes, null, 2))

console.log('\n=== STEP 4: COPY TO public/assets/ayurveda/ ===')
const targetDir = path.resolve('public/assets/ayurveda')
fs.mkdirSync(targetDir, { recursive: true })
for (const item of decodeRes) {
  const src = path.resolve('lote_0a_kit/assets', item.file)
  const dst = path.resolve(targetDir, item.file)
  fs.copyFileSync(src, dst)
  const buf = fs.readFileSync(dst)
  const h = crypto.createHash('sha256').update(buf).digest('hex')
  console.log(`Copied ${item.file}: ${buf.length} bytes, sha256: ${h}`)
}
const manSrc = path.resolve('lote_0a_kit/asset-manifest.json')
fs.copyFileSync(manSrc, path.resolve(targetDir, 'asset-manifest.json'))
console.log('Copied asset-manifest.json to public/assets/ayurveda/')
