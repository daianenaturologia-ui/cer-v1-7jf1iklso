import fs from 'node:fs'

const buf = fs.readFileSync('src/assets/ser-integral-cer-4eb44.png')
console.log('Size:', buf.length)
