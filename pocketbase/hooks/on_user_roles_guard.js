// Hook de segurança P0: Proteção e Hardening da coleção user_roles
// Bloquear deleção física de roles (preservar política existente)
// Guardar create/update conforme matriz congelada do Build 09B

onRecordCreate((e) => {
  const authUser = e.auth
  if (!authUser || !authUser.id) {
    throw new ForbiddenError('Autenticação obrigatória para gerenciar papéis de usuário.')
  }

  // 1. Verificar papéis do ator autenticado
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

  const targetUserId = e.record.getString('user_id')
  const requestedRole = e.record.getString('role')

  // Negar self-promotion: ninguém pode conceder papéis a si mesmo
  if (targetUserId === authUser.id) {
    throw new ForbiddenError(
      'Autoatribuição ou promoção de papéis a si mesmo é estritamente negada.',
    )
  }

  // Se não for nem admin nem profissional ativo, rejeitar
  if (!isActorAdmin && !isActorProf) {
    throw new ForbiddenError(
      'Apenas administradores e profissionais têm autorização para gerenciar papéis.',
    )
  }

  // Se for profissional (e não admin):
  if (!isActorAdmin && isActorProf) {
    // PROFISSIONAL: pode conceder SOMENTE interagente
    if (requestedRole !== 'interagente') {
      throw new ForbiddenError('Profissionais só podem conceder o papel de interagente.')
    }

    // Validar escopo real: o usuário alvo deve pertencer a uma matrícula (enrollment) sob o escopo ativo do profissional
    // Busca a person associada ao target_user_id
    let targetPersonId = ''
    try {
      const targetUser = $app.findFirstRecordByData('users', 'id', targetUserId)
      targetPersonId = targetUser.getString('person_id')
    } catch (_) {
      throw new BadRequestError('Usuário alvo não encontrado.')
    }

    if (!targetPersonId) {
      throw new ForbiddenError('Usuário alvo não possui vínculo com pessoa física (person).')
    }

    // Buscar enrollments ativos dessa person
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
          break
        }
      } catch (_) {}
    }

    if (!inScope) {
      throw new ForbiddenError(
        'Operação negada: o participante não está no escopo de acompanhamento deste profissional.',
      )
    }
  }

  // ADMIN: pode operar interagente e profissional conforme política explícita
  // Registrar auditoria após salvar
  e.next()

  try {
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const auditRec = new Record(auditCol)
    auditRec.set('actor_user_id', authUser.id)
    auditRec.set('action', 'USER_ROLE_GRANTED')
    auditRec.set('resource_type', 'user_role')
    auditRec.set('resource_id', e.record.id)
    auditRec.set('timestamp', new Date().toISOString())
    auditRec.set('result', 'success')
    auditRec.set(
      'metadata',
      JSON.stringify({
        target_user_id: targetUserId,
        role: requestedRole,
        granted_by: authUser.id,
      }),
    )
    $app.save(auditRec)
  } catch (_) {}
}, 'user_roles')

onRecordUpdate((e) => {
  const authUser = e.auth
  if (!authUser || !authUser.id) {
    throw new ForbiddenError('Autenticação obrigatória para alterar papéis de usuário.')
  }

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

  const targetUserId = e.record.getString('user_id')
  const requestedRole = e.record.getString('role')
  const originalRole = e.record.original().getString('role')
  const originalUserId = e.record.original().getString('user_id')

  // Não permitir mudar o user_id do registro de role
  if (targetUserId !== originalUserId) {
    throw new ForbiddenError('Não é permitido transferir um registro de papel para outro usuário.')
  }

  // Negar self-alteration: ninguém pode alterar seus próprios papéis
  if (targetUserId === authUser.id) {
    throw new ForbiddenError('Alteração do próprio papel é estritamente negada.')
  }

  if (!isActorAdmin && !isActorProf) {
    throw new ForbiddenError(
      'Apenas administradores e profissionais têm autorização para atualizar papéis.',
    )
  }

  if (!isActorAdmin && isActorProf) {
    // Profissional não pode mudar para admin ou profissional, nem alterar role que não seja interagente
    if (requestedRole !== 'interagente' || originalRole !== 'interagente') {
      throw new ForbiddenError('Profissionais só podem gerenciar papéis de interagente.')
    }

    // Validar escopo
    let targetPersonId = ''
    try {
      const targetUser = $app.findFirstRecordByData('users', 'id', targetUserId)
      targetPersonId = targetUser.getString('person_id')
    } catch (_) {
      throw new BadRequestError('Usuário alvo não encontrado.')
    }

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
          break
        }
      } catch (_) {}
    }

    if (!inScope) {
      throw new ForbiddenError(
        'Operação negada: o participante não está no escopo de acompanhamento deste profissional.',
      )
    }
  }

  e.next()

  try {
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const auditRec = new Record(auditCol)
    auditRec.set('actor_user_id', authUser.id)
    auditRec.set('action', 'USER_ROLE_UPDATED')
    auditRec.set('resource_type', 'user_role')
    auditRec.set('resource_id', e.record.id)
    auditRec.set('timestamp', new Date().toISOString())
    auditRec.set('result', 'success')
    auditRec.set(
      'metadata',
      JSON.stringify({
        target_user_id: targetUserId,
        role: requestedRole,
        is_active: e.record.getBool('is_active'),
        updated_by: authUser.id,
      }),
    )
    $app.save(auditRec)
  } catch (_) {}
}, 'user_roles')

// Item 7: Zero Physical Role Delete
onRecordDelete((e) => {
  throw new BadRequestError(
    'Deleção física de papéis em user_roles é estritamente negada. Use is_active = false para desativação lógica.',
  )
}, 'user_roles')
