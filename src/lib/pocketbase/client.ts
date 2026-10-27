import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  const envUrl =
    (typeof process !== 'undefined' && process.env
      ? process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || ''
      : '') ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_POCKETBASE_URL || ''
      : '')

  const trimmed = envUrl.trim()

  if (!trimmed) {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }

  return trimmed
}

const pb = new PocketBase(getPocketBaseUrl())

pb.autoCancellation(false)

export default pb
