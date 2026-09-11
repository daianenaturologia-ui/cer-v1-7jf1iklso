// Hook server-side do Build 08B: Lifecycle e Provenance de cer_care_plan_priorities e cer_care_plan_priority_sources
// Collections: cer_care_plan_priorities, cer_care_plan_priority_sources
//
// Regras e Decisões Congeladas:
// 1. Status da prioridade: candidate | active | active_pending_adaptation | deferred | superseded | archived
// 2. Transições de prioridade exigem profissional humano autorizado vinculado ao enrollment.
// 3. cer_care_plan_priority_sources allowlist fechada:
//    knowledge_item | participant_recognition | map_item | presentation | association | signal | ai_proposal | professional_input
// 4. Derived privacy: classe da prioridade = mínimo das classes das fontes elegíveis (mais restritiva prevalece).
//    Hierarchy: participant_private (mais restritiva) > professional_private > participant_shared > shared_care > administrative > system_internal
// 5. Audit: PRIORITY_ADDED, PRIORITY_DEFERRED, PRIORITY_ACTIVATED

onRecordCreate((e) => {
  const pri = e.record
  const planId = pri.getString('plan_id')

  if (!pri.getString('created_by_user_id') && e.auth) {
    pri.set('created_by_user_id', e.auth.id)
  }

  // Validar plano
  let plan = null
  try {
    plan = $app.findFirstRecordByData('cer_care_plans', 'id', planId)
  } catch (_) {
    throw new BadRequestError('plan_id inválido ou inexistente.')
  }

  const enrollmentId = plan.getString('enrollment_id')

  // Validar autorização profissional
  if (e.auth) {
    const authId = e.auth.id
    let isProfLinked = false
    try {
      const links = $app.findRecordsByFilter(
        'professional_enrollment_access',
        'enrollment_id = "' +
          enrollmentId +
          '" && professional_user_id = "' +
          authId +
          '" && is_active = true',
        '',
        1,
        0,
      )
      if (links && links.length > 0) isProfLinked = true
    } catch (_) {}

    if (!isProfLinked) {
      throw new BadRequestError('Profissional sem vínculo ativo para o enrollment do plano.')
    }
  }

  e.next()
}, 'cer_care_plan_priorities')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const pri = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = pri.getString('created_by_user_id') || (e.auth ? e.auth.id : '')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }

    let action = 'PRIORITY_ADDED'
    if (pri.getString('status') === 'active') {
      action = 'PRIORITY_ACTIVATED'
    } else if (pri.getString('status') === 'deferred') {
      action = 'PRIORITY_DEFERRED'
    }

    audit.set('action', action)
    audit.set('resource_type', 'cer_care_plan_priorities')
    audit.set('resource_id', pri.id)
    // Obter enrollment via plan
    let enrId = ''
    try {
      const pl = $app.findFirstRecordByData('cer_care_plans', 'id', pri.getString('plan_id'))
      enrId = pl.getString('enrollment_id')
    } catch (_) {}

    audit.set('enrollment_id', enrId)
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_priority_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        priority_id: pri.id,
        plan_id: pri.getString('plan_id'),
        status: pri.getString('status'),
        is_therapeutic_priority: pri.getBool('is_therapeutic_priority'),
        is_possible_now: pri.getBool('is_possible_now'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_care_plan_priorities')

onRecordUpdate((e) => {
  const pri = e.record
  const orig = pri.original()
  if (!orig) {
    e.next()
    return
  }

  const origStatus = orig.getString('status')
  const newStatus = pri.getString('status')

  if (origStatus === 'archived' || origStatus === 'superseded') {
    throw new BadRequestError('Uma prioridade histórica ou arquivada não pode ser alterada.')
  }

  e.next()
}, 'cer_care_plan_priorities')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const pri = e.record
    const orig = pri.original()
    const origStatus = orig ? orig.getString('status') : ''
    const newStatus = pri.getString('status')

    if (origStatus !== newStatus) {
      let action = ''
      if (newStatus === 'active') action = 'PRIORITY_ACTIVATED'
      else if (newStatus === 'deferred') action = 'PRIORITY_DEFERRED'

      if (action) {
        const auditCol = $app.findCollectionByNameOrId('audit_events')
        const audit = new Record(auditCol)
        const actorId = e.auth ? e.auth.id : pri.getString('created_by_user_id')
        if (actorId) {
          audit.set('actor_user_id', actorId)
        }
        audit.set('action', action)
        audit.set('resource_type', 'cer_care_plan_priorities')
        audit.set('resource_id', pri.id)
        let enrId = ''
        try {
          const pl = $app.findFirstRecordByData('cer_care_plans', 'id', pri.getString('plan_id'))
          enrId = pl.getString('enrollment_id')
        } catch (_) {}
        audit.set('enrollment_id', enrId)
        audit.set('timestamp', new Date().toISOString())
        audit.set('result', 'success')
        audit.set('request_context', 'server_priority_lifecycle')
        audit.set(
          'metadata',
          JSON.stringify({
            priority_id: pri.id,
            old_status: origStatus,
            new_status: newStatus,
          }),
        )
        $app.save(audit)
      }
    }
  } catch (_) {}
}, 'cer_care_plan_priorities')

