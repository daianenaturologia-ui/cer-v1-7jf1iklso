migrate(
  (app) => {
    const owner = 'enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id'
    const professional =
      "access_class = 'participant_shared' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true"
    app.save(
      new Collection({
        name: 'cer_life_events',
        type: 'base',
        listRule: `@request.auth.id != '' && (${owner} || (${professional}))`,
        viewRule: `@request.auth.id != '' && (${owner} || (${professional}))`,
        createRule: `@request.auth.id != '' && ${owner}`,
        updateRule: `@request.auth.id != '' && ${owner} && @request.body.enrollment_id:changed = false`,
        deleteRule: null,
        fields: [
          {
            name: 'enrollment_id',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('enrollments').id,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true, max: 160 },
          {
            name: 'time_kind',
            type: 'select',
            required: true,
            values: ['date', 'year', 'age', 'unknown'],
            maxSelect: 1,
          },
          { name: 'time_value', type: 'text', max: 10 },
          { name: 'emotions', type: 'json', maxSize: 2048 },
          { name: 'narrative', type: 'text', max: 20000 },
          {
            name: 'access_class',
            type: 'select',
            required: true,
            values: ['participant_private', 'participant_shared'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_life_enrollment ON cer_life_events (enrollment_id)'],
      }),
    )
  },
  (app) => app.delete(app.findCollectionByNameOrId('cer_life_events')),
)
