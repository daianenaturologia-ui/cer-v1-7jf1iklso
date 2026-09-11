migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0033: cer_care_plans, cer_care_plan_priorities, cer_care_plan_priority_sources
    // 1. cer_care_plans
    // Lifecycle: draft | active | paused | superseded | completed | archived
    // Versioning por Record: revision_number + previous_plan_id
    // Direction: direction_mode (reused | contextualized | still_discovering)
    // RLS:
    // - Participante: list/view SOMENTE se status != 'draft' do próprio enrollment. create/update/delete: null
    // - Profissional com vínculo ativo: list/view, create de draft, update (regras controladas por hook)
    // - delete: null para todos
    const carePlansCol = new Collection({
      name: 'cer_care_plans',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((status != 'draft' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((status != 'draft' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
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
          name: 'revision_number',
          type: 'number',
          required: true,
          onlyInt: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'active', 'paused', 'superseded', 'completed', 'archived'],
          maxSelect: 1,
        },
        {
          name: 'direction_mode',
          type: 'select',
          required: true,
          values: ['reused', 'contextualized', 'still_discovering'],
          maxSelect: 1,
        },
        {
          name: 'direction_statement',
          type: 'text',
          required: false,
        },
        {
          name: 'direction_source_id',
          type: 'text',
          required: false,
        },
        {
          name: 'professional_context',
          type: 'text',
          required: false,
        },
        {
          name: 'professional_rationale',
          type: 'text',
          required: false,
        },
        {
          name: 'previous_plan_id',
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
        'CREATE INDEX idx_ccp_enrollment ON cer_care_plans (enrollment_id)',
        'CREATE INDEX idx_ccp_status ON cer_care_plans (status)',
        'CREATE INDEX idx_ccp_revision ON cer_care_plans (enrollment_id, revision_number)',
      ],
    })
    app.save(carePlansCol)

    const savedCarePlansCol = app.findCollectionByNameOrId('cer_care_plans')

    // 2. cer_care_plan_priorities
    // Prioridade operacional de cuidado (NÃO é Knowledge, diagnosis ou AI Proposal)
    // THERAPEUTIC PRIORITY ≠ POSSIBLE PRIORITY (campos separados: is_therapeutic_priority, is_possible_now)
    // Status: candidate | active | active_pending_adaptation | deferred | superseded | archived
    const prioritiesCol = new Collection({
      name: 'cer_care_plan_priorities',
      type: 'base',
      listRule:
        "@request.auth.id != '' && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      createRule:
        "@request.auth.id != '' && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      deleteRule: null,
      fields: [
        {
          name: 'plan_id',
          type: 'relation',
          required: true,
          collectionId: savedCarePlansCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'candidate',
            'active',
            'active_pending_adaptation',
            'deferred',
            'superseded',
            'archived',
          ],
          maxSelect: 1,
        },
        {
          name: 'is_therapeutic_priority',
          type: 'bool',
          required: false,
        },
        {
          name: 'is_possible_now',
          type: 'bool',
          required: false,
        },
        {
          name: 'order_index',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        {
          name: 'deferral_reason',
          type: 'text',
          required: false,
        },
        {
          name: 'professional_rationale',
          type: 'text',
          required: false,
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
        'CREATE INDEX idx_ccpp_plan ON cer_care_plan_priorities (plan_id)',
        'CREATE INDEX idx_ccpp_status ON cer_care_plan_priorities (status)',
        'CREATE INDEX idx_ccpp_order ON cer_care_plan_priorities (plan_id, order_index)',
      ],
    })
    app.save(prioritiesCol)

    const savedPrioritiesCol = app.findCollectionByNameOrId('cer_care_plan_priorities')

    // 3. cer_care_plan_priority_sources
    // Relação 1:N com cer_care_plan_priorities
    // Allowlist congelada de source_type:
    // knowledge_item | participant_recognition | map_item | presentation | association | signal | ai_proposal | professional_input
    // Provenance sem JSON opaco.
    const prioritySourcesCol = new Collection({
      name: 'cer_care_plan_priority_sources',
      type: 'base',
      listRule:
        "@request.auth.id != '' && priority_id.plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && priority_id.plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && priority_id.plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && priority_id.plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      createRule:
        "@request.auth.id != '' && priority_id.plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && priority_id.plan_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule: null, // Imutável
      deleteRule: null, // Sem delete físico
      fields: [
        {
          name: 'priority_id',
          type: 'relation',
          required: true,
          collectionId: savedPrioritiesCol.id,
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
          name: 'source_type',
          type: 'select',
          required: true,
          values: [
            'knowledge_item',
            'participant_recognition',
            'map_item',
            'presentation',
            'association',
            'signal',
            'ai_proposal',
            'professional_input',
          ],
          maxSelect: 1,
        },
        {
          name: 'source_id',
          type: 'text',
          required: true,
        },
        {
          name: 'source_version_anchor',
          type: 'text',
          required: false,
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
        'CREATE INDEX idx_ccpps_priority ON cer_care_plan_priority_sources (priority_id)',
        'CREATE INDEX idx_ccpps_enrollment ON cer_care_plan_priority_sources (enrollment_id)',
        'CREATE INDEX idx_ccpps_source ON cer_care_plan_priority_sources (source_type, source_id)',
      ],
    })
    app.save(prioritySourcesCol)
  },
  (app) => {
    try {
      const sCol = app.findCollectionByNameOrId('cer_care_plan_priority_sources')
      app.delete(sCol)
    } catch (_) {}
    try {
      const pCol = app.findCollectionByNameOrId('cer_care_plan_priorities')
      app.delete(pCol)
    } catch (_) {}
    try {
      const cCol = app.findCollectionByNameOrId('cer_care_plans')
      app.delete(cCol)
    } catch (_) {}
  },
)
