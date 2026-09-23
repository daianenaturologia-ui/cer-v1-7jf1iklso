import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceRoot = dirname(fileURLToPath(import.meta.url))
const outputRoot = resolve(sourceRoot, '..', 'lote_0a_kit', 'assets')

const assets = [
  ['ayv-feminino-leve.png', '71437dc59de47c72f744d48a17a48f49ffee4170f6a493df1ca7fe35c6650764'],
  [
    'ayv-feminino-intermediario.png',
    '110965b4e0e11f69a8307ef8248198f749f5c17a005d67875b9b81188aa6f4b0',
  ],
  ['ayv-feminino-amplo.png', '8d03f68fbe207bdb3952dc96a1fc0cdaa60543ed9248a9e4feb82e530c0f11a9'],
  ['ayv-masculino-leve.png', 'a8f2c5f243e650d366c194949af33193fdcf7e7e7adf738c5c97f1e1807061a3'],
  [
    'ayv-masculino-intermediario.png',
    '473387ed22b0003c7e60f965df0f7fcc935ac7cd73dc67e9d3dcdf82cbb139c6',
  ],
  ['ayv-masculino-amplo.png', '2603ea666e8e0148d057eb481a9c12f2bd7ef64586482ff50b03f810253773ea'],
]

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export async function decodeAll() {
  await mkdir(outputRoot, { recursive: true })

  const results = []
  let failed = false

  for (const [fileName, expectedHash] of assets) {
    try {
      const encodedPath = resolve(sourceRoot, `${fileName}.base64.txt`)
      const encoded = (await readFile(encodedPath, 'utf8')).replace(/\s+/g, '')

      if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
        throw new Error('conteúdo Base64 inválido')
      }

      const bytes = Buffer.from(encoded, 'base64')
      const actualHash = sha256(bytes)

      if (actualHash !== expectedHash) {
        throw new Error(`hash divergente: ${actualHash}`)
      }

      const outputPath = resolve(outputRoot, fileName)
      try {
        await stat(outputPath)
        const existing = await readFile(outputPath)
        if (sha256(existing) !== expectedHash) {
          throw new Error('arquivo de destino existente possui bytes diferentes')
        }
        results.push({
          file: fileName,
          status: 'PASS',
          detail: 'já existia e é idêntico',
          hash: actualHash,
        })
        continue
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }

      await writeFile(outputPath, bytes, { flag: 'wx' })
      results.push({
        file: fileName,
        status: 'PASS',
        detail: 'reconstruído e hash confirmado',
        hash: actualHash,
      })
    } catch (error) {
      failed = true
      results.push({ file: fileName, status: 'FAIL', detail: error.message, hash: null })
    }
  }

  console.table(results)
  console.log(`\nDestino: ${outputRoot}`)
  if (failed) {
    process.exitCode = 1
    throw new Error('Falha na decodificação de um ou mais assets')
  }
  return results
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await decodeAll()
}
