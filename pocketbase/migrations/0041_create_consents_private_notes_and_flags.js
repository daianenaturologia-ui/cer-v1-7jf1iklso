migrate(
  (app) => {
    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0041: cer_practice_consents, cer_practice_consent_private_notes + enum extension + feature flag build_08c
    // 11. cer_practice_consents
    // Anchor EXATO a practice_version_id
    // understanding_response: understood | want_to_ask | did_not_understand | do_not_want | want_alternative
    // decision: accepted | declined
    // record_status: current | withdrawn | superseded (REMOVIDO: expired)
    // deleteRule = null
    const practiceConsentsCol = new Collection({
      name: 'cer_practice_consents',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
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
          name: 'consent_text_version_ref',
          type: 'text',
          required: false,
        },
        {
          name: 'risks_cautions_shown',
          type: 'json',
          required: false,
        },
        {
          name: 'understanding_response',
          type: 'select',
          required: true,
          values: [
            'understood',
            'want_to_ask',
            'did_not_understand',
            'do_not_want',
            'want_alternative',
          ],
          maxSelect: 1,
        },
        {
          name: 'decision',
          type: 'select',
          required: true,
          values: ['accepted', 'declined'],
          maxSelect: 1,
        },
        {
          name: 'questions_opportunity',
          type: 'bool',
          required: false,
        },
        {
          name: 'context_notes',
          type: 'text',
          required: false,
        },
        {
          name: 'record_status',
          type: 'select',
          required: true,
          values: ['current', 'withdrawn', 'superseded'],
          maxSelect: 1,
        },
        {
          name: 'withdrawn_at',
          type: 'date',
          required: false,
        },
        {
          name: 'withdrawal_reason',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpc_version ON cer_practice_consents (practice_version_id)',
        'CREATE INDEX idx_cpc_participant ON cer_practice_consents (participant_user_id)',
        'CREATE INDEX idx_cpc_enrollment ON cer_practice_consents (enrollment_id)',
        'CREATE INDEX idx_cpc_status ON cer_practice_consents (record_status)',
      ],
    })
    app.save(practiceConsentsCol)

    const savedPracticeConsentsCol = app.findCollectionByNameOrId('cer_practice_consents')

    // 12. cer_practice_consent_private_notes (isolamento participant-only estrito idêntico à migration 0036)
    // ZERO list, ZERO view, ZERO expand, ZERO read para o papel profissional!
    // deleteRule = null
    const practiceConsentPrivateNotesCol = new Collection({
      name: 'cer_practice_consent_private_notes',
      type: 'base',
      listRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      deleteRule: null,
      fields: [
        {
          name: 'consent_id',
          type: 'relation',
          required: true,
          collectionId: savedPracticeConsentsCol.id,
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
        'CREATE INDEX idx_cpcn_consent ON cer_practice_consent_private_notes (consent_id)',
        'CREATE INDEX idx_cpcn_participant ON cer_practice_consent_private_notes (participant_user_id)',
        'CREATE INDEX idx_cpcn_status ON cer_practice_consent_private_notes (status)',
      ],
    })
    app.save(practiceConsentPrivateNotesCol)

    // 13. Enum Extension em cer_ai_proposals.proposal_type += 'practice_candidate_suggestion'
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

    // 14. Feature Flag build_08c
    const ffCol = app.findCollectionByNameOrId('feature_flags')
    try {
      app.findFirstRecordByData('feature_flags', 'key', 'build_08c')
    } catch (_) {
      const rec = new Record(ffCol)
      rec.set('key', 'build_08c')
      rec.set('name', 'Build 08C — Practice Library & Safety Gates')
      rec.set(
        'description',
        'Biblioteca de práticas, versões, variantes, frameworks, evidências, perfis e regras de segurança, safety checks dinâmicos e consentimento.',
      )
      rec.set('is_enabled', true)
      rec.set(
        'metadata',
        JSON.stringify({
          version: '08c',
          freeze_status: 'candidate',
          collections_count: 12,
          entities: [
            'cer_practices',
            'cer_practice_versions',
            'cer_practice_variants',
            'cer_practice_frameworks',
            'cer_practice_evidence',
            'cer_practice_evidence_sources',
            'cer_practice_safety_profiles',
            'cer_practice_safety_rules',
            'cer_practice_safety_checks',
            'cer_practice_safety_check_sources',
            'cer_practice_consents',
            'cer_practice_consent_private_notes',
          ],
        }),
      )
      app.save(rec)
    }
  },
  (app) => {
    try {
      const ffRec = app.findFirstRecordByData('feature_flags', 'key', 'build_08c')
      app.delete(ffRec)
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
        ]
        app.save(proposalsCol)
      }
    } catch (_) {}

    try {
      const pnCol = app.findCollectionByNameOrId('cer_practice_consent_private_notes')
      app.delete(pnCol)
    } catch (_) {}
    try {
      const cCol = app.findCollectionByNameOrId('cer_practice_consents')
      app.delete(cCol)
    } catch (_) {}
  },
)
