migrate(
  (app) => {
    // Migration 0058 (idempotente/no-op para resolver fila)
    const col = app.findCollectionByNameOrId('cer_practice_variant_steps')
    if (!col) {
      throw new Error('[0058] cer_practice_variant_steps não encontrada.')
    }
  },
  (app) => {
    // No-op down
  },
)
