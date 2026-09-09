migrate(
  (app) => {
    // 1. Limpar respostas e versões sintéticas do teste anterior
    try {
      const allResp = app.findRecordsByFilter('experience_responses', '', '', 100, 0)
      for (const r of allResp) app.delete(r)
      const allVers = app.findRecordsByFilter('experience_response_versions', '', '', 100, 0)
      for (const v of allVers) app.delete(v)
    } catch (_) {}

    // 2. Realizar teste limpo e explícito A -> B -> C
    const anaUser = app.findFirstRecordByData('users', 'email', 'ana.teste@cer.app')
    const anaEnrollment = app.findRecordsByFilter('enrollments', 'notes ~ "Ana"', '', 1, 0)[0]
    const pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
    const promptTest = app.findRecordsByFilter(
      'cer_prompts',
      `experience_id = "${pilotExp.id}"`,
      'step_order',
      1,
      0,
    )[0]

    // Criar A
    const respCol = app.findCollectionByNameOrId('experience_responses')
    const rec = new Record(respCol)
    rec.set('enrollment_id', anaEnrollment.id)
    rec.set('experience_id', pilotExp.id)
    rec.set('prompt_id', promptTest.id)
    rec.set('respondent_user_id', anaUser.id)
    rec.set('response_type', promptTest.getString('component_type'))
    rec.set('access_class', 'shared_care')
    rec.set('prompt_version', promptTest.getInt('version') || 1)
    rec.set('version', 1)
    rec.set('status', 'saved')
    rec.set('structured_value', 'resposta_A_calma_presente')
    rec.set('free_text', 'Texto de reflexao A')
    app.save(rec)

    // Atualizar para B (recuperando record do banco)
    const recB = app.findFirstRecordByData('experience_responses', 'id', rec.id)
    recB.set('structured_value', 'resposta_B_mente_acelerada')
    recB.set('free_text', 'Texto de reflexao B')
    app.save(recB)

    // Atualizar para C
    const recC = app.findFirstRecordByData('experience_responses', 'id', rec.id)
    recC.set('structured_value', 'resposta_C_corpo_cansado')
    recC.set('free_text', 'Texto de reflexao C')
    app.save(recC)
  },
  (app) => {},
)
