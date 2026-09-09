migrate(
  (app) => {
    // 1. Criar um prompt sintético V1
    const expCol = app.findCollectionByNameOrId('cer_experiences')
    const momentsCol = app.findCollectionByNameOrId('cer_experience_moments')
    const promptsCol = app.findCollectionByNameOrId('cer_prompts')

    const pilotExp = app.findFirstRecordByData('cer_experiences', 'code', 'conhecendo_meu_momento')
    const pilotMoment = app.findFirstRecordByData(
      'cer_experience_moments',
      'moment_key',
      'como_chego_hoje',
    )

    const promptRec = new Record(promptsCol)
    promptRec.set('experience_id', pilotExp.id)
    promptRec.set('moment_id', pilotMoment.id)
    promptRec.set('step_order', 99)
    promptRec.set('prompt_order', 99)
    promptRec.set('step_title', 'Prompt Sintético de Teste')
    promptRec.set('step_subtitle', 'Subtítulo V1')
    promptRec.set('component_type', 'ChoiceCards')
    promptRec.set('prompt_text', 'Texto Original V1 do Prompt Sintético')
    promptRec.set('helper_text', 'Instrução V1')
    promptRec.set('schema_config', { options: [{ id: 'opt1', title: 'Opção V1' }] })
    promptRec.set('is_required', true)
    promptRec.set('version', 1)
    app.save(promptRec)

    // 2. Atualizar para V2
    const recV2 = app.findFirstRecordByData('cer_prompts', 'id', promptRec.id)
    recV2.set('prompt_text', 'Texto Modificado V2 do Prompt Sintético')
    recV2.set('helper_text', 'Instrução V2')
    recV2.set('schema_config', {
      options: [
        { id: 'opt1', title: 'Opção V2' },
        { id: 'opt2', title: 'Segunda Opção V2' },
      ],
    })
    app.save(recV2)

    // 3. Atualizar para V3
    const recV3 = app.findFirstRecordByData('cer_prompts', 'id', promptRec.id)
    recV3.set('prompt_text', 'Texto Final V3 do Prompt Sintético')
    recV3.set('helper_text', 'Instrução V3')
    recV3.set('schema_config', { options: [{ id: 'opt_v3', title: 'Opção Definitiva V3' }] })
    app.save(recV3)
  },
  (app) => {},
)
