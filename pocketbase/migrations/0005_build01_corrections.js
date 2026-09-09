migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const journeyStatesCol = app.findCollectionByNameOrId('journey_states')
    const profAccessCol = app.findCollectionByNameOrId('professional_enrollment_access')

    // ========================================================
    // 1. USER_ACCOUNT (users): adicionar campo status
    //    valores: invited, active, suspended, disabled (default: active)
    //    adicionar campo mfa_enabled (bool)
    // ========================================================
    if (!usersCol.fields.getByName('status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'status',
          required: true,
          values: ['invited', 'active', 'suspended', 'disabled'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('mfa_enabled')) {
      usersCol.fields.add(
        new BoolField({
          name: 'mfa_enabled',
          required: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('mfa_secret')) {
      usersCol.fields.add(
        new TextField({
          name: 'mfa_secret',
          required: false,
        }),
      )
    }

    app.save(usersCol)

    // Inicializar status = 'active' para os usuários existentes
    app
      .db()
      .newQuery("UPDATE users SET status = 'active' WHERE status IS NULL OR status = ''")
      .execute()

    // ========================================================
    // 2. AUDIT_EVENT: criar coleção para auditoria de segurança
    //    campos: actor_user_id, action, resource_type, resource_id,
    //            enrollment_id (nullable), timestamp, result, request_context, metadata
    // ========================================================
    let auditEventsCol
    try {
      auditEventsCol = app.findCollectionByNameOrId('audit_events')
    } catch (_) {
      auditEventsCol = new Collection({
        name: 'audit_events',
        type: 'base',
        // Visualização restrita: somente admin técnico (platform_admin) ou dono do evento
        listRule:
          "@request.auth.id != '' && (@request.auth.user_roles_via_user_id.role ?= 'admin' || actor_user_id = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.user_roles_via_user_id.role ?= 'admin' || actor_user_id = @request.auth.id)",
        createRule: "@request.auth.id != ''", // Ator autenticado pode registrar seu log
        updateRule: null, // Imutável
        deleteRule: null, // Imutável
        fields: [
          {
            name: 'actor_user_id',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'action',
            type: 'text',
            required: true,
          },
          {
            name: 'resource_type',
            type: 'text',
            required: true,
          },
          {
            name: 'resource_id',
            type: 'text',
            required: false,
          },
          {
            name: 'enrollment_id',
            type: 'relation',
            required: false,
            collectionId: enrollmentsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'timestamp',
            type: 'date',
            required: true,
          },
          {
            name: 'result',
            type: 'select',
            required: true,
            values: ['success', 'failure', 'denied'],
            maxSelect: 1,
          },
          {
            name: 'request_context',
            type: 'text',
            required: false,
          },
          {
            name: 'metadata',
            type: 'json',
            required: false,
            maxSize: 32768,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_audit_actor ON audit_events (actor_user_id)',
          'CREATE INDEX idx_audit_action ON audit_events (action)',
          'CREATE INDEX idx_audit_created ON audit_events (created DESC)',
          'CREATE INDEX idx_audit_enrollment ON audit_events (enrollment_id)',
        ],
      })
      app.save(auditEventsCol)
    }

    // ========================================================
    // 3. ENROLLMENTS: Atualizar status para valores oficiais em inglês
    //    oficiais: invited, onboarding, active, paused, completed, cancelled
    //    remover campos legados: interagente, profissional, product (texto livre)
    // ========================================================
    // 3.1 Migrar dados da coluna status existente
    app.db().newQuery("UPDATE enrollments SET status = 'active' WHERE status = 'ativa'").execute()
    app
      .db()
      .newQuery("UPDATE enrollments SET status = 'invited' WHERE status = 'pendente'")
      .execute()
    app
      .db()
      .newQuery("UPDATE enrollments SET status = 'completed' WHERE status = 'encerrada'")
      .execute()

    // 3.2 Atualizar o SelectField de status com os 6 novos valores
    const statusField = enrollmentsCol.fields.getByName('status')
    if (statusField) {
      statusField.values = ['invited', 'onboarding', 'active', 'paused', 'completed', 'cancelled']
      statusField.maxSelect = 1
    }

    // 3.3 Garantir que person_id esteja preenchido em todos os registros antes de remover 'interagente'
    app
      .db()
      .newQuery(`
      UPDATE enrollments
      SET person_id = (SELECT person_id FROM users WHERE users.id = enrollments.interagente)
      WHERE (person_id IS NULL OR person_id = '') AND interagente IS NOT NULL AND interagente != ''
    `)
      .execute()

    // 3.4 Remover índices antigos se existirem
    try {
      enrollmentsCol.removeIndex('idx_enrollments_interagente')
    } catch (_) {}
    try {
      enrollmentsCol.removeIndex('idx_enrollments_profissional')
    } catch (_) {}

    // 3.5 Atualizar regras RLS de enrollments para arquitetura limpa (sem legados):
    // List/View: interacting user (via person_id) OU profissional associado ativo via professional_enrollment_access
    // Admin técnico NÃO tem acesso automático a conteúdo do enrollment
    // Criar: profissional autenticado
    // Atualizar: profissional associado ativo
    enrollmentsCol.listRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (person_id.users_via_person_id.id ?= @request.auth.id || (professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && professional_enrollment_access_via_enrollment_id.is_active = true))"
    enrollmentsCol.viewRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (person_id.users_via_person_id.id ?= @request.auth.id || (professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && professional_enrollment_access_via_enrollment_id.is_active = true))"
    enrollmentsCol.createRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && @request.auth.user_roles_via_user_id.role ?= 'profissional'"
    enrollmentsCol.updateRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && professional_enrollment_access_via_enrollment_id.is_active = true)"

    if (enrollmentsCol.fields.getByName('interagente')) {
      enrollmentsCol.fields.removeByName('interagente')
    }
    if (enrollmentsCol.fields.getByName('profissional')) {
      enrollmentsCol.fields.removeByName('profissional')
    }
    if (enrollmentsCol.fields.getByName('product')) {
      enrollmentsCol.fields.removeByName('product')
    }

    app.save(enrollmentsCol)

    // ========================================================
    // 4. JOURNEY_STATES: Corrigir estágios técnicos
    //    onboarding, consciousness, equilibrium_realization
    //    migrar valores:
    //    acolhimento -> onboarding
    //    consciencia -> consciousness
    //    equilibrio_realizacao -> equilibrium_realization
    // ========================================================
    app
      .db()
      .newQuery(
        "UPDATE journey_states SET current_stage = 'onboarding' WHERE current_stage = 'acolhimento'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE journey_states SET current_stage = 'consciousness' WHERE current_stage = 'consciencia'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE journey_states SET current_stage = 'equilibrium_realization' WHERE current_stage = 'equilibrio_realizacao'",
      )
      .execute()

    // Atualizar enum values de current_stage
    const stageField = journeyStatesCol.fields.getByName('current_stage')
    if (stageField) {
      stageField.values = ['onboarding', 'consciousness', 'equilibrium_realization']
      stageField.maxSelect = 1
    }

    // Adicionar campo separado para eixo longitudinal de evolução (sem forçar quarta etapa linear)
    if (!journeyStatesCol.fields.getByName('evolution_status')) {
      journeyStatesCol.fields.add(
        new SelectField({
          name: 'evolution_status',
          required: false,
          values: ['not_started', 'in_progress', 'integrated'],
          maxSelect: 1,
        }),
      )
    }

    // Regras RLS de journey_states
    journeyStatesCol.listRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active = true))"
    journeyStatesCol.viewRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active = true))"
    journeyStatesCol.createRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && @request.auth.user_roles_via_user_id.role ?= 'profissional'"
    journeyStatesCol.updateRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active = true)"

    app.save(journeyStatesCol)

    // ========================================================
    // 5. CORREÇÃO DE SEGURANÇA: PROFESSIONAL_ENROLLMENT_ACCESS
    //    NUNCA "@request.auth.id != ''"
    //    Criação: Somente plataforma admin OU profissional autorizado criando acesso para si próprio (@request.body.professional_user_id = @request.auth.id)
    //    Atualização/Remoção: admin OU o profissional vinculado
    // ========================================================
    profAccessCol.listRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (professional_user_id = @request.auth.id || enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || @request.auth.user_roles_via_user_id.role ?= 'admin')"
    profAccessCol.viewRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (professional_user_id = @request.auth.id || enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || @request.auth.user_roles_via_user_id.role ?= 'admin')"
    profAccessCol.createRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (@request.auth.user_roles_via_user_id.role ?= 'admin' || (@request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.body.professional_user_id = @request.auth.id))"
    profAccessCol.updateRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (@request.auth.user_roles_via_user_id.role ?= 'admin' || professional_user_id = @request.auth.id)"
    profAccessCol.deleteRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (@request.auth.user_roles_via_user_id.role ?= 'admin' || professional_user_id = @request.auth.id)"

    app.save(profAccessCol)

    // ========================================================
    // 6. Atualizar regras de PERSONS e USERS para bloquear suspended
    // ========================================================
    const personsCol = app.findCollectionByNameOrId('persons')
    personsCol.listRule = "@request.auth.id != '' && @request.auth.status = 'active'"
    personsCol.viewRule = "@request.auth.id != '' && @request.auth.status = 'active'"
    personsCol.createRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (@request.auth.user_roles_via_user_id.role ?= 'profissional' || @request.auth.user_roles_via_user_id.role ?= 'admin')"
    personsCol.updateRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (@request.auth.user_roles_via_user_id.role ?= 'profissional' || @request.auth.user_roles_via_user_id.role ?= 'admin' || users_via_person_id.id ?= @request.auth.id)"
    app.save(personsCol)

    usersCol.listRule = "id = @request.auth.id && @request.auth.status = 'active'"
    usersCol.viewRule = "id = @request.auth.id && @request.auth.status = 'active'"
    usersCol.updateRule = "id = @request.auth.id && @request.auth.status = 'active'"
    usersCol.deleteRule = "id = @request.auth.id && @request.auth.status = 'active'"
    app.save(usersCol)

    // ========================================================
    // 7. REMOVER COLEÇÃO LEGADA 'profiles'
    // ========================================================
    try {
      const profilesCol = app.findCollectionByNameOrId('profiles')
      app.delete(profilesCol)
    } catch (_) {}
  },
  (app) => {
    // Reversão
  },
)
