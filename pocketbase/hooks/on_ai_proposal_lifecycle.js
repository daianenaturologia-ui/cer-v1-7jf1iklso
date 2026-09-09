// Hook server-side do Checkpoint 05: Lifecycle, Imutabilidade e Governança de cer_ai_proposals
// Regras e Decisões Congeladas Build 05:
// 1. Estados permitidos: pending_review | approved | discarded | observing
// 2. proposal_text preserva o output original da IA:
//    - Após criação, proposal_text é IMUTÁVEL (não pode ser reescrito silenciosamente)
// 3. Revisão profissional:
//    - Profissional humano autenticado com vínculo ativo no enrollment
//    - Principal de IA/sistema NÃO pode revisar
//    - Transição de status exige reviewed_by_user_id preenchido com o profissional e reviewed_at com timestamp
//    - approved, edited_and_approved, discarded, observing
//    - edited_text opcional, preserva proposal_text intacto
// 4. Imutabilidade estrutural:
//    - enrollment_id, requested_by_user_id, proposal_type são IMUTÁVEIS após criação
// 5. DELETE negado irrevogavelmente
// 6. Auditoria de eventos AI_PROPOSAL_CREATED, AI_PROPOSAL_REVIEWED (sem cópia integral de textos confidenciais)

onRecordCreate((e) => {
  const prop = e.record
  const enrollmentId = prop.getString('enrollment_id')
  const status = prop.getString('status') || 'pending_review'

  // Preencher requested_by_user_id se ausente e autenticado
  if (!prop.getString('requested_by_user_id') && e.auth) {
    prop.set('requested_by_user_id', e.auth.id)
  }

  // Preencher status padrão
  if (!prop.getString('status')) {
    prop.set('status', 'pending_review')
  }

  // Nova Proposal só pode nascer em 'pending_review'
  if (status !== 'pending_review') {
    throw new BadRequestError(
      'Uma nova AI Proposal só pode ser criada com status "pending_review".',
    )
  }

  // Validar autorização do profissional invocador
  if (e.auth) {
    const authId = e.auth.id

    // Verificar vínculo profissional ativo com o enrollment
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
      if (links && links.length > 0) {
        isProfLinked = true
      }
    } catch (_) {}

    if (!isProfLinked) {
      throw new BadRequestError('Profissional sem vínculo ativo para o enrollment desta Proposal.')
    }
  }

  e.next()
}, 'cer_ai_proposals')

onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const prop = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = prop.getString('requested_by_user_id') || (e.auth ? e.auth.id : '')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    audit.set('action', 'AI_PROPOSAL_CREATED')
    audit.set('resource_type', 'cer_ai_proposals')
    audit.set('resource_id', prop.id)
    audit.set('enrollment_id', prop.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_ai_proposal_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        proposal_id: prop.id,
        proposal_type: prop.getString('proposal_type'),
        status: prop.getString('status'),
        framework_id: prop.getString('framework_id') || undefined,
        purpose: prop.getString('purpose') || undefined,
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_ai_proposals')

onRecordUpdate((e) => {
  const prop = e.record
  const orig = prop.original()

  if (!orig) {
    e.next()
    return
  }

  // 1. Proibir alteração de campos estruturais
  if (prop.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('Não é permitido alterar enrollment_id de uma Proposal.')
  }
  if (prop.getString('requested_by_user_id') !== orig.getString('requested_by_user_id')) {
    throw new BadRequestError('Não é permitido alterar requested_by_user_id de uma Proposal.')
  }
  if (prop.getString('proposal_type') !== orig.getString('proposal_type')) {
    throw new BadRequestError('Não é permitido alterar proposal_type de uma Proposal.')
  }

  // 2. proposal_text é IMUTÁVEL (imutabilidade do output original da IA)
  if (prop.getString('proposal_text') !== orig.getString('proposal_text')) {
    throw new BadRequestError(
      'proposal_text é estritamente imutável. Para ajustes profissionais, use edited_text.',
    )
  }

  const origStatus = orig.getString('status')
  const newStatus = prop.getString('status')

  // 3. Validação do revisor humano
  if (origStatus !== newStatus || prop.getString('review_action')) {
    if (!e.auth) {
      throw new BadRequestError('Revisão de Proposal exige profissional humano autenticado.')
    }

    const authUser = e.auth
    const authId = authUser.id

    // Gate estrutural humano: person_id real
    const personId = authUser.getString('person_id')
    if (!personId) {
      throw new BadRequestError(
        'Contas de sistema ou automações sem registro de pessoa física (person_id) não podem revisar Proposals.',
      )
    }
    try {
      const pRecord = $app.findFirstRecordByData('persons', 'id', personId)
      if (!pRecord || !pRecord.getString('full_name')) {
        throw new BadRequestError(
          'Principal de revisão deve ser uma pessoa humana física cadastrada.',
        )
      }
    } catch (_) {
      throw new BadRequestError('Registro de pessoa humana física do revisor não foi encontrado.')
    }

    // Role profissional
    let hasProfRole = false
    try {
      const roles = $app.findRecordsByFilter(
        'user_roles',
        'user_id = "' + authId + '" && is_active = true',
        '',
        10,
        0,
      )
      hasProfRole = roles.some((r) => r.getString('role') === 'profissional')
    } catch (_) {}

    if (!hasProfRole) {
      throw new BadRequestError('Somente profissional com role ativo pode revisar Proposals.')
    }

    // Vínculo ativo com o enrollment da Proposal
    const enrollmentId = orig.getString('enrollment_id')
    let isLinked = false
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
      if (links && links.length > 0) {
        isLinked = true
      }
    } catch (_) {}

    if (!isLinked) {
      throw new BadRequestError('Profissional sem vínculo ativo para o enrollment desta Proposal.')
    }

    // Preencher campos de auditoria de revisão
    prop.set('reviewed_by_user_id', authId)
    if (!prop.getString('reviewed_at')) {
      prop.set('reviewed_at', new Date().toISOString())
    }
  }

  e.next()
}, 'cer_ai_proposals')

onRecordAfterUpdateSuccess((e) => {
  e.next()

  try {
    const prop = e.record
    const orig = prop.original()
    const origStatus = orig ? orig.getString('status') : ''
    const newStatus = prop.getString('status')

    if (origStatus !== newStatus || prop.getString('review_action')) {
      const auditCol = $app.findCollectionByNameOrId('audit_events')
      const audit = new Record(auditCol)
      const actorId = e.auth ? e.auth.id : prop.getString('reviewed_by_user_id')
      if (actorId) {
        audit.set('actor_user_id', actorId)
      }

      audit.set('action', 'AI_PROPOSAL_REVIEWED')
      audit.set('resource_type', 'cer_ai_proposals')
      audit.set('resource_id', prop.id)
      audit.set('enrollment_id', prop.getString('enrollment_id'))
      audit.set('timestamp', new Date().toISOString())
      audit.set('result', 'success')
      audit.set('request_context', 'server_ai_proposal_lifecycle')
      audit.set(
        'metadata',
        JSON.stringify({
          proposal_id: prop.id,
          proposal_type: prop.getString('proposal_type'),
          previous_status: origStatus,
          new_status: newStatus,
          review_action: prop.getString('review_action'),
          has_edited_text: !!prop.getString('edited_text'),
        }),
      )
      $app.save(audit)
    }
  } catch (_) {}
}, 'cer_ai_proposals')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Exclusão de AI Proposal não permitida. Altere o status para "discarded".',
  )
}, 'cer_ai_proposals')
