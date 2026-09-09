// Hook de Ciclo de Vida e Autoria de Sessão (cer_sessions) — Build 04A Session Core
// Regras Estritas:
// 1. DELETE Bloqueado (deleteRule = null + bloqueio por hook)
// 2. CREATE:
//    - Validar vínculo ativo do profissional autenticado com o enrollment_id
//    - Preencher / validar professional_user_id server-side impedindo spoofing do cliente
//    - Status inicial deve ser 'scheduled' (ou 'in_progress' se iniciado imediatamente)
//    - Se status inicial = in_progress, definir started_at server-side se vazio
// 3. UPDATE:
//    - Proibir alteração de enrollment_id (imutável)
//    - Proibir alteração de professional_user_id (imutável)
//    - Transições de Status permitidas:
//      * scheduled -> in_progress (define started_at server-side se vazio)
//      * in_progress -> completed (define completed_at server-side se vazio)
//      * scheduled -> cancelled (preserva registro, não apaga)
//    - Transições NEGADAS:
//      * completed -> qualquer estado (sessão não é reaberta na V1)
//      * cancelled -> qualquer estado
//      * in_progress -> scheduled
//      * qualquer outra transição arbitrária
//    - scheduled_at só pode ser alterado enquanto status = 'scheduled'. Uma vez in_progress, completed ou cancelled, bloquear alteração de scheduled_at.
// 4. Auditoria de eventos essenciais:
//    - SESSION_CREATED
//    - SESSION_STARTED (ao transitar para in_progress)
//    - SESSION_COMPLETED (ao transitar para completed)
//    - SESSION_CANCELLED (ao transitar para cancelled)

onRecordDelete((e) => {
  throw new BadRequestError('Sessões não podem ser deletadas. Cancele o registro se necessário.')
}, 'cer_sessions')

onRecordCreate((e) => {
  const session = e.record
  const enrollmentId = session.getString('enrollment_id')
  const status = session.getString('status') || 'scheduled'

  if (!enrollmentId) {
    throw new BadRequestError('enrollment_id é obrigatório.')
  }

  // Validar se status inicial é válido
  if (status !== 'scheduled' && status !== 'in_progress') {
    throw new BadRequestError('Status inicial da sessão deve ser "scheduled" ou "in_progress".')
  }

  // Preencher e validar professional_user_id server-side
  if (e.auth) {
    const authId = e.auth.id

    // Verificar se profissional tem vínculo ativo com o enrollment
    let hasActiveAccess = false
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
        hasActiveAccess = true
      }
    } catch (_) {}

    if (!hasActiveAccess) {
      throw new BadRequestError(
        'Profissional autenticado não possui vínculo ativo para este enrollment.',
      )
    }

    // Impedir spoofing do cliente: sobrescrever com auth.id
    session.set('professional_user_id', authId)
  } else {
    // Se não há auth (ex: script de seed interno), validar se professional_user_id foi passado
    if (!session.getString('professional_user_id')) {
      throw new BadRequestError('professional_user_id é obrigatório.')
    }
  }

  // Se iniciada direto como in_progress, marcar started_at
  if (status === 'in_progress' && !session.getString('started_at')) {
    session.set('started_at', new Date().toISOString())
  }

  e.next()
}, 'cer_sessions')

