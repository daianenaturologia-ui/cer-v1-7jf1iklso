// Hook server-side do Caderno Privado (cer_journal_entries)
// Garante vinculação do participant_user_id ao usuário autenticado,
// validação de enrollment da pessoa, access_class estritamente 'participant_private',
// versão inicial = 1 e arquivamento de versões anteriores em cer_journal_entry_versions no update.
// NENHUM dado de conteúdo confidencial é exposto em audit_events!

onRecordCreate((e) => {
  const record = e.record
  const authId = e.auth ? e.auth.id : null

  if (authId) {
    // Forçar titularidade intransponível: nunca permitir forjar participant_user_id via payload direto
    record.set('participant_user_id', authId)
  }

  const participantUserId = record.getString('participant_user_id')
  if (!participantUserId) {
    throw new BadRequestError('participant_user_id é obrigatório para registrar no Caderno.')
  }

  const enrollmentId = record.getString('enrollment_id')
  if (!enrollmentId) {
    throw new BadRequestError('enrollment_id é obrigatório.')
  }

  // Validar se o enrollment pertence estritamente ao participante
  let enrollment = null
  try {
    enrollment = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
  } catch (_) {
    throw new BadRequestError('Enrollment referenciado não foi encontrado.')
  }

  // Verificar se person_id do enrollment vincula ao participant_user_id (não forjar enrollment_id)
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

  // P0 Constitucional: access_class SEMPRE participant_private
  record.set('access_class', 'participant_private')

  if (!record.getString('status')) {
    record.set('status', 'active')
  }

  // Versão inicial
  record.set('version_number', 1)

  e.next()
}, 'cer_journal_entries')

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
    audit.set('action', 'JOURNAL_ENTRY_CREATED')
    audit.set('resource_type', 'cer_journal_entries')
    audit.set('resource_id', record.id)
    audit.set('enrollment_id', record.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'client_journal_create')
    // P0: Metadados puramente técnicos, NUNCA expor texto/conteúdo!
    audit.set(
      'metadata',
      JSON.stringify({
        entry_id: record.id,
        version_number: 1,
        access_class: 'participant_private',
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_journal_entries')

onRecordUpdate((e) => {
  const record = e.record
  const orig = record.original()
  const authId = e.auth ? e.auth.id : null

  // Revalidação estrita do participante: não pode trocar de autor
  if (authId && record.getString('participant_user_id') !== authId) {
    throw new BadRequestError('Não é permitido alterar a titularidade da anotação do Caderno.')
  }
  if (orig && record.getString('participant_user_id') !== orig.getString('participant_user_id')) {
    throw new BadRequestError('participant_user_id é imutável.')
  }
  if (orig && record.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('enrollment_id é imutável.')
  }

  // P0 Constitucional: access_class SEMPRE participant_private
  record.set('access_class', 'participant_private')

  // Se o conteúdo ou título foi alterado, arquivar a versão prévia em cer_journal_entry_versions
  const prevContent = orig ? orig.getString('content') : ''
  const newContent = record.getString('content')
  const prevTitle = orig ? orig.getString('title') : ''
  const newTitle = record.getString('title')

  const contentChanged = prevContent !== newContent || prevTitle !== newTitle

  if (contentChanged && orig) {
    const origVer = orig.getInt('version_number') || 1
    const versionsCol = $app.findCollectionByNameOrId('cer_journal_entry_versions')
    const versionRecord = new Record(versionsCol)

    versionRecord.set('entry_id', orig.id)
    versionRecord.set('enrollment_id', orig.getString('enrollment_id'))
    versionRecord.set('participant_user_id', orig.getString('participant_user_id'))
    versionRecord.set('title', orig.getString('title'))
    versionRecord.set('content', orig.getString('content'))
    versionRecord.set('version_number', origVer)
    versionRecord.set('change_reason', record.getString('change_reason') || 'edição de anotação')
    versionRecord.set('access_class', 'participant_private')

    try {
      $app.save(versionRecord)
    } catch (err) {
      throw new BadRequestError(
        'Falha ao preservar histórico da anotação do Caderno: ' + err.message,
      )
    }

    record.set('version_number', origVer + 1)
  }

  e.next()
}, 'cer_journal_entries')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const record = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : record.getString('participant_user_id')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }
    audit.set('action', 'JOURNAL_ENTRY_UPDATED')
    audit.set('resource_type', 'cer_journal_entries')
    audit.set('resource_id', record.id)
    audit.set('enrollment_id', record.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'client_journal_update')
    // P0: Metadados técnicos, SEM conteúdo textual!
    audit.set(
      'metadata',
      JSON.stringify({
        entry_id: record.id,
        version_number: record.getInt('version_number'),
        status: record.getString('status'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_journal_entries')

// Impedir deleção física
onRecordDelete((e) => {
  throw new BadRequestError(
    'Anotações do Caderno não podem ser excluídas fisicamente. Utilize arquivamento lógico.',
  )
}, 'cer_journal_entries')
