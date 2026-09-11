migrate(
  (app) => {
    // 1. Atualizar enum proposal_type de cer_ai_proposals para incluir 'priority_suggestion'
    const proposalsCol = app.findCollectionByNameOrId('cer_ai_proposals')
    const typeField = proposalsCol.fields.getByName('proposal_type')
    if (typeField) {
      typeField.values = [
        'association_suggestion',
        'knowledge_suggestion',
        'integrative_hypothesis',
        'priority_suggestion',
      ]
      app.save(proposalsCol)
    }

    // 2. Feature Flag build_08b
    const ffCol = app.findCollectionByNameOrId('feature_flags')
    try {
      app.findFirstRecordByData('feature_flags', 'key', 'build_08b')
    } catch (_) {
      const rec = new Record(ffCol)
      rec.set('key', 'build_08b')
      rec.set('name', 'Build 08B — Care Planning & Priority Management')
      rec.set(
        'description',
        'Core operacional de planos de cuidado, prioridades, apresentações, ciclos e aceites operacionais.',
      )
      rec.set('is_enabled', true)
      rec.set(
        'metadata',
        JSON.stringify({
          version: '08b',
          freeze_status: 'frozen',
          entities: [
            'cer_care_plans',
            'cer_care_plan_priorities',
            'cer_care_plan_priority_sources',
            'cer_care_plan_presentations',
            'cer_care_cycles',
            'cer_operational_acceptances',
            'cer_operational_acceptance_private_notes',
          ],
        }),
      )
      app.save(rec)
    }
  },
  (app) => {
    try {
      const proposalsCol = app.findCollectionByNameOrId('cer_ai_proposals')
      const typeField = proposalsCol.fields.getByName('proposal_type')
      if (typeField) {
        typeField.values = [
          'association_suggestion',
          'knowledge_suggestion',
          'integrative_hypothesis',
        ]
        app.save(proposalsCol)
      }
    } catch (_) {}

    try {
      const ffRec = app.findFirstRecordByData('feature_flags', 'key', 'build_08b')
      app.delete(ffRec)
    } catch (_) {}
  },
)
