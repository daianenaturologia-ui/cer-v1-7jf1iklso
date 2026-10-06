// Offline inventory only: never connects to a live database or prints record data.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
const snapshot = JSON.parse(fs.readFileSync('src/lib/pocketbase/schema.json', 'utf8'))
const collections = snapshot.collections.map((c) => ({
  name: c.name,
  publicActions: Object.entries(c.apiRules || {})
    .filter(([, rule]) => rule === '')
    .map(([action]) => action),
  lockedActions: Object.entries(c.apiRules || {})
    .filter(([, rule]) => rule === null)
    .map(([action]) => action),
  hasScopedRule: Object.values(c.apiRules || {}).some(
    (rule) => typeof rule === 'string' && /enrollment|participant|respondent|author/.test(rule),
  ),
  protectedFileFields: (c.fields || [])
    .filter((f) => f.type === 'file' && f.protected === true)
    .map((f) => f.name),
}))
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n')
const potentialSecretFiles = []
for (const file of files) {
  if (!/\.(?:js|ts|tsx|json|ya?ml|env)$/.test(file) && !file.startsWith('.env')) continue
  const text = fs.readFileSync(file, 'utf8')
  // Heuristic only. Values never appear in the output; not a complete secret scanner.
  if (
    /\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bghp_[A-Za-z0-9]{36}\b/.test(
      text,
    )
  )
    potentialSecretFiles.push(file)
}
console.log(
  JSON.stringify(
    {
      scope: 'repository snapshot, no live guarantees',
      snapshotAt: snapshot.generatedAt,
      manualRuleOverrides: snapshot.manualRuleOverrides || null,
      collectionCount: collections.length,
      collections,
      potentialSecretFiles,
      notes: [
        'Locked does not mean inaccessible to administrators.',
        'hasScopedRule is a textual heuristic, not a RLS test.',
        'Protected files do not prove storage encryption.',
        'Review migrations after this snapshot separately.',
      ],
    },
    null,
    2,
  ),
)
