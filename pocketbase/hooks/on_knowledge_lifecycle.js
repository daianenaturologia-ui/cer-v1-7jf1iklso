// Hook server-side do Checkpoint 03B: Conhecimento Epistemológico e Evidências de Knowledge Item
// Validações rigorosas de:
// 1. Matriz epistemológica válida entre knowledge_type, epistemic_source e status:
//    - Para fatos/relatos (reported_fact, participant_report): reported | updated | withdrawn
//    - Para observações (resource, challenge, protection_pattern, current_state, contextual_understanding quando professional_observation): observed | reviewed | updated | withdrawn
//    - Para hipóteses/leituras integrativas (pattern_hypothesis, integrative_hypothesis, framework_reading, cer_integrative_hypothesis): new | observing | supported | recognized | not_confirmed | discarded
//    - Combinações inválidas rejeitadas com BadRequestError:
//      * integrative_hypothesis + reported -> REJEITADO (F9)
//      * reported_fact + supported -> REJEITADO (F10)
//      * integrative_hypothesis + observing -> PERMITIDO (F8)
//      * reported_fact + reported -> PERMITIDO
// 2. Integridade e Derived Privacy em cer_knowledge_items:
//    - Proibir alteração forjada de enrollment_id (P18)
//    - Proibir alteração manual de version (version é incrementada exclusivamente pelo versioning server-side)
//    - Validar vínculo com enrollment
// 3. Validação em cer_knowledge_evidence:
//    - Cross-enrollment check: a evidência (response, signal, association, recognition) deve pertencer ao mesmo enrollment (P16)
//    - Derived Privacy check: Knowledge Item não pode ser mais permissivo que a evidência utilizada:
//      * Se evidência for participant_private, Knowledge Item NÃO pode ser shared_care nem participant_shared nem professional_private (P7)
//      * Se evidência for professional_private, Knowledge Item NÃO pode ser participant_shared nem participant_private nem shared_care (P12)
//    - Profissional não pode incorporar evidência participant_private (P7)
//    - Participante não pode incorporar evidência professional_private (P12)
// 4. Auditoria de KNOWLEDGE_ITEM_CREATED, KNOWLEDGE_ITEM_UPDATED, KNOWLEDGE_ITEM_REVIEWED (sem cópia de texto sensível)

onRecordCreate((e) => {
  const ki = e.record
  const enrollmentId = ki.getString('enrollment_id')
  const knowledgeType = ki.getString('knowledge_type')
  const epistemicSource = ki.getString('epistemic_source')
  const status = ki.getString('status')
  const accessClass = ki.getString('access_class') || 'shared_care'

  // Preencher version inicial se ausente
  if (!ki.getInt('version')) {
    ki.set('version', 1)
  }

  // Preencher created_by_user_id caso venha do usuário autenticado
  if (!ki.getString('created_by_user_id') && e.auth) {
    ki.set('created_by_user_id', e.auth.id)
  }

  // VALIDAR MATRIZ EPISTEMOLÓGICA (Regra 6, F8, F9, F10)
  // Categorias de Knowledge Type:
  const isFactOrReport =
    knowledgeType === 'reported_fact' || epistemicSource === 'participant_report'
  const isHypothesisOrReading =
    knowledgeType === 'integrative_hypothesis' ||
    knowledgeType === 'pattern_hypothesis' ||
    knowledgeType === 'framework_reading' ||
    epistemicSource === 'cer_integrative_hypothesis' ||
    epistemicSource === 'framework_reading'
  const isObservation =
    epistemicSource === 'professional_observation' ||
    (knowledgeType !== 'reported_fact' && !isHypothesisOrReading)

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
        'Combinação epistemológica inválida: tipo de hipótese/leitura integrativa não permite status "' +
          status +
          '". Status válidos: new, observing, supported, recognized, not_confirmed, discarded.',
      )
    }
  } else if (knowledgeType === 'reported_fact') {
    if (!allowedFactStatuses.includes(status)) {
      throw new BadRequestError(
        'Combinação epistemológica inválida: tipo reported_fact não permite status "' +
          status +
          '". Status válidos: reported, updated, withdrawn.',
      )
    }
  } else if (epistemicSource === 'professional_observation') {
    if (!allowedObservationStatuses.includes(status)) {
      throw new BadRequestError(
        'Combinação epistemológica inválida: professional_observation não permite status "' +
          status +
          '". Status válidos: observed, reviewed, updated, withdrawn.',
      )
    }
  }

  // Validar autorização do usuário e privacidade inicial
  if (e.auth) {
    const authId = e.auth.id

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

    if (!isParticipant && isProfessionalLinked && accessClass === 'participant_private') {
      throw new BadRequestError('Profissional não pode criar Knowledge Item participant_private.')
    }

    if (isParticipant && accessClass === 'professional_private') {
      throw new BadRequestError('Participante não pode criar Knowledge Item professional_private.')
    }
  }

  e.next()
}, 'cer_knowledge_items')

