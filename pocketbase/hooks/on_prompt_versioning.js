// Hook server-side para versionamento imutável de prompts e momentos metodológicos
// Quando um prompt é alterado ou criado com nova versão, preserva o snapshot histórico
// em cer_prompt_versions de forma que nenhuma versão antiga desapareça.

onRecordUpdate((e) => {
  const record = e.record
  const orig = record.original()

  if (orig) {
    const origVer = orig.getInt('version') || 1
    const newVer = record.getInt('version') || origVer

    let origData = orig
    try {
      origData = $app.findFirstRecordByData('cer_prompts', 'id', record.id)
    } catch (_) {}

    const textChanged =
      (origData ? origData.getString('prompt_text') : orig.getString('prompt_text')) !==
      record.getString('prompt_text')
    const schemaChanged =
      JSON.stringify(origData ? origData.get('schema_config') : orig.get('schema_config')) !==
      JSON.stringify(record.get('schema_config'))
    const typeChanged =
      (origData ? origData.getString('component_type') : orig.getString('component_type')) !==
      record.getString('component_type')

    if (textChanged || schemaChanged || typeChanged || newVer > origVer) {
      if (newVer <= origVer) {
        record.set('version', origVer + 1)
      }

      try {
        const versionsCol = $app.findCollectionByNameOrId('cer_prompt_versions')
        const pvRec = new Record(versionsCol)
        pvRec.set('prompt_id', record.id)
        pvRec.set(
          'moment_id',
          (origData ? origData.getString('moment_id') : '') ||
            orig.getString('moment_id') ||
            record.getString('moment_id'),
        )
        pvRec.set('version_number', origVer)
        pvRec.set(
          'prompt_type',
          (origData ? origData.getString('component_type') : '') ||
            orig.getString('component_type') ||
            record.getString('component_type'),
        )
        pvRec.set(
          'prompt_text',
          (origData ? origData.getString('prompt_text') : '') || orig.getString('prompt_text'),
        )
        pvRec.set(
          'helper_text',
          (origData ? origData.getString('helper_text') : '') || orig.getString('helper_text'),
        )
        pvRec.set(
          'schema_config',
          origData ? origData.get('schema_config') : orig.get('schema_config'),
        )
        pvRec.set(
          'is_required',
          origData ? origData.getBool('is_required') : orig.getBool('is_required'),
        )
        pvRec.set('change_reason', 'Snapshot metodológico histórico pré-edição')
        $app.save(pvRec)
      } catch (err) {
        // não bloqueia se já existir versão correspondente
      }
    }
  }

  e.next()
}, 'cer_prompts')

onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const versionsCol = $app.findCollectionByNameOrId('cer_prompt_versions')

    // Verificar se já tem versão gravada
    let existingV = null
    try {
      const list = $app.findRecordsByFilter(
        'cer_prompt_versions',
        'prompt_id = "' + record.id + '" && version_number = ' + (record.getInt('version') || 1),
        '',
        1,
        0,
      )
      if (list && list.length > 0) existingV = list[0]
    } catch (_) {}

    if (!existingV) {
      const pvRec = new Record(versionsCol)
      pvRec.set('prompt_id', record.id)
      pvRec.set('moment_id', record.getString('moment_id'))
      pvRec.set('version_number', record.getInt('version') || 1)
      pvRec.set('prompt_type', record.getString('component_type'))
      pvRec.set('prompt_text', record.getString('prompt_text'))
      pvRec.set('helper_text', record.getString('helper_text'))
      pvRec.set('schema_config', record.get('schema_config'))
      pvRec.set('is_required', record.getBool('is_required'))
      pvRec.set('change_reason', 'Criação inicial do prompt')
      $app.save(pvRec)
    }
  } catch (_) {}
}, 'cer_prompts')
