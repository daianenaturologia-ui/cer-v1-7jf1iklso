migrate(
  (app) => {
    const mapItemsCol = app.findCollectionByNameOrId('cer_map_items')
    const kiCol = app.findCollectionByNameOrId('cer_knowledge_items')
    const recogCol = app.findCollectionByNameOrId('cer_participant_recognitions')
    const presCol = app.findCollectionByNameOrId('cer_knowledge_presentations')
    const kivCol = app.findCollectionByNameOrId('cer_knowledge_item_versions')

    // MIGRATION 0032: collection cer_map_item_sources
    // Campos:
    // - map_item_id: relation required -> cer_map_items (cascadeDelete: false, maxSelect: 1)
    // - source_type: select required (EXATAMENTE: knowledge_item | participant_recognition | presentation_context)
    // - knowledge_item_id: relation optional -> cer_knowledge_items (cascadeDelete: false, maxSelect: 1)
    // - recognition_id: relation optional -> cer_participant_recognitions (cascadeDelete: false, maxSelect: 1)
    // - presentation_id: relation optional -> cer_knowledge_presentations (cascadeDelete: false, maxSelect: 1)
    // - knowledge_version_number: number optional (REQUIRED via hook quando source_type=knowledge_item)
    // - knowledge_version_id: relation optional -> cer_knowledge_item_versions (cascadeDelete: false, maxSelect: 1, REQUIRED via hook quando source_type=knowledge_item)
    // - created, updated: autodate
    // Allowlist tem SOMENTE esses 3 tipos:
    // AI Proposal NÃO existe; Session Note NÃO existe; Session Observation NÃO existe; Signal/Response/Association NÃO existem.
    // RLS:
    // - Participante: ZERO list/view (createRule/updateRule/deleteRule null, listRule/viewRule somente profissional vinculado).
    // - Profissional com vínculo ativo no enrollment do mapa: list/view, create de sources em item de draft.
    // - updateRule: null, deleteRule: null (imutabilidade total de sources).
    const cerMapItemSourcesCol = new Collection({
      name: 'cer_map_item_sources',
      type: 'base',
      listRule:
        "@request.auth.id != '' && map_item_id.map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && map_item_id.map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && map_item_id.map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && map_item_id.map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      createRule:
        "@request.auth.id != '' && map_item_id.map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && map_item_id.map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'map_item_id',
          type: 'relation',
          required: true,
          collectionId: mapItemsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'source_type',
          type: 'select',
          required: true,
          values: ['knowledge_item', 'participant_recognition', 'presentation_context'],
          maxSelect: 1,
        },
        {
          name: 'knowledge_item_id',
          type: 'relation',
          required: false,
          collectionId: kiCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'recognition_id',
          type: 'relation',
          required: false,
          collectionId: recogCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'presentation_id',
          type: 'relation',
          required: false,
          collectionId: presCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'knowledge_version_number',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        {
          name: 'knowledge_version_id',
          type: 'relation',
          required: false,
          collectionId: kivCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cer_mis_item ON cer_map_item_sources (map_item_id)',
        'CREATE INDEX idx_cer_mis_type ON cer_map_item_sources (source_type)',
        'CREATE INDEX idx_cer_mis_ki ON cer_map_item_sources (knowledge_item_id)',
      ],
    })
    app.save(cerMapItemSourcesCol)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cer_map_item_sources')
      app.delete(col)
    } catch (_) {}
  },
)
