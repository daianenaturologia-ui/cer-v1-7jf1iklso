// Hook server-side do Build 08D: Lifecycle, Gates e Versionamento de cer_practice_assignments
// Coleções monitoradas: cer_practice_assignments
// Regras e Decisões Congeladas:
// 1. GATES DE ATIVAÇÃO:
//    - Priority gate: priority deve estar 'active' OU 'active_pending_adaptation' E ter Operational Acceptance current com decision 'accepted' OU 'wants_to_try'. Recognition sozinha NÃO basta.
//    - PracticeVersion anchor: practice_version_id exata obrigatória e imutável. variant_id opcional, mas se informada deve pertencer à MESMA PracticeVersion.
//    - Safety gate: consultar Safety Check record_status = 'current' do mesmo enrollment + participant + practice_version_id EXATA:
//        * eligible -> avança
//        * eligible_with_caution -> avança conforme policy
//        * requires_professional_review -> bloqueia
//        * requires_supervision -> só ativa se governance_mode da prática contiver supervised/professional ou nota compatível
//        * not_currently_indicated -> bloqueia
//        * insufficient_information -> bloqueia
//    - Consent gate: se PracticeVersion exige consentimento (consent_required in ['required', 'conditional']):
//        * consent deve ter record_status = 'current', decision = 'accepted', enrollment/participant corretos e practice_version_id EXATAMENTE igual (v2 ≠ v3).
// 2. LIFECYCLE: draft | active | paused | completed | stopped | superseded.
//    - NUNCA usar "failed".
//    - completed só por evento explícito (nunca inferido por fim de ciclo).
//    - stopped = interrompido antes.
//    - Retomada (resume de paused): exige que o ciclo esteja elegível (status active ou planned). Ciclo closed ou paused bloqueia resume.
// 3. DOSE E BOUNDS:
//    - variant_id opcional deve pertencer à mesma PracticeVersion.
// 4. VERSIONAMENTO MATERIAL:
//    - Adaptação material gera novo registro com previous_assignment_id; anterior vira superseded.
// 5. AUDIT: ASSIGNMENT_CREATED, ASSIGNMENT_ACTIVATED, ASSIGNMENT_ADAPTED, ASSIGNMENT_PAUSED, ASSIGNMENT_RESUMED, ASSIGNMENT_STOPPED, ASSIGNMENT_COMPLETED, ASSIGNMENT_SUPERSEDED.
// 6. Zero Delete Físico.

