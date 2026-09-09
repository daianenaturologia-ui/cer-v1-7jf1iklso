migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const kiCol = app.findCollectionByNameOrId('cer_knowledge_items')
    const kivCol = app.findCollectionByNameOrId('cer_knowledge_item_versions')

    // 1. Criar collection cer_knowledge_presentations
    // Campos EXATOS da spec BUILD 04C:
    // - knowledge_item_id: relation required → cer_knowledge_items (cascadeDelete: false)
    // - knowledge_version_number: number required
    // - knowledge_version_id: relation opcional → cer_knowledge_item_versions
    // - enrollment_id: relation required → enrollments
    // - created_by_user_id: relation required → users (_pb_users_auth_)
    // - presentation_text: text required
    // - status: select required (draft | presented | withdrawn)
    // - channel: select required (app | session)
    // - presented_at: date nullable
    // - created, updated: autodate
    // RLS:
    // - PARTICIPANTE: não cria, não edita, não retira, não deleta, não vê draft, não vê withdrawn;
    //   vê SOMENTE status = 'presented' do próprio enrollment.
    // - PROFISSIONAL autorizado com vínculo ativo: cria draft, edita draft de própria autoria,
    //   vê draft de própria autoria ou presented/withdrawn no enrollment com vínculo ativo; DELETE negado.
    const presentationsCol = new Collection({
      name: 'cer_knowledge_presentations',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((status = 'presented' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true && (status != 'draft' || created_by_user_id = @request.auth.id)))",
      viewRule:
        "@request.auth.id != '' && ((status = 'presented' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true && (status != 'draft' || created_by_user_id = @request.auth.id)))",
      createRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      deleteRule: null,
      fields: [
        {
          name: 'knowledge_item_id',
          type: 'relation',
          required: true,
          collectionId: kiCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'knowledge_version_number',
          type: 'number',
          required: true,
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
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'created_by_user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'presentation_text',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'presented', 'withdrawn'],
          maxSelect: 1,
        },
        {
          name: 'channel',
          type: 'select',
          required: true,
          values: ['app', 'session'],
          maxSelect: 1,
        },
        {
          name: 'presented_at',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_kp_ki ON cer_knowledge_presentations (knowledge_item_id)',
        'CREATE INDEX idx_kp_enrollment ON cer_knowledge_presentations (enrollment_id)',
        'CREATE INDEX idx_kp_status ON cer_knowledge_presentations (status)',
      ],
    })
    app.save(presentationsCol)

    // 2. Alteração aditiva em cer_participant_recognitions:
    // - presentation_id (relation opcional -> cer_knowledge_presentations)
    // - record_mode (select: participant_self | professional_recorded_participant_response)
    // - Atualizar createRule para permitir também criação pelo profissional humano autorizado
    const recogCol = app.findCollectionByNameOrId('cer_participant_recognitions')
    const savedPresentationsCol = app.findCollectionByNameOrId('cer_knowledge_presentations')

    if (!recogCol.fields.getByName('presentation_id')) {
      recogCol.fields.add(
        new RelationField({
          name: 'presentation_id',
          required: false,
          collectionId: savedPresentationsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    if (!recogCol.fields.getByName('record_mode')) {
      recogCol.fields.add(
        new SelectField({
          name: 'record_mode',
          required: true,
          values: ['participant_self', 'professional_recorded_participant_response'],
          maxSelect: 1,
        }),
      )
    }

    // createRule: própria participante OU profissional humano com vínculo ativo no enrollment
    recogCol.createRule =
      "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && participant_user_id = @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))"

    // updateRule continua nulo (reforço de imutabilidade total)
    recogCol.updateRule = null

    // Adicionar índice para presentation_id em cer_participant_recognitions
    recogCol.addIndex('idx_recog_presentation', false, 'presentation_id', '')

    app.save(recogCol)
  },
  (app) => {
    // Reverter campos de cer_participant_recognitions
    try {
      const recogCol = app.findCollectionByNameOrId('cer_participant_recognitions')
      recogCol.removeIndex('idx_recog_presentation')
      const presField = recogCol.fields.getByName('presentation_id')
      if (presField) {
        recogCol.fields.removeById(presField.id)
      }
      const modeField = recogCol.fields.getByName('record_mode')
      if (modeField) {
        recogCol.fields.removeById(modeField.id)
      }
      recogCol.createRule =
        "@request.auth.id != '' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && participant_user_id = @request.auth.id"
      app.save(recogCol)
    } catch (_) {}

    // Excluir collection cer_knowledge_presentations
    try {
      const presCol = app.findCollectionByNameOrId('cer_knowledge_presentations')
      app.delete(presCol)
    } catch (_) {}
  },
)
