import fs from 'node:fs'
import path from 'node:path'

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
