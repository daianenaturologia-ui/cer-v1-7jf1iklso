// Hook server-side do Build 08B: Lifecycle e Versioning de cer_care_plans
// Collections: cer_care_plans
//
// Regras e Decisões Congeladas:
// 1. Versionamento por RECORD:
//    - Plan revision N -> cria novo record -> revision_number + 1 -> previous_plan_id = record anterior.
//    - Novo torna-se current/active -> anterior passa para superseded.
//    - NUNCA sobrescrever silenciosamente direção, contexto ou notas materiais.
// 2. Lifecycle: draft | active | paused | superseded | completed | archived.
//    - `revised` NÃO é status (PLAN_REVISED é evento de audit).
// 3. Single-current: no máximo 1 plano 'active' por enrollment.
// 4. Somente profissional humano com vínculo ativo pode criar / alterar plano.
// 5. Auditoria de eventos de plano: PLAN_CREATED, PLAN_ACTIVATED, PLAN_REVISED, PLAN_PAUSED, PLAN_SUPERSEDED.

onRecordCreate((e) => {
  const plan = e.record
  const enrollmentId = plan.getString('enrollment_id')
  const status = plan.getString('status') || 'draft'
  const revNum = plan.getInt('revision_number')

  if (!plan.getString('created_by_user_id') && e.auth) {
    plan.set('created_by_user_id', e.auth.id)
  }

  // 1. Validar enrollment
  let enrollment = null
  try {
    enrollment = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
  } catch (_) {
    throw new BadRequestError('enrollment_id inválido ou inexistente.')
  }

  // 2. Validar profissional humano autorizado se e.auth estiver presente
  if (e.auth) {
    const authId = e.auth.id

    // Participante não cria plano
    const personId = enrollment.getString('person_id')
    if (personId) {
      try {
        const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
        if (pUser.id === authId) {
          throw new BadRequestError('Participante não tem permissão para criar Plano de Cuidado.')
        }
      } catch (_) {}
    }

    // Vínculo profissional ativo
    let isProfLinked = false
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
        isProfLinked = true
      }
    } catch (_) {}

    if (!isProfLinked) {
      throw new BadRequestError('Profissional sem vínculo ativo para o enrollment.')
    }

    // Role profissional ativo
    let hasProfRole = false
    try {
      const roles = $app.findRecordsByFilter(
        'user_roles',
        'user_id = "' + authId + '" && is_active = true',
        '',
        10,
        0,
      )
      hasProfRole = roles.some((r) => r.getString('role') === 'profissional')
    } catch (_) {}

    if (!hasProfRole) {
      throw new BadRequestError(
        'Somente profissionais humanos autorizados podem criar Plano de Cuidado.',
      )
    }
  }

  // 3. Validar revision_number monotônico crescente
  let maxRev = 0
  try {
    const existing = $app.findRecordsByFilter(
      'cer_care_plans',
      'enrollment_id = "' + enrollmentId + '"',
      '-revision_number',
      1,
      0,
    )
    if (existing && existing.length > 0) {
      maxRev = existing[0].getInt('revision_number') || 0
    }
  } catch (_) {}

  const expectedRev = maxRev + 1
  if (!revNum) {
    plan.set('revision_number', expectedRev)
  } else if (revNum !== expectedRev) {
    throw new BadRequestError(
      'revision_number inválido: próximo número de revisão é ' +
        expectedRev +
        ' (informado: ' +
        revNum +
        ').',
    )
  }

  // 4. Se criado como active diretamente, garantir single-current
  if (status === 'active') {
    try {
      const activePlans = $app.findRecordsByFilter(
        'cer_care_plans',
        'enrollment_id = "' + enrollmentId + '" && status = "active"',
        '',
        10,
        0,
      )
      for (let i = 0; i < activePlans.length; i++) {
        const ap = activePlans[i]
        ap.set('status', 'superseded')
        $app.save(ap)
      }
    } catch (_) {}
  }

  e.next()
}, 'cer_care_plans')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const plan = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = plan.getString('created_by_user_id') || (e.auth ? e.auth.id : '')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }

    const action = plan.getString('status') === 'active' ? 'PLAN_ACTIVATED' : 'PLAN_CREATED'
    audit.set('action', action)
    audit.set('resource_type', 'cer_care_plans')
    audit.set('resource_id', plan.id)
    audit.set('enrollment_id', plan.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_care_plan_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        plan_id: plan.id,
        revision_number: plan.getInt('revision_number'),
        status: plan.getString('status'),
        previous_plan_id: plan.getString('previous_plan_id') || null,
        direction_mode: plan.getString('direction_mode'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_care_plans')

onRecordUpdate((e) => {
  const plan = e.record
  const orig = plan.original()
  if (!orig) {
    e.next()
    return
  }

  const origStatus = orig.getString('status')
  const newStatus = plan.getString('status')
  const enrollmentId = orig.getString('enrollment_id')

  // enrollment_id e revision_number são imutáveis
  if (plan.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('enrollment_id é imutável no Plano de Cuidado.')
  }
  if (plan.getInt('revision_number') !== orig.getInt('revision_number')) {
    throw new BadRequestError('revision_number é imutável no Plano de Cuidado.')
  }

  // Estados terminais / históricos imutáveis
  if (origStatus === 'superseded') {
    throw new BadRequestError(
      'Um plano substituído (superseded) é histórico e não pode ser alterado.',
    )
  }
  if (origStatus === 'archived') {
    throw new BadRequestError('Um plano arquivado não pode ser alterado.')
  }
  if (origStatus === 'completed') {
    throw new BadRequestError('Um plano concluído não pode ser alterado.')
  }

  // Ativação do plano: garantir corrente única válida por enrollment
  if (origStatus !== 'active' && newStatus === 'active') {
    try {
      const activePlans = $app.findRecordsByFilter(
        'cer_care_plans',
        'enrollment_id = "' + enrollmentId + '" && status = "active" && id != "' + plan.id + '"',
        '',
        10,
        0,
      )
      for (let i = 0; i < activePlans.length; i++) {
        const ap = activePlans[i]
        ap.set('status', 'superseded')
        $app.save(ap)
      }
    } catch (_) {}
  }

  e.next()
}, 'cer_care_plans')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const plan = e.record
    const orig = plan.original()
    const origStatus = orig ? orig.getString('status') : ''
    const newStatus = plan.getString('status')

    if (origStatus !== newStatus) {
      let action = ''
      if (newStatus === 'active') action = 'PLAN_ACTIVATED'
      else if (newStatus === 'paused') action = 'PLAN_PAUSED'
      else if (newStatus === 'superseded') action = 'PLAN_SUPERSEDED'

      if (action) {
        const auditCol = $app.findCollectionByNameOrId('audit_events')
        const audit = new Record(auditCol)
        const actorId = e.auth ? e.auth.id : plan.getString('created_by_user_id')
        if (actorId) {
          audit.set('actor_user_id', actorId)
        }
        audit.set('action', action)
        audit.set('resource_type', 'cer_care_plans')
        audit.set('resource_id', plan.id)
        audit.set('enrollment_id', plan.getString('enrollment_id'))
        audit.set('timestamp', new Date().toISOString())
        audit.set('result', 'success')
        audit.set('request_context', 'server_care_plan_lifecycle')
        audit.set(
          'metadata',
          JSON.stringify({
            plan_id: plan.id,
            revision_number: plan.getInt('revision_number'),
            old_status: origStatus,
            new_status: newStatus,
          }),
        )
        $app.save(audit)
      }
    }
  } catch (_) {}
}, 'cer_care_plans')
