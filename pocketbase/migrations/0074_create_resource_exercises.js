migrate(
  (app) => {
    const owner =
      "@request.auth.id != '' && @request.auth.status = 'active' && owner_id = @request.auth.id && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id"
    app.save(
      new Collection({
        name: 'cer_resource_exercises',
        type: 'base',
        listRule: owner,
        viewRule: owner,
        createRule: `${owner} && @request.body.revision = 1`,
        updateRule: `${owner} && @request.body.owner_id:changed = false && @request.body.enrollment_id:changed = false`,
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
            name: 'owner_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'revision', type: 'number', required: true, min: 1, onlyInt: true },
          { name: 'exercise', type: 'json', required: true, maxSize: 262144 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_resource_exercise_owner ON cer_resource_exercises (enrollment_id, owner_id)',
        ],
      }),
    )
  },
  (app) => app.delete(app.findCollectionByNameOrId('cer_resource_exercises')),
)
