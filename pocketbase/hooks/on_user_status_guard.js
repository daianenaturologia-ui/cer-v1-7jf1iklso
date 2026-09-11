// Hook de Hardening de users.status
// Garante que o próprio usuário não possa alterar arbitrariamente seu próprio status
// (por exemplo: active -> invited, active -> suspended, active -> disabled)
// Bloqueia tentativas de auto-promoção ou de corromper o estado da própria conta via API direta.

onRecordUpdate((e) => {
  const authUser = e.auth
  // Se for superuser / migração / processo interno sem authUser, permitir
  if (!authUser || !authUser.id) {
    return
  }

  const record = e.record
  const original = e.record.original()

  const originalStatus = original ? original.getString('status') : ''
  const newStatus = record.getString('status')

  // Se o próprio usuário está se atualizando
  if (record.id === authUser.id) {
    // 1. Bloquear alteração de status se não for permitida
    if (originalStatus && newStatus && originalStatus !== newStatus) {
      // O usuário comum active não pode mudar seu status para invited, suspended ou disabled
      throw new ForbiddenError(
        'Alteração do status da própria conta (' +
          originalStatus +
          ' -> ' +
          newStatus +
          ') não é permitida diretamente pelo usuário.',
      )
    }

    // 2. Não permitir que o usuário altere seu person_id arbitrariamente
    const origPerson = original ? original.getString('person_id') : ''
    const newPerson = record.getString('person_id')
    if (origPerson && newPerson && origPerson !== newPerson) {
      throw new ForbiddenError('Alteração da vinculação com pessoa (person_id) não é permitida.')
    }
  }
}, 'users')
