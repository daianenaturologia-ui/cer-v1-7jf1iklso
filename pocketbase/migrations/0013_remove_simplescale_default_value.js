migrate(
  (app) => {
    // 1. Atualizar o prompt do SimpleScale em cer_prompts removendo defaultValue: 3
    const promptsCol = app.findCollectionByNameOrId('cer_prompts')
    let simpleScalePrompt
    try {
      simpleScalePrompt = app.findFirstRecordByData('cer_prompts', 'component_type', 'SimpleScale')
    } catch (_) {
      return
    }

    const currentConfig = simpleScalePrompt.get('schema_config') || {}
    const updatedConfig = {
      min: currentConfig.min ?? 1,
      max: currentConfig.max ?? 5,
      step: currentConfig.step ?? 1,
      leftAnchor: currentConfig.leftAnchor || 'Muito lento / Estagnado',
      centerAnchor: currentConfig.centerAnchor || 'Equilibrado e Fluido',
      rightAnchor: currentConfig.rightAnchor || 'Muito acelerado / Urgente',
    }
    // Remove explicitamente defaultValue
    delete updatedConfig.defaultValue

    simpleScalePrompt.set('schema_config', updatedConfig)
    app.save(simpleScalePrompt)

    // 2. Atualizar também em cer_prompt_versions se houver snapshot com defaultValue:3
    try {
      const pVersions = app.findRecordsByFilter(
        'cer_prompt_versions',
        `prompt_id = "${simpleScalePrompt.id}"`,
        'version_number',
        10,
        0,
      )
      for (const pv of pVersions) {
        const pvCfg = pv.get('schema_config') || {}
        if (pvCfg.defaultValue !== undefined) {
          delete pvCfg.defaultValue
          pv.set('schema_config', pvCfg)
          app.save(pv)
        }
      }
    } catch (_) {}
  },
  (app) => {},
)
