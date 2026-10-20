migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cer_life_events')
    if (!collection.fields.getByName('emotion_note'))
      collection.fields.add(new TextField({ name: 'emotion_note', required: false, max: 2000 }))
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cer_life_events')
    const used = app.findRecordsByFilter('cer_life_events', "emotion_note != ''", '', 1, 0)
    if (used.length)
      throw new Error('Existem sentimentos registrados; preserve o campo e os relatos.')
    collection.fields.removeByName('emotion_note')
    app.save(collection)
  },
)
