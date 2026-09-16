migrate(
  (app) => {
    // Helper defensivo com fallback de casing
    const findCol = (name) => {
      try {
        return app.findCollectionByNameOrId(name)
      } catch (_) {
        try {
          return app.findCollectionByNameOrId(name.toLowerCase())
        } catch (_) {
          return null
        }
      }
    }

    const usersCol = findCol('_pb_users_auth_') || findCol('users')
    const enrollmentsCol = findCol('enrollments')

    if (!usersCol || !enrollmentsCol) {
      throw new Error('[MIGRATION 0062] Dependências users ou enrollments não encontradas.')
    }

    // =========================================================================
    // 1. cer_journal_entries (Caderno Privado - Anotações espontâneas)
    // =========================================================================
    // REGRAS RLS FAIL-CLOSED:
    // listRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // viewRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // deleteRule: null (exclusão lógica / arquivamento via status)
    // ZERO list/view/read/expand para profissionais ou administradores.
    let journalEntriesCol = findCol('cer_journal_entries')
    if (!journalEntriesCol) {
      journalEntriesCol = new Collection({
        name: 'cer_journal_entries',
        type: 'base',
        listRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
        createRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
        updateRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
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
            name: 'title',
            type: 'text',
            required: false,
          },
          {
            name: 'content',
            type: 'text',
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['active', 'archived'],
            maxSelect: 1,
          },
          {
            name: 'access_class',
            type: 'select',
            required: true,
            values: ['participant_private'],
            maxSelect: 1,
          },
          {
            name: 'version_number',
            type: 'number',
            required: true,
            min: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cje_enrollment ON cer_journal_entries (enrollment_id)',
          'CREATE INDEX idx_cje_participant ON cer_journal_entries (participant_user_id)',
          'CREATE INDEX idx_cje_status ON cer_journal_entries (status)',
          'CREATE INDEX idx_cje_access ON cer_journal_entries (access_class)',
        ],
      })
      app.save(journalEntriesCol)
    }

    // =========================================================================
    // 2. cer_journal_entry_versions (Histórico de Versões do Caderno)
    // =========================================================================
    // REGRAS RLS FAIL-CLOSED:
    // listRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // viewRule: "@request.auth.id != '' && participant_user_id = @request.auth.id"
    // createRule: null (Criado exclusivamente pelo hook de versionamento server-side)
    // updateRule: null (Imutável)
    // deleteRule: null (Imutável)
    let journalVersionsCol = findCol('cer_journal_entry_versions')
    if (!journalVersionsCol) {
      journalVersionsCol = new Collection({
        name: 'cer_journal_entry_versions',
        type: 'base',
        listRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && participant_user_id = @request.auth.id",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'entry_id',
            type: 'relation',
            required: true,
            collectionId: journalEntriesCol.id,
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
            name: 'title',
            type: 'text',
            required: false,
          },
          {
            name: 'content',
            type: 'text',
            required: true,
          },
          {
            name: 'version_number',
            type: 'number',
            required: true,
            min: 1,
          },
          {
            name: 'change_reason',
            type: 'text',
            required: false,
          },
          {
            name: 'access_class',
            type: 'select',
            required: true,
            values: ['participant_private'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cjev_entry ON cer_journal_entry_versions (entry_id)',
          'CREATE INDEX idx_cjev_enrollment ON cer_journal_entry_versions (enrollment_id)',
          'CREATE INDEX idx_cjev_participant ON cer_journal_entry_versions (participant_user_id)',
          'CREATE INDEX idx_cjev_version ON cer_journal_entry_versions (entry_id, version_number)',
        ],
      })
      app.save(journalVersionsCol)
    }

    // =========================================================================
    // 3. cer_next_session_messages (Recados Separados para a Próxima Sessão)
    // =========================================================================
    // Ciclo de vida: 'draft' -> 'approved' -> 'withdrawn'
    //
    // REGRAS RLS:
    // listRule / viewRule:
    // - Participante dona: pode listar e ver os seus (qualquer status)
    // - Profissional com vínculo ativo: PODE ver SOMENTE se status = 'approved'
    // createRule:
    // - Apenas participante dona: @request.auth.id != '' && participant_user_id = @request.auth.id
    // updateRule:
    // - Participante dona pode editar rascunho, aprovar ou retirar:
    //   @request.auth.id != '' && participant_user_id = @request.auth.id
    // deleteRule: null (sem deleção destrutiva)
    let nextSessionMessagesCol = findCol('cer_next_session_messages')
    if (!nextSessionMessagesCol) {
      const msgListRule =
        "@request.auth.id != '' && (" +
        'participant_user_id = @request.auth.id || ' +
        "(status = 'approved' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true)" +
        ')'

      const msgViewRule = msgListRule
      const msgCreateRule = "@request.auth.id != '' && participant_user_id = @request.auth.id"
      const msgUpdateRule = "@request.auth.id != '' && participant_user_id = @request.auth.id"

      nextSessionMessagesCol = new Collection({
        name: 'cer_next_session_messages',
        type: 'base',
        listRule: msgListRule,
        viewRule: msgViewRule,
        createRule: msgCreateRule,
        updateRule: msgUpdateRule,
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
            name: 'message_text',
            type: 'text',
            required: true,
          },
          {
            name: 'summary_text',
            type: 'text',
            required: false,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['draft', 'approved', 'withdrawn'],
            maxSelect: 1,
          },
          {
            name: 'approved_at',
            type: 'date',
            required: false,
          },
          {
            name: 'withdrawn_at',
            type: 'date',
            required: false,
          },
          {
            name: 'access_class',
            type: 'select',
            required: true,
            values: ['participant_private', 'shared_care'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cnsm_enrollment ON cer_next_session_messages (enrollment_id)',
          'CREATE INDEX idx_cnsm_participant ON cer_next_session_messages (participant_user_id)',
          'CREATE INDEX idx_cnsm_status ON cer_next_session_messages (status)',
          'CREATE INDEX idx_cnsm_created ON cer_next_session_messages (created)',
        ],
      })
      app.save(nextSessionMessagesCol)
    }

    // =========================================================================
    // 4. Feature Flag: cer_caderno_v1 (desligada por padrão no backend)
    // =========================================================================
    const ffCol = findCol('feature_flags')
    if (ffCol) {
      try {
        app.findFirstRecordByData('feature_flags', 'key', 'cer_caderno_v1')
      } catch (_) {
        const flagRec = new Record(ffCol)
        flagRec.set('key', 'cer_caderno_v1')
        flagRec.set('name', 'Caderno Privado e Recado para Próxima Sessão')
        flagRec.set(
          'description',
          'Caderno de anotações livres e privadas do interagente com envio independente de recado para a profissional.',
        )
        // OBRIGATÓRIO: Desligada por padrão até comprovação estrita de segurança e RLS
        flagRec.set('is_enabled', false)
        flagRec.set(
          'metadata',
          JSON.stringify({
            version: '0.0.52',
            privacy_guard: 'strict_fail_closed',
            entities: [
              'cer_journal_entries',
              'cer_journal_entry_versions',
              'cer_next_session_messages',
            ],
          }),
        )
        app.save(flagRec)
      }
    }
  },
  (app) => {
    // DOWN-MIGRATION FAIL-CLOSED:
    // Não remove se houver registros reais criados
    const findCol = (name) => {
      try {
        return app.findCollectionByNameOrId(name)
      } catch (_) {
        return null
      }
    }

    const nextMsgCol = findCol('cer_next_session_messages')
    if (nextMsgCol) {
      const count = app.countRecords('cer_next_session_messages')
      if (count > 0) {
        throw new Error(
          '[DOWN 0062] Abortando: cer_next_session_messages contém ' + count + ' registros.',
        )
      }
      app.delete(nextMsgCol)
    }

    const versionsCol = findCol('cer_journal_entry_versions')
    if (versionsCol) {
      const count = app.countRecords('cer_journal_entry_versions')
      if (count > 0) {
        throw new Error(
          '[DOWN 0062] Abortando: cer_journal_entry_versions contém ' + count + ' registros.',
        )
      }
      app.delete(versionsCol)
    }

    const entriesCol = findCol('cer_journal_entries')
    if (entriesCol) {
      const count = app.countRecords('cer_journal_entries')
      if (count > 0) {
        throw new Error(
          '[DOWN 0062] Abortando: cer_journal_entries contém ' + count + ' registros.',
        )
      }
      app.delete(entriesCol)
    }

    const ffCol = findCol('feature_flags')
    if (ffCol) {
      try {
        const flagRec = app.findFirstRecordByData('feature_flags', 'key', 'cer_caderno_v1')
        app.delete(flagRec)
      } catch (_) {}
    }
  },
)
