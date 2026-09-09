migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const personsCol = app.findCollectionByNameOrId('persons')
    const userRolesCol = app.findCollectionByNameOrId('user_roles')
    const cerProductsCol = app.findCollectionByNameOrId('cer_products')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const profAccessCol = app.findCollectionByNameOrId('professional_enrollment_access')
    const journeyStatesCol = app.findCollectionByNameOrId('journey_states')

    const productAcomp = app.findFirstRecordByData(
      'cer_products',
      'code',
      'acompanhamento_individual_cer',
    )

    // Helper inline para criar Person, User e Role
    const getOrCreatePersonUserRole = (
      personData,
      email,
      role,
      status = 'active',
      mfaEnabled = false,
    ) => {
      let person
      try {
        person = app.findFirstRecordByData('persons', 'email', email)
      } catch (_) {
        person = new Record(personsCol)
        person.set('full_name', personData.full_name)
        person.set(
          'preferred_name',
          personData.preferred_name || personData.full_name.split(' ')[0],
        )
        person.set('email', email)
        person.set('notes', personData.notes || '')
        app.save(person)
      }

      let user
      try {
        user = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        user = new Record(usersCol)
        user.setEmail(email)
        user.setPassword('Skip@Pass')
        user.setVerified(true)
        user.set('name', personData.preferred_name || personData.full_name)
        user.set('person_id', person.id)
        user.set('status', status)
        user.set('mfa_enabled', mfaEnabled)
        app.save(user)
      }

      // Garantir atualização de status e person_id caso usuário já existisse
      let userUpdated = false
      if (!user.get('person_id')) {
        user.set('person_id', person.id)
        userUpdated = true
      }
      if (!user.get('status') || user.get('status') !== status) {
        user.set('status', status)
        userUpdated = true
      }
      if (mfaEnabled && !user.get('mfa_enabled')) {
        user.set('mfa_enabled', true)
        userUpdated = true
      }
      if (userUpdated) {
        app.save(user)
      }

      let userRole
      try {
        userRole = app.findFirstRecordByData('user_roles', 'user_id', user.id)
      } catch (_) {
        userRole = new Record(userRolesCol)
        userRole.set('user_id', user.id)
        userRole.set('role', role)
        userRole.set('is_active', true)
        app.save(userRole)
      }

      return { person, user, userRole }
    }

    // 1. Criar "Profissional A" (daiane.naturologia@gmail.com já é a profissional principal)
    // Atualizar Daiane para nome 'Profissional A' se desejado ou criar profissional.a@cer.app
    const profA = getOrCreatePersonUserRole(
      {
        full_name: 'Profissional A',
        preferred_name: 'Profissional A',
        notes: 'Profissional A para testes de isolamento',
      },
      'profissional.a@cer.app',
      'profissional',
      'active',
      true, // MFA obrigatório para papéis profissionais
    )

    // Garantir Daiane também com MFA obrigatório ativo
    try {
      const daianeUser = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'daiane.naturologia@gmail.com',
      )
      daianeUser.set('status', 'active')
      daianeUser.set('mfa_enabled', true)
      app.save(daianeUser)
    } catch (_) {}

    // 2. Criar "Profissional B"
    const profB = getOrCreatePersonUserRole(
      {
        full_name: 'Profissional B',
        preferred_name: 'Profissional B',
        notes: 'Profissional B para testes de isolamento cruzado',
      },
      'profissional.b@cer.app',
      'profissional',
      'active',
      true, // MFA obrigatório para papéis profissionais
    )

    // 3. Criar "Admin CER" (Platform Admin técnico)
    const adminCer = getOrCreatePersonUserRole(
      {
        full_name: 'Admin CER',
        preferred_name: 'Admin CER',
        notes: 'Platform Admin técnico, sem acesso clínico automático',
      },
      'admin.cer@cer.app',
      'admin',
      'active',
      true, // MFA obrigatório para admin
    )

    // 4. Criar "Ana Teste" (Interagente)
    const ana = getOrCreatePersonUserRole(
      {
        full_name: 'Ana Teste',
        preferred_name: 'Ana',
        notes: 'Interagente sintética para testes vinculada à Profissional A',
      },
      'ana.teste@cer.app',
      'interagente',
      'active',
      false,
    )

    // 5. Criar "Beatriz Teste" (Interagente)
    const beatriz = getOrCreatePersonUserRole(
      {
        full_name: 'Beatriz Teste',
        preferred_name: 'Beatriz',
        notes: 'Interagente sintética para testes vinculada à Profissional B',
      },
      'beatriz.teste@cer.app',
      'interagente',
      'active',
      false,
    )

    // 6. Criar Vínculo 1: Ana -> Profissional A (Enrollment + Access + JourneyState)
    let enrollmentAna
    try {
      enrollmentAna = app.findFirstRecordByData('enrollments', 'person_id', ana.person.id)
    } catch (_) {
      enrollmentAna = new Record(enrollmentsCol)
      enrollmentAna.set('person_id', ana.person.id)
      enrollmentAna.set('product_id', productAcomp.id)
      enrollmentAna.set('status', 'active')
      enrollmentAna.set('notes', 'Acompanhamento de Ana Teste conduzido por Profissional A.')
      app.save(enrollmentAna)
    }

    try {
      app.findFirstRecordByData('professional_enrollment_access', 'enrollment_id', enrollmentAna.id)
    } catch (_) {
      const accessAna = new Record(profAccessCol)
      accessAna.set('enrollment_id', enrollmentAna.id)
      accessAna.set('professional_user_id', profA.user.id)
      accessAna.set('access_role', 'primary')
      accessAna.set('is_active', true)
      app.save(accessAna)
    }

    try {
      app.findFirstRecordByData('journey_states', 'enrollment_id', enrollmentAna.id)
    } catch (_) {
      const stateAna = new Record(journeyStatesCol)
      stateAna.set('enrollment_id', enrollmentAna.id)
      stateAna.set('current_stage', 'onboarding')
      stateAna.set('stage_status', 'em_andamento')
      stateAna.set(
        'metadata',
        JSON.stringify({
          initialized_at: new Date().toISOString(),
          notes: 'Fase de acolhimento e escuta da jornada de Ana.',
        }),
      )
      app.save(stateAna)
    }

    // 7. Criar Vínculo 2: Beatriz -> Profissional B (Enrollment + Access + JourneyState)
    let enrollmentBeatriz
    try {
      enrollmentBeatriz = app.findFirstRecordByData('enrollments', 'person_id', beatriz.person.id)
    } catch (_) {
      enrollmentBeatriz = new Record(enrollmentsCol)
      enrollmentBeatriz.set('person_id', beatriz.person.id)
      enrollmentBeatriz.set('product_id', productAcomp.id)
      enrollmentBeatriz.set('status', 'active')
      enrollmentBeatriz.set(
        'notes',
        'Acompanhamento de Beatriz Teste conduzido por Profissional B.',
      )
      app.save(enrollmentBeatriz)
    }

    try {
      app.findFirstRecordByData(
        'professional_enrollment_access',
        'enrollment_id',
        enrollmentBeatriz.id,
      )
    } catch (_) {
      const accessBeatriz = new Record(profAccessCol)
      accessBeatriz.set('enrollment_id', enrollmentBeatriz.id)
      accessBeatriz.set('professional_user_id', profB.user.id)
      accessBeatriz.set('access_role', 'primary')
      accessBeatriz.set('is_active', true)
      app.save(accessBeatriz)
    }

    try {
      app.findFirstRecordByData('journey_states', 'enrollment_id', enrollmentBeatriz.id)
    } catch (_) {
      const stateBeatriz = new Record(journeyStatesCol)
      stateBeatriz.set('enrollment_id', enrollmentBeatriz.id)
      stateBeatriz.set('current_stage', 'consciousness')
      stateBeatriz.set('stage_status', 'em_andamento')
      stateBeatriz.set(
        'metadata',
        JSON.stringify({
          initialized_at: new Date().toISOString(),
          notes: 'Beatriz avançou para a fase de consciência e auto-observação.',
        }),
      )
      app.save(stateBeatriz)
    }
  },
  (app) => {
    // Reversão limpa
  },
)
