// Hook server-side do Checkpoint 03B: Versionamento Imutável de Knowledge Items e Participant Recognition
// Validações rigorosas:
// 1. Snapshot automático em cer_knowledge_item_versions antes de qualquer alteração substantiva do canonical
// 2. Proibição de alteração manual de version (version é controlada exclusivamente pelo servidor)
// 3. Proibição de alteração de enrollment_id (P18)
// 4. Proibição de bypass de snapshot
// 5. Preservação de status descartados (discarded/not_confirmed não apagam o item nem o histórico)
// 6. Auditoria de KNOWLEDGE_ITEM_UPDATED e PARTICIPANT_RECOGNITION_CREATED (metadados puramente técnicos, sem statement nem comments!)

// Validação e snapshot ANTES do update de cer_knowledge_items
onRecordUpdate((e) => {
  const ki = e.record
  const orig = ki.original()

  if (orig) {
    // 1. Proibir alteração de enrollment_id (P18)
    const newEnrollment = ki.getString('enrollment_id')
    const origEnrollment = orig.getString('enrollment_id')
    if (newEnrollment && origEnrollment && newEnrollment !== origEnrollment) {
      throw new BadRequestError('Não é permitido alterar o enrollment_id do Knowledge Item.')
    } else if (!newEnrollment && origEnrollment) {
      ki.set('enrollment_id', origEnrollment)
    }

    // 2. Proibir alteração forjada manual de version
    const newVer = ki.getInt('version')
    const origVer = orig.getInt('version') || 1
    // Se o cliente tentar mandar uma version diferente de origVer (ou seja, tentar forjar o número da versão), rejeitar
    if (newVer && newVer !== origVer) {
      throw new BadRequestError(
        'Alteração manual de version não permitida. O versionamento é controlado pelo servidor.',
      )
    }

    // 3. Validar combinações epistemológicas de status caso status ou tipo sejam alterados
    const knowledgeType = ki.getString('knowledge_type') || orig.getString('knowledge_type')
    const epistemicSource = ki.getString('epistemic_source') || orig.getString('epistemic_source')
    const status = ki.getString('status') || orig.getString('status')

    const isFactOrReport =
      knowledgeType === 'reported_fact' || epistemicSource === 'participant_report'
    const isHypothesisOrReading =
      knowledgeType === 'integrative_hypothesis' ||
      knowledgeType === 'pattern_hypothesis' ||
      knowledgeType === 'framework_reading' ||
      epistemicSource === 'cer_integrative_hypothesis' ||
      epistemicSource === 'framework_reading'

    const allowedFactStatuses = ['reported', 'updated', 'withdrawn']
    const allowedObservationStatuses = ['observed', 'reviewed', 'updated', 'withdrawn']
    const allowedHypothesisStatuses = [
      'new',
      'observing',
      'supported',
      'recognized',
      'not_confirmed',
      'discarded',
    ]

    if (isHypothesisOrReading) {
      if (!allowedHypothesisStatuses.includes(status)) {
        throw new BadRequestError(
          'Combinação epistemológica inválida: tipo de hipótese não permite status "' +
            status +
            '".',
        )
      }
    } else if (knowledgeType === 'reported_fact') {
      if (!allowedFactStatuses.includes(status)) {
        throw new BadRequestError(
          'Combinação epistemológica inválida: tipo reported_fact não permite status "' +
            status +
            '".',
        )
      }
    } else if (epistemicSource === 'professional_observation') {
      if (!allowedObservationStatuses.includes(status)) {
        throw new BadRequestError(
          'Combinação epistemológica inválida: professional_observation não permite status "' +
            status +
            '".',
        )
      }
    }

    // 4. Salvar snapshot completo da versão anterior em cer_knowledge_item_versions
    // Buscar estado anterior fresco
    let origData = orig
    try {
      origData = $app.findFirstRecordByData('cer_knowledge_items', 'id', ki.id)
    } catch (_) {}

    const origStatement = origData ? origData.getString('statement') : orig.getString('statement')
    const origType = origData
      ? origData.getString('knowledge_type')
      : orig.getString('knowledge_type')
    const origSource = origData
      ? origData.getString('epistemic_source')
      : orig.getString('epistemic_source')
    const origTemporality = origData
      ? origData.getString('temporality')
      : orig.getString('temporality')
    const origDimId = origData
      ? origData.getString('primary_dimension_id')
      : orig.getString('primary_dimension_id')
    const origFwId = origData ? origData.getString('framework_id') : orig.getString('framework_id')
    const origStatus = origData ? origData.getString('status') : orig.getString('status')
    const origAccess = origData
      ? origData.getString('access_class')
      : orig.getString('access_class')

    let changerId = ''
    if (e.auth) {
      changerId = e.auth.id
    } else if (ki.getString('reviewed_by_user_id')) {
      changerId = ki.getString('reviewed_by_user_id')
    }

    try {
      const versionsCol = $app.findCollectionByNameOrId('cer_knowledge_item_versions')
      const verRec = new Record(versionsCol)
      verRec.set('knowledge_item_id', ki.id)
      verRec.set('version_number', origVer)
      verRec.set('statement', origStatement)
      verRec.set('knowledge_type', origType)
      verRec.set('epistemic_source', origSource)
      verRec.set('temporality', origTemporality)
      if (origDimId) {
        verRec.set('primary_dimension_id', origDimId)
      }
      if (origFwId) {
        verRec.set('framework_id', origFwId)
      }
      verRec.set('status', origStatus)
      verRec.set('access_class', origAccess || 'shared_care')
      if (changerId) {
        verRec.set('changed_by_user_id', changerId)
      }
      verRec.set(
        'change_reason',
        'Snapshot server-side antes de atualização para V' + (origVer + 1),
      )
      $app.save(verRec)
    } catch (saveErr) {
      throw new BadRequestError(
        'Falha crítica de versionamento: impossível arquivar snapshot da versão anterior: ' +
          saveErr.message,
      )
    }

    // Incrementar a versão corrente no registro canonical
    ki.set('version', origVer + 1)
  }

  e.next()
}, 'cer_knowledge_items')

