migrate(
  (app) => {
    // Exercitar criação de Signal sintético de teste A
    const anaUser = app.findFirstRecordByData('users', 'email', 'ana.teste@cer.app')
    const anaPerson = app.findFirstRecordByData('persons', 'email', 'ana.teste@cer.app')
    const anaEnrollment = app.findFirstRecordByData('enrollments', 'person_id', anaPerson.id)
    const pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
    const taskPrompt = app.findFirstRecordByData(
      'cer_prompts',
      'step_title',
      'Iniciação de Tarefas',
    )
    const cerFramework = app.findFirstRecordByData(
      'cer_frameworks',
      'framework_key',
      'CER_INTEGRATIVE_MODEL',
    )
    const menteDim = app.findFirstRecordByData('cer_dimensions', 'code', 'mente_emocoes')

    const responsesCol = app.findCollectionByNameOrId('experience_responses')
    const signalsCol = app.findCollectionByNameOrId('cer_signals')
    const auditCol = app.findCollectionByNameOrId('audit_events')

    // 1. Criar resposta sintética estruturada
    let resp = null
    try {
      resp = app.findFirstRecordByData(
        'experience_responses',
        'free_text',
        'Registro sintético exercitado 03A',
      )
    } catch (_) {
      resp = new Record(responsesCol)
      resp.set('enrollment_id', anaEnrollment.id)
      resp.set('experience_id', pilotExp.id)
      resp.set('prompt_id', taskPrompt.id)
      resp.set('respondent_user_id', anaUser.id)
      resp.set('response_type', 'ChoiceCards')
      resp.set('structured_value', 'dificuldade_comecar')
      resp.set('free_text', 'Registro sintético exercitado 03A')
      resp.set('prompt_version', 1)
      resp.set('version', 1)
      resp.set('status', 'saved')
      resp.set('access_class', 'shared_care')
      app.save(resp)
    }

    // 2. Criar Signal correspondente exercitado
    let sig = null
    try {
      sig = app.findFirstRecordByData('cer_signals', 'source_response_id', resp.id)
    } catch (_) {
      sig = new Record(signalsCol)
      sig.set('enrollment_id', anaEnrollment.id)
      sig.set('signal_type', 'challenge')
      sig.set('concept_key', 'task_initiation')
      sig.set('dimension_id', menteDim.id)
      sig.set('temporality', 'current')
      sig.set('source_type', 'participant_report')
      sig.set('source_response_id', resp.id)
      sig.set('source_prompt_id', taskPrompt.id)
      sig.set('source_experience_id', pilotExp.id)
      sig.set('framework_id', cerFramework.id)
      sig.set('created_by_user_id', anaUser.id)
      sig.set('access_class', 'shared_care')
      sig.set('status', 'active')
      app.save(sig)

      // Criar evento de auditoria real SIGNAL_CREATED
      const audit = new Record(auditCol)
      audit.set('actor_user_id', anaUser.id)
      audit.set('action', 'SIGNAL_CREATED')
      audit.set('resource_type', 'cer_signals')
      audit.set('resource_id', sig.id)
      audit.set('enrollment_id', anaEnrollment.id)
      audit.set('timestamp', new Date().toISOString())
      audit.set('result', 'success')
      audit.set('request_context', 'server_signal_derivation')
      audit.set(
        'metadata',
        JSON.stringify({
          signal_id: sig.id,
          concept_key: 'task_initiation',
          signal_type: 'challenge',
          source_type: 'participant_report',
          source_response_id: resp.id,
          access_class: 'shared_care',
        }),
      )
      app.save(audit)
    }
  },
  (app) => {
    try {
      app.db().newQuery("DELETE FROM cer_signals WHERE concept_key = 'task_initiation'").execute()
      app.db().newQuery("DELETE FROM audit_events WHERE action = 'SIGNAL_CREATED'").execute()
    } catch (_) {}
  },
)
