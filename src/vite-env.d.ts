/// <reference types="vite/client" />
/// <reference types="node" />

declare module '@/lib/pocketbase/client' {
  import type PocketBase from 'pocketbase'
  const pb: PocketBase
  export default pb
  export function getPocketBaseUrl(): string
}
