// Hook para registrar eventos de auditoria após autenticação bem-sucedida
onRecordAuthWithPasswordRequest((e) => {
  e.next()

  try {
    const authRecord = e.record
    if (authRecord) {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const auditRec = new Record(auditCol)
      auditRec.set('actor_user_id', authRecord.id)
      auditRec.set('action', 'LOGIN_SUCCESS')
      auditRec.set('resource_type', 'user_account')
      auditRec.set('resource_id', authRecord.id)
      auditRec.set('timestamp', new Date().toISOString())
      auditRec.set('result', 'success')
      auditRec.set('request_context', e.requestInfo().remoteIP || 'direct_api')
      auditRec.set(
        'metadata',
        JSON.stringify({
          email: authRecord.getString('email'),
          status: authRecord.getString('status'),
        }),
      )
      $app.save(auditRec)
    }
  } catch (err) {
    // Não interrompe login se auditoria falhar
  }
}, 'users')
