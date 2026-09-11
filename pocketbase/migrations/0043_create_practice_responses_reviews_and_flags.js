migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const cyclesCol = app.findCollectionByNameOrId('cer_care_cycles')
    const assignmentsCol = app.findCollectionByNameOrId('cer_practice_assignments')
    const plannerItemsCol = app.findCollectionByNameOrId('cer_planner_items')
    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')

    // 1. CRIAR cer_practice_responses
    // Operacional e SHARED_CARE. deleteRule = null.
    // response_type: helped | helped_a_bit | no_perceived_difference | was_difficult | was_too_much | could_not_do | chose_not_to_do | adapted | did_not_make_sense | wants_to_tell
    // safety_flag: none | needs_review | escalation_required
    // record_status: current | superseded
    const responsesCol = new Collection({
      name: 'cer_practice_responses',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      deleteRule: null,
      fields: [
        {
          name: 'assignment_id',
          type: 'relation',
          required: true,
          collectionId: assignmentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'planner_item_id',
          type: 'relation',
          required: false,
          collectionId: plannerItemsCol.id,
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
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
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
          name: 'response_type',
          type: 'select',
          required: true,
          values: [
            'helped',
            'helped_a_bit',
            'no_perceived_difference',
            'was_difficult',
            'was_too_much',
            'could_not_do',
            'chose_not_to_do',
            'adapted',
            'did_not_make_sense',
            'wants_to_tell',
          ],
          maxSelect: 1,
        },
        {
          name: 'perceived_helpfulness',
          type: 'number',
          required: false,
          min: 1,
          max: 5,
        },
        {
          name: 'difficulty',
          type: 'number',
          required: false,
          min: 1,
          max: 5,
        },
        {
          name: 'adaptation_used',
          type: 'text',
          required: false,
        },
        {
          name: 'wants_to_continue',
          type: 'bool',
          required: false,
        },
        {
          name: 'safety_flag',
          type: 'select',
          required: true,
          values: ['none', 'needs_review', 'escalation_required'],
          maxSelect: 1,
        },
        {
          name: 'shared_reflection',
          type: 'text',
          required: false,
        },
        {
          name: 'record_status',
          type: 'select',
          required: true,
          values: ['current', 'superseded'],
          maxSelect: 1,
        },
        {
          name: 'previous_response_id',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpr_assignment ON cer_practice_responses (assignment_id)',
        'CREATE INDEX idx_cpr_enrollment ON cer_practice_responses (enrollment_id)',
        'CREATE INDEX idx_cpr_cycle ON cer_practice_responses (care_cycle_id)',
        'CREATE INDEX idx_cpr_participant ON cer_practice_responses (participant_user_id)',
        'CREATE INDEX idx_cpr_status ON cer_practice_responses (record_status)',
        'CREATE INDEX idx_cpr_safety ON cer_practice_responses (safety_flag)',
      ],
    })
    app.save(responsesCol)

    const savedResponsesCol = app.findCollectionByNameOrId('cer_practice_responses')

    // 2. CRIAR cer_practice_response_private_notes
    // Isolamento participante estrito (participant-only). deleteRule = null.
    // Zero list, view, expand para profissional.
    const responsePrivateNotesCol = new Collection({
      name: 'cer_practice_response_private_notes',
      type: 'base',
      listRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      deleteRule: null,
      fields: [
        {
          name: 'response_id',
          type: 'relation',
          required: true,
          collectionId: savedResponsesCol.id,
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
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'note_text',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['current', 'superseded'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cprpn_response ON cer_practice_response_private_notes (response_id)',
        'CREATE INDEX idx_cprpn_participant ON cer_practice_response_private_notes (participant_user_id)',
        'CREATE INDEX idx_cprpn_enrollment ON cer_practice_response_private_notes (enrollment_id)',
        'CREATE INDEX idx_cprpn_status ON cer_practice_response_private_notes (status)',
      ],
    })
    app.save(responsePrivateNotesCol)

    // 3. CRIAR cer_cycle_reviews
    // Status: draft | completed. deleteRule = null.
    // Decisão explícita clínica humana: continue | extend | adapt | close | carry_forward | change_priority | review_plan
    // Sem cycle_digest_ref, sem participant_input_ref (Digest é on-demand read-model).
    const cycleReviewsCol = new Collection({
      name: 'cer_cycle_reviews',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((created_by_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((created_by_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
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
          name: 'care_cycle_id',
          type: 'relation',
          required: true,
          collectionId: cyclesCol.id,
          cascadeDelete: false,
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
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'completed'],
          maxSelect: 1,
        },
        {
          name: 'decision',
          type: 'select',
          required: false,
          values: [
            'continue',
            'extend',
            'adapt',
            'close',
            'carry_forward',
            'change_priority',
            'review_plan',
          ],
          maxSelect: 1,
        },
        {
          name: 'participant_highlights',
          type: 'text',
          required: false,
        },
        {
          name: 'professional_summary',
          type: 'text',
          required: false,
        },
        {
          name: 'participant_review_invited_at',
          type: 'date',
          required: false,
        },
        {
          name: 'participant_review_completed_at',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ccr_enrollment ON cer_cycle_reviews (enrollment_id)',
        'CREATE INDEX idx_ccr_cycle ON cer_cycle_reviews (care_cycle_id)',
        'CREATE INDEX idx_ccr_status ON cer_cycle_reviews (status)',
      ],
    })
    app.save(cycleReviewsCol)

    // 4. FEATURE FLAG build_08e
    const ffCol = app.findCollectionByNameOrId('feature_flags')
    try {
      app.findFirstRecordByData('feature_flags', 'key', 'build_08e')
    } catch (_) {
      const rec = new Record(ffCol)
      rec.set('key', 'build_08e')
      rec.set('name', 'Build 08E — Resposta ao Experimento, Ajuste & Mandala V1')
      rec.set(
        'description',
        'Resposta ao experimento de prática, ajuste terapêutico, revisão de ciclo, evolução longitudinal e Mandala V1 estruturada como read-model.',
      )
      rec.set('is_enabled', true)
      rec.set(
        'metadata',
        JSON.stringify({
          version: '08e',
          freeze_status: 'candidate',
          collections_count: 3,
          entities: [
            'cer_practice_responses',
            'cer_practice_response_private_notes',
            'cer_cycle_reviews',
          ],
        }),
      )
      app.save(rec)
    }
  },
  (app) => {
    try {
      const ffRec = app.findFirstRecordByData('feature_flags', 'key', 'build_08e')
      app.delete(ffRec)
    } catch (_) {}

    try {
      const crCol = app.findCollectionByNameOrId('cer_cycle_reviews')
      app.delete(crCol)
    } catch (_) {}
    try {
      const rpnCol = app.findCollectionByNameOrId('cer_practice_response_private_notes')
      app.delete(rpnCol)
    } catch (_) {}
    try {
      const rCol = app.findCollectionByNameOrId('cer_practice_responses')
      app.delete(rCol)
    } catch (_) {}
  },
)
