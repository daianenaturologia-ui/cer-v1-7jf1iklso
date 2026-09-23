import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const base64Dir = path.resolve('lote_0a_base64')
const kitAssetsDir = path.resolve('lote_0a_kit/assets')

if (!fs.existsSync(kitAssetsDir)) {
  fs.mkdirSync(kitAssetsDir, { recursive: true })
}

const manifestPath = path.resolve('lote_0a_kit/asset-manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

console.log('=== VERIFICANDO ARQUIVOS DISPONÍVEIS ===')

// Verificar o que existe em src/assets
const filesInAssets = fs.readdirSync('src/assets')
console.log('Arquivos em src/assets:', filesInAssets)

// Copiar os disponíveis para lote_0a_base64
for (const f of filesInAssets) {
  if (f.startsWith('ayv-feminino-leve.png.base64')) {
    fs.copyFileSync(`src/assets/${f}`, 'lote_0a_base64/ayv-feminino-leve.png.base64.txt')
    console.log('Copiado: ayv-feminino-leve.png.base64.txt')
  }
  if (f.startsWith('ayv-feminino-intermediario.png.base64')) {
    fs.copyFileSync(`src/assets/${f}`, 'lote_0a_base64/ayv-feminino-intermediario.png.base64.txt')
    console.log('Copiado: ayv-feminino-intermediario.png.base64.txt')
  }
}

for (const item of manifest.approved_files) {
  const baseName = path.basename(item.file)
  const base64FileName = `${baseName}.base64.txt`
  const base64Path = path.join(base64Dir, base64FileName)

  if (!fs.existsSync(base64Path)) {
    console.log(`[STATUS: AUSENTE] ${base64FileName}`)
    continue
  }

  const rawBase64 = fs.readFileSync(base64Path, 'utf8').trim()
  const buf = Buffer.from(rawBase64, 'base64')
  const sha = crypto.createHash('sha256').update(buf).digest('hex')

  const match = sha === item.sha256
  console.log(
    `[STATUS: ${match ? 'PASS' : 'FAIL'}] ${baseName} | Bytes: ${buf.length} | Hash: ${sha} | Esperado: ${item.sha256}`,
  )
}
