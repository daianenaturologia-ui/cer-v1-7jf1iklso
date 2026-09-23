import fs from 'node:fs'
import path from 'node:path'

const downloads = []

const targetDir = path.resolve('lote_0a_base64')
fs.mkdirSync(targetDir, { recursive: true })

async function run() {
  const results = []
  for (const item of downloads) {
    try {
      console.log(`Checking ${item.name}...`)
      const destPath = path.join(targetDir, item.name)
      const stats = fs.statSync(destPath)
      results.push({ name: item.name, status: 'OK', bytes: stats.size })
    } catch (err) {
      results.push({ name: item.name, status: 'FAIL', error: err.message })
    }
  }

  // Copy all 6 from src/assets/ to canonical names in lote_0a_base64/
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
      src: 'src/assets/ayv-feminino-amplo.png.base64-050fe.txt',
      dest: 'ayv-feminino-amplo.png.base64.txt',
    },
    {
      src: 'src/assets/ayv-masculino-leve.png.base64-e094e.txt',
      dest: 'ayv-masculino-leve.png.base64.txt',
    },
    {
      src: 'src/assets/ayv-masculino-intermediario.png.base64-e638e.txt',
      dest: 'ayv-masculino-intermediario.png.base64.txt',
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

  // Ensure decoder exists in lote_0a_base64
  const userDecoderDest = path.join(targetDir, 'decode-ayurveda-assets.mjs')
  if (fs.existsSync(userDecoderDest)) {
    results.push({
      name: 'decode-ayurveda-assets.mjs',
      status: 'OK_DECODER',
      bytes: fs.statSync(userDecoderDest).size,
    })
  } else {
    results.push({
      name: 'decode-ayurveda-assets.mjs',
      status: 'FAIL_DECODER',
      error: 'não encontrado em lote_0a_base64',
    })
  }

  console.log(JSON.stringify(results, null, 2))
}

run()
