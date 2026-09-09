// Hook de Ciclo de Vida e Proteção Server-Side de Session Observations (cer_session_observations) — Build 04B
// Regras Estritas:
// 1. DELETE Bloqueado irrevogavelmente (deleteRule = null + hook)
// 2. UPDATE Bloqueado irrevogavelmente (updateRule = null + hook) — Observation é create-only e imutável
// 3. CREATE:
//    - session_id deve existir
//    - Session.status deve ser 'in_progress' OU 'completed' (rejeitar se 'scheduled' ou 'cancelled')
//    - Preencher / validar enrollment_id server-side a partir da Session (não confiar no cliente / corrigir spoof)
//    - Preencher / validar recorded_by_user_id server-side a partir do usuário autenticado (corrigir spoof)
//    - Validar que o usuário autenticado possui vínculo ativo com o enrollment_id (ou rejeitar se participante / sem vínculo)
//    - observation_type obrigatório: 'participant_report' | 'professional_observation'
//    - text obrigatório e não vazio
//    - access_class FORÇADO server-side como 'professional_private' SEMPRE (cliente não pode elevar ou alterar)
// 4. Auditoria de eventos:
//    - SESSION_OBSERVATION_CREATED (sem vazar texto sensível na metadata!)

onRecordDelete((e) => {
  throw new BadRequestError('Observações de sessão são imutáveis e não podem ser deletadas.')
}, 'cer_session_observations')

onRecordUpdate((e) => {
  throw new BadRequestError('Observações de sessão são imutáveis e não podem ser alteradas.')
}, 'cer_session_observations')

onRecordCreate((e) => {
  const obs = e.record
  const sessionId = obs.getString('session_id')
  const obsType = obs.getString('observation_type')
  const text = obs.getString('text')

  if (!sessionId) {
    throw new BadRequestError('session_id é obrigatório.')
  }

  // Validar observation_type
  if (obsType !== 'participant_report' && obsType !== 'professional_observation') {
    throw new BadRequestError(
      'observation_type inválido. Valores permitidos: "participant_report" ou "professional_observation".',
    )
  }

  // Validar texto obrigatório
  if (!text || text.trim().length === 0) {
    throw new BadRequestError('O campo text é obrigatório para observação de sessão.')
  }

  // Buscar Session
  let session = null
  try {
    session = $app.findFirstRecordByData('cer_sessions', 'id', sessionId)
  } catch (_) {
    throw new BadRequestError('Sessão referenciada não encontrada.')
  }

  const sessionStatus = session.getString('status')
  // CREATE permitido SOMENTE quando Session.status = in_progress OU completed.
  // Negado quando scheduled ou cancelled.
  if (sessionStatus !== 'in_progress' && sessionStatus !== 'completed') {
    throw new BadRequestError(
      'Observação só pode ser registrada para sessões "in_progress" ou "completed". Estado atual da sessão: "' +
        sessionStatus +
        '".',
    )
  }

  // Preencher e validar enrollment_id server-side a partir da sessão (corrigir spoofing)
  const sessionEnrollmentId = session.getString('enrollment_id')
  obs.set('enrollment_id', sessionEnrollmentId)

  // Preencher e validar recorded_by_user_id server-side e verificar vínculo ativo
  let authorId = ''
  if (e.auth) {
    authorId = e.auth.id
    obs.set('recorded_by_user_id', authorId)

    // Verificar se o usuário autenticado é participante deste enrollment (participante NÃO pode criar Observation no 04B)
    let isParticipant = false
    try {
      const enr = $app.findFirstRecordByData('enrollments', 'id', sessionEnrollmentId)
      const personId = enr.getString('person_id')
      if (personId) {
        const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
        if (pUser.id === authorId) {
          isParticipant = true
        }
      }
    } catch (_) {}

    if (isParticipant) {
      throw new BadRequestError(
        'Participante não possui permissão para registrar Session Observation.',
      )
    }

    // Validar se o profissional tem vínculo ativo com o enrollment
    let hasAccess = false
    try {
      const links = $app.findRecordsByFilter(
        'professional_enrollment_access',
        'enrollment_id = "' +
          sessionEnrollmentId +
          '" && professional_user_id = "' +
          authorId +
          '" && is_active = true',
        '',
        1,
        0,
      )
      if (links && links.length > 0) {
        hasAccess = true
      }
    } catch (_) {}

    if (!hasAccess) {
      throw new BadRequestError(
        'Profissional não possui vínculo ativo com o enrollment desta sessão.',
      )
    }
  } else {
    // Caso de script ou seed interno sem auth
    authorId = obs.getString('recorded_by_user_id')
    if (!authorId) {
      authorId = session.getString('professional_user_id')
      obs.set('recorded_by_user_id', authorId)
    }
  }

  // REGRA CONGELADA: access_class SEMPRE 'professional_private', IMUTÁVEL, cliente não pode escolher
  obs.set('access_class', 'professional_private')

  e.next()
}, 'cer_session_observations')

// Auditoria pós-criação de Observation (SESSION_OBSERVATION_CREATED)
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const obs = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)

    const actorId = e.auth && e.auth.id ? e.auth.id : obs.getString('recorded_by_user_id')

    if (actorId) {
      audit.set('actor_user_id', actorId)
    }
    audit.set('action', 'SESSION_OBSERVATION_CREATED')
    audit.set('resource_type', 'cer_session_observations')
    audit.set('resource_id', obs.id)
    audit.set('enrollment_id', obs.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_session_observation_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        observation_id: obs.id,
        session_id: obs.getString('session_id'),
        observation_type: obs.getString('observation_type'),
        access_class: obs.getString('access_class'),
        recorded_by_user_id: obs.getString('recorded_by_user_id'),
        // NUNCA incluir texto da observação no audit metadata (menor privilégio / sigilo)
        has_text: !!obs.getString('text'),
        text_length: (obs.getString('text') || '').length,
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_session_observations')
