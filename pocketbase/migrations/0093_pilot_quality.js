// Private feedback and minimal technical incidents. No raw client access.
migrate(
  (app) => {
    const users = '_pb_users_auth_'
    const enrollments = app.findCollectionByNameOrId('enrollments').id
    const relation = (name, collectionId) => ({
      name,
      type: 'relation',
      collectionId,
      required: true,
      maxSelect: 1,
    })
    const dates = [
      { name: 'created', type: 'autodate', onCreate: true },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]
    const save = (name, fields, indexes = []) =>
      app.save(
        new Collection({
          name,
          type: 'base',
          listRule: null,
          viewRule: null,
          createRule: null,
          updateRule: null,
          deleteRule: null,
          fields: [...fields, ...dates],
          indexes,
        }),
      )
    save(
      'cer_pilot_feedback',
      [
        relation('author_id', users),
        relation('enrollment_id', enrollments),
        relation('professional_id', users),
        {
          name: 'category',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['app', 'process'],
        },
        { name: 'message', type: 'text', required: true, max: 3000 },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['new', 'reviewing', 'resolved'],
        },
        { name: 'request_id', type: 'text', required: true, max: 64 },
        { name: 'review_note', type: 'text', max: 1000 },
      ],
      ['CREATE UNIQUE INDEX idx_feedback_request ON cer_pilot_feedback (author_id, request_id)'],
    )
    save('cer_pilot_incidents', [
      relation('actor_id', users),
      relation('professional_id', users),
      {
        name: 'code',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: [
          'ui_exception',
          'unhandled_rejection',
          'onboarding_save',
          'feedback_save',
          'quality_load',
        ],
      },
      {
        name: 'area',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: ['journey', 'professional', 'feedback', 'other'],
      },
      { name: 'release', type: 'text', required: true, max: 40 },
    ])
    save(
      'cer_pilot_weekly_audits',
      [
        relation('professional_id', users),
        { name: 'week_start', type: 'text', required: true, max: 10 },
        { name: 'week_end', type: 'text', required: true, max: 10 },
        { name: 'summary', type: 'json', required: true },
        { name: 'reviewed_at', type: 'date' },
      ],
      [
        'CREATE UNIQUE INDEX idx_quality_week ON cer_pilot_weekly_audits (professional_id, week_start)',
      ],
    )
  },
  () => {
    throw new Error('Preserve os feedbacks; reversão exige migração revisada.')
  },
)
