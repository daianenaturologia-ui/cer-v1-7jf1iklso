import fs from 'node:fs'
import path from 'node:path'

console.log('--- INSPECTING DIST DIRECTORY ---')
const distDir = path.resolve('dist')
const distExists = fs.existsSync(distDir)
console.log('dist exists:', distExists)

const result = {
  distExists,
  files: [],
  hasReleaseBtn: false,
  hasOldConsciencia: false,
  hasResumoEssencial: false,
}

if (distExists) {
  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const ent of entries) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        scan(full)
      } else {
        result.files.push(path.relative(distDir, full))
        if (ent.name.endsWith('.js') || ent.name.endsWith('.html')) {
          const content = fs.readFileSync(full, 'utf8')
          if (content.includes('Gerenciar liberação das experiências')) {
            result.hasReleaseBtn = true
            console.log(`[MATCH] "Gerenciar liberação das experiências" found in ${ent.name}`)
          }
          if (content.includes('Experiências da Consciência (Progressive Release)')) {
            result.hasOldConsciencia = true
            console.log(`[WARNING] "Experiências da Consciência (Progressive Release)" found in ${ent.name}`)
          }
          if (content.includes('Resumo essencial')) {
            result.hasResumoEssencial = true
            console.log(`[WARNING] "Resumo essencial" found in ${ent.name}`)
          }
        }
      }
    }
  }
  scan(distDir)
}

fs.writeFileSync('scripts/inspect-dist-result.json', JSON.stringify(result, null, 2), 'utf8')
console.log('Result written to scripts/inspect-dist-result.json:', JSON.stringify(result, null, 2))
