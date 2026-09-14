// Hook server-side do Projeto CER V1: Lifecycle, Editorial Gate e Imutabilidade Material de cer_practice_versions
// Coleções monitoradas: cer_practice_versions, cer_practices
// Decisões Canônicas Lote 1:
// 1. Fluxo editorial: draft -> in_review -> approved -> active -> deprecated -> retired.
//    Transições permitidas:
//      - draft -> in_review
//      - in_review -> draft (devolvida para correção)
//      - in_review -> approved
//      - approved -> active
//      - active -> deprecated
//      - deprecated -> retired
//      - approved -> in_review (aprovação formalmente retirada antes de ativação)
//      - active -> retired (recall imediato por segurança)
//    Transições NUNCA permitidas:
//      - draft -> active; draft -> approved; in_review -> active; approved -> draft;
//      - active -> draft; active -> in_review; retired -> qualquer outro estado;
//      - criação direta em qualquer estado diferente de 'draft'.
// 2. Gates de Aprovação (in_review -> approved):
//    - author_user_id preenchido;
//    - reviewer_user_id preenchido;
//    - reviewer_user_id ≠ author_user_id;
//    - reviewed_at preenchido;
//    - safety_reviewed_at preenchido.
// 3. Gates de Publicação / Ativação (approved -> active):
//    - Versão DEVE vir do estado 'approved';
//    - author_user_id preenchido;
//    - reviewer_user_id preenchido;
//    - reviewer_user_id ≠ author_user_id;
//    - reviewed_at preenchido;
//    - safety_reviewed_at preenchido;
//    - review_due_at preenchido, data válida e no FUTURO no momento da ativação;
//    - ao menos 1 evidence record revisado (reviewed_at preenchido em cer_practice_evidence);
//    - static safety profile válido (registro em cer_practice_safety_profiles com reviewed_at preenchido);
//    - Para intensity high ou expansive: todos os requisitos de Expansão com Enraizamento preenchidos no safety profile.
// 4. Imutabilidade server-side dos campos materiais:
//    - Versões em 'approved', 'active', 'deprecated' ou 'retired' NÃO podem ter campos materiais alterados diretamente.
//    - Metadados exclusivamente operacionais permitidos conforme transição: status, reviewer_user_id, reviewed_at, safety_reviewed_at, review_due_at.
// 5. Zero Delete Físico.
// 6. Auditoria de eventos e Recall de assignments em caso de retired.

