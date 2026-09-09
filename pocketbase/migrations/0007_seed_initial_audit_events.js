migrate(
  (app) => {
    const auditCol = app.findCollectionByNameOrId('audit_events')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'admin.cer@cer.app')

    // Inserir eventos de auditoria canônicos para demonstrar a trilha de segurança do Build 01
    const seedEvents = [
      {
        action: 'ACCOUNT_INVITED',
        resource_type: 'user_account',
        resource_id: adminUser.id,
        actor_user_id: adminUser.id,
        result: 'success',
        metadata: JSON.stringify({ role: 'admin', channel: 'system_setup' }),
      },
      {
        action: 'MFA_ENABLED',
        resource_type: 'user_account',
        resource_id: adminUser.id,
        actor_user_id: adminUser.id,
        result: 'success',
        metadata: JSON.stringify({ method: 'totp_token', enforced: true }),
      },
      {
        action: 'PROFESSIONAL_ACCESS_GRANTED',
        resource_type: 'professional_enrollment_access',
        resource_id: 'clvshrcj3h2jyjl',
        actor_user_id: adminUser.id,
        result: 'success',
        metadata: JSON.stringify({ access_role: 'primary' }),
      },
      {
        action: 'LOGIN_SUCCESS',
        resource_type: 'user_account',
        resource_id: adminUser.id,
        actor_user_id: adminUser.id,
        result: 'success',
        metadata: JSON.stringify({ client: 'browser_session', mfa_verified: true }),
      },
    ]

    for (const ev of seedEvents) {
      const rec = new Record(auditCol)
      rec.set('action', ev.action)
      rec.set('resource_type', ev.resource_type)
      rec.set('resource_id', ev.resource_id)
      rec.set('actor_user_id', ev.actor_user_id)
      rec.set('timestamp', new Date().toISOString())
      rec.set('result', ev.result)
      rec.set('request_context', 'internal_bootstrap')
      rec.set('metadata', ev.metadata)
      app.save(rec)
    }
  },
  (app) => {},
)
