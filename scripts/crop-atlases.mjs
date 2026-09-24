import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'

// CRC32 implementation for PNG chunks
const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  CRC_TABLE[n] = c >>> 0
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function paethPredictor(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function decodePng(buf) {
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Not a PNG file')
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let compression = 0
  let filter = 0
  let interlace = 0
  const idatChunks = []

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset)
    const type = buf.slice(offset + 4, offset + 8).toString('ascii')
    const chunkData = buf.slice(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === 'IHDR') {
      width = chunkData.readUInt32BE(0)
      height = chunkData.readUInt32BE(4)
      bitDepth = chunkData.readUInt8(8)
      colorType = chunkData.readUInt8(9)
      compression = chunkData.readUInt8(10)
      filter = chunkData.readUInt8(11)
      interlace = chunkData.readUInt8(12)
      if (
        bitDepth !== 8 ||
        colorType !== 6 ||
        compression !== 0 ||
        filter !== 0 ||
        interlace !== 0
      ) {
        throw new Error(
          `Unsupported PNG: bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace}`,
        )
      }
    } else if (type === 'IDAT') {
      idatChunks.push(chunkData)
    } else if (type === 'IEND') {
      break
    }
  }

  const compressedData = Buffer.concat(idatChunks)
  const decompressed = zlib.inflateSync(compressedData)

  const bytesPerPixel = 4 // RGBA
  const stride = width * bytesPerPixel
  const rawRgba = Buffer.alloc(width * height * bytesPerPixel)

  let srcOffset = 0
  let dstOffset = 0

  for (let y = 0; y < height; y++) {
    const filterType = decompressed.readUInt8(srcOffset)
    srcOffset += 1

    const scanline = decompressed.slice(srcOffset, srcOffset + stride)
    srcOffset += stride

    const prevScanline = y > 0 ? rawRgba.slice((y - 1) * stride, y * stride) : null

    for (let x = 0; x < stride; x++) {
      const bppIndex = x - bytesPerPixel
      const a = bppIndex >= 0 ? rawRgba[dstOffset + bppIndex] : 0
      const b = prevScanline ? prevScanline[x] : 0
      const c = prevScanline && bppIndex >= 0 ? prevScanline[bppIndex] : 0
      const rawByte = scanline[x]

      let reconstructed = 0
      switch (filterType) {
        case 0: // None
          reconstructed = rawByte
          break
        case 1: // Sub
          reconstructed = (rawByte + a) & 0xff
          break
        case 2: // Up
          reconstructed = (rawByte + b) & 0xff
          break
        case 3: // Average
          reconstructed = (rawByte + Math.floor((a + b) / 2)) & 0xff
          break
        case 4: // Paeth
          reconstructed = (rawByte + paethPredictor(a, b, c)) & 0xff
          break
        default:
          throw new Error(`Unknown filter type ${filterType}`)
      }
      rawRgba[dstOffset + x] = reconstructed
    }
    dstOffset += stride
  }

  return { width, height, rawRgba }
}

