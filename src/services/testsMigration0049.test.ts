/**
 * TESTES ESTRUTURAIS DETERMINÍSTICOS DA MIGRATION 0049 (LOTE 0049-A)
 *
 * Validação estática por bloco e collection do contrato de schema, regras de segurança RLS (fail-closed),
 * branch profissional e branch admin, índices únicos, autorreferência supersedes_id e invariantes constitucionais.
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

  it('1. Arquivo de migration 0049 existe e é sintaticamente válido no formato PocketBase goja', () => {
    expect(fs.existsSync(migrationPath)).toBe(true)
    expect(migrationContent.length).toBeGreaterThan(100)
    // Deve começar com migrate((app) => {
    expect(migrationContent).toMatch(/^migrate\(\s*\(app\)\s*=>/)
    // Não pode conter import ou export ES modules no corpo da migration
    expect(migrationContent).not.toMatch(/^\s*import\s/m)
    expect(migrationContent).not.toMatch(/^\s*export\s/m)
  })

  it('2. Preserva integridade e zero referência a anti-patterns ($app.store, superseded_by_id, client-flags)', () => {
    expect(migrationContent).not.toContain('$app.store')
    expect(migrationContent).not.toContain('superseded_by_id')
    expect(migrationContent).toContain('supersedes_id')
  })

  it('3. Coleção cer_practice_variant_steps possui rules estruturais corretas e imutabilidade de escrita', () => {
    // Isolamento do bloco de criação de cer_practice_variant_steps
    const variantBlockMatch = migrationContent.match(
      /const variantStepsCol = new Collection\(\{([\s\S]*?)\}\)\s*app\.save\(variantStepsCol\)/,
    )
    expect(variantBlockMatch).not.toBeNull()
    const variantBlock = variantBlockMatch![1]

    expect(variantBlock).toContain("name: 'cer_practice_variant_steps'")
    expect(variantBlock).toMatch(/createRule:\s*null/)
    expect(variantBlock).toMatch(/updateRule:\s*null/)
    expect(variantBlock).toMatch(/deleteRule:\s*null/)
    expect(variantBlock).toContain(
      "listRule: \"@request.auth.id != '' && record_status = 'current'\"",
    )
    expect(variantBlock).toContain(
      "viewRule: \"@request.auth.id != '' && record_status = 'current'\"",
    )
  })

  it('4. Coleção cer_practice_step_professional_content possui CRUD mutável nulo e regras list/view com branch profissional E admin', () => {
    // Isolamento do bloco de criação de cer_practice_step_professional_content
    const profBlockMatch = migrationContent.match(
      /const stepProfContentCol = new Collection\(\{([\s\S]*?)\}\)\s*app\.save\(stepProfContentCol\)/,
    )
    expect(profBlockMatch).not.toBeNull()
    const profBlock = profBlockMatch![1]

    expect(profBlock).toContain("name: 'cer_practice_step_professional_content'")
    expect(profBlock).toMatch(/createRule:\s*null/)
    expect(profBlock).toMatch(/updateRule:\s*null/)
    expect(profBlock).toMatch(/deleteRule:\s*null/)

    // Deve conter branch de profissional ativo
    expect(profBlock).toContain("@request.auth.user_roles_via_user_id.role ?= 'profissional'")
    // Deve conter branch de admin ativo
    expect(profBlock).toContain("@request.auth.user_roles_via_user_id.role ?= 'admin'")
    // Ambos exigem is_active
    expect(profBlock).toContain('@request.auth.user_roles_via_user_id.is_active ?= true')
    // Exige autenticação e record_status current
    expect(profBlock).toContain("@request.auth.id != ''")
    expect(profBlock).toContain("record_status = 'current'")
  })

  it('5. Chaves calculadas possuem índices UNIQUE explícitos na migration', () => {
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

  it('6. Campos em cer_practice_steps cobrem semantic_role (exatamente 10 valores), min e max duration (0..7200)', () => {
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

    // Isolamento do bloco de semantic_role
    const semanticRoleMatch = migrationContent.match(
      /new SelectField\(\{[\s\S]*?name:\s*'semantic_role'[\s\S]*?values:\s*\[([\s\S]*?)\][\s\S]*?maxSelect:\s*1/,
    )
    expect(semanticRoleMatch).not.toBeNull()
    const valuesText = semanticRoleMatch![1]
    const extractedRoles = valuesText
      .split(',')
      .map((s) => s.replace(/['"\s]/g, ''))
      .filter(Boolean)

    expect(extractedRoles).toHaveLength(10)
    for (const role of requiredSemanticRoles) {
      expect(extractedRoles).toContain(role)
    }

    // duration_min_seconds e duration_max_seconds (0..7200)
    expect(migrationContent).toMatch(
      /name:\s*'duration_min_seconds'[\s\S]*?min:\s*0[\s\S]*?max:\s*7200/,
    )
    expect(migrationContent).toMatch(
      /name:\s*'duration_max_seconds'[\s\S]*?min:\s*0[\s\S]*?max:\s*7200/,
    )
  })

  it('7. Campo is_default adicionado a cer_practice_variants como bool opcional', () => {
    expect(migrationContent).toContain("name: 'is_default'")
    expect(migrationContent).toContain('new BoolField')
    expect(migrationContent).toMatch(/name:\s*'is_default'[\s\S]*?required:\s*false/)
  })

  it('8. Down-migration é rigorosamente fail-closed: verificações antes de remoções, sem catch engolidor', () => {
    const downFunctionMatch = migrationContent.match(/\(app\)\s*=>\s*\{([\s\S]*)$/)
    expect(downFunctionMatch).not.toBeNull()
    const downContent = downFunctionMatch![1]

    // Não deve conter nenhum catch vazio catch { /* intentionally ignored */ } ou catch { /* intentionally ignored */ } que engula sem lançar
    expect(downContent).not.toMatch(/catch\s*\([^)]*\)\s*\{\s*\}/)

    // Qualquer catch deve relançar erro
    const catches = downContent.match(/catch\s*\(([^)]+)\)\s*\{([\s\S]*?)\}/g) || []
    for (const c of catches) {
      expect(c).toMatch(/throw\s+/)
    }

    // Deve checar dados antes de chamar app.delete
    const firstCheckIndex = downContent.indexOf('countRecords')
    const firstDeleteIndex = downContent.indexOf('app.delete')
    expect(firstCheckIndex).toBeGreaterThan(-1)
    expect(firstDeleteIndex).toBeGreaterThan(-1)
    expect(firstCheckIndex).toBeLessThan(firstDeleteIndex)

    // Aborta se cer_practice_variant_steps contiver registros
    expect(downContent).toContain('countVs > 0')
    // Aborta se cer_practice_step_professional_content contiver registros
    expect(downContent).toContain('countSpc > 0')
    // Aborta se cer_practice_steps tiver campos novos preenchidos
    expect(downContent).toContain('countStepFieldsWithData > 0')
    // Aborta se cer_practice_variants tiver is_default=true
    expect(downContent).toContain('countVariantFieldsWithData > 0')

    // Não remove audit_events
    expect(downContent).not.toContain('audit_events')
  })

  it('9. Ausência de Seed, inserts clínicos, rotas HTTP e hooks no arquivo da migration 0049', () => {
    expect(migrationContent).not.toContain('routerAdd')
    expect(migrationContent).not.toContain('onRecord')
    expect(migrationContent).not.toContain('cronAdd')
    expect(migrationContent).not.toContain('new Record')
    expect(migrationContent).not.toContain('INSERT INTO')
  })

  it('10. Migrations 0047 e 0048 permanecem inalteradas e não são referenciadas para alteração', () => {
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

    // 0049 não tenta alterar 0047 ou 0048
    expect(migrationContent).not.toContain('0047')
    expect(migrationContent).not.toContain('0048')
  })
})
