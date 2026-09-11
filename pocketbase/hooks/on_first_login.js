// Hook de intervenção server-side autorizada: First Login da Participante
// Endpoint atômico: POST /api/cer/first-login
// Usuária autenticada com status=invited define sua nova senha, migrando invited -> active
// Target é sempre o próprio usuário autenticado.

routerAdd(
  'POST',
  '/backend/v1/cer/first-login',
  (e) => {
    const authUser = e.auth
    if (!authUser || !authUser.id) {
      throw new ForbiddenError('Autenticação obrigatória para ativação de primeiro acesso.')
    }

    // Alvo é sempre o próprio usuário autenticado (nunca aceita target_user_id arbitrário)
    const currentStatus = authUser.getString('status')
    if (currentStatus !== 'invited') {
      throw new BadRequestError(
        'Esta conta não está em estado de primeiro acesso (invited). Status atual: ' +
          currentStatus,
      )
    }

    const body = e.requestInfo().body || {}
    const newPassword = body.newPassword || body.password || ''
    const passwordConfirm = body.passwordConfirm || newPassword

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new BadRequestError('A nova senha deve possuir pelo menos 8 caracteres.')
    }

    if (newPassword !== passwordConfirm) {
      throw new BadRequestError('A confirmação da senha não confere.')
    }

    // Operação ATÔMICA via runInTransaction
    $app.runInTransaction((txApp) => {
      // 1. Carregar usuário no contexto transacional
      const userToUpdate = txApp.findRecordById('users', authUser.id)

      // Atualizar senha e transicionar status de invited para active
      userToUpdate.setPassword(newPassword)
      userToUpdate.set('status', 'active')

      // Salvar usuário
      txApp.save(userToUpdate)

      // 2. Registrar evento de auditoria FIRST_LOGIN_COMPLETED
      const auditCol = txApp.findCollectionByNameOrId('audit_events')
      const auditRec = new Record(auditCol)
      auditRec.set('actor_user_id', authUser.id)
      auditRec.set('action', 'FIRST_LOGIN_COMPLETED')
      auditRec.set('resource_type', 'user_account')
      auditRec.set('resource_id', authUser.id)
      auditRec.set('timestamp', new Date().toISOString())
      auditRec.set('result', 'success')
      auditRec.set(
        'metadata',
        JSON.stringify({
          transition: 'invited_to_active',
          method: 'first_login_server_side',
        }),
      )
      txApp.save(auditRec)
    })

    return e.json(200, {
      success: true,
      message: 'Senha definida com sucesso e conta ativada.',
      userId: authUser.id,
      status: 'active',
    })
  },
  $apis.requireAuth(),
)
