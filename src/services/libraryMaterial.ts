export const MATERIAL_FORMATS = {
  text: 'Texto',
  pdf: 'PDF',
  audio: 'Áudio',
  video: 'Vídeo',
} as const
export type MaterialFormat = keyof typeof MATERIAL_FORMATS
export interface LibraryMaterial {
  format: MaterialFormat
  url: string
  author: string
  references: string
  conditions: string
}
export const EMPTY_MATERIAL: LibraryMaterial = {
  format: 'text',
  url: '',
  author: '',
  references: '',
  conditions: '',
}
export function materialUrl(value: string): string | null {
  try {
    if (
      !/^https:\/\//i.test(value) ||
      [...value].some(
        (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '\\',
      )
    )
      return null
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}
export function validateMaterial(
  value: unknown,
  published = false,
): asserts value is LibraryMaterial | undefined {
  if (value === undefined || value === null) return
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Confira o material.')
  const m = value as LibraryMaterial
  if (!Object.hasOwn(MATERIAL_FORMATS, m.format)) throw new Error('Escolha o formato do material.')
  for (const key of ['url', 'author', 'references', 'conditions'] as const)
    if (typeof m[key] !== 'string' || m[key].length > (key === 'url' ? 2000 : 3000))
      throw new Error('Confira os campos do material.')
  if (m.url && !materialUrl(m.url))
    throw new Error('Use um endereço HTTPS válido, sem credenciais.')
  if (published && m.format !== 'text' && !m.url.trim())
    throw new Error('Informe o endereço do PDF, áudio ou vídeo antes de publicar.')
}
export function filterLibrary<
  T extends { title: string; theme: string; lesson: string; material?: LibraryMaterial },
>(resources: T[], query: string, format = 'all', theme = 'all'): T[] {
  const normalize = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
  return resources.filter(
    (r) =>
      (format === 'all' || (r.material?.format || 'text') === format) &&
      (theme === 'all' || r.theme === theme) &&
      terms.every((term) => normalize(`${r.title} ${r.theme} ${r.lesson}`).includes(term)),
  )
}
