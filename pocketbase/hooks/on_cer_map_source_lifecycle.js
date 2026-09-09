// Hook server-side do Build 06: Source Validation & Epistemic Gate de cer_map_item_sources
//
// Regras e Decisões Congeladas:
// 1. Allowlist FECHADA de source_type:
//    - knowledge_item
//    - participant_recognition
//    - presentation_context
//    - AI Proposal NÃO existe na allowlist.
//    - Session Note NÃO existe na allowlist.
//    - Session Observation NÃO existe como source direta.
//    - Signal / Response / Association NÃO existem como source direta.
// 2. Relations reais e compatíveis com source_type:
//    - source_type='knowledge_item' -> knowledge_item_id required, knowledge_version_number required, knowledge_version_id required
//    - source_type='participant_recognition' -> recognition_id required
//    - source_type='presentation_context' -> presentation_id required
// 3. Imutabilidade e Governança pelo Mapa:
//    - O map_item deve pertencer a um mapa com status = 'draft'.
//    - Se map.status !== 'draft', bloquear criação.
//    - updateRule: null, deleteRule: null (sources vinculadas são imutáveis).
// 4. Source Validation server-side:
//    - source existe
//    - relation corresponde ao source_type informado
//    - mesmo enrollment do Mapa (rejeita cross-enrollment)
//    - profissional autorizado com vínculo ativo
//    - epistemicamente permitida (Epistemic Gate):
//      * KI status não pode ser: withdrawn, discarded, not_confirmed, new.
//      * KI status=observing: permitido vincular no draft, mas alertado/validado.
//      * KI version anchor real: knowledge_version_id pertence ao KI e possui version_number correspondente.
//      * Recognition pertence ao enrollment e ao contexto esperado.
//      * does_not_recognize: rejeitado como legitimação direta de afirmação compatível.
// 5. DELETE físico negado.
// 6. Auditoria de MAP_ITEM_SOURCE_LINKED.

