import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  const url =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_POCKETBASE_URL) ||
    process.env.VITE_POCKETBASE_URL ||
    process.env.POCKETBASE_URL ||
    ''

  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }

  return trimmed
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
