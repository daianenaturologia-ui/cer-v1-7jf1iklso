import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  const envUrl =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_POCKETBASE_URL) ||
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL))

  const clean = typeof envUrl === 'string' ? envUrl.trim() : ''

  if (!clean) {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }

  return clean
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
