// Hook server-side do Build 08C: Safety Check Lifecycle, Regra P0 de Elegibilidade e Validação de Check Sources
// Coleções monitoradas: cer_practice_safety_checks, cer_practice_safety_check_sources
// Regras e Decisões Congeladas:
// 1. REGRA P0 (eligible):
//    - outcome "eligible" SOMENTE se TODOS os safety inputs obrigatórios definidos pelo SafetyProfile foram avaliados.
//    - Ausência de contraindicação encontrada ≠ safety confirmada.
//    - Para intensidades moderate, high e expansive: NUNCA eligible por ausência de dados.
//    - Dado obrigatório ausente → insufficient_information ou requires_professional_review.
// 2. REGRA (rationale):
//    - professional_rationale é OBRIGATÓRIO quando outcome ≠ 'eligible'.
//    - Nunca participant-facing automaticamente; nunca auditado em conteúdo.
// 3. ALLOWLIST FECHADA DE 6 CHECK SOURCES:
//    - experience_response | signal | association | knowledge_item | participant_recognition | session_observation
//    - PROIBIDO: professional_input, ai_proposal, map_item, presentation, framework_reading, other.
//    - Cross-enrollment estritamente proibido.
// 4. REGRA DURA: SOURCE/EVIDENCE CONSULTADA ≠ PROFESSIONAL JUDGMENT PRODUZIDO.
//    - O julgamento vive no check. Proibido criar source fake para julgamento.
// 5. Zero Delete Físico.
// 6. Auditoria: SAFETY_CHECK_RECORDED, SAFETY_CHECK_SOURCE_ADDED, PROFESSIONAL_CLEARANCE_RECORDED.

