import PocketBase from 'pocketbase'
import { assertSafeMutableTestEnvironment } from './safeMutableGate.ts'

/** Account exists only in the temporary CI migration, never in app migrations. */
export async function disposableRoleAdmin(baseUrl: string): Promise<PocketBase> {
  assertSafeMutableTestEnvironment(baseUrl)
  const client = new PocketBase(baseUrl)
  client.autoCancellation(false)
  await client
    .collection('users')
    .authWithPassword('role-admin@example.invalid', 'FixtureRoleAdmin123!')
  return client
}
