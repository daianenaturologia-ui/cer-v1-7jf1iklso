migrate(
  (app) => {
    const experiencesCol = app.findCollectionByNameOrId('cer_experiences')
    const momentsCol = app.findCollectionByNameOrId('cer_experience_moments')
    const promptsCol = app.findCollectionByNameOrId('cer_prompts')
    const rulesCol = app.findCollectionByNameOrId('cer_prompt_signal_rules')
    const frameworksCol = app.findCollectionByNameOrId('cer_frameworks')
    const dimensionsCol = app.findCollectionByNameOrId('cer_dimensions')

    // 1. Obter a dimensão mente_emocoes
    let menteDim = null
    try {
      menteDim = app.findFirstRecordByData('cer_dimensions', 'code', 'mente_emocoes')
    } catch (_) {
      menteDim = app.findFirstRecordByData('cer_dimensions', 'order_index', 2)
    }

    // Obter framework CER_INTEGRATIVE_MODEL
    const cerFramework = app.findFirstRecordByData(
      'cer_frameworks',
      'framework_key',
      'CER_INTEGRATIVE_MODEL',
    )

    // 2. Localizar a experiência piloto conhecendo_meu_momento
    const pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')

    // 3. Localizar ou criar um momento apropriado para foco e execução
    let focusMoment = null
    try {
      focusMoment = app.findFirstRecordByData(
        'cer_experience_moments',
        'moment_key',
        'iniciacao_tarefas',
      )
    } catch (_) {
      const mRec = new Record(momentsCol)
      mRec.set('experience_id', pilotExp.id)
      mRec.set('moment_key', 'iniciacao_tarefas')
      mRec.set('title', 'Iniciação de Ações e Tarefas')
      mRec.set('subtitle', 'Como você lida com o começo de atividades desafiadoras ou cotidianas')
      mRec.set('order_index', 9)
      mRec.set('is_active', true)
      mRec.set('version', 1)
      app.save(mRec)
      focusMoment = mRec
    }

    // 4. Criar ou buscar o Prompt estruturado para task_initiation
    // component_type: ChoiceCards
    let promptRec = null
    const promptCode = 'prompt_task_initiation_03a'
    try {
      const existing = app.findRecordsByFilter(
        'cer_prompts',
        'step_title = "Iniciação de Tarefas" && experience_id = "' + pilotExp.id + '"',
        '',
        1,
        0,
      )
      if (existing && existing.length > 0) {
        promptRec = existing[0]
      }
    } catch (_) {}

    if (!promptRec) {
      const p = new Record(promptsCol)
      p.set('experience_id', pilotExp.id)
      p.set('moment_id', focusMoment.id)
      p.set('step_order', 10)
      p.set('prompt_order', 1)
      p.set('step_title', 'Iniciação de Tarefas')
      p.set(
        'step_subtitle',
        'Identifique como costuma ser seu impulso inicial frente a novas tarefas',
      )
      p.set('component_type', 'ChoiceCards')
      p.set(
        'prompt_text',
        'Como costuma ser o seu impulso para iniciar tarefas grandes ou complexas?',
      )
      p.set('helper_text', 'Selecione a afirmação que melhor descreve seu padrão habitual')
      p.set(
        'schema_config',
        JSON.stringify({
          options: [
            {
              id: 'dificuldade_comecar',
              title: 'Dificuldade para começar tarefas grandes',
              description: 'Tendo a adiar o início mesmo sabendo da importância.',
            },
            {
              id: 'comeco_rapido_entusiasmo',
              title: 'Quando algo me entusiasma, começo rapidamente',
              description: 'O entusiasmo inicial me impulsiona de forma fluida.',
            },
            {
              id: 'contexto_pressao_prazo',
              title: 'Meu início depende do contexto de prazo e pressão externa',
              description: 'A proximidade do prazo é o fator determinante para começar.',
            },
          ],
        }),
      )
      p.set('is_required', true)
      p.set('version', 1)
      app.save(p)
      promptRec = p
    }

    // 5. Seeds determinísticas de cer_prompt_signal_rules para o conceito task_initiation
    // Rule A: dificuldade_comecar -> challenge / task_initiation / current
    // Rule B: comeco_rapido_entusiasmo -> resource / task_initiation / current
    // Rule C: contexto_pressao_prazo -> context / task_initiation / context_dependent
    const seedRule = (responseMatch, signalType, conceptKey, temporalityDefault, fwId) => {
      try {
        const existing = app.findRecordsByFilter(
          'cer_prompt_signal_rules',
          'prompt_id = "' + promptRec.id + '" && response_match = "' + responseMatch + '"',
          '',
          1,
          0,
        )
        if (existing && existing.length > 0) return
      } catch (_) {}

      const r = new Record(rulesCol)
      r.set('prompt_id', promptRec.id)
      r.set('prompt_version', 1)
      r.set('response_match', responseMatch)
      r.set('signal_type', signalType)
      r.set('concept_key', conceptKey)
      if (menteDim) {
        r.set('dimension_id', menteDim.id)
      }
      r.set('temporality_default', temporalityDefault)
      if (fwId) {
        r.set('framework_id', fwId)
      }
      r.set('is_active', true)
      app.save(r)
    }

    // A: challenge / task_initiation
    seedRule(
      'dificuldade_comecar',
      'challenge',
      'task_initiation',
      'current',
      cerFramework ? cerFramework.id : null,
    )

    // B: resource / task_initiation
    seedRule(
      'comeco_rapido_entusiasmo',
      'resource',
      'task_initiation',
      'current',
      cerFramework ? cerFramework.id : null,
    )

    // C: context / task_initiation
    seedRule(
      'contexto_pressao_prazo',
      'context',
      'task_initiation',
      'context_dependent',
      cerFramework ? cerFramework.id : null,
    )
  },
  (app) => {
    // Reverter seeds de teste se necessário
    try {
      app
        .db()
        .newQuery("DELETE FROM cer_prompt_signal_rules WHERE concept_key = 'task_initiation'")
        .execute()
    } catch (_) {}
  },
)
