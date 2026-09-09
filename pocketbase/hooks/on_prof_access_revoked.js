// Hook de auditoria para revogação de vínculo profissional (PROFESSIONAL_ACCESS_REVOKED)
onRecordAfterUpdateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const authUser = e.auth
    const actorId = authUser && authUser.id ? authUser.id : 'platform_admin'
    const isActive = record.getBool('is_active')

    // Se is_active foi alterado para false, auditar revogação
    if (!isActive) {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const auditRec = new Record(auditCol)
      auditRec.set('actor_user_id', actorId)
      auditRec.set('action', 'PROFESSIONAL_ACCESS_REVOKED')
      auditRec.set('resource_type', 'professional_enrollment_access')
      auditRec.set('resource_id', record.id)
      auditRec.set('enrollment_id', record.getString('enrollment_id'))
      auditRec.set('timestamp', new Date().toISOString())
      auditRec.set('result', 'success')
      auditRec.set(
        'metadata',
        JSON.stringify({
          professional_user_id: record.getString('professional_user_id'),
          access_role: record.getString('access_role'),
          revoked_by: actorId,
          method: 'update_is_active_false',
        }),
      )
      $app.save(auditRec)
    }
  } catch (_) {}
}, 'professional_enrollment_access')

onRecordAfterDeleteSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const authUser = e.auth
    const actorId = authUser && authUser.id ? authUser.id : 'platform_admin'

    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const auditRec = new Record(auditCol)
    auditRec.set('actor_user_id', actorId)
    auditRec.set('action', 'PROFESSIONAL_ACCESS_REVOKED')
    auditRec.set('resource_type', 'professional_enrollment_access')
    auditRec.set('resource_id', record.id)
    auditRec.set('enrollment_id', record.getString('enrollment_id'))
    auditRec.set('timestamp', new Date().toISOString())
    auditRec.set('result', 'success')
    auditRec.set(
      'metadata',
      JSON.stringify({
        professional_user_id: record.getString('professional_user_id'),
        access_role: record.getString('access_role'),
        revoked_by: actorId,
        method: 'delete_record',
      }),
    )
    $app.save(auditRec)
  } catch (_) {}
}, 'professional_enrollment_access')
