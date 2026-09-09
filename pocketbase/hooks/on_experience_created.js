// Hook para registrar auditoria de EXPERIENCE_RELEASED caso seja criada já com status available/in_progress
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
