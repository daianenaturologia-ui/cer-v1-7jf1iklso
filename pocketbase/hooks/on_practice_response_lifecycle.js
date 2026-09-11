// Hook server-side do Build 08E: Lifecycle, Versionamento e Regras de cer_practice_responses e cer_practice_response_private_notes
// Coleções monitoradas: cer_practice_responses, cer_practice_response_private_notes
//
// Regras e Decisões Congeladas:
// 1. LIFECYCLE E VERSIONAMENTO:
//    - record_status: current | superseded
//    - Correção material: nova row com previous_response_id + anterior vira superseded
//    - NUNCA sobrescrever histórico silenciosamente
//    - Sem status 'draft'
// 2. RESPONSE TYPES:
//    - helped, helped_a_bit, no_perceived_difference, was_difficult, was_too_much,
//      could_not_do, chose_not_to_do, adapted, did_not_make_sense, wants_to_tell
//    - NÃO criar success / failure / nonadherent / resistant
// 3. SAFETY FLAG:
//    - none | needs_review | escalation_required
//    - was_too_much -> needs_review AUTOMATICAMENTE (nunca escalation_required automática)
//    - escalation_required: exige Safety Recheck NOVO (novo cer_practice_safety_checks, nunca editar anterior)
//      e gera evento SAFETY_RECHECK_REQUESTED
//    - Redução de flag: somente profissional via nova response version
//    - Flag imutável na row — evolução por nova version
// 4. PRIVACIDADE:
//    - cer_practice_responses é OPERACIONAL e SHARED_CARE
//    - shared_reflection = apenas texto que o participante explicitamente decidiu compartilhar
//    - cer_practice_response_private_notes = participant-only estrito
// 5. AUDIT:
//    - PRACTICE_RESPONSE_RECORDED, PRACTICE_RESPONSE_SUPERSEDED, SAFETY_RECHECK_REQUESTED
// 6. ZERO DELETE FÍSICO:
//    - deleteRule = null e throw BadRequestError em onRecordDelete

