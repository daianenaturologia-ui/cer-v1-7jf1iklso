// Hook server-side do Build 08C: Lifecycle e Publication Gate de cer_practice_versions
// Coleções monitoradas: cer_practice_versions, cer_practices
// Regras e Decisões Congeladas:
// 1. Version só pode ir para active com:
//    - author_user_id preenchido;
//    - reviewer_user_id preenchido;
//    - reviewer_user_id ≠ author_user_id;
//    - reviewed_at preenchido;
//    - safety_reviewed_at preenchido;
//    - ao menos 1 evidence record revisado (reviewed_at preenchido em cer_practice_evidence);
//    - static safety profile válido (registro em cer_practice_safety_profiles com reviewed_at preenchido);
//    - Para intensity high ou expansive: todos os requisitos de Expansão com Enraizamento preenchidos no safety profile.
// 2. Transições de lifecycle: draft -> active -> deprecated -> retired.
// 3. SEM TOCAR CONSENTS: a publicação de uma nova versão NÃO altera consents históricos da versão anterior.
// 4. DELETE negado irrevogavelmente.
// 5. Auditoria de eventos: PRACTICE_VERSION_PUBLISHED, PRACTICE_VERSION_DEPRECATED, PRACTICE_RETIRED.

onRecordCreate((e) => {
  const version = e.record
  const status = version.getString('status') || 'draft'

  if (!version.getString('author_user_id') && e.auth) {
    version.set('author_user_id', e.auth.id)
  }

  // Não pode nascer direto como deprecated ou retired
  if (status === 'deprecated' || status === 'retired') {
    throw new BadRequestError(
      'Uma nova PracticeVersion deve ser criada em status "draft" ou "active".',
    )
  }

  if (status === 'active') {
    // Validar Publication Gate
    const authorId = version.getString('author_user_id')
    const reviewerId = version.getString('reviewer_user_id')
    const reviewedAt = version.getString('reviewed_at')
    const safetyReviewedAt = version.getString('safety_reviewed_at')

    if (!authorId || !reviewerId) {
      throw new BadRequestError(
        'Publication Gate: PracticeVersion ativa exige autor e revisor formalmente designados.',
      )
    }
    if (authorId === reviewerId) {
      throw new BadRequestError(
        'Publication Gate: Revisor deve ser obrigatoriamente um profissional diferente do autor (reviewer ≠ author).',
      )
    }
    if (!reviewedAt || !safetyReviewedAt) {
      throw new BadRequestError(
        'Publication Gate: PracticeVersion ativa exige datas de revisão metodológica e de segurança preenchidas.',
      )
    }
    // Nota: Como é create, profiles e evidence vinculados ao ID da version ainda não existem no banco;
    // a prática recomendada no workflow é criar como draft e ativar via update após anexar profiles e evidências.
    // Se tentar ativar no create sem registro prévio, bloqueia.
    throw new BadRequestError(
      'Publication Gate: Recomenda-se criar a PracticeVersion como "draft", anexar Evidence e Safety Profile revisados, e então ativá-la.',
    )
  }

  e.next()
}, 'cer_practice_versions')

