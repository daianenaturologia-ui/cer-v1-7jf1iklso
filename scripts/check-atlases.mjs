import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

function inspectPng(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`Not a PNG: ${filePath}`)
  }
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  const bitDepth = buf.readUInt8(24)
  const colorType = buf.readUInt8(25)
  // colorType: 6 is RGBA, 4 is Grayscale+Alpha
  const hasAlpha = colorType === 6 || colorType === 4
  return { width, height, bitDepth, colorType, hasAlpha, size: buf.length }
}

const skinPath = path.resolve('src/assets/ayv-avatar-skin-masks-atlas-v1-c44fc.png')
const hairPath = path.resolve('src/assets/ayv-avatar-hair-masks-atlas-v1-94361.png')

console.log('Skin:', inspectPng(skinPath))
console.log('Hair:', inspectPng(hairPath))
