migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const practicesCol = app.findCollectionByNameOrId('cer_practices')
    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')

    // ═══ 1. cer_practices.item_nature ═══
    // Select OBRIGATÓRIO com exatamente: practice | guided_experience | continued_care | support_resource
    // Preservar distinção: item_nature = natureza do objeto/intervenção; family = família terapêutica/clínica. NÃO alterar family.
    // Guard de API rule: item_nature IMUTÁVEL após criação no update de cer_practices (@request.body.item_nature ?= item_nature)
    if (!practicesCol.fields.getByName('item_nature')) {
      practicesCol.fields.add(
        new SelectField({
          name: 'item_nature',
          required: true,
          values: ['practice', 'guided_experience', 'continued_care', 'support_resource'],
          maxSelect: 1,
        }),
      )
    }

    practicesCol.updateRule =
      "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.body.item_nature ?= item_nature"
    practicesCol.deleteRule = null

    // Adicionar índice para item_nature
    practicesCol.addIndex('idx_cp_item_nature', false, 'item_nature', '')
    app.save(practicesCol)

    // ═══ 2. Collection cer_practice_version_assets (NOVA) ═══
    // Criada com rules temporárias para permitir que cer_resource_recommendations seja criada primeiro
    const versionAssetsCol = new Collection({
      name: 'cer_practice_version_assets',
      type: 'base',
      listRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      viewRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      createRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      updateRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      deleteRule: null,
      fields: [
        {
          name: 'practice_version_id',
          type: 'relation',
          required: true,
          collectionId: practiceVersionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'asset_type',
          type: 'select',
          required: true,
          values: ['audio', 'document', 'video', 'external_link'],
          maxSelect: 1,
        },
        {
          name: 'role',
          type: 'text',
          required: false,
        },
        {
          name: 'file',
          type: 'file',
          required: false,
          protected: true,
          maxSelect: 1,
          maxSize: 104857600, // 100MB
        },
        {
          name: 'url_identifier',
          type: 'text',
          required: false,
        },
        {
          name: 'title',
          type: 'text',
          required: false,
        },
        {
          name: 'sort_order',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpva_version ON cer_practice_version_assets (practice_version_id)',
        'CREATE INDEX idx_cpva_type ON cer_practice_version_assets (asset_type)',
        'CREATE INDEX idx_cpva_sort ON cer_practice_version_assets (sort_order)',
      ],
    })
    app.save(versionAssetsCol)

    // ═══ 3. Collection cer_resource_recommendations (NOVA) ═══
    // Invariante de Natureza: resource_version_id.practice_id.item_nature = 'support_resource'
    // Invariante de PracticeVersion: resource_version_id.status = 'active'
    // Profissional: list/view/create/update com professional_enrollment_access ativo
    // Participante: list/view somente se destinado ao próprio enrollment; create/update negados
    // deleteRule = null
    const recommendationsCol = new Collection({
      name: 'cer_resource_recommendations',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true && resource_version_id.practice_id.item_nature = 'support_resource' && resource_version_id.status = 'active'",
      updateRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true && resource_version_id.practice_id.item_nature = 'support_resource' && resource_version_id.status = 'active'",
      deleteRule: null,
      fields: [
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'participant_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'resource_version_id',
          type: 'relation',
          required: true,
          collectionId: practiceVersionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'professional_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'participant_safe_message',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['recommended', 'viewed', 'withdrawn', 'superseded'],
          maxSelect: 1,
        },
        {
          name: 'channel',
          type: 'select',
          required: true,
          values: ['app', 'session'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_crr_enrollment ON cer_resource_recommendations (enrollment_id)',
        'CREATE INDEX idx_crr_participant ON cer_resource_recommendations (participant_user_id)',
        'CREATE INDEX idx_crr_version ON cer_resource_recommendations (resource_version_id)',
        'CREATE INDEX idx_crr_status ON cer_resource_recommendations (status)',
      ],
    })
    app.save(recommendationsCol)

    // ═══ 4. Atualizar rules de cer_practice_version_assets com a back-relation já existente ═══
    const savedAssetsCol = app.findCollectionByNameOrId('cer_practice_version_assets')
    savedAssetsCol.listRule =
      "@request.auth.id != '' && (@request.auth.user_roles_via_user_id.role ?= 'profissional' || practice_version_id.cer_practice_assignments_via_practice_version_id.participant_user_id ?= @request.auth.id || practice_version_id.cer_resource_recommendations_via_resource_version_id.participant_user_id ?= @request.auth.id)"
    savedAssetsCol.viewRule =
      "@request.auth.id != '' && (@request.auth.user_roles_via_user_id.role ?= 'profissional' || practice_version_id.cer_practice_assignments_via_practice_version_id.participant_user_id ?= @request.auth.id || practice_version_id.cer_resource_recommendations_via_resource_version_id.participant_user_id ?= @request.auth.id)"
    app.save(savedAssetsCol)
  },
  (app) => {
    try {
      const recCol = app.findCollectionByNameOrId('cer_resource_recommendations')
      app.delete(recCol)
    } catch (_) {}

    try {
      const astCol = app.findCollectionByNameOrId('cer_practice_version_assets')
      app.delete(astCol)
    } catch (_) {}

    try {
      const practicesCol = app.findCollectionByNameOrId('cer_practices')
      practicesCol.removeIndex('idx_cp_item_nature')
      const field = practicesCol.fields.getByName('item_nature')
      if (field) {
        practicesCol.fields.removeById(field.id)
      }
      practicesCol.updateRule =
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'"
      app.save(practicesCol)
    } catch (_) {}
  },
)
