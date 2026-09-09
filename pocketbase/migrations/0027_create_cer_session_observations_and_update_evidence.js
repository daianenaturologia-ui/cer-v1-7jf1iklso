migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const sessionsCol = app.findCollectionByNameOrId('cer_sessions')

    // 1. Criar collection cer_session_observations
    // Decisões Congeladas:
    // - session_id (relation obrigatória -> cer_sessions)
    // - enrollment_id (relation obrigatória -> enrollments)
    // - recorded_by_user_id (relation obrigatória -> users/_pb_users_auth_)
    // - observation_type (select obrigatório: participant_report | professional_observation)
    // - text (texto obrigatório)
    // - access_class (select obrigatório, valor restrito a professional_private)
    // - created, updated (autodate)
    // RLS:
    // - Participante: zero list, zero view, zero create, zero update, zero delete
    // - Profissional autor: create quando autorizado no enrollment; view/list das próprias Observations (recorded_by_user_id = @request.auth.id) com vínculo ativo
    // - Outro profissional: não ganha acesso ao conteúdo bruto (menor privilégio)
    // - Update: nulo (updateRule = null)
    // - Delete: nulo (deleteRule = null)
    const observationsCol = new Collection({
      name: 'cer_session_observations',
      type: 'base',
      listRule:
        "@request.auth.id != '' && recorded_by_user_id = @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && recorded_by_user_id = @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      createRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'session_id',
          type: 'relation',
          required: true,
          collectionId: sessionsCol.id,
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
          name: 'recorded_by_user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'observation_type',
          type: 'select',
          required: true,
          values: ['participant_report', 'professional_observation'],
          maxSelect: 1,
        },
        {
          name: 'text',
          type: 'text',
          required: true,
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
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cso_session ON cer_session_observations (session_id)',
        'CREATE INDEX idx_cso_enrollment ON cer_session_observations (enrollment_id)',
        'CREATE INDEX idx_cso_author ON cer_session_observations (recorded_by_user_id)',
        'CREATE INDEX idx_cso_type ON cer_session_observations (observation_type)',
      ],
    })
    app.save(observationsCol)

    // 2. Atualizar cer_knowledge_evidence para adicionar 'participant_report_in_session' em evidence_type
    const keCol = app.findCollectionByNameOrId('cer_knowledge_evidence')
    const evTypeField = keCol.fields.getByName('evidence_type')
    if (evTypeField) {
      evTypeField.values = [
        'response',
        'signal',
        'association',
        'participant_recognition',
        'professional_observation',
        'participant_report_in_session',
      ]
      evTypeField.maxSelect = 1
      app.save(keCol)
    }
  },
  (app) => {
    // Reverter evidence_type em cer_knowledge_evidence
    try {
      const keCol = app.findCollectionByNameOrId('cer_knowledge_evidence')
      const evTypeField = keCol.fields.getByName('evidence_type')
      if (evTypeField) {
        evTypeField.values = [
          'response',
          'signal',
          'association',
          'participant_recognition',
          'professional_observation',
        ]
        evTypeField.maxSelect = 1
        app.save(keCol)
      }
    } catch (_) {}

    // Remover collection cer_session_observations
    try {
      const observationsCol = app.findCollectionByNameOrId('cer_session_observations')
      app.delete(observationsCol)
    } catch (_) {}
  },
)
