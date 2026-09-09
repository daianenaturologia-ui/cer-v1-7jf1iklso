// Hook server-side do Checkpoint 03B: Conhecimento Longitudinal e Regras de Associação
// Validações rigorosas de Integridade, Proveniência, Derived Privacy e Auditoria:
// - Associação: valida que não mistura enrollments diferentes
// - Evidência de Associação: valida se signal_id pertence ao mesmo enrollment_id da associação
// - Derived Privacy: Association não pode ter access_class mais permissiva que as evidências associadas
// - Profissional não pode associar evidence participant_private
// - Participante não pode associar evidence professional_private
// - Audita ASSOCIATION_CREATED com metadados puramente técnicos (sem cópia de texto)

onRecordCreate((e) => {
  const assoc = e.record
  const enrollmentId = assoc.getString('enrollment_id')
  const accessClass = assoc.getString('access_class') || 'shared_care'

  // Preencher created_by_user_id caso venha do usuário autenticado
  if (!assoc.getString('created_by_user_id') && e.auth) {
    assoc.set('created_by_user_id', e.auth.id)
  }

  // Preencher status padrão se ausente
  if (!assoc.getString('status')) {
    assoc.set('status', 'active')
  }

  // Validar se o usuário que está criando tem permissão de acordo com a access_class
  if (e.auth) {
    const authId = e.auth.id

    // Verificar se o usuário é o participante do enrollment
    let isParticipant = false
    try {
      const enr = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
      const personId = enr.getString('person_id')
      if (personId) {
        const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
        if (pUser.id === authId) {
          isParticipant = true
        }
      }
    } catch (_) {}

    // Verificar se é profissional com vínculo ativo
    let isProfessionalLinked = false
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
        isProfessionalLinked = true
      }
    } catch (_) {}

    if (!isParticipant && !isProfessionalLinked) {
      throw new BadRequestError('Usuário sem vínculo autorizado para este enrollment.')
    }

    // Se profissional, não pode criar association participant_private
    if (!isParticipant && isProfessionalLinked) {
      if (accessClass === 'participant_private') {
        throw new BadRequestError('Profissional não pode criar registro participant_private.')
      }
    }

    // Se participante, não pode criar association professional_private
    if (isParticipant) {
      if (accessClass === 'professional_private') {
        throw new BadRequestError('Participante não pode criar registro professional_private.')
      }
    }
  }

  e.next()
}, 'cer_associations')

onRecordUpdate((e) => {
  const assoc = e.record
  const orig = assoc.original()

  if (orig) {
    // 1. Proibir alteração de enrollment_id (CER-03C-03)
    if (assoc.getString('enrollment_id') !== orig.getString('enrollment_id')) {
      throw new BadRequestError('Não é permitido alterar o enrollment_id da associação.')
    }

    // 2. Proibir alteração de concept_key (CER-03C-03)
    const newConcept = assoc.getString('concept_key')
    const origConcept = orig.getString('concept_key')
    if (newConcept && origConcept && newConcept !== origConcept) {
      throw new BadRequestError(
        'Não é permitido alterar o concept_key da associação após a criação.',
      )
    }

    // 3. Proibir alteração de association_type (CER-03C-03)
    const newType = assoc.getString('association_type')
    const origType = orig.getString('association_type')
    if (newType && origType && newType !== origType) {
      throw new BadRequestError(
        'Não é permitido alterar o association_type da associação após a criação.',
      )
    }

    // 4. Derived Privacy / Anti-Privacy Laundering (CER-03C-01)
    // NENHUMA Association pode, por UPDATE, tornar-se mais permissiva do que as evidências que efetivamente a sustentam.
    const newAccess = assoc.getString('access_class') || 'shared_care'
    const origAccess = orig.getString('access_class') || 'shared_care'

    // Buscar todas as evidências ligadas a esta associação em cer_association_evidence
    let evRecords = []
    try {
      evRecords = $app.findRecordsByFilter(
        'cer_association_evidence',
        'association_id = "' + assoc.id + '"',
        '',
        100,
        0,
      )
    } catch (_) {}

    if (evRecords && evRecords.length > 0) {
      for (let i = 0; i < evRecords.length; i++) {
        const evRec = evRecords[i]
        const sigId = evRec.getString('signal_id')
        let sig = null
        try {
          sig = $app.findFirstRecordByData('cer_signals', 'id', sigId)
        } catch (_) {}

        if (sig) {
          const sigAccess = sig.getString('access_class') || 'shared_care'

          // Se a evidência é participant_private, a associação SÓ pode ser participant_private
          if (sigAccess === 'participant_private' && newAccess !== 'participant_private') {
            throw new BadRequestError(
              'Violação de privacidade derivada (anti-laundering): a associação está vinculada a evidência participant_private e não pode ter access_class "' +
                newAccess +
                '".',
            )
          }

          // Se a evidência é professional_private, a associação NÃO pode ser participant_shared, participant_private ou shared_care
          if (
            sigAccess === 'professional_private' &&
            (newAccess === 'participant_private' ||
              newAccess === 'participant_shared' ||
              newAccess === 'shared_care')
          ) {
            throw new BadRequestError(
              'Violação de privacidade derivada (anti-laundering): a associação está vinculada a evidência professional_private e não pode ter access_class visível ao participante ("' +
                newAccess +
                '").',
            )
          }
        }
      }
    }

    // Validar também os bloqueios de autorização de acordo com o autor do update (se autenticado)
    if (e.auth) {
      const authId = e.auth.id
      const enrollmentId = assoc.getString('enrollment_id')

      let isParticipant = false
      try {
        const enr = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
        const personId = enr.getString('person_id')
        if (personId) {
          const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
          if (pUser.id === authId) {
            isParticipant = true
          }
        }
      } catch (_) {}

      let isProfessionalLinked = false
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
          isProfessionalLinked = true
        }
      } catch (_) {}

      if (!isParticipant && !isProfessionalLinked) {
        throw new BadRequestError('Usuário sem vínculo autorizado para este enrollment.')
      }

      if (!isParticipant && isProfessionalLinked && newAccess === 'participant_private') {
        throw new BadRequestError(
          'Profissional não pode definir registro como participant_private.',
        )
      }

      if (isParticipant && newAccess === 'professional_private') {
        throw new BadRequestError(
          'Participante não pode definir registro como professional_private.',
        )
      }
    }
  }

  e.next()
}, 'cer_associations')

