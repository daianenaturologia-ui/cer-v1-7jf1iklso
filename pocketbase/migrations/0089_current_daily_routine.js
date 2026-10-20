migrate(
  (app) => {
    const owner = 'enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id'
    const professional =
      "access_class = 'participant_shared' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true"
    app.save(
      new Collection({
        name: 'cer_daily_routines',
        type: 'base',
        listRule: `@request.auth.id != '' && @request.auth.status = 'active' && (${owner} || (${professional}))`,
        viewRule: `@request.auth.id != '' && @request.auth.status = 'active' && (${owner} || (${professional}))`,
        createRule: `@request.auth.id != '' && @request.auth.status = 'active' && ${owner}`,
        updateRule: `@request.auth.id != '' && @request.auth.status = 'active' && ${owner} && (@request.body.enrollment_id:isset = false || @request.body.enrollment_id = enrollment_id)`,
        deleteRule: null,
        fields: [
          {
            name: 'enrollment_id',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('enrollments').id,
            maxSelect: 1,
          },
          { name: 'day_label', type: 'text', max: 100 },
          { name: 'moments', type: 'json', required: true, maxSize: 160000 },
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
          'CREATE UNIQUE INDEX idx_daily_routine_enrollment ON cer_daily_routines (enrollment_id)',
        ],
      }),
    )
  },
  (app) => {
    if (app.findRecordsByFilter('cer_daily_routines', 'id != ""', '', 1, 0).length)
      throw new Error('Existem rotinas registradas. Preserve a coleção e os registros.')
    app.delete(app.findCollectionByNameOrId('cer_daily_routines'))
  },
)
