// Additive: does not alter previous Mandala/care records.
migrate(
  (app) => {
    const active = '@request.auth.id != "" && @request.auth.status = "active"'
    const owner = 'enrollment_id.person_id = @request.auth.person_id'
    const role =
      '(@collection.user_roles:cycle_actor.user_id ?= @request.auth.id && @collection.user_roles:cycle_actor.is_active ?= true && (@collection.user_roles:cycle_actor.role ?= "profissional" || @collection.user_roles:cycle_actor.role ?= "admin"))'
    const professional = `${role} && access_class = "participant_shared" && @collection.professional_enrollment_access:cycle_scope.enrollment_id ?= enrollment_id && @collection.professional_enrollment_access:cycle_scope.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:cycle_scope.is_active ?= true`
    const immutable = (field) =>
      `(@request.body.${field}:isset = false || @request.body.${field} = ${field})`
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
    const select = (name, values, required = false, maxSelect = 1) => ({
      name,
      type: 'select',
      values,
      required,
      maxSelect,
    })
    app.save(
      new Collection({
        name: 'cer_cycle_profiles',
        type: 'base',
        listRule: `${active} && ${owner}`,
        viewRule: `${active} && ${owner}`,
        createRule: `${active} && ${owner}`,
        updateRule: `${active} && ${owner} && ${immutable('enrollment_id')}`,
        deleteRule: `${active} && ${owner}`,
        fields: [
          ...base(),
          select(
            'context',
            [
              'natural',
              'irregular',
              'hormonal',
              'perimenopause',
              'menopause',
              'pregnancy',
              'postpartum',
            ],
            true,
          ),
          { name: 'cycle_length', type: 'number', min: 0, max: 45, onlyInt: true },
          { name: 'lunar_reflections', type: 'bool' },
          { name: 'planner_reminders', type: 'bool' },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cycle_profile_owner ON cer_cycle_profiles (enrollment_id)',
        ],
      }),
    )
    const read = `${active} && (${owner} || (${professional}))`
    app.save(
      new Collection({
        name: 'cer_cycle_entries',
        type: 'base',
        listRule: read,
        viewRule: read,
        createRule: `${active} && ${owner}`,
        updateRule: `${active} && ${owner} && ${immutable('enrollment_id')} && ${immutable('day')}`,
        deleteRule: `${active} && ${owner}`,
        fields: [
          ...base(),
          {
            name: 'day',
            type: 'text',
            required: true,
            max: 10,
            pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
          },
          { name: 'energy', type: 'number', min: 0, max: 5, onlyInt: true },
          select(
            'emotions',
            [
              'Tranquila',
              'Alegre',
              'Triste',
              'Irritada',
              'Ansiosa',
              'Sensível',
              'Entusiasmada',
              'Introspectiva',
              'Outra',
            ],
            false,
            2,
          ),
          select(
            'symptoms',
            [
              'Sem desconforto',
              'Cólica',
              'Inchaço',
              'Dor de cabeça',
              'Sensibilidade nas mamas',
              'Calor / suor',
              'Desconforto digestivo',
              'Tensão',
              'Outro',
            ],
            false,
            8,
          ),
          { name: 'intensity', type: 'number', min: 0, max: 3, onlyInt: true },
          select('appetite', ['Menor', 'Habitual', 'Maior', 'Diferente do habitual']),
          select('impact', ['Não interferiu', 'Precisei adaptar', 'Impediu uma atividade']),
          select('bleeding', ['Sem sangramento', 'Escape', 'Leve', 'Moderado', 'Intenso']),
          { name: 'period_start', type: 'bool' },
          ...['sleep', 'context_note', 'reflection', 'need', 'care'].map((name) => ({
            name,
            type: 'text',
            max: 5000,
          })),
          select('care_response', [
            'Ajudou',
            'Ajudou um pouco',
            'Não percebi diferença',
            'Me fez pior',
          ]),
          select('access_class', ['participant_private', 'participant_shared'], true),
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cycle_entry_day ON cer_cycle_entries (enrollment_id, day)',
        ],
      }),
    )
  },
  () => {
    throw new Error(
      'A reversão requer exportação dos registros e migração revisada; não apagar diários automaticamente.',
    )
  },
)
