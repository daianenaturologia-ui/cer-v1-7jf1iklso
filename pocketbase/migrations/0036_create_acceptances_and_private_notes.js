migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const carePlansCol = app.findCollectionByNameOrId('cer_care_plans')
    const prioritiesCol = app.findCollectionByNameOrId('cer_care_plan_priorities')
    const presentationsCol = app.findCollectionByNameOrId('cer_care_plan_presentations')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0036: cer_operational_acceptances e cer_operational_acceptance_private_notes
    // 1. cer_operational_acceptances
    // response_type (7 valores congelados): accepted | wants_to_try | too_much | wants_to_adapt | not_now | alternative_requested | wants_to_talk
    // access_class lockado no schema como shared_care (proibido participant_private para a resposta operacional)
    // record_status: current | superseded
    // RLS:
    // - Participante pode criar e ver suas próprias respostas
    // - Profissional com vínculo ativo pode ver (shared_care)
    // - update/delete nulos (nova decisão gera nova linha com anterior superseded)
    const acceptancesCol = new Collection({
      name: 'cer_operational_acceptances',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id", // controlado por hook para supersede
      deleteRule: null,
      fields: [
        {
          name: 'presentation_id',
          type: 'relation',
          required: true,
          collectionId: presentationsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'plan_id',
          type: 'relation',
          required: true,
          collectionId: carePlansCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'priority_id',
          type: 'relation',
          required: false,
          collectionId: prioritiesCol.id,
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
          name: 'response_type',
          type: 'select',
          required: true,
          values: [
            'accepted',
            'wants_to_try',
            'too_much',
            'wants_to_adapt',
            'not_now',
            'alternative_requested',
            'wants_to_talk',
          ],
          maxSelect: 1,
        },
        {
          name: 'shared_comment',
          type: 'text',
          required: false,
        },
        {
          name: 'access_class',
          type: 'select',
          required: true,
          values: ['shared_care'],
          maxSelect: 1,
        },
        {
          name: 'record_status',
          type: 'select',
          required: true,
          values: ['current', 'superseded'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_coa_enrollment ON cer_operational_acceptances (enrollment_id)',
        'CREATE INDEX idx_coa_presentation ON cer_operational_acceptances (presentation_id)',
        'CREATE INDEX idx_coa_status ON cer_operational_acceptances (record_status)',
      ],
    })
    app.save(acceptancesCol)

    const savedAcceptancesCol = app.findCollectionByNameOrId('cer_operational_acceptances')

    // 2. cer_operational_acceptance_private_notes
    // Regras Declarativas PARTICIPANT-ONLY:
    // listRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // viewRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // deleteRule: null
    // ZERO list, ZERO view, ZERO expand, ZERO read para o papel profissional!
    const privateNotesCol = new Collection({
      name: 'cer_operational_acceptance_private_notes',
      type: 'base',
      listRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      deleteRule: null,
      fields: [
        {
          name: 'acceptance_id',
          type: 'relation',
          required: true,
          collectionId: savedAcceptancesCol.id,
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
        'CREATE INDEX idx_coapn_acceptance ON cer_operational_acceptance_private_notes (acceptance_id)',
        'CREATE INDEX idx_coapn_participant ON cer_operational_acceptance_private_notes (participant_user_id)',
        'CREATE INDEX idx_coapn_status ON cer_operational_acceptance_private_notes (status)',
      ],
    })
    app.save(privateNotesCol)
  },
  (app) => {
    try {
      const pnCol = app.findCollectionByNameOrId('cer_operational_acceptance_private_notes')
      app.delete(pnCol)
    } catch (_) {}
    try {
      const aCol = app.findCollectionByNameOrId('cer_operational_acceptances')
      app.delete(aCol)
    } catch (_) {}
  },
)
