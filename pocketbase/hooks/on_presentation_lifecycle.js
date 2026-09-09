// Hook server-side do Checkpoint 04C: Lifecycle e Imutabilidade de Presentations
// Collections: cer_knowledge_presentations
//
// Regras e Decisões Congeladas:
// 1. Estados: draft -> presented -> withdrawn, OU draft -> withdrawn.
// 2. Transição draft -> presented:
//    - Exige profissional humano autenticado com vínculo ativo no enrollment.
//    - Bloqueia explicitamente IA / system / service accounts.
//    - Carimba presented_at = now server-side se não estiver preenchido.
// 3. Imutabilidade após presented:
//    - presentation_text, knowledge_item_id, knowledge_version_number, knowledge_version_id,
//      enrollment_id, created_by_user_id, channel ficam IMUTÁVEIS.
//    - Somente transição de status para 'withdrawn' é permitida.
// 4. Imutabilidade após withdrawn:
//    - Nenhuma alteração é permitida (withdrawn não pode voltar a presented nem draft).
// 5. DELETE negado irrevogavelmente.
// 6. Consistência server-side entre KI, version number, version relation e enrollment.
// 7. Auditoria com metadados puramente técnicos (sem cópia do presentation_text ou dados confidenciais).

onRecordCreate((e) => {
  const pres = e.record
  const kiId = pres.getString('knowledge_item_id')
  const reqVerNumber = pres.getInt('knowledge_version_number')
  const reqVerId = pres.getString('knowledge_version_id')
  const status = pres.getString('status') || 'draft'
  const channel = pres.getString('channel')

  // Preencher created_by_user_id caso venha do usuário autenticado
  if (!pres.getString('created_by_user_id') && e.auth) {
    pres.set('created_by_user_id', e.auth.id)
  }

  // 1. Validar Knowledge Item existente
  let ki = null
  try {
    ki = $app.findFirstRecordByData('cer_knowledge_items', 'id', kiId)
  } catch (_) {
    throw new BadRequestError('knowledge_item_id inválido ou inexistente.')
  }

  const kiEnrollmentId = ki.getString('enrollment_id')
  // Preencher enrollment_id a partir do KI se ausente ou validar consistência
  if (!pres.getString('enrollment_id')) {
    pres.set('enrollment_id', kiEnrollmentId)
  } else if (pres.getString('enrollment_id') !== kiEnrollmentId) {
    throw new BadRequestError(
      'Inconsistência: enrollment_id da Presentation difere do enrollment do Knowledge Item.',
    )
  }

  // 2. Validar autorização do profissional criador
  if (e.auth) {
    const authId = e.auth.id

    // Verificar se o criador é participante do enrollment (participante não pode criar Presentation)
    let isParticipant = false
    try {
      const enr = $app.findFirstRecordByData('enrollments', 'id', kiEnrollmentId)
      const personId = enr.getString('person_id')
      if (personId) {
        const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
        if (pUser.id === authId) {
          isParticipant = true
        }
      }
    } catch (_) {}

    if (isParticipant) {
      throw new BadRequestError('Participante não tem permissão para criar Presentation.')
    }

    // Verificar vínculo profissional ativo
    let isProfLinked = false
    try {
      const links = $app.findRecordsByFilter(
        'professional_enrollment_access',
        'enrollment_id = "' +
          kiEnrollmentId +
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
      throw new BadRequestError(
        'Profissional sem vínculo ativo para o enrollment deste Knowledge Item.',
      )
    }

    // Verificar se não é conta de sistema / IA
    try {
      const roles = $app.findRecordsByFilter(
        'user_roles',
        'user_id = "' + authId + '" && is_active = true',
        '',
        10,
        0,
      )
      const hasProfRole = roles.some((r) => r.getString('role') === 'profissional')
      if (!hasProfRole) {
        throw new BadRequestError(
          'Somente profissionais humanos autorizados podem criar Presentation.',
        )
      }
    } catch (_) {}
  }

  // 3. Validar version_number e version_id em relação ao KI
  const currentKiVer = ki.getInt('version') || 1
  if (!reqVerNumber) {
    pres.set('knowledge_version_number', currentKiVer)
  } else if (reqVerNumber > currentKiVer || reqVerNumber < 1) {
    throw new BadRequestError(
      'knowledge_version_number inválido: versão indicada (' +
        reqVerNumber +
        ') não existe no Knowledge Item (versão atual: ' +
        currentKiVer +
        ').',
    )
  }

  // Se informou knowledge_version_id, validar consistência com cer_knowledge_item_versions
  if (reqVerId) {
    try {
      const verRec = $app.findFirstRecordByData('cer_knowledge_item_versions', 'id', reqVerId)
      if (verRec.getString('knowledge_item_id') !== kiId) {
        throw new BadRequestError(
          'knowledge_version_id aponta para snapshot de outro Knowledge Item.',
        )
      }
      const actualVerNum = pres.getInt('knowledge_version_number')
      if (verRec.getInt('version_number') !== actualVerNum) {
        throw new BadRequestError(
          'knowledge_version_id aponta para versão diferente de knowledge_version_number.',
        )
      }
    } catch (verErr) {
      if (verErr.message && verErr.message.indexOf('knowledge_version_id') !== -1) {
        throw verErr
      }
      throw new BadRequestError('knowledge_version_id informado não foi encontrado.')
    }
  }

  // 4. Validar status inicial
  // Se for criado diretamente como 'presented', validar profissional humano e carimbar presented_at
  if (status === 'presented') {
    if (!e.auth) {
      throw new BadRequestError('Apresentação direta exige profissional humano autenticado.')
    }
    // Negar se for IA / sistema
    if (
      e.auth.getString('name')?.toLowerCase().includes('bot') ||
      e.auth.getString('name')?.toLowerCase().includes('ia')
    ) {
      throw new BadRequestError('IA/Sistema não pode executar transição para presented.')
    }
    if (!pres.getString('presented_at')) {
      pres.set('presented_at', new Date().toISOString())
    }
  } else if (status !== 'draft') {
    // Nova Presentation só pode nascer em 'draft' ou 'presented'
    throw new BadRequestError(
      'Uma nova Presentation só pode ser criada com status "draft" ou "presented".',
    )
  }

  e.next()
}, 'cer_knowledge_presentations')

onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const pres = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = pres.getString('created_by_user_id') || (e.auth ? e.auth.id : '')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }

    const action =
      pres.getString('status') === 'presented' ? 'PRESENTATION_PRESENTED' : 'PRESENTATION_CREATED'
    audit.set('action', action)
    audit.set('resource_type', 'cer_knowledge_presentations')
    audit.set('resource_id', pres.id)
    audit.set('enrollment_id', pres.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_presentation_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        presentation_id: pres.id,
        knowledge_item_id: pres.getString('knowledge_item_id'),
        knowledge_version_number: pres.getInt('knowledge_version_number'),
        status: pres.getString('status'),
        channel: pres.getString('channel'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_knowledge_presentations')

onRecordUpdate((e) => {
  const pres = e.record
  const orig = pres.original()

  if (!orig) {
    e.next()
    return
  }

  const origStatus = orig.getString('status')
  const newStatus = pres.getString('status')

  // 1. Se já estava 'withdrawn', nada pode ser alterado
  if (origStatus === 'withdrawn') {
    throw new BadRequestError(
      'Uma Presentation retirada (withdrawn) não pode ser modificada nem reativada.',
    )
  }

  // 2. Se já estava 'presented':
  if (origStatus === 'presented') {
    // Não pode voltar para 'draft'
    if (newStatus === 'draft') {
      throw new BadRequestError(
        'Uma Presentation já apresentada não pode retornar para o estado de draft.',
      )
    }

    // Campos imutáveis após presented:
    if (pres.getString('presentation_text') !== orig.getString('presentation_text')) {
      throw new BadRequestError('presentation_text é imutável após a Presentation ser apresentada.')
    }
    if (pres.getString('knowledge_item_id') !== orig.getString('knowledge_item_id')) {
      throw new BadRequestError('knowledge_item_id é imutável após a Presentation ser apresentada.')
    }
    if (pres.getInt('knowledge_version_number') !== orig.getInt('knowledge_version_number')) {
      throw new BadRequestError(
        'knowledge_version_number é imutável após a Presentation ser apresentada.',
      )
    }
    if (pres.getString('knowledge_version_id') !== orig.getString('knowledge_version_id')) {
      throw new BadRequestError(
        'knowledge_version_id é imutável após a Presentation ser apresentada.',
      )
    }
    if (pres.getString('enrollment_id') !== orig.getString('enrollment_id')) {
      throw new BadRequestError('enrollment_id é imutável após a Presentation ser apresentada.')
    }
    if (pres.getString('created_by_user_id') !== orig.getString('created_by_user_id')) {
      throw new BadRequestError(
        'created_by_user_id é imutável após a Presentation ser apresentada.',
      )
    }
    if (pres.getString('channel') !== orig.getString('channel')) {
      throw new BadRequestError('channel é imutável após a Presentation ser apresentada.')
    }

    // Só é permitida a transição para 'withdrawn'
    if (newStatus !== 'presented' && newStatus !== 'withdrawn') {
      throw new BadRequestError(
        'Transição inválida para Presentation apresentada: "' + newStatus + '".',
      )
    }
  }

  // 3. Se estava 'draft':
  if (origStatus === 'draft') {
    // Proibir alteração de enrollment_id e created_by_user_id
    if (pres.getString('enrollment_id') !== orig.getString('enrollment_id')) {
      throw new BadRequestError('Não é permitido alterar enrollment_id de uma Presentation.')
    }

    // Validação de autoria: somente o autor pode editar o draft
    if (e.auth) {
      const authId = e.auth.id
      const authorId = orig.getString('created_by_user_id')
      if (authorId && authId !== authorId) {
        throw new BadRequestError(
          'Apenas o autor profissional pode editar esta Presentation em draft.',
        )
      }

      // Validar vínculo profissional ativo
      const enrollmentId = orig.getString('enrollment_id')
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
        throw new BadRequestError('Profissional sem vínculo ativo para o enrollment.')
      }

      // Se estiver transitando draft -> presented:
      if (newStatus === 'presented') {
        // Bloquear explicitamente IA / system / service accounts
        const userName = (e.auth.getString('name') || '').toLowerCase()
        const userEmail = (e.auth.getString('email') || '').toLowerCase()
        if (
          userName.includes('bot') ||
          userName.includes('ia') ||
          userEmail.includes('bot') ||
          userEmail.includes('system')
        ) {
          throw new BadRequestError(
            'IA/Sistema não pode executar transição para presented. Exige profissional humano autenticado.',
          )
        }

        // Verificar role profissional
        try {
          const roles = $app.findRecordsByFilter(
            'user_roles',
            'user_id = "' + authId + '" && is_active = true',
            '',
            10,
            0,
          )
          const hasProf = roles.some((r) => r.getString('role') === 'profissional')
          if (!hasProf) {
            throw new BadRequestError(
              'Transição para presented exige profissional humano autorizado.',
            )
          }
        } catch (_) {}

        // Carimbar presented_at
        if (!pres.getString('presented_at')) {
          pres.set('presented_at', new Date().toISOString())
        }
      }
    }
  }

  e.next()
}, 'cer_knowledge_presentations')

onRecordAfterUpdateSuccess((e) => {
  e.next()

  try {
    const pres = e.record
    const orig = pres.original()
    const origStatus = orig ? orig.getString('status') : ''
    const newStatus = pres.getString('status')

    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const actorId = e.auth ? e.auth.id : pres.getString('created_by_user_id')
    if (actorId) {
      audit.set('actor_user_id', actorId)
    }

    let action = 'PRESENTATION_UPDATED_DRAFT'
    if (origStatus === 'draft' && newStatus === 'presented') {
      action = 'PRESENTATION_PRESENTED'
    } else if (newStatus === 'withdrawn' && origStatus !== 'withdrawn') {
      action = 'PRESENTATION_WITHDRAWN'
    }

    audit.set('action', action)
    audit.set('resource_type', 'cer_knowledge_presentations')
    audit.set('resource_id', pres.id)
    audit.set('enrollment_id', pres.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_presentation_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        presentation_id: pres.id,
        knowledge_item_id: pres.getString('knowledge_item_id'),
        previous_status: origStatus,
        new_status: newStatus,
        channel: pres.getString('channel'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_knowledge_presentations')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Exclusão de Presentation não permitida. Altere o status para "withdrawn" para preservar o histórico.',
  )
}, 'cer_knowledge_presentations')