onRecordCreate((e) => {
  const a = e.record
  const status = a.getString('status') || 'draft'

  if (!a.getString('assigned_by_user_id') && e.auth) {
    a.set('assigned_by_user_id', e.auth.id)
  }

  // Validar safe_title P0 contra vazamento de termos clínicos restritos
  const safeTitle = (a.getString('participant_safe_title') || '').toLowerCase()
  const unsafeTerms = [
    'diagnóstico',
    'diagnostico',
    'transtorno',
    'fobia',
    'cid-10',
    'cid-11',
    'dsm-5',
    'patologia',
    'patológico',
  ]
  for (let i = 0; i < unsafeTerms.length; i++) {
    if (safeTitle.indexOf(unsafeTerms[i]) !== -1) {
      throw new BadRequestError(
        'Safe Title Violation: Termo clínico diagnóstico restrito não permitido no título do interagente: ' +
          unsafeTerms[i],
      )
    }
  }

  // Validar consistência de variant_id se fornecido
  const variantId = a.getString('variant_id')
  const versionId = a.getString('practice_version_id')
  if (variantId) {
    try {
      const variant = $app.findFirstRecordByData('cer_practice_variants', 'id', variantId)
      if (variant.getString('practice_version_id') !== versionId) {
        throw new BadRequestError(
          'Variant Gate: A variante informada não pertence à PracticeVersion ancorada no Assignment.',
        )
      }
    } catch (_) {
      throw new BadRequestError('variant_id inválido ou inexistente.')
    }
  }

  // Se for criado diretamente como active, passar por todos os gates de ativação (INLINE)
  if (status === 'active') {
    const enrollmentId = a.getString('enrollment_id')
    const participantUserId = a.getString('participant_user_id')
    const priorityId = a.getString('care_plan_priority_id')
    const safetyCheckId = a.getString('safety_check_id')
    const operationalAcceptanceId = a.getString('operational_acceptance_id')
    const consentId = a.getString('consent_id')

    // 1. PRACTICE VERSION DEVE ESTAR ACTIVE
    let pv = null
    try {
      pv = $app.findFirstRecordByData('cer_practice_versions', 'id', versionId)
    } catch (_) {
      throw new BadRequestError('PracticeVersion vinculada não encontrada.')
    }
    const pvStatus = pv.getString('status')
    if (pvStatus === 'retired') {
      throw new BadRequestError(
        'Practice Gate: Prática aposentada (retired). Não é permitido ativar assignment com versão aposentada.',
      )
    }
    if (pvStatus === 'deprecated') {
      throw new BadRequestError(
        'Practice Gate: Prática depreciada (deprecated). Novas ativações são bloqueadas.',
      )
    }
    if (pvStatus !== 'active') {
      throw new BadRequestError(
        'Practice Gate: PracticeVersion deve estar com status "active" para ser ativada.',
      )
    }

    // 2. PRIORITY GATE
    let priority = null
    try {
      priority = $app.findFirstRecordByData('cer_care_plan_priorities', 'id', priorityId)
    } catch (_) {
      throw new BadRequestError('Prioridade de cuidado vinculada não encontrada.')
    }
    const priorityStatus = priority.getString('status')
    if (priorityStatus !== 'active' && priorityStatus !== 'active_pending_adaptation') {
      throw new BadRequestError(
        'Priority Gate: Prioridade de cuidado associada deve estar com status "active" ou "active_pending_adaptation". Status atual: ' +
          priorityStatus,
      )
    }

    let acceptance = null
    try {
      acceptance = $app.findFirstRecordByData(
        'cer_operational_acceptances',
        'id',
        operationalAcceptanceId,
      )
    } catch (_) {
      throw new BadRequestError('Aceite Operacional vinculado não encontrado.')
    }
    if (acceptance.getString('record_status') !== 'current') {
      throw new BadRequestError(
        'Priority Gate: Aceite Operacional deve ter record_status = "current".',
      )
    }
    const respType = acceptance.getString('response_type')
    if (respType !== 'accepted' && respType !== 'wants_to_try') {
      throw new BadRequestError(
        'Priority Gate: Aceite Operacional deve ter decisão "accepted" ou "wants_to_try". Valor atual: ' +
          respType,
      )
    }

    // 3. SAFETY GATE
    let sc = null
    try {
      sc = $app.findFirstRecordByData('cer_practice_safety_checks', 'id', safetyCheckId)
    } catch (_) {
      throw new BadRequestError('Safety Check vinculado não encontrado.')
    }
    if (sc.getString('record_status') !== 'current') {
      throw new BadRequestError('Safety Gate: Safety Check deve ter record_status = "current".')
    }
    if (sc.getString('practice_version_id') !== versionId) {
      throw new BadRequestError(
        'Safety Gate: Safety Check deve pertencer EXATAMENTE à mesma PracticeVersion do Assignment.',
      )
    }
    if (sc.getString('enrollment_id') !== enrollmentId) {
      throw new BadRequestError('Safety Gate: Safety Check pertence a outro enrollment.')
    }

    const outcome = sc.getString('outcome')
    if (outcome === 'requires_professional_review') {
      throw new BadRequestError(
        'Safety Gate: Ativação bloqueada — Safety Check requer revisão profissional prévia (requires_professional_review).',
      )
    }
    if (outcome === 'not_currently_indicated') {
      throw new BadRequestError(
        'Safety Gate: Ativação bloqueada — Prática não indicada atualmente para o interagente (not_currently_indicated).',
      )
    }
    if (outcome === 'insufficient_information') {
      throw new BadRequestError(
        'Safety Gate: Ativação bloqueada — Informações insuficientes de segurança para prosseguir (insufficient_information).',
      )
    }
    if (outcome === 'requires_supervision') {
      if (!sc.getString('professional_rationale')) {
        throw new BadRequestError(
          'Safety Gate: Prática com requires_supervision exige justificativa profissional formal de acompanhamento.',
        )
      }
    }

    // 4. CONSENT GATE
    const consentRequired = pv.getString('consent_required')
    if (consentRequired === 'required' || consentRequired === 'conditional') {
      if (!consentId) {
        throw new BadRequestError(
          'Consent Gate: PracticeVersion exige termo de consentimento livre e esclarecido prévio.',
        )
      }
      let consent = null
      try {
        consent = $app.findFirstRecordByData('cer_practice_consents', 'id', consentId)
      } catch (_) {
        throw new BadRequestError('Registro de consentimento vinculado não encontrado.')
      }

      if (consent.getString('record_status') !== 'current') {
        throw new BadRequestError(
          'Consent Gate: O termo de consentimento associado não está ativo (record_status != "current").',
        )
      }
      if (consent.getString('decision') !== 'accepted') {
        throw new BadRequestError(
          'Consent Gate: O termo de consentimento foi recusado ou não aceito formalmente.',
        )
      }
      if (consent.getString('practice_version_id') !== versionId) {
        throw new BadRequestError(
          'Consent Gate: Mismatch de versão — O consentimento refere-se a outra versão da prática. Consent v2 não autoriza Assignment v3.',
        )
      }
      if (consent.getString('enrollment_id') !== enrollmentId) {
        throw new BadRequestError('Consent Gate: O consentimento pertence a outro enrollment.')
      }
      if (consent.getString('participant_user_id') !== participantUserId) {
        throw new BadRequestError('Consent Gate: O consentimento pertence a outro interagente.')
      }
    }
  }

  // Se tiver previous_assignment_id, marcar assignment anterior como superseded
  const prevId = a.getString('previous_assignment_id')
  if (prevId) {
    try {
      const prev = $app.findFirstRecordByData('cer_practice_assignments', 'id', prevId)
      if (prev) {
        prev.set('status', 'superseded')
        $app.save(prev)
      }
    } catch (_) {}
  }

  e.next()
}, 'cer_practice_assignments')

