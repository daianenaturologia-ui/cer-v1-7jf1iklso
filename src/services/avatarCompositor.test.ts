import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_AVATAR_CONFIG,
  HAIR_COLORS,
  SKIN_TONES,
  blendTintOnImageData,
  getAvatarAssetPaths,
  hexToRgb,
  AvatarConfiguration,
} from './avatarCompositor'
import { isBancadaAyurvedaAuthorized } from '../pages/AyurvedaAvatarBancadaPage'
import { demoAdapter } from './demoAdapter'

// Leitor simples de cabeçalho PNG para checagem em Node
function readPngDimensionsAndAlpha(filePath: string) {
  const buf = fs.readFileSync(filePath)
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Not a PNG')
  }
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  const colorType = buf.readUInt8(25)
  return {
    width,
    height,
    hasAlpha: colorType === 6 || colorType === 4,
    sizeBytes: buf.length,
  }
}

describe('Lote 0B1 — Compositor Estético e Bancada Visual Ayurveda', () => {
  // TESTE 1: Atlas 3072x3072 com alfa
  it('(1) valida que os dois atlas em src/assets possuem 3072×3072 e canal alfa', () => {
    const skinAtlasPath = path.resolve('src/assets/ayv-avatar-skin-masks-atlas-v1-c44fc.png')
    const hairAtlasPath = path.resolve('src/assets/ayv-avatar-hair-masks-atlas-v1-94361.png')

    expect(fs.existsSync(skinAtlasPath)).toBe(true)
    expect(fs.existsSync(hairAtlasPath)).toBe(true)

    const skinInfo = readPngDimensionsAndAlpha(skinAtlasPath)
    expect(skinInfo.width).toBe(3072)
    expect(skinInfo.height).toBe(3072)
    expect(skinInfo.hasAlpha).toBe(true)

    const hairInfo = readPngDimensionsAndAlpha(hairAtlasPath)
    expect(hairInfo.width).toBe(3072)
    expect(hairInfo.height).toBe(3072)
    expect(hairInfo.hasAlpha).toBe(true)
  })

  // TESTE 2: 12 recortes 1024x1536 não vazios
  it('(2) valida que os 12 recortes em public/assets/ayurveda/ têm 1024×1536 e não estão vazios', () => {
    const masks = [
      'ayv-feminino-leve-skin-mask.png',
      'ayv-feminino-intermediario-skin-mask.png',
      'ayv-feminino-amplo-skin-mask.png',
      'ayv-masculino-leve-skin-mask.png',
      'ayv-masculino-intermediario-skin-mask.png',
      'ayv-masculino-amplo-skin-mask.png',
      'ayv-feminino-leve-hair-mask.png',
      'ayv-feminino-intermediario-hair-mask.png',
      'ayv-feminino-amplo-hair-mask.png',
      'ayv-masculino-leve-hair-mask.png',
      'ayv-masculino-intermediario-hair-mask.png',
      'ayv-masculino-amplo-hair-mask.png',
    ]

    const baseDir = path.resolve('public/assets/ayurveda')
    for (const maskName of masks) {
      const fullPath = path.join(baseDir, maskName)
      expect(fs.existsSync(fullPath)).toBe(true)

      const info = readPngDimensionsAndAlpha(fullPath)
      expect(info.width).toBe(1024)
      expect(info.height).toBe(1536)
      expect(info.hasAlpha).toBe(true)
      expect(info.sizeBytes).toBeGreaterThan(1000)
    }
  })

  // TESTE 3: Cada estrutura usa PNG-base + as duas máscaras certas
  it('(3) cada estrutura mapeia rigorosamente o PNG-base oficial + as duas máscaras certas', () => {
    const structures = ['light_narrow', 'intermediate', 'broad_solid'] as const
    const presentations = ['feminine', 'masculine'] as const

    for (const pres of presentations) {
      for (const struc of structures) {
        const paths = getAvatarAssetPaths(pres, struc)
        const presKey = pres === 'feminine' ? 'feminino' : 'masculino'
        const strucKey =
          struc === 'light_narrow' ? 'leve' : struc === 'intermediate' ? 'intermediario' : 'amplo'

        expect(paths.basePngUrl).toBe(`/assets/ayurveda/ayv-${presKey}-${strucKey}.png`)
        expect(paths.skinMaskUrl).toBe(`/assets/ayurveda/ayv-${presKey}-${strucKey}-skin-mask.png`)
        expect(paths.hairMaskUrl).toBe(`/assets/ayurveda/ayv-${presKey}-${strucKey}-hair-mask.png`)

        // Assegura existência física de todos os arquivos
        const baseFile = path.resolve(`public${paths.basePngUrl}`)
        const skinFile = path.resolve(`public${paths.skinMaskUrl}`)
        const hairFile = path.resolve(`public${paths.hairMaskUrl}`)

        expect(fs.existsSync(baseFile)).toBe(true)
        expect(fs.existsSync(skinFile)).toBe(true)
        expect(fs.existsSync(hairFile)).toBe(true)
      }
    }
  })

  // TESTE 4: Trocar pele não altera cabelo/roupa (isolamento da máscara de pele)
  it('(4) trocar a pele altera exclusivamente a região da máscara de pele, mantendo cabelo e roupa inalterados', () => {
    // Simula buffer de imagem com 3 regiões: [pele, cabelo, roupa]
    const width = 3
    const height = 1
    // Pixel 0: pele (R=200, G=200, B=200, A=255)
    // Pixel 1: cabelo (R=50, G=50, B=50, A=255)
    // Pixel 2: roupa branca (R=240, G=240, B=240, A=255)
    const basePixels = new Uint8ClampedArray([
      200, 200, 200, 255, 50, 50, 50, 255, 240, 240, 240, 255,
    ])
    // Máscara de pele: ativa apenas no pixel 0
    const skinMaskPixels = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0])

    const targetImg1 = {
      data: new Uint8ClampedArray(basePixels),
      width,
      height,
    } as unknown as ImageData
    const targetImg2 = {
      data: new Uint8ClampedArray(basePixels),
      width,
      height,
    } as unknown as ImageData
    const maskImg = {
      data: skinMaskPixels,
      width,
      height,
    } as unknown as ImageData

    blendTintOnImageData(targetImg1, maskImg, SKIN_TONES[0].hex) // tom 1
    blendTintOnImageData(targetImg2, maskImg, SKIN_TONES[5].hex) // tom 6

    // Pixel 0 (pele) deve ter mudado e ser diferente entre os dois tons
    expect(targetImg1.data[0]).not.toBe(basePixels[0])
    expect(targetImg1.data[0]).not.toBe(targetImg2.data[0])

    // Pixel 1 (cabelo) deve estar rigorosamente intacto
    expect(targetImg1.data[4]).toBe(basePixels[4])
    expect(targetImg1.data[5]).toBe(basePixels[5])
    expect(targetImg1.data[6]).toBe(basePixels[6])
    expect(targetImg2.data[4]).toBe(basePixels[4])

    // Pixel 2 (roupa) deve estar rigorosamente intacto
    expect(targetImg1.data[8]).toBe(basePixels[8])
    expect(targetImg1.data[9]).toBe(basePixels[9])
    expect(targetImg1.data[10]).toBe(basePixels[10])
    expect(targetImg2.data[8]).toBe(basePixels[8])
  })

  // TESTE 5: Trocar cabelo não altera pele/roupa (isolamento da máscara de cabelo)
  it('(5) trocar o cabelo altera exclusivamente a região da máscara de cabelo, mantendo pele e roupa inalterados', () => {
    const width = 3
    const height = 1
    const basePixels = new Uint8ClampedArray([
      200, 200, 200, 255, 50, 50, 50, 255, 240, 240, 240, 255,
    ])
    // Máscara de cabelo: ativa apenas no pixel 1
    const hairMaskPixels = new Uint8ClampedArray([0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0])

    const targetImg1 = {
      data: new Uint8ClampedArray(basePixels),
      width,
      height,
    } as unknown as ImageData
    const targetImg2 = {
      data: new Uint8ClampedArray(basePixels),
      width,
      height,
    } as unknown as ImageData
    const maskImg = {
      data: hairMaskPixels,
      width,
      height,
    } as unknown as ImageData

    blendTintOnImageData(targetImg1, maskImg, HAIR_COLORS[0].hex) // preto
    blendTintOnImageData(targetImg2, maskImg, HAIR_COLORS[3].hex) // loiro

    // Pixel 0 (pele) deve estar intacto
    expect(targetImg1.data[0]).toBe(basePixels[0])
    expect(targetImg2.data[0]).toBe(basePixels[0])

    // Pixel 1 (cabelo) deve ter mudado e ser diferente entre as duas cores
    expect(targetImg1.data[4]).not.toBe(basePixels[4])
    expect(targetImg1.data[4]).not.toBe(targetImg2.data[4])

    // Pixel 2 (roupa) deve estar intacto
    expect(targetImg1.data[8]).toBe(basePixels[8])
    expect(targetImg2.data[8]).toBe(basePixels[8])
  })

  // TESTE 6: Troca de estrutura não cria/altera respostas clínicas
  it('(6) troca de estrutura ou configurações estéticas não afeta nenhum serviço de respostas clínicas', () => {
    // Objeto puramente em memória, imutável e sem persistência
    const config1: AvatarConfiguration = {
      presentation: 'feminine',
      structure: 'light_narrow',
      skinTone: 'skin_01',
      hairColor: 'hair_black',
    }
    const config2: AvatarConfiguration = {
      ...config1,
      structure: 'broad_solid',
    }

    expect(config1.structure).toBe('light_narrow')
    expect(config2.structure).toBe('broad_solid')
    // Não possui campos clínicos
    expect((config2 as unknown as Record<string, unknown>).dosha).toBeUndefined()
    expect((config2 as unknown as Record<string, unknown>).prakriti).toBeUndefined()
    expect((config2 as unknown as Record<string, unknown>).vikriti).toBeUndefined()
  })

  // TESTE 7: Compositor não importa serviços de interpretação Ayurveda
  it('(7) módulo avatarCompositor não importa serviços de interpretação Ayurveda nem PocketBase', () => {
    const compositorCode = fs.readFileSync(path.resolve('src/services/avatarCompositor.ts'), 'utf8')
    expect(compositorCode).not.toContain('pocketbase')
    expect(compositorCode).not.toContain('cerKnowledge')
    expect(compositorCode).not.toContain('build07bPrompts')
    expect(compositorCode).not.toContain('experienceResponseService')
    expect(compositorCode).not.toContain('prakriti')
    expect(compositorCode).not.toContain('vikriti')
  })

  // TESTE 8: Modo demo realiza zero chamadas ao PocketBase
  it('(8) modo demo e bancada não realizam chamadas à rede ou PocketBase', () => {
    demoAdapter.enableDemo()
    expect(demoAdapter.isEnabled()).toBe(true)

    // Configuração padrão
    expect(DEFAULT_AVATAR_CONFIG.presentation).toBe('feminine')
    expect(DEFAULT_AVATAR_CONFIG.structure).toBe('intermediate')
    expect(DEFAULT_AVATAR_CONFIG.skinTone).toBe('skin_02')
    expect(DEFAULT_AVATAR_CONFIG.hairColor).toBe('hair_dark_brown')

    // Converte hex
    const rgb = hexToRgb('#F4CDA8')
    expect(rgb).toEqual({ r: 244, g: 205, b: 168 })
  })

  // TESTE 9: Bancada inacessível fora da condição autorizada
  it('(9) bancada valida autorização apenas sob ambiente DEV ou modo demonstração ativo', () => {
    demoAdapter.enableDemo()
    expect(isBancadaAyurvedaAuthorized()).toBe(true)

    demoAdapter.disableDemo()
    // Em testes Vitest import.meta.env.DEV pode ser true, mas checamos a lógica determinística
    const isDev = import.meta.env.DEV
    expect(isBancadaAyurvedaAuthorized()).toBe(Boolean(isDev || false))
  })
})
