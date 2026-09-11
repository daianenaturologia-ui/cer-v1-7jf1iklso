// Hook server-side do Build 08E: Lifecycle e Regras de cer_cycle_reviews
// Coleções monitoradas: cer_cycle_reviews
//
// Regras e Decisões Congeladas:
// 1. STATUS: draft | completed.
// 2. ELEGIBILIDADE DO CICLO:
//    - Pode ser criado quando ciclo está active OU paused.
//    - Ciclo closed também pode ter review histórico (historical derivado).
//    - NÃO exigir close antes do review — o calendário não dirige a decisão clínica.
// 3. DECISÃO CLÍNICA EXPLÍCITA:
//    - continue | extend | adapt | close | carry_forward | change_priority | review_plan
//    - O review NÃO altera o lifecycle automaticamente; o lifecycle é executado DEPOIS pela ação posterior.
//    - O review NÃO auto-revisa o plano (preserva gates 08B/08D).
// 4. AUDIT:
//    - CYCLE_REVIEW_CREATED
//    - Payload de decisão com IDs/tipo, sem texto sensível.
// 5. ZERO DELETE FÍSICO:
//    - deleteRule = null e throw BadRequestError em onRecordDelete.

onRecordCreate((e) => {
  const cr = e.record
  const cycleId = cr.getString('care_cycle_id')

  if (!cr.getString('created_by_user_id') && e.auth) {
    cr.set('created_by_user_id', e.auth.id)
  }

  // Validar elegibilidade do ciclo (active, paused ou closed para histórico)
  try {
    const cycle = $app.findFirstRecordByData('cer_care_cycles', 'id', cycleId)
    const cycleStatus = cycle.getString('status')
    if (cycleStatus === 'planned') {
      throw new BadRequestError(
        'Cycle Review não permitido para ciclo ainda em planejamento (status "planned").',
      )
    }

    // Se enrollment_id estiver ausente, herdar do ciclo
    if (!cr.getString('enrollment_id')) {
      cr.set('enrollment_id', cycle.getString('enrollment_id'))
    }
  } catch (err) {
    if (err.message && err.message.indexOf('Cycle Review não permitido') !== -1) throw err
    throw new BadRequestError('care_cycle_id inválido ou inexistente.')
  }

  e.next()
}, 'cer_cycle_reviews')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const cr = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : cr.getString('created_by_user_id')
    if (actorId) audit.set('actor_user_id', actorId)

    audit.set('action', 'CYCLE_REVIEW_CREATED')
    audit.set('resource_type', 'cer_cycle_reviews')
    audit.set('resource_id', cr.id)
    audit.set('enrollment_id', cr.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_cycle_review_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        review_id: cr.id,
        care_cycle_id: cr.getString('care_cycle_id'),
        status: cr.getString('status'),
        decision: cr.getString('decision') || undefined,
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_cycle_reviews')

onRecordUpdate((e) => {
  const cr = e.record
  const orig = cr.original()
  if (!orig) {
    e.next()
    return
  }

  // Imutabilidade das âncoras essenciais
  if (cr.getString('care_cycle_id') !== orig.getString('care_cycle_id')) {
    throw new BadRequestError('Não é permitido alterar care_cycle_id de um Cycle Review.')
  }
  if (cr.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('Não é permitido alterar enrollment_id de um Cycle Review.')
  }

  e.next()
}, 'cer_cycle_reviews')

onRecordDelete((e) => {
  throw new BadRequestError('Zero Delete Físico: Exclusão de Cycle Review não permitida.')
}, 'cer_cycle_reviews')
