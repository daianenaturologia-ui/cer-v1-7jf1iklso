/**
 * COMPOSITOR ESTÉTICO DE AVATAR AYURVEDA — LOTE 0B1
 *
 * Características e Diretrizes Arquiteturais:
 * - Totalmente isolado: zero chamadas a PocketBase, sem persistência clínica.
 * - Não importa modelos, diagnósticos ou serviços de interpretação clínica Ayurveda.
 * - Determinístico: mesmos inputs produzem exatamente o mesmo resultado gráfico.
 * - Preserva proporções (1024x1536), iluminação, sombreamento, roupa branca e contornos.
 * - A cor é aplicada EXCLUSIVAMENTE sob as regiões delimitadas pela respectiva máscara alfa.
 * - Paletas oficiais estéticas definidas para pele (skin_01..skin_06) e cabelo (hair_black..hair_gray_white).
 */

export type AvatarPresentation = 'feminine' | 'masculine'
export type AvatarStructure = 'light_narrow' | 'intermediate' | 'broad_solid'

export type SkinToneId = 'skin_01' | 'skin_02' | 'skin_03' | 'skin_04' | 'skin_05' | 'skin_06'

export type HairColorId =
  | 'hair_black'
  | 'hair_dark_brown'
  | 'hair_light_brown'
  | 'hair_blonde'
  | 'hair_red'
  | 'hair_gray_white'

export interface ColorOption<T extends string> {
  id: T
  label: string
  hex: string
}

export const SKIN_TONES: ReadonlyArray<ColorOption<SkinToneId>> = [
  { id: 'skin_01', label: 'Pele 01 (Muito clara)', hex: '#F4CDA8' },
  { id: 'skin_02', label: 'Pele 02 (Clara)', hex: '#E5AC7B' },
  { id: 'skin_03', label: 'Pele 03 (Média clara)', hex: '#CA875B' },
  { id: 'skin_04', label: 'Pele 04 (Média escura)', hex: '#A96443' },
  { id: 'skin_05', label: 'Pele 05 (Escura)', hex: '#75412E' },
  { id: 'skin_06', label: 'Pele 06 (Muito escura)', hex: '#48291F' },
]

export const HAIR_COLORS: ReadonlyArray<ColorOption<HairColorId>> = [
  { id: 'hair_black', label: 'Preto', hex: '#211713' },
  { id: 'hair_dark_brown', label: 'Castanho escuro', hex: '#3A241A' },
  { id: 'hair_light_brown', label: 'Castanho claro', hex: '#735039' },
  { id: 'hair_blonde', label: 'Loiro', hex: '#C5A269' },
  { id: 'hair_red', label: 'Ruivo', hex: '#883F27' },
  { id: 'hair_gray_white', label: 'Grisalho / Branco', hex: '#AAA39B' },
]

export interface AvatarConfiguration {
  presentation: AvatarPresentation
  structure: AvatarStructure
  skinTone: SkinToneId
  hairColor: HairColorId
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfiguration = {
  presentation: 'feminine',
  structure: 'intermediate',
  skinTone: 'skin_02',
  hairColor: 'hair_dark_brown',
}

/**
 * Mapeamento determinístico dos arquivos de base e máscaras canônicas
 */
const STRUCTURE_FILE_KEYS: Record<AvatarStructure, string> = {
  light_narrow: 'leve',
  intermediate: 'intermediario',
  broad_solid: 'amplo',
}

const PRESENTATION_FILE_KEYS: Record<AvatarPresentation, string> = {
  feminine: 'feminino',
  masculine: 'masculino',
}

export interface AvatarAssetPaths {
  basePngUrl: string
  skinMaskUrl: string
  hairMaskUrl: string
}

export function getAvatarAssetPaths(
  presentation: AvatarPresentation,
  structure: AvatarStructure,
): AvatarAssetPaths {
  const pres = PRESENTATION_FILE_KEYS[presentation]
  const struc = STRUCTURE_FILE_KEYS[structure]
  const prefix = `/assets/ayurveda/ayv-${pres}-${struc}`

  return {
    basePngUrl: `${prefix}.png`,
    skinMaskUrl: `${prefix}-skin-mask.png`,
    hairMaskUrl: `${prefix}-hair-mask.png`,
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '').trim()
  const intVal = parseInt(cleanHex, 16)
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  }
}

/**
 * Aplica colorização estética em pixels ImageData preservando iluminação e contornos.
 *
 * Algoritmo de Tinta Luminosa Preservadora:
 * 1. Base grayscale luminance L = 0.299*R + 0.587*G + 0.114*B (0..1).
 * 2. Tinta normalizada T_r, T_g, T_b (0..1).
 * 3. Multiplicação tonal: color = T * L.
 * 4. Proteção de realces/contornos:
 *    - Se L > 0.8, interpola suavemente com branco para manter luz.
 *    - Se L < 0.2, mantém escuridão do traço/sombra.
 * 5. Fator de máscara: apenas pixels onde maskAlpha > 0 recebem a tinta, ponderados pelo alfa da máscara.
 */
