import PocketBase from 'pocketbase'

const pocketbaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_POCKETBASE_URL) ||
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL))

if (!pocketbaseUrl || typeof pocketbaseUrl !== 'string' || !pocketbaseUrl.trim()) {
  throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
}

const pb = new PocketBase(pocketbaseUrl.trim())
pb.autoCancellation(false)

export default pb
