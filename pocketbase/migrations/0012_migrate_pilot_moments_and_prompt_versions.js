migrate(
  (app) => {
    const experiencesCol = app.findCollectionByNameOrId('cer_experiences')
    const momentsCol = app.findCollectionByNameOrId('cer_experience_moments')
    const promptsCol = app.findCollectionByNameOrId('cer_prompts')
    const promptVersionsCol = app.findCollectionByNameOrId('cer_prompt_versions')

    let pilotExp
    try {
      pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
    } catch (_) {
      return
    }

    // Os 8 momentos correspondentes aos prompts existentes
    const momentsData = [
      {
        moment_key: 'como_chego_hoje',
        title: 'Como chego hoje',
        subtitle: 'Escolha a sensação que melhor descreve seu ponto de partida neste instante.',
        order_index: 1,
      },
      {
        moment_key: 'como_percebo_corpo',
        title: 'Como percebo meu corpo',
        subtitle: 'Mapeie as regiões onde sua percepção física está mais evidente hoje.',
        order_index: 2,
      },
      {
        moment_key: 'meu_ritmo',
        title: 'Meu ritmo',
        subtitle: 'Um olhar honesto sobre a velocidade com que seus dias têm transcorrido.',
        order_index: 3,
      },
      {
        moment_key: 'ocupando_espaco',
        title: 'O que tem ocupado espaço',
        subtitle: 'Hierarquize os temas que mais têm demandado sua energia ultimamente.',
        order_index: 4,
      },
      {
        moment_key: 'focos_atencao',
        title: 'Focos de atenção',
        subtitle: 'Identifique os pilares práticos que você gostaria de observar mais de perto.',
        order_index: 5,
      },
      {
        moment_key: 'situacao_cotidiana',
        title: 'Uma situação cotidiana',
        subtitle: 'Observando padrões de resposta espontâneos frente a um pequeno imprevisto.',
        order_index: 6,
      },
      {
        moment_key: 'marcas_no_tempo',
        title: 'Marcas no tempo',
        subtitle: 'Situando marcos temporais que influenciaram seu estado atual.',
        order_index: 7,
      },
      {
        moment_key: 'algo_que_quero_registrar',
        title: 'Algo que quero registrar',
        subtitle: 'Um espaço aberto para sua palavra autêntica, sem julgamento ou formatação.',
        order_index: 8,
      },
    ]

    const momentRecords = {}
    for (const m of momentsData) {
      let rec
      try {
        rec = app.findFirstRecordByData('cer_experience_moments', 'moment_key', m.moment_key)
      } catch (_) {
        rec = new Record(momentsCol)
        rec.set('experience_id', pilotExp.id)
        rec.set('moment_key', m.moment_key)
        rec.set('title', m.title)
        rec.set('subtitle', m.subtitle)
        rec.set('order_index', m.order_index)
        rec.set('is_active', true)
        rec.set('version', 1)
        app.save(rec)
      }
      momentRecords[m.order_index] = rec
    }

    // Vincular cada prompt existente ao seu respectivo moment_id e prompt_order
    const existingPrompts = app.findRecordsByFilter(
      'cer_prompts',
      `experience_id = "${pilotExp.id}"`,
      'step_order',
      50,
      0,
    )

    for (const promptRec of existingPrompts) {
      const stepOrder = promptRec.get('step_order')
      const targetMoment = momentRecords[stepOrder]
      if (targetMoment) {
        promptRec.set('moment_id', targetMoment.id)
        promptRec.set('prompt_order', 1) // 1 único prompt inicial por momento
        app.save(promptRec)

        // Criar registro de snapshot de versão em cer_prompt_versions se não existir
        try {
          app.findFirstRecordByData('cer_prompt_versions', 'prompt_id', promptRec.id)
        } catch (_) {
          const pvRec = new Record(promptVersionsCol)
          pvRec.set('prompt_id', promptRec.id)
          pvRec.set('moment_id', targetMoment.id)
          pvRec.set('version_number', promptRec.get('version') || 1)
          pvRec.set('prompt_type', promptRec.getString('component_type'))
          pvRec.set('prompt_text', promptRec.getString('prompt_text'))
          pvRec.set('helper_text', promptRec.getString('helper_text'))
          pvRec.set('schema_config', promptRec.get('schema_config'))
          pvRec.set('is_required', promptRec.get('is_required'))
          pvRec.set('change_reason', 'Carga inicial do catálogo do piloto (Build 02)')
          app.save(pvRec)
        }
      }
    }
  },
  (app) => {},
)
