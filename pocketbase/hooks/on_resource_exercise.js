// Private self-development records; callbacks keep validation inside their execution scope.
onRecordCreateRequest((e) => {
  let value
  try {
    value = JSON.parse(e.record.getString('exercise'))
  } catch (_) {
    throw new BadRequestError('Exercício inválido.')
  }
  const text = (x, max) => typeof x === 'string' && x.length <= max
  if (
    !value ||
    value.schemaVersion !== 1 ||
    value.enrollmentId !== e.record.getString('enrollment_id') ||
    !text(value.sourceFingerprint, 100) ||
    !Array.isArray(value.customItems) ||
    value.customItems.length > 100 ||
    !Array.isArray(value.hiddenIds) ||
    value.hiddenIds.length > 500 ||
    !Array.isArray(value.connections) ||
    value.connections.length > 500 ||
    !value.customItems.every(
      (i) =>
        i &&
        text(i.id, 200) &&
        i.id.indexOf('personal:') === 0 &&
        ['strength', 'difficulty'].includes(i.kind) &&
        text(i.label, 240) &&
        i.label.trim(),
    ) ||
    new Set(value.customItems.map((i) => i.id)).size !== value.customItems.length ||
    !value.hiddenIds.every((id) => text(id, 1000)) ||
    !value.connections.every(
      (c) => c && text(c.strengthId, 1000) && text(c.difficultyId, 1000) && text(c.strategy, 2000),
    ) ||
    new Set(value.connections.map((c) => `${c.strengthId}|${c.difficultyId}`)).size !==
      value.connections.length
  )
    throw new BadRequestError('Confira os itens e conexões do exercício.')
  e.next()
}, 'cer_resource_exercises')
onRecordUpdateRequest((e) => {
  const previous = e.record.original()
  if (previous && e.record.getInt('revision') !== previous.getInt('revision') + 1)
    throw new BadRequestError('O exercício foi atualizado em outra janela. Reabra antes de salvar.')
  let value
  try {
    value = JSON.parse(e.record.getString('exercise'))
  } catch (_) {
    throw new BadRequestError('Exercício inválido.')
  }
  const text = (x, max) => typeof x === 'string' && x.length <= max
  if (
    !value ||
    value.schemaVersion !== 1 ||
    value.enrollmentId !== e.record.getString('enrollment_id') ||
    !text(value.sourceFingerprint, 100) ||
    !Array.isArray(value.customItems) ||
    value.customItems.length > 100 ||
    !Array.isArray(value.hiddenIds) ||
    value.hiddenIds.length > 500 ||
    !Array.isArray(value.connections) ||
    value.connections.length > 500 ||
    !value.customItems.every(
      (i) =>
        i &&
        text(i.id, 200) &&
        i.id.indexOf('personal:') === 0 &&
        ['strength', 'difficulty'].includes(i.kind) &&
        text(i.label, 240) &&
        i.label.trim(),
    ) ||
    new Set(value.customItems.map((i) => i.id)).size !== value.customItems.length ||
    !value.hiddenIds.every((id) => text(id, 1000)) ||
    !value.connections.every(
      (c) => c && text(c.strengthId, 1000) && text(c.difficultyId, 1000) && text(c.strategy, 2000),
    ) ||
    new Set(value.connections.map((c) => `${c.strengthId}|${c.difficultyId}`)).size !==
      value.connections.length
  )
    throw new BadRequestError('Confira os itens e conexões do exercício.')
  e.next()
}, 'cer_resource_exercises')
