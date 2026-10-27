routerAdd(
  'POST',
  '/backend/v1/cer/registration',
  (e) => {
    const b = e.requestInfo().body || {}
    const action = b.action
    const professional = (app, id) => {
      const user = app.findRecordById('users', id)
      if (user.getString('status') !== 'active')
        throw new ForbiddenError('Profissional indisponível.')
      if (
        !app.findRecordsByFilter(
          'user_roles',
          'user_id = {:id} && role = "profissional" && is_active = true',
          '',
          1,
          0,
          { id },
        ).length
      )
        throw new ForbiddenError('Profissional indisponível.')
      return user
    }
    const getLink = (app, slug) => {
      if (typeof slug !== 'string' || !/^[a-zA-Z0-9]{48}$/.test(slug))
        throw new BadRequestError(
          'Link de cadastro indisponível. Peça um novo link à sua profissional.',
        )
      let link
      try {
        link = app.findFirstRecordByFilter(
          'cer_registration_links',
          'slug = {:slug} && active = true',
          { slug },
        )
      } catch (_) {
        throw new BadRequestError(
          'Link de cadastro indisponível. Peça um novo link à sua profissional.',
        )
      }
      professional(app, link.getString('professional_user_id'))
      if (!app.findRecordById('cer_products', link.getString('product_id')).getBool('is_active'))
        throw new BadRequestError('Acompanhamento indisponível.')
      return link
    }
    if (action === 'info') {
      const link = getLink(e.app, b.slug)
      return e.json(200, {
        professionalName: professional(e.app, link.getString('professional_user_id')).getString(
          'name',
        ),
        productName: e.app
          .findRecordById('cer_products', link.getString('product_id'))
          .getString('name'),
      })
    }
    if (action === 'register') {
      const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''
      const name = typeof b.fullName === 'string' ? b.fullName.trim() : ''
      if (
        b.website ||
        !name ||
        name.length > 160 ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        b.acceptLink !== true
      )
        throw new BadRequestError('Confira seu nome, e-mail e o acompanhamento escolhido.')
      if (
        typeof b.password !== 'string' ||
        b.password.length < 10 ||
        b.password.length > 64 ||
        unescape(encodeURIComponent(b.password)).length > 72 ||
        b.password !== b.passwordConfirm
      )
        throw new BadRequestError('Use uma senha de 10 a 64 caracteres e confirme a mesma senha.')
      let created
      e.app.runInTransaction((app) => {
        const link = getLink(app, b.slug)
        // Never claim an existing identity, change its password or add a professional to it.
        if (
          app.findRecordsByFilter('users', 'email = {:email}', '', 1, 0, { email }).length ||
          app.findRecordsByFilter('persons', 'email = {:email}', '', 1, 0, { email }).length
        )
          return
        const day = new Date().toISOString().slice(0, 10)
        const recent = app.findRecordsByFilter(
          'cer_registration_requests',
          'link_id = {:id} && created >= {:day}',
          '',
          30,
          0,
          { id: link.id, day },
        )
        if (recent.length >= 30)
          throw new BadRequestError(
            'O limite de cadastros de hoje foi atingido. Fale com sua profissional.',
          )
        const person = new Record(app.findCollectionByNameOrId('persons'))
        person.set('full_name', name)
        person.set('preferred_name', name.split(' ')[0])
        person.set('email', email)
        app.save(person)
        const user = new Record(app.findCollectionByNameOrId('users'))
        user.set('email', email)
        user.set('name', name.split(' ')[0])
        user.set('person_id', person.id)
        user.set('status', 'invited')
        user.set('verified', false)
        user.setPassword(b.password)
        app.save(user)
        const pending = new Record(app.findCollectionByNameOrId('cer_registration_requests'))
        pending.set('user_id', user.id)
        pending.set('link_id', link.id)
        pending.set('completed', false)
        app.save(pending)
        created = user
      })
      if (created) {
        try {
          $mails.sendRecordVerification(e.app, created)
        } catch (_) {
          throw new ApiError(
            503,
            'Não foi possível enviar a confirmação agora. Use Reenviar confirmação e tente novamente mais tarde.',
          )
        }
      }
      // Same response for existing addresses. No identities, credentials or auth tokens are returned.
      return e.json(200, { next: 'check_email' })
    }
    if (!e.auth) throw new ForbiddenError('Entre com sua conta profissional.')
    professional(e.app, e.auth.id)
    if (action === 'list') {
      const links = e.app.findRecordsByFilter(
        'cer_registration_links',
        'professional_user_id = {:id}',
        '-created',
        100,
        0,
        { id: e.auth.id },
      )
      return e.json(
        200,
        links.map((r) => ({
          id: r.id,
          slug: r.getString('slug'),
          active: r.getBool('active'),
          productId: r.getString('product_id'),
        })),
      )
    }
    if (action === 'create') {
      let result
      e.app.runInTransaction((app) => {
        professional(app, e.auth.id)
        const product = app.findRecordById('cer_products', b.productId || '')
        if (!product.getBool('is_active'))
          throw new BadRequestError('Escolha um acompanhamento disponível.')
        const old = app.findRecordsByFilter(
          'cer_registration_links',
          'professional_user_id = {:id} && product_id = {:product} && active = true',
          '',
          1,
          0,
          { id: e.auth.id, product: product.id },
        )
        const link = old[0] || new Record(app.findCollectionByNameOrId('cer_registration_links'))
        if (!old.length) {
          link.set('professional_user_id', e.auth.id)
          link.set('product_id', product.id)
          link.set('slug', $security.randomString(48))
          link.set('active', true)
          app.save(link)
        }
        result = { id: link.id, slug: link.getString('slug'), active: true, productId: product.id }
      })
      return e.json(200, result)
    }
    if (action === 'revoke') {
      const link = e.app.findRecordById('cer_registration_links', b.id || '')
      if (link.getString('professional_user_id') !== e.auth.id)
        throw new ForbiddenError('Este link pertence a outra profissional.')
      link.set('active', false)
      e.app.save(link)
      return e.json(200, { ok: true })
    }
    throw new BadRequestError('Operação inválida.')
  },
  $apis.bodyLimit(4000),
)

