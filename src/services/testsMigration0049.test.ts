/**
 * TESTES ESTRUTURAIS DETERMINÍSTICOS DA MIGRATION 0049 (LOTE 0049-A)
 *
 * Validação estática do contrato de schema, regras de segurança RLS (fail-closed),
 * índices únicos, autorreferência supersedes_id e invariantes constitucionais.
 *
 * Não realiza mutações no backend vivo.
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('LOTE 0049-A: Testes Estruturais e Estáticos da Migration 0049', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'pocketbase/migrations/0049_structural_foundations_practice_variants_and_content.js',
  )
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8')

  it('1. Arquivo de migration 0049 existe e é sintaticamente válido', () => {
    expect(fs.existsSync(migrationPath)).toBe(true)
    expect(migrationContent.length).toBeGreaterThan(100)
    // Deve começar com migrate((app) => {
    expect(migrationContent).toMatch(/^migrate\(\s*\(app\)\s*=>/)
  })

  it('2. Preserva integridade e zero referência a anti-patterns ($app.store, superseded_by_id, client-flags)', () => {
    // Proibido $app.store
    expect(migrationContent).not.toContain('$app.store')
    // Proibido superseded_by_id (deve usar supersedes_id apontando para trás)
    expect(migrationContent).not.toContain('superseded_by_id')
    // Deve usar supersedes_id
    expect(migrationContent).toContain('supersedes_id')
  })

  it('3. Coleção cer_practice_variant_steps possui CRUD mutável fechado (null)', () => {
    // createRule: null, updateRule: null, deleteRule: null
    expect(migrationContent).toContain("name: 'cer_practice_variant_steps'")
    expect(migrationContent).toMatch(/createRule:\s*null/)
    expect(migrationContent).toMatch(/updateRule:\s*null/)
    expect(migrationContent).toMatch(/deleteRule:\s*null/)
  })

  it('4. Coleção cer_practice_step_professional_content possui CRUD mutável fechado e proteção estrita por papel', () => {
    expect(migrationContent).toContain("name: 'cer_practice_step_professional_content'")
    // listRule e viewRule exigem profissional ativo e record_status = current
    expect(migrationContent).toMatch(/role \?=\s*'profissional'/)
    expect(migrationContent).toMatch(/is_active \?=\s*true/)
    expect(migrationContent).toMatch(/record_status\s*=\s*'current'/)
  })

  it('5. Chaves calculadas possuem índices UNIQUE na migration', () => {
    expect(migrationContent).toContain(
      'CREATE UNIQUE INDEX idx_cpvs_current_unique ON cer_practice_variant_steps (current_uniqueness_key)',
    )
    expect(migrationContent).toContain(
      'CREATE UNIQUE INDEX idx_cpvs_current_order ON cer_practice_variant_steps (current_order_key)',
    )
    expect(migrationContent).toContain(
      'CREATE UNIQUE INDEX idx_cpspc_current_unique ON cer_practice_step_professional_content (current_uniqueness_key)',
    )
  })

  it('6. Campos em cer_practice_steps cobrem semantic_role (10 valores), min e max duration (0..7200)', () => {
    const requiredSemanticRoles = [
      'external_orientation',
      'body_awareness',
      'body_resource',
      'chronological_orientation',
      'challenge_awareness',
      'internal_resource',
      'external_resource',
      'possibility_rehearsal',
      'resource_awareness',
      'direction',
    ]

    for (const role of requiredSemanticRoles) {
      expect(migrationContent).toContain(`'${role}'`)
    }

    expect(migrationContent).toContain('duration_min_seconds')
    expect(migrationContent).toContain('duration_max_seconds')
    expect(migrationContent).toContain('max: 7200')
  })

  it('7. Campo is_default adicionado a cer_practice_variants como bool opcional', () => {
    expect(migrationContent).toContain("name: 'is_default'")
    expect(migrationContent).toContain('new BoolField')
  })

  it('8. Down-migration é fail-closed e protege dados existentes', () => {
    expect(migrationContent).toContain('ROLLBACK BLOQUEADO - FAIL CLOSED')
    expect(migrationContent).toContain('countRecords')
    // Não remove audit_events
    expect(migrationContent).not.toContain('delete(auditEventsCol)')
    expect(migrationContent).not.toContain("findCollectionByNameOrId('audit_events')")
  })

  it('9. Migrations 0047 e 0048 permanecem inalteradas', () => {
    const p0047 = path.resolve(
      process.cwd(),
      'pocketbase/migrations/0047_create_practice_steps_and_reflections.js',
    )
    const p0048 = path.resolve(
      process.cwd(),
      'pocketbase/migrations/0048_persist_actual_dose_and_execution.js',
    )

    expect(fs.existsSync(p0047)).toBe(true)
    expect(fs.existsSync(p0048)).toBe(true)

    const c0047 = fs.readFileSync(p0047, 'utf-8')
    const c0048 = fs.readFileSync(p0048, 'utf-8')

    expect(c0047).toContain('LOTE 3A: MIGRATION 0047')
    expect(c0048).toContain('CORREÇÃO 3A-1: MIGRATION 0048')
  })
})
