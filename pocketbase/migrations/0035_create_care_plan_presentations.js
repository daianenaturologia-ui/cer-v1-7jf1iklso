migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const carePlansCol = app.findCollectionByNameOrId('cer_care_plans')
    const prioritiesCol = app.findCollectionByNameOrId('cer_care_plan_priorities')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0035: cer_care_plan_presentations
    // Canal canônico participant-facing para Plano / Prioridade.
    // NÃO reutiliza Presentation de Knowledge. NÃO transforma Priority em Knowledge.
    // Lifecycle: draft | presented | withdrawn | superseded
    // Campos autorados pelo profissional: participant_title, participant_summary, etc.
    // professional_rationale NÃO aparece automaticamente.
    // RLS:
    // - Participante: list/view SOMENTE status=presented do próprio enrollment. create/update/delete: null
    // - Profissional com vínculo ativo: list/view de todos os status, create de draft, update (regras controladas por hook)
    const presentationsCol = new Collection({
      name: 'cer_care_plan_presentations',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((status = 'presented' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((status = 'presented' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
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
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'presented', 'withdrawn', 'superseded'],
          maxSelect: 1,
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
          name: 'practical_invitation',
          type: 'text',
          required: false,
        },
        {
          name: 'presented_at',
          type: 'date',
          required: false,
        },
        {
          name: 'withdrawn_at',
          type: 'date',
          required: false,
        },
        {
          name: 'channel',
          type: 'select',
          required: true,
          values: ['app', 'session'],
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
        'CREATE INDEX idx_ccppres_enrollment ON cer_care_plan_presentations (enrollment_id)',
        'CREATE INDEX idx_ccppres_plan ON cer_care_plan_presentations (plan_id)',
        'CREATE INDEX idx_ccppres_priority ON cer_care_plan_presentations (priority_id)',
        'CREATE INDEX idx_ccppres_status ON cer_care_plan_presentations (status)',
      ],
    })
    app.save(presentationsCol)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cer_care_plan_presentations')
      app.delete(col)
    } catch (_) {}
  },
)
