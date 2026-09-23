import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

try {
  console.log('[copy-asset] running download-and-assemble...')
  execSync('node scripts/download-and-assemble.mjs', { stdio: 'inherit' })
} catch (e) {
  console.error('[copy-asset] error:', e)
}

// Copy official Ayurveda assets to public/assets/ayurveda/
const ayurvedaAssets = [
  'ayv-feminino-leve.png',
  'ayv-feminino-intermediario.png',
  'ayv-feminino-amplo.png',
  'ayv-masculino-leve.png',
  'ayv-masculino-intermediario.png',
  'ayv-masculino-amplo.png',
]

const ayvTargetDir = path.resolve('public/assets/ayurveda')
fs.mkdirSync(ayvTargetDir, { recursive: true })

for (const assetName of ayurvedaAssets) {
  const srcAyv = path.resolve('lote_0a_kit/assets', assetName)
  if (fs.existsSync(srcAyv)) {
    const destAyv = path.join(ayvTargetDir, assetName)
    fs.copyFileSync(srcAyv, destAyv)
    console.log(
      `[copy-asset] Copied Ayurveda asset ${assetName} (${fs.statSync(destAyv).size} bytes)`,
    )
  }
}

// Also keep copy of asset-manifest.json in public/assets/ayurveda/
const manifestSrc = path.resolve('lote_0a_kit/asset-manifest.json')
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, path.join(ayvTargetDir, 'asset-manifest.json'))
}

const src = path.resolve('src/assets/ser-integral-cer-4eb44.png')
const dest = path.resolve('public/ser-integral-cer.png')

const srcBuf = fs.readFileSync(src)
fs.writeFileSync(dest, srcBuf)

console.log('Copied size:', srcBuf.length)

// Parse PNG header and IHDR to get dimensions and color type
// PNG signature: 89 50 4E 47 0D 0A 1A 0A
if (srcBuf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
  // First chunk is IHDR
  const ihdrLen = srcBuf.readUInt32BE(8)
  const ihdrType = srcBuf.slice(12, 16).toString('ascii')
  const width = srcBuf.readUInt32BE(16)
  const height = srcBuf.readUInt32BE(20)
  const bitDepth = srcBuf.readUInt8(24)
  const colorType = srcBuf.readUInt8(25) // 0: grayscale, 2: RGB, 3: palette, 4: grayscale+alpha, 6: RGBA
  const compression = srcBuf.readUInt8(26)
  const filter = srcBuf.readUInt8(27)
  const interlace = srcBuf.readUInt8(28)

  const colorTypeStr =
    colorType === 6
      ? 'RGBA (truecolor with alpha - transparency)'
      : colorType === 2
        ? 'RGB (truecolor)'
        : colorType === 3
          ? 'Indexed color'
          : colorType === 4
            ? 'Grayscale with alpha'
            : colorType === 0
              ? 'Grayscale'
              : 'Unknown'

  const info = {
    validPng: true,
    ihdrType,
    width,
    height,
    bitDepth,
    colorType,
    colorTypeStr,
    bytes: srcBuf.length,
    hasAlpha: colorType === 6 || colorType === 4,
  }
  console.log(JSON.stringify(info, null, 2))
} else {
  console.log('Not a standard PNG file!')
}
