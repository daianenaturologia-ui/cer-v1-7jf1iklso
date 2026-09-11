migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0038: cer_practices, cer_practice_versions, cer_practice_variants
    // 1. cer_practices (identidade estável da prática)
    // Regras: deleteRule = null (zero delete físico)
    // is_system_curated: bool (V1 sempre true)
    // governance_modes: multi-select (self_guided, group_guided, professional_guided, supervised_only, session_only)
    // status: draft | active | deprecated | retired
    const practicesCol = new Collection({
      name: 'cer_practices',
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
          name: 'internal_name',
          type: 'text',
          required: true,
        },
        {
          name: 'participant_facing_name_base',
          type: 'text',
          required: true,
        },
        {
          name: 'family',
          type: 'text',
          required: true,
        },
        {
          name: 'target_concept_keys',
          type: 'json',
          required: false,
        },
        {
          name: 'governance_modes',
          type: 'select',
          required: true,
          values: [
            'self_guided',
            'group_guided',
            'professional_guided',
            'supervised_only',
            'session_only',
          ],
          maxSelect: 5,
        },
        {
          name: 'is_system_curated',
          type: 'bool',
          required: false,
        },
        {
          name: 'provenance_editorial',
          type: 'json',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'active', 'deprecated', 'retired'],
          maxSelect: 1,
        },
        {
          name: 'created_by_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cp_internal_name ON cer_practices (internal_name)',
        'CREATE INDEX idx_cp_family ON cer_practices (family)',
        'CREATE INDEX idx_cp_status ON cer_practices (status)',
      ],
    })
    app.save(practicesCol)

    const savedPracticesCol = app.findCollectionByNameOrId('cer_practices')

    // 2. cer_practice_versions (âncora operacional imutável)
    // Lifecycle: draft | active | deprecated | retired
    // Intensity: low | moderate | high | expansive
    // Consent_required: not_required | required | conditional
    // Context allowlist tags: morning | evening | during_overload | after_conflict | home | work | in_session | paired_with_practice | accompanied_only | stable_only | other_context
    // Dose fields TODOS opcionais nomeados
    const practiceVersionsCol = new Collection({
      name: 'cer_practice_versions',
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
          name: 'practice_id',
          type: 'relation',
          required: true,
          collectionId: savedPracticesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'version_number',
          type: 'number',
          required: true,
          onlyInt: true,
        },
        {
          name: 'previous_version_id',
          type: 'text',
          required: false,
        },
        {
          name: 'participant_title',
          type: 'text',
          required: true,
        },
        {
          name: 'participant_summary',
          type: 'text',
          required: false,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
        },
        {
          name: 'instructions',
          type: 'text',
          required: false,
        },
        {
          name: 'preparation',
          type: 'text',
          required: false,
        },
        {
          name: 'stop_conditions',
          type: 'text',
          required: false,
        },
        {
          name: 'grounding',
          type: 'text',
          required: false,
        },
        {
          name: 'integration',
          type: 'text',
          required: false,
        },
        {
          name: 'intent_goal',
          type: 'text',
          required: false,
        },
        {
          name: 'context_tags',
          type: 'select',
          required: false,
          values: [
            'morning',
            'evening',
            'during_overload',
            'after_conflict',
            'home',
            'work',
            'in_session',
            'paired_with_practice',
            'accompanied_only',
            'stable_only',
            'other_context',
          ],
          maxSelect: 11,
        },
        {
          name: 'other_context_text',
          type: 'text',
          required: false,
        },
        // Dose fields TODOS opcionais (nomeados, sem JSON opaco)
        {
          name: 'duration',
          type: 'text',
          required: false,
        },
        {
          name: 'frequency',
          type: 'text',
          required: false,
        },
        {
          name: 'repetitions',
          type: 'text',
          required: false,
        },
        {
          name: 'quantity',
          type: 'text',
          required: false,
        },
        {
          name: 'time_window',
          type: 'text',
          required: false,
        },
        {
          name: 'progression',
          type: 'text',
          required: false,
        },
        {
          name: 'rest',
          type: 'text',
          required: false,
        },
        {
          name: 'max_exposure',
          type: 'text',
          required: false,
        },
        {
          name: 'guidance_requirements',
          type: 'text',
          required: false,
        },
        {
          name: 'intensity',
          type: 'select',
          required: true,
          values: ['low', 'moderate', 'high', 'expansive'],
          maxSelect: 1,
        },
        {
          name: 'consent_required',
          type: 'select',
          required: true,
          values: ['not_required', 'required', 'conditional'],
          maxSelect: 1,
        },
        {
          name: 'author_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'reviewer_user_id',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'reviewed_at',
          type: 'date',
          required: false,
        },
        {
          name: 'safety_reviewed_at',
          type: 'date',
          required: false,
        },
        {
          name: 'review_due_at',
          type: 'date',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'active', 'deprecated', 'retired'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpv_practice ON cer_practice_versions (practice_id)',
        'CREATE INDEX idx_cpv_version ON cer_practice_versions (practice_id, version_number)',
        'CREATE INDEX idx_cpv_status ON cer_practice_versions (status)',
      ],
    })
    app.save(practiceVersionsCol)

    const savedPracticeVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')

    // 3. cer_practice_variants (adaptação ou dose legítima referenciando practice_version_id)
    // variant_type: ideal | adapted | minimal_possible
    const practiceVariantsCol = new Collection({
      name: 'cer_practice_variants',
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
          collectionId: savedPracticeVersionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'variant_type',
          type: 'select',
          required: true,
          values: ['ideal', 'adapted', 'minimal_possible'],
          maxSelect: 1,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
        },
        {
          name: 'duration',
          type: 'text',
          required: false,
        },
        {
          name: 'frequency',
          type: 'text',
          required: false,
        },
        {
          name: 'repetitions',
          type: 'text',
          required: false,
        },
        {
          name: 'quantity',
          type: 'text',
          required: false,
        },
        {
          name: 'notes',
          type: 'text',
          required: false,
        },
        {
          name: 'created_by_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cvar_version ON cer_practice_variants (practice_version_id)',
        'CREATE INDEX idx_cvar_type ON cer_practice_variants (variant_type)',
      ],
    })
    app.save(practiceVariantsCol)
  },
  (app) => {
    try {
      const vCol = app.findCollectionByNameOrId('cer_practice_variants')
      app.delete(vCol)
    } catch (_) {}
    try {
      const pvCol = app.findCollectionByNameOrId('cer_practice_versions')
      app.delete(pvCol)
    } catch (_) {}
    try {
      const pCol = app.findCollectionByNameOrId('cer_practices')
      app.delete(pCol)
    } catch (_) {}
  },
)
