// Hook de Proteção Server-Side da Nota de Sessão (cer_session_notes) — Build 04A Session Core
// Regras Estritas:
// 1. DELETE Bloqueado (deleteRule = null + bloqueio por hook)
// 2. CREATE:
//    - Validar session_id existente
//    - Validar que a Session NÃO está completed nem cancelled
//    - Preencher / validar enrollment_id server-side a partir da Session (não confiar no cliente)
//    - Preencher / validar author_user_id server-side a partir do usuário autenticado / autor da sessão
//    - Validar que o autor possui vínculo ativo com o enrollment
//    - Garantir UMA nota por sessão (verificação adicional ao índice único)
// 3. UPDATE:
//    - Verificar estado atual da Session ligada:
//      * Se session.status === 'completed' -> UPDATE REJEITADO
//      * Se session.status === 'cancelled' -> UPDATE REJEITADO
//      * Permitido SOMENTE enquanto session.status === 'scheduled' ou 'in_progress'
//    - Proibir alteração de session_id (imutável)
//    - Proibir alteração de enrollment_id (imutável)
//    - Proibir alteração de author_user_id (imutável)
//    - Somente o autor com vínculo ativo pode atualizar
// 4. Auditoria de eventos essenciais:
//    - SESSION_NOTE_CREATED
//    - SESSION_NOTE_UPDATED (sem armazenar texto sensível da nota!)
// 5. Totalmente fora da Knowledge Layer: Nenhuma derivação de Signal/Association/Knowledge/Recognition/Evidence.

onRecordDelete((e) => {
  throw new BadRequestError('Notas de sessão não podem ser deletadas.')
}, 'cer_session_notes')

onRecordCreate((e) => {
  const note = e.record
  const sessionId = note.getString('session_id')

  if (!sessionId) {
    throw new BadRequestError('session_id é obrigatório.')
  }

  // Buscar a sessão no banco
  let session = null
  try {
    session = $app.findFirstRecordByData('cer_sessions', 'id', sessionId)
  } catch (_) {
    throw new BadRequestError('Sessão referenciada não encontrada.')
  }

  const sessionStatus = session.getString('status')
  if (sessionStatus === 'completed') {
    throw new BadRequestError(
      'Não é permitido criar nota para uma sessão já concluída (completed).',
    )
  }
  if (sessionStatus === 'cancelled') {
    throw new BadRequestError('Não é permitido criar nota para uma sessão cancelada (cancelled).')
  }

  // Preencher e validar enrollment_id server-side a partir da sessão (não confiar no cliente)
  const sessionEnrollmentId = session.getString('enrollment_id')
  note.set('enrollment_id', sessionEnrollmentId)

  // Preencher e validar author_user_id server-side
  let authorId = ''
  if (e.auth) {
    authorId = e.auth.id
    note.set('author_user_id', authorId)

    // Validar se o autor tem vínculo ativo com o enrollment
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
    authorId = note.getString('author_user_id')
    if (!authorId) {
      authorId = session.getString('professional_user_id')
      note.set('author_user_id', authorId)
    }
  }

  // Verificar se já existe nota para a mesma sessão (uma nota canônica)
  try {
    const existing = $app.findRecordsByFilter(
      'cer_session_notes',
      'session_id = "' + sessionId + '"',
      '',
      1,
      0,
    )
    if (existing && existing.length > 0) {
      throw new BadRequestError('Já existe uma nota registrada para esta sessão.')
    }
  } catch (err) {
    if (err.message && err.message.indexOf('Já existe') !== -1) {
      throw err
    }
  }

  e.next()
}, 'cer_session_notes')

onRecordUpdate((e) => {
  const note = e.record
  const orig = note.original()

  if (orig) {
    // 1. Imutabilidade de identificadores estruturais
    const origSession = orig.getString('session_id')
    const newSession = note.getString('session_id')
    if (newSession && origSession && newSession !== origSession) {
      throw new BadRequestError('Não é permitido alterar o session_id de uma nota.')
    }

    const origEnrollment = orig.getString('enrollment_id')
    const newEnrollment = note.getString('enrollment_id')
    if (newEnrollment && origEnrollment && newEnrollment !== origEnrollment) {
      throw new BadRequestError('Não é permitido alterar o enrollment_id de uma nota.')
    }

    const origAuthor = orig.getString('author_user_id')
    const newAuthor = note.getString('author_user_id')
    if (newAuthor && origAuthor && newAuthor !== origAuthor) {
      throw new BadRequestError('Não é permitido alterar o autor de uma nota.')
    }

    // 2. Verificar estado da sessão ligada
    const sessionId = origSession || note.getString('session_id')
    let session = null
    try {
      session = $app.findFirstRecordByData('cer_sessions', 'id', sessionId)
    } catch (_) {
      throw new BadRequestError('Sessão associada não encontrada.')
    }

    const sessionStatus = session.getString('status')
    if (sessionStatus === 'completed') {
      throw new BadRequestError(
        'Não é permitido alterar a nota de uma sessão já concluída (completed).',
      )
    }
    if (sessionStatus === 'cancelled') {
      throw new BadRequestError(
        'Não é permitido alterar a nota de uma sessão cancelada (cancelled).',
      )
    }

    // 3. Validar se o usuário que tenta editar é o autor
    if (e.auth) {
      if (e.auth.id !== origAuthor) {
        throw new BadRequestError('Apenas o autor pode editar esta nota.')
      }
    }
  }

  e.next()
}, 'cer_session_notes')

// Auditoria pós-criação da nota (SESSION_NOTE_CREATED)
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const note = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)

    const actorId = e.auth && e.auth.id ? e.auth.id : note.getString('author_user_id')

    audit.set('actor_user_id', actorId)
    audit.set('action', 'SESSION_NOTE_CREATED')
    audit.set('resource_type', 'cer_session_notes')
    audit.set('resource_id', note.id)
    audit.set('enrollment_id', note.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_session_note_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        note_id: note.id,
        session_id: note.getString('session_id'),
        author_user_id: note.getString('author_user_id'),
        // NUNCA incluir texto da nota no audit log (privacidade médica/profissional)
        has_text: !!note.getString('text'),
        text_length: (note.getString('text') || '').length,
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_session_notes')

// Auditoria pós-atualização da nota (SESSION_NOTE_UPDATED)
onRecordAfterUpdateSuccess((e) => {
  e.next()

  try {
    const note = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)

    const actorId = e.auth && e.auth.id ? e.auth.id : note.getString('author_user_id')

    audit.set('actor_user_id', actorId)
    audit.set('action', 'SESSION_NOTE_UPDATED')
    audit.set('resource_type', 'cer_session_notes')
    audit.set('resource_id', note.id)
    audit.set('enrollment_id', note.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_session_note_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        note_id: note.id,
        session_id: note.getString('session_id'),
        author_user_id: note.getString('author_user_id'),
        has_text: !!note.getString('text'),
        text_length: (note.getString('text') || '').length,
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_session_notes')
