migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const carePlansCol = app.findCollectionByNameOrId('cer_care_plans')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0034: cer_care_cycles
    // Entidade operacional de ciclo de cuidado.
    // Lifecycle: planned | active | paused | closed (NÃO existe estado extended — extend/shorten são eventos)
    // Suportar: start, extend, shorten, pause, resume, close.
    // ZERO default arquitetural de 14 dias (nenhum default).
    // review_event_type: session | participant_checkin | scheduled | manual | future_condition
    // capacity_context_ref: referência opcional à resposta de capacidade (ExperienceResponse)
    const careCyclesCol = new Collection({
      name: 'cer_care_cycles',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((plan_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((plan_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
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
          name: 'cycle_number',
          type: 'number',
          required: true,
          onlyInt: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['planned', 'active', 'paused', 'closed'],
          maxSelect: 1,
        },
        {
          name: 'start_date',
          type: 'date',
          required: false,
        },
        {
          name: 'planned_end_date',
          type: 'date',
          required: false,
        },
        {
          name: 'extended_until',
          type: 'date',
          required: false,
        },
        {
          name: 'closed_at',
          type: 'date',
          required: false,
        },
        {
          name: 'review_event_type',
          type: 'select',
          required: true,
          values: ['session', 'participant_checkin', 'scheduled', 'manual', 'future_condition'],
          maxSelect: 1,
        },
        {
          name: 'capacity_context_ref',
          type: 'text',
          required: false,
        },
        {
          name: 'focus_summary',
          type: 'text',
          required: false,
        },
        {
          name: 'professional_notes',
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
        'CREATE INDEX idx_ccc_enrollment ON cer_care_cycles (enrollment_id)',
        'CREATE INDEX idx_ccc_plan ON cer_care_cycles (plan_id)',
        'CREATE INDEX idx_ccc_status ON cer_care_cycles (status)',
      ],
    })
    app.save(careCyclesCol)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cer_care_cycles')
      app.delete(col)
    } catch (_) {}
  },
)
