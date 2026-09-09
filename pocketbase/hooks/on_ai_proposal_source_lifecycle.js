// Hook server-side do Checkpoint 05: Validação e Integridade de cer_ai_proposal_sources
// Regras e Decisões Congeladas:
// 1. proposal_id deve existir em cer_ai_proposals
// 2. source_type deve ser allowlisted: experience_response | signal | association | knowledge_item | participant_recognition | session_observation
// 3. Fonte "session note" não pode existir e é terminantemente rejeitada
// 4. Validação estrita:
//    - source_id deve existir na collection correspondente
//    - Ramo participant_private é rejeitado
//    - Ramo session_observation só pode pertencer ao profissional criador da observação
//    - enrollment_id da fonte DEVE ser idêntico ao enrollment_id da Proposal (cross-enrollment negado)
//    - Armazenar access_class validada server-side
// 5. DELETE negado irrevogavelmente

onRecordCreate((e) => {
  const src = e.record
  const proposalId = src.getString('proposal_id')
  const sourceType = src.getString('source_type')
  const sourceId = src.getString('source_id')

  // 1. Proibir explicitamente Session Note
  if (
    sourceType === 'cer_session_notes' ||
    sourceType === 'session_note' ||
    sourceType === 'session_notes'
  ) {
    throw new BadRequestError('Session Note não pode ser utilizada como Proposal Source.')
  }

  // 2. Validar que a Proposal existe
  let proposal = null
  try {
    proposal = $app.findFirstRecordByData('cer_ai_proposals', 'id', proposalId)
  } catch (_) {
    throw new BadRequestError('proposal_id inválido ou inexistente.')
  }

  const enrollmentId = proposal.getString('enrollment_id')

  // 3. Resolver a fonte de acordo com source_type
  let targetEnrollmentId = ''
  let targetAccessClass = ''

  if (sourceType === 'experience_response') {
    try {
      const resp = $app.findFirstRecordByData('experience_responses', 'id', sourceId)
      targetEnrollmentId = resp.getString('enrollment_id')
      targetAccessClass = resp.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Response referenciada na source não encontrada.')
    }
  } else if (sourceType === 'signal') {
    try {
      const sig = $app.findFirstRecordByData('cer_signals', 'id', sourceId)
      targetEnrollmentId = sig.getString('enrollment_id')
      targetAccessClass = sig.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Signal referenciado na source não encontrado.')
    }
  } else if (sourceType === 'association') {
    try {
      const assoc = $app.findFirstRecordByData('cer_associations', 'id', sourceId)
      targetEnrollmentId = assoc.getString('enrollment_id')
      targetAccessClass = assoc.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Associação referenciada na source não encontrada.')
    }
  } else if (sourceType === 'knowledge_item') {
    try {
      const ki = $app.findFirstRecordByData('cer_knowledge_items', 'id', sourceId)
      targetEnrollmentId = ki.getString('enrollment_id')
      targetAccessClass = ki.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Knowledge Item referenciado na source não encontrado.')
    }
  } else if (sourceType === 'participant_recognition') {
    try {
      const recog = $app.findFirstRecordByData('cer_participant_recognitions', 'id', sourceId)
      targetEnrollmentId = recog.getString('enrollment_id')
      targetAccessClass = recog.getString('access_class') || 'shared_care'
    } catch (_) {
      throw new BadRequestError('Participant Recognition referenciado na source não encontrado.')
    }
  } else if (sourceType === 'session_observation') {
    try {
      const obs = $app.findFirstRecordByData('cer_session_observations', 'id', sourceId)
      targetEnrollmentId = obs.getString('enrollment_id')
      targetAccessClass = obs.getString('access_class') || 'professional_private'

      // Só pode usar Session Observation do próprio profissional invocador
      if (e.auth) {
        const obsAuthor = obs.getString('recorded_by_user_id')
        if (obsAuthor && obsAuthor !== e.auth.id) {
          throw new BadRequestError(
            'Não é permitido vincular Session Observation de outro profissional à Proposal.',
          )
        }
      }
    } catch (obsErr) {
      if (obsErr.message && obsErr.message.indexOf('outro profissional') !== -1) {
        throw obsErr
      }
      throw new BadRequestError('Session Observation referenciada na source não encontrada.')
    }
  } else {
    throw new BadRequestError('Tipo de fonte inválido ou não autorizado: "' + sourceType + '".')
  }

  // 4. Cross-enrollment check
  if (targetEnrollmentId && targetEnrollmentId !== enrollmentId) {
    throw new BadRequestError(
      'Inconsistência cross-enrollment: a fonte pertence a outro enrollment.',
    )
  }

  // 5. Excluir participant_private
  if (targetAccessClass === 'participant_private') {
    throw new BadRequestError(
      'Fontes participant_private são estritamente excluídas do contexto de AI V1.',
    )
  }

  // 6. Excluir KI professional_private na AI V1
  if (sourceType === 'knowledge_item' && targetAccessClass === 'professional_private') {
    throw new BadRequestError('Knowledge Item professional_private permanece excluído na AI V1.')
  }

  // Preencher access_class validada server-side
  src.set('access_class', targetAccessClass)

  e.next()
}, 'cer_ai_proposal_sources')

onRecordUpdate((e) => {
  throw new BadRequestError('Fontes de Proposal são estritamente imutáveis.')
}, 'cer_ai_proposal_sources')

onRecordDelete((e) => {
  throw new BadRequestError('Exclusão de Proposal Source não permitida.')
}, 'cer_ai_proposal_sources')
