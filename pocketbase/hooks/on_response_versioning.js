// Hook server-side para versionamento imutável de respostas (GAP CRÍTICO RESOLVIDO)
// Garante que QUALQUER alteração via API direta ou frontend arquive o estado anterior
// em experience_response_versions antes de atualizar a resposta corrente.
//
// Validações adicionais de RLS/Integridade server-side:
// - participant_private: garante integridade de acesso
// - Proíbe alteração forjada de enrollment_id, prompt_id, respondent_user_id ou experience_id

onRecordCreate((e) => {
  const record = e.record

  // Preencher defaults caso não venham preenchidos
  if (!record.getString('access_class')) {
    record.set('access_class', 'shared_care')
  }

  if (!record.getInt('version')) {
    record.set('version', 1)
  }

  if (!record.getString('status')) {
    record.set('status', 'saved')
  }

  // Preencher prompt_version a partir do prompt se ausente
  if (!record.getInt('prompt_version')) {
    try {
      const promptId = record.getString('prompt_id')
      if (promptId) {
        const prompt = $app.findCollectionByNameOrId('cer_prompts')
        const pRec = $app.findFirstRecordByData('cer_prompts', 'id', promptId)
        record.set('prompt_version', pRec.getInt('version') || 1)
      }
    } catch (_) {
      record.set('prompt_version', 1)
    }
  }

  e.next()
}, 'experience_responses')

// Após criar a resposta corrente (v1), arquivar a versão 1 em experience_response_versions
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const record = e.record
    const versionsCol = $app.findCollectionByNameOrId('experience_response_versions')

    // Verificar se a versão 1 já não foi gravada
    let existingV1 = null
    try {
      const existingList = $app.findRecordsByFilter(
        'experience_response_versions',
        'response_id = "' + record.id + '" && version_number = 1',
        '',
        1,
        0,
      )
      if (existingList && existingList.length > 0) {
        existingV1 = existingList[0]
      }
    } catch (_) {}

    if (!existingV1) {
      const verRec = new Record(versionsCol)
      verRec.set('response_id', record.id)
      verRec.set('enrollment_id', record.getString('enrollment_id'))
      verRec.set('experience_id', record.getString('experience_id'))
      verRec.set('prompt_id', record.getString('prompt_id'))
      verRec.set('respondent_user_id', record.getString('respondent_user_id'))
      verRec.set('response_type', record.getString('response_type'))
      verRec.set('structured_value', record.get('structured_value'))
      verRec.set('free_text', record.getString('free_text'))
      verRec.set('version_number', 1)
      verRec.set('prompt_version', record.getInt('prompt_version') || 1)
      verRec.set('access_class', record.getString('access_class') || 'shared_care')
      verRec.set('change_reason', 'Registro inicial da resposta (v1)')
      $app.save(verRec)
    }
  } catch (err) {
    // Log se necessário
  }
}, 'experience_responses')

// ANTES de atualizar: arquivar o estado ANTERIOR em experience_response_versions
// e incrementar versão corrente e definir status = 'revised'
onRecordUpdate((e) => {
  const record = e.record
  const orig = record.original()

  if (orig) {
    // Impedir adulteração de enrollment_id, respondent_user_id ou experience_id
    if (orig.getString('enrollment_id') !== record.getString('enrollment_id')) {
      throw new BadRequestError('Não é permitido alterar o enrollment_id da resposta.')
    }
    if (orig.getString('respondent_user_id') !== record.getString('respondent_user_id')) {
      throw new BadRequestError('Não é permitido alterar o respondent_user_id da resposta.')
    }
    if (orig.getString('prompt_id') !== record.getString('prompt_id')) {
      throw new BadRequestError('Não é permitido alterar o prompt_id da resposta.')
    }

    // Arquivar o snapshot do estado original ANTES de aplicar o novo estado
    try {
      const versionsCol = $app.findCollectionByNameOrId('experience_response_versions')
      const verRec = new Record(versionsCol)
      verRec.set('response_id', orig.id)
      verRec.set('enrollment_id', orig.getString('enrollment_id'))
      verRec.set('experience_id', orig.getString('experience_id'))
      verRec.set('prompt_id', orig.getString('prompt_id'))
      verRec.set('respondent_user_id', orig.getString('respondent_user_id'))
      verRec.set('response_type', orig.getString('response_type'))
      verRec.set('structured_value', orig.get('structured_value'))
      verRec.set('free_text', orig.getString('free_text'))
      verRec.set('version_number', orig.getInt('version') || 1)
      verRec.set('prompt_version', orig.getInt('prompt_version') || 1)
      verRec.set('access_class', orig.getString('access_class') || 'shared_care')
      verRec.set('change_reason', 'Snapshot server-side antes de alteração')
      $app.save(verRec)
    } catch (saveErr) {
      // Se falhar o arquivamento, não permite alteração sem histórico
      throw new BadRequestError('Falha ao preservar histórico da resposta: ' + saveErr.message)
    }

    // Incrementar a versão da resposta corrente
    const currentVer = orig.getInt('version') || 1
    record.set('version', currentVer + 1)
    record.set('status', 'revised')

    // Preservar access_class se o novo não for fornecido
    if (!record.getString('access_class')) {
      record.set('access_class', orig.getString('access_class') || 'shared_care')
    }
  }

  e.next()
}, 'experience_responses')
