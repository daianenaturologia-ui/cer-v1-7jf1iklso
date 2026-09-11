// Hook de intervenção server-side autorizada: Redefinição de acesso por profissional no escopo
// Endpoint: POST /api/cer/reset-participant-access
// Somente profissional autorizado no escopo real da participante pode acionar.
// Define credencial temporária segura, altera status da participante para 'invited',
// gera auditoria e retorna a credencial para entrega por canal humano.
// NUNCA loga a senha e NUNCA salva plaintext em auditoria.

routerAdd(
  'POST',
  '/backend/v1/cer/reset-participant-access',
  (e) => {
    const authUser = e.auth
    if (!authUser || !authUser.id) {
      throw new ForbiddenError('Autenticação obrigatória.')
    }

    // 1. Verificar se o ator possui papel de profissional ou admin
    const actorRoleRecords = $app.findRecordsByFilter(
      'user_roles',
      'user_id = {:actorId} && is_active = true',
      '-created',
      10,
      0,
      { actorId: authUser.id },
    )
    const actorRoles = actorRoleRecords.map((r) => r.getString('role'))
    const isActorAdmin = actorRoles.indexOf('admin') !== -1
    const isActorProf = actorRoles.indexOf('profissional') !== -1

    if (!isActorAdmin && !isActorProf) {
      throw new ForbiddenError(
        'Apenas profissionais ou administradores podem redefinir o acesso de participantes.',
      )
    }

    const body = e.requestInfo().body || {}
    const targetUserId = body.target_user_id || body.targetUserId || ''

    if (!targetUserId) {
      throw new BadRequestError('target_user_id é obrigatório.')
    }

    if (targetUserId === authUser.id) {
      throw new ForbiddenError(
        'Não é permitido redefinir o próprio acesso através deste mecanismo.',
      )
    }

    // Buscar usuário alvo
    let targetUser = null
    try {
      targetUser = $app.findFirstRecordByData('users', 'id', targetUserId)
    } catch (_) {
      throw new BadRequestError('Usuário alvo não encontrado.')
    }

    const targetPersonId = targetUser.getString('person_id')
    if (!targetPersonId) {
      throw new BadRequestError('Usuário alvo não possui vínculo com pessoa física (person).')
    }

    // 2. Se for profissional (e não admin), validar escopo real via professional_enrollment_access
    let associatedEnrollmentId = ''
    if (!isActorAdmin) {
      const enrollments = $app.findRecordsByFilter(
        'enrollments',
        'person_id = {:personId}',
        '-created',
        50,
        0,
        { personId: targetPersonId },
      )

      let inScope = false
      for (let i = 0; i < enrollments.length; i++) {
        const enrId = enrollments[i].id
        try {
          const access = $app.findFirstRecordByData(
            'professional_enrollment_access',
            'enrollment_id',
            enrId,
          )
          if (
            access.getString('professional_user_id') === authUser.id &&
            access.getBool('is_active')
          ) {
            inScope = true
            associatedEnrollmentId = enrId
            break
          }
        } catch (_) {}
      }

      if (!inScope) {
        throw new ForbiddenError(
          'Operação negada: o participante não está sob seu escopo de acompanhamento ativo.',
        )
      }
    }

    // 3. Gerar senha temporária segura (mínimo 10 caracteres aleatórios com letras e dígitos)
    // PocketBase $security.randomString(n)
    const tempCredential = 'Tmp-' + $security.randomString(8)

    // 4. Operação transacional atômica
    $app.runInTransaction((txApp) => {
      const userToReset = txApp.findRecordById('users', targetUserId)
      userToReset.setPassword(tempCredential)
      userToReset.set('status', 'invited')
      txApp.save(userToReset)

      // Auditoria obrigatória (SEM plaintext da senha)
      const auditCol = txApp.findCollectionByNameOrId('audit_events')
      const auditRec = new Record(auditCol)
      auditRec.set('actor_user_id', authUser.id)
      auditRec.set('action', 'ACCESS_RESET_BY_PROFESSIONAL')
      auditRec.set('resource_type', 'user_account')
      auditRec.set('resource_id', targetUserId)
      if (associatedEnrollmentId) {
        auditRec.set('enrollment_id', associatedEnrollmentId)
      }
      auditRec.set('timestamp', new Date().toISOString())
      auditRec.set('result', 'success')
      auditRec.set(
        'metadata',
        JSON.stringify({
          target_user_id: targetUserId,
          transition: 'reset_to_invited',
          initiated_by: authUser.id,
          method: 'professional_reset_access',
        }),
      )
      txApp.save(auditRec)
    })

    // Retornar a credencial temporária uma única vez para compartilhamento pelo canal humano seguro
    return e.json(200, {
      success: true,
      message: 'Acesso redefinido para estado invited com credencial temporária.',
      targetUserId: targetUserId,
      temporaryCredential: tempCredential,
    })
  },
  $apis.requireAuth(),
)
