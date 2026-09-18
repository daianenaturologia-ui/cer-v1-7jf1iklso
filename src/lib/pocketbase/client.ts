import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  let url = ''

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    url = (import.meta.env.VITE_POCKETBASE_URL as string) || ''
  }

  if (!url && typeof process !== 'undefined' && process.env) {
    url =
      (process.env.VITE_POCKETBASE_URL as string) || (process.env.POCKETBASE_URL as string) || ''
  }

  const trimmed = url.trim()
  if (!trimmed) {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }

  return trimmed
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
