migrate(
  (app) => {
    // Fixtures sintéticos e idempotentes para o Checkpoint 03B
    // Reutilizando usuário Ana e Signals do 03A

    let anaUser = null
    let anaEnrollment = null
    let pilotExp = null
    let taskPrompt = null
    let menteDim = null
    let cerFramework = null

    try {
      anaUser = app.findFirstRecordByData('_pb_users_auth_', 'email', 'ana.teste@cer.app')
    } catch (_) {
      return
    }

    try {
      const enrollments = app.findRecordsByFilter('enrollments', 'notes ~ "Ana"', '', 1, 0)
      if (enrollments && enrollments.length > 0) {
        anaEnrollment = enrollments[0]
      }
    } catch (_) {
      return
    }

    if (!anaEnrollment) return

    try {
      pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
      taskPrompt = app.findFirstRecordByData('cer_prompts', 'step_title', 'Iniciação de Tarefas')
      menteDim = app.findFirstRecordByData('cer_dimensions', 'code', 'mente_emocoes')
      cerFramework = app.findFirstRecordByData(
        'cer_frameworks',
        'framework_key',
        'CER_INTEGRATIVE_MODEL',
      )
    } catch (_) {}

    const signalsCol = app.findCollectionByNameOrId('cer_signals')
    const associationsCol = app.findCollectionByNameOrId('cer_associations')
    const assocEvCol = app.findCollectionByNameOrId('cer_association_evidence')
    const kiCol = app.findCollectionByNameOrId('cer_knowledge_items')
    const keCol = app.findCollectionByNameOrId('cer_knowledge_evidence')
    const recogCol = app.findCollectionByNameOrId('cer_participant_recognitions')
    const kivCol = app.findCollectionByNameOrId('cer_knowledge_item_versions')

    // 1. Garantir existência de Signal A (challenge/task_initiation)
    let sigA = null
    try {
      const sigs = app.findRecordsByFilter(
        'cer_signals',
        'enrollment_id = "' +
          anaEnrollment.id +
          '" && concept_key = "task_initiation" && signal_type = "challenge"',
        '',
        1,
        0,
      )
      if (sigs && sigs.length > 0) {
        sigA = sigs[0]
      }
    } catch (_) {}

    if (!sigA) {
      sigA = new Record(signalsCol)
      sigA.set('enrollment_id', anaEnrollment.id)
      sigA.set('signal_type', 'challenge')
      sigA.set('concept_key', 'task_initiation')
      if (menteDim) sigA.set('dimension_id', menteDim.id)
      sigA.set('temporality', 'current')
      sigA.set('source_type', 'participant_report')
      if (taskPrompt) sigA.set('source_prompt_id', taskPrompt.id)
      if (pilotExp) sigA.set('source_experience_id', pilotExp.id)
      if (cerFramework) sigA.set('framework_id', cerFramework.id)
      sigA.set('created_by_user_id', anaUser.id)
      sigA.set('access_class', 'shared_care')
      sigA.set('status', 'active')
      app.save(sigA)
    }

    // 2. Garantir existência de Signal B (resource/task_initiation)
    let sigB = null
    try {
      const sigs = app.findRecordsByFilter(
        'cer_signals',
        'enrollment_id = "' +
          anaEnrollment.id +
          '" && concept_key = "task_initiation" && signal_type = "resource"',
        '',
        1,
        0,
      )
      if (sigs && sigs.length > 0) {
        sigB = sigs[0]
      }
    } catch (_) {}

    if (!sigB) {
      sigB = new Record(signalsCol)
      sigB.set('enrollment_id', anaEnrollment.id)
      sigB.set('signal_type', 'resource')
      sigB.set('concept_key', 'task_initiation')
      if (menteDim) sigB.set('dimension_id', menteDim.id)
      sigB.set('temporality', 'current')
      sigB.set('source_type', 'participant_report')
      if (taskPrompt) sigB.set('source_prompt_id', taskPrompt.id)
      if (pilotExp) sigB.set('source_experience_id', pilotExp.id)
      if (cerFramework) sigB.set('framework_id', cerFramework.id)
      sigB.set('created_by_user_id', anaUser.id)
      sigB.set('access_class', 'shared_care')
      sigB.set('status', 'active')
      app.save(sigB)
    }

    // 3. Garantir existência de Signal C (context/task_initiation)
    let sigC = null
    try {
      const sigs = app.findRecordsByFilter(
        'cer_signals',
        'enrollment_id = "' +
          anaEnrollment.id +
          '" && concept_key = "task_initiation" && signal_type = "context"',
        '',
        1,
        0,
      )
      if (sigs && sigs.length > 0) {
        sigC = sigs[0]
      }
    } catch (_) {}

    if (!sigC) {
      sigC = new Record(signalsCol)
      sigC.set('enrollment_id', anaEnrollment.id)
      sigC.set('signal_type', 'context')
      sigC.set('concept_key', 'task_initiation')
      if (menteDim) sigC.set('dimension_id', menteDim.id)
      sigC.set('temporality', 'context_dependent')
      sigC.set('source_type', 'participant_report')
      if (taskPrompt) sigC.set('source_prompt_id', taskPrompt.id)
      if (pilotExp) sigC.set('source_experience_id', pilotExp.id)
      if (cerFramework) sigC.set('framework_id', cerFramework.id)
      sigC.set('created_by_user_id', anaUser.id)
      sigC.set('access_class', 'shared_care')
      sigC.set('status', 'active')
      app.save(sigC)
    }

    // 4. Criar Association mestre: context_dependency para task_initiation
    let masterAssoc = null
    try {
      const assocs = app.findRecordsByFilter(
        'cer_associations',
        'enrollment_id = "' +
          anaEnrollment.id +
          '" && concept_key = "task_initiation" && association_type = "context_dependency"',
        '',
        1,
        0,
      )
      if (assocs && assocs.length > 0) {
        masterAssoc = assocs[0]
      }
    } catch (_) {}

    if (!masterAssoc) {
      masterAssoc = new Record(associationsCol)
      masterAssoc.set('enrollment_id', anaEnrollment.id)
      masterAssoc.set('concept_key', 'task_initiation')
      masterAssoc.set('association_type', 'context_dependency')
      masterAssoc.set('temporality', 'context_dependent')
      masterAssoc.set('status', 'active')
      masterAssoc.set('access_class', 'shared_care')
      masterAssoc.set('created_by_user_id', anaUser.id)
      app.save(masterAssoc)

      // Criar Association Evidence para A, B e C
      const evA = new Record(assocEvCol)
      evA.set('association_id', masterAssoc.id)
      evA.set('signal_id', sigA.id)
      evA.set('relation_type', 'supports')
      evA.set('evidence_group_key', 'grp_task_initiation_self_report')
      app.save(evA)

      const evB = new Record(assocEvCol)
      evB.set('association_id', masterAssoc.id)
      evB.set('signal_id', sigB.id)
      evB.set('relation_type', 'contrasts')
      evB.set('evidence_group_key', 'grp_task_initiation_enthusiasm')
      app.save(evB)

      const evC = new Record(assocEvCol)
      evC.set('association_id', masterAssoc.id)
      evC.set('signal_id', sigC.id)
      evC.set('relation_type', 'contextualizes')
      evC.set('evidence_group_key', 'grp_task_initiation_context')
      app.save(evC)
    }

    // 5. Criar Knowledge Item mestre (com histórico V1 -> V2 -> V3)
    let masterKI = null
    try {
      const kis = app.findRecordsByFilter(
        'cer_knowledge_items',
        'enrollment_id = "' + anaEnrollment.id + '" && concept_key = "task_initiation"',
        '',
        1,
        0,
      )
      if (kis && kis.length > 0) {
        masterKI = kis[0]
      }
    } catch (_) {}

    if (!masterKI) {
      // V1: "A dificuldade para iniciar aparece em diferentes situações."
      masterKI = new Record(kiCol)
      masterKI.set('enrollment_id', anaEnrollment.id)
      masterKI.set('concept_key', 'task_initiation')
      masterKI.set('knowledge_type', 'integrative_hypothesis')
      masterKI.set(
        'statement',
        'A capacidade de iniciar parece variar conforme significado, energia e responsabilidade percebida.',
      )
      masterKI.set('epistemic_source', 'cer_integrative_hypothesis')
      masterKI.set('temporality', 'context_dependent')
      if (menteDim) masterKI.set('primary_dimension_id', menteDim.id)
      if (cerFramework) masterKI.set('framework_id', cerFramework.id)
      masterKI.set('status', 'observing')
      masterKI.set('access_class', 'shared_care')
      masterKI.set('created_by_user_id', anaUser.id)
      masterKI.set('version', 3)
      app.save(masterKI)

      // Evidências do Knowledge Item
      const keAssoc = new Record(keCol)
      keAssoc.set('knowledge_item_id', masterKI.id)
      keAssoc.set('evidence_type', 'association')
      keAssoc.set('evidence_id', masterAssoc.id)
      keAssoc.set('relation_type', 'supports')
      app.save(keAssoc)

      const keSig = new Record(keCol)
      keSig.set('knowledge_item_id', masterKI.id)
      keSig.set('evidence_type', 'signal')
      keSig.set('evidence_id', sigA.id)
      keSig.set('relation_type', 'contextualizes')
      app.save(keSig)

      // Criar snapshots das versões V1 e V2 em cer_knowledge_item_versions
      const v1 = new Record(kivCol)
      v1.set('knowledge_item_id', masterKI.id)
      v1.set('version_number', 1)
      v1.set('statement', 'A dificuldade para iniciar aparece em diferentes situações.')
      v1.set('knowledge_type', 'integrative_hypothesis')
      v1.set('epistemic_source', 'cer_integrative_hypothesis')
      v1.set('temporality', 'current')
      if (menteDim) v1.set('primary_dimension_id', menteDim.id)
      if (cerFramework) v1.set('framework_id', cerFramework.id)
      v1.set('status', 'observing')
      v1.set('access_class', 'shared_care')
      v1.set('changed_by_user_id', anaUser.id)
      v1.set('change_reason', 'Formulação inicial observada a partir dos primeiros relatos.')
      app.save(v1)

      const v2 = new Record(kivCol)
      v2.set('knowledge_item_id', masterKI.id)
      v2.set('version_number', 2)
      v2.set('statement', 'A capacidade de iniciar parece variar conforme significado e energia.')
      v2.set('knowledge_type', 'integrative_hypothesis')
      v2.set('epistemic_source', 'cer_integrative_hypothesis')
      v2.set('temporality', 'context_dependent')
      if (menteDim) v2.set('primary_dimension_id', menteDim.id)
      if (cerFramework) v2.set('framework_id', cerFramework.id)
      v2.set('status', 'observing')
      v2.set('access_class', 'shared_care')
      v2.set('changed_by_user_id', anaUser.id)
      v2.set('change_reason', 'Refinamento após observação de momentos de entusiasmo e interesse.')
      app.save(v2)

      // 6. Criar Participant Recognition mestre
      const recog = new Record(recogCol)
      recog.set('enrollment_id', anaEnrollment.id)
      recog.set('knowledge_item_id', masterKI.id)
      recog.set('participant_user_id', anaUser.id)
      recog.set('recognition_type', 'depends_on_context')
      recog.set('comment', 'Quando alguém depende de mim, começo mesmo cansada.')
      recog.set('access_class', 'shared_care')
      app.save(recog)

      // Registrar como nova evidência relacional
      const keRecog = new Record(keCol)
      keRecog.set('knowledge_item_id', masterKI.id)
      keRecog.set('evidence_type', 'participant_recognition')
      keRecog.set('evidence_id', recog.id)
      keRecog.set('relation_type', 'contextualizes')
      app.save(keRecog)
    }
  },
  () => {
    // Reversão de seed idempotente (opcional)
  },
)
