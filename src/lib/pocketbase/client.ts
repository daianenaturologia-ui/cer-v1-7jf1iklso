import PocketBase from 'pocketbase'

export function getPocketBaseUrl(): string {
  // 1) Vite / client environment (import.meta.env)
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_POCKETBASE_URL === 'string' &&
    import.meta.env.VITE_POCKETBASE_URL.trim() !== ''
  ) {
    return import.meta.env.VITE_POCKETBASE_URL.trim()
  }

  // 2) Node environment (executores CAD/PAV, scripts de bancada)
  if (
    typeof process !== 'undefined' &&
    process.env &&
    typeof process.env.VITE_POCKETBASE_URL === 'string' &&
    process.env.VITE_POCKETBASE_URL.trim() !== ''
  ) {
    return process.env.VITE_POCKETBASE_URL.trim()
  }

  // 3) Erro claro e explícito — SEM fallback silencioso para localhost/127.0.0.1
  throw new Error('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')
}

const pb = new PocketBase(getPocketBaseUrl())
pb.autoCancellation(false)

export default pb
