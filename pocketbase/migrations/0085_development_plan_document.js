// New document workflow; previous care plans, directions and planner records are preserved.
migrate(
  (app) => {
    const active = '@request.auth.id != "" && @request.auth.status = "active"'
    const linked =
      '@collection.professional_enrollment_access:devplan.enrollment_id ?= enrollment_id && @collection.professional_enrollment_access:devplan.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:devplan.is_active ?= true'
    const role =
      '@collection.user_roles:devplan_role.user_id ?= @request.auth.id && @collection.user_roles:devplan_role.is_active ?= true && (@collection.user_roles:devplan_role.role ?= "profissional" || @collection.user_roles:devplan_role.role ?= "admin")'
    const professional = `${active} && (${role}) && (${linked})`
    const shared = `${active} && (enrollment_id.person_id = @request.auth.person_id || ((${role}) && (${linked})))`
    const immutable = (f) => `(@request.body.${f}:isset = false || @request.body.${f} = ${f})`
    const base = () => [
      {
        name: 'enrollment_id',
        type: 'relation',
        required: true,
        collectionId: app.findCollectionByNameOrId('enrollments').id,
        maxSelect: 1,
      },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]
    const drafts = new Collection({
      name: 'cer_development_plan_drafts',
      type: 'base',
      listRule: `${professional} && author_id = @request.auth.id`,
      viewRule: `${professional} && author_id = @request.auth.id`,
      createRule: `${professional} && author_id = @request.auth.id`,
      updateRule: `${professional} && author_id = @request.auth.id && ${immutable('enrollment_id')} && ${immutable('author_id')}`,
      deleteRule: null,
      fields: [
        ...base(),
        {
          name: 'author_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'revision', type: 'number', required: true, min: 1, onlyInt: true },
        { name: 'document', type: 'json', required: true, maxSize: 150000 },
        { name: 'private_notes', type: 'text', max: 20000 },
      ],
      indexes: [],
    })
    app.save(drafts)
    const versions = new Collection({
      name: 'cer_development_plan_versions',
      type: 'base',
      listRule: shared,
      viewRule: shared,
      createRule: `${professional} && draft_id.author_id = @request.auth.id && draft_id.enrollment_id = enrollment_id`,
      updateRule: null,
      deleteRule: null,
      fields: [
        ...base(),
        {
          name: 'draft_id',
          type: 'relation',
          required: true,
          collectionId: drafts.id,
          maxSelect: 1,
        },
        { name: 'revision', type: 'number', required: true, min: 1, onlyInt: true },
        {
          name: 'stage',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['building', 'agreed'],
        },
        { name: 'document', type: 'json', maxSize: 150000 },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_devplan_version ON cer_development_plan_versions (draft_id, revision)',
      ],
    })
    app.save(versions)
    app.save(
      new Collection({
        name: 'cer_development_plan_routines',
        type: 'base',
        listRule: shared,
        viewRule: shared,
        createRule: shared,
        updateRule: null,
        deleteRule: null,
        fields: [
          ...base(),
          {
            name: 'version_id',
            type: 'relation',
            required: true,
            collectionId: versions.id,
            maxSelect: 1,
          },
          { name: 'action_id', type: 'text', required: true, max: 80 },
          { name: 'effective_day', type: 'text', required: true, max: 10 },
          { name: 'enabled', type: 'bool' },
          { name: 'schedule', type: 'json', required: true, maxSize: 4000 },
          { name: 'snapshot', type: 'json', maxSize: 40000 },
          { name: 'command_key', type: 'text', required: true, max: 80 },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_devplan_command ON cer_development_plan_routines (command_key)',
        ],
      }),
    )
  },
  () => {
    throw new Error(
      'Exportar planos e rotinas antes de reverter; não apagar históricos automaticamente.',
    )
  },
)
