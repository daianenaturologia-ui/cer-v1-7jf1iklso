migrate(
  (app) => {
    const owner = 'enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id'
    const professional =
      "access_class = 'participant_shared' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true"
    app.save(
      new Collection({
        name: 'cer_life_directions',
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
          {
            name: 'kind',
            type: 'select',
            required: true,
            values: ['present', 'future'],
            maxSelect: 1,
          },
          {
            name: 'horizon',
            type: 'select',
            required: true,
            values: ['now', 'short', 'medium', 'long', 'open'],
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true, max: 160 },
          ...['narrative', 'meaning', 'resources', 'limits', 'first_step'].map((name) => ({
            name,
            type: 'text',
            max: 5000,
          })),
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
        indexes: [
          'CREATE INDEX idx_life_directions_enrollment ON cer_life_directions (enrollment_id)',
        ],
      }),
    )
  },
  (app) => app.delete(app.findCollectionByNameOrId('cer_life_directions')),
)
