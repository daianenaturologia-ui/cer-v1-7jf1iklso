import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  let url = ''
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    url =
      (import.meta.env.VITE_POCKETBASE_URL as string | undefined) ||
      (import.meta.env.VITE_PUBLIC_POCKETBASE_URL as string | undefined) ||
      (import.meta.env.POCKETBASE_URL as string | undefined) ||
      ''
  } else if (typeof process !== 'undefined' && process.env) {
    url =
      process.env.VITE_POCKETBASE_URL ||
      process.env.VITE_PUBLIC_POCKETBASE_URL ||
      process.env.POCKETBASE_URL ||
      ''
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
