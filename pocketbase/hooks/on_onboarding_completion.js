// Complete only the authenticated participant's own welcome. Raw journey rules
// stay closed to participants; no arbitrary stage or metadata edits are exposed.
routerAdd('POST', '/backend/v1/cer/onboarding/complete', (e) => {
  const enrollmentId = e.requestInfo().body.enrollment_id
  if (typeof enrollmentId !== 'string' || !/^[a-z0-9]{15}$/.test(enrollmentId))
    throw new BadRequestError('Acompanhamento inválido.')
  let stage
  e.app.runInTransaction((app) => {
    const account = app.findRecordById('users', e.auth.id)
    if (account.getString('status') !== 'active') throw new ForbiddenError('Sua conta não está ativa.')
    const roles = app.findRecordsByFilter('user_roles', 'user_id = {:user} && role = "interagente" && is_active = true', '', 1, 0, { user: account.id })
    const enrollment = app.findRecordById('enrollments', enrollmentId)
    if (!roles.length || enrollment.getString('person_id') !== account.getString('person_id') || enrollment.getString('status') !== 'active')
      throw new ForbiddenError('Sem acesso a este acolhimento.')
    const journey = app.findFirstRecordByFilter('journey_states', 'enrollment_id = {:enrollment}', { enrollment: enrollmentId })
    stage = journey.getString('current_stage')
    if (stage !== 'onboarding') return // Idempotent: never reset an advanced journey.
    const metadata = JSON.parse(journey.getString('metadata') || '{}')
    journey.set('current_stage', 'consciousness')
    journey.set('stage_status', 'em_andamento')
    journey.set('metadata', Object.assign({}, metadata, {
      onboarding_completed: true,
      onboarding_completed_at: metadata.onboarding_completed_at || new Date().toISOString(),
    }))
    app.save(journey)
    stage = 'consciousness'
  })
  return e.json(200, { completed: true, current_stage: stage })
}, $apis.requireAuth('users'), $apis.bodyLimit(1000))
