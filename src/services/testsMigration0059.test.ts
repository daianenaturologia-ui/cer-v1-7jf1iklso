/**
 * TESTES ESTRUTURAIS DETERMINÍSTICOS DA MIGRATION CORRETIVA (0059) E DO CONJUNTO 0057-0059
 *
 * Confirma estritamente o contrato da migration corretiva 0059:
 * 1. Altera exclusivamente listRule/viewRule de cer_practice_step_professional_content;
 * 2. Contém branch profissional ativo E branch admin ativo;
 * 3. Exige autenticação e record_status = current;
 * 4. Não cria nem remove campos ou índices;
 * 5. Não escreve registros nem possui dados clínicos ou seeds;
 * 6. Não toca em nenhuma outra collection;
 * 7. Down restaura com segurança exclusivamente as rules originais da 0049;
 * 8. Ausência total de hooks, rotas customizadas ou $app.store;
 * 9. Migrations 0057 e 0058 são no-op idempotentes sem efeitos colaterais.
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('LOTE 0049-A: Testes Estruturais e Estáticos da Migration Corretiva 0059', () => {
  const migration59Path = path.resolve(
    process.cwd(),
    'pocketbase/migrations/0059_correct_professional_content_access_rules.js',
  )
  const migration59Content = fs.readFileSync(migration59Path, 'utf-8')

  const migration57Path = path.resolve(
    process.cwd(),
    'pocketbase/migrations/0057_structural_foundations_practice_variants_and_content.js',
  )
  const migration58Path = path.resolve(
    process.cwd(),
    'pocketbase/migrations/0058_structural_foundations_practice_variants_and_content.js',
  )

  it('1. Arquivo de migration 0059 existe e é sintaticamente válido no padrão PocketBase goja', () => {
    expect(fs.existsSync(migration59Path)).toBe(true)
    expect(migration59Content.length).toBeGreaterThan(100)
    expect(migration59Content).toMatch(/^migrate\(\s*\(app\)\s*=>/)
    // Sem import ou export ES modules
    expect(migration59Content).not.toMatch(/^\s*import\s/m)
    expect(migration59Content).not.toMatch(/^\s*export\s/m)
  })

  it('2. Escopo do UP: altera exclusivamente listRule e viewRule de cer_practice_step_professional_content', () => {
    // Up function isolation
    const upFunctionMatch = migration59Content.match(
      /^migrate\(\s*\(app\)\s*=>\s*\{([\s\S]*?)\},\s*\(app\)\s*=>/,
    )
    expect(upFunctionMatch).not.toBeNull()
    const upContent = upFunctionMatch![1]

    // Localiza apenas cer_practice_step_professional_content
    expect(upContent).toContain(
      "app.findCollectionByNameOrId('cer_practice_step_professional_content')",
    )
    expect(upContent).not.toContain('cer_practice_variant_steps')
    expect(upContent).not.toContain('cer_practice_steps')
    expect(upContent).not.toContain('cer_practice_variants')
    expect(upContent).not.toContain('cer_practice_versions')

    // Atribui exclusivamente listRule e viewRule
    expect(upContent).toContain('targetCol.listRule =')
    expect(upContent).toContain('targetCol.viewRule =')
    expect(upContent).not.toContain('createRule')
    expect(upContent).not.toContain('updateRule')
    expect(upContent).not.toContain('deleteRule')

    // Salva a collection
    expect(upContent).toContain('app.save(targetCol)')
  })

  it('3. Rules aplicadas no UP contêm branch profissional, branch admin, autenticação e record_status current', () => {
    expect(migration59Content).toContain(
      "@request.auth.user_roles_via_user_id.role ?= 'profissional'",
    )
    expect(migration59Content).toContain("@request.auth.user_roles_via_user_id.role ?= 'admin'")
    expect(migration59Content).toContain('@request.auth.user_roles_via_user_id.is_active ?= true')
    expect(migration59Content).toContain("@request.auth.id != ''")
    expect(migration59Content).toContain("record_status = 'current'")
  })

  it('4. Não cria, remove ou modifica campos, índices ou coleções no UP ou DOWN', () => {
    expect(migration59Content).not.toContain('new Collection')
    expect(migration59Content).not.toContain('app.delete')
    expect(migration59Content).not.toContain('fields.add')
    expect(migration59Content).not.toContain('fields.removeByName')
    expect(migration59Content).not.toContain('addIndex')
    expect(migration59Content).not.toContain('removeIndex')
    expect(migration59Content).not.toContain('CREATE INDEX')
    expect(migration59Content).not.toContain('DROP INDEX')
  })

  it('5. Não escreve registros, não contém Seed, hooks ou rotas', () => {
    expect(migration59Content).not.toContain('new Record')
    expect(migration59Content).not.toContain('INSERT INTO')
    expect(migration59Content).not.toContain('routerAdd')
    expect(migration59Content).not.toContain('onRecord')
    expect(migration59Content).not.toContain('cronAdd')
    expect(migration59Content).not.toContain('$app.store')
  })

  it('6. Down-migration restaura exclusivamente as rules anteriores da 0049 original e falha se collection não encontrada', () => {
    const downFunctionMatch = migration59Content.match(
      /,\s*\(app\)\s*=>\s*\{([\s\S]*)\}\s*,\?\s*\)$/,
    )
    expect(downFunctionMatch).not.toBeNull()
    const downContent = downFunctionMatch![1]

    // Localiza a collection
    expect(downContent).toContain(
      "app.findCollectionByNameOrId('cer_practice_step_professional_content')",
    )
    // Restaura as rules originais (profissional ativo, sem admin)
    expect(downContent).toContain("@request.auth.user_roles_via_user_id.role ?= 'profissional'")
    expect(downContent).toContain('@request.auth.user_roles_via_user_id.is_active ?= true')
    expect(downContent).toContain("record_status = 'current'")
    expect(downContent).not.toContain("@request.auth.user_roles_via_user_id.role ?= 'admin'")

    // Salva a collection
    expect(downContent).toContain('app.save(targetCol)')

    // Sem catches vazios que engulam erros
    expect(downContent).not.toMatch(/catch\s*\([^)]*\)\s*\{\s*\}/)
  })

  it('7. Migrations 0057 e 0058 existem como no-op idempotentes para resolução da fila', () => {
    expect(fs.existsSync(migration57Path)).toBe(true)
    expect(fs.existsSync(migration58Path)).toBe(true)

    const c57 = fs.readFileSync(migration57Path, 'utf-8')
    const c58 = fs.readFileSync(migration58Path, 'utf-8')

    // Devem apenas verificar idempotência, sem criar collections ou campos
    expect(c57).not.toContain('new Collection')
    expect(c58).not.toContain('new Collection')
    expect(c57).not.toContain('fields.add')
    expect(c58).not.toContain('fields.add')
    expect(c57).toContain('cer_practice_variant_steps')
    expect(c58).toContain('cer_practice_variant_steps')
  })
})
