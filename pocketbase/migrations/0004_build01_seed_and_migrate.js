migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const personsCol = app.findCollectionByNameOrId('persons')
    const userRolesCol = app.findCollectionByNameOrId('user_roles')
    const cerProductsCol = app.findCollectionByNameOrId('cer_products')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const profAccessCol = app.findCollectionByNameOrId('professional_enrollment_access')
    const journeyStatesCol = app.findCollectionByNameOrId('journey_states')

    // 1. Cadastrar produto CER obrigatório: "Acompanhamento Individual CER"
    let productAcomp
    try {
      productAcomp = app.findFirstRecordByData(
        'cer_products',
        'code',
        'acompanhamento_individual_cer',
      )
    } catch (_) {
      productAcomp = new Record(cerProductsCol)
      productAcomp.set('code', 'acompanhamento_individual_cer')
      productAcomp.set('name', 'Acompanhamento Individual CER')
      productAcomp.set(
        'description',
        'Primeiro produto CER: acompanhamento contínuo e integrado do desenvolvimento humano nas 6 dimensões da Consciência, Equilíbrio & Realização e Evolução.',
      )
      productAcomp.set('is_active', true)
      app.save(productAcomp)
    }

    // 2. Migrar / Assegurar PERSON para a profissional Daiane
    let profUser
    try {
      profUser = app.findAuthRecordByEmail('_pb_users_auth_', 'daiane.naturologia@gmail.com')
    } catch (_) {
      profUser = new Record(usersCol)
      profUser.setEmail('daiane.naturologia@gmail.com')
      profUser.setPassword('Skip@Pass')
      profUser.setVerified(true)
      profUser.set('name', 'Daiane')
      app.save(profUser)
    }

    let profPerson
    try {
      profPerson = app.findFirstRecordByData('persons', 'email', 'daiane.naturologia@gmail.com')
    } catch (_) {
      profPerson = new Record(personsCol)
      profPerson.set('full_name', 'Daiane')
      profPerson.set('preferred_name', 'Daiane')
      profPerson.set('email', 'daiane.naturologia@gmail.com')
      profPerson.set('notes', 'Profissional da metodologia CER.')
      app.save(profPerson)
    }

    // Vincular person_id no usuário profissional
    if (profUser.get('person_id') !== profPerson.id) {
      profUser.set('person_id', profPerson.id)
      app.save(profUser)
    }

    // Atribuir papel 'profissional' em user_roles
    try {
      app.findFirstRecordByData('user_roles', 'user_id', profUser.id)
    } catch (_) {
      const profRole = new Record(userRolesCol)
      profRole.set('user_id', profUser.id)
      profRole.set('role', 'profissional')
      profRole.set('is_active', true)
      app.save(profRole)
    }

    // 3. Migrar / Assegurar PERSON para o interagente sintético demo
    let demoUser
    try {
      demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'interagente.demo@cer.app')
    } catch (_) {
      demoUser = new Record(usersCol)
      demoUser.setEmail('interagente.demo@cer.app')
      demoUser.setPassword('Skip@Pass')
      demoUser.setVerified(true)
      demoUser.set('name', 'Interagente Demo')
      app.save(demoUser)
    }

    let demoPerson
    try {
      demoPerson = app.findFirstRecordByData('persons', 'email', 'interagente.demo@cer.app')
    } catch (_) {
      demoPerson = new Record(personsCol)
      demoPerson.set('full_name', 'Interagente Demo')
      demoPerson.set('preferred_name', 'Demo')
      demoPerson.set('email', 'interagente.demo@cer.app')
      demoPerson.set('notes', 'Interagente sintético para validação de desenvolvimento.')
      app.save(demoPerson)
    }

    // Vincular person_id no usuário demo
    if (demoUser.get('person_id') !== demoPerson.id) {
      demoUser.set('person_id', demoPerson.id)
      app.save(demoUser)
    }

    // Atribuir papel 'interagente' em user_roles
    try {
      app.findFirstRecordByData('user_roles', 'user_id', demoUser.id)
    } catch (_) {
      const demoRole = new Record(userRolesCol)
      demoRole.set('user_id', demoUser.id)
      demoRole.set('role', 'interagente')
      demoRole.set('is_active', true)
      app.save(demoRole)
    }

    // 4. Migrar enrollment prévio ou criar novo enrollment com a nova arquitetura
    let demoEnrollment
    try {
      demoEnrollment = app.findFirstRecordByData('enrollments', 'interagente', demoUser.id)
    } catch (_) {
      // Tenta achar por person_id
      try {
        demoEnrollment = app.findFirstRecordByData('enrollments', 'person_id', demoPerson.id)
      } catch (_) {
        demoEnrollment = new Record(enrollmentsCol)
      }
    }

    demoEnrollment.set('person_id', demoPerson.id)
    demoEnrollment.set('interagente', demoUser.id)
    demoEnrollment.set('profissional', profUser.id)
    demoEnrollment.set('product_id', productAcomp.id)
    demoEnrollment.set('product', 'acompanhamento_individual_cer')
    demoEnrollment.set('status', 'ativa')
    demoEnrollment.set('notes', 'Acompanhamento inicial individual de desenvolvimento integral.')
    app.save(demoEnrollment)

    // 5. Vincular acesso profissional explícito (PROFESSIONAL_ENROLLMENT_ACCESS)
    try {
      app.findFirstRecordByData(
        'professional_enrollment_access',
        'enrollment_id',
        demoEnrollment.id,
      )
    } catch (_) {
      const accessRec = new Record(profAccessCol)
      accessRec.set('enrollment_id', demoEnrollment.id)
      accessRec.set('professional_user_id', profUser.id)
      accessRec.set('access_role', 'primary')
      accessRec.set('is_active', true)
      app.save(accessRec)
    }

    // 6. Criar estado inicial da jornada (JOURNEY_STATE) para o enrollment
    try {
      app.findFirstRecordByData('journey_states', 'enrollment_id', demoEnrollment.id)
    } catch (_) {
      const stateRec = new Record(journeyStatesCol)
      stateRec.set('enrollment_id', demoEnrollment.id)
      stateRec.set('current_stage', 'acolhimento')
      stateRec.set('stage_status', 'em_andamento')
      stateRec.set(
        'metadata',
        JSON.stringify({
          initialized_at: new Date().toISOString(),
          notes: 'Fase inicial de acolhimento e escuta ativa.',
        }),
      )
      app.save(stateRec)
    }
  },
  (app) => {
    // Reversão de sementes específicas se necessário
  },
)
