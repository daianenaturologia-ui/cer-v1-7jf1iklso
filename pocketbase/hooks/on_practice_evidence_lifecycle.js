// Hook server-side do Build 08C: Lifecycle de Evidência e Claim Guard
// Coleções monitoradas: cer_practice_evidence, cer_practice_evidence_sources
// Regras e Decisões Congeladas:
// 1. Três eixos separados: Basis ≠ Confidence ≠ Maturity.
// 2. Reviewer ≠ Author na evidência formal.
// 3. Claim Guard: Proibir termos absolutistas ou promessas biomédicas sem suporte (cura, garantia, diagnóstico, comprovação definitiva, cura milagrosa, reverter doença).
// 4. Zero Delete Físico.
// 5. Auditoria de EVIDENCE_REVIEWED.

onRecordCreate((e) => {
  const ev = e.record
  if (!ev.getString('author_user_id') && e.auth) {
    ev.set('author_user_id', e.auth.id)
  }

  // Claim Guard no texto de claim
  const claimText = (ev.getString('supported_claim_text') || '').toLowerCase()
  const forbiddenTerms = [
    'cura',
    'garantia',
    'curar',
    'diagnóstico definitivo',
    'comprovação definitiva',
    'promessa de cura',
    'cura milagrosa',
    'elimina completamente a doença',
  ]

  for (let i = 0; i < forbiddenTerms.length; i++) {
    const term = forbiddenTerms[i]
    if (claimText.indexOf(term) !== -1) {
      throw new BadRequestError(
        'Claim Guard: O termo proibido "' + term + '" não é permitido em claims de práticas.',
      )
    }
  }

  // Validação reviewer != author se preenchido
  const authorId = ev.getString('author_user_id')
  const reviewerId = ev.getString('reviewer_user_id')
  if (reviewerId && authorId === reviewerId) {
    throw new BadRequestError(
      'Evidence Review: Revisor deve ser profissional distinto do autor da evidência.',
    )
  }

  e.next()
}, 'cer_practice_evidence')

onRecordUpdate((e) => {
  const ev = e.record
  const orig = ev.original()
  if (!orig) {
    e.next()
    return
  }

  // Claim Guard no texto de claim
  const claimText = (ev.getString('supported_claim_text') || '').toLowerCase()
  const forbiddenTerms = [
    'cura',
    'garantia',
    'curar',
    'diagnóstico definitivo',
    'comprovação definitiva',
    'promessa de cura',
    'cura milagrosa',
    'elimina completamente a doença',
  ]

  for (let i = 0; i < forbiddenTerms.length; i++) {
    const term = forbiddenTerms[i]
    if (claimText.indexOf(term) !== -1) {
      throw new BadRequestError(
        'Claim Guard: O termo proibido "' + term + '" não é permitido em claims de práticas.',
      )
    }
  }

  // Validação reviewer != author
  const authorId = ev.getString('author_user_id')
  const reviewerId = ev.getString('reviewer_user_id')
  if (reviewerId && authorId === reviewerId) {
    throw new BadRequestError(
      'Evidence Review: Revisor deve ser profissional distinto do autor da evidência.',
    )
  }

  e.next()
}, 'cer_practice_evidence')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const ev = e.record
    const orig = ev.original()
    if (!orig) return

    const origRev = orig.getString('reviewed_at')
    const newRev = ev.getString('reviewed_at')

    if (!origRev && newRev) {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const audit = new Record(auditCol)
      const actorId = e.auth ? e.auth.id : ev.getString('reviewer_user_id')
      if (actorId) {
        audit.set('actor_user_id', actorId)
      }
      audit.set('action', 'EVIDENCE_REVIEWED')
      audit.set('resource_type', 'cer_practice_evidence')
      audit.set('resource_id', ev.id)
      audit.set('timestamp', new Date().toISOString())
      audit.set('result', 'success')
      audit.set('request_context', 'server_practice_evidence_lifecycle')
      audit.set(
        'metadata',
        JSON.stringify({
          evidence_id: ev.id,
          practice_version_id: ev.getString('practice_version_id'),
          evidence_basis_type: ev.getString('evidence_basis_type'),
          confidence: ev.getString('confidence'),
          maturity: ev.getString('maturity'),
        }),
      )
      $app.save(audit)
    }
  } catch (_) {}
}, 'cer_practice_evidence')

onRecordDelete((e) => {
  throw new BadRequestError('Zero Delete Físico: Exclusão de Evidence não permitida.')
}, 'cer_practice_evidence')

onRecordDelete((e) => {
  throw new BadRequestError('Zero Delete Físico: Exclusão de Evidence Source não permitida.')
}, 'cer_practice_evidence_sources')