onRecordCreate((e) => {
  const version = e.record
  const status = version.getString('status') || 'draft'

  if (!version.getString('author_user_id') && e.auth) {
    version.set('author_user_id', e.auth.id)
  }

  // Criação direta só é permitida em status "draft"
  if (status !== 'draft') {
    throw new BadRequestError(
      'Criação de PracticeVersion permitida exclusivamente em status "draft". Estados editoriais subsequentes exigem submissão e revisão formal.',
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

  const origStatus = orig.getString('status') || 'draft'
  const newStatus = version.getString('status') || 'draft'
  const versionId = version.id

  // 1. Imutabilidade absoluta da âncora relacional e numeração
  if (version.getString('practice_id') !== orig.getString('practice_id')) {
    throw new BadRequestError('Não é permitido alterar practice_id de uma PracticeVersion.')
  }
  if (version.getInt('version_number') !== orig.getInt('version_number')) {
    throw new BadRequestError(
      'Não é permitido alterar version_number de uma PracticeVersion existente.',
    )
  }

  // 2. Imutabilidade Material dos Conteúdos e Parâmetros Clínicos
  // Em approved, active, deprecated e retired, qualquer alteração material é proibida no servidor.
  const isPostApproved =
    origStatus === 'approved' ||
    origStatus === 'active' ||
    origStatus === 'deprecated' ||
    origStatus === 'retired'

  if (isPostApproved) {
    const materialFields = [
      'previous_version_id',
      'participant_title',
      'participant_summary',
      'description',
      'instructions',
      'preparation',
      'stop_conditions',
      'grounding',
      'integration',
      'intent_goal',
      'context_tags',
      'other_context_text',
      'duration',
      'frequency',
      'repetitions',
      'quantity',
      'time_window',
      'progression',
      'rest',
      'max_exposure',
      'guidance_requirements',
      'intensity',
      'consent_required',
      'author_user_id',
    ]

    for (let i = 0; i < materialFields.length; i++) {
      const field = materialFields[i]
      // Comparação de valor string/json
      const origVal = orig.get(field)
      const newVal = version.get(field)
      const origStr =
        typeof origVal === 'object' ? JSON.stringify(origVal || '') : String(origVal || '')
      const newStr =
        typeof newVal === 'object' ? JSON.stringify(newVal || '') : String(newVal || '')

      if (origStr !== newStr) {
        throw new BadRequestError(
          'Imutabilidade Material Violada: A versão está em estado pós-aprovação ("' +
            origStatus +
            '") e o campo material "' +
            field +
            '" não pode ser alterado. Alterações materiais exigem a criação de uma nova PracticeVersion.',
        )
      }
    }
  }

  // 3. Validação da Matriz de Transições de Status
  if (origStatus !== newStatus) {
    // Matriz de transições permitidas
    const allowedTransitions = {
      draft: ['in_review'],
      in_review: ['draft', 'approved'],
      approved: ['active', 'in_review'],
      active: ['deprecated', 'retired'],
      deprecated: ['retired'],
      retired: [],
    }

    const validTargets = allowedTransitions[origStatus] || []
    if (validTargets.indexOf(newStatus) === -1) {
      throw new BadRequestError(
        'Transição de status inválida: não é permitido alterar PracticeVersion de "' +
          origStatus +
          '" para "' +
          newStatus +
          '".',
      )
    }

    // GATES ESPECÍFICOS DE CADA TRANSIÇÃO

    // GATE 3.1: in_review -> approved (Aprovação Metodológica e de Segurança)
    if (newStatus === 'approved') {
      const authorId = version.getString('author_user_id')
      const reviewerId = version.getString('reviewer_user_id')
      const reviewedAt = version.getString('reviewed_at')
      const safetyReviewedAt = version.getString('safety_reviewed_at')

      if (!authorId) {
        throw new BadRequestError(
          'Review Gate: PracticeVersion exige autor designado (author_user_id).',
        )
      }
      if (!reviewerId) {
        throw new BadRequestError(
          'Review Gate: Aprovação exige revisor formalmente designado (reviewer_user_id).',
        )
      }
      if (authorId === reviewerId) {
        throw new BadRequestError(
          'Review Gate: Revisor deve ser obrigatoriamente um profissional diferente do autor (reviewer ≠ author).',
        )
      }
      if (!reviewedAt || !safetyReviewedAt) {
        throw new BadRequestError(
          'Review Gate: Aprovação exige datas de revisão metodológica e de segurança preenchidas.',
        )
      }
    }

    // GATE 3.2: approved -> active (Publication Gate & Review Due At)
    if (newStatus === 'active') {
      const authorId = version.getString('author_user_id')
      const reviewerId = version.getString('reviewer_user_id')
      const reviewedAt = version.getString('reviewed_at')
      const safetyReviewedAt = version.getString('safety_reviewed_at')
      const reviewDueAtStr = version.getString('review_due_at')

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

      // Validação de review_due_at
      if (!reviewDueAtStr) {
        throw new BadRequestError(
          'Publication Gate: review_due_at é obrigatório para ativar uma PracticeVersion.',
        )
      }
      const dueDate = new Date(reviewDueAtStr)
      if (isNaN(dueDate.getTime())) {
        throw new BadRequestError('Publication Gate: review_due_at deve ser uma data válida.')
      }
      if (dueDate.getTime() <= Date.now()) {
        throw new BadRequestError(
          'Publication Gate: review_due_at deve estar no futuro no momento da ativação.',
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
      if (newStatus === 'in_review') {
        action = 'PRACTICE_VERSION_SUBMITTED_FOR_REVIEW'
      } else if (newStatus === 'approved') {
        action = 'PRACTICE_VERSION_APPROVED'
      } else if (newStatus === 'active') {
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
            review_due_at: version.getString('review_due_at') || undefined,
          }),
        )
        $app.save(audit)
      }

      // Se uma PracticeVersion for aposentada (retired = recall),
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