onRecordUpdate((e) => {
  const version = e.record
  const orig = version.original()
  if (!orig) {
    e.next()
    return
  }

  const origStatus = orig.getString('status')
  const newStatus = version.getString('status')
  const versionId = version.id

  // 1. Imutabilidade estrutural da âncora
  if (version.getString('practice_id') !== orig.getString('practice_id')) {
    throw new BadRequestError('Não é permitido alterar practice_id de uma PracticeVersion.')
  }
  if (version.getInt('version_number') !== orig.getInt('version_number')) {
    throw new BadRequestError(
      'Não é permitido alterar version_number de uma PracticeVersion existente.',
    )
  }

  // 2. Transições de status e Publication Gate
  if (origStatus !== newStatus) {
    if (newStatus === 'active') {
      const authorId = version.getString('author_user_id')
      const reviewerId = version.getString('reviewer_user_id')
      const reviewedAt = version.getString('reviewed_at')
      const safetyReviewedAt = version.getString('safety_reviewed_at')

      if (!authorId || !reviewerId) {
        throw new BadRequestError(
          'Publication Gate: PracticeVersion ativa exige autor e revisor formalmente designados.',
        )
      }
      if (authorId === reviewerId) {
        throw new BadRequestError(
          'Publication Gate: Revisor deve ser obrigatoriamente um profissional diferente do autor (reviewer ≠ author).',
        )
      }
      if (!reviewedAt || !safetyReviewedAt) {
        throw new BadRequestError(
          'Publication Gate: PracticeVersion ativa exige datas de revisão metodológica e de segurança preenchidas.',
        )
      }

      // Validar ao menos 1 evidence revisado
      let hasReviewedEvidence = false
      try {
        const evList = $app.findRecordsByFilter(
          'cer_practice_evidence',
          'practice_version_id = "' + versionId + '" && reviewed_at != ""',
          '',
          1,
          0,
        )
        if (evList && evList.length > 0) {
          hasReviewedEvidence = true
        }
      } catch (_) {}

      if (!hasReviewedEvidence) {
        throw new BadRequestError(
          'Publication Gate: Ativação exige ao menos um registro de evidência revisado (reviewed_at preenchido).',
        )
      }

      // Validar static safety profile válido
      let safetyProfile = null
      try {
        safetyProfile = $app.findFirstRecordByData(
          'cer_practice_safety_profiles',
          'practice_version_id',
          versionId,
        )
      } catch (_) {}

      if (!safetyProfile) {
        throw new BadRequestError(
          'Publication Gate: Ativação exige Static Safety Profile cadastrado.',
        )
      }
      if (!safetyProfile.getString('reviewed_at')) {
        throw new BadRequestError(
          'Publication Gate: Static Safety Profile deve estar revisado (reviewed_at preenchido).',
        )
      }

      // Validação de Expansão com Enraizamento para intensidade high ou expansive
      const intensity = version.getString('intensity')
      if (intensity === 'high' || intensity === 'expansive') {
        const missingFields = []
        if (!safetyProfile.getString('informed_choice')) missingFields.push('informed_choice')
        if (!safetyProfile.getString('orientation')) missingFields.push('orientation')
        if (!safetyProfile.getString('body_contact_policy'))
          missingFields.push('body_contact_policy')
        if (!safetyProfile.getString('capacity_to_stop')) missingFields.push('capacity_to_stop')
        if (!safetyProfile.getString('return_grounding')) missingFields.push('return_grounding')
        if (!safetyProfile.getString('integration')) missingFields.push('integration')
        if (!safetyProfile.getString('daily_life_reorientation'))
          missingFields.push('daily_life_reorientation')
        if (!safetyProfile.getString('supervision_requirements'))
          missingFields.push('supervision_requirements')
        if (!safetyProfile.getString('aftercare')) missingFields.push('aftercare')
        if (!safetyProfile.getString('escalation_pathway')) missingFields.push('escalation_pathway')

        // Validar contraindicações vinculadas em cer_practice_safety_rules
        let hasContraindications = false
        try {
          const rules = $app.findRecordsByFilter(
            'cer_practice_safety_rules',
            'practice_version_id = "' +
              versionId +
              '" && (rule_type = "absolute_contraindication" || rule_type = "relative_contraindication")',
            '',
            1,
            0,
          )
          if (rules && rules.length > 0) {
            hasContraindications = true
          }
        } catch (_) {}

        if (!hasContraindications) {
          missingFields.push('contraindicações vinculadas em safety_rules')
        }

        if (missingFields.length > 0) {
          throw new BadRequestError(
            'Publication Gate (Expansão com Enraizamento): Para intensidades high/expansive, são obrigatórios: ' +
              missingFields.join(', ') +
              '.',
          )
        }
      }
    }
  }

  e.next()
}, 'cer_practice_versions')

onRecordAfterUpdateSuccess((e) => {
  e.next()
  try {
    const version = e.record
    const orig = version.original()
    if (!orig) return

    const origStatus = orig.getString('status')
    const newStatus = version.getString('status')

    if (origStatus !== newStatus) {
      let action = ''
      if (newStatus === 'active') {
        action = 'PRACTICE_VERSION_PUBLISHED'
      } else if (newStatus === 'deprecated') {
        action = 'PRACTICE_VERSION_DEPRECATED'
      } else if (newStatus === 'retired') {
        action = 'PRACTICE_RETIRED'
      }

      if (action) {
        const auditCol = $app.findCollectionByNameOrId('audit_events')
        const audit = new Record(auditCol)
        const actorId = e.auth ? e.auth.id : version.getString('reviewer_user_id')
        if (actorId) {
          audit.set('actor_user_id', actorId)
        }
        audit.set('action', action)
        audit.set('resource_type', 'cer_practice_versions')
        audit.set('resource_id', version.id)
        audit.set('timestamp', new Date().toISOString())
        audit.set('result', 'success')
        audit.set('request_context', 'server_practice_version_lifecycle')
        audit.set(
          'metadata',
          JSON.stringify({
            practice_id: version.getString('practice_id'),
            version_number: version.getInt('version_number'),
            previous_status: origStatus,
            new_status: newStatus,
            intensity: version.getString('intensity'),
          }),
        )
        $app.save(audit)
      }

      // Build 08D: Se uma PracticeVersion for aposentada (retired = recall),
      // interromper com segurança assignments ativas e cancelar planner items futuros
      if (newStatus === 'retired') {
        try {
          const activeAssignments = $app.findRecordsByFilter(
            'cer_practice_assignments',
            'practice_version_id = "' +
              version.id +
              '" && (status = "active" || status = "draft" || status = "paused")',
            '',
            100,
            0,
          )
          for (let i = 0; i < activeAssignments.length; i++) {
            const asgn = activeAssignments[i]
            asgn.set('status', 'stopped')
            asgn.set('stop_reason_code', 'practice_retired')
            $app.save(asgn)

            // Cancelar itens projetados/futuros do planner para esta assignment
            try {
              const items = $app.findRecordsByFilter(
                'cer_planner_items',
                'assignment_id = "' + asgn.id + '" && (status = "planned" || status = "active")',
                '',
                100,
                0,
              )
              for (let j = 0; j < items.length; j++) {
                const item = items[j]
                item.set('status', 'cancelled')
                $app.save(item)
              }
            } catch (_) {}
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}, 'cer_practice_versions')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Zero Delete Físico: Exclusão de PracticeVersion não permitida. Use os estados deprecated ou retired.',
  )
}, 'cer_practice_versions')
