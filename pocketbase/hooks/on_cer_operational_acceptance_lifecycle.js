// Hook server-side do Build 08B: Lifecycle e Isolamento Estrito de cer_operational_acceptances e cer_operational_acceptance_private_notes
// Collections: cer_operational_acceptances, cer_operational_acceptance_private_notes
//
// Regras e Decisões Congeladas:
// 1. Aceite (cer_operational_acceptances):
//    - response_type (7 valores fechados):
//      accepted | wants_to_try | too_much | wants_to_adapt | not_now | alternative_requested | wants_to_talk
//    - access_class = shared_care LOCKADO pelo sistema — hook bloqueia qualquer tentativa de elevação para participant_private.
//    - record_status: current | superseded.
//    - Aceite só pode referenciar presentation com status = 'presented' (withdrawn/superseded bloqueados).
//    - Nova decisão operacional = nova linha (record); anterior vira superseded.
//    - Acceptance ≠ Recognition (zero writes em cer_participant_recognitions).
//    - Acceptance ≠ Safety Consent (zero registro de consentimento formal).
// 2. Private Notes (cer_operational_acceptance_private_notes):
//    - participant-only estrito.
//    - Edição = nova linha com status 'current' e anterior 'superseded'.
//    - Auditoria de aceite carrega APENAS response_type, ids e timestamps — NUNCA texto íntimo nem private notes.
//    - Private notes NUNCA são auditadas em conteúdo.

onRecordCreate((e) => {
  const acc = e.record
  const presId = acc.getString('presentation_id')
  const respType = acc.getString('response_type')
  const accessClass = acc.getString('access_class') || 'shared_care'

  if (!acc.getString('participant_user_id') && e.auth) {
    acc.set('participant_user_id', e.auth.id)
  }

  // 1. Forçar e travar shared_care (proibido participant_private para a resposta compartilhada)
  if (accessClass !== 'shared_care') {
    throw new BadRequestError(
      'O aceite operacional é um processo de cuidado compartilhado e seu access_class deve ser estritamente "shared_care".',
    )
  }
  acc.set('access_class', 'shared_care')

  // 2. Validar response_type allowlist
  const validTypes = [
    'accepted',
    'wants_to_try',
    'too_much',
    'wants_to_adapt',
    'not_now',
    'alternative_requested',
    'wants_to_talk',
  ]
  if (validTypes.indexOf(respType) === -1) {
    throw new BadRequestError(
      'response_type "' + respType + '" inválido. Valores permitidos: ' + validTypes.join(', '),
    )
  }

  // 3. Validar apresentação e status = 'presented'
  let pres = null
  try {
    pres = $app.findFirstRecordByData('cer_care_plan_presentations', 'id', presId)
  } catch (_) {
    throw new BadRequestError('presentation_id inválido ou inexistente.')
  }

  if (pres.getString('status') !== 'presented') {
    throw new BadRequestError(
      'Aceite operacional só pode ser registrado para apresentações ativas no status "presented" (status atual: ' +
        pres.getString('status') +
        ').',
    )
  }

  // 4. Copiar e validar plano e enrollment
  const planId = pres.getString('plan_id')
  const enrId = pres.getString('enrollment_id')
  acc.set('plan_id', planId)
  acc.set('enrollment_id', enrId)
  if (pres.getString('priority_id')) {
    acc.set('priority_id', pres.getString('priority_id'))
  }

  // 5. Garantir que decisões anteriores para a mesma apresentação virem superseded
  try {
    const existing = $app.findRecordsByFilter(
      'cer_operational_acceptances',
      'presentation_id = "' + presId + '" && record_status = "current"',
      '',
      10,
      0,
    )
    for (let i = 0; i < existing.length; i++) {
      const ex = existing[i]
      ex.set('record_status', 'superseded')
      $app.save(ex)
    }
  } catch (_) {}

  acc.set('record_status', 'current')
  e.next()
}, 'cer_operational_acceptances')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const acc = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = acc.getString('participant_user_id') || (e.auth ? e.auth.id : '')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    audit.set('action', 'ACCEPTANCE_RECORDED')
    audit.set('resource_type', 'cer_operational_acceptances')
    audit.set('resource_id', acc.id)
    audit.set('enrollment_id', acc.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_acceptance_lifecycle')
    // ZERO conteúdo sensível — apenas ids e response_type
    audit.set(
      'metadata',
      JSON.stringify({
        acceptance_id: acc.id,
        presentation_id: acc.getString('presentation_id'),
        plan_id: acc.getString('plan_id'),
        priority_id: acc.getString('priority_id') || null,
        response_type: acc.getString('response_type'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_operational_acceptances')

// -------------------------------------------------------------
// Hooks de Private Notes (cer_operational_acceptance_private_notes)
// -------------------------------------------------------------
onRecordCreate((e) => {
  const note = e.record
  const accId = note.getString('acceptance_id')

  if (!note.getString('participant_user_id') && e.auth) {
    note.set('participant_user_id', e.auth.id)
  }

  // 1. Validar acceptance
  let acc = null
  try {
    acc = $app.findFirstRecordByData('cer_operational_acceptances', 'id', accId)
  } catch (_) {
    throw new BadRequestError('acceptance_id inválido ou inexistente.')
  }

  // 2. Isolamento de participante
  const enrId = acc.getString('enrollment_id')
  note.set('enrollment_id', enrId)

  // 3. Se houver nota current anterior para o mesmo acceptance, marcar superseded
  try {
    const prevNotes = $app.findRecordsByFilter(
      'cer_operational_acceptance_private_notes',
      'acceptance_id = "' + accId + '" && status = "current"',
      '',
      10,
      0,
    )
    for (let i = 0; i < prevNotes.length; i++) {
      const pn = prevNotes[i]
      pn.set('status', 'superseded')
      $app.save(pn)
    }
  } catch (_) {}

  note.set('status', 'current')
  e.next()
}, 'cer_operational_acceptance_private_notes')
