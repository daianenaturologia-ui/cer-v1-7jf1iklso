migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cer_life_directions')
    if (!collection.fields.getByName('archived'))
      collection.fields.add(new BoolField({ name: 'archived' }))
    const oldGuard = '@request.body.enrollment_id:changed = false'
    const compatibleGuard =
      '(@request.body.enrollment_id:isset = false || @request.body.enrollment_id = enrollment_id)'
    if (collection.updateRule && collection.updateRule.includes(oldGuard))
      collection.updateRule = collection.updateRule.replace(oldGuard, compatibleGuard)
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cer_life_directions')
    const used = app.findRecordsByFilter('cer_life_directions', 'archived = true', '', 1, 0)
    if (used.length)
      throw new Error('Existem metas excluídas; preserve o campo para permitir restaurá-las.')
    collection.fields.removeByName('archived')
    app.save(collection)
  },
)
