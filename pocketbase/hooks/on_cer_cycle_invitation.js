// This shared record never includes clinical summaries, decisions or private notes.
onRecordCreateRequest((e) => {
  if (!e.auth) throw new ForbiddenError('Autenticação necessária.')
  const record = e.record
  const cycle = $app.findRecordById('cer_care_cycles', record.getString('care_cycle_id'))
  if (
    cycle.getString('enrollment_id') !== record.getString('enrollment_id') ||
    cycle.getString('status') === 'planned'
  )
    throw new BadRequestError('O convite requer um ciclo iniciado desta matrícula.')
  const enrollment = $app.findRecordById('enrollments', record.getString('enrollment_id'))
  const users = $app.findRecordsByFilter('_pb_users_auth_', 'person_id = {:person}', '', 2, 0, {
    person: enrollment.getString('person_id'),
  })
  if (users.length !== 1)
    throw new BadRequestError('A matrícula precisa de uma única conta de interagente identificada.')
  record.set('participant_user_id', users[0].id)
  record.set('invited_by_user_id', e.auth.id)
  record.set('participant_reflection', '')
  record.set('completed_at', '')
  e.next()
}, 'cer_cycle_invitations')

onRecordUpdateRequest((e) => {
  const record = e.record
  const original = record.original()
  if (!e.auth || original.getString('participant_user_id') !== e.auth.id)
    throw new ForbiddenError('Somente a interagente pode compartilhar sua percepção.')
  if (original.getString('completed_at'))
    throw new BadRequestError('A percepção já foi compartilhada.')
  for (const field of [
    'enrollment_id',
    'care_cycle_id',
    'participant_user_id',
    'invited_by_user_id',
    'shared_prompt',
  ]) {
    if (record.getString(field) !== original.getString(field))
      throw new BadRequestError('O convite é imutável.')
  }
  const text = record.getString('participant_reflection').trim()
  if (!text) throw new BadRequestError('Escreva sua percepção antes de compartilhar.')
  record.set('participant_reflection', text)
  record.set('completed_at', new Date().toISOString())
  e.next()
}, 'cer_cycle_invitations')
