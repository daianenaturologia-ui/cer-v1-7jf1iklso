migrate(
  (app) => {
    // CORREÇÃO 3A-1: MIGRATION 0048 — Persistência de Dose Realizada e Execução Real
    // Adiciona a cer_practice_responses os campos de execução real com IDs estáveis e zero julgamento.
    // Preserva a ancoragem relacional existente: assignment_id, participant_user_id, enrollment_id,
    // care_cycle_id, practice_version_id.

    const col = app.findCollectionByNameOrId('cer_practice_responses')

    if (!col.fields.getByName('completed_repetitions')) {
      col.fields.add(
        new NumberField({
          name: 'completed_repetitions',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }

    if (!col.fields.getByName('completed_cycles')) {
      col.fields.add(
        new NumberField({
          name: 'completed_cycles',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }

    if (!col.fields.getByName('completed_series')) {
      col.fields.add(
        new NumberField({
          name: 'completed_series',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }

    if (!col.fields.getByName('actual_duration_seconds')) {
      col.fields.add(
        new NumberField({
          name: 'actual_duration_seconds',
          required: false,
          min: 0,
          onlyInt: true,
        }),
      )
    }

    if (!col.fields.getByName('ended_early')) {
      col.fields.add(
        new BoolField({
          name: 'ended_early',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('stop_reason')) {
      col.fields.add(
        new TextField({
          name: 'stop_reason',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('completed_step_ids')) {
      col.fields.add(
        new JSONField({
          name: 'completed_step_ids',
          required: false,
          maxSize: 65536,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cer_practice_responses')

    const fieldNames = [
      'completed_repetitions',
      'completed_cycles',
      'completed_series',
      'actual_duration_seconds',
      'ended_early',
      'stop_reason',
      'completed_step_ids',
    ]

    for (const name of fieldNames) {
      const f = col.fields.getByName(name)
      if (f) {
        col.fields.removeByName(name)
      }
    }

    app.save(col)
  },
)
