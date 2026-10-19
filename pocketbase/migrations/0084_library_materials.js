// Optional metadata and incomplete editorial drafts; published content remains gated by hooks.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cer_development_resources')
    col.fields.add(new JSONField({ name: 'material', maxSize: 16000 }))
    col.fields.getByName('lesson').required = false
    col.fields.getByName('instructions').required = false
    // Preserve the intended author/owner scope with syntax supported by both reference engines.
    col.updateRule = col.updateRule.replace(
      '@request.body.author_user_id:changed = false',
      '(@request.body.author_user_id:isset = false || @request.body.author_user_id = author_user_id)',
    )
    app.save(col)
    const experiments = app.findCollectionByNameOrId('cer_development_experiments')
    experiments.updateRule = experiments.updateRule.replace(
      '@request.body.enrollment_id:changed = false',
      '(@request.body.enrollment_id:isset = false || @request.body.enrollment_id = enrollment_id)',
    )
    app.save(experiments)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cer_development_resources')
    // Keep incomplete drafts intact rather than silently deleting or rewriting them on rollback.
    const incomplete = app.findRecordsByFilter(
      col.id,
      "lesson = '' || instructions = null",
      '',
      1,
      0,
    )
    if (incomplete.length) throw new Error('Complete os rascunhos antes de reverter esta migração.')
    col.fields.removeByName('material')
    col.fields.getByName('lesson').required = true
    col.fields.getByName('instructions').required = true
    app.save(col)
  },
)
