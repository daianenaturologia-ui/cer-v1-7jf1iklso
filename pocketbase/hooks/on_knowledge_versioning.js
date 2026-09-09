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

    // 1b. Proibir alteração de concept_key (CER-03C-03)
    const newConcept = ki.getString('concept_key')
    const origConcept = orig.getString('concept_key')
    if (newConcept && origConcept && newConcept !== origConcept) {
      throw new BadRequestError(
        'Não é permitido alterar o concept_key do Knowledge Item após a criação.',
      )
    }

    // 1c. Derived Privacy / Anti-Privacy Laundering (CER-03C-01)
    // NENHUM Knowledge Item pode, por UPDATE, tornar-se mais permissivo do que as evidências que efetivamente o sustentam.
    const newAccess =
      ki.getString('access_class') || orig.getString('access_class') || 'shared_care'

    let keRecords = []
    try {
      keRecords = $app.findRecordsByFilter(
        'cer_knowledge_evidence',
        'knowledge_item_id = "' + ki.id + '"',
        '',
        100,
        0,
      )
    } catch (_) {}

    if (keRecords && keRecords.length > 0) {
      for (let i = 0; i < keRecords.length; i++) {
        const keRec = keRecords[i]
        const evType = keRec.getString('evidence_type')
        const evId = keRec.getString('evidence_id')

        let evAccess = 'shared_care'
        if (evType === 'signal') {
          try {
            const s = $app.findFirstRecordByData('cer_signals', 'id', evId)
            evAccess = s.getString('access_class') || 'shared_care'
          } catch (_) {}
        } else if (evType === 'response') {
          try {
            const r = $app.findFirstRecordByData('experience_responses', 'id', evId)
            evAccess = r.getString('access_class') || 'shared_care'
          } catch (_) {}
        } else if (evType === 'association') {
          try {
            const a = $app.findFirstRecordByData('cer_associations', 'id', evId)
            evAccess = a.getString('access_class') || 'shared_care'
          } catch (_) {}
        } else if (evType === 'participant_recognition') {
          try {
            const pr = $app.findFirstRecordByData('cer_participant_recognitions', 'id', evId)
            evAccess = pr.getString('access_class') || 'shared_care'
          } catch (_) {}
        } else if (
          evType === 'professional_observation' ||
          evType === 'participant_report_in_session'
        ) {
          // BURACO CER-03C-10 CORRIGIDO: Resolver estritamente em cer_session_observations
          try {
            const obs = $app.findFirstRecordByData('cer_session_observations', 'id', evId)
            evAccess = obs.getString('access_class') || 'professional_private'
          } catch (_) {
            evAccess = 'professional_private'
          }
        }

        // Se a evidência for participant_private, o Knowledge Item SÓ pode ser participant_private
        if (evAccess === 'participant_private' && newAccess !== 'participant_private') {
          throw new BadRequestError(
            'Violação de privacidade derivada (anti-laundering): o Knowledge Item está vinculado a evidência participant_private e não pode ter access_class "' +
              newAccess +
              '".',
          )
        }

        // Se a evidência for professional_private, o Knowledge Item NÃO pode ser participant_shared, participant_private ou shared_care
        if (
          evAccess === 'professional_private' &&
          (newAccess === 'participant_private' ||
            newAccess === 'participant_shared' ||
            newAccess === 'shared_care')
        ) {
          throw new BadRequestError(
            'Violação de privacidade derivada (anti-laundering): o Knowledge Item está vinculado a evidência professional_private e não pode ter access_class visível ao participante ("' +
              newAccess +
              '").',
          )
        }
      }
    }

    // Validar vínculos de autorização para o autor do update (se autenticado)
    if (e.auth) {
      const authId = e.auth.id
      const enrollmentId = origEnrollment || newEnrollment

      let isParticipant = false
      try {
        const enr = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
        const personId = enr.getString('person_id')
        if (personId) {
          const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
          if (pUser.id === authId) {
            isParticipant = true
          }
        }
      } catch (_) {}

      let isProfessionalLinked = false
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
          isProfessionalLinked = true
        }
      } catch (_) {}

      if (!isParticipant && !isProfessionalLinked) {
        throw new BadRequestError('Usuário sem vínculo autorizado para este enrollment.')
      }

      if (!isParticipant && isProfessionalLinked && newAccess === 'participant_private') {
        throw new BadRequestError(
          'Profissional não pode definir Knowledge Item como participant_private.',
        )
      }

      if (isParticipant && newAccess === 'professional_private') {
        throw new BadRequestError(
          'Participante não pode definir Knowledge Item como professional_private.',
        )
      }
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

