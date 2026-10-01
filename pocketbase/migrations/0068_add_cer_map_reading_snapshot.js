migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cer_maps')
    if (!collection.fields.getByName('reading_snapshot')) {
      collection.fields.add(
        new JSONField({ name: 'reading_snapshot', required: false, maxSize: 2000000 }),
      )
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cer_maps')
    collection.fields.removeByName('reading_snapshot')
    app.save(collection)
  },
)
