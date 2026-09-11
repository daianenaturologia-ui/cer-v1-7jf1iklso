// Hook server-side do Build 08C: Governança de Propostas de Candidatos de Práticas da IA
// Coleção monitorada: cer_ai_proposals (com proposal_type = 'practice_candidate_suggestion')
// Regras e Decisões Congeladas:
// 1. IA PODE: sugerir candidatos de práticas existentes, explicar fit, apontar cautions, apontar missing info, resumir evidências.
// 2. IA NÃO PODE: declarar safe, criar Safety Check outcome, definir grade final de evidência, obter consentimento, criar Assignment, prescrever dose, publicar PracticeVersion.
// 3. IA PROPOSAL PROIBIDO COMO SAFETY CHECK SOURCE (defesa em profundidade).
// 4. Fluxo: AI Proposal -> pending_review -> human professional review.
// 5. Auditoria de eventos: PRACTICE_CANDIDATE_PROPOSED, PRACTICE_CANDIDATE_REVIEWED.

onRecordCreate((e) => {
  const prop = e.record
  const pType = prop.getString('proposal_type')

  if (pType === 'practice_candidate_suggestion') {
    // Garantir status pending_review
    if (prop.getString('status') && prop.getString('status') !== 'pending_review') {
      throw new BadRequestError(
        'Sugestão de Prática gerada por IA deve ser criada com status "pending_review".',
      )
    }

    // Validar que o texto da IA não afirma declaração de segurança médica ou prescrição
    const text = (prop.getString('proposal_text') || '').toLowerCase()
    const forbiddenPatterns = [
      'declaro seguro',
      'está 100% seguro',
      'prática considerada segura sem necessidade de avaliação',
      'prescrevo a prática',
      'prescrição confirmada',
      'dispensa consentimento',
    ]
    for (let i = 0; i < forbiddenPatterns.length; i++) {
      const p = forbiddenPatterns[i]
      if (text.indexOf(p) !== -1) {
        throw new BadRequestError(
          'AI Safety Gate: A IA não tem permissão para emitir julgamento de segurança ou prescrição médica/terapêutica ("' +
            p +
            '").',
        )
      }
    }
  }

  e.next()
}, 'cer_ai_proposals')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const prop = e.record
    if (prop.getString('proposal_type') === 'practice_candidate_suggestion') {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const audit = new Record(auditCol)
      const actorId = prop.getString('requested_by_user_id') || (e.auth ? e.auth.id : '')
      if (actorId) {
        audit.set('actor_user_id', actorId)
      }
      audit.set('action', 'PRACTICE_CANDIDATE_PROPOSED')
      audit.set('resource_type', 'cer_ai_proposals')
      audit.set('resource_id', prop.id)
      audit.set('enrollment_id', prop.getString('enrollment_id'))
      audit.set('timestamp', new Date().toISOString())
      audit.set('result', 'success')
      audit.set('request_context', 'server_ai_candidate_lifecycle')
      audit.set(
        'metadata',
        JSON.stringify({
          proposal_id: prop.id,
          proposal_type: prop.getString('proposal_type'),
          status: prop.getString('status'),
        }),
      )
      $app.save(audit)
    }
  } catch (_) {}
}, 'cer_ai_proposals')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const prop = e.record
    if (prop.getString('proposal_type') === 'practice_candidate_suggestion') {
      const orig = prop.original()
      const origStatus = orig ? orig.getString('status') : ''
      const newStatus = prop.getString('status')

      if (origStatus !== newStatus || prop.getString('review_action')) {
        const auditCol = $app.findCollectionByNameOrId('audit_events')
        const audit = new Record(auditCol)
        const actorId = e.auth ? e.auth.id : prop.getString('reviewed_by_user_id')
        if (actorId) {
          audit.set('actor_user_id', actorId)
        }
        audit.set('action', 'PRACTICE_CANDIDATE_REVIEWED')
        audit.set('resource_type', 'cer_ai_proposals')
        audit.set('resource_id', prop.id)
        audit.set('enrollment_id', prop.getString('enrollment_id'))
        audit.set('timestamp', new Date().toISOString())
        audit.set('result', 'success')
        audit.set('request_context', 'server_ai_candidate_lifecycle')
        audit.set(
          'metadata',
          JSON.stringify({
            proposal_id: prop.id,
            previous_status: origStatus,
            new_status: newStatus,
            review_action: prop.getString('review_action'),
          }),
        )
        $app.save(audit)
      }
    }
  } catch (_) {}
}, 'cer_ai_proposals')
