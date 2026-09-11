// Hook server-side do Build 08D: Lifecycle e Validações de cer_planner_items
// Coleções monitoradas: cer_planner_items
// Regras e Decisões Congeladas:
// 1. Projeção somente de Assignment em status 'active'.
// 2. Safe Title P0 obrigatório: zero clinical rationale, diagnósticos, termos patológicos.
// 3. Persistência de timezone_snapshot:
//    - Se scheduled_at ou window_start preenchido, snapshot do timezone do participante (persons.timezone ou default IANA).
// 4. Daypart semântico:
//    - morning, afternoon, evening, any — NUNCA transformar em hora fictícia inventada (como 08:00).
// 5. item_type: contextual_resource = recurso disponível ("Se precisar, isto está disponível.") — NÃO task, NÃO fake recurrence, NÃO overdue.
// 6. Zero physical DELETE (deleteRule = null).
// 7. Audit: PLANNER_ITEM_CREATED, PLANNER_ITEM_RESCHEDULED, PLANNER_ITEM_CANCELLED, PLANNER_ITEM_COMPLETED.

onRecordCreate((e) => {
  const item = e.record
  const assignmentId = item.getString('assignment_id')
  const status = item.getString('status') || 'planned'

  if (!item.getString('created_by') && e.auth) {
    item.set('created_by', e.auth.id)
  }

  // Validar assignment
  let assignment = null
  try {
    assignment = $app.findFirstRecordByData('cer_practice_assignments', 'id', assignmentId)
  } catch (_) {
    throw new BadRequestError('assignment_id inválido ou inexistente.')
  }

  // 1. Assignment deve estar ativo para projetar novos itens no planner
  if (assignment.getString('status') !== 'active') {
    throw new BadRequestError(
      'Planner Gate: Não é possível projetar ou criar itens no planner para uma prática que não esteja no status "active". Status atual: ' +
        assignment.getString('status'),
    )
  }

  // Garantir consistência das âncoras derivadas se não preenchidas
  if (!item.getString('enrollment_id')) {
    item.set('enrollment_id', assignment.getString('enrollment_id'))
  }
  if (!item.getString('participant_user_id')) {
    item.set('participant_user_id', assignment.getString('participant_user_id'))
  }
  if (!item.getString('care_cycle_id')) {
    item.set('care_cycle_id', assignment.getString('care_cycle_id'))
  }

  // 2. Safe Title P0
  const safeTitle = (item.getString('safe_title') || '').toLowerCase()
  const unsafeTerms = [
    'diagnóstico',
    'diagnostico',
    'transtorno',
    'fobia',
    'cid-10',
    'cid-11',
    'dsm-5',
    'patologia',
    'patológico',
  ]
  for (let i = 0; i < unsafeTerms.length; i++) {
    if (safeTitle.indexOf(unsafeTerms[i]) !== -1) {
      throw new BadRequestError(
        'Safe Title Violation: Termo clínico diagnóstico restrito não permitido no planner do interagente: ' +
          unsafeTerms[i],
      )
    }
  }

  // 3. Capturar timezone_snapshot a partir de persons.timezone caso temporal
  if (!item.getString('timezone_snapshot')) {
    let tz = 'America/Sao_Paulo'
    try {
      const partUser = $app.findFirstRecordByData(
        'users',
        'id',
        item.getString('participant_user_id'),
      )
      const personId = partUser.getString('person_id')
      if (personId) {
        const person = $app.findFirstRecordByData('persons', 'id', personId)
        const pTz = person.getString('timezone')
        if (pTz) {
          tz = pTz
        }
      }
    } catch (_) {}
    item.set('timezone_snapshot', tz)
  }

  e.next()
}, 'cer_planner_items')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const item = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : item.getString('created_by')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    audit.set('action', 'PLANNER_ITEM_CREATED')
    audit.set('resource_type', 'cer_planner_items')
    audit.set('resource_id', item.id)
    audit.set('enrollment_id', item.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_planner_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        planner_item_id: item.id,
        assignment_id: item.getString('assignment_id'),
        item_type: item.getString('item_type'),
        scheduling_mode: item.getString('scheduling_mode'),
        daypart: item.getString('daypart') || undefined,
        timezone_snapshot: item.getString('timezone_snapshot'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_planner_items')

onRecordUpdate((e) => {
  const item = e.record
  const orig = item.original()
  if (!orig) {
    e.next()
    return
  }

  // Imutabilidade das âncoras essenciais
  if (item.getString('assignment_id') !== orig.getString('assignment_id')) {
    throw new BadRequestError('Não é permitido alterar assignment_id de um Planner Item existente.')
  }
  if (item.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('Não é permitido alterar enrollment_id de um Planner Item existente.')
  }

  // Safe Title P0
  const safeTitle = (item.getString('safe_title') || '').toLowerCase()
  const unsafeTerms = [
    'diagnóstico',
    'diagnostico',
    'transtorno',
    'fobia',
    'cid-10',
    'cid-11',
    'dsm-5',
    'patologia',
    'patológico',
  ]
  for (let i = 0; i < unsafeTerms.length; i++) {
    if (safeTitle.indexOf(unsafeTerms[i]) !== -1) {
      throw new BadRequestError(
        'Safe Title Violation: Termo clínico diagnóstico restrito não permitido no planner do interagente: ' +
          unsafeTerms[i],
      )
    }
  }

  e.next()
}, 'cer_planner_items')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const item = e.record
    const orig = item.original()
    if (!orig) return

    const origStatus = orig.getString('status')
    const newStatus = item.getString('status')

    let action = ''
    if (origStatus !== newStatus) {
      if (newStatus === 'completed') action = 'PLANNER_ITEM_COMPLETED'
      else if (newStatus === 'cancelled') action = 'PLANNER_ITEM_CANCELLED'
    } else {
      // Verificar se houve reagendamento temporal (scheduled_at ou daypart alterados)
      const origSched = orig.getString('scheduled_at')
      const newSched = item.getString('scheduled_at')
      const origDaypart = orig.getString('daypart')
      const newDaypart = item.getString('daypart')
      if (newSched !== origSched || newDaypart !== origDaypart) {
        action = 'PLANNER_ITEM_RESCHEDULED'
      }
    }

    if (action) {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const audit = new Record(auditCol)
      const actorId = e.auth ? e.auth.id : item.getString('created_by')
      if (actorId) {
        audit.set('actor_user_id', actorId)
      }
      audit.set('action', action)
      audit.set('resource_type', 'cer_planner_items')
      audit.set('resource_id', item.id)
      audit.set('enrollment_id', item.getString('enrollment_id'))
      audit.set('timestamp', new Date().toISOString())
      audit.set('result', 'success')
      audit.set('request_context', 'server_planner_lifecycle')
      audit.set(
        'metadata',
        JSON.stringify({
          planner_item_id: item.id,
          assignment_id: item.getString('assignment_id'),
          action: action,
          previous_status: origStatus,
          new_status: newStatus,
        }),
      )
      $app.save(audit)
    }
  } catch (_) {}
}, 'cer_planner_items')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Zero Delete Físico: Exclusão de Planner Item não permitida. Use o status cancelled.',
  )
}, 'cer_planner_items')
