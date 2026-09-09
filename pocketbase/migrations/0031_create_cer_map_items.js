migrate(
  (app) => {
    const mapsCol = app.findCollectionByNameOrId('cer_maps')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0031: collection cer_map_items
    // Campos:
    // - map_id: relation required -> cer_maps (cascadeDelete: false, maxSelect: 1)
    // - section: select required (ENUM FECHADO exato das 11 seções, maxSelect: 1):
    //   minha_natureza, meu_momento, quando_estou_no_meu_eixo, quando_saio_do_meu_eixo,
    //   o_que_me_mobiliza, meus_padroes, meus_recursos, minhas_relacoes,
    //   minha_historia, o_que_tem_sentido_para_mim, o_que_reconheci_sobre_mim.
    // - item_text: text required
    // - position: number required, onlyInt: true
    // - created_by_user_id: relation required -> _pb_users_auth_ (cascadeDelete: false, maxSelect: 1)
    // - created, updated: autodate
    // NÃO criar: access_class, status próprio, item_type, epistemic_strength, formulation_mode, recognition_required, framework_id, AI fields.
    // Índices:
    // - idx_cer_map_items_order ON cer_map_items (map_id, section, position)
    // RLS:
    // - Participante: list/view SOMENTE se map_id.status = 'published' e map_id.enrollment_id for da própria participante. create/update/delete: null.
    // - Profissional com vínculo ativo no enrollment do mapa:
    //   list/view de todos os items do enrollment.
    //   create / update SOMENTE se map.status = 'draft' (garantido por hook de imutabilidade).
    //   delete: null PARA TODOS (nenhum DELETE físico).
    const cerMapItemsCol = new Collection({
      name: 'cer_map_items',
      type: 'base',
      listRule:
        "@request.auth.id != '' && ((map_id.status = 'published' && map_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      viewRule:
        "@request.auth.id != '' && ((map_id.status = 'published' && map_id.enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id) || (map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))",
      createRule:
        "@request.auth.id != '' && map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && map_id.enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      deleteRule: null,
      fields: [
        {
          name: 'map_id',
          type: 'relation',
          required: true,
          collectionId: mapsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'section',
          type: 'select',
          required: true,
          values: [
            'minha_natureza',
            'meu_momento',
            'quando_estou_no_meu_eixo',
            'quando_saio_do_meu_eixo',
            'o_que_me_mobiliza',
            'meus_padroes',
            'meus_recursos',
            'minhas_relacoes',
            'minha_historia',
            'o_que_tem_sentido_para_mim',
            'o_que_reconheci_sobre_mim',
          ],
          maxSelect: 1,
        },
        {
          name: 'item_text',
          type: 'text',
          required: true,
        },
        {
          name: 'position',
          type: 'number',
          required: true,
          onlyInt: true,
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
        'CREATE INDEX idx_cer_map_items_order ON cer_map_items (map_id, section, position)',
      ],
    })
    app.save(cerMapItemsCol)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cer_map_items')
      app.delete(col)
    } catch (_) {}
  },
)
