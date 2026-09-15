migrate(
  (app) => {
    // Migration 0057 (idempotente/no-op para resolver fila)
    // As tabelas cer_practice_variant_steps e cer_practice_step_professional_content
    // já foram criadas na migration 0049. Esta migração garante idempotência.
    const col = app.findCollectionByNameOrId('cer_practice_variant_steps')
    if (!col) {
      throw new Error('[0057] cer_practice_variant_steps não encontrada.')
    }
  },
  (app) => {
    // No-op down
  },
)
