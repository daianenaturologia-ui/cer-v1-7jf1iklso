migrate(
  (app) => {
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0030: collection cer_maps
    // Campos:
    // - enrollment_id: relation required -> enrollments (cascadeDelete: false, maxSelect: 1)
    // - version_number: number required, onlyInt: true
    // - status: select required (draft | published | superseded | discarded, maxSelect: 1)
    // - created_by_user_id: relation required -> _pb_users_auth_ (cascadeDelete: false, maxSelect: 1)
    // - published_by_user_id: relation optional -> _pb_users_auth_ (cascadeDelete: false, maxSelect: 1)
    // - published_at: date optional
    // - created, updated: autodate
    // NÃO criar access_class. NÃO criar current flag.
    // Índices:
    // - idx_cer_maps_enrollment_version ON cer_maps (enrollment_id, version_number)
    // - idx_cer_maps_enrollment_status ON cer_maps (enrollment_id, status)
    // RLS:
    // - Participante: list/view SOMENTE status=published do próprio enrollment. create/update/delete: null.
    // - Profissional com vínculo ativo em professional_enrollment_access:
    //   list/view de todos os status do enrollment.
    //   create de draft no enrollment com vínculo.
    //   update no enrollment com vínculo (regras de lifecycle controladas via hook).
    //   delete: null PARA TODOS (nenhum DELETE físico, nem para profissional).
    const cerMapsCol = new Collection({
      name: 'cer_maps',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((status = 'published' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((status = 'published' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
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
          name: 'version_number',
          type: 'number',
          required: true,
          onlyInt: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'published', 'superseded', 'discarded'],
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
        {
          name: 'published_by_user_id',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'published_at',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cer_maps_enrollment_version ON cer_maps (enrollment_id, version_number)',
        'CREATE INDEX idx_cer_maps_enrollment_status ON cer_maps (enrollment_id, status)',
      ],
    })
    app.save(cerMapsCol)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cer_maps')
      app.delete(col)
    } catch (_) {}
  },
)
