migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const frameworksCol = app.findCollectionByNameOrId('cer_frameworks')
    const kiCol = app.findCollectionByNameOrId('cer_knowledge_items')
    const assocCol = app.findCollectionByNameOrId('cer_associations')

    // 1. Criar collection cer_ai_proposals
    // Decisões Congeladas Build 05:
    // - enrollment_id (relation required -> enrollments)
    // - requested_by_user_id (relation required -> users)
    // - proposal_type (select required: association_suggestion | knowledge_suggestion | integrative_hypothesis)
    // - proposal_text (text required)
    // - edited_text (text opcional)
    // - status (select required: pending_review | approved | discarded | observing)
    // - review_action (select opcional: approved | edited_and_approved | discarded | observing)
    // - framework_id (relation opcional -> cer_frameworks)
    // - target_knowledge_item_id (relation opcional -> cer_knowledge_items)
    // - target_association_id (relation opcional -> cer_associations)
    // - reviewed_by_user_id (relation opcional -> users)
    // - reviewed_at (date opcional)
    // - purpose (text opcional: task_type)
    // - model_metadata (json opcional: provider, model, model_version/config, prompt_version, schema_version)
    // - created, updated (autodate)
    // RLS:
    // - TODAS AS AI PROPOSALS V1 SÃO PROFESSIONAL/INTERNAL
    // - Participante: zero list, zero view, zero create, zero update, zero delete
    // - Profissional com vínculo ativo no enrollment: list/view
    // - Create: profissional autenticado com vínculo ativo no enrollment (via Proposal Engine)
    // - Update: profissional humano autenticado com vínculo ativo no enrollment (para review)
    // - Delete: nulo (DELETE negado irrevogavelmente)
    const proposalsCol = new Collection({
      name: 'cer_ai_proposals',
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
          name: 'requested_by_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'proposal_type',
          type: 'select',
          required: true,
          values: ['association_suggestion', 'knowledge_suggestion', 'integrative_hypothesis'],
          maxSelect: 1,
        },
        {
          name: 'proposal_text',
          type: 'text',
          required: true,
        },
        {
          name: 'edited_text',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending_review', 'approved', 'discarded', 'observing'],
          maxSelect: 1,
        },
        {
          name: 'review_action',
          type: 'select',
          required: false,
          values: ['approved', 'edited_and_approved', 'discarded', 'observing'],
          maxSelect: 1,
        },
        {
          name: 'framework_id',
          type: 'relation',
          required: false,
          collectionId: frameworksCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'target_knowledge_item_id',
          type: 'relation',
          required: false,
          collectionId: kiCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'target_association_id',
          type: 'relation',
          required: false,
          collectionId: assocCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'reviewed_by_user_id',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'reviewed_at',
          type: 'date',
          required: false,
        },
        {
          name: 'purpose',
          type: 'text',
          required: false,
        },
        {
          name: 'model_metadata',
          type: 'json',
          required: false,
          maxSize: 65536,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_aip_enrollment ON cer_ai_proposals (enrollment_id)',
        'CREATE INDEX idx_aip_requester ON cer_ai_proposals (requested_by_user_id)',
        'CREATE INDEX idx_aip_status ON cer_ai_proposals (status)',
        'CREATE INDEX idx_aip_type ON cer_ai_proposals (proposal_type)',
      ],
    })
    app.save(proposalsCol)

    // 2. Criar collection cer_ai_proposal_sources
    // Decisões Congeladas Build 05:
    // - proposal_id: relation required -> cer_ai_proposals
    // - source_type: select required (experience_response | signal | association | knowledge_item | participant_recognition | session_observation)
    // - source_id: text required (ID da entidade referenciada no PocketBase)
    // - source_version: number opcional (para KIs e responses quando aplicável)
    // - relation_type: select opcional (supports | contrasts | qualifies | contextualizes | updates)
    // - access_class: select opcional (classe de privacidade validada da fonte)
    // - created, updated: autodate
    // RLS:
    // - Mesma restrição profissional interna de cer_ai_proposals
    const savedProposalsCol = app.findCollectionByNameOrId('cer_ai_proposals')
    const proposalSourcesCol = new Collection({
      name: 'cer_ai_proposal_sources',
      type: 'base',
      listRule:
        "@request.auth.id != '' && proposal_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && proposal_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && proposal_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && proposal_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      createRule:
        "@request.auth.id != '' && proposal_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && proposal_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule: null, // Fontes de Proposal são imutáveis após vinculação
      deleteRule: null, // Sem deleção direta
      fields: [
        {
          name: 'proposal_id',
          type: 'relation',
          required: true,
          collectionId: savedProposalsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'source_type',
          type: 'select',
          required: true,
          values: [
            'experience_response',
            'signal',
            'association',
            'knowledge_item',
            'participant_recognition',
            'session_observation',
          ],
          maxSelect: 1,
        },
        {
          name: 'source_id',
          type: 'text',
          required: true,
        },
        {
          name: 'source_version',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        {
          name: 'relation_type',
          type: 'select',
          required: false,
          values: ['supports', 'contrasts', 'qualifies', 'contextualizes', 'updates'],
          maxSelect: 1,
        },
        {
          name: 'access_class',
          type: 'select',
          required: false,
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
        'CREATE INDEX idx_aips_proposal ON cer_ai_proposal_sources (proposal_id)',
        'CREATE INDEX idx_aips_source ON cer_ai_proposal_sources (source_id)',
        'CREATE INDEX idx_aips_type ON cer_ai_proposal_sources (source_type)',
      ],
    })
    app.save(proposalSourcesCol)
  },
  (app) => {
    try {
      const psCol = app.findCollectionByNameOrId('cer_ai_proposal_sources')
      app.delete(psCol)
    } catch (_) {}

    try {
      const pCol = app.findCollectionByNameOrId('cer_ai_proposals')
      app.delete(pCol)
    } catch (_) {}
  },
)
