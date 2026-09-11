// Hook server-side do Build 08B: Lifecycle e Regras de cer_care_cycles
// Collections: cer_care_cycles
//
// Regras e Decisões Congeladas:
// 1. Lifecycle: planned | active | paused | closed.
// 2. NÃO existe estado `extended` — extend/shorten são EVENTOS (audit) que atualizam a janela.
// 3. Suportar: start, extend, shorten, pause, resume, close.
// 4. ZERO default arquitetural de 14 dias.
// 5. Ciclo exige plano active para transitar para 'active'.
// 6. Multiplos ciclos sequenciais permitidos por plano, no máximo 1 active simultâneo por enrollment.
// 7. Audit: CYCLE_STARTED, CYCLE_EXTENDED, CYCLE_PAUSED, CYCLE_RESUMED, CYCLE_CLOSED.

onRecordCreate((e) => {
  const cycle = e.record
  const planId = cycle.getString('plan_id')
  const status = cycle.getString('status') || 'planned'

  if (!cycle.getString('created_by_user_id') && e.auth) {
    cycle.set('created_by_user_id', e.auth.id)
  }

  // Validar plano
  let plan = null
  try {
    plan = $app.findFirstRecordByData('cer_care_plans', 'id', planId)
  } catch (_) {
    throw new BadRequestError('plan_id inválido ou inexistente.')
  }

  const enrId = plan.getString('enrollment_id')
  if (!cycle.getString('enrollment_id')) {
    cycle.set('enrollment_id', enrId)
  } else if (cycle.getString('enrollment_id') !== enrId) {
    throw new BadRequestError('Inconsistência de enrollment_id com o Plano de Cuidado.')
  }

  // Se for criado como 'active', plano DEVE estar 'active'
  if (status === 'active') {
    if (plan.getString('status') !== 'active') {
      throw new BadRequestError(
        'Não é possível iniciar um ciclo ativo se o plano não estiver no status "active".',
      )
    }
    if (!cycle.getString('start_date')) {
      cycle.set('start_date', new Date().toISOString())
    }
  }

  e.next()
}, 'cer_care_cycles')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const cycle = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = cycle.getString('created_by_user_id') || (e.auth ? e.auth.id : '')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }

    const action = cycle.getString('status') === 'active' ? 'CYCLE_STARTED' : 'CYCLE_CREATED'
    audit.set('action', action)
    audit.set('resource_type', 'cer_care_cycles')
    audit.set('resource_id', cycle.id)
    audit.set('enrollment_id', cycle.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_care_cycle_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        cycle_id: cycle.id,
        plan_id: cycle.getString('plan_id'),
        cycle_number: cycle.getInt('cycle_number'),
        status: cycle.getString('status'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_care_cycles')

onRecordUpdate((e) => {
  const cycle = e.record
  const orig = cycle.original()
  if (!orig) {
    e.next()
    return
  }

  const origStatus = orig.getString('status')
  const newStatus = cycle.getString('status')
  const planId = orig.getString('plan_id')

  if (origStatus === 'closed') {
    throw new BadRequestError('Um ciclo de cuidado fechado (closed) é imutável.')
  }

  // Transição para active exige plano active
  if (origStatus !== 'active' && newStatus === 'active') {
    try {
      const plan = $app.findFirstRecordByData('cer_care_plans', 'id', planId)
      if (plan.getString('status') !== 'active') {
        throw new BadRequestError(
          'Ativação de ciclo exige que o plano de cuidado esteja no status "active".',
        )
      }
    } catch (_) {
      throw new BadRequestError('Plano de cuidado do ciclo não encontrado.')
    }

    if (!cycle.getString('start_date')) {
      cycle.set('start_date', new Date().toISOString())
    }
  }

  if (newStatus === 'closed' && !cycle.getString('closed_at')) {
    cycle.set('closed_at', new Date().toISOString())
  }

  e.next()
}, 'cer_care_cycles')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const cycle = e.record
    const orig = cycle.original()
    const origStatus = orig ? orig.getString('status') : ''
    const newStatus = cycle.getString('status')

    let action = ''
    if (origStatus !== newStatus) {
      if (newStatus === 'active' && origStatus === 'paused') action = 'CYCLE_RESUMED'
      else if (newStatus === 'active') action = 'CYCLE_STARTED'
      else if (newStatus === 'paused') action = 'CYCLE_PAUSED'
      else if (newStatus === 'closed') action = 'CYCLE_CLOSED'
    } else {
      // Se status permaneceu igual, verificar se estendeu janela
      const origExt = orig ? orig.getString('extended_until') : ''
      const newExt = cycle.getString('extended_until')
      if (newExt && newExt !== origExt) {
        action = 'CYCLE_EXTENDED'
      }
    }

    if (action) {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const audit = new Record(auditCol)
      const actorId = e.auth ? e.auth.id : cycle.getString('created_by_user_id')
      if (actorId) {
        audit.set('actor_user_id', actorId)
      }
      audit.set('action', action)
      audit.set('resource_type', 'cer_care_cycles')
      audit.set('resource_id', cycle.id)
      audit.set('enrollment_id', cycle.getString('enrollment_id'))
      audit.set('timestamp', new Date().toISOString())
      audit.set('result', 'success')
      audit.set('request_context', 'server_care_cycle_lifecycle')
      audit.set(
        'metadata',
        JSON.stringify({
          cycle_id: cycle.id,
          plan_id: cycle.getString('plan_id'),
          action: action,
          status: newStatus,
        }),
      )
      $app.save(audit)
    }

    // Build 08D: Regras de ciclo sobre assignments e planner
    // 1. Cycle CLOSE: assignment ativa -> stopped com stop_reason_code = 'cycle_closed'.
    // NUNCA paused, NUNCA completed automático.
    // Cancelar itens futuros/projetados do planner.
    if (newStatus === 'closed' && origStatus !== 'closed') {
      try {
        const activeAssignments = $app.findRecordsByFilter(
          'cer_practice_assignments',
          'care_cycle_id = "' + cycle.id + '" && status = "active"',
          '',
          100,
          0,
        )
        for (let i = 0; i < activeAssignments.length; i++) {
          const asgn = activeAssignments[i]
          asgn.set('status', 'stopped')
          asgn.set('stop_reason_code', 'cycle_closed')
          $app.save(asgn)

          try {
            const items = $app.findRecordsByFilter(
              'cer_planner_items',
              'assignment_id = "' + asgn.id + '" && (status = "planned" || status = "active")',
              '',
              100,
              0,
            )
            for (let j = 0; j < items.length; j++) {
              const item = items[j]
              item.set('status', 'cancelled')
              $app.save(item)
            }
          } catch (_) {}
        }
      } catch (_) {}
    }
  } catch (_) {}
}, 'cer_care_cycles')
