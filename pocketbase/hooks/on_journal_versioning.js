// Hook server-side de integridade e imutabilidade de cer_journal_entry_versions
// Garante que versões prévias nunca sejam alteradas ou deletadas após a inserção.

onRecordCreate((e) => {
  const record = e.record
  const authId = e.auth ? e.auth.id : null

  if (authId) {
    record.set('participant_user_id', authId)
  }

  const participantUserId = record.getString('participant_user_id')
  const enrollmentId = record.getString('enrollment_id')

  if (participantUserId && enrollmentId) {
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
  }

  // access_class SEMPRE participant_private
  record.set('access_class', 'participant_private')
  e.next()
}, 'cer_journal_entry_versions')

onRecordUpdate((e) => {
  throw new BadRequestError(
    'Versões históricas do Caderno são imutáveis e não podem ser alteradas.',
  )
}, 'cer_journal_entry_versions')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Versões históricas do Caderno são imutáveis e não podem ser excluídas.',
  )
}, 'cer_journal_entry_versions')
