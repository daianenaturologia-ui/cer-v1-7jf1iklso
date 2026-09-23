import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { AYURVEDA_LOTE_0A_MANIFEST } from './ayurvedaAssetsRegistry'
import { decodeAll } from '../../lote_0a_base64/decode-ayurveda-assets.mjs'
import { validateAssets } from '../../lote_0a_kit/validate-assets.mjs'

describe('Lote 0A — Decodificação e Validação dos 6 Assets Oficiais', () => {
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
})
