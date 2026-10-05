// Apply only after isolated validation and target-runtime/backup review.
// Preserve existing care visibility while requiring an active account on every request.
migrate((app) => {
  const active = '@request.auth.id != "" && @request.auth.status = "active"'
  const unchanged = (field) => `(@request.body.${field}:isset = false || @request.body.${field} = ${field})`
  for (const name of ['cer_journal_entries', 'cer_journal_entry_versions', 'cer_next_session_messages', 'cer_sessions', 'cer_session_notes']) {
    const col = app.findCollectionByNameOrId(name)
    for (const operation of ['listRule', 'viewRule', 'createRule', 'updateRule']) {
      if (col[operation] !== null) col[operation] = `${active} && (${col[operation]})`
    }
    app.save(col)
  }
  const life = app.findCollectionByNameOrId('cer_life_events')
  const owner = 'enrollment_id.person_id = @request.auth.person_id'
  const professional = 'access_class = "participant_shared" && @collection.professional_enrollment_access:life_scope.enrollment_id ?= enrollment_id && @collection.professional_enrollment_access:life_scope.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:life_scope.is_active ?= true'
  life.listRule = `${active} && (${owner} || (${professional}))`
  life.viewRule = life.listRule
  life.createRule = `${active} && ${owner}`
  life.updateRule = `${active} && ${owner} && ${unchanged('enrollment_id')}`
  app.save(life)
}, () => {
  throw new Error('Rollback requires a reviewed replacement; do not reopen suspended-account access.')
})
