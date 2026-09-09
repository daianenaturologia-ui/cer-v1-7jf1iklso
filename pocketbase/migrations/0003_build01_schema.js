migrate(
  (app) => {
    // Obter referências essenciais
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Criar coleção 'persons'
    // Representa a pessoa humana real, independente de possuir conta ou login no sistema.
    const personsCol = new Collection({
      name: 'persons',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        {
          name: 'full_name',
          type: 'text',
          required: true,
        },
        {
          name: 'preferred_name',
          type: 'text',
          required: false,
        },
        {
          name: 'email',
          type: 'email',
          required: false,
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
        },
        {
          name: 'notes',
          type: 'text',
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
        'CREATE INDEX idx_persons_full_name ON persons (full_name)',
        'CREATE INDEX idx_persons_email ON persons (email)',
      ],
    })
    app.save(personsCol)

    // Adicionar person_id na tabela users
    if (!usersCol.fields.getByName('person_id')) {
      usersCol.fields.add(
        new RelationField({
          name: 'person_id',
          type: 'relation',
          required: false,
          collectionId: personsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      app.save(usersCol)
    }

    // 2. Criar coleção 'user_roles'
    // Papéis de acesso de uma conta: interagente, profissional, admin
    const userRolesCol = new Collection({
      name: 'user_roles',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.user_roles_via_user_id.role ?= 'admin' || @request.auth.user_roles_via_user_id.role ?= 'profissional')",
      viewRule:
        "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.user_roles_via_user_id.role ?= 'admin' || @request.auth.user_roles_via_user_id.role ?= 'profissional')",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'role',
          type: 'select',
          required: true,
          values: ['interagente', 'profissional', 'admin'],
          maxSelect: 1,
        },
        {
          name: 'is_active',
          type: 'bool',
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
        'CREATE INDEX idx_user_roles_user ON user_roles (user_id)',
        'CREATE INDEX idx_user_roles_role ON user_roles (role)',
        'CREATE UNIQUE INDEX idx_user_roles_user_role ON user_roles (user_id, role)',
      ],
    })
    app.save(userRolesCol)

    // 3. Criar coleção 'cer_products'
    // Catálogo de produtos/modalidades CER (ex: Acompanhamento Individual CER)
    const cerProductsCol = new Collection({
      name: 'cer_products',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null, // superuser/seed only por enquanto
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
        },
        {
          name: 'is_active',
          type: 'bool',
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
      indexes: ['CREATE UNIQUE INDEX idx_cer_products_code ON cer_products (code)'],
    })
    app.save(cerProductsCol)

    // 4. Refatorar coleção 'enrollments'
    // Conectar a person_id (interagente), product_id (cer_products), manter datas e status
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')

    // Adicionamos person_id
    if (!enrollmentsCol.fields.getByName('person_id')) {
      enrollmentsCol.fields.add(
        new RelationField({
          name: 'person_id',
          type: 'relation',
          required: false, // temporário para migração
          collectionId: personsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    // Adicionamos product_id
    if (!enrollmentsCol.fields.getByName('product_id')) {
      enrollmentsCol.fields.add(
        new RelationField({
          name: 'product_id',
          type: 'relation',
          required: false, // temporário para migração
          collectionId: cerProductsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    // Adicionamos notes de acompanhamento
    if (!enrollmentsCol.fields.getByName('notes')) {
      enrollmentsCol.fields.add(
        new TextField({
          name: 'notes',
          type: 'text',
          required: false,
        }),
      )
    }

    app.save(enrollmentsCol)

    // 5. Criar coleção 'professional_enrollment_access'
    // Permissão e vínculo explícito de uma profissional a um enrollment
    const profAccessCol = new Collection({
      name: 'professional_enrollment_access',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (professional_user_id = @request.auth.id || enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (professional_user_id = @request.auth.id || enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && professional_user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && professional_user_id = @request.auth.id",
      fields: [
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'professional_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'access_role',
          type: 'select',
          required: true,
          values: ['primary', 'collaborator', 'supervisor'],
          maxSelect: 1,
        },
        {
          name: 'is_active',
          type: 'bool',
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
        'CREATE INDEX idx_prof_access_enrollment ON professional_enrollment_access (enrollment_id)',
        'CREATE INDEX idx_prof_access_user ON professional_enrollment_access (professional_user_id)',
        'CREATE UNIQUE INDEX idx_prof_access_unique ON professional_enrollment_access (enrollment_id, professional_user_id)',
      ],
    })
    app.save(profAccessCol)

    // 6. Criar coleção 'journey_states'
    // Estado mínimo da jornada do enrollment (pronta para builds posteriores, sem conteúdo metodológico inventado)
    const journeyStatesCol = new Collection({
      name: 'journey_states',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'current_stage',
          type: 'select',
          required: true,
          values: ['acolhimento', 'consciencia', 'equilibrio_realizacao', 'evolucao'],
          maxSelect: 1,
        },
        {
          name: 'stage_status',
          type: 'select',
          required: true,
          values: ['nao_iniciado', 'em_andamento', 'integrado'],
          maxSelect: 1,
        },
        {
          name: 'metadata',
          type: 'json',
          required: false,
          maxSize: 65536,
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
        'CREATE UNIQUE INDEX idx_journey_state_enrollment ON journey_states (enrollment_id)',
      ],
    })
    app.save(journeyStatesCol)

    // 7. Atualizar regras de acesso da coleção 'enrollments' para usar a nova arquitetura
    // Interagente: acessa se seu person_id possuir sua conta de usuário
    // Profissional: acessa se houver registro em professional_enrollment_access para seu user.id
    // Criar: qualquer profissional autenticado pode criar enrollment
    // Atualizar: profissional com acesso pode atualizar
    enrollmentsCol.listRule =
      "@request.auth.id != '' && (person_id.users_via_person_id.id ?= @request.auth.id || professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id || @request.auth.id = profissional || @request.auth.id = interagente)"
    enrollmentsCol.viewRule =
      "@request.auth.id != '' && (person_id.users_via_person_id.id ?= @request.auth.id || professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id || @request.auth.id = profissional || @request.auth.id = interagente)"
    enrollmentsCol.createRule = "@request.auth.id != ''"
    enrollmentsCol.updateRule =
      "@request.auth.id != '' && (professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id || @request.auth.id = profissional)"
    app.save(enrollmentsCol)
  },
  (app) => {
    try {
      const journeyStates = app.findCollectionByNameOrId('journey_states')
      app.delete(journeyStates)
    } catch (_) {}

    try {
      const profAccess = app.findCollectionByNameOrId('professional_enrollment_access')
      app.delete(profAccess)
    } catch (_) {}

    try {
      const cerProducts = app.findCollectionByNameOrId('cer_products')
      app.delete(cerProducts)
    } catch (_) {}

    try {
      const userRoles = app.findCollectionByNameOrId('user_roles')
      app.delete(userRoles)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.fields.removeByName('person_id')
      app.save(usersCol)
    } catch (_) {}

    try {
      const persons = app.findCollectionByNameOrId('persons')
      app.delete(persons)
    } catch (_) {}
  },
)
