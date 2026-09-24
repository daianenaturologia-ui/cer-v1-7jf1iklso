migrate(
  (app) => {
    const personsCol = app.findCollectionByNameOrId('persons')

    if (!personsCol.fields.getByName('avatar_presentation')) {
      personsCol.fields.add(
        new SelectField({
          name: 'avatar_presentation',
          required: false,
          values: ['feminine', 'masculine'],
          maxSelect: 1,
        }),
      )
    }

    if (!personsCol.fields.getByName('avatar_skin_tone')) {
      personsCol.fields.add(
        new SelectField({
          name: 'avatar_skin_tone',
          required: false,
          values: ['skin_01', 'skin_02', 'skin_03', 'skin_04', 'skin_05', 'skin_06'],
          maxSelect: 1,
        }),
      )
    }

    if (!personsCol.fields.getByName('avatar_hair_color')) {
      personsCol.fields.add(
        new SelectField({
          name: 'avatar_hair_color',
          required: false,
          values: [
            'hair_black',
            'hair_dark_brown',
            'hair_light_brown',
            'hair_blonde',
            'hair_red',
            'hair_gray_white',
          ],
          maxSelect: 1,
        }),
      )
    }

    if (!personsCol.fields.getByName('avatar_customization_status')) {
      personsCol.fields.add(
        new SelectField({
          name: 'avatar_customization_status',
          required: false,
          values: ['completed', 'deferred'],
          maxSelect: 1,
        }),
      )
    }

    if (!personsCol.fields.getByName('avatar_version')) {
      personsCol.fields.add(
        new NumberField({
          name: 'avatar_version',
          required: false,
          onlyInt: true,
        }),
      )
    }

    if (!personsCol.fields.getByName('avatar_updated_at')) {
      personsCol.fields.add(
        new DateField({
          name: 'avatar_updated_at',
          required: false,
        }),
      )
    }

    app.save(personsCol)
  },
  (app) => {
    try {
      const personsCol = app.findCollectionByNameOrId('persons')
      const fieldsToRemove = [
        'avatar_presentation',
        'avatar_skin_tone',
        'avatar_hair_color',
        'avatar_customization_status',
        'avatar_version',
        'avatar_updated_at',
      ]
      for (const fieldName of fieldsToRemove) {
        if (personsCol.fields.getByName(fieldName)) {
          personsCol.fields.removeByName(fieldName)
        }
      }
      app.save(personsCol)
    } catch (_) {}
  },
)