onRecordCreate((e) => {
  const check = e.record
  const outcome = check.getString('outcome')
  const rationale = check.getString('professional_rationale') || ''
  const versionId = check.getString('practice_version_id')
  const enrollmentId = check.getString('enrollment_id')

  if (!check.getString('reviewed_by_user_id') && e.auth) {
    check.set('reviewed_by_user_id', e.auth.id)
  }
  if (!check.getString('reviewed_at')) {
    check.set('reviewed_at', new Date().toISOString())
  }
  if (!check.getString('record_status')) {
    check.set('record_status', 'current')
  }

  // 1. Rationale obrigatório se outcome != 'eligible'
  if (outcome !== 'eligible' && !rationale.trim()) {
    throw new BadRequestError(
      'Julgamento de Segurança: professional_rationale é obrigatório quando outcome ≠ "eligible".',
    )
  }

  // 2. Regra P0 de Elegibilidade
  if (outcome === 'eligible') {
    // Buscar a PracticeVersion para verificar intensidade
    let pv = null
    try {
      pv = $app.findFirstRecordByData('cer_practice_versions', 'id', versionId)
    } catch (_) {
      throw new BadRequestError('PracticeVersion vinculada ao check não encontrada.')
    }

    const intensity = pv.getString('intensity')

    // Buscar o SafetyProfile
    let sp = null
    try {
      sp = $app.findFirstRecordByData(
        'cer_practice_safety_profiles',
        'practice_version_id',
        versionId,
      )
    } catch (_) {}

    let reqInputs = []
    if (sp && sp.get('required_dynamic_inputs')) {
      try {
        const raw = sp.get('required_dynamic_inputs')
        reqInputs = typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch (_) {}
    }

    // Para moderate/high/expansive, se não houver definição de required_dynamic_inputs ou se não houver sources fornecidas,
    // não pode declarar eligible por ausência de dados!
    if (
      (intensity === 'moderate' || intensity === 'high' || intensity === 'expansive') &&
      (!reqInputs || reqInputs.length === 0)
    ) {
      throw new BadRequestError(
        'Regra P0: Práticas de intensidade ' +
          intensity +
          ' exigem verificação formal de gates de segurança antes de declarar eligible.',
      )
    }

    // Se houver required_dynamic_inputs, verificar metadados ou sources
    if (reqInputs && reqInputs.length > 0) {
      let meta = {}
      try {
        const rawMeta = check.get('metadata')
        meta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : rawMeta || {}
      } catch (_) {}

      const evaluatedInputs = meta.evaluated_safety_inputs || []
      const missingInputs = []
      for (let i = 0; i < reqInputs.length; i++) {
        const inp = reqInputs[i]
        if (evaluatedInputs.indexOf(inp) === -1) {
          missingInputs.push(inp)
        }
      }

      if (missingInputs.length > 0) {
        throw new BadRequestError(
          'Regra P0 (eligible): Nem todos os safety inputs obrigatórios foram avaliados (' +
            missingInputs.join(', ') +
            '). Registre como insufficient_information ou requires_professional_review.',
        )
      }
    }
  }

  // 3. Supersede anterior para o mesmo par enrollment + practice_version
  try {
    const existing = $app.findRecordsByFilter(
      'cer_practice_safety_checks',
      'enrollment_id = "' +
        enrollmentId +
        '" && practice_version_id = "' +
        versionId +
        '" && record_status = "current"',
      '',
      10,
      0,
    )
    for (let i = 0; i < existing.length; i++) {
      const ex = existing[i]
      ex.set('record_status', 'superseded')
      $app.save(ex)
    }
  } catch (_) {}

  e.next()
}, 'cer_practice_safety_checks')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const check = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = check.getString('reviewed_by_user_id') || (e.auth ? e.auth.id : '')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    // Se foi registrado clearance médico (via metadata ou outcome com caution)
    let meta = {}
    try {
      const raw = check.get('metadata')
      meta = typeof raw === 'string' ? JSON.parse(raw) : raw || {}
    } catch (_) {}

    const action = meta.is_professional_clearance
      ? 'PROFESSIONAL_CLEARANCE_RECORDED'
      : 'SAFETY_CHECK_RECORDED'

    audit.set('action', action)
    audit.set('resource_type', 'cer_practice_safety_checks')
    audit.set('resource_id', check.id)
    audit.set('enrollment_id', check.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_safety_check_lifecycle')
    // ZERO texto confidencial de rationale no audit!
    audit.set(
      'metadata',
      JSON.stringify({
        safety_check_id: check.id,
        practice_version_id: check.getString('practice_version_id'),
        outcome: check.getString('outcome'),
        record_status: check.getString('record_status'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_practice_safety_checks')

// -------------------------------------------------------------
// Validação de cer_practice_safety_check_sources
// -------------------------------------------------------------
onRecordCreate((e) => {
  const src = e.record
  const checkId = src.getString('safety_check_id')
  const sourceType = src.getString('source_type')
  const sourceId = src.getString('source_id')

  // 1. Allowlist estrita de 6 tipos:
  const allowedTypes = [
    'experience_response',
    'signal',
    'association',
    'knowledge_item',
    'participant_recognition',
    'session_observation',
  ]

  if (allowedTypes.indexOf(sourceType) === -1) {
    throw new BadRequestError(
      'Allowlist de Safety Check Source violada. Tipo "' +
        sourceType +
        '" não é permitido. Tipos permitidos: ' +
        allowedTypes.join(', ') +
        '. Proibido: professional_input, ai_proposal, map_item, presentation, framework_reading, other.',
    )
  }

  // 2. Buscar o SafetyCheck pai
  let check = null
  try {
    check = $app.findFirstRecordByData('cer_practice_safety_checks', 'id', checkId)
  } catch (_) {
    throw new BadRequestError('safety_check_id inválido ou inexistente.')
  }

  const enrollmentId = check.getString('enrollment_id')
  src.set('enrollment_id', enrollmentId)

  // 3. Validar existência da fonte e isolamento por enrollment
  let targetEnrollmentId = ''
  let targetAccessClass = ''

  if (sourceType === 'experience_response') {
    try {
      const resp = $app.findFirstRecordByData('experience_responses', 'id', sourceId)
      targetEnrollmentId = resp.getString('enrollment_id')
      targetAccessClass = resp.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Response referenciada na check source não encontrada.')
    }
  } else if (sourceType === 'signal') {
    try {
      const sig = $app.findFirstRecordByData('cer_signals', 'id', sourceId)
      targetEnrollmentId = sig.getString('enrollment_id')
      targetAccessClass = sig.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Signal referenciado na check source não encontrado.')
    }
  } else if (sourceType === 'association') {
    try {
      const assoc = $app.findFirstRecordByData('cer_associations', 'id', sourceId)
      targetEnrollmentId = assoc.getString('enrollment_id')
      targetAccessClass = assoc.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Associação referenciada na check source não encontrada.')
    }
  } else if (sourceType === 'knowledge_item') {
    try {
      const ki = $app.findFirstRecordByData('cer_knowledge_items', 'id', sourceId)
      targetEnrollmentId = ki.getString('enrollment_id')
      targetAccessClass = ki.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Knowledge Item referenciado na check source não encontrado.')
    }
  } else if (sourceType === 'participant_recognition') {
    try {
      const recog = $app.findFirstRecordByData('cer_participant_recognitions', 'id', sourceId)
      targetEnrollmentId = recog.getString('enrollment_id')
      targetAccessClass = recog.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError(
        'Participant Recognition referenciado na check source não encontrado.',
      )
    }
  } else if (sourceType === 'session_observation') {
    try {
      const obs = $app.findFirstRecordByData('cer_session_observations', 'id', sourceId)
      targetEnrollmentId = obs.getString('enrollment_id')
      targetAccessClass = obs.getString('access_class') || 'professional_private'
    } catch (_) {
      throw new BadRequestError('Session Observation referenciada na check source não encontrada.')
    }
  }

  // Cross-enrollment check
  if (targetEnrollmentId && targetEnrollmentId !== enrollmentId) {
    throw new BadRequestError(
      'Inconsistência cross-enrollment: a fonte pertence a outro enrollment.',
    )
  }

  src.set('access_class', targetAccessClass || 'shared_care')
  e.next()
}, 'cer_practice_safety_check_sources')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const src = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : ''
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    audit.set('action', 'SAFETY_CHECK_SOURCE_ADDED')
    audit.set('resource_type', 'cer_practice_safety_check_sources')
    audit.set('resource_id', src.id)
    audit.set('enrollment_id', src.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_safety_check_source_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        source_id: src.id,
        safety_check_id: src.getString('safety_check_id'),
        source_type: src.getString('source_type'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_practice_safety_check_sources')

onRecordDelete((e) => {
  throw new BadRequestError('Zero Delete Físico: Exclusão de Safety Check não permitida.')
}, 'cer_practice_safety_checks')

onRecordDelete((e) => {
  throw new BadRequestError('Zero Delete Físico: Exclusão de Safety Check Source não permitida.')
}, 'cer_practice_safety_check_sources')

onRecordDelete((e) => {
  throw new BadRequestError('Zero Delete Físico: Exclusão de Safety Profile não permitida.')
}, 'cer_practice_safety_profiles')

onRecordDelete((e) => {
  throw new BadRequestError('Zero Delete Físico: Exclusão de Safety Rule não permitida.')
}, 'cer_practice_safety_rules')
