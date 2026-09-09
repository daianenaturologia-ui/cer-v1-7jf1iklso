migrate(
  (app) => {
    // 1. Limpar e configurar cenário para os testes A a J, Progressive Release e Audit Events
    const beatrizUser = app.findFirstRecordByData('users', 'email', 'beatriz.teste@cer.app')
    const beatrizEnrollment = app.findRecordsByFilter(
      'enrollments',
      'notes ~ "Beatriz"',
      '',
      1,
      0,
    )[0]
    const anaUser = app.findFirstRecordByData('users', 'email', 'ana.teste@cer.app')
    const anaEnrollment = app.findRecordsByFilter('enrollments', 'notes ~ "Ana"', '', 1, 0)[0]
    const profAUser = app.findFirstRecordByData('users', 'email', 'profissional.a@cer.app')
    const adminUser = app.findFirstRecordByData('users', 'email', 'admin.cer@cer.app')
    const pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
    const prompts = app.findRecordsByFilter(
      'cer_prompts',
      `experience_id = "${pilotExp.id}"`,
      'step_order',
      10,
      0,
    )

    const respCol = app.findCollectionByNameOrId('experience_responses')
    const auditCol = app.findCollectionByNameOrId('audit_events')
    const enrExpCol = app.findCollectionByNameOrId('enrollment_experiences')

    // 2. Criar resposta de Beatriz com shared_care (Prompt 2: BodyMap)
    let bResp
    try {
      bResp = app.findRecordsByFilter(
        'experience_responses',
        `enrollment_id = "${beatrizEnrollment.id}" && prompt_id = "${prompts[1].id}"`,
        '',
        1,
        0,
      )[0]
    } catch (_) {}

    if (!bResp) {
      bResp = new Record(respCol)
      bResp.set('enrollment_id', beatrizEnrollment.id)
      bResp.set('experience_id', pilotExp.id)
      bResp.set('prompt_id', prompts[1].id)
      bResp.set('respondent_user_id', beatrizUser.id)
      bResp.set('response_type', prompts[1].getString('component_type'))
      bResp.set('access_class', 'shared_care')
      bResp.set('prompt_version', prompts[1].getInt('version') || 1)
      bResp.set('version', 1)
      bResp.set('status', 'saved')
      bResp.set('structured_value', ['head', 'neck_shoulders'])
      bResp.set('free_text', 'Sensação na cabeça e ombros')
      app.save(bResp)
    }

    // 3. Criar resposta de Ana com participant_private (Prompt 8: FreeReflection)
    let anaPrivateResp
    try {
      anaPrivateResp = app.findRecordsByFilter(
        'experience_responses',
        `enrollment_id = "${anaEnrollment.id}" && prompt_id = "${prompts[7].id}"`,
        '',
        1,
        0,
      )[0]
    } catch (_) {}

    if (!anaPrivateResp) {
      anaPrivateResp = new Record(respCol)
      anaPrivateResp.set('enrollment_id', anaEnrollment.id)
      anaPrivateResp.set('experience_id', pilotExp.id)
      anaPrivateResp.set('prompt_id', prompts[7].id)
      anaPrivateResp.set('respondent_user_id', anaUser.id)
      anaPrivateResp.set('response_type', prompts[7].getString('component_type'))
      anaPrivateResp.set('access_class', 'participant_private')
      anaPrivateResp.set('prompt_version', prompts[7].getInt('version') || 1)
      anaPrivateResp.set('version', 1)
      anaPrivateResp.set('status', 'saved')
      anaPrivateResp.set('structured_value', 'reflexao_intima_confidencial_ana')
      anaPrivateResp.set('free_text', 'Reflexão privada e íntima de Ana')
      app.save(anaPrivateResp)
    }

    // 4. Exercitar Progressive Release no enrollment_experiences de Ana:
    // locked -> available -> in_progress -> paused -> available -> completed -> reopened
    let enrExpAna
    try {
      enrExpAna = app.findRecordsByFilter(
        'enrollment_experiences',
        `enrollment_id = "${anaEnrollment.id}" && experience_id = "${pilotExp.id}"`,
        '',
        1,
        0,
      )[0]
    } catch (_) {}

    if (!enrExpAna) {
      enrExpAna = new Record(enrExpCol)
      enrExpAna.set('enrollment_id', anaEnrollment.id)
      enrExpAna.set('experience_id', pilotExp.id)
      enrExpAna.set('release_status', 'locked')
      enrExpAna.set('progress_status', 'not_started')
      enrExpAna.set('released_by_user_id', profAUser.id)
      app.save(enrExpAna)
    }

    // 4.1 available
    enrExpAna.set('release_status', 'available')
    app.save(enrExpAna)

    // 4.2 in_progress (start)
    enrExpAna.set('release_status', 'in_progress')
    enrExpAna.set('progress_status', 'in_progress')
    enrExpAna.set('current_step_order', 1)
    enrExpAna.set('started_at', new Date().toISOString())
    app.save(enrExpAna)

    // 4.3 paused
    enrExpAna.set('release_status', 'paused')
    app.save(enrExpAna)

    // 4.4 reopened from pause -> available
    enrExpAna.set('release_status', 'available')
    app.save(enrExpAna)

    // 4.5 completed
    enrExpAna.set('release_status', 'completed')
    enrExpAna.set('progress_status', 'completed')
    enrExpAna.set('completed_at', new Date().toISOString())
    app.save(enrExpAna)

    // 4.6 reopened from completed -> available + in_progress com step 1 coerente
    enrExpAna.set('release_status', 'available')
    enrExpAna.set('progress_status', 'in_progress')
    enrExpAna.set('current_step_order', 1)
    app.save(enrExpAna)

    // 5. Garantir que os eventos de auditoria do ciclo de vida existam e sem conteúdo confidencial
    // (O hook on_experience_lifecycle roda no app.save de enrollment_experiences gerando os eventos)
  },
  (app) => {},
)