export function blendTintOnImageData(
  targetImageData: ImageData,
  maskImageData: ImageData,
  tintHex: string,
): void {
  const { r: tr, g: tg, b: tb } = hexToRgb(tintHex)
  const normTr = tr / 255
  const normTg = tg / 255
  const normTb = tb / 255

  const data = targetImageData.data
  const maskData = maskImageData.data
  const len = data.length

  for (let i = 0; i < len; i += 4) {
    const maskAlpha = maskData[i + 3]
    if (maskAlpha === 0) continue

    const baseAlpha = data[i + 3]
    if (baseAlpha === 0) continue

    const baseR = data[i]
    const baseG = data[i + 1]
    const baseB = data[i + 2]

    // Luminância do pixel base (0 a 1)
    const lum = (0.299 * baseR + 0.587 * baseG + 0.114 * baseB) / 255

    // Tinta modulada pela luminância
    let blendedR: number
    let blendedG: number
    let blendedB: number

    if (lum < 0.5) {
      // Sombras preservadas: multiplicação pura
      blendedR = 2 * lum * normTr * 255
      blendedG = 2 * lum * normTg * 255
      blendedB = 2 * lum * normTb * 255
    } else {
      // Luzes preservadas: interpolação para brilho
      blendedR = (1 - 2 * (1 - lum) * (1 - normTr)) * 255
      blendedG = (1 - 2 * (1 - lum) * (1 - normTg)) * 255
      blendedB = (1 - 2 * (1 - lum) * (1 - normTb)) * 255
    }

    const maskWeight = maskAlpha / 255

    data[i] = Math.round(baseR * (1 - maskWeight) + blendedR * maskWeight)
    data[i + 1] = Math.round(baseG * (1 - maskWeight) + blendedG * maskWeight)
    data[i + 2] = Math.round(baseB * (1 - maskWeight) + blendedB * maskWeight)
    // Alpha permanece o do PNG base
  }
}

/**
 * Cache de ImageBitmap/HTMLImageElement em memória para performance do compositor
 */
const imageElementCache = new Map<string, HTMLImageElement>()

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageElementCache.get(url)
  if (cached && cached.complete) {
    return Promise.resolve(cached)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageElementCache.set(url, img)
      resolve(img)
    }
    img.onerror = (e) => reject(new Error(`Failed to load avatar image asset from ${url}: ${e}`))
    img.src = url
  })
}

/**
 * Compõe o avatar em um HTMLCanvasElement ou OffscreenCanvas
 */
export async function renderAvatarToCanvas(
  config: AvatarConfiguration,
  targetCanvas: HTMLCanvasElement,
): Promise<void> {
  const { presentation, structure, skinTone, hairColor } = config
  const paths = getAvatarAssetPaths(presentation, structure)

  const skinOption = SKIN_TONES.find((s) => s.id === skinTone) || SKIN_TONES[1]
  const hairOption = HAIR_COLORS.find((h) => h.id === hairColor) || HAIR_COLORS[1]

  const [baseImg, skinMaskImg, hairMaskImg] = await Promise.all([
    loadImage(paths.basePngUrl),
    loadImage(paths.skinMaskUrl),
    loadImage(paths.hairMaskUrl),
  ])

  const width = 1024
  const height = 1536

  targetCanvas.width = width
  targetCanvas.height = height

  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // 1. Desenha imagem base oficial Lote 0A
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(baseImg, 0, 0, width, height)

  const baseImageData = ctx.getImageData(0, 0, width, height)

  // 2. Extrai dados da máscara de pele
  const helperCanvas = document.createElement('canvas')
  helperCanvas.width = width
  helperCanvas.height = height
  const helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true })
  if (!helperCtx) throw new Error('Helper canvas context not available')

  helperCtx.clearRect(0, 0, width, height)
  helperCtx.drawImage(skinMaskImg, 0, 0, width, height)
  const skinMaskData = helperCtx.getImageData(0, 0, width, height)

  // Aplica cor de pele preservando relevo e sombras
  blendTintOnImageData(baseImageData, skinMaskData, skinOption.hex)

  // 3. Extrai dados da máscara de cabelo
  helperCtx.clearRect(0, 0, width, height)
  helperCtx.drawImage(hairMaskImg, 0, 0, width, height)
  const hairMaskData = helperCtx.getImageData(0, 0, width, height)

  // Aplica cor de cabelo preservando relevo e contorno
  blendTintOnImageData(baseImageData, hairMaskData, hairOption.hex)

  // 4. Grava de volta no canvas de destino
  ctx.putImageData(baseImageData, 0, 0)
}