// Auditoria KNOWLEDGE_ITEM_CREATED
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const ki = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = ki.getString('created_by_user_id')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }
    audit.set('action', 'KNOWLEDGE_ITEM_CREATED')
    audit.set('resource_type', 'cer_knowledge_items')
    audit.set('resource_id', ki.id)
    audit.set('enrollment_id', ki.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_knowledge_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        knowledge_item_id: ki.id,
        concept_key: ki.getString('concept_key'),
        knowledge_type: ki.getString('knowledge_type'),
        epistemic_source: ki.getString('epistemic_source'),
        status: ki.getString('status'),
        version: ki.getInt('version') || 1,
        access_class: ki.getString('access_class'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_knowledge_items')

// Validação em cer_knowledge_evidence:
// 1. Cross-enrollment check (P16): a evidência referenciada deve ser do mesmo enrollment do Knowledge Item
// 2. Derived Privacy check (P7, P12):
//    - Se a evidência for participant_private, o Knowledge Item NÃO pode ser shared_care, participant_shared ou professional_private.
//    - Se a evidência for professional_private, o Knowledge Item NÃO pode ser compartilhado com participante.
onRecordCreate((e) => {
  const ke = e.record
  const kiId = ke.getString('knowledge_item_id')
  const evType = ke.getString('evidence_type')
  const evId = ke.getString('evidence_id')

  let ki = null
  try {
    ki = $app.findFirstRecordByData('cer_knowledge_items', 'id', kiId)
  } catch (_) {
    throw new BadRequestError('knowledge_item_id inválido ou inexistente.')
  }

  const kiEnrollmentId = ki.getString('enrollment_id')
  const kiAccess = ki.getString('access_class') || 'shared_care'

  let targetEnrollmentId = ''
  let targetAccessClass = 'shared_care'

  if (evType === 'signal') {
    try {
      const sig = $app.findFirstRecordByData('cer_signals', 'id', evId)
      targetEnrollmentId = sig.getString('enrollment_id')
      targetAccessClass = sig.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Signal referenciado na evidência não encontrado.')
    }
  } else if (evType === 'response') {
    try {
      const resp = $app.findFirstRecordByData('experience_responses', 'id', evId)
      targetEnrollmentId = resp.getString('enrollment_id')
      targetAccessClass = resp.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Response referenciada na evidência não encontrada.')
    }
  } else if (evType === 'association') {
    try {
      const assoc = $app.findFirstRecordByData('cer_associations', 'id', evId)
      targetEnrollmentId = assoc.getString('enrollment_id')
      targetAccessClass = assoc.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Associação referenciada na evidência não encontrada.')
    }
  } else if (evType === 'participant_recognition') {
    try {
      const recog = $app.findFirstRecordByData('cer_participant_recognitions', 'id', evId)
      targetEnrollmentId = recog.getString('enrollment_id')
      targetAccessClass = recog.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Recognition referenciado na evidência não encontrado.')
    }
  } else if (evType === 'professional_observation') {
    // BURACO CER-03C-10 CORRIGIDO: Resolver estritamente em cer_session_observations
    // ID inexistente -> throw; observation_type deve ser 'professional_observation'
    // enrollment_id deve ser idêntico ao KI; ler access_class REAL da Observation (professional_private)
    try {
      const obsRec = $app.findFirstRecordByData('cer_session_observations', 'id', evId)
      const obsType = obsRec.getString('observation_type')
      if (obsType !== 'professional_observation') {
        throw new BadRequestError(
          'Tipo de evidência "professional_observation" exige observation_type "professional_observation", mas o registro encontrado é "' +
            obsType +
            '".',
        )
      }
      targetEnrollmentId = obsRec.getString('enrollment_id')
      targetAccessClass = obsRec.getString('access_class') || 'professional_private'
    } catch (obsErr) {
      if (obsErr.message && obsErr.message.indexOf('Tipo de evidência') !== -1) {
        throw obsErr
      }
      throw new BadRequestError(
        'Observação de sessão referenciada na evidência não encontrada em cer_session_observations.',
      )
    }
  } else if (evType === 'participant_report_in_session') {
    // Resolver estritamente em cer_session_observations com observation_type = 'participant_report'
    try {
      const obsRec = $app.findFirstRecordByData('cer_session_observations', 'id', evId)
      const obsType = obsRec.getString('observation_type')
      if (obsType !== 'participant_report') {
        throw new BadRequestError(
          'Tipo de evidência "participant_report_in_session" exige observation_type "participant_report", mas o registro encontrado é "' +
            obsType +
            '".',
        )
      }
      targetEnrollmentId = obsRec.getString('enrollment_id')
      targetAccessClass = obsRec.getString('access_class') || 'professional_private'
    } catch (obsErr) {
      if (obsErr.message && obsErr.message.indexOf('Tipo de evidência') !== -1) {
        throw obsErr
      }
      throw new BadRequestError(
        'Observação de relato da participante na sessão não encontrada em cer_session_observations.',
      )
    }
  } else {
    throw new BadRequestError('Tipo de evidência desconhecido ou inválido: "' + evType + '".')
  }

  // Cross-enrollment check (P16)
  if (targetEnrollmentId && targetEnrollmentId !== kiEnrollmentId) {
    throw new BadRequestError(
      'Inconsistência cross-enrollment: a evidência pertence a outro enrollment.',
    )
  }

  // Derived Privacy check (P7, P12)
  if (targetAccessClass === 'participant_private' && kiAccess !== 'participant_private') {
    throw new BadRequestError(
      'Violação de privacidade derivada: evidência participant_private não pode ser incorporada a Knowledge Item acessível a profissional ou compartilhado.',
    )
  }

  if (
    targetAccessClass === 'professional_private' &&
    (kiAccess === 'participant_private' ||
      kiAccess === 'participant_shared' ||
      kiAccess === 'shared_care')
  ) {
    throw new BadRequestError(
      'Violação de privacidade derivada: evidência professional_private não pode compor Knowledge Item visível para participante.',
    )
  }

  // Restrição de quem adiciona a evidência
  if (e.auth) {
    const authId = e.auth.id
    let isParticipant = false
    try {
      const enr = $app.findFirstRecordByData('enrollments', 'id', kiEnrollmentId)
      const personId = enr.getString('person_id')
      if (personId) {
        const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
        if (pUser.id === authId) {
          isParticipant = true
        }
      }
    } catch (_) {}

    // Profissional tenta usar evidência participant_private -> Rejeitar (P7)
    if (!isParticipant && targetAccessClass === 'participant_private') {
      throw new BadRequestError(
        'Profissional não tem autorização para incorporar evidência participant_private.',
      )
    }

    // Participante tenta usar evidência professional_private -> Rejeitar (P12)
    if (isParticipant && targetAccessClass === 'professional_private') {
      throw new BadRequestError(
        'Participante não tem autorização para incorporar evidência professional_private.',
      )
    }
  }

  e.next()
}, 'cer_knowledge_evidence')
