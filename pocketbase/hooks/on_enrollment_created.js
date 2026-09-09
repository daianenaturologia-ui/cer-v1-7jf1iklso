// Hook para registrar eventos de auditoria na criação de enrollments
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const authUser = e.auth

    // 1. Concessão inicial legítima automática para o profissional criador do enrollment
    // Se o criador do enrollment for um usuário com perfil profissional autenticado,
    // o backend cria a concessão professional_enrollment_access para ele de forma privilegiada.
    if (authUser && authUser.id) {
      try {
        const profAccessCol = $app.findCollectionByNameOrId('professional_enrollment_access')
        // Verificar se já existe vínculo para evitar duplicações
        let existingAccess = null
        try {
          existingAccess = $app.findFirstRecordByData(
            'professional_enrollment_access',
            'enrollment_id',
            record.id,
          )
        } catch (_) {}

        if (!existingAccess) {
          const newAccess = new Record(profAccessCol)
          newAccess.set('enrollment_id', record.id)
          newAccess.set('professional_user_id', authUser.id)
          newAccess.set('access_role', 'primary')
          newAccess.set('is_active', true)
          $app.save(newAccess)
        }
      } catch (_) {}
    }

    // 2. Registrar evento de auditoria ENROLLMENT_CREATED
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const auditRec = new Record(auditCol)
    if (authUser && authUser.id) {
      auditRec.set('actor_user_id', authUser.id)
    }
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
