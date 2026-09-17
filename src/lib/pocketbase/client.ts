import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  const url =
    (typeof process !== 'undefined' && process.env?.VITE_POCKETBASE_URL) ||
    (typeof process !== 'undefined' && process.env?.POCKETBASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POCKETBASE_URL)

  if (!url) {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }

  return url
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
