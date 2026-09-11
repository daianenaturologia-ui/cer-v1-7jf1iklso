// Hook server-side do Build 08C: Lifecycle de Consentimento e Isolamento de Notas Privadas
// Coleções monitoradas: cer_practice_consents, cer_practice_consent_private_notes
// Regras e Decisões Congeladas:
// 1. ANCHOR À PRACTICE VERSION EXATA:
//    - Consentimento é atrelado à practice_version_id específica.
//    - Consent de v2 NÃO autoriza v3.
//    - Publicação de v3 NÃO invalida nem altera consent histórico de v2 (history intacta).
// 2. WITHDRAWAL:
//    - Pode ser revogado (status = 'withdrawn').
//    - Withdrawal definitivo bloqueia uso futuro daquela version.
//    - Zero resistance signal: withdrawal NUNCA se converte em signal de resistência.
// 3. RE-CONSENTIMENTO:
//    - Novo consentimento da MESMA versão: cria nova linha current; anterior torna-se superseded.
// 4. PRIVATE NOTES:
//    - participant-only estrito.
//    - NUNCA vai para audit, AI, safety rationale ou preparação profissional.
// 5. Zero Delete Físico.
// 6. Auditoria de eventos: CONSENT_PRESENTED, CONSENT_ACCEPTED, CONSENT_DECLINED, CONSENT_WITHDRAWN.

onRecordCreate((e) => {
  const c = e.record
  const versionId = c.getString('practice_version_id')
  const partId = c.getString('participant_user_id')
  const decision = c.getString('decision')

  if (!partId && e.auth) {
    c.set('participant_user_id', e.auth.id)
  }
  if (!c.getString('record_status')) {
    c.set('record_status', 'current')
  }

  // 1. Validar PracticeVersion
  let pv = null
  try {
    pv = $app.findFirstRecordByData('cer_practice_versions', 'id', versionId)
  } catch (_) {
    throw new BadRequestError('practice_version_id inválido ou inexistente.')
  }

  // Não pode obter consentimento de prática retired
  if (pv.getString('status') === 'retired') {
    throw new BadRequestError(
      'Prática aposentada (retired) por segurança: novos consentimentos são bloqueados.',
    )
  }

  // 2. Re-consentimento da MESMA versão: marcar anterior como superseded
  const actualPartId = c.getString('participant_user_id')
  try {
    const existing = $app.findRecordsByFilter(
      'cer_practice_consents',
      'participant_user_id = "' +
        actualPartId +
        '" && practice_version_id = "' +
        versionId +
        '" && record_status = "current"',
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

  e.next()
}, 'cer_practice_consents')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const c = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = c.getString('participant_user_id') || (e.auth ? e.auth.id : '')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    const decision = c.getString('decision')
    const action = decision === 'accepted' ? 'CONSENT_ACCEPTED' : 'CONSENT_DECLINED'

    audit.set('action', action)
    audit.set('resource_type', 'cer_practice_consents')
    audit.set('resource_id', c.id)
    audit.set('enrollment_id', c.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_consent_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        consent_id: c.id,
        practice_version_id: c.getString('practice_version_id'),
        decision: decision,
        understanding_response: c.getString('understanding_response'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_practice_consents')

onRecordUpdate((e) => {
  const c = e.record
  const orig = c.original()
  if (!orig) {
    e.next()
    return
  }

  // Imutabilidade da âncora
  if (c.getString('practice_version_id') !== orig.getString('practice_version_id')) {
    throw new BadRequestError('Não é permitido alterar practice_version_id de um Consent.')
  }
  if (c.getString('participant_user_id') !== orig.getString('participant_user_id')) {
    throw new BadRequestError('Não é permitido alterar participant_user_id de um Consent.')
  }

  const origStatus = orig.getString('record_status')
  const newStatus = c.getString('record_status')

  // Withdrawal logic
  if (origStatus !== newStatus && newStatus === 'withdrawn') {
    if (!c.getString('withdrawn_at')) {
      c.set('withdrawn_at', new Date().toISOString())
    }
  }

  e.next()
}, 'cer_practice_consents')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const c = e.record
    const orig = c.original()
    if (!orig) return

    const origStatus = orig.getString('record_status')
    const newStatus = c.getString('record_status')

    if (origStatus !== newStatus && newStatus === 'withdrawn') {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const audit = new Record(auditCol)
      const actorId = c.getString('participant_user_id') || (e.auth ? e.auth.id : '')
      if (actorId) {
        audit.set('actor_user_id', actorId)
      }
      audit.set('action', 'CONSENT_WITHDRAWN')
      audit.set('resource_type', 'cer_practice_consents')
      audit.set('resource_id', c.id)
      audit.set('enrollment_id', c.getString('enrollment_id'))
      audit.set('timestamp', new Date().toISOString())
      audit.set('result', 'success')
      audit.set('request_context', 'server_consent_lifecycle')
      audit.set(
        'metadata',
        JSON.stringify({
          consent_id: c.id,
          practice_version_id: c.getString('practice_version_id'),
          withdrawal_reason: c.getString('withdrawal_reason') || undefined,
        }),
      )
      $app.save(audit)
    }
  } catch (_) {}
}, 'cer_practice_consents')

// -------------------------------------------------------------
// Hooks de Private Notes de Consent (cer_practice_consent_private_notes)
// -------------------------------------------------------------
onRecordCreate((e) => {
  const note = e.record
  const consentId = note.getString('consent_id')

  if (!note.getString('participant_user_id') && e.auth) {
    note.set('participant_user_id', e.auth.id)
  }

  // 1. Validar consent
  let consent = null
  try {
    consent = $app.findFirstRecordByData('cer_practice_consents', 'id', consentId)
  } catch (_) {
    throw new BadRequestError('consent_id inválido ou inexistente.')
  }

  note.set('enrollment_id', consent.getString('enrollment_id'))

  // 2. Supersede nota anterior do mesmo consentimento
  try {
    const prevNotes = $app.findRecordsByFilter(
      'cer_practice_consent_private_notes',
      'consent_id = "' + consentId + '" && status = "current"',
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
}, 'cer_practice_consent_private_notes')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Zero Delete Físico: Exclusão de Consent não permitida. Use retirada de consentimento (withdrawn).',
  )
}, 'cer_practice_consents')

onRecordDelete((e) => {
  throw new BadRequestError('Zero Delete Físico: Exclusão de Private Note não permitida.')
}, 'cer_practice_consent_private_notes')
