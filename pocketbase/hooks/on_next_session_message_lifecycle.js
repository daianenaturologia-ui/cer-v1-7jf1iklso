// Hook server-side do Ciclo de Vida de Recados para a Próxima Sessão (cer_next_session_messages)
// Ciclo de vida: 'draft' -> 'approved' -> 'withdrawn'
//
// Regras e Invariantes:
// 1. O recado nasce como 'draft' com access_class = 'participant_private'
// 2. Quando o participante aprova ('approved'):
//    - access_class passa para 'shared_care'
//    - approved_at é carimbado
//    - summary_text deve estar preenchido ou aprovado
// 3. Quando o participante retira ('withdrawn'):
//    - withdrawn_at é carimbado
//    - Não pode mais voltar para approved
// 4. Somente a participante dona pode criar, aprovar ou retirar. Profissional nunca edita.
// 5. Auditoria técnica sem vazar dados confidenciais do recado.

onRecordCreate((e) => {
  const record = e.record
  const authId = e.auth ? e.auth.id : null

  if (authId) {
    // Forçar titularidade intransponível: nunca permitir forjar participant_user_id via payload direto
    record.set('participant_user_id', authId)
  }

  const participantUserId = record.getString('participant_user_id')
  if (!participantUserId) {
    throw new BadRequestError('participant_user_id é obrigatório.')
  }

  const enrollmentId = record.getString('enrollment_id')
  if (!enrollmentId) {
    throw new BadRequestError('enrollment_id é obrigatório.')
  }

  // Validar enrollment da pessoa
  let enrollment = null
  try {
    enrollment = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
  } catch (_) {
    throw new BadRequestError('Enrollment referenciado não foi encontrado.')
  }

  let userRec = null
  try {
    userRec = $app.findFirstRecordByData('users', 'id', participantUserId)
  } catch (_) {
    throw new BadRequestError('Usuário participante não encontrado.')
  }

  const personIdOnUser = userRec.getString('person_id')
  const personIdOnEnrollment = enrollment.getString('person_id')
  if (!personIdOnUser || !personIdOnEnrollment || personIdOnUser !== personIdOnEnrollment) {
    throw new BadRequestError('O enrollment referenciado não pertence a este interagente.')
  }

  const initialStatus = record.getString('status') || 'draft'
  if (initialStatus === 'approved') {
    // Se criado diretamente como aprovado (fluxo direto com resumo aprovado)
    record.set('status', 'approved')
    record.set('access_class', 'shared_care')
    if (!record.getString('approved_at')) {
      record.set('approved_at', new Date().toISOString())
    }
  } else {
    // Rascunho
    record.set('status', 'draft')
    record.set('access_class', 'participant_private')
  }

  e.next()
}, 'cer_next_session_messages')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const record = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : record.getString('participant_user_id')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }
    audit.set('action', 'NEXT_SESSION_MESSAGE_CREATED')
    audit.set('resource_type', 'cer_next_session_messages')
    audit.set('resource_id', record.id)
    audit.set('enrollment_id', record.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'client_next_session_message_create')
    // Metadados técnicos sem texto do recado
    audit.set(
      'metadata',
      JSON.stringify({
        message_id: record.id,
        status: record.getString('status'),
        access_class: record.getString('access_class'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_next_session_messages')

onRecordUpdate((e) => {
  const record = e.record
  const orig = record.original()
  const authId = e.auth ? e.auth.id : null

  // Revalidação de autor
  if (authId && record.getString('participant_user_id') !== authId) {
    throw new BadRequestError('Não é permitido alterar o autor do recado.')
  }
  if (orig && record.getString('participant_user_id') !== orig.getString('participant_user_id')) {
    throw new BadRequestError('participant_user_id é imutável.')
  }
  if (orig && record.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('enrollment_id é imutável.')
  }

  const prevStatus = orig ? orig.getString('status') : 'draft'
  const newStatus = record.getString('status')

  // Não permitir reativar recado retirado
  if (prevStatus === 'withdrawn' && newStatus !== 'withdrawn') {
    throw new BadRequestError('Um recado retirado não pode ser reativado.')
  }

  // Transição para approved
  if (prevStatus === 'draft' && newStatus === 'approved') {
    record.set('access_class', 'shared_care')
    if (!record.getString('approved_at')) {
      record.set('approved_at', new Date().toISOString())
    }
  }

  // Transição para withdrawn (retirada do recado)
  if (newStatus === 'withdrawn') {
    if (!record.getString('withdrawn_at')) {
      record.set('withdrawn_at', new Date().toISOString())
    }
    // Uma vez retirado, access_class volta para participant_private para que a RLS fail-closed bloqueie novas leituras
    record.set('access_class', 'participant_private')
  }

  e.next()
}, 'cer_next_session_messages')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const record = e.record
    const orig = record.original()
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : record.getString('participant_user_id')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    const newStatus = record.getString('status')
    let actionName = 'NEXT_SESSION_MESSAGE_UPDATED'
    if (newStatus === 'approved') {
      actionName = 'NEXT_SESSION_MESSAGE_APPROVED'
    } else if (newStatus === 'withdrawn') {
      actionName = 'NEXT_SESSION_MESSAGE_WITHDRAWN'
    }

    audit.set('action', actionName)
    audit.set('resource_type', 'cer_next_session_messages')
    audit.set('resource_id', record.id)
    audit.set('enrollment_id', record.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'client_next_session_message_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        message_id: record.id,
        status: newStatus,
        access_class: record.getString('access_class'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_next_session_messages')

// Impedir deleção física direta
onRecordDelete((e) => {
  throw new BadRequestError(
    'Recados para a próxima sessão não podem ser excluídos fisicamente. Utilize a retirada (withdrawn).',
  )
}, 'cer_next_session_messages')
