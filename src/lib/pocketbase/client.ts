import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  const viteUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_POCKETBASE_URL
    : undefined
  const nodeUrl = typeof process !== 'undefined' ? process.env.VITE_POCKETBASE_URL : undefined
  const url = viteUrl || nodeUrl
  if (!url) {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }
  return url
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
