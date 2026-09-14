migrate(
  (app) => {
    // MIGRATION 0045: Estados Editoriais (in_review, approved) e Review Gate na coleção cer_practice_versions
    // Preservar draft, active, deprecated, retired.
    // Adicionar in_review e approved.
    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')
    const statusField = practiceVersionsCol.fields.getByName('status')
    if (statusField) {
      statusField.values = ['draft', 'in_review', 'approved', 'active', 'deprecated', 'retired']
      app.save(practiceVersionsCol)
    }
  },
  (app) => {
    // Rollback seguro: caso existam registros com in_review ou approved,
    // revertê-los de forma segura para 'draft' antes de estreitar o enum,
    // evitando corromper dados ou travar validações do PocketBase.
    try {
      app
        .db()
        .newQuery(
          "UPDATE cer_practice_versions SET status = 'draft' WHERE status IN ('in_review', 'approved')",
        )
        .execute()
    } catch (_) {}

    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')
    const statusField = practiceVersionsCol.fields.getByName('status')
    if (statusField) {
      statusField.values = ['draft', 'active', 'deprecated', 'retired']
      app.save(practiceVersionsCol)
    }
  },
)
