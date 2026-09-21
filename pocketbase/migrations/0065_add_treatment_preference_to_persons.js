migrate(
  (app) => {
    const personsCol = app.findCollectionByNameOrId('persons')

    if (!personsCol.fields.getByName('treatment_preference')) {
      personsCol.fields.add(
        new SelectField({
          name: 'treatment_preference',
          required: false,
          values: ['feminino', 'masculino', 'neutro', 'outro'],
          maxSelect: 1,
        }),
      )
    }

    if (!personsCol.fields.getByName('treatment_preference_custom')) {
      personsCol.fields.add(
        new TextField({
          name: 'treatment_preference_custom',
          required: false,
        }),
      )
    }

    // Regra de acesso: editável pela própria pessoa humana ou profissional vinculada
    // Mantém a regra existente mas assegura updateRule coerente
    if (!personsCol.updateRule || personsCol.updateRule === '') {
      personsCol.updateRule = "@request.auth.id != ''"
    }

    app.save(personsCol)
  },
  (app) => {
    try {
      const personsCol = app.findCollectionByNameOrId('persons')
      if (personsCol.fields.getByName('treatment_preference_custom')) {
        personsCol.fields.removeByName('treatment_preference_custom')
      }
      if (personsCol.fields.getByName('treatment_preference')) {
        personsCol.fields.removeByName('treatment_preference')
      }
      app.save(personsCol)
    } catch (_) {}
  },
)