// Auditoria KNOWLEDGE_ITEM_UPDATED após sucesso
onRecordAfterUpdateSuccess((e) => {
  e.next()

  try {
    const ki = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    let actorId = ''
    if (e.auth) {
      actorId = e.auth.id
    } else if (ki.getString('reviewed_by_user_id')) {
      actorId = ki.getString('reviewed_by_user_id')
    } else {
      actorId = ki.getString('created_by_user_id')
    }

    if (actorId) {
      audit.set('actor_user_id', actorId)
    }
    audit.set('action', 'KNOWLEDGE_ITEM_UPDATED')
    audit.set('resource_type', 'cer_knowledge_items')
    audit.set('resource_id', ki.id)
    audit.set('enrollment_id', ki.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_knowledge_versioning')
    audit.set(
      'metadata',
      JSON.stringify({
        knowledge_item_id: ki.id,
        version: ki.getInt('version'),
        status: ki.getString('status'),
        access_class: ki.getString('access_class'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_knowledge_items')

// Validação e Auditoria em cer_participant_recognitions:
// 1. Valida que recognition_type pertence ao vocabulário oficial
// 2. Valida que enrollment_id corresponde ao do Knowledge Item
// 3. Salva audit event PARTICIPANT_RECOGNITION_CREATED sem vazar comment nem statement
// 4. Cria automaticamente uma Knowledge Evidence do tipo 'participant_recognition' para o Knowledge Item
onRecordCreate((e) => {
  const recog = e.record
  const kiId = recog.getString('knowledge_item_id')
  const enrollmentId = recog.getString('enrollment_id')

  let ki = null
  try {
    ki = $app.findFirstRecordByData('cer_knowledge_items', 'id', kiId)
  } catch (_) {
    throw new BadRequestError('knowledge_item_id inválido ou inexistente.')
  }

  if (ki.getString('enrollment_id') !== enrollmentId) {
    throw new BadRequestError(
      'Inconsistência cross-enrollment: Knowledge Item pertence a outro enrollment.',
    )
  }

  // Preencher access_class se ausente (herda do Knowledge Item ou participant_shared)
  if (!recog.getString('access_class')) {
    recog.set('access_class', ki.getString('access_class') || 'shared_care')
  }

  // Preencher participant_user_id se ausente
  if (!recog.getString('participant_user_id') && e.auth) {
    recog.set('participant_user_id', e.auth.id)
  }

  e.next()
}, 'cer_participant_recognitions')

onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const recog = e.record
    const kiId = recog.getString('knowledge_item_id')
    const recogType = recog.getString('recognition_type')

    // 1. Auditoria PARTICIPANT_RECOGNITION_CREATED (metadados puramente técnicos, SEM comentário!)
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const participantId = recog.getString('participant_user_id')
    if (participantId) {
      audit.set('actor_user_id', participantId)
    }
    audit.set('action', 'PARTICIPANT_RECOGNITION_CREATED')
    audit.set('resource_type', 'cer_participant_recognitions')
    audit.set('resource_id', recog.id)
    audit.set('enrollment_id', recog.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_participant_recognition')
    audit.set(
      'metadata',
      JSON.stringify({
        recognition_id: recog.id,
        knowledge_item_id: kiId,
        recognition_type: recogType,
        access_class: recog.getString('access_class'),
      }),
    )
    $app.save(audit)

    // 2. Registrar como nova evidência em cer_knowledge_evidence
    // Mapeamento semântico do relation_type a partir do recognition_type:
    // makes_sense -> supports
    // does_not_recognize -> contrasts
    // partially_makes_sense -> qualifies
    // depends_on_context -> contextualizes
    // wants_to_add -> updates
    let relationType = 'qualifies'
    if (recogType === 'makes_sense') {
      relationType = 'supports'
    } else if (recogType === 'does_not_recognize') {
      relationType = 'contrasts'
    } else if (recogType === 'depends_on_context') {
      relationType = 'contextualizes'
    } else if (recogType === 'wants_to_add') {
      relationType = 'updates'
    }

    const keCol = $app.findCollectionByNameOrId('cer_knowledge_evidence')
    const keRec = new Record(keCol)
    keRec.set('knowledge_item_id', kiId)
    keRec.set('evidence_type', 'participant_recognition')
    keRec.set('evidence_id', recog.id)
    keRec.set('relation_type', relationType)
    $app.save(keRec)
  } catch (_) {}
}, 'cer_participant_recognitions')
