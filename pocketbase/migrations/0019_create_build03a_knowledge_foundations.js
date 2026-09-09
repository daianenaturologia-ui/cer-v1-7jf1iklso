migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const dimensionsCol = app.findCollectionByNameOrId('cer_dimensions')
    const experiencesCol = app.findCollectionByNameOrId('cer_experiences')
    const promptsCol = app.findCollectionByNameOrId('cer_prompts')
    const responsesCol = app.findCollectionByNameOrId('experience_responses')

    // -------------------------------------------------------------
    // 1. FRAMEWORK REGISTRY: 'cer_frameworks'
    // -------------------------------------------------------------
    // Campos: id, framework_key, name, framework_type, description, is_active, created, updated
    // framework_type: scientific | clinical_framework | traditional_system | self_report_model | cer_integrative_model
    // Unique index em framework_key
    // RLS: leitura para qualquer usuário autenticado; escrita restrita a admin técnico
    const frameworksCol = new Collection({
      name: 'cer_frameworks',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      deleteRule: null,
      fields: [
        { name: 'framework_key', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        {
          name: 'framework_type',
          type: 'select',
          required: true,
          values: [
            'scientific',
            'clinical_framework',
            'traditional_system',
            'self_report_model',
            'cer_integrative_model',
          ],
          maxSelect: 1,
        },
        { name: 'description', type: 'text' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_cer_frameworks_key ON cer_frameworks (framework_key)'],
    })
    app.save(frameworksCol)

    // Seeds idempotentes de cer_frameworks: CER_INTEGRATIVE_MODEL e AYURVEDA
    const seedFramework = (key, name, type, desc) => {
      try {
        app.findFirstRecordByData('cer_frameworks', 'framework_key', key)
      } catch (_) {
        const rec = new Record(frameworksCol)
        rec.set('framework_key', key)
        rec.set('name', name)
        rec.set('framework_type', type)
        rec.set('description', desc)
        rec.set('is_active', true)
        app.save(rec)
      }
    }

    seedFramework(
      'CER_INTEGRATIVE_MODEL',
      'Modelo Integrativo CER',
      'cer_integrative_model',
      'Referencial epistemológico integrativo centrado nas dimensões do desenvolvimento humano CER.',
    )

    seedFramework(
      'AYURVEDA',
      'Ayurveda Tradicional',
      'traditional_system',
      'Referencial epistemológico tradicional védico (apenas proveniência e classificação epistemológica).',
    )

    // -------------------------------------------------------------
    // 2. CER_PROMPT_SIGNAL_RULES: 'cer_prompt_signal_rules'
    // -------------------------------------------------------------
    // Campos: id, prompt_id, prompt_version, response_match, signal_type,
    // concept_key, dimension_id (nullable), temporality_default, framework_id (nullable),
    // is_active, created, updated.
    // RLS: leitura para autenticados; escrita admin
    const rulesCol = new Collection({
      name: 'cer_prompt_signal_rules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'admin'",
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
        { name: 'prompt_version', type: 'number', required: true },
        { name: 'response_match', type: 'text', required: true },
        {
          name: 'signal_type',
          type: 'select',
          required: true,
          values: [
            'resource',
            'challenge',
            'protection_pattern',
            'current_state',
            'value_meaning',
            'realization_relevant',
            'context',
          ],
          maxSelect: 1,
        },
        { name: 'concept_key', type: 'text', required: true },
        {
          name: 'dimension_id',
          type: 'relation',
          collectionId: dimensionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'temporality_default',
          type: 'select',
          required: true,
          values: [
            'current',
            'historical',
            'recurring',
            'context_dependent',
            'longitudinal',
            'undetermined',
          ],
          maxSelect: 1,
        },
        {
          name: 'framework_id',
          type: 'relation',
          collectionId: frameworksCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_prompt_rules_prompt ON cer_prompt_signal_rules (prompt_id)',
        'CREATE INDEX idx_prompt_rules_concept ON cer_prompt_signal_rules (concept_key)',
      ],
    })
    app.save(rulesCol)

    // -------------------------------------------------------------
    // 3. CER_SIGNAL: 'cer_signals'
    // -------------------------------------------------------------
    // Campos:
    // id, enrollment_id, signal_type, concept_key, dimension_id (nullable),
    // temporality, source_type, source_response_id (nullable),
    // source_prompt_id (nullable), source_experience_id (nullable),
    // framework_id (nullable), created_by_user_id (nullable), access_class,
    // status, created, updated
    //
    // signal_type: resource | challenge | protection_pattern | current_state | value_meaning | realization_relevant | context
    // temporality: current | historical | recurring | context_dependent | longitudinal | undetermined
    // source_type: participant_report | professional_observation | framework_reading | recurrence_association | cer_integrative_hypothesis | participant_recognition
    // access_class: participant_private | participant_shared | professional_private | shared_care | administrative | system_internal
    // status: active | archived | superseded | rejected
    //
    // RLS:
    // Participante lê se for do seu enrollment e access_class != professional_private.
    // Profissional lê se houver vínculo ativo no enrollment E access_class in ['shared_care', 'participant_shared'].
    // Participante cria se enrollment for seu e created_by_user_id for ele mesmo.
    // Participante/Profissional atualiza de acordo com o vínculo e permissão.
    // Platform admin técnico NÃO tem leitura automática de conteúdo sensível.
    const signalsCol = new Collection({
      name: 'cer_signals',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && created_by_user_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id",
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
          name: 'signal_type',
          type: 'select',
          required: true,
          values: [
            'resource',
            'challenge',
            'protection_pattern',
            'current_state',
            'value_meaning',
            'realization_relevant',
            'context',
          ],
          maxSelect: 1,
        },
        { name: 'concept_key', type: 'text', required: true },
        {
          name: 'dimension_id',
          type: 'relation',
          collectionId: dimensionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'temporality',
          type: 'select',
          required: true,
          values: [
            'current',
            'historical',
            'recurring',
            'context_dependent',
            'longitudinal',
            'undetermined',
          ],
          maxSelect: 1,
        },
        {
          name: 'source_type',
          type: 'select',
          required: true,
          values: [
            'participant_report',
            'professional_observation',
            'framework_reading',
            'recurrence_association',
            'cer_integrative_hypothesis',
            'participant_recognition',
          ],
          maxSelect: 1,
        },
        {
          name: 'source_response_id',
          type: 'relation',
          collectionId: responsesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'source_prompt_id',
          type: 'relation',
          collectionId: promptsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'source_experience_id',
          type: 'relation',
          collectionId: experiencesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'framework_id',
          type: 'relation',
          collectionId: frameworksCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'created_by_user_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'access_class',
          type: 'select',
          required: true,
          values: [
            'participant_private',
            'participant_shared',
            'professional_private',
            'shared_care',
            'administrative',
            'system_internal',
          ],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['active', 'archived', 'superseded', 'rejected'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_signals_enrollment ON cer_signals (enrollment_id)',
        'CREATE INDEX idx_signals_concept ON cer_signals (concept_key)',
        'CREATE INDEX idx_signals_source_resp ON cer_signals (source_response_id)',
      ],
    })
    app.save(signalsCol)
  },
  (app) => {
    try {
      const sig = app.findCollectionByNameOrId('cer_signals')
      app.delete(sig)
    } catch (_) {}

    try {
      const rules = app.findCollectionByNameOrId('cer_prompt_signal_rules')
      app.delete(rules)
    } catch (_) {}

    try {
      const fw = app.findCollectionByNameOrId('cer_frameworks')
      app.delete(fw)
    } catch (_) {}
  },
)
