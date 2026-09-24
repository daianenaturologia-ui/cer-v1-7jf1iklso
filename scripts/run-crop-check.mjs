import { cropClinicalBoards, cropAllAtlases } from './scripts/crop-atlases.mjs'

console.log('--- Executando recorte das pranchas clínicas ---')
const clinicalResults = cropClinicalBoards()
console.log('Resultados clínicos:', clinicalResults.length)
for (const r of clinicalResults) {
  console.log(`- ${r.fileName}: ${r.width}x${r.height}, ${r.bytes} bytes, sha256: ${r.sha256}`)
}

console.log('--- Executando cropAllAtlases ---')
const allResults = cropAllAtlases()
console.log('Total de resultados de máscaras:', allResults.length)
