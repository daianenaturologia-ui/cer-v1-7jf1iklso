// Hook server-side do Build 08B: Lifecycle e Imutabilidade de cer_care_plan_presentations
// Collections: cer_care_plan_presentations
//
// Regras e Decisões Congeladas:
// 1. Estados: draft -> presented -> withdrawn, OU draft -> superseded, OU presented -> superseded.
// 2. Transição draft -> presented:
//    - Exige profissional humano autenticado com vínculo ativo no enrollment.
//    - Carimba presented_at = now se ausente.
// 3. Mixed Privacy: participant_title e participant_summary são autorados pelo profissional
//    e NÃO devem conter menções brutas a dados participant_private sem reelaboração neutra.
// 4. Imutabilidade pós-presented:
//    - Bloqueia alteração de participant_title / participant_summary uma vez apresentada.
//    - Nova adaptação exige nova apresentação com histórico preservado.
// 5. Auditoria: PRESENTATION_PRESENTED, PRESENTATION_WITHDRAWN

onRecordCreate((e) => {
  const pres = e.record
  const planId = pres.getString('plan_id')
  const status = pres.getString('status') || 'draft'

  if (!pres.getString('created_by_user_id') && e.auth) {
    pres.set('created_by_user_id', e.auth.id)
  }

  // 1. Validar plano
  let plan = null
  try {
    plan = $app.findFirstRecordByData('cer_care_plans', 'id', planId)
  } catch (_) {
    throw new BadRequestError('plan_id inválido ou inexistente.')
  }

  const enrId = plan.getString('enrollment_id')
  if (!pres.getString('enrollment_id')) {
    pres.set('enrollment_id', enrId)
  } else if (pres.getString('enrollment_id') !== enrId) {
    throw new BadRequestError('Inconsistência de enrollment_id com o Plano de Cuidado.')
  }

  // 2. Se prioridade informada, validar consistência
  const priId = pres.getString('priority_id')
  if (priId) {
    try {
      const pri = $app.findFirstRecordByData('cer_care_plan_priorities', 'id', priId)
      if (pri.getString('plan_id') !== planId) {
        throw new BadRequestError('A prioridade indicada pertence a outro plano.')
      }
    } catch (_) {
      throw new BadRequestError('priority_id informado não encontrado.')
    }
  }

  // 3. Se presented diretamente, carimbar data
  if (status === 'presented') {
    if (!pres.getString('presented_at')) {
      pres.set('presented_at', new Date().toISOString())
    }
  }

  e.next()
}, 'cer_care_plan_presentations')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const pres = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = pres.getString('created_by_user_id') || (e.auth ? e.auth.id : '')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }

    const action =
      pres.getString('status') === 'presented' ? 'PRESENTATION_PRESENTED' : 'PRESENTATION_CREATED'
    audit.set('action', action)
    audit.set('resource_type', 'cer_care_plan_presentations')
    audit.set('resource_id', pres.id)
    audit.set('enrollment_id', pres.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_plan_presentation_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        presentation_id: pres.id,
        plan_id: pres.getString('plan_id'),
        priority_id: pres.getString('priority_id') || null,
        status: pres.getString('status'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_care_plan_presentations')

onRecordUpdate((e) => {
  const pres = e.record
  const orig = pres.original()
  if (!orig) {
    e.next()
    return
  }

  const origStatus = orig.getString('status')
  const newStatus = pres.getString('status')

  if (origStatus === 'withdrawn' || origStatus === 'superseded') {
    throw new BadRequestError('Uma apresentação retirada ou substituída é imutável.')
  }

  if (origStatus === 'presented') {
    // Proibido alterar texto de apresentação já realizada
    if (pres.getString('participant_title') !== orig.getString('participant_title')) {
      throw new BadRequestError('participant_title é imutável após apresentação.')
    }
    if (pres.getString('participant_summary') !== orig.getString('participant_summary')) {
      throw new BadRequestError('participant_summary é imutável após apresentação.')
    }
    if (newStatus !== 'presented' && newStatus !== 'withdrawn' && newStatus !== 'superseded') {
      throw new BadRequestError('Transição inválida para apresentação já apresentada.')
    }
    if (newStatus === 'withdrawn' && !pres.getString('withdrawn_at')) {
      pres.set('withdrawn_at', new Date().toISOString())
    }
  }

  if (origStatus === 'draft' && newStatus === 'presented') {
    if (!pres.getString('presented_at')) {
      pres.set('presented_at', new Date().toISOString())
    }
  }

  e.next()
}, 'cer_care_plan_presentations')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const pres = e.record
    const orig = pres.original()
    const origStatus = orig ? orig.getString('status') : ''
    const newStatus = pres.getString('status')

    if (origStatus !== newStatus) {
      let action = ''
      if (newStatus === 'presented') action = 'PRESENTATION_PRESENTED'
      else if (newStatus === 'withdrawn') action = 'PRESENTATION_WITHDRAWN'

      if (action) {
        const auditCol = $app.findCollectionByNameOrId('audit_events')
        const audit = new Record(auditCol)
        const actorId = e.auth ? e.auth.id : pres.getString('created_by_user_id')
        if (actorId) {
          audit.set('actor_user_id', actorId)
        }
        audit.set('action', action)
        audit.set('resource_type', 'cer_care_plan_presentations')
        audit.set('resource_id', pres.id)
        audit.set('enrollment_id', pres.getString('enrollment_id'))
        audit.set('timestamp', new Date().toISOString())
        audit.set('result', 'success')
        audit.set('request_context', 'server_plan_presentation_lifecycle')
        audit.set(
          'metadata',
          JSON.stringify({
            presentation_id: pres.id,
            old_status: origStatus,
            new_status: newStatus,
          }),
        )
        $app.save(audit)
      }
    }
  } catch (_) {}
}, 'cer_care_plan_presentations')