function encodePng(width, height, rawRgba) {
  const bytesPerPixel = 4
  const stride = width * bytesPerPixel
  const filtered = Buffer.alloc(height * (stride + 1))

  let srcOffset = 0
  let dstOffset = 0

  for (let y = 0; y < height; y++) {
    filtered[dstOffset++] = 0 // Filter type 0 (None)
    rawRgba.copy(filtered, dstOffset, srcOffset, srcOffset + stride)
    dstOffset += stride
    srcOffset += stride
  }

  const compressed = zlib.deflateSync(filtered, { level: 9 })

  // Write PNG
  // Signature (8 bytes)
  // IHDR (4 length + 4 type + 13 data + 4 crc = 25 bytes)
  // IDAT (4 length + 4 type + data.length + 4 crc)
  // IEND (4 length + 4 type + 4 crc = 12 bytes)
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData.writeUInt8(8, 8) // bitDepth
  ihdrData.writeUInt8(6, 9) // colorType RGBA
  ihdrData.writeUInt8(0, 10) // compression
  ihdrData.writeUInt8(0, 11) // filter
  ihdrData.writeUInt8(0, 12) // interlace

  const ihdrChunk = Buffer.concat([Buffer.from('IHDR', 'ascii'), ihdrData])
  const ihdrCrc = crc32(ihdrChunk)

  const idatChunk = Buffer.concat([Buffer.from('IDAT', 'ascii'), compressed])
  const idatCrc = crc32(idatChunk)

  const iendChunk = Buffer.from('IEND', 'ascii')
  const iendCrc = crc32(iendChunk)

  const totalLength = 8 + (12 + 13) + (12 + compressed.length) + 12
  const out = Buffer.alloc(totalLength)
  let pos = 0

  // Signature
  Buffer.from('89504e470d0a1a0a', 'hex').copy(out, pos)
  pos += 8

  // IHDR
  out.writeUInt32BE(13, pos)
  pos += 4
  ihdrChunk.copy(out, pos)
  pos += ihdrChunk.length
  out.writeUInt32BE(ihdrCrc, pos)
  pos += 4

  // IDAT
  out.writeUInt32BE(compressed.length, pos)
  pos += 4
  idatChunk.copy(out, pos)
  pos += idatChunk.length
  out.writeUInt32BE(idatCrc, pos)
  pos += 4

  // IEND
  out.writeUInt32BE(0, pos)
  pos += 4
  iendChunk.copy(out, pos)
  pos += iendChunk.length
  out.writeUInt32BE(iendCrc, pos)
  pos += 4

  return out
}

function cropRgba(sourceRgba, srcWidth, cropX, cropY, cropWidth, cropHeight) {
  const bytesPerPixel = 4
  const targetRgba = Buffer.alloc(cropWidth * cropHeight * bytesPerPixel)
  const srcStride = srcWidth * bytesPerPixel
  const targetStride = cropWidth * bytesPerPixel

  for (let y = 0; y < cropHeight; y++) {
    const srcRowStart = (cropY + y) * srcStride + cropX * bytesPerPixel
    const srcRowEnd = srcRowStart + targetStride
    const targetRowStart = y * targetStride
    sourceRgba.copy(targetRgba, targetRowStart, srcRowStart, srcRowEnd)
  }

  return targetRgba
}

const CROPS = [
  { nameSuffix: 'feminino-leve', x: 0, y: 0, w: 1024, h: 1536 },
  { nameSuffix: 'feminino-intermediario', x: 1024, y: 0, w: 1024, h: 1536 },
  { nameSuffix: 'feminino-amplo', x: 2048, y: 0, w: 1024, h: 1536 },
  { nameSuffix: 'masculino-leve', x: 0, y: 1536, w: 1024, h: 1536 },
  { nameSuffix: 'masculino-intermediario', x: 1024, y: 1536, w: 1024, h: 1536 },
  { nameSuffix: 'masculino-amplo', x: 2048, y: 1536, w: 1024, h: 1536 },
]

export const AYV_CLINICAL_CARDS_CROPS = {
  skin: [
    { id: 'dry_rough', fileName: 'ayv-skin-dry_rough.png', col: 0, row: 0 },
    { id: 'thin_reactive', fileName: 'ayv-skin-thin_reactive.png', col: 1, row: 0 },
    { id: 'warm_sensitive', fileName: 'ayv-skin-warm_sensitive.png', col: 2, row: 0 },
    { id: 'balanced', fileName: 'ayv-skin-balanced.png', col: 0, row: 1 },
    { id: 'soft_oily', fileName: 'ayv-skin-soft_oily.png', col: 1, row: 1 },
    { id: 'varies_region', fileName: 'ayv-skin-varies_region.png', col: 2, row: 1 },
  ],
  hair: [
    { id: 'fine_delicate', fileName: 'ayv-hair-fine_delicate.png', col: 0, row: 0 },
    { id: 'dry_tangled', fileName: 'ayv-hair-dry_tangled.png', col: 1, row: 0 },
    { id: 'balanced', fileName: 'ayv-hair-balanced.png', col: 2, row: 0 },
    { id: 'thick_dense', fileName: 'ayv-hair-thick_dense.png', col: 0, row: 1 },
    { id: 'oily_roots', fileName: 'ayv-hair-oily_roots.png', col: 1, row: 1 },
    { id: 'mixed_varies', fileName: 'ayv-hair-mixed_varies.png', col: 2, row: 1 },
  ],
}

