import { createServer } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
const server = await createServer({ configFile: false, server: { middlewareMode: true }, resolve: { alias: { '@': path.resolve('src') } } })
const { catalog } = await server.ssrLoadModule('/scripts/questionnaire-catalog.ts')
await server.close()
const clean = records => records.map(({ created, updated, ...record }) => record)
const data = Object.fromEntries(Object.entries(catalog).map(([key, records]) => [key, clean(records)]))
const ids = data.prompts.map(p => p.id)
if (new Set(ids).size !== ids.length) throw new Error('Duplicate logical prompt IDs')
const template = fs.readFileSync('scripts/questionnaire-migration.template.txt', 'utf8')
fs.writeFileSync('pocketbase/migrations/0076_live_questionnaire_catalog.js', template.replace('/* CATALOG_DATA */', JSON.stringify(data)))
console.log(JSON.stringify({ experiences: data.experiences.length, moments: data.moments.length, prompts: data.prompts.length }))