// Validação e Auditoria em cer_participant_recognitions (Atualizado para Build 04C):
// 1. Valida que recognition_type pertence ao vocabulário oficial
// 2. Valida que enrollment_id corresponde ao do Knowledge Item
// 3. Valida presentation_id (se presente):
//    - Presentation deve existir
//    - Presentation.status deve ser 'presented' (draft ou withdrawn -> NEGADO)
//    - Presentation.enrollment_id deve ser idêntico a recog.enrollment_id
//    - Presentation.knowledge_item_id deve ser idêntico a recog.knowledge_item_id
// 4. record_mode atribuído server-side de acordo com o ator autenticado:
//    - Se ator autenticado for a própria participante -> participant_self
//    - Se ator for profissional humano autorizado -> professional_recorded_participant_response
//    - Spoof do cliente é estritamente ignorado/corrigido ou negado
//    - Para professional_recorded_participant_response, Presentation deve ter channel = 'session'
// 5. Determinação de participant_user_id:
//    - SEMPRE é o usuário interagente do enrollment (se não vier, preenche do enrollment)
// 6. access_class:
//    - Se vinculado a Presentation -> SEMPRE 'shared_care' server-side
//    - Se legado (sem presentation_id) -> herda access_class do Knowledge Item (ou shared_care)
// 7. Salva audit event PARTICIPANT_RECOGNITION_CREATED sem vazar comment nem statement
// 8. Cria automaticamente uma Knowledge Evidence do tipo 'participant_recognition' para o Knowledge Item
onRecordCreate((e) => {
  const recog = e.record
  const kiId = recog.getString('knowledge_item_id')
  const enrollmentId = recog.getString('enrollment_id')
  const presId = recog.getString('presentation_id')

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

  // Identificar a participante dona do enrollment
  let enrollmentParticipantUserId = ''
  try {
    const enr = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
    const personId = enr.getString('person_id')
    if (personId) {
      const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
      enrollmentParticipantUserId = pUser.id
    }
  } catch (_) {}

  // Determinar e validar autor autenticado
  const authId = e.auth ? e.auth.id : ''
  const isAuthParticipant = authId && authId === enrollmentParticipantUserId

  let isAuthProfessionalLinked = false
  if (authId && !isAuthParticipant) {
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
        isAuthProfessionalLinked = true
      }
    } catch (_) {}
  }

  // Atribuição e validação de record_mode e participant_user_id
  if (isAuthParticipant) {
    // Participante respondendo diretamente
    recog.set('record_mode', 'participant_self')
    recog.set('participant_user_id', authId)
  } else if (isAuthProfessionalLinked) {
    // Profissional registrando resposta da participante
    recog.set('record_mode', 'professional_recorded_participant_response')
    // participant_user_id continua sendo a participante do enrollment
    if (enrollmentParticipantUserId) {
      recog.set('participant_user_id', enrollmentParticipantUserId)
    }
  } else if (e.auth) {
    throw new BadRequestError(
      'Usuário sem vínculo de autorização para registrar este reconhecimento.',
    )
  } else {
    // Sem auth (migrações/seeds server-side): garantir defaults válidos
    if (!recog.getString('record_mode')) {
      recog.set('record_mode', 'participant_self')
    }
    if (!recog.getString('participant_user_id') && enrollmentParticipantUserId) {
      recog.set('participant_user_id', enrollmentParticipantUserId)
    }
  }

  // Validações rigorosas quando presentation_id está presente:
  if (presId) {
    let pres = null
    try {
      pres = $app.findFirstRecordByData('cer_knowledge_presentations', 'id', presId)
    } catch (_) {
      throw new BadRequestError('Presentation referenciada não foi encontrada.')
    }

    const presStatus = pres.getString('status')
    if (presStatus === 'draft') {
      throw new BadRequestError(
        'Não é permitido registrar reconhecimento para uma Presentation em draft.',
      )
    }
    if (presStatus === 'withdrawn') {
      throw new BadRequestError(
        'Não é permitido registrar reconhecimento para uma Presentation retirada (withdrawn).',
      )
    }
    if (presStatus !== 'presented') {
      throw new BadRequestError(
        'Presentation deve estar no status "presented" para receber reconhecimento.',
      )
    }

    if (pres.getString('enrollment_id') !== enrollmentId) {
      throw new BadRequestError('Presentation pertence a outro enrollment.')
    }

    if (pres.getString('knowledge_item_id') !== kiId) {
      throw new BadRequestError('Presentation vinculada aponta para outro Knowledge Item.')
    }

    // Regra do record_mode com channel:
    // Profissional registrando em sessão exige channel = 'session'
    const actualRecordMode = recog.getString('record_mode')
    if (actualRecordMode === 'professional_recorded_participant_response') {
      if (pres.getString('channel') !== 'session') {
        throw new BadRequestError(
          'Profissional só pode registrar resposta verbal da participante para Presentations do canal "session".',
        )
      }
    }

    // DECISÃO CONGELADA BUILD 04C: Recognition com Presentation apresentada nasce SEMPRE shared_care
    recog.set('access_class', 'shared_care')
  } else {
    // Comportamento legado (sem presentation_id): herda do KI ou shared_care
    if (!recog.getString('access_class')) {
      recog.set('access_class', ki.getString('access_class') || 'shared_care')
    }
  }

  e.next()
}, 'cer_participant_recognitions')

// CER-03C-02: Participant Recognition é um evento longitudinal imutável.
// NENHUM update é permitido após o create (bloqueio server-side irrevogável).
onRecordUpdate((e) => {
  throw new BadRequestError(
    'Participant Recognition é um evento longitudinal imutável e não permite atualização. Registre um novo reconhecimento com timestamp próprio.',
  )
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
    let actorId = e.auth ? e.auth.id : recog.getString('participant_user_id')
    if (actorId) {
      audit.set('actor_user_id', actorId)
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
        presentation_id: recog.getString('presentation_id') || undefined,
        record_mode: recog.getString('record_mode') || undefined,
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