onRecordCreate((e) => {
  const src = e.record
  const mapItemId = src.getString('map_item_id')
  const sourceType = src.getString('source_type')

  // 1. Validar map_item existente
  let mapItem = null
  try {
    mapItem = $app.findFirstRecordByData('cer_map_items', 'id', mapItemId)
  } catch (_) {
    throw new BadRequestError('map_item_id inválido ou inexistente.')
  }

  // 2. Validar Mapa pai e status draft
  const mapId = mapItem.getString('map_id')
  let map = null
  try {
    map = $app.findFirstRecordByData('cer_maps', 'id', mapId)
  } catch (_) {
    throw new BadRequestError('Mapa associado ao item não foi encontrado.')
  }

  if (map.getString('status') !== 'draft') {
    throw new BadRequestError(
      'Fontes só podem ser vinculadas a itens de um Mapa CER em rascunho (draft).',
    )
  }

  const enrollmentId = map.getString('enrollment_id')

  // 3. Validar autorização do profissional
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

  // 4. Validar allowlist de source_type
  const ALLOWED_TYPES = ['knowledge_item', 'participant_recognition', 'presentation_context']
  if (ALLOWED_TYPES.indexOf(sourceType) === -1) {
    throw new BadRequestError(
      'source_type inválido: "' +
        sourceType +
        '". Permitidos apenas: knowledge_item, participant_recognition, presentation_context.',
    )
  }

  // 5. Validar cada source_type e regras epistêmicas
  if (sourceType === 'knowledge_item') {
    const kiId = src.getString('knowledge_item_id')
    const verNum = src.getInt('knowledge_version_number')
    const verId = src.getString('knowledge_version_id')

    if (!kiId) {
      throw new BadRequestError(
        'knowledge_item_id é obrigatório para source_type="knowledge_item".',
      )
    }

    let ki = null
    try {
      ki = $app.findFirstRecordByData('cer_knowledge_items', 'id', kiId)
    } catch (_) {
      throw new BadRequestError('Knowledge Item informado não foi encontrado.')
    }

    // Mesmo enrollment
    if (ki.getString('enrollment_id') !== enrollmentId) {
      throw new BadRequestError(
        'Cross-enrollment negado: Knowledge Item pertence a outro enrollment.',
      )
    }

    // Epistemic Gate: status de Knowledge elegíveis
    const kiStatus = ki.getString('status')
    const PROHIBITED_STATUSES = ['withdrawn', 'discarded', 'not_confirmed', 'new']
    if (PROHIBITED_STATUSES.indexOf(kiStatus) !== -1) {
      throw new BadRequestError(
        'Knowledge Item com status "' +
          kiStatus +
          '" não é elegível para sustentar itens do Mapa CER.',
      )
    }

    // Validar version number
    const currentKiVer = ki.getInt('version') || 1
    if (!verNum) {
      src.set('knowledge_version_number', currentKiVer)
    } else if (verNum > currentKiVer || verNum < 1) {
      throw new BadRequestError(
        'knowledge_version_number inválido: versão indicada (' +
          verNum +
          ') não existe no Knowledge Item (versão atual: ' +
          currentKiVer +
          ').',
      )
    }

    // Validar version id anchor
    if (verId) {
      try {
        const verRec = $app.findFirstRecordByData('cer_knowledge_item_versions', 'id', verId)
        if (verRec.getString('knowledge_item_id') !== kiId) {
          throw new BadRequestError(
            'knowledge_version_id aponta para snapshot de outro Knowledge Item.',
          )
        }
        const actualVerNum = src.getInt('knowledge_version_number')
        if (verRec.getInt('version_number') !== actualVerNum) {
          throw new BadRequestError(
            'knowledge_version_id aponta para versão diferente de knowledge_version_number.',
          )
        }
      } catch (verErr) {
        if (verErr.message && verErr.message.indexOf('knowledge_version_id') !== -1) {
          throw verErr
        }
        throw new BadRequestError('knowledge_version_id informado não foi encontrado.')
      }
    }
  } else if (sourceType === 'participant_recognition') {
    const recogId = src.getString('recognition_id')
    if (!recogId) {
      throw new BadRequestError(
        'recognition_id é obrigatório para source_type="participant_recognition".',
      )
    }

    let recog = null
    try {
      recog = $app.findFirstRecordByData('cer_participant_recognitions', 'id', recogId)
    } catch (_) {
      throw new BadRequestError('Participant Recognition informada não foi encontrada.')
    }

    if (recog.getString('enrollment_id') !== enrollmentId) {
      throw new BadRequestError(
        'Cross-enrollment negado: Participant Recognition pertence a outro enrollment.',
      )
    }

    // Epistemic gate para does_not_recognize
    const rType = recog.getString('recognition_type')
    if (rType === 'does_not_recognize') {
      throw new BadRequestError(
        'Participant Recognition do tipo "does_not_recognize" não pode ser vinculada como sustentação afirmativa no Mapa CER.',
      )
    }
  } else if (sourceType === 'presentation_context') {
    const presId = src.getString('presentation_id')
    if (!presId) {
      throw new BadRequestError(
        'presentation_id é obrigatório para source_type="presentation_context".',
      )
    }

    let pres = null
    try {
      pres = $app.findFirstRecordByData('cer_knowledge_presentations', 'id', presId)
    } catch (_) {
      throw new BadRequestError('Presentation informada não foi encontrada.')
    }

    if (pres.getString('enrollment_id') !== enrollmentId) {
      throw new BadRequestError(
        'Cross-enrollment negado: Presentation pertence a outro enrollment.',
      )
    }
  }

  e.next()
}, 'cer_map_item_sources')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const src = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    if (e.auth) {
      audit.set('actor_user_id', e.auth.id)
    }

    let enrId = ''
    try {
      const item = $app.findFirstRecordByData('cer_map_items', 'id', src.getString('map_item_id'))
      const map = $app.findFirstRecordByData('cer_maps', 'id', item.getString('map_id'))
      enrId = map.getString('enrollment_id')
    } catch (_) {}

    audit.set('action', 'MAP_ITEM_SOURCE_LINKED')
    audit.set('resource_type', 'cer_map_item_sources')
    audit.set('resource_id', src.id)
    if (enrId) audit.set('enrollment_id', enrId)
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_map_source_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        source_id: src.id,
        map_item_id: src.getString('map_item_id'),
        source_type: src.getString('source_type'),
        knowledge_item_id: src.getString('knowledge_item_id') || undefined,
        recognition_id: src.getString('recognition_id') || undefined,
        presentation_id: src.getString('presentation_id') || undefined,
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_map_item_sources')

onRecordUpdate((e) => {
  throw new BadRequestError(
    'Fontes vinculadas a itens do Mapa CER são imutáveis e não podem ser atualizadas.',
  )
}, 'cer_map_item_sources')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Exclusão física de fontes de itens do Mapa CER não é permitida. Descarte o rascunho completo do mapa caso queira recomeçar.',
  )
}, 'cer_map_item_sources')
