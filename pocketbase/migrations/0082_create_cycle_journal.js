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
          {
            name: 'context',
            type: 'select',
            values: [
              'natural',
              'irregular',
              'hormonal',
              'perimenopause',
              'menopause',
              'pregnancy',
              'postpartum',
            ],
            required: true,
            maxSelect: 1,
          },
          { name: 'cycle_length', type: 'number', min: 0, max: 45, onlyInt: true },
          { name: 'lunar_reflections', type: 'bool' },
          { name: 'planner_reminders', type: 'bool' },
        ],
        indexes: [],
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
          {
            name: 'emotions',
            type: 'select',
            values: [
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
            required: false,
            maxSelect: 2,
          },
          {
            name: 'symptoms',
            type: 'select',
            values: [
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
            required: false,
            maxSelect: 8,
          },
          { name: 'intensity', type: 'number', min: 0, max: 3, onlyInt: true },
          {
            name: 'appetite',
            type: 'select',
            values: ['Menor', 'Habitual', 'Maior', 'Diferente do habitual'],
            required: false,
            maxSelect: 1,
          },
          {
            name: 'impact',
            type: 'select',
            values: ['Não interferiu', 'Precisei adaptar', 'Impediu uma atividade'],
            required: false,
            maxSelect: 1,
          },
          {
            name: 'bleeding',
            type: 'select',
            values: ['Sem sangramento', 'Escape', 'Leve', 'Moderado', 'Intenso'],
            required: false,
            maxSelect: 1,
          },
          { name: 'period_start', type: 'bool' },
          ...['sleep', 'context_note', 'reflection', 'need', 'care'].map((name) => ({
            name,
            type: 'text',
            max: 5000,
          })),
          {
            name: 'care_response',
            type: 'select',
            values: ['Ajudou', 'Ajudou um pouco', 'Não percebi diferença', 'Me fez pior'],
            required: false,
            maxSelect: 1,
          },
          {
            name: 'access_class',
            type: 'select',
            values: ['participant_private', 'participant_shared'],
            required: true,
            maxSelect: 1,
          },
        ],
        indexes: [],
      }),
    )
  },
  () => {
    throw new Error(
      'A reversão requer exportação dos registros e migração revisada; não apagar diários automaticamente.',
    )
  },
)