export function cropClinicalBoards() {
  const peleTxtPath = path.resolve('src/assets/cer-ayv-prancha-pele.base64-39794.txt')
  const cabeloTxtPath = path.resolve('src/assets/cer-ayv-prancha-cabelo.base64-27c06.txt')

  if (!fs.existsSync(peleTxtPath) || !fs.existsSync(cabeloTxtPath)) {
    console.warn('[crop-atlases] Pranchas base64 não encontradas, pulando cropClinicalBoards')
    return []
  }

  const peleBase64 = fs.readFileSync(peleTxtPath, 'utf8').replace(/\s+/g, '')
  const peleBuf = Buffer.from(peleBase64, 'base64')
  const peleDecoded = decodePng(peleBuf)

  const cabeloBase64 = fs.readFileSync(cabeloTxtPath, 'utf8').replace(/\s+/g, '')
  const cabeloBuf = Buffer.from(cabeloBase64, 'base64')
  const cabeloDecoded = decodePng(cabeloBuf)

  const cellW = 356
  const cellH = 356

  const targetDir = path.resolve('public/assets/ayurveda')
  fs.mkdirSync(targetDir, { recursive: true })

  const results = []

  // Recorte 3x2 pele (6 cards)
  for (const item of AYV_CLINICAL_CARDS_CROPS.skin) {
    const cropX = item.col * cellW
    const cropY = item.row * cellH
    const croppedBuffer = cropRgba(
      peleDecoded.rawRgba,
      peleDecoded.width,
      cropX,
      cropY,
      cellW,
      cellH,
    )
    const pngBuffer = encodePng(cellW, cellH, croppedBuffer)
    const outPath = path.join(targetDir, item.fileName)
    fs.writeFileSync(outPath, pngBuffer)
    const sha256 = crypto.createHash('sha256').update(pngBuffer).digest('hex')
    results.push({
      id: item.id,
      category: 'skin',
      fileName: item.fileName,
      width: cellW,
      height: cellH,
      bytes: pngBuffer.length,
      sha256,
    })
    console.log(`[crop-atlases] Wrote clinical skin card ${item.fileName} (${cellW}x${cellH})`)
  }

  // Recorte 3x2 cabelo (6 cards)
  for (const item of AYV_CLINICAL_CARDS_CROPS.hair) {
    const cropX = item.col * cellW
    const cropY = item.row * cellH
    const croppedBuffer = cropRgba(
      cabeloDecoded.rawRgba,
      cabeloDecoded.width,
      cropX,
      cropY,
      cellW,
      cellH,
    )
    const pngBuffer = encodePng(cellW, cellH, croppedBuffer)
    const outPath = path.join(targetDir, item.fileName)
    fs.writeFileSync(outPath, pngBuffer)
    const sha256 = crypto.createHash('sha256').update(pngBuffer).digest('hex')
    results.push({
      id: item.id,
      category: 'hair',
      fileName: item.fileName,
      width: cellW,
      height: cellH,
      bytes: pngBuffer.length,
      sha256,
    })
    console.log(`[crop-atlases] Wrote clinical hair card ${item.fileName} (${cellW}x${cellH})`)
  }

  return results
}

