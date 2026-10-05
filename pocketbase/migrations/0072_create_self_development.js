migrate(
  (app) => {
    const active = "@request.auth.id != '' && @request.auth.status = 'active'"
    const owner = 'enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id'
    const shared =
      "access_class = 'participant_shared' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true"
    app.save(
      new Collection({
        name: 'cer_development_experiments',
        type: 'base',
        listRule: `${active} && (${owner} || (${shared}))`,
        viewRule: `${active} && (${owner} || (${shared}))`,
        createRule: `${active} && ${owner}`,
        updateRule: `${active} && ${owner} && @request.body.enrollment_id:changed = false`,
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
            name: 'direction_id',
            type: 'relation',
            collectionId: app.findCollectionByNameOrId('cer_life_directions').id,
            maxSelect: 1,
          },
          { name: 'resource_snapshot', type: 'json', required: true, maxSize: 65536 },
          ...['goal', 'action', 'context', 'fallback', 'signal', 'reflection', 'next_step'].map(
            (name) => ({
              name,
              type: 'text',
              max: 5000,
              required: ['goal', 'action', 'context'].includes(name),
            }),
          ),
          { name: 'scheduled_at', type: 'date' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['planned', 'experimenting', 'paused', 'completed', 'reviewed'],
            maxSelect: 1,
          },
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
          'CREATE INDEX idx_development_enrollment ON cer_development_experiments (enrollment_id)',
        ],
      }),
    )
    const professional =
      "@request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.auth.user_roles_via_user_id.is_active ?= true"
    app.save(
      new Collection({
        name: 'cer_development_resources',
        type: 'base',
        listRule: `${active} && (status = 'published' || author_user_id = @request.auth.id)`,
        viewRule: `${active} && (status = 'published' || author_user_id = @request.auth.id)`,
        createRule: `${active} && author_user_id = @request.auth.id && ${professional}`,
        updateRule: `${active} && author_user_id = @request.auth.id && @request.body.author_user_id:changed = false`,
        deleteRule: null,
        fields: [
          {
            name: 'author_user_id',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('users').id,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true, max: 160 },
          ...['theme', 'duration', 'lesson', 'fallback', 'reflection'].map((name) => ({
            name,
            type: 'text',
            max: 5000,
            required: name === 'lesson',
          })),
          { name: 'instructions', type: 'json', required: true, maxSize: 20000 },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['draft', 'published', 'archived'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      }),
    )
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('cer_development_experiments'))
    app.delete(app.findCollectionByNameOrId('cer_development_resources'))
  },
)
