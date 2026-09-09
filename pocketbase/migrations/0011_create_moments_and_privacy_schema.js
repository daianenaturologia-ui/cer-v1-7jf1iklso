migrate(
  (app) => {
    const experiencesCol = app.findCollectionByNameOrId('cer_experiences')
    const promptsCol = app.findCollectionByNameOrId('cer_prompts')
    const responsesCol = app.findCollectionByNameOrId('experience_responses')
    const responseVersionsCol = app.findCollectionByNameOrId('experience_response_versions')

    // 1. Criar coleção 'cer_experience_moments'
    // id, experience_id, moment_key, title, subtitle, order_index, is_active, version, created, updated
    const momentsCol = new Collection({
      name: 'cer_experience_moments',
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
          collectionId: experiencesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'moment_key', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text' },
        { name: 'order_index', type: 'number', required: true },
        { name: 'is_active', type: 'bool' },
        { name: 'version', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cer_moments_exp ON cer_experience_moments (experience_id)',
        'CREATE INDEX idx_cer_moments_order ON cer_experience_moments (experience_id, order_index)',
        'CREATE UNIQUE INDEX idx_cer_moments_key ON cer_experience_moments (experience_id, moment_key)',
      ],
    })
    app.save(momentsCol)

    // 2. Criar coleção 'cer_prompt_versions'
    // Histórico imutável de prompts:
    // prompt_id, moment_id, version_number, prompt_type, prompt_text, schema_config, helper_text, is_required, change_reason, created, updated
    const promptVersionsCol = new Collection({
      name: 'cer_prompt_versions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      updateRule: null, // Imutável
      deleteRule: null,
      fields: [
        {
          name: 'prompt_id',
          type: 'relation',
          required: true,
          collectionId: promptsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'moment_id',
          type: 'relation',
          required: true,
          collectionId: momentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'version_number', type: 'number', required: true },
        { name: 'prompt_type', type: 'text', required: true },
        { name: 'prompt_text', type: 'text', required: true },
        { name: 'helper_text', type: 'text' },
        { name: 'schema_config', type: 'json', required: true, maxSize: 65536 },
        { name: 'is_required', type: 'bool' },
        { name: 'change_reason', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_prompt_versions_prompt ON cer_prompt_versions (prompt_id)',
        'CREATE INDEX idx_prompt_versions_ver ON cer_prompt_versions (prompt_id, version_number)',
      ],
    })
    app.save(promptVersionsCol)

    // 3. Adicionar campos em 'cer_prompts':
    // - moment_id (relation para cer_experience_moments)
    // - prompt_order (number)
    if (!promptsCol.fields.getByName('moment_id')) {
      promptsCol.fields.add(
        new RelationField({
          name: 'moment_id',
          collectionId: momentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    if (!promptsCol.fields.getByName('prompt_order')) {
      promptsCol.fields.add(
        new NumberField({
          name: 'prompt_order',
        }),
      )
    }
    app.save(promptsCol)

    // 4. Adicionar 'access_class' em 'experience_responses'
    // Valores do enum oficial: participant_private, participant_shared, professional_private, shared_care, administrative, system_internal
    const accessClasses = [
      'participant_private',
      'participant_shared',
      'professional_private',
      'shared_care',
      'administrative',
      'system_internal',
    ]

    if (!responsesCol.fields.getByName('access_class')) {
      responsesCol.fields.add(
        new SelectField({
          name: 'access_class',
          required: true,
          values: accessClasses,
          maxSelect: 1,
        }),
      )
    }

    // Atualizar RLS de 'experience_responses':
    // Regras fundamentais:
    // participant_private -> participante acessa; profissional NÃO acessa; admin técnico NÃO ganha acesso ao conteúdo; IA futura NÃO recebe.
    // participant_shared / shared_care -> participante acessa; profissional com vínculo ativo acessa.
    // professional_private -> profissional autorizada acessa; participante não acessa automaticamente.
    // List / View:
    // (respondent_user_id = @request.auth.id && access_class != 'professional_private') ||
    // (access_class ?= ['participant_shared', 'shared_care'] && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true)
    responsesCol.listRule =
      "@request.auth.id != '' && ((respondent_user_id = @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))"
    responsesCol.viewRule =
      "@request.auth.id != '' && ((respondent_user_id = @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))"

    app.save(responsesCol)

    // 5. Adicionar 'access_class' em 'experience_response_versions'
    if (!responseVersionsCol.fields.getByName('access_class')) {
      responseVersionsCol.fields.add(
        new SelectField({
          name: 'access_class',
          required: true,
          values: accessClasses,
          maxSelect: 1,
        }),
      )
    }
    responseVersionsCol.listRule =
      "@request.auth.id != '' && ((respondent_user_id = @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))"
    responseVersionsCol.viewRule =
      "@request.auth.id != '' && ((respondent_user_id = @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))"

    app.save(responseVersionsCol)
  },
  (app) => {
    try {
      const pv = app.findCollectionByNameOrId('cer_prompt_versions')
      app.delete(pv)
    } catch (_) {}

    try {
      const m = app.findCollectionByNameOrId('cer_experience_moments')
      app.delete(m)
    } catch (_) {}
  },
)
