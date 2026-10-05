// Reference-tested guard. Review target runtime and backup before installation.
migrate((app) => {
  const col = app.findCollectionByNameOrId('cer_practice_version_assets')
  const active = '@request.auth.id != "" && @request.auth.status = "active"'
  for (const operation of ['listRule', 'viewRule', 'createRule', 'updateRule']) {
    if (col[operation] !== null) col[operation] = `${active} && (${col[operation]})`
  }
  // Preserve protected files; reject accidental removal of the flag in this schema.
  if (!col.fields.getByName('file').protected) throw new Error('Expected protected asset file field')
  app.save(col)
}, () => {
  throw new Error('Rollback requires reviewed replacement; do not reopen suspended-account file access.')
})
