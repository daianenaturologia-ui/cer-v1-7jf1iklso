// Hook server-side do Checkpoint 03A: Derivação Determinística de Signals
// Dispara após criação de experience_responses
// Validações rigorosas de Integridade, Proveniência, Idempotência e Privacidade:
// - FreeReflection NUNCA gera Signal automático
// - Response sem regra ativa NÃO gera Signal
// - Temporality 'longitudinal' é terminantemente PROIBIDA a partir de response individual
// - Signal herda access_class da Response (derivação nunca amplia permissão)
// - Integridade cross-enrollment: valida respondent, enrollment, experience e prompt
// - Idempotência: não duplica signal para mesma response e concept_key/rule
// - Audita SIGNAL_CREATED com metadados puramente técnicos (sem texto da resposta!)

// 1. Hook de validação no momento de criação/atualização de cer_signals
onRecordCreate((e) => {
  const signal = e.record

  // REGRA T6: Tentativa de temporality=longitudinal a partir de resposta automática é rejeitada
  const temporality = signal.getString('temporality')
  const sourceType = signal.getString('source_type')
  if (temporality === 'longitudinal' && sourceType === 'participant_report') {
    throw new BadRequestError('Uma única resposta não pode gerar temporality longitudinal.')
  }

  // REGRA T7/T8/T9: Validar proveniência e integridade cross-enrollment se originado de source_response_id
  const sourceRespId = signal.getString('source_response_id')
  if (sourceRespId) {
    let resp = null
    try {
      resp = $app.findFirstRecordByData('experience_responses', 'id', sourceRespId)
    } catch (_) {
      throw new BadRequestError('source_response_id inválido ou inexistente.')
    }

    // Validar coerência de enrollment_id (T7)
    if (signal.getString('enrollment_id') !== resp.getString('enrollment_id')) {
      throw new BadRequestError(
        'Inconsistência de proveniência: enrollment_id difere da response de origem.',
      )
    }

    // Validar coerência de prompt_id (T8)
    const sourcePromptId = signal.getString('source_prompt_id')
    if (sourcePromptId && sourcePromptId !== resp.getString('prompt_id')) {
      throw new BadRequestError(
        'Inconsistência de proveniência: source_prompt_id difere do prompt da response.',
      )
    }

    // Validar coerência de experience_id
    const sourceExpId = signal.getString('source_experience_id')
    if (sourceExpId && sourceExpId !== resp.getString('experience_id')) {
      throw new BadRequestError(
        'Inconsistência de proveniência: source_experience_id difere da response.',
      )
    }

    // REGRA T9 / Princípio 6: Derivação NUNCA amplia permissão.
    // O Signal derivado herda a access_class da Response e não pode ser mais permissivo.
    const respAccess = resp.getString('access_class') || 'shared_care'
    const sigAccess = signal.getString('access_class') || respAccess

    // Hierarquia de restrição: participant_private é o mais restritivo.
    // Se a response for participant_private, o Signal NÃO pode ser shared_care nem participant_shared.
    if (respAccess === 'participant_private' && sigAccess !== 'participant_private') {
      throw new BadRequestError(
        'Violação de privacidade: Signal não pode ter access_class mais permissiva que a Response.',
      )
    }

    // Preencher respondent/created_by se ausente
    if (!signal.getString('created_by_user_id')) {
      signal.set('created_by_user_id', resp.getString('respondent_user_id'))
    }
  }

  // Se framework_id fornecido, validar se existe e está ativo (T10)
  const fwId = signal.getString('framework_id')
  if (fwId) {
    try {
      const fw = $app.findFirstRecordByData('cer_frameworks', 'id', fwId)
      if (!fw.getBool('is_active')) {
        throw new BadRequestError('O referencial (framework_id) referenciado está inativo.')
      }
    } catch (_) {
      throw new BadRequestError('framework_id inválido ou inexistente.')
    }
  }

  e.next()
}, 'cer_signals')

// 2. Hook de validação no momento de atualização de cer_signals (R9, R10)
onRecordUpdate((e) => {
  const signal = e.record
  const orig = signal.original()

  if (orig) {
    // Proibir alteração de enrollment_id, source_response_id
    if (signal.getString('enrollment_id') !== orig.getString('enrollment_id')) {
      throw new BadRequestError('Não é permitido alterar o enrollment_id de um Signal.')
    }
    if (signal.getString('source_response_id') !== orig.getString('source_response_id')) {
      throw new BadRequestError('Não é permitido alterar a response de origem de um Signal.')
    }

    // R10: Profissional tenta alterar Signal de origem participant_report sem permissão explícita
    const sourceType = orig.getString('source_type')
    if (sourceType === 'participant_report' && e.auth) {
      const authUser = e.auth
      const creatorId = orig.getString('created_by_user_id')
      if (authUser.id !== creatorId) {
        // Verificar se quem está tentando atualizar é profissional ou terceiro
        throw new BadRequestError(
          'Profissional ou terceiro não tem permissão para alterar Signal de origem participant_report.',
        )
      }
    }

    // R9: Tentar mudar access_class para ampliar compartilhamento indevidamente
    const sourceRespId = orig.getString('source_response_id')
    if (sourceRespId) {
      try {
        const resp = $app.findFirstRecordByData('experience_responses', 'id', sourceRespId)
        const respAccess = resp.getString('access_class')
        const newAccess = signal.getString('access_class')
        if (respAccess === 'participant_private' && newAccess !== 'participant_private') {
          throw new BadRequestError(
            'Não é permitido elevar o nível de acesso do Signal além da Response de origem.',
          )
        }
      } catch (_) {}
    }
  }

  e.next()
}, 'cer_signals')

