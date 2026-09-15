migrate(
  (app) => {
    // LOTE 3A: MIGRATION 0047 — Passos Estruturados, Dose Respiratória e Reflexão Corpo, Mente e Emoções
    // Coleções criadas:
    // 1. cer_practice_steps (passos estruturados versionados vinculados a cer_practice_versions)
    // 2. cer_practice_reflections (perguntas e respostas separadas sobre Corpo, Mente e Emoções)

    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const assignmentsCol = app.findCollectionByNameOrId('cer_practice_assignments')

    // 1. COLEÇÃO cer_practice_steps
    // Cada passo possui stable_step_id e se vincula estritamente a uma PracticeVersion.
    // Zero delete físico (deleteRule: null).
    const stepsCol = new Collection({
      name: 'cer_practice_steps',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.auth.user_roles_via_user_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.auth.user_roles_via_user_id.is_active ?= true",
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
          name: 'stable_step_id',
          type: 'text',
          required: true,
        },
        {
          name: 'step_order',
          type: 'number',
          required: true,
          min: 1,
          onlyInt: true,
        },
        {
          name: 'step_type',
          type: 'select',
          required: true,
          values: [
            'preparation',
            'posture',
            'breathing',
            'repetition',
            'cycle',
            'series',
            'natural_pause',
            'retention',
            'grounding',
            'integration',
            'closing',
          ],
          maxSelect: 1,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'participant_instruction',
          type: 'text',
          required: true,
        },
        {
          name: 'professional_note',
          type: 'text',
          required: false,
        },
        {
          name: 'duration_seconds',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'target_repetitions',
          type: 'number',
          required: false,
          min: 0,
          onlyInt: true,
        },
        {
          name: 'target_cycles',
          type: 'number',
          required: false,
          min: 0,
          onlyInt: true,
        },
        {
          name: 'target_series',
          type: 'number',
          required: false,
          min: 0,
          onlyInt: true,
        },
        {
          name: 'rest_seconds',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'break_type',
          type: 'select',
          required: false,
          values: ['natural_breathing', 'stillness', 'postural_transition', 'none'],
          maxSelect: 1,
        },
        {
          name: 'retention_type',
          type: 'select',
          required: true,
          values: ['none', 'antara', 'bahya'],
          maxSelect: 1,
        },
        {
          name: 'retention_duration_seconds',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'breathing_ratio',
          type: 'text',
          required: false,
        },
        {
          name: 'allow_early_stop',
          type: 'bool',
          required: false,
        },
        {
          name: 'stop_signs',
          type: 'text',
          required: false,
        },
        {
          name: 'grounding_instruction',
          type: 'text',
          required: false,
        },
        {
          name: 'is_optional',
          type: 'bool',
          required: false,
        },
        {
          name: 'metadata',
          type: 'json',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_cps_version_stable_id ON cer_practice_steps (practice_version_id, stable_step_id)',
        'CREATE INDEX idx_cps_version_order ON cer_practice_steps (practice_version_id, step_order)',
        'CREATE INDEX idx_cps_version ON cer_practice_steps (practice_version_id)',
      ],
    })
    app.save(stepsCol)

    // 2. COLEÇÃO cer_practice_reflections
    // Respostas individuais às três perguntas obrigatórias (corpo, mente, emocao).
    // Opcionais, privadas por padrão (visibility: participant_private | shared_care),
    // sem notas de adesão, sem causalidade diagnóstica.
    // Zero delete físico (deleteRule: null).
    const reflectionsCol = new Collection({
      name: 'cer_practice_reflections',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (visibility = 'shared_care' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((participant_user_id = @request.auth.id) || (visibility = 'shared_care' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
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
          name: 'reflection_target',
          type: 'select',
          required: true,
          values: ['corpo', 'mente', 'emocao'],
          maxSelect: 1,
        },
        {
          name: 'question_prompt',
          type: 'text',
          required: true,
        },
        {
          name: 'reflection_text',
          type: 'text',
          required: false,
        },
        {
          name: 'prefer_not_to_answer',
          type: 'bool',
          required: false,
        },
        {
          name: 'visibility',
          type: 'select',
          required: true,
          values: ['participant_private', 'shared_care'],
          maxSelect: 1,
        },
        {
          name: 'record_status',
          type: 'select',
          required: true,
          values: ['current', 'superseded'],
          maxSelect: 1,
        },
        {
          name: 'previous_reflection_id',
          type: 'text',
          required: false,
        },
        {
          name: 'metadata',
          type: 'json',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cprfl_assignment ON cer_practice_reflections (assignment_id)',
        'CREATE INDEX idx_cprfl_version ON cer_practice_reflections (practice_version_id)',
        'CREATE INDEX idx_cprfl_participant ON cer_practice_reflections (participant_user_id)',
        'CREATE INDEX idx_cprfl_target ON cer_practice_reflections (reflection_target)',
        'CREATE INDEX idx_cprfl_status ON cer_practice_reflections (record_status)',
      ],
    })
    app.save(reflectionsCol)
  },
  (app) => {
    try {
      const refCol = app.findCollectionByNameOrId('cer_practice_reflections')
      app.delete(refCol)
    } catch (_) {}

    try {
      const stepsCol = app.findCollectionByNameOrId('cer_practice_steps')
      app.delete(stepsCol)
    } catch (_) {}
  },
)
