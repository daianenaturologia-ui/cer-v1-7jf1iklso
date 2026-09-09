migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')

    // 1. Coleção 'feature_flags'
    const featureFlagsCol = new Collection({
      name: 'feature_flags',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      deleteRule: null,
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'is_enabled', type: 'bool' },
        { name: 'metadata', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_feature_flags_key ON feature_flags (key)'],
    })
    app.save(featureFlagsCol)

    // 2. Coleção 'cer_dimensions'
    // Representa as 6 dimensões oficiais (estrutura apenas)
    const cerDimensionsCol = new Collection({
      name: 'cer_dimensions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      deleteRule: null,
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'order_index', type: 'number', required: true },
        { name: 'description', type: 'text' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_cer_dimensions_code ON cer_dimensions (code)',
        'CREATE INDEX idx_cer_dimensions_order ON cer_dimensions (order_index)',
      ],
    })
    app.save(cerDimensionsCol)

    // 3. Coleção 'cer_experiences'
    // Definição de catálogo das experiências (metadados de abertura, fechamento e dimensão)
    const cerExperiencesCol = new Collection({
      name: 'cer_experiences',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      deleteRule: null,
      fields: [
        {
          name: 'dimension_id',
          type: 'relation',
          required: true,
          collectionId: cerDimensionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'code', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text' },
        { name: 'order_index', type: 'number', required: true },
        { name: 'is_pilot', type: 'bool' },
        { name: 'opening_text', type: 'text' },
        { name: 'closing_text', type: 'text' },
        { name: 'version', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_cer_experiences_code ON cer_experiences (code)',
        'CREATE INDEX idx_cer_experiences_dimension ON cer_experiences (dimension_id)',
      ],
    })
    app.save(cerExperiencesCol)

    // 4. Coleção 'cer_prompts'
    // Steps/Moments e Prompts de interação configuráveis por dados/schema
    const cerPromptsCol = new Collection({
      name: 'cer_prompts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      deleteRule: null,
      fields: [
        {
          name: 'experience_id',
          type: 'relation',
          required: true,
          collectionId: cerExperiencesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'step_order', type: 'number', required: true },
        { name: 'step_title', type: 'text', required: true },
        { name: 'step_subtitle', type: 'text' },
        {
          name: 'component_type',
          type: 'select',
          required: true,
          values: [
            'ChoiceCards',
            'MultiSelectCards',
            'SimpleScale',
            'Ordering',
            'BodyMap',
            'Timeline',
            'FreeReflection',
            'ScenarioChoice',
          ],
          maxSelect: 1,
        },
        { name: 'prompt_text', type: 'text', required: true },
        { name: 'helper_text', type: 'text' },
        { name: 'schema_config', type: 'json', required: true, maxSize: 65536 },
        { name: 'is_required', type: 'bool' },
        { name: 'version', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cer_prompts_experience ON cer_prompts (experience_id)',
        'CREATE INDEX idx_cer_prompts_order ON cer_prompts (experience_id, step_order)',
      ],
    })
    app.save(cerPromptsCol)

    // 5. Coleção 'enrollment_experiences'
    // Estado e Progressive Release de uma experiência em um enrollment
    // Estados permitidos: locked, available, in_progress, completed, paused
    // Progresso interno: not_started, in_progress, completed
    // Regras de RLS:
    // - Interagente: acessa se o enrollment pertencer à sua person_id
    // - Profissional: acessa se houver professional_enrollment_access ativo
    // - Admin técnico: NÃO tem acesso automático ao conteúdo
    const enrollmentExperiencesCol = new Collection({
      name: 'enrollment_experiences',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true)",
      updateRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
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
          name: 'experience_id',
          type: 'relation',
          required: true,
          collectionId: cerExperiencesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'release_status',
          type: 'select',
          required: true,
          values: ['locked', 'available', 'in_progress', 'completed', 'paused'],
          maxSelect: 1,
        },
        {
          name: 'progress_status',
          type: 'select',
          required: true,
          values: ['not_started', 'in_progress', 'completed'],
          maxSelect: 1,
        },
        { name: 'current_step_order', type: 'number' },
        { name: 'started_at', type: 'date' },
        { name: 'completed_at', type: 'date' },
        { name: 'last_interaction_at', type: 'date' },
        {
          name: 'released_by_user_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_enr_exp_unique ON enrollment_experiences (enrollment_id, experience_id)',
        'CREATE INDEX idx_enr_exp_status ON enrollment_experiences (enrollment_id, release_status)',
      ],
    })
    app.save(enrollmentExperiencesCol)

    // 6. Coleção 'experience_responses'
    // Registro canônico de resposta do interagente
    // RLS restrito:
    // - Interagente do enrollment: pode listar, ver, criar, atualizar (apenas seu próprio respondent_user_id)
    // - Profissional com vínculo ativo no enrollment: pode listar e ver (somente leitura para o profissional!)
    // - Admin técnico sem vínculo: NEGADO
    const experienceResponsesCol = new Collection({
      name: 'experience_responses',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (respondent_user_id = @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && (respondent_user_id = @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && respondent_user_id = @request.auth.id && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id",
      updateRule:
        "@request.auth.id != '' && respondent_user_id = @request.auth.id && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id",
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
          name: 'experience_id',
          type: 'relation',
          required: true,
          collectionId: cerExperiencesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'prompt_id',
          type: 'relation',
          required: true,
          collectionId: cerPromptsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'respondent_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'response_type',
          type: 'select',
          required: true,
          values: [
            'ChoiceCards',
            'MultiSelectCards',
            'SimpleScale',
            'Ordering',
            'BodyMap',
            'Timeline',
            'FreeReflection',
            'ScenarioChoice',
          ],
          maxSelect: 1,
        },
        { name: 'structured_value', type: 'json', maxSize: 65536 },
        { name: 'free_text', type: 'text' },
        { name: 'prompt_version', type: 'number', required: true },
        { name: 'version', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'saved', 'revised'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_exp_resp_enrollment ON experience_responses (enrollment_id)',
        'CREATE INDEX idx_exp_resp_prompt ON experience_responses (prompt_id)',
        'CREATE UNIQUE INDEX idx_exp_resp_unique_active ON experience_responses (enrollment_id, prompt_id)',
      ],
    })
    app.save(experienceResponsesCol)

    // 7. Coleção 'experience_response_versions'
    // Histórico imutável de revisões de respostas (para nenhuma alteração apagar silenciosamente o histórico)
    const experienceResponseVersionsCol = new Collection({
      name: 'experience_response_versions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (respondent_user_id = @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && (respondent_user_id = @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && respondent_user_id = @request.auth.id && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id",
      updateRule: null, // Imutável
      deleteRule: null,
      fields: [
        {
          name: 'response_id',
          type: 'relation',
          required: true,
          collectionId: experienceResponsesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'experience_id',
          type: 'relation',
          required: true,
          collectionId: cerExperiencesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'prompt_id',
          type: 'relation',
          required: true,
          collectionId: cerPromptsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'respondent_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'response_type', type: 'text', required: true },
        { name: 'structured_value', type: 'json', maxSize: 65536 },
        { name: 'free_text', type: 'text' },
        { name: 'version_number', type: 'number', required: true },
        { name: 'prompt_version', type: 'number', required: true },
        { name: 'change_reason', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_exp_resp_ver_response ON experience_response_versions (response_id)',
        'CREATE INDEX idx_exp_resp_ver_enrollment ON experience_response_versions (enrollment_id)',
      ],
    })
    app.save(experienceResponseVersionsCol)
  },
  (app) => {
    try {
      const erv = app.findCollectionByNameOrId('experience_response_versions')
      app.delete(erv)
    } catch (_) {}

    try {
      const er = app.findCollectionByNameOrId('experience_responses')
      app.delete(er)
    } catch (_) {}

    try {
      const ee = app.findCollectionByNameOrId('enrollment_experiences')
      app.delete(ee)
    } catch (_) {}

    try {
      const cp = app.findCollectionByNameOrId('cer_prompts')
      app.delete(cp)
    } catch (_) {}

    try {
      const ce = app.findCollectionByNameOrId('cer_experiences')
      app.delete(ce)
    } catch (_) {}

    try {
      const cd = app.findCollectionByNameOrId('cer_dimensions')
      app.delete(cd)
    } catch (_) {}

    try {
      const ff = app.findCollectionByNameOrId('feature_flags')
      app.delete(ff)
    } catch (_) {}
  },
)