onRecordAfterCreateSuccess((e) => {
  e.next()
  try {
    const a = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : a.getString('assigned_by_user_id')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    const status = a.getString('status')
    let action = 'ASSIGNMENT_CREATED'
    if (status === 'active') {
      action = 'ASSIGNMENT_ACTIVATED'
    } else if (a.getString('previous_assignment_id')) {
      action = 'ASSIGNMENT_ADAPTED'
    }

    audit.set('action', action)
    audit.set('resource_type', 'cer_practice_assignments')
    audit.set('resource_id', a.id)
    audit.set('enrollment_id', a.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_assignment_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        assignment_id: a.id,
        practice_version_id: a.getString('practice_version_id'),
        status: status,
        care_cycle_id: a.getString('care_cycle_id'),
        previous_assignment_id: a.getString('previous_assignment_id') || undefined,
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_practice_assignments')

onRecordUpdate((e) => {
  const a = e.record
  const orig = a.original()
  if (!orig) {
    e.next()
    return
  }

  const origStatus = orig.getString('status')
  const newStatus = a.getString('status')

  // Imutabilidade das âncoras essenciais
  if (a.getString('practice_version_id') !== orig.getString('practice_version_id')) {
    throw new BadRequestError(
      'Não é permitido alterar practice_version_id de um Assignment existente.',
    )
  }
  if (a.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('Não é permitido alterar enrollment_id de um Assignment existente.')
  }
  if (a.getString('participant_user_id') !== orig.getString('participant_user_id')) {
    throw new BadRequestError(
      'Não é permitido alterar participant_user_id de um Assignment existente.',
    )
  }

  // Validar safe_title P0
  const safeTitle = (a.getString('participant_safe_title') || '').toLowerCase()
  const unsafeTerms = [
    'diagnóstico',
    'diagnostico',
    'transtorno',
    'fobia',
    'cid-10',
    'cid-11',
    'dsm-5',
    'patologia',
    'patológico',
  ]
  for (let i = 0; i < unsafeTerms.length; i++) {
    if (safeTitle.indexOf(unsafeTerms[i]) !== -1) {
      throw new BadRequestError(
        'Safe Title Violation: Termo clínico diagnóstico restrito não permitido no título do interagente: ' +
          unsafeTerms[i],
      )
    }
  }

  // Validar consistência de variant_id
  const variantId = a.getString('variant_id')
  const versionId = a.getString('practice_version_id')
  if (variantId && variantId !== orig.getString('variant_id')) {
    try {
      const variant = $app.findFirstRecordByData('cer_practice_variants', 'id', variantId)
      if (variant.getString('practice_version_id') !== versionId) {
        throw new BadRequestError(
          'Variant Gate: A variante informada não pertence à PracticeVersion ancorada no Assignment.',
        )
      }
    } catch (_) {
      throw new BadRequestError('variant_id inválido ou inexistente.')
    }
  }

  // Transição de status
  if (origStatus !== newStatus) {
    if (origStatus === 'superseded' || origStatus === 'completed') {
      throw new BadRequestError(
        'Assignment em status final (' + origStatus + ') não pode ter seu status alterado.',
      )
    }

    // Transição para active: passar por todos os gates de ativação (INLINE)
    if (newStatus === 'active') {
      const enrollmentId = a.getString('enrollment_id')
      const participantUserId = a.getString('participant_user_id')
      const priorityId = a.getString('care_plan_priority_id')
      const safetyCheckId = a.getString('safety_check_id')
      const operationalAcceptanceId = a.getString('operational_acceptance_id')
      const consentId = a.getString('consent_id')

      // 1. PRACTICE VERSION DEVE ESTAR ACTIVE
      let pv = null
      try {
        pv = $app.findFirstRecordByData('cer_practice_versions', 'id', versionId)
      } catch (_) {
        throw new BadRequestError('PracticeVersion vinculada não encontrada.')
      }
      const pvStatus = pv.getString('status')
      if (pvStatus === 'retired') {
        throw new BadRequestError(
          'Practice Gate: Prática aposentada (retired). Não é permitido ativar assignment com versão aposentada.',
        )
      }
      if (pvStatus === 'deprecated') {
        throw new BadRequestError(
          'Practice Gate: Prática depreciada (deprecated). Novas ativações são bloqueadas.',
        )
      }
      if (pvStatus !== 'active') {
        throw new BadRequestError(
          'Practice Gate: PracticeVersion deve estar com status "active" para ser ativada.',
        )
      }

      // 2. PRIORITY GATE
      let priority = null
      try {
        priority = $app.findFirstRecordByData('cer_care_plan_priorities', 'id', priorityId)
      } catch (_) {
        throw new BadRequestError('Prioridade de cuidado vinculada não encontrada.')
      }
      const priorityStatus = priority.getString('status')
      if (priorityStatus !== 'active' && priorityStatus !== 'active_pending_adaptation') {
        throw new BadRequestError(
          'Priority Gate: Prioridade de cuidado associada deve estar com status "active" ou "active_pending_adaptation". Status atual: ' +
            priorityStatus,
        )
      }

      let acceptance = null
      try {
        acceptance = $app.findFirstRecordByData(
          'cer_operational_acceptances',
          'id',
          operationalAcceptanceId,
        )
      } catch (_) {
        throw new BadRequestError('Aceite Operacional vinculado não encontrado.')
      }
      if (acceptance.getString('record_status') !== 'current') {
        throw new BadRequestError(
          'Priority Gate: Aceite Operacional deve ter record_status = "current".',
        )
      }
      const respType = acceptance.getString('response_type')
      if (respType !== 'accepted' && respType !== 'wants_to_try') {
        throw new BadRequestError(
          'Priority Gate: Aceite Operacional deve ter decisão "accepted" ou "wants_to_try". Valor atual: ' +
            respType,
        )
      }

      // 3. SAFETY GATE
      let sc = null
      try {
        sc = $app.findFirstRecordByData('cer_practice_safety_checks', 'id', safetyCheckId)
      } catch (_) {
        throw new BadRequestError('Safety Check vinculado não encontrado.')
      }
      if (sc.getString('record_status') !== 'current') {
        throw new BadRequestError('Safety Gate: Safety Check deve ter record_status = "current".')
      }
      if (sc.getString('practice_version_id') !== versionId) {
        throw new BadRequestError(
          'Safety Gate: Safety Check deve pertencer EXATAMENTE à mesma PracticeVersion do Assignment.',
        )
      }
      if (sc.getString('enrollment_id') !== enrollmentId) {
        throw new BadRequestError('Safety Gate: Safety Check pertence a outro enrollment.')
      }

      const outcome = sc.getString('outcome')
      if (outcome === 'requires_professional_review') {
        throw new BadRequestError(
          'Safety Gate: Ativação bloqueada — Safety Check requer revisão profissional prévia (requires_professional_review).',
        )
      }
      if (outcome === 'not_currently_indicated') {
        throw new BadRequestError(
          'Safety Gate: Ativação bloqueada — Prática não indicada atualmente para o interagente (not_currently_indicated).',
        )
      }
      if (outcome === 'insufficient_information') {
        throw new BadRequestError(
          'Safety Gate: Ativação bloqueada — Informações insuficientes de segurança para prosseguir (insufficient_information).',
        )
      }
      if (outcome === 'requires_supervision') {
        if (!sc.getString('professional_rationale')) {
          throw new BadRequestError(
            'Safety Gate: Prática com requires_supervision exige justificativa profissional formal de acompanhamento.',
          )
        }
      }

      // 4. CONSENT GATE
      const consentRequired = pv.getString('consent_required')
      if (consentRequired === 'required' || consentRequired === 'conditional') {
        if (!consentId) {
          throw new BadRequestError(
            'Consent Gate: PracticeVersion exige termo de consentimento livre e esclarecido prévio.',
          )
        }
        let consent = null
        try {
          consent = $app.findFirstRecordByData('cer_practice_consents', 'id', consentId)
        } catch (_) {
          throw new BadRequestError('Registro de consentimento vinculado não encontrado.')
        }

        if (consent.getString('record_status') !== 'current') {
          throw new BadRequestError(
            'Consent Gate: O termo de consentimento associado não está ativo (record_status != "current").',
          )
        }
        if (consent.getString('decision') !== 'accepted') {
          throw new BadRequestError(
            'Consent Gate: O termo de consentimento foi recusado ou não aceito formalmente.',
          )
        }
        if (consent.getString('practice_version_id') !== versionId) {
          throw new BadRequestError(
            'Consent Gate: Mismatch de versão — O consentimento refere-se a outra versão da prática. Consent v2 não autoriza Assignment v3.',
          )
        }
        if (consent.getString('enrollment_id') !== enrollmentId) {
          throw new BadRequestError('Consent Gate: O consentimento pertence a outro enrollment.')
        }
        if (consent.getString('participant_user_id') !== participantUserId) {
          throw new BadRequestError('Consent Gate: O consentimento pertence a outro interagente.')
        }
      }

      // Se estava pausado, verificar se o ciclo permite retomada
      if (origStatus === 'paused') {
        const cycleId = a.getString('care_cycle_id')
        try {
          const cycle = $app.findFirstRecordByData('cer_care_cycles', 'id', cycleId)
          const cycleStatus = cycle.getString('status')
          if (cycleStatus === 'closed' || cycleStatus === 'paused') {
            throw new BadRequestError(
              'Ciclo Não Elegível: Não é possível retomar (resume) uma prática em ciclo fechado ou pausado. Status do ciclo: ' +
                cycleStatus,
            )
          }
        } catch (err) {
          if (err.message && err.message.indexOf('Ciclo Não Elegível') !== -1) throw err
          throw new BadRequestError('Ciclo de cuidado associado não encontrado.')
        }
      }
    }

    // Transição para stopped exige motivo se não fornecido
    if (newStatus === 'stopped' && !a.getString('stop_reason_code')) {
      a.set('stop_reason_code', 'professional_interrupted')
    }
  }

  e.next()
}, 'cer_practice_assignments')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const a = e.record
    const orig = a.original()
    if (!orig) return

    const origStatus = orig.getString('status')
    const newStatus = a.getString('status')

    if (origStatus !== newStatus) {
      let action = ''
      if (newStatus === 'active' && origStatus === 'paused') action = 'ASSIGNMENT_RESUMED'
      else if (newStatus === 'active') action = 'ASSIGNMENT_ACTIVATED'
      else if (newStatus === 'paused') action = 'ASSIGNMENT_PAUSED'
      else if (newStatus === 'stopped') action = 'ASSIGNMENT_STOPPED'
      else if (newStatus === 'completed') action = 'ASSIGNMENT_COMPLETED'
      else if (newStatus === 'superseded') action = 'ASSIGNMENT_SUPERSEDED'

      if (action) {
        const auditCol = $app.findCollectionByNameOrId('audit_events')
        const audit = new Record(auditCol)
        const actorId = e.auth ? e.auth.id : a.getString('assigned_by_user_id')
        if (actorId) {
          audit.set('actor_user_id', actorId)
        }
        audit.set('action', action)
        audit.set('resource_type', 'cer_practice_assignments')
        audit.set('resource_id', a.id)
        audit.set('enrollment_id', a.getString('enrollment_id'))
        audit.set('timestamp', new Date().toISOString())
        audit.set('result', 'success')
        audit.set('request_context', 'server_assignment_lifecycle')
        audit.set(
          'metadata',
          JSON.stringify({
            assignment_id: a.id,
            practice_version_id: a.getString('practice_version_id'),
            previous_status: origStatus,
            new_status: newStatus,
            stop_reason_code: a.getString('stop_reason_code') || undefined,
          }),
        )
        $app.save(audit)
      }

      // Se assignment virou stopped ou paused, cancelar planner items futuros projetados não concluídos
      if (newStatus === 'stopped' || newStatus === 'paused') {
        try {
          const futureItems = $app.findRecordsByFilter(
            'cer_planner_items',
            'assignment_id = "' + a.id + '" && (status = "planned" || status = "active")',
            '',
            100,
            0,
          )
          for (let i = 0; i < futureItems.length; i++) {
            const item = futureItems[i]
            item.set('status', 'cancelled')
            $app.save(item)
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}, 'cer_practice_assignments')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Zero Delete Físico: Exclusão de PracticeAssignment não permitida. Use os estados stopped ou superseded.',
  )
}, 'cer_practice_assignments')
