import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_POCKETBASE_URL === 'string' &&
    import.meta.env.VITE_POCKETBASE_URL.trim() !== ''
  ) {
    return import.meta.env.VITE_POCKETBASE_URL.trim()
  }

  if (
    typeof process !== 'undefined' &&
    process.env &&
    typeof process.env.VITE_POCKETBASE_URL === 'string' &&
    process.env.VITE_POCKETBASE_URL.trim() !== ''
  ) {
    return process.env.VITE_POCKETBASE_URL.trim()
  }

  throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
