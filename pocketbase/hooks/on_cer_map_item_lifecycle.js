// Hook server-side do Build 06: Imutabilidade e Governança de cer_map_items
//
// Regras e Decisões Congeladas:
// 1. O Mapa governa o lifecycle dos items (cer_map_items não possui status próprio).
// 2. Items pertencentes a mapa com status != 'draft' são ESTRITAMENTE IMUTÁVEIS:
//    - Bloquear update de item se map.status !== 'draft'.
//    - Bloquear create de item se map.status !== 'draft'.
//    - Participante nunca cria nem altera item.
//    - AI / system nunca cria nem altera item.
// 3. Imutabilidade de campos estruturais do item:
//    - map_id não pode ser alterado após criação.
//    - created_by_user_id não pode ser alterado após criação.
// 4. Seção fechada (11 seções permitidas):
//    - minha_natureza, meu_momento, quando_estou_no_meu_eixo, quando_saio_do_meu_eixo,
//      o_que_me_mobiliza, meus_padroes, meus_recursos, minhas_relacoes,
//      minha_historia, o_que_tem_sentido_para_mim, o_que_reconheci_sobre_mim.
//    - "O que quero realizar" NÃO pertence ao Mapa.
// 5. DELETE físico proibido para todos.
// 6. Auditoria de MAP_ITEM_CREATED e MAP_ITEM_UPDATED_DRAFT.

onRecordCreate((e) => {
  const item = e.record
  const mapId = item.getString('map_id')

  if (!item.getString('created_by_user_id') && e.auth) {
    item.set('created_by_user_id', e.auth.id)
  }

  // 1. Validar Mapa CER existente
  let map = null
  try {
    map = $app.findFirstRecordByData('cer_maps', 'id', mapId)
  } catch (_) {
    throw new BadRequestError('map_id inválido ou inexistente.')
  }

  // 2. Só é permitido criar item se o mapa estiver no estado 'draft'
  const mapStatus = map.getString('status')
  if (mapStatus !== 'draft') {
    throw new BadRequestError(
      'Não é permitido adicionar itens a um Mapa CER que não esteja em rascunho (status atual: "' +
        mapStatus +
        '").',
    )
  }

  // 3. Validar autorização do criador
  const enrollmentId = map.getString('enrollment_id')
  if (e.auth) {
    const authId = e.auth.id

    // Verificar se não é participante
    try {
      const enr = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
      const personId = enr.getString('person_id')
      if (personId) {
        const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
        if (pUser.id === authId) {
          throw new BadRequestError('Participante não tem permissão para criar itens no Mapa CER.')
        }
      }
    } catch (_) {}

    // Vínculo profissional ativo
    let isProfLinked = false
    try {
      const links = $app.findRecordsByFilter(
        'professional_enrollment_access',
        'enrollment_id = "' +
          enrollmentId +
          '" && professional_user_id = "' +
          authId +
          '" && is_active = true',
        '',
        1,
        0,
      )
      if (links && links.length > 0) {
        isProfLinked = true
      }
    } catch (_) {}

    if (!isProfLinked) {
      throw new BadRequestError('Profissional sem vínculo ativo para o enrollment deste mapa.')
    }
  }

  // 4. Validar section na allowlist fechada
  const validSections = [
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
  ]
  const sec = item.getString('section')
  if (validSections.indexOf(sec) === -1) {
    throw new BadRequestError('Seção inválida para o Mapa CER: "' + sec + '".')
  }

  e.next()
}, 'cer_map_items')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const item = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = item.getString('created_by_user_id') || (e.auth ? e.auth.id : '')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }

    let enrId = ''
    try {
      const map = $app.findFirstRecordByData('cer_maps', 'id', item.getString('map_id'))
      enrId = map.getString('enrollment_id')
    } catch (_) {}

    audit.set('action', 'MAP_ITEM_CREATED')
    audit.set('resource_type', 'cer_map_items')
    audit.set('resource_id', item.id)
    if (enrId) audit.set('enrollment_id', enrId)
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_map_item_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        item_id: item.id,
        map_id: item.getString('map_id'),
        section: item.getString('section'),
        position: item.getInt('position'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_map_items')

onRecordUpdate((e) => {
  const item = e.record
  const orig = item.original()
  if (!orig) {
    e.next()
    return
  }

  const mapId = orig.getString('map_id')

  // Não permitir mudar map_id nem created_by_user_id
  if (item.getString('map_id') !== mapId) {
    throw new BadRequestError('map_id é imutável em cer_map_items.')
  }
  if (item.getString('created_by_user_id') !== orig.getString('created_by_user_id')) {
    throw new BadRequestError('created_by_user_id é imutável em cer_map_items.')
  }

  // 1. Obter mapa e validar status: somente draft permite alteração
  let map = null
  try {
    map = $app.findFirstRecordByData('cer_maps', 'id', mapId)
  } catch (_) {
    throw new BadRequestError('Mapa associado ao item não foi encontrado.')
  }

  const mapStatus = map.getString('status')
  if (mapStatus !== 'draft') {
    throw new BadRequestError(
      'Itens de Mapa CER publicado, substituído ou descartado são imutáveis (status do mapa: "' +
        mapStatus +
        '").',
    )
  }

  // 2. Validar autorização
  const enrollmentId = map.getString('enrollment_id')
  if (e.auth) {
    const authId = e.auth.id
    let isProfLinked = false
    try {
      const links = $app.findRecordsByFilter(
        'professional_enrollment_access',
        'enrollment_id = "' +
          enrollmentId +
          '" && professional_user_id = "' +
          authId +
          '" && is_active = true',
        '',
        1,
        0,
      )
      if (links && links.length > 0) {
        isProfLinked = true
      }
    } catch (_) {}

    if (!isProfLinked) {
      throw new BadRequestError('Profissional sem vínculo ativo para o enrollment deste mapa.')
    }
  }

  e.next()
}, 'cer_map_items')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const item = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : item.getString('created_by_user_id')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    let enrId = ''
    try {
      const map = $app.findFirstRecordByData('cer_maps', 'id', item.getString('map_id'))
      enrId = map.getString('enrollment_id')
    } catch (_) {}

    audit.set('action', 'MAP_ITEM_UPDATED_DRAFT')
    audit.set('resource_type', 'cer_map_items')
    audit.set('resource_id', item.id)
    if (enrId) audit.set('enrollment_id', enrId)
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_map_item_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        item_id: item.id,
        map_id: item.getString('map_id'),
        section: item.getString('section'),
        position: item.getInt('position'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_map_items')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Exclusão física de itens do Mapa CER não é permitida. Descarte o rascunho completo caso deseje descartar o mapa.',
  )
}, 'cer_map_items')
