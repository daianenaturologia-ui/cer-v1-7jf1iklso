migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cer_cycle_entries')
    if (!collection.fields.getByName('thoughts'))
      collection.fields.add(new TextField({ name: 'thoughts', required: false, max: 5000 }))
    if (!collection.fields.getByName('cycle_signs'))
      collection.fields.add(
        new SelectField({
          name: 'cycle_signs',
          required: false,
          values: ['TPM percebida', 'Sinais de ovulação percebidos', 'Não sei identificar'],
          maxSelect: 2,
        }),
      )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cer_cycle_entries')
    const used = app.findRecordsByFilter(
      'cer_cycle_entries',
      "thoughts != '' || cycle_signs:length > 0",
      '',
      1,
      0,
    )
    if (used.length)
      throw new Error('Existem observações registradas; preserve os campos e o histórico.')
    collection.fields.removeByName('thoughts')
    collection.fields.removeByName('cycle_signs')
    app.save(collection)
  },
)
