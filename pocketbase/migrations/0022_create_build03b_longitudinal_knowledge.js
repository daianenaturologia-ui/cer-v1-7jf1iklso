migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const signalsCol = app.findCollectionByNameOrId('cer_signals')
    const dimensionsCol = app.findCollectionByNameOrId('cer_dimensions')
    const frameworksCol = app.findCollectionByNameOrId('cer_frameworks')

    // -------------------------------------------------------------
    // 1. CER_ASSOCIATIONS: 'cer_associations'
    // -------------------------------------------------------------
    // Campos: id, enrollment_id, concept_key, association_type, temporality, status, access_class, created_by_user_id, created, updated
    // association_type: recurrence | contrast | context_dependency | co_occurrence | change_over_time | possible_relationship
    // temporality: current | historical | recurring | context_dependent | longitudinal | undetermined
    // status: active | archived | superseded | rejected
    // access_class: participant_private | participant_shared | professional_private | shared_care | administrative | system_internal
    const associationsCol = new Collection({
      name: 'cer_associations',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      updateRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      deleteRule: null,
      fields: [
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'concept_key', type: 'text', required: true },
        {
          name: 'association_type',
          type: 'select',
          required: true,
          values: [
            'recurrence',
            'contrast',
            'context_dependency',
            'co_occurrence',
            'change_over_time',
            'possible_relationship',
          ],
          maxSelect: 1,
        },
        {
          name: 'temporality',
          type: 'select',
          required: true,
          values: [
            'current',
            'historical',
            'recurring',
            'context_dependent',
            'longitudinal',
            'undetermined',
          ],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['active', 'archived', 'superseded', 'rejected'],
          maxSelect: 1,
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
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_assoc_enrollment ON cer_associations (enrollment_id)',
        'CREATE INDEX idx_assoc_concept ON cer_associations (concept_key)',
        'CREATE INDEX idx_assoc_type ON cer_associations (association_type)',
      ],
    })
    app.save(associationsCol)

    // -------------------------------------------------------------
    // 2. CER_ASSOCIATION_EVIDENCE: 'cer_association_evidence'
    // -------------------------------------------------------------
    // Campos: id, association_id, signal_id, relation_type, evidence_group_key (nullable), created, updated
    // relation_type: supports | contrasts | qualifies | contextualizes | updates
    const assocEvidenceCol = new Collection({
      name: 'cer_association_evidence',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((association_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && association_id.access_class != 'professional_private') || ((association_id.access_class = 'shared_care' || association_id.access_class = 'participant_shared') && association_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && association_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((association_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && association_id.access_class != 'professional_private') || ((association_id.access_class = 'shared_care' || association_id.access_class = 'participant_shared') && association_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && association_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && (association_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (association_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && association_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      updateRule:
        "@request.auth.id != '' && (association_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (association_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && association_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      deleteRule: null,
      fields: [
        {
          name: 'association_id',
          type: 'relation',
          required: true,
          collectionId: associationsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'signal_id',
          type: 'relation',
          required: true,
          collectionId: signalsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'relation_type',
          type: 'select',
          required: true,
          values: ['supports', 'contrasts', 'qualifies', 'contextualizes', 'updates'],
          maxSelect: 1,
        },
        { name: 'evidence_group_key', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_assoc_ev_association ON cer_association_evidence (association_id)',
        'CREATE INDEX idx_assoc_ev_signal ON cer_association_evidence (signal_id)',
      ],
    })
    app.save(assocEvidenceCol)

    // -------------------------------------------------------------
    // 3. CER_KNOWLEDGE_ITEMS: 'cer_knowledge_items'
    // -------------------------------------------------------------
    // Campos: id, enrollment_id, concept_key, knowledge_type, statement, epistemic_source,
    // temporality, primary_dimension_id (nullable), framework_id (nullable), status,
    // access_class, created_by_user_id, reviewed_by_user_id (nullable), version, created, updated
    //
    // knowledge_type: reported_fact | resource | challenge | protection_pattern | current_state | value_meaning | realization_relevant | contextual_understanding | pattern_hypothesis | framework_reading | integrative_hypothesis
    // epistemic_source: participant_report | professional_observation | framework_reading | recurrence_association | cer_integrative_hypothesis | participant_recognition
    // status: reported | observed | reviewed | updated | withdrawn | new | observing | supported | recognized | not_confirmed | discarded
    const knowledgeItemsCol = new Collection({
      name: 'cer_knowledge_items',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      updateRule:
        "@request.auth.id != '' && (enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      deleteRule: null,
      fields: [
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'concept_key', type: 'text', required: true },
        {
          name: 'knowledge_type',
          type: 'select',
          required: true,
          values: [
            'reported_fact',
            'resource',
            'challenge',
            'protection_pattern',
            'current_state',
            'value_meaning',
            'realization_relevant',
            'contextual_understanding',
            'pattern_hypothesis',
            'framework_reading',
            'integrative_hypothesis',
          ],
          maxSelect: 1,
        },
        { name: 'statement', type: 'text', required: true },
        {
          name: 'epistemic_source',
          type: 'select',
          required: true,
          values: [
            'participant_report',
            'professional_observation',
            'framework_reading',
            'recurrence_association',
            'cer_integrative_hypothesis',
            'participant_recognition',
          ],
          maxSelect: 1,
        },
        {
          name: 'temporality',
          type: 'select',
          required: true,
          values: [
            'current',
            'historical',
            'recurring',
            'context_dependent',
            'longitudinal',
            'undetermined',
          ],
          maxSelect: 1,
        },
        {
          name: 'primary_dimension_id',
          type: 'relation',
          collectionId: dimensionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'framework_id',
          type: 'relation',
          collectionId: frameworksCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'reported',
            'observed',
            'reviewed',
            'updated',
            'withdrawn',
            'new',
            'observing',
            'supported',
            'recognized',
            'not_confirmed',
            'discarded',
          ],
          maxSelect: 1,
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
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'reviewed_by_user_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'version', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ki_enrollment ON cer_knowledge_items (enrollment_id)',
        'CREATE INDEX idx_ki_concept ON cer_knowledge_items (concept_key)',
        'CREATE INDEX idx_ki_type ON cer_knowledge_items (knowledge_type)',
        'CREATE INDEX idx_ki_source ON cer_knowledge_items (epistemic_source)',
      ],
    })
    app.save(knowledgeItemsCol)

    // -------------------------------------------------------------
    // 4. CER_KNOWLEDGE_EVIDENCE: 'cer_knowledge_evidence'
    // -------------------------------------------------------------
    // Campos: id, knowledge_item_id, evidence_type, evidence_id, relation_type, created, updated
    // evidence_type: response | signal | association | participant_recognition | professional_observation
    // relation_type: supports | contrasts | qualifies | contextualizes | updates
    const knowledgeEvidenceCol = new Collection({
      name: 'cer_knowledge_evidence',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((knowledge_item_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && knowledge_item_id.access_class != 'professional_private') || ((knowledge_item_id.access_class = 'shared_care' || knowledge_item_id.access_class = 'participant_shared') && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((knowledge_item_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && knowledge_item_id.access_class != 'professional_private') || ((knowledge_item_id.access_class = 'shared_care' || knowledge_item_id.access_class = 'participant_shared') && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && (knowledge_item_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      updateRule:
        "@request.auth.id != '' && (knowledge_item_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id || (knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      deleteRule: null,
      fields: [
        {
          name: 'knowledge_item_id',
          type: 'relation',
          required: true,
          collectionId: knowledgeItemsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'evidence_type',
          type: 'select',
          required: true,
          values: [
            'response',
            'signal',
            'association',
            'participant_recognition',
            'professional_observation',
          ],
          maxSelect: 1,
        },
        { name: 'evidence_id', type: 'text', required: true },
        {
          name: 'relation_type',
          type: 'select',
          required: true,
          values: ['supports', 'contrasts', 'qualifies', 'contextualizes', 'updates'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ke_knowledge_item ON cer_knowledge_evidence (knowledge_item_id)',
        'CREATE INDEX idx_ke_evidence_id ON cer_knowledge_evidence (evidence_id)',
      ],
    })
    app.save(knowledgeEvidenceCol)

    // -------------------------------------------------------------
    // 5. CER_PARTICIPANT_RECOGNITIONS: 'cer_participant_recognitions'
    // -------------------------------------------------------------
    // Campos: id, enrollment_id, knowledge_item_id, participant_user_id, recognition_type, comment (nullable), access_class, created, updated
    // recognition_type: makes_sense | partially_makes_sense | does_not_recognize | depends_on_context | wants_to_add
    const recognitionsCol = new Collection({
      name: 'cer_participant_recognitions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && participant_user_id = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && participant_user_id = @request.auth.id",
      deleteRule: null,
      fields: [
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'knowledge_item_id',
          type: 'relation',
          required: true,
          collectionId: knowledgeItemsCol.id,
          cascadeDelete: true,
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
          name: 'recognition_type',
          type: 'select',
          required: true,
          values: [
            'makes_sense',
            'partially_makes_sense',
            'does_not_recognize',
            'depends_on_context',
            'wants_to_add',
          ],
          maxSelect: 1,
        },
        { name: 'comment', type: 'text' },
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
        'CREATE INDEX idx_recog_enrollment ON cer_participant_recognitions (enrollment_id)',
        'CREATE INDEX idx_recog_ki ON cer_participant_recognitions (knowledge_item_id)',
      ],
    })
    app.save(recognitionsCol)

    // -------------------------------------------------------------
    // 6. CER_KNOWLEDGE_ITEM_VERSIONS: 'cer_knowledge_item_versions'
    // -------------------------------------------------------------
    // Campos: id, knowledge_item_id, version_number, statement, knowledge_type, epistemic_source,
    // temporality, primary_dimension_id (nullable), framework_id (nullable), status,
    // access_class, changed_by_user_id (nullable), change_reason (nullable), created, updated
    const kiVersionsCol = new Collection({
      name: 'cer_knowledge_item_versions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((knowledge_item_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((knowledge_item_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && knowledge_item_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule: null, // Criado exclusivamente via hook server-side
      updateRule: null, // Imutável
      deleteRule: null, // Imutável
      fields: [
        {
          name: 'knowledge_item_id',
          type: 'relation',
          required: true,
          collectionId: knowledgeItemsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'version_number', type: 'number', required: true },
        { name: 'statement', type: 'text', required: true },
        {
          name: 'knowledge_type',
          type: 'select',
          required: true,
          values: [
            'reported_fact',
            'resource',
            'challenge',
            'protection_pattern',
            'current_state',
            'value_meaning',
            'realization_relevant',
            'contextual_understanding',
            'pattern_hypothesis',
            'framework_reading',
            'integrative_hypothesis',
          ],
          maxSelect: 1,
        },
        {
          name: 'epistemic_source',
          type: 'select',
          required: true,
          values: [
            'participant_report',
            'professional_observation',
            'framework_reading',
            'recurrence_association',
            'cer_integrative_hypothesis',
            'participant_recognition',
          ],
          maxSelect: 1,
        },
        {
          name: 'temporality',
          type: 'select',
          required: true,
          values: [
            'current',
            'historical',
            'recurring',
            'context_dependent',
            'longitudinal',
            'undetermined',
          ],
          maxSelect: 1,
        },
        {
          name: 'primary_dimension_id',
          type: 'relation',
          collectionId: dimensionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'framework_id',
          type: 'relation',
          collectionId: frameworksCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'reported',
            'observed',
            'reviewed',
            'updated',
            'withdrawn',
            'new',
            'observing',
            'supported',
            'recognized',
            'not_confirmed',
            'discarded',
          ],
          maxSelect: 1,
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
          name: 'changed_by_user_id',
          type: 'relation',
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'change_reason', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_kiv_ki ON cer_knowledge_item_versions (knowledge_item_id)',
        'CREATE INDEX idx_kiv_ver ON cer_knowledge_item_versions (knowledge_item_id, version_number)',
      ],
    })
    app.save(kiVersionsCol)
  },
  (app) => {
    try {
      const v = app.findCollectionByNameOrId('cer_knowledge_item_versions')
      app.delete(v)
    } catch (_) {}
    try {
      const r = app.findCollectionByNameOrId('cer_participant_recognitions')
      app.delete(r)
    } catch (_) {}
    try {
      const ke = app.findCollectionByNameOrId('cer_knowledge_evidence')
      app.delete(ke)
    } catch (_) {}
    try {
      const ki = app.findCollectionByNameOrId('cer_knowledge_items')
      app.delete(ki)
    } catch (_) {}
    try {
      const ae = app.findCollectionByNameOrId('cer_association_evidence')
      app.delete(ae)
    } catch (_) {}
    try {
      const a = app.findCollectionByNameOrId('cer_associations')
      app.delete(a)
    } catch (_) {}
  },
)
