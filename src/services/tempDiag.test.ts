import { execSync } from 'node:child_process'
import { test } from 'vitest'

test('run diag', () => {
  const out = execSync('node scripts/diag_git.mjs', { encoding: 'utf8' })
  throw new Error(`\n--- DIAG OUTPUT ---\n${out}\n--- END DIAG OUTPUT ---`)
})
