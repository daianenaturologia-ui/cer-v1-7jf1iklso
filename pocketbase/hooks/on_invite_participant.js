// Atomic invitation. No email is sent; credentials are returned only on initial creation.
routerAdd(
  'POST',
  '/backend/v1/cer/invite-participant',
  (e) => {
    const actor = e.auth
    if (!actor || actor.getString('status') !== 'active')
      throw new ForbiddenError('Conta profissional ativa obrigatória.')
    const body = e.requestInfo().body || {}
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const productId = typeof body.productId === 'string' ? body.productId : ''
    if (!fullName || fullName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new BadRequestError('Informe nome e e-mail válidos.')
    if (body.professionalUserId && body.professionalUserId !== actor.id)
      throw new ForbiddenError('O vínculo profissional pertence à conta autenticada.')
    if (
      body.temporaryPassword !== undefined &&
      (typeof body.temporaryPassword !== 'string' || body.temporaryPassword.length < 8)
    )
      throw new BadRequestError('Senha provisória inválida.')
    const preferredName =
      typeof body.preferredName === 'string' ? body.preferredName.trim() : fullName.split(' ')[0]
    const notes = typeof body.notes === 'string' ? body.notes : ''
    if (notes.length > 20000 || preferredName.length > 160)
      throw new BadRequestError('Texto excede o limite.')
    let result
    e.app.runInTransaction((app) => {
      const currentActor = app.findRecordById('users', actor.id)
      if (currentActor.getString('status') !== 'active') throw new ForbiddenError('Conta inativa.')
      const roles = app.findRecordsByFilter(
        'user_roles',
        'user_id = {:id} && is_active = true && (role = "profissional" || role = "admin")',
        '',
        1,
        0,
        { id: actor.id },
      )
      if (!roles.length) throw new ForbiddenError('Papel profissional ativo obrigatório.')
      let product
      try {
        product = app.findRecordById('cer_products', productId)
      } catch (_) {
        throw new BadRequestError('Produto inválido.')
      }
      if (!product.getBool('is_active')) throw new BadRequestError('Produto indisponível.')
      const accounts = app.findRecordsByFilter('users', 'email = {:email}', '', 2, 0, { email })
      const people = app.findRecordsByFilter('persons', 'email = {:email}', '', 2, 0, { email })
      if (accounts.length > 1 || people.length > 1)
        throw new BadRequestError('Cadastro exige revisão administrativa.')
      let person, user, temporaryCredential
      const save = (name, values) => {
        const r = new Record(app.findCollectionByNameOrId(name))
        for (const key in values) r.set(key, values[key])
        app.save(r)
        return r
      }
      if (accounts.length) {
        user = accounts[0]
        if (
          !['active', 'invited'].includes(user.getString('status')) ||
          !user.getString('person_id')
        )
          throw new ForbiddenError('Cadastro exige revisão administrativa.')
        person = app.findRecordById('persons', user.getString('person_id'))
        if (
          person.getString('email').toLowerCase() !== email ||
          (people.length && people[0].id !== person.id)
        )
          throw new ForbiddenError('Cadastro exige revisão administrativa.')
        const enrollments = app.findRecordsByFilter('enrollments', 'person_id = {:id}', '', 0, 0, {
          id: person.id,
        })
        let inScope = false
        for (const enrollment of enrollments) {
          const links = app.findRecordsByFilter(
            'professional_enrollment_access',
            'enrollment_id = {:id} && professional_user_id = {:actor} && is_active = true',
            '',
            1,
            0,
            { id: enrollment.id, actor: actor.id },
          )
          if (links.length) {
            inScope = true
            if (
              enrollment.getString('product_id') === productId &&
              enrollment.getString('status') === 'active'
            ) {
              result = {
                person: person.publicExport(),
                enrollment: enrollment.publicExport(),
                reused: true,
              }
            }
          }
        }
        if (!inScope) throw new ForbiddenError('Cadastro exige revisão administrativa.')
        const participantRoles = app.findRecordsByFilter(
          'user_roles',
          'user_id = {:id} && role = "interagente" && is_active = true',
          '',
          1,
          0,
          { id: user.id },
        )
        if (!participantRoles.length)
          throw new ForbiddenError('Cadastro exige revisão administrativa.')
        if (result) return // Retry preserves the existing account, credential and enrollment.
      } else {
        // Never silently claim an existing unlinked human identity.
        if (people.length) throw new ForbiddenError('Cadastro exige revisão administrativa.')
        person = save('persons', {
          full_name: fullName,
          preferred_name: preferredName,
          email,
          notes,
        })
        temporaryCredential = body.temporaryPassword || 'Tmp-' + $security.randomString(24)
        user = new Record(app.findCollectionByNameOrId('users'))
        user.set('email', email)
        user.set('name', preferredName || fullName)
        user.set('person_id', person.id)
        user.set('status', 'invited')
        user.set('verified', false)
        user.setPassword(temporaryCredential)
        app.save(user)
      }
      const enrollment = save('enrollments', {
        person_id: person.id,
        product_id: productId,
        status: 'active',
        notes,
      })
      save('professional_enrollment_access', {
        enrollment_id: enrollment.id,
        professional_user_id: actor.id,
        access_role: 'primary',
        is_active: true,
      })
      if (!accounts.length)
        save('user_roles', { user_id: user.id, role: 'interagente', is_active: true })
      save('journey_states', {
        enrollment_id: enrollment.id,
        current_stage: 'onboarding',
        stage_status: 'nao_iniciado',
        metadata: { created_by_professional: actor.id },
      })
      save('audit_events', {
        actor_user_id: actor.id,
        action: accounts.length ? 'ENROLLMENT_CREATED' : 'ACCOUNT_INVITED',
        resource_type: 'enrollment',
        resource_id: enrollment.id,
        enrollment_id: enrollment.id,
        timestamp: new Date().toISOString(),
        result: 'success',
        metadata: { method: 'atomic_invitation', reused_account: !!accounts.length },
      })
      result = {
        person: person.publicExport(),
        enrollment: enrollment.publicExport(),
        ...(temporaryCredential ? { tempPasswordGenerated: temporaryCredential } : {}),
      }
    })
    return e.json(200, result)
  },
  $apis.requireAuth('users'),
)
