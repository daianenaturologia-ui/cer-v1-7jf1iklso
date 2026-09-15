// Hook server-side do Lote 3A: Preservação Histórica, Imutabilidade e Zero Delete de cer_practice_reflections
// Coleções monitoradas: cer_practice_reflections
//
// Regras obrigatórias:
// 1. Vínculo obrigatório e imutável à PracticeVersion, ao Assignment e ao participante (respondente).
// 2. Não reatribuição silenciosa a outra pessoa ou a outro assignment.
// 3. Imutabilidade da resposta na mesma linha (evolução exclusivamente por nova versão/row com previous_reflection_id).
// 4. Default de visibilidade: participant_private caso não especificado.
// 5. Zero delete físico: deleteRule: null e hook rejeita qualquer exclusão.

onRecordCreate((e) => {
  const ref = e.record

  // Garantir participante autor
  if (!ref.getString('participant_user_id') && e.auth) {
    ref.set('participant_user_id', e.auth.id)
  }

  // Garantir record_status = 'current' na criação
  if (!ref.getString('record_status')) {
    ref.set('record_status', 'current')
  }

  // Garantir visibilidade padrão = participant_private
  if (!ref.getString('visibility')) {
    ref.set('visibility', 'participant_private')
  }

  // Se houver previous_reflection_id, marcar registro anterior como superseded
  const prevId = ref.getString('previous_reflection_id')
  if (prevId) {
    try {
      const prev = $app.findFirstRecordByData('cer_practice_reflections', 'id', prevId)
      if (prev) {
        prev.set('record_status', 'superseded')
        $app.save(prev)
      }
    } catch (_) {}
  }

  e.next()
}, 'cer_practice_reflections')

onRecordUpdate((e) => {
  const ref = e.record
  const orig = ref.original()
  if (!orig) {
    e.next()
    return
  }

  // Imutabilidade das âncoras relacionais
  if (ref.getString('assignment_id') !== orig.getString('assignment_id')) {
    throw new BadRequestError('Não é permitido alterar assignment_id de uma Reflexão existente.')
  }
  if (ref.getString('practice_version_id') !== orig.getString('practice_version_id')) {
    throw new BadRequestError(
      'Não é permitido alterar practice_version_id de uma Reflexão existente.',
    )
  }
  if (ref.getString('participant_user_id') !== orig.getString('participant_user_id')) {
    throw new BadRequestError(
      'Não é permitido alterar participant_user_id de uma Reflexão existente.',
    )
  }
  if (ref.getString('enrollment_id') !== orig.getString('enrollment_id')) {
    throw new BadRequestError('Não é permitido alterar enrollment_id de uma Reflexão existente.')
  }
  if (ref.getString('reflection_target') !== orig.getString('reflection_target')) {
    throw new BadRequestError(
      'Não é permitido alterar reflection_target de uma Reflexão existente.',
    )
  }

  // Permitir apenas mudança de visibilidade ou transição de status para superseded
  const origText = orig.getString('reflection_text')
  const newText = ref.getString('reflection_text')
  if (origText !== newText) {
    throw new BadRequestError(
      'Imutabilidade da Reflexão: O conteúdo da reflexão não pode ser alterado diretamente na mesma linha. Registre uma nova reflexão vinculada como evolução.',
    )
  }

  e.next()
}, 'cer_practice_reflections')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Zero Delete Físico: Exclusão de reflexão não permitida. Histórico de percepções é preservado.',
  )
}, 'cer_practice_reflections')
