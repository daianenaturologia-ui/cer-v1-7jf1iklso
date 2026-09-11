migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const personsCol = app.findCollectionByNameOrId('persons')
    const prioritiesCol = app.findCollectionByNameOrId('cer_care_plan_priorities')
    const cyclesCol = app.findCollectionByNameOrId('cer_care_cycles')
    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')
    const variantsCol = app.findCollectionByNameOrId('cer_practice_variants')
    const safetyChecksCol = app.findCollectionByNameOrId('cer_practice_safety_checks')
    const consentsCol = app.findCollectionByNameOrId('cer_practice_consents')
    const acceptancesCol = app.findCollectionByNameOrId('cer_operational_acceptances')
    const proposalsCol = app.findCollectionByNameOrId('cer_ai_proposals')

    // 1. ALTERAR persons: adicionar campo timezone (text, nullable, IANA)
    if (!personsCol.fields.getByName('timezone')) {
      personsCol.fields.add(
        new TextField({
          name: 'timezone',
          required: false,
        }),
      )
      app.save(personsCol)
    }

    // 2. ALTERAR cer_ai_proposals: adicionar assignment_adaptation_suggestion ao select proposal_type
    const typeField = proposalsCol.fields.getByName('proposal_type')
    if (typeField) {
      typeField.values = [
        'association_suggestion',
        'knowledge_suggestion',
        'integrative_hypothesis',
        'priority_suggestion',
        'practice_candidate_suggestion',
        'assignment_adaptation_suggestion',
      ]
      app.save(proposalsCol)
    }

    // 3. CRIAR cer_practice_assignments
    // Lifecycle: draft | active | paused | completed | stopped | superseded
    // Delete físico: deleteRule = null
    const assignmentsCol = new Collection({
      name: 'cer_practice_assignments',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
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
          name: 'care_plan_priority_id',
          type: 'relation',
          required: true,
          collectionId: prioritiesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'care_cycle_id',
          type: 'relation',
          required: true,
          collectionId: cyclesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'practice_version_id',
          type: 'relation',
          required: true,
          collectionId: practiceVersionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'variant_id',
          type: 'relation',
          required: false,
          collectionId: variantsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'safety_check_id',
          type: 'relation',
          required: true,
          collectionId: safetyChecksCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'consent_id',
          type: 'relation',
          required: false,
          collectionId: consentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'operational_acceptance_id',
          type: 'relation',
          required: true,
          collectionId: acceptancesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'assigned_by_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'previous_assignment_id',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'active', 'paused', 'completed', 'stopped', 'superseded'],
          maxSelect: 1,
        },
        {
          name: 'stop_reason_code',
          type: 'text',
          required: false,
        },
        {
          name: 'internal_title',
          type: 'text',
          required: true,
        },
        {
          name: 'internal_context',
          type: 'text',
          required: false,
        },
        {
          name: 'participant_safe_title',
          type: 'text',
          required: true,
        },
        {
          name: 'participant_safe_summary',
          type: 'text',
          required: false,
        },
        {
          name: 'assigned_duration',
          type: 'text',
          required: false,
        },
        {
          name: 'assigned_frequency',
          type: 'text',
          required: false,
        },
        {
          name: 'assigned_repetitions',
          type: 'text',
          required: false,
        },
        {
          name: 'assigned_quantity',
          type: 'text',
          required: false,
        },
        {
          name: 'assigned_time_window',
          type: 'text',
          required: false,
        },
        {
          name: 'context_tags',
          type: 'json',
          required: false,
        },
        {
          name: 'participant_response_type',
          type: 'select',
          required: false,
          values: ['confirmed', 'wants_adaptation', 'too_much_right_now', 'not_now', 'unconfirmed'],
          maxSelect: 1,
        },
        {
          name: 'capacity_response',
          type: 'select',
          required: false,
          values: [
            'cabe_bem',
            'cabe_se_adaptar',
            'parece_demais',
            'nao_cabe_agora',
            'ainda_nao_sei',
          ],
          maxSelect: 1,
        },
        {
          name: 'confirmed_at',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpa_enrollment ON cer_practice_assignments (enrollment_id)',
        'CREATE INDEX idx_cpa_priority ON cer_practice_assignments (care_plan_priority_id)',
        'CREATE INDEX idx_cpa_cycle ON cer_practice_assignments (care_cycle_id)',
        'CREATE INDEX idx_cpa_version ON cer_practice_assignments (practice_version_id)',
        'CREATE INDEX idx_cpa_status ON cer_practice_assignments (status)',
      ],
    })
    app.save(assignmentsCol)

    const savedAssignmentsCol = app.findCollectionByNameOrId('cer_practice_assignments')

    // 4. CRIAR cer_planner_items
    // Lifecycle: planned | active | completed | cancelled | superseded
    // item_type: scheduled_action | flexible_practice | contextual_resource | session_linked
    // scheduling_mode: exact | window | flexible | contextual | session_linked
    // daypart: morning | afternoon | evening | any
    // Delete físico: deleteRule = null
    const plannerItemsCol = new Collection({
      name: 'cer_planner_items',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      updateRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      deleteRule: null,
      fields: [
        {
          name: 'assignment_id',
          type: 'relation',
          required: true,
          collectionId: savedAssignmentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
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
          name: 'care_cycle_id',
          type: 'relation',
          required: true,
          collectionId: cyclesCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'safe_title',
          type: 'text',
          required: true,
        },
        {
          name: 'safe_summary',
          type: 'text',
          required: false,
        },
        {
          name: 'item_type',
          type: 'select',
          required: true,
          values: [
            'scheduled_action',
            'flexible_practice',
            'contextual_resource',
            'session_linked',
          ],
          maxSelect: 1,
        },
        {
          name: 'scheduling_mode',
          type: 'select',
          required: true,
          values: ['exact', 'window', 'flexible', 'contextual', 'session_linked'],
          maxSelect: 1,
        },
        {
          name: 'scheduled_at',
          type: 'date',
          required: false,
        },
        {
          name: 'window_start',
          type: 'date',
          required: false,
        },
        {
          name: 'window_end',
          type: 'date',
          required: false,
        },
        {
          name: 'daypart',
          type: 'select',
          required: false,
          values: ['morning', 'afternoon', 'evening', 'any'],
          maxSelect: 1,
        },
        {
          name: 'timezone_snapshot',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['planned', 'active', 'completed', 'cancelled', 'superseded'],
          maxSelect: 1,
        },
        {
          name: 'created_by',
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
        'CREATE INDEX idx_cpi_assignment ON cer_planner_items (assignment_id)',
        'CREATE INDEX idx_cpi_enrollment ON cer_planner_items (enrollment_id)',
        'CREATE INDEX idx_cpi_cycle ON cer_planner_items (care_cycle_id)',
        'CREATE INDEX idx_cpi_status ON cer_planner_items (status)',
        'CREATE INDEX idx_cpi_scheduled ON cer_planner_items (scheduled_at)',
      ],
    })
    app.save(plannerItemsCol)

    // 5. FEATURE FLAG build_08d
    const ffCol = app.findCollectionByNameOrId('feature_flags')
    try {
      app.findFirstRecordByData('feature_flags', 'key', 'build_08d')
    } catch (_) {
      const rec = new Record(ffCol)
      rec.set('key', 'build_08d')
      rec.set('name', 'Build 08D — Practice Assignment & Minimal Planner')
      rec.set(
        'description',
        'Atribuição de práticas (Assignment), experimento de cuidado, confirmação, dose/bounds e planner mínimo com janela operacional.',
      )
      rec.set('is_enabled', true)
      rec.set(
        'metadata',
        JSON.stringify({
          version: '08d',
          freeze_status: 'candidate',
          collections_count: 2,
          entities: ['cer_practice_assignments', 'cer_planner_items'],
        }),
      )
      app.save(rec)
    }
  },
  (app) => {
    try {
      const ffRec = app.findFirstRecordByData('feature_flags', 'key', 'build_08d')
      app.delete(ffRec)
    } catch (_) {}

    try {
      const pCol = app.findCollectionByNameOrId('cer_planner_items')
      app.delete(pCol)
    } catch (_) {}

    try {
      const aCol = app.findCollectionByNameOrId('cer_practice_assignments')
      app.delete(aCol)
    } catch (_) {}

    try {
      const proposalsCol = app.findCollectionByNameOrId('cer_ai_proposals')
      const typeField = proposalsCol.fields.getByName('proposal_type')
      if (typeField) {
        typeField.values = [
          'association_suggestion',
          'knowledge_suggestion',
          'integrative_hypothesis',
          'priority_suggestion',
          'practice_candidate_suggestion',
        ]
        app.save(proposalsCol)
      }
    } catch (_) {}

    try {
      const personsCol = app.findCollectionByNameOrId('persons')
      const tzField = personsCol.fields.getByName('timezone')
      if (tzField) {
        personsCol.fields.removeByName('timezone')
        app.save(personsCol)
      }
    } catch (_) {}
  },
)
