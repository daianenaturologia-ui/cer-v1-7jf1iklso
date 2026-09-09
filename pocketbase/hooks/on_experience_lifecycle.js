// Hook server-side do ciclo de vida das experiências em enrollment_experiences
// Ações de auditoria permitidas:
// EXPERIENCE_RELEASED, EXPERIENCE_STARTED, EXPERIENCE_COMPLETED, EXPERIENCE_PAUSED, EXPERIENCE_REOPENED
// ATENÇÃO: NUNCA registrar conteúdo sensível de respostas em audit_events!

onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const releaseStatus = record.getString('release_status')

    if (releaseStatus === 'available' || releaseStatus === 'in_progress') {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const auditRec = new Record(auditCol)

      if (e.auth && e.auth.id) {
        auditRec.set('actor_user_id', e.auth.id)
      }
      auditRec.set('action', 'EXPERIENCE_RELEASED')
      auditRec.set('resource_type', 'experience')
      auditRec.set('resource_id', record.getString('experience_id'))
      auditRec.set('enrollment_id', record.getString('enrollment_id'))
      auditRec.set('timestamp', new Date().toISOString())
      auditRec.set('result', 'success')
      auditRec.set(
        'metadata',
        JSON.stringify({
          release_status: releaseStatus,
          enrollment_experience_id: record.id,
        }),
      )
      $app.save(auditRec)
    }
  } catch (_) {}
}, 'enrollment_experiences')

onRecordAfterUpdateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const orig = record.original()
    const oldStatus = orig ? orig.getString('release_status') : ''
    const newStatus = record.getString('release_status')

    const oldProgress = orig ? orig.getString('progress_status') : ''
    const newProgress = record.getString('progress_status')

    let auditAction = null

    if (oldStatus !== newStatus) {
      if (oldStatus === 'locked' && newStatus === 'available') {
        auditAction = 'EXPERIENCE_RELEASED'
      } else if (newStatus === 'paused') {
        auditAction = 'EXPERIENCE_PAUSED'
      } else if (
        oldStatus === 'paused' &&
        (newStatus === 'available' || newStatus === 'in_progress')
      ) {
        auditAction = 'EXPERIENCE_REOPENED'
      } else if (
        oldStatus === 'completed' &&
        (newStatus === 'available' || newStatus === 'in_progress')
      ) {
        auditAction = 'EXPERIENCE_REOPENED'
      }
    }

    if (!auditAction && oldProgress !== newProgress) {
      if (oldProgress === 'not_started' && newProgress === 'in_progress') {
        auditAction = 'EXPERIENCE_STARTED'
      } else if (newProgress === 'completed') {
        auditAction = 'EXPERIENCE_COMPLETED'
      }
    }

    if (auditAction) {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const auditRec = new Record(auditCol)

      if (e.auth && e.auth.id) {
        auditRec.set('actor_user_id', e.auth.id)
      }
      auditRec.set('action', auditAction)
      auditRec.set('resource_type', 'experience')
      auditRec.set('resource_id', record.getString('experience_id'))
      auditRec.set('enrollment_id', record.getString('enrollment_id'))
      auditRec.set('timestamp', new Date().toISOString())
      auditRec.set('result', 'success')
      auditRec.set(
        'metadata',
        JSON.stringify({
          release_status: newStatus,
          progress_status: newProgress,
          enrollment_experience_id: record.id,
        }),
      )
      $app.save(auditRec)
    }
  } catch (_) {}
}, 'enrollment_experiences')
