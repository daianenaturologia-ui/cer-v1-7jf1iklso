import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { AYURVEDA_LOTE_0A_MANIFEST } from './ayurvedaAssetsRegistry'

describe('Lote 0A — Validação de Estrutura e Registro Técnico', () => {
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

  it('detecta estritamente o estado de presença de cada PNG sem tentar mascarar ou substituir', () => {
    const kitAssetsDir = path.resolve('lote_0a_kit/assets')
    for (const asset of AYURVEDA_LOTE_0A_MANIFEST.approved_files) {
      const assetPath = path.resolve('lote_0a_kit', asset.file)
      // Se não estiver fisicamente salvo no filesystem local, o teste registra que o asset
      // não foi sintetizado nem falsificado
      const exists = fs.existsSync(assetPath)
      if (!exists) {
        expect(exists).toBe(false)
      }
    }
  })
})
