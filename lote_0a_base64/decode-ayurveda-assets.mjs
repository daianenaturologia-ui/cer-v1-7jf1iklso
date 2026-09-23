import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const base64Dir = path.resolve('lote_0a_base64')
const kitAssetsDir = path.resolve('lote_0a_kit/assets')
const manifestPath = path.resolve('lote_0a_kit/asset-manifest.json')

if (!fs.existsSync(manifestPath)) {
  console.error(`[ERRO] Manifesto não encontrado: ${manifestPath}`)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

if (!fs.existsSync(kitAssetsDir)) {
  fs.mkdirSync(kitAssetsDir, { recursive: true })
}

function pngInfo(buffer) {
  const signature = '89504e470d0a1a0a'
  if (buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('assinatura PNG inválida')
  }
  const width = buffer.readUInt32BE(16)
  const height = buffer.readUInt32BE(20)
  const colorType = buffer.readUInt8(25)
  const hasAlpha = colorType === 4 || colorType === 6
  return { width, height, hasAlpha }
}

let allPass = true
const results = []

for (const asset of manifest.approved_files) {
  const baseName = path.basename(asset.file)
  const base64FileName = `${baseName}.base64.txt`
  const base64FilePath = path.join(base64Dir, base64FileName)

  if (!fs.existsSync(base64FilePath)) {
    results.push({
      arquivo: baseName,
      status: 'FAIL',
      detalhes: `Arquivo base64 ausente: ${base64FileName}`,
    })
    allPass = false
    continue
  }

  try {
    const rawBase64 = fs.readFileSync(base64FilePath, 'utf8').trim()
    const buf = Buffer.from(rawBase64, 'base64')
    const hash = crypto.createHash('sha256').update(buf).digest('hex')
    const info = pngInfo(buf)

    const errors = []
    if (hash !== asset.sha256) {
      errors.push(`hash divergente (obtido: ${hash}, esperado: ${asset.sha256})`)
    }
    if (info.width !== asset.width || info.height !== asset.height) {
      errors.push(
        `dimensões incorretas: ${info.width}x${info.height} (esperado: ${asset.width}x${asset.height})`,
      )
    }
    if (asset.alpha_required && !info.hasAlpha) {
      errors.push('sem canal alfa')
    }

    if (errors.length > 0) {
      results.push({
        arquivo: baseName,
        status: 'FAIL',
        detalhes: errors.join('; '),
      })
      allPass = false
    } else {
      const targetPath = path.resolve('lote_0a_kit', asset.file)
      fs.writeFileSync(targetPath, buf)
      results.push({
        arquivo: baseName,
        status: 'PASS',
        detalhes: `${info.width}x${info.height}, canal alfa OK, hash ${hash.slice(0, 12)}...`,
      })
    }
  } catch (err) {
    results.push({
      arquivo: baseName,
      status: 'FAIL',
      detalhes: err.message,
    })
    allPass = false
  }
}

console.log('=== RESULTADO DA DECODIFICAÇÃO LOTE 0A ===')
console.table(results)

if (!allPass) {
  console.error('\n[FALHA] Nem todos os arquivos foram decodificados com sucesso.')
  process.exitCode = 1
} else {
  console.log('\n[SUCESSO] Todos os 6 PNGs foram reconstruídos e verificados com sucesso.')
}
