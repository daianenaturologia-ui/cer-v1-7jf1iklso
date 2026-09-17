import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_POCKETBASE_URL
      : undefined
  const fromNode =
    typeof process !== 'undefined' && process.env ? process.env.VITE_POCKETBASE_URL : undefined
  const url = (fromVite ?? fromNode ?? '').trim()
  if (!url) {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }
  return url
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
