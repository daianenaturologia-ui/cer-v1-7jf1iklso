import fs from 'node:fs'
import path from 'node:path'

const downloads = [
  {
    name: 'ayv-feminino-amplo.png.base64.txt',
    url: 'https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/45c9a80b-ca48-4f2a-8654-6ef660d8d25f/ayv-feminino-amplo.png.base64-27a03.txt',
  },
  {
    name: 'ayv-masculino-leve.png.base64.txt',
    url: 'https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/45c9a80b-ca48-4f2a-8654-6ef660d8d25f/ayv-masculino-leve.png.base64-0896d.txt',
  },
  {
    name: 'ayv-masculino-intermediario.png.base64.txt',
    url: 'https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/45c9a80b-ca48-4f2a-8654-6ef660d8d25f/ayv-masculino-intermediario.png.base64-8615e.txt',
  },
]

const targetDir = path.resolve('lote_0a_base64')
fs.mkdirSync(targetDir, { recursive: true })

async function run() {
  const results = []
  for (const item of downloads) {
    try {
      console.log(`Downloading ${item.name} from ${item.url}...`)
      const resp = await fetch(item.url)
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
      }
      const text = await resp.text()
      if (!text || text.trim().length === 0) {
        throw new Error('Arquivo vazio retornado')
      }
      if (text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
        throw new Error('Conteúdo retornado é HTML, não base64')
      }
      const destPath = path.join(targetDir, item.name)
      fs.writeFileSync(destPath, text, 'utf8')
      const stats = fs.statSync(destPath)
      results.push({ name: item.name, status: 'OK', bytes: stats.size })
    } catch (err) {
      results.push({ name: item.name, status: 'FAIL', error: err.message })
    }
  }

  // Also copy the 3 from src/assets/ to canonical names in lote_0a_base64/
  const localCopies = [
    {
      src: 'src/assets/ayv-feminino-leve.png.base64-dadb7.txt',
      dest: 'ayv-feminino-leve.png.base64.txt',
    },
    {
      src: 'src/assets/ayv-feminino-intermediario.png.base64-e4647.txt',
      dest: 'ayv-feminino-intermediario.png.base64.txt',
    },
    {
      src: 'src/assets/ayv-masculino-amplo.png.base64-f1064.txt',
      dest: 'ayv-masculino-amplo.png.base64.txt',
    },
  ]

  for (const item of localCopies) {
    try {
      const srcPath = path.resolve(item.src)
      if (!fs.existsSync(srcPath)) {
        throw new Error(`Arquivo fonte local não encontrado: ${item.src}`)
      }
      const destPath = path.join(targetDir, item.dest)
      fs.copyFileSync(srcPath, destPath)
      const stats = fs.statSync(destPath)
      results.push({ name: item.dest, status: 'OK_LOCAL', bytes: stats.size })
    } catch (err) {
      results.push({ name: item.dest, status: 'FAIL_LOCAL', error: err.message })
    }
  }

  // Copy decoder original do usuário
  const userDecoderSrc = path.resolve('src/assets/decode-ayurveda-assets-mjs-9bca9.txt')
  const userDecoderDest = path.join(targetDir, 'decode-ayurveda-assets.mjs')
  if (fs.existsSync(userDecoderSrc)) {
    fs.copyFileSync(userDecoderSrc, userDecoderDest)
    results.push({
      name: 'decode-ayurveda-assets.mjs',
      status: 'OK_DECODER',
      bytes: fs.statSync(userDecoderDest).size,
    })
  } else {
    results.push({
      name: 'decode-ayurveda-assets.mjs',
      status: 'FAIL_DECODER',
      error: 'não encontrado em src/assets',
    })
  }

  console.log(JSON.stringify(results, null, 2))
}

run()
