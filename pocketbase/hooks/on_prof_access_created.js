// Hook para auditar concessão de acesso profissional (PROFESSIONAL_ACCESS_GRANTED)
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const auditRec = new Record(auditCol)
    auditRec.set('actor_user_id', record.getString('professional_user_id'))
    auditRec.set('action', 'PROFESSIONAL_ACCESS_GRANTED')
    auditRec.set('resource_type', 'professional_enrollment_access')
    auditRec.set('resource_id', record.id)
    auditRec.set('enrollment_id', record.getString('enrollment_id'))
    auditRec.set('timestamp', new Date().toISOString())
    auditRec.set('result', 'success')
    auditRec.set(
      'metadata',
      JSON.stringify({
        access_role: record.getString('access_role'),
        professional_user_id: record.getString('professional_user_id'),
      }),
    )
    $app.save(auditRec)
  } catch (_) {}
}, 'professional_enrollment_access')
