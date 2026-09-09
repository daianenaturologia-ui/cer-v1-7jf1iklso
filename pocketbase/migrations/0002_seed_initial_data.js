migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const profilesCol = app.findCollectionByNameOrId('profiles')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')

    // 1. Criar ou obter usuário profissional (Daiane)
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

    // 1.1 Perfil profissional
    try {
      app.findFirstRecordByData('profiles', 'user', profUser.id)
    } catch (_) {
      const profProfile = new Record(profilesCol)
      profProfile.set('user', profUser.id)
      profProfile.set('profile_type', 'profissional')
      profProfile.set('full_name', 'Daiane')
      app.save(profProfile)
    }

    // 2. Criar ou obter usuário demo interagente (dado sintético)
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

    // 2.1 Perfil interagente
    try {
      app.findFirstRecordByData('profiles', 'user', demoUser.id)
    } catch (_) {
      const demoProfile = new Record(profilesCol)
      demoProfile.set('user', demoUser.id)
      demoProfile.set('profile_type', 'interagente')
      demoProfile.set('full_name', 'Interagente Demo')
      app.save(demoProfile)
    }

    // 3. Criar enrollment inicial sintético vinculando o interagente demo à profissional
    try {
      app.findFirstRecordByData('enrollments', 'interagente', demoUser.id)
    } catch (_) {
      const demoEnrollment = new Record(enrollmentsCol)
      demoEnrollment.set('interagente', demoUser.id)
      demoEnrollment.set('profissional', profUser.id)
      demoEnrollment.set('product', 'acompanhamento_individual_cer')
      demoEnrollment.set('status', 'pendente')
      app.save(demoEnrollment)
    }
  },
  (app) => {
    // Rollback seeds (opcional / limpo)
    try {
      const demoUser = app.findAuthRecordByEmail('_pb_users_auth_', 'interagente.demo@cer.app')
      app.delete(demoUser)
    } catch (_) {}

    try {
      const profUser = app.findAuthRecordByEmail('_pb_users_auth_', 'daiane.naturologia@gmail.com')
      app.delete(profUser)
    } catch (_) {}
  },
)
