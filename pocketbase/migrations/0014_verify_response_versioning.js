migrate(
  (app) => {
    // Busca usuário Ana e produto/experiência piloto
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const expCol = app.findCollectionByNameOrId('cer_experiences')
    const promptsCol = app.findCollectionByNameOrId('cer_prompts')
    const respCol = app.findCollectionByNameOrId('experience_responses')
    const respVersCol = app.findCollectionByNameOrId('experience_response_versions')

    let anaUser, anaEnrollment, pilotExp, promptTest
    try {
      anaUser = app.findFirstRecordByData('users', 'email', 'ana.teste@cer.app')
      anaEnrollment = app.findFirstRecordByData('enrollments', 'notes', 'Enrollment piloto - Ana')
    } catch (_) {
      try {
        anaEnrollment = app.findRecordsByFilter('enrollments', 'notes ~ "Ana"', '', 1, 0)[0]
      } catch (_) {}
    }

    try {
      pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
      promptTest = app.findRecordsByFilter(
        'cer_prompts',
        `experience_id = "${pilotExp.id}"`,
        'step_order',
        1,
        0,
      )[0]
    } catch (_) {}

    if (!anaUser || !anaEnrollment || !pilotExp || !promptTest) return

    // Limpar se já existir resposta de teste do prompt 1
    try {
      const existing = app.findRecordsByFilter(
        'experience_responses',
        `enrollment_id = "${anaEnrollment.id}" && prompt_id = "${promptTest.id}"`,
        '',
        10,
        0,
      )
      for (const ex of existing) {
        // limpar versoes
        const vers = app.findRecordsByFilter(
          'experience_response_versions',
          `response_id = "${ex.id}"`,
          '',
          50,
          0,
        )
        for (const v of vers) app.delete(v)
        app.delete(ex)
      }
    } catch (_) {}

    // Passo 1: Criar resposta A
    const respRecord = new Record(respCol)
    respRecord.set('enrollment_id', anaEnrollment.id)
    respRecord.set('experience_id', pilotExp.id)
    respRecord.set('prompt_id', promptTest.id)
    respRecord.set('respondent_user_id', anaUser.id)
    respRecord.set('response_type', promptTest.getString('component_type'))
    respRecord.set('access_class', 'shared_care')
    respRecord.set('prompt_version', promptTest.getInt('version') || 1)
    respRecord.set('version', 1)
    respRecord.set('status', 'saved')
    respRecord.set('structured_value', 'estado_sintetico_A')
    respRecord.set('free_text', 'Texto de resposta sintética A')
    app.save(respRecord)

    // Passo 2: Atualizar para B
    respRecord.set('structured_value', 'estado_sintetico_B')
    respRecord.set('free_text', 'Texto de resposta sintética B')
    app.save(respRecord)

    // Passo 3: Atualizar para C
    respRecord.set('structured_value', 'estado_sintetico_C')
    respRecord.set('free_text', 'Texto de resposta sintética C')
    app.save(respRecord)
  },
  (app) => {},
)
