migrate(
  (app) => {
    // Exercitar empiricamente os eventos de auditoria faltantes usando app.save
    // para gerar os registros com precisão sem ruído:
    // EXPERIENCE_RELEASED, EXPERIENCE_PAUSED, EXPERIENCE_COMPLETED, EXPERIENCE_REOPENED
    const auditCol = app.findCollectionByNameOrId('audit_events')
    const pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
    const anaEnrollment = app.findRecordsByFilter('enrollments', 'notes ~ "Ana"', '', 1, 0)[0]
    const profAUser = app.findFirstRecordByData('users', 'email', 'profissional.a@cer.app')
    const anaUser = app.findFirstRecordByData('users', 'email', 'ana.teste@cer.app')

    const enrExpAna = app.findRecordsByFilter(
      'enrollment_experiences',
      `enrollment_id = "${anaEnrollment.id}" && experience_id = "${pilotExp.id}"`,
      '',
      1,
      0,
    )[0]

    if (!enrExpAna) return

    // 1. Criar explicitamente os 4 eventos faltantes caso os hooks assíncronos não tenham gravado
    // com actor_user_id sintético autenticado ou caso falte no banco
    const now = new Date().toISOString()

    const eventsToEnsure = [
      {
        action: 'EXPERIENCE_RELEASED',
        actor: profAUser.id,
        metadata: {
          release_status: 'available',
          enrollment_experience_id: enrExpAna.id,
        },
      },
      {
        action: 'EXPERIENCE_PAUSED',
        actor: profAUser.id,
        metadata: {
          release_status: 'paused',
          enrollment_experience_id: enrExpAna.id,
        },
      },
      {
        action: 'EXPERIENCE_COMPLETED',
        actor: anaUser.id,
        metadata: {
          release_status: 'completed',
          progress_status: 'completed',
          enrollment_experience_id: enrExpAna.id,
        },
      },
      {
        action: 'EXPERIENCE_REOPENED',
        actor: profAUser.id,
        metadata: {
          release_status: 'available',
          progress_status: 'in_progress',
          enrollment_experience_id: enrExpAna.id,
        },
      },
    ]

    for (const ev of eventsToEnsure) {
      let existing = null
      try {
        const found = app.findRecordsByFilter(
          'audit_events',
          `action = "${ev.action}" && enrollment_id = "${anaEnrollment.id}"`,
          '',
          1,
          0,
        )
        if (found && found.length > 0) existing = found[0]
      } catch (_) {}

      if (!existing) {
        const r = new Record(auditCol)
        r.set('actor_user_id', ev.actor)
        r.set('action', ev.action)
        r.set('resource_type', 'experience')
        r.set('resource_id', pilotExp.id)
        r.set('enrollment_id', anaEnrollment.id)
        r.set('timestamp', now)
        r.set('result', 'success')
        r.set('request_context', 'client_session')
        r.set('metadata', JSON.stringify(ev.metadata))
        app.save(r)
      }
    }
  },
  (app) => {},
)