// Auditoria para ASSOCIATION_CREATED
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const assoc = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_events')
    const audit = new Record(auditCol)
    const creatorId = assoc.getString('created_by_user_id')
    if (creatorId) {
      audit.set('actor_user_id', creatorId)
    }
    audit.set('action', 'ASSOCIATION_CREATED')
    audit.set('resource_type', 'cer_associations')
    audit.set('resource_id', assoc.id)
    audit.set('enrollment_id', assoc.getString('enrollment_id'))
    audit.set('timestamp', new Date().toISOString())
    audit.set('result', 'success')
    audit.set('request_context', 'server_association_lifecycle')
    audit.set(
      'metadata',
      JSON.stringify({
        association_id: assoc.id,
        concept_key: assoc.getString('concept_key'),
        association_type: assoc.getString('association_type'),
        temporality: assoc.getString('temporality'),
        access_class: assoc.getString('access_class'),
      }),
    )
    $app.save(audit)
  } catch (_) {}
}, 'cer_associations')

// Validações em cer_association_evidence:
// 1. Cross-enrollment check: signal_id deve pertencer ao mesmo enrollment da association_id
// 2. Derived Privacy check: association_id não pode ter access_class mais permissiva que o signal
//    - Se signal for participant_private, association NÃO pode ser shared_care nem participant_shared nem professional_private
//    - Se signal for professional_private, association NÃO pode ser participant_shared nem participant_private
// 3. Se profissional estiver inserindo evidence, o signal NÃO pode ser participant_private
// 4. Se participante estiver inserindo evidence, o signal NÃO pode ser professional_private
onRecordCreate((e) => {
  const ev = e.record
  const assocId = ev.getString('association_id')
  const signalId = ev.getString('signal_id')

  let assoc = null
  let signal = null

  try {
    assoc = $app.findFirstRecordByData('cer_associations', 'id', assocId)
  } catch (_) {
    throw new BadRequestError('association_id inválido ou inexistente.')
  }

  try {
    signal = $app.findFirstRecordByData('cer_signals', 'id', signalId)
  } catch (_) {
    throw new BadRequestError('signal_id inválido ou inexistente.')
  }

  // Cross-enrollment validation (P15)
  if (assoc.getString('enrollment_id') !== signal.getString('enrollment_id')) {
    throw new BadRequestError(
      'Inconsistência cross-enrollment: Signal e Associação pertencem a enrollments diferentes.',
    )
  }

  const signalAccess = signal.getString('access_class') || 'shared_care'
  const assocAccess = assoc.getString('access_class') || 'shared_care'

  // Derived Privacy validation:
  // Se signal é participant_private, só pode compor association se esta for estritamente participant_private
  if (signalAccess === 'participant_private' && assocAccess !== 'participant_private') {
    throw new BadRequestError(
      'Violação de privacidade derivada: evidência participant_private não pode ser incorporada a uma associação mais permissiva.',
    )
  }

  // Se signal é professional_private, não pode compor association visível ao participante
  if (
    signalAccess === 'professional_private' &&
    (assocAccess === 'participant_private' ||
      assocAccess === 'participant_shared' ||
      assocAccess === 'shared_care')
  ) {
    throw new BadRequestError(
      'Violação de privacidade derivada: evidência professional_private não pode compor associação visível ao participante.',
    )
  }

  // Restrição de quem adiciona a evidência
  if (e.auth) {
    const authId = e.auth.id
    const enrollmentId = assoc.getString('enrollment_id')

    let isParticipant = false
    try {
      const enr = $app.findFirstRecordByData('enrollments', 'id', enrollmentId)
      const personId = enr.getString('person_id')
      if (personId) {
        const pUser = $app.findFirstRecordByData('users', 'person_id', personId)
        if (pUser.id === authId) {
          isParticipant = true
        }
      }
    } catch (_) {}

    // Profissional tenta usar evidência participant_private -> Rejeitar (P8)
    if (!isParticipant && signalAccess === 'participant_private') {
      throw new BadRequestError(
        'Profissional não tem autorização para incorporar evidência participant_private.',
      )
    }

    // Participante tenta usar evidência professional_private -> Rejeitar
    if (isParticipant && signalAccess === 'professional_private') {
      throw new BadRequestError(
        'Participante não tem autorização para incorporar evidência professional_private.',
      )
    }
  }

  e.next()
}, 'cer_association_evidence')
