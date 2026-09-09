migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')

    // 1. Criar cer_sessions
    // Regras de RLS:
    // Participante: ZERO acesso no 04A (listRule, viewRule, createRule, updateRule, deleteRule = null para participante)
    // Profissional: list/view permitido para profissional com vínculo ativo no enrollment
    // Create: profissional com vínculo ativo
    // Update: profissional com vínculo ativo
    // Delete: nulo (deleteRule = null)
    const sessionsCol = new Collection({
      name: 'cer_sessions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
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
          name: 'professional_user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'scheduled_at',
          type: 'date',
          required: false,
        },
        {
          name: 'started_at',
          type: 'date',
          required: false,
        },
        {
          name: 'completed_at',
          type: 'date',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['scheduled', 'in_progress', 'completed', 'cancelled'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cer_sessions_enrollment ON cer_sessions (enrollment_id)',
        'CREATE INDEX idx_cer_sessions_professional ON cer_sessions (professional_user_id)',
        'CREATE INDEX idx_cer_sessions_status ON cer_sessions (status)',
      ],
    })
    app.save(sessionsCol)

    const savedSessionsCol = app.findCollectionByNameOrId('cer_sessions')

    // 2. Criar cer_session_notes
    // Regras de RLS:
    // Participante: ZERO list, ZERO view, ZERO create, ZERO update, ZERO delete
    // Profissional: acesso estrito POR AUTOR (author_user_id = @request.auth.id) com vínculo ativo no enrollment
    // Delete: nulo (deleteRule = null)
    // UMA nota canônica por session_id (UNIQUE INDEX idx_cer_session_notes_session)
    const notesCol = new Collection({
      name: 'cer_session_notes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && author_user_id = @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && author_user_id = @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      createRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && author_user_id = @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      deleteRule: null,
      fields: [
        {
          name: 'session_id',
          type: 'relation',
          required: true,
          collectionId: savedSessionsCol.id,
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
          name: 'author_user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'text',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_cer_session_notes_session ON cer_session_notes (session_id)',
        'CREATE INDEX idx_cer_session_notes_enrollment ON cer_session_notes (enrollment_id)',
        'CREATE INDEX idx_cer_session_notes_author ON cer_session_notes (author_user_id)',
      ],
    })
    app.save(notesCol)
  },
  (app) => {
    try {
      const notesCol = app.findCollectionByNameOrId('cer_session_notes')
      app.delete(notesCol)
    } catch (_) {}

    try {
      const sessionsCol = app.findCollectionByNameOrId('cer_sessions')
      app.delete(sessionsCol)
    } catch (_) {}
  },
)