export function cropAllAtlases() {
  cropClinicalBoards()
  const skinAtlasPath = path.resolve('src/assets/ayv-avatar-skin-masks-atlas-v1-c44fc.png')
  const hairAtlasPath = path.resolve('src/assets/ayv-avatar-hair-masks-atlas-v1-94361.png')

  console.log('[crop-atlases] Decoding skin atlas...')
  const skinDecoded = decodePng(fs.readFileSync(skinAtlasPath))
  console.log(`[crop-atlases] Skin atlas decoded: ${skinDecoded.width}x${skinDecoded.height}`)

  console.log('[crop-atlases] Decoding hair atlas...')
  const hairDecoded = decodePng(fs.readFileSync(hairAtlasPath))
  console.log(`[crop-atlases] Hair atlas decoded: ${hairDecoded.width}x${hairDecoded.height}`)

  if (skinDecoded.width !== 3072 || skinDecoded.height !== 3072) {
    throw new Error(`Skin atlas dimensions invalid: ${skinDecoded.width}x${skinDecoded.height}`)
  }
  if (hairDecoded.width !== 3072 || hairDecoded.height !== 3072) {
    throw new Error(`Hair atlas dimensions invalid: ${hairDecoded.width}x${hairDecoded.height}`)
  }

  const targetDir = path.resolve('public/assets/ayurveda')
  fs.mkdirSync(targetDir, { recursive: true })

  const results = []

  // 1. Process skin masks
  for (const crop of CROPS) {
    const fileName = `ayv-${crop.nameSuffix}-skin-mask.png`
    const croppedBuffer = cropRgba(
      skinDecoded.rawRgba,
      skinDecoded.width,
      crop.x,
      crop.y,
      crop.w,
      crop.h,
    )

    // Check if not empty (at least some non-zero alpha)
    let nonZeroAlpha = 0
    for (let i = 3; i < croppedBuffer.length; i += 4) {
      if (croppedBuffer[i] > 0) nonZeroAlpha++
    }

    const pngBuffer = encodePng(crop.w, crop.h, croppedBuffer)
    const outPath = path.join(targetDir, fileName)
    fs.writeFileSync(outPath, pngBuffer)

    const sha256 = crypto.createHash('sha256').update(pngBuffer).digest('hex')
    results.push({
      fileName,
      type: 'skin',
      width: crop.w,
      height: crop.h,
      bytes: pngBuffer.length,
      nonZeroAlphaPixels: nonZeroAlpha,
      sha256,
    })
    console.log(
      `[crop-atlases] Wrote ${fileName}: ${crop.w}x${crop.h}, ${pngBuffer.length} bytes, ${nonZeroAlpha} non-zero alpha pixels`,
    )
  }

  // 2. Process hair masks
  for (const crop of CROPS) {
    const fileName = `ayv-${crop.nameSuffix}-hair-mask.png`
    const croppedBuffer = cropRgba(
      hairDecoded.rawRgba,
      hairDecoded.width,
      crop.x,
      crop.y,
      crop.w,
      crop.h,
    )

    let nonZeroAlpha = 0
    for (let i = 3; i < croppedBuffer.length; i += 4) {
      if (croppedBuffer[i] > 0) nonZeroAlpha++
    }

    const pngBuffer = encodePng(crop.w, crop.h, croppedBuffer)
    const outPath = path.join(targetDir, fileName)
    fs.writeFileSync(outPath, pngBuffer)

    const sha256 = crypto.createHash('sha256').update(pngBuffer).digest('hex')
    results.push({
      fileName,
      type: 'hair',
      width: crop.w,
      height: crop.h,
      bytes: pngBuffer.length,
      nonZeroAlphaPixels: nonZeroAlpha,
      sha256,
    })
    console.log(
      `[crop-atlases] Wrote ${fileName}: ${crop.w}x${crop.h}, ${pngBuffer.length} bytes, ${nonZeroAlpha} non-zero alpha pixels`,
    )
  }

  return results
}

if (process.argv[1] && process.argv[1].endsWith('crop-atlases.mjs')) {
  cropAllAtlases()
}
