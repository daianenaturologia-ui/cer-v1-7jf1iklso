import PocketBase from 'pocketbase'

function getPocketBaseUrl(): string {
  let url: string | undefined

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    url = import.meta.env.VITE_POCKETBASE_URL
  }

  if (!url && typeof process !== 'undefined' && process.env) {
    url = process.env.VITE_POCKETBASE_URL
  }

  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }

  return url.trim()
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
