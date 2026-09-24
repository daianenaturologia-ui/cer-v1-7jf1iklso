import { decodeAll } from '../lote_0a_base64/decode-ayurveda-assets.mjs'
import { validateAssets } from '../lote_0a_kit/validate-assets.mjs'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'

const manifest = JSON.parse(fs.readFileSync('lote_0a_kit/asset-manifest.json', 'utf8'))
const decodeRes = await decodeAll()
const valRes = await validateAssets()

const report = {
  decodeResults: decodeRes,
  kitAssets: [],
  validationResults: valRes,
  publicAssets: [],
}

for (const f of manifest.approved_files) {
  const fileName = path.basename(f.file)
  const kitPath = path.resolve('lote_0a_kit/assets', fileName)
  const kitBuf = fs.readFileSync(kitPath)
  const kitHash = crypto.createHash('sha256').update(kitBuf).digest('hex')
  report.kitAssets.push({
    file: fileName,
    size: kitBuf.length,
    sha256: kitHash,
    expectedHash: f.sha256,
    hashMatch: kitHash === f.sha256,
  })

  const pubPath = path.resolve('public/assets/ayurveda', fileName)
  const pubBuf = fs.readFileSync(pubPath)
  const pubHash = crypto.createHash('sha256').update(pubBuf).digest('hex')
  report.publicAssets.push({
    file: fileName,
    size: pubBuf.length,
    sha256: pubHash,
    expectedHash: f.sha256,
    hashMatch: pubHash === f.sha256,
    matchesKit: pubBuf.equals(kitBuf),
  })
}

try {
  const out = execSync('node scripts/check-atlases.mjs', { encoding: 'utf8' })
  report.atlasVerification = out.trim()
} catch (e) {
  console.error('Atlas check error:', e)
}

try {
  const { cropClinicalBoards, cropAllAtlases } = await import('./crop-atlases.mjs')
  report.clinicalCropResults = cropClinicalBoards()
  report.maskCropResults = cropAllAtlases()
} catch (e) {
  console.error('Crop atlases error in collect-evidence:', e)
}

fs.writeFileSync(
  'scripts/ayurveda-execution-evidence.json',
  JSON.stringify(report, null, 2),
  'utf8',
)
console.log('EVIDENCE WRITTEN SUCCESSFULLY')
