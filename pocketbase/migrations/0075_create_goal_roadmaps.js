migrate(
  (app) => {
    const owner =
      'owner_id = @request.auth.id && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id'
    const professional =
      "access_class = 'participant_shared' && direction_id.access_class = 'participant_shared' && @collection.professional_enrollment_access:goal_access.enrollment_id ?= enrollment_id && @collection.professional_enrollment_access:goal_access.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:goal_access.is_active ?= true"
    const authenticated = "@request.auth.id != '' && @request.auth.status = 'active'"
    app.save(
      new Collection({
        name: 'cer_goal_roadmaps',
        type: 'base',
        listRule: `${authenticated} && (${owner} || (${professional}))`,
        viewRule: `${authenticated} && (${owner} || (${professional}))`,
        createRule: `${authenticated} && ${owner} && @request.body.revision = 1`,
        updateRule: `${authenticated} && ${owner} && @request.body.owner_id:changed = false && @request.body.enrollment_id:changed = false && @request.body.direction_id:changed = false`,
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
            required: true,
            collectionId: app.findCollectionByNameOrId('cer_life_directions').id,
            maxSelect: 1,
          },
          {
            name: 'owner_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'revision', type: 'number', required: true, min: 1, onlyInt: true },
          { name: 'roadmap', type: 'json', required: true, maxSize: 131072 },
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
          'CREATE UNIQUE INDEX idx_goal_roadmap_direction_owner ON cer_goal_roadmaps (direction_id, owner_id)',
        ],
      }),
    )
  },
  (app) => app.delete(app.findCollectionByNameOrId('cer_goal_roadmaps')),
)
