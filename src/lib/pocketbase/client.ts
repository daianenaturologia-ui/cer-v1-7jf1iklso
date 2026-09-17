import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// Temporary test runner
import { execSync } from 'node:child_process'
if (process.env.RUN_DIAGNOSTICS === 'true') {
  console.log('=== RUN_DIAGNOSTICS_OUTPUT_START ===')
  try {
    console.log(
      'LOG_CLIENT_COMMITS:',
      execSync('git log --format="%h %s" -n 10 -- src/lib/pocketbase/client.ts', {
        encoding: 'utf8',
      }).trim(),
    )
    console.log(
      'RECENT_COMMITS:',
      execSync('git log --format="%h %s" -n 10', { encoding: 'utf8' }).trim(),
    )
    console.log(
      'SHOW_E0E4803:\n',
      execSync('git show e0e4803:src/lib/pocketbase/client.ts', { encoding: 'utf8' }),
    )
    console.log(
      'SHOW_C9BDA99:\n',
      execSync('git show c9bda99:src/lib/pocketbase/client.ts', { encoding: 'utf8' }),
    )
    console.log(
      'SHOW_ORIGIN_MAIN:\n',
      execSync('git show origin/main:src/lib/pocketbase/client.ts', { encoding: 'utf8' }),
    )
  } catch (err) {
    console.log('DIAG_ERROR:', err.message)
  }
  console.log('=== RUN_DIAGNOSTICS_OUTPUT_END ===')
}