// Guard every auth method, including password/OTP/OAuth. No token before email verification.
onRecordAuthRequest((e) => {
  const rows = e.app.findRecordsByFilter(
    'cer_registration_requests',
    'user_id = {:id} && completed = false',
    '',
    1,
    0,
    { id: e.record.id },
  )
  if (!rows.length) return e.next() // Preserve all existing account flows.
  if (!e.record.getBool('verified'))
    throw new ForbiddenError(
      'Confirme seu e-mail antes de entrar. Você pode reenviar a confirmação na tela de cadastro.',
    )
  e.app.runInTransaction((app) => {
    const pending = app.findRecordById('cer_registration_requests', rows[0].id)
    if (pending.getBool('completed')) return
    const user = app.findRecordById('users', e.record.id)
    const link = app.findRecordById('cer_registration_links', pending.getString('link_id'))
    const professional = app.findRecordById('users', link.getString('professional_user_id'))
    const product = app.findRecordById('cer_products', link.getString('product_id'))
    if (
      user.getString('status') !== 'invited' ||
      !user.getBool('verified') ||
      !link.getBool('active') ||
      !product.getBool('is_active') ||
      professional.getString('status') !== 'active' ||
      !app.findRecordsByFilter(
        'user_roles',
        'user_id = {:id} && role = "profissional" && is_active = true',
        '',
        1,
        0,
        { id: professional.id },
      ).length
    )
      throw new ForbiddenError('Cadastro indisponível. Fale com sua profissional.')
    const save = (name, data) => {
      const r = new Record(app.findCollectionByNameOrId(name))
      for (const key in data) r.set(key, data[key])
      app.save(r)
      return r
    }
    const enrollment = save('enrollments', {
      person_id: user.getString('person_id'),
      product_id: product.id,
      status: 'active',
    })
    save('professional_enrollment_access', {
      enrollment_id: enrollment.id,
      professional_user_id: professional.id,
      access_role: 'primary',
      is_active: true,
    })
    save('user_roles', { user_id: user.id, role: 'interagente', is_active: true })
    save('journey_states', {
      enrollment_id: enrollment.id,
      current_stage: 'onboarding',
      stage_status: 'nao_iniciado',
      metadata: { method: 'verified_self_registration' },
    })
    user.set('status', 'active')
    app.save(user)
    pending.set('completed', true)
    app.save(pending)
    save('audit_events', {
      actor_user_id: user.id,
      action: 'ENROLLMENT_CREATED',
      resource_type: 'enrollment',
      resource_id: enrollment.id,
      enrollment_id: enrollment.id,
      timestamp: new Date().toISOString(),
      result: 'success',
      metadata: { method: 'verified_self_registration' },
    })
  })
  e.record.set('status', 'active')
  e.next()
}, 'users')
