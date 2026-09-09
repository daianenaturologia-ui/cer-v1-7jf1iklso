migrate(
  (app) => {
    // 1. Criar coleção base 'profiles'
    const profilesCollection = new Collection({
      name: 'profiles',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'profile_type',
          type: 'select',
          required: true,
          values: ['interagente', 'profissional'],
          maxSelect: 1,
        },
        {
          name: 'full_name',
          type: 'text',
          required: true,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_profiles_user ON profiles (user)',
        'CREATE INDEX idx_profiles_profile_type ON profiles (profile_type)',
      ],
    })
    app.save(profilesCollection)

    // 2. Criar coleção base 'enrollments'
    const enrollmentsCollection = new Collection({
      name: 'enrollments',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (interagente = @request.auth.id || profissional = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (interagente = @request.auth.id || profissional = @request.auth.id)",
      createRule: "@request.auth.id != '' && interagente = @request.auth.id",
      updateRule: "@request.auth.id != '' && profissional = @request.auth.id",
      deleteRule: null, // superuser only
      fields: [
        {
          name: 'interagente',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'profissional',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'product',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativa', 'pendente', 'encerrada'],
          maxSelect: 1,
        },
        {
          name: 'start_date',
          type: 'date',
          required: false,
        },
        {
          name: 'end_date',
          type: 'date',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_enrollments_interagente ON enrollments (interagente)',
        'CREATE INDEX idx_enrollments_profissional ON enrollments (profissional)',
        'CREATE INDEX idx_enrollments_status ON enrollments (status)',
      ],
    })
    app.save(enrollmentsCollection)
  },
  (app) => {
    try {
      const enrollments = app.findCollectionByNameOrId('enrollments')
      app.delete(enrollments)
    } catch (_) {}

    try {
      const profiles = app.findCollectionByNameOrId('profiles')
      app.delete(profiles)
    } catch (_) {}
  },
)