onRecordUpdate((e) => {
  const session = e.record
  const orig = session.original()

  if (orig) {
    const origEnrollment = orig.getString('enrollment_id')
    const newEnrollment = session.getString('enrollment_id')
    if (newEnrollment && origEnrollment && newEnrollment !== origEnrollment) {
      throw new BadRequestError('Não é permitido alterar o enrollment_id de uma sessão.')
    }

    const origProf = orig.getString('professional_user_id')
    const newProf = session.getString('professional_user_id')
    if (newProf && origProf && newProf !== origProf) {
      throw new BadRequestError('Não é permitido alterar o professional_user_id de uma sessão.')
    }

    const origStatus = orig.getString('status')
    const newStatus = session.getString('status')

    // Se o status mudou, validar a máquina de estados
    if (origStatus !== newStatus) {
      // Regras de proibição absoluta:
      if (origStatus === 'completed') {
        throw new BadRequestError('Sessão concluída (completed) não pode ter seu estado alterado.')
      }
      if (origStatus === 'cancelled') {
        throw new BadRequestError('Sessão cancelada (cancelled) não pode ter seu estado alterado.')
      }
      if (origStatus === 'in_progress' && newStatus === 'scheduled') {
        throw new BadRequestError('Transição in_progress -> scheduled não é permitida.')
      }

      // Transições válidas:
      // scheduled -> in_progress
      // in_progress -> completed
      // scheduled -> cancelled
      const isValidTransition =
        (origStatus === 'scheduled' && newStatus === 'in_progress') ||
        (origStatus === 'in_progress' && newStatus === 'completed') ||
        (origStatus === 'scheduled' && newStatus === 'cancelled')

      if (!isValidTransition) {
        throw new BadRequestError(
          'Transição de status inválida: "' + origStatus + '" para "' + newStatus + '".',
        )
      }

      // Efeitos colaterais server-side:
      if (newStatus === 'in_progress') {
        if (!session.getString('started_at')) {
          session.set('started_at', new Date().toISOString())
        }
      } else if (newStatus === 'completed') {
        if (!session.getString('completed_at')) {
          session.set('completed_at', new Date().toISOString())
        }
      }
    }

    // scheduled_at só pode ser alterado enquanto status era 'scheduled'
    const origScheduledAt = orig.getString('scheduled_at')
    const newScheduledAt = session.getString('scheduled_at')
    if (origScheduledAt !== newScheduledAt) {
      if (origStatus !== 'scheduled') {
        throw new BadRequestError(
          'scheduled_at só pode ser alterado enquanto a sessão estiver no estado "scheduled".',
        )
      }
    }
  }

  e.next()
}, 'cer_sessions')

// Auditoria pós-criação de sessão (SESSION_CREATED)
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const session = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)

    const actorId = e.auth && e.auth.id ? e.auth.id : session.getString('professional_user_id')

    audit.set('actor_user_id', actorId)
    audit.set('action', 'SESSION_CREATED')
    audit.set('resource_type', 'cer_sessions')
    audit.set('resource_id', session.id)
    audit.set('enrollment_id', session.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_session_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        session_id: session.id,
        status: session.getString('status'),
        professional_user_id: session.getString('professional_user_id'),
        scheduled_at: session.getString('scheduled_at'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_sessions')

// Auditoria pós-atualização de sessão (SESSION_STARTED, SESSION_COMPLETED, SESSION_CANCELLED)
onRecordAfterUpdateSuccess((e) => {
  e.next()

  try {
    const session = e.record
    const orig = session.original()
    if (!orig) return

    const origStatus = orig.getString('status')
    const newStatus = session.getString('status')

    if (origStatus !== newStatus) {
      let action = ''
      if (newStatus === 'in_progress') {
        action = 'SESSION_STARTED'
      } else if (newStatus === 'completed') {
        action = 'SESSION_COMPLETED'
      } else if (newStatus === 'cancelled') {
        action = 'SESSION_CANCELLED'
      }

      if (action) {
        const auditCol = $app.findCollectionByNameOrId('audit_events')
        const audit = new Record(auditCol)
        const actorId = e.auth && e.auth.id ? e.auth.id : session.getString('professional_user_id')

        audit.set('actor_user_id', actorId)
        audit.set('action', action)
        audit.set('resource_type', 'cer_sessions')
        audit.set('resource_id', session.id)
        audit.set('enrollment_id', session.getString('enrollment_id'))
        audit.set('timestamp', new Date().toISOString())
        audit.set('result', 'success')
        audit.set('request_context', 'server_session_lifecycle')
        audit.set(
          'metadata',
          JSON.stringify({
            session_id: session.id,
            previous_status: origStatus,
            new_status: newStatus,
            started_at: session.getString('started_at'),
            completed_at: session.getString('completed_at'),
          }),
        )
        $app.save(audit)
      }
    }
  } catch (_) {}
}, 'cer_sessions')