// -------------------------------------------------------------
// Priority Sources Validation Hook
// -------------------------------------------------------------
onRecordCreate((e) => {
  const src = e.record
  const priorityId = src.getString('priority_id')
  const sType = src.getString('source_type')
  const sId = src.getString('source_id')

  if (!src.getString('created_by_user_id') && e.auth) {
    src.set('created_by_user_id', e.auth.id)
  }

  // 1. Validar prioridade existente
  let pri = null
  try {
    pri = $app.findFirstRecordByData('cer_care_plan_priorities', 'id', priorityId)
  } catch (_) {
    throw new BadRequestError('priority_id inválido ou inexistente.')
  }

  // 2. Validar plano e enrollment isolation
  let plan = null
  try {
    plan = $app.findFirstRecordByData('cer_care_plans', 'id', pri.getString('plan_id'))
  } catch (_) {
    throw new BadRequestError('Plano da prioridade não encontrado.')
  }

  const enrId = plan.getString('enrollment_id')
  if (!src.getString('enrollment_id')) {
    src.set('enrollment_id', enrId)
  } else if (src.getString('enrollment_id') !== enrId) {
    throw new BadRequestError('Inconsistência de isolamento: enrollment_id difere do plano.')
  }

  // 3. Validar allowlist fechada de source_type
  const allowlist = [
    'knowledge_item',
    'participant_recognition',
    'map_item',
    'presentation',
    'association',
    'signal',
    'ai_proposal',
    'professional_input',
  ]
  if (allowlist.indexOf(sType) === -1) {
    throw new BadRequestError('source_type "' + sType + '" não é permitido na allowlist congelada.')
  }

  // 4. Validar existência da entidade fonte (quando aplicável)
  let derivedAccess = 'shared_care'
  if (sType === 'knowledge_item') {
    try {
      const ki = $app.findFirstRecordByData('cer_knowledge_items', 'id', sId)
      if (ki.getString('enrollment_id') !== enrId) {
        throw new BadRequestError('Knowledge Item de outro enrollment não pode ser fonte.')
      }
      derivedAccess = ki.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Knowledge Item fonte não encontrado.')
    }
  } else if (sType === 'signal') {
    try {
      const sig = $app.findFirstRecordByData('cer_signals', 'id', sId)
      if (sig.getString('enrollment_id') !== enrId) {
        throw new BadRequestError('Signal de outro enrollment não pode ser fonte.')
      }
      derivedAccess = sig.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Signal fonte não encontrado.')
    }
  } else if (sType === 'association') {
    try {
      const asc = $app.findFirstRecordByData('cer_associations', 'id', sId)
      if (asc.getString('enrollment_id') !== enrId) {
        throw new BadRequestError('Association de outro enrollment não pode ser fonte.')
      }
      derivedAccess = asc.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Association fonte não encontrada.')
    }
  } else if (sType === 'participant_recognition') {
    try {
      const rec = $app.findFirstRecordByData('cer_participant_recognitions', 'id', sId)
      if (rec.getString('enrollment_id') !== enrId) {
        throw new BadRequestError('Recognition de outro enrollment não pode ser fonte.')
      }
      derivedAccess = rec.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Recognition fonte não encontrado.')
    }
  } else if (sType === 'map_item') {
    try {
      const mi = $app.findFirstRecordByData('cer_map_items', 'id', sId)
      const mp = $app.findFirstRecordByData('cer_maps', 'id', mi.getString('map_id'))
      if (mp.getString('enrollment_id') !== enrId) {
        throw new BadRequestError('Map item de outro enrollment não pode ser fonte.')
      }
      derivedAccess = 'shared_care'
    } catch (_) {
      throw new BadRequestError('Map item fonte não encontrado.')
    }
  } else if (sType === 'ai_proposal') {
    try {
      const aip = $app.findFirstRecordByData('cer_ai_proposals', 'id', sId)
      if (aip.getString('enrollment_id') !== enrId) {
        throw new BadRequestError('AI proposal de outro enrollment não pode ser fonte.')
      }
      derivedAccess = 'professional_private'
    } catch (_) {
      throw new BadRequestError('AI Proposal fonte não encontrada.')
    }
  }

  if (!src.getString('access_class')) {
    src.set('access_class', derivedAccess)
  }

  e.next()
}, 'cer_care_plan_priority_sources')
