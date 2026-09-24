import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { AYURVEDA_LOTE_0A_MANIFEST } from './ayurvedaAssetsRegistry'
import { decodeAll } from '../../lote_0a_base64/decode-ayurveda-assets.mjs'
import { validateAssets } from '../../lote_0a_kit/validate-assets.mjs'

describe('Lote 0A — Decodificação e Validação dos 6 Assets Oficiais', () => {
  it('Etapa 0: Decodifica e valida os hashes e dimensões exatas de PRANCHA-PELE e PRANCHA-CABELO', () => {
    const peleTxtPath = path.resolve('src/assets/cer-ayv-prancha-pele.base64-39794.txt')
    const cabeloTxtPath = path.resolve('src/assets/cer-ayv-prancha-cabelo.base64-27c06.txt')

    expect(fs.existsSync(peleTxtPath)).toBe(true)
    expect(fs.existsSync(cabeloTxtPath)).toBe(true)

    const peleBase64 = fs.readFileSync(peleTxtPath, 'utf8').replace(/\s+/g, '')
    const peleBytes = Buffer.from(peleBase64, 'base64')
    const peleHash = createHash('sha256').update(peleBytes).digest('hex')
    const peleW = peleBytes.readUInt32BE(16)
    const peleH = peleBytes.readUInt32BE(20)

    expect(peleHash).toBe('64f6762d420b42738aa839f8ada2031aa057903a6e8aede4193db2152c14c846')
    expect(peleW).toBe(1068)
    expect(peleH).toBe(712)

    const cabeloBase64 = fs.readFileSync(cabeloTxtPath, 'utf8').replace(/\s+/g, '')
    const cabeloBytes = Buffer.from(cabeloBase64, 'base64')
    const cabeloHash = createHash('sha256').update(cabeloBytes).digest('hex')
    const cabeloW = cabeloBytes.readUInt32BE(16)
    const cabeloH = cabeloBytes.readUInt32BE(20)

    expect(cabeloHash).toBe('7efd93668baa639621e0adcbc8c38d9de57ff20031e057d45f402a1f2ddf6b18')
    expect(cabeloW).toBe(1068)
    expect(cabeloH).toBe(712)
  })

  it('registra os 12 cards clínicos recortados de pele e cabelo no manifesto', async () => {
    const { AYURVEDA_CLINICAL_CARDS_MANIFEST } = await import('./ayurvedaAssetsRegistry')
    expect(AYURVEDA_CLINICAL_CARDS_MANIFEST).toHaveLength(12)
    const skinCards = AYURVEDA_CLINICAL_CARDS_MANIFEST.filter((c) => c.category === 'skin')
    const hairCards = AYURVEDA_CLINICAL_CARDS_MANIFEST.filter((c) => c.category === 'hair')
    expect(skinCards).toHaveLength(6)
    expect(hairCards).toHaveLength(6)
    for (const c of AYURVEDA_CLINICAL_CARDS_MANIFEST) {
      expect(c.width).toBe(356)
      expect(c.height).toBe(356)
    }
  })

  it('registra o manifesto técnico com clinical_use desativado e personalização bloqueada', () => {
    expect(AYURVEDA_LOTE_0A_MANIFEST.manifest_version).toBe('1.0.0')
    expect(AYURVEDA_LOTE_0A_MANIFEST.clinical_use).toBe(false)
    expect(AYURVEDA_LOTE_0A_MANIFEST.next_stage_requirements.status).toBe(
      'blocked_until_assets_exist',
    )
    expect(AYURVEDA_LOTE_0A_MANIFEST.approved_files).toHaveLength(6)
  })

  it('lote_0a_kit/ contém asset-manifest.json e validate-assets.mjs intactos', () => {
    const kitManifest = path.resolve('lote_0a_kit/asset-manifest.json')
    const kitValidator = path.resolve('lote_0a_kit/validate-assets.mjs')

    expect(fs.existsSync(kitManifest)).toBe(true)
    expect(fs.existsSync(kitValidator)).toBe(true)

    const parsed = JSON.parse(fs.readFileSync(kitManifest, 'utf8'))
    expect(parsed.approved_files).toHaveLength(6)
  })

  it('decodifica todos os 6 assets base64 com SHA-256 idêntico e sem falhas', async () => {
    const decodeResults = await decodeAll()
    expect(decodeResults).toHaveLength(6)
    for (const res of decodeResults) {
      expect(res.status).toBe('PASS')
      expect(res.hash).toBeDefined()
    }
  })

  it('valida os 6 PNGs em lote_0a_kit/assets com hash, 1024x1536 e canal alfa RGBA', async () => {
    const validationResults = await validateAssets()
    expect(validationResults).toHaveLength(6)
    for (const res of validationResults) {
      expect(res.status).toBe('PASS')
    }
  })

  it('confirma que as cópias públicas em public/assets/ayurveda/ possuem SHA-256 idêntico aos originais', () => {
    const publicDir = path.resolve('public/assets/ayurveda')
    for (const asset of AYURVEDA_LOTE_0A_MANIFEST.approved_files) {
      const fileName = path.basename(asset.file)
      const publicFilePath = path.join(publicDir, fileName)
      expect(fs.existsSync(publicFilePath)).toBe(true)
      const bytes = fs.readFileSync(publicFilePath)
      const hash = createHash('sha256').update(bytes).digest('hex')
      expect(hash).toBe(asset.sha256)
    }
  })
})
