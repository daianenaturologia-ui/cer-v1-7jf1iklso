import fs from 'node:fs'
import path from 'node:path'

async function main() {
  const repo = 'daianenaturologia-ui/cer-v1-7jf1iklso'
  const pr = 73
  console.log(`Buscando arquivos do PR ${pr}...`)
  
  let allFiles = []
  let page = 1
  while (true) {
    const url = `https://api.github.com/repos/${repo}/pulls/${pr}/files?per_page=100&page=${page}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Erro ao buscar arquivos do PR: ${res.status} ${res.statusText}`)
    }
    const files = await res.json()
    if (!Array.isArray(files) || files.length === 0) {
      break
    }
    allFiles = allFiles.concat(files)
    if (files.length < 100) break
    page++
  }

  console.log(`Encontrados ${allFiles.length} arquivos no PR ${pr}.`)
  fs.writeFileSync('scripts/pr73-files.json', JSON.stringify(allFiles, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
