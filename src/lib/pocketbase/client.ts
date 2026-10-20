import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  let url = ''
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_POCKETBASE_URL
  ) {
    url = import.meta.env.VITE_POCKETBASE_URL
  } else if (typeof process !== 'undefined' && process.env) {
    url = process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || ''
  }

  url = url.trim()
  if (!url) {
    throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
  }

  return url
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
