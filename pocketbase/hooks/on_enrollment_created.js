// Hook para registrar eventos de auditoria na criação de enrollments
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const auditRec = new Record(auditCol)
    auditRec.set('action', 'ENROLLMENT_CREATED')
    auditRec.set('resource_type', 'enrollment')
    auditRec.set('resource_id', record.id)
    auditRec.set('enrollment_id', record.id)
    auditRec.set('timestamp', new Date().toISOString())
    auditRec.set('result', 'success')
    auditRec.set(
      'metadata',
      JSON.stringify({
        status: record.getString('status'),
        person_id: record.getString('person_id'),
        product_id: record.getString('product_id'),
      }),
    )
    $app.save(auditRec)
  } catch (_) {}
}, 'enrollments')