onRecordCreate((e) => {
  const r = e.record
  const rType = r.getString('response_type')
  let sFlag = r.getString('safety_flag') || 'none'

  // Garantir participante autor
  if (!r.getString('participant_user_id') && e.auth) {
    r.set('participant_user_id', e.auth.id)
  }

  // Garantir record_status = 'current' na criação
  if (!r.getString('record_status')) {
    r.set('record_status', 'current')
  }

  // Regra P0 de Safety Flag: was_too_much força needs_review (se ainda 'none')
  // NUNCA was_too_much -> escalation_required automática
  if (rType === 'was_too_much' && sFlag === 'none') {
    sFlag = 'needs_review'
    r.set('safety_flag', sFlag)
  }

  // Se tiver previous_response_id, marcar anterior como superseded
  const prevId = r.getString('previous_response_id')
  if (prevId) {
    try {
      const prev = $app.findFirstRecordByData('cer_practice_responses', 'id', prevId)
      if (prev) {
        prev.set('record_status', 'superseded')
        $app.save(prev)
      }
    } catch (_) {}
  }

  e.next()
}, 'cer_practice_responses')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const r = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const actorId = e.auth ? e.auth.id : r.getString('participant_user_id')

    // 1. PRACTICE_RESPONSE_RECORDED
    const audit = new Record(auditCol)
    if (actorId) audit.set('actor_user_id', actorId)
    audit.set('action', 'PRACTICE_RESPONSE_RECORDED')
    audit.set('resource_type', 'cer_practice_responses')
    audit.set('resource_id', r.id)
    audit.set('enrollment_id', r.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_practice_response_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        response_id: r.id,
        assignment_id: r.getString('assignment_id'),
        response_type: r.getString('response_type'),
        safety_flag: r.getString('safety_flag'),
        record_status: r.getString('record_status'),
        previous_response_id: r.getString('previous_response_id') || undefined,
      }),
    )
    $app.save(audit)

    // Se houve previous_response_id, registrar PRACTICE_RESPONSE_SUPERSEDED
    const prevId = r.getString('previous_response_id')
    if (prevId) {
      try {
        const auditSup = new Record(auditCol)
        if (actorId) auditSup.set('actor_user_id', actorId)
        auditSup.set('action', 'PRACTICE_RESPONSE_SUPERSEDED')
        auditSup.set('resource_type', 'cer_practice_responses')
        auditSup.set('resource_id', prevId)
        auditSup.set('enrollment_id', r.getString('enrollment_id'))
        auditSup.set('timestamp', new Date().toISOString())
        auditSup.set('result', 'success')
        auditSup.set('request_context', 'server_practice_response_lifecycle')
        auditSup.set(
          'metadata',
          JSON.stringify({
            superseded_by_response_id: r.id,
            assignment_id: r.getString('assignment_id'),
          }),
        )
        $app.save(auditSup)
      } catch (_) {}
    }

    // Se safety_flag === 'escalation_required', criar Safety Recheck NOVO e emitir SAFETY_RECHECK_REQUESTED
    const sFlag = r.getString('safety_flag')
    if (sFlag === 'escalation_required') {
      try {
        const checksCol = $app.findCollectionByNameOrId('cer_practice_safety_checks')
        const newCheck = new Record(checksCol)
        newCheck.set('practice_version_id', r.getString('practice_version_id'))
        newCheck.set('enrollment_id', r.getString('enrollment_id'))
        newCheck.set('outcome', 'requires_professional_review')
        newCheck.set('record_status', 'current')
        newCheck.set(
          'professional_rationale',
          'Safety Recheck gerado automaticamente por escalation_required em Resposta de Prática.',
        )
        newCheck.set(
          'metadata',
          JSON.stringify({
            trigger_source: 'practice_response',
            trigger_response_id: r.id,
            assignment_id: r.getString('assignment_id'),
          }),
        )
        $app.save(newCheck)

        const auditRecheck = new Record(auditCol)
        if (actorId) auditRecheck.set('actor_user_id', actorId)
        auditRecheck.set('action', 'SAFETY_RECHECK_REQUESTED')
        auditRecheck.set('resource_type', 'cer_practice_safety_checks')
        auditRecheck.set('resource_id', newCheck.id)
        auditRecheck.set('enrollment_id', r.getString('enrollment_id'))
        auditRecheck.set('timestamp', new Date().toISOString())
        auditRecheck.set('result', 'success')
        auditRecheck.set('request_context', 'server_practice_response_lifecycle')
        auditRecheck.set(
          'metadata',
          JSON.stringify({
            safety_check_id: newCheck.id,
            practice_version_id: r.getString('practice_version_id'),
            trigger_response_id: r.id,
          }),
        )
        $app.save(auditRecheck)
      } catch (_) {}
    }
  } catch (_) {}
}, 'cer_practice_responses')

onRecordUpdate((e) => {
  const r = e.record
  const orig = r.original()
  if (!orig) {
    e.next()
    return
  }

  // Imutabilidade das âncoras e da safety_flag na mesma linha
  if (r.getString('assignment_id') !== orig.getString('assignment_id')) {
    throw new BadRequestError('Não é permitido alterar assignment_id de uma Response existente.')
  }
  if (r.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('Não é permitido alterar enrollment_id de uma Response existente.')
  }
  if (r.getString('participant_user_id') !== orig.getString('participant_user_id')) {
    throw new BadRequestError(
      'Não é permitido alterar participant_user_id de uma Response existente.',
    )
  }
  if (r.getString('safety_flag') !== orig.getString('safety_flag')) {
    throw new BadRequestError(
      'Imutabilidade da Safety Flag: A flag de segurança não pode ser alterada na mesma linha. Evolução exige nova response version.',
    )
  }

  e.next()
}, 'cer_practice_responses')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Zero Delete Físico: Exclusão de Practice Response não permitida. Histórico é imutável e versionado.',
  )
}, 'cer_practice_responses')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Zero Delete Físico: Exclusão de Practice Response Private Note não permitida.',
  )
}, 'cer_practice_response_private_notes')