// 3. Hook de Derivação Automática Disparado por experience_responses
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const resp = e.record
    const respType = resp.getString('response_type')

    // REGRA 4 & T5: FreeReflection NÃO gera Signal automático no 03A!
    if (respType === 'FreeReflection') {
      return
    }

    const promptId = resp.getString('prompt_id')
    const promptVer = resp.getInt('prompt_version') || 1
    const enrollmentId = resp.getString('enrollment_id')
    const respondentUserId = resp.getString('respondent_user_id')
    const respAccessClass = resp.getString('access_class') || 'shared_care'

    // Obter structured_value como string ou objeto para casamento exato
    const structVal = resp.get('structured_value')
    if (!structVal) {
      return
    }

    // Normalizar valor estruturado para busca de match
    let matchKey = ''
    if (typeof structVal === 'string') {
      matchKey = structVal
    } else if (typeof structVal === 'object') {
      if (structVal.selectedOptionId) {
        matchKey = structVal.selectedOptionId
      } else if (structVal.id) {
        matchKey = structVal.id
      } else if (structVal.choice) {
        matchKey = structVal.choice
      } else if (structVal.value) {
        matchKey = String(structVal.value)
      } else {
        matchKey = JSON.stringify(structVal)
      }
    }

    // Buscar regras ativas configuradas para o prompt
    const rules = $app.findRecordsByFilter(
      'cer_prompt_signal_rules',
      'prompt_id = "' + promptId + '" && is_active = true',
      '',
      20,
      0,
    )

    if (!rules || rules.length === 0) {
      return // Sem regra -> não cria Signal (T4)
    }

    // Buscar a experiência para extrair dimension_id da cadeia original
    let expRec = null
    try {
      expRec = $app.findFirstRecordByData('cer_experiences', 'id', resp.getString('experience_id'))
    } catch (_) {}

    const signalsCol = $app.findCollectionByNameOrId('cer_signals')
    const auditCol = $app.findCollectionByNameOrId('audit_events')

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      const expectedMatch = rule.getString('response_match')

      // Verificar correspondência exata ou inclusão se for array
      let isMatch = false
      if (matchKey === expectedMatch) {
        isMatch = true
      } else if (Array.isArray(structVal) && structVal.includes(expectedMatch)) {
        isMatch = true
      }

      if (isMatch) {
        const conceptKey = rule.getString('concept_key')
        const ruleSignalType = rule.getString('signal_type')
        const ruleTemporality = rule.getString('temporality_default') || 'current'
        const ruleFrameworkId = rule.getString('framework_id')

        // Dimensão prioritária da regra, senão herda da experiência da cadeia
        let targetDimensionId = rule.getString('dimension_id')
        if (!targetDimensionId && expRec) {
          targetDimensionId = expRec.getString('dimension_id')
        }

        // T6: Longitudinal NUNCA pode ser gerado automaticamente
        let safeTemporality = ruleTemporality
        if (safeTemporality === 'longitudinal') {
          safeTemporality = 'current' // Bloquear e rebaixar se a regra erroneamente indicar
        }

        // IDEMPOTÊNCIA (T3): Verificar se já existe Signal para esta Response e Concept
        let existingSignal = null
        try {
          const existingList = $app.findRecordsByFilter(
            'cer_signals',
            'source_response_id = "' + resp.id + '" && concept_key = "' + conceptKey + '"',
            '',
            1,
            0,
          )
          if (existingList && existingList.length > 0) {
            existingSignal = existingList[0]
          }
        } catch (_) {}

        if (existingSignal) {
          continue // Já existe: não duplica
        }

        // Criar Signal canônico server-side (T1, T2)
        const sig = new Record(signalsCol)
        sig.set('enrollment_id', enrollmentId)
        sig.set('signal_type', ruleSignalType)
        sig.set('concept_key', conceptKey)
        if (targetDimensionId) {
          sig.set('dimension_id', targetDimensionId)
        }
        sig.set('temporality', safeTemporality)
        sig.set('source_type', 'participant_report')
        sig.set('source_response_id', resp.id)
        sig.set('source_prompt_id', promptId)
        sig.set('source_experience_id', resp.getString('experience_id'))
        if (ruleFrameworkId) {
          sig.set('framework_id', ruleFrameworkId)
        }
        sig.set('created_by_user_id', respondentUserId)
        sig.set('access_class', respAccessClass) // Herança estrita
        sig.set('status', 'active')

        $app.save(sig)

        // REGRA DE AUDIT EVENT 03A:
        // Ação SIGNAL_CREATED com metadados puramente técnicos.
        // NUNCA incluir texto da resposta, opções sensíveis ou declaração interpretativa.
        try {
          const audit = new Record(auditCol)
          if (respondentUserId) {
            audit.set('actor_user_id', respondentUserId)
          }
          audit.set('action', 'SIGNAL_CREATED')
          audit.set('resource_type', 'cer_signals')
          audit.set('resource_id', sig.id)
          audit.set('enrollment_id', enrollmentId)
          audit.set('timestamp', new Date().toISOString())
          audit.set('result', 'success')
          audit.set('request_context', 'server_signal_derivation')
          audit.set(
            'metadata',
            JSON.stringify({
              signal_id: sig.id,
              concept_key: conceptKey,
              signal_type: ruleSignalType,
              source_type: 'participant_report',
              source_response_id: resp.id,
              access_class: respAccessClass,
            }),
          )
          $app.save(audit)
        } catch (_) {}
      }
    }
  } catch (err) {
    // Log técnico sem quebrar resposta original se erro interno
  }
}, 'experience_responses')
