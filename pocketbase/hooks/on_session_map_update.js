// Explicit professional formulations only; private notes are never read here.
onRecordCreateRequest((e) => {
  const raw = e.record.getString('reading_snapshot')
  if (!raw || raw === 'null') return e.next()
  let snapshot
  try { snapshot = JSON.parse(raw) } catch (_) { throw new BadRequestError('Leitura inválida.') }
  if (snapshot.sessionUpdates === undefined) return e.next()
  if (!Array.isArray(snapshot.sessionUpdates)) throw new BadRequestError('Atualizações de encontro inválidas.')
  const seen = new Set()
  for (const update of snapshot.sessionUpdates) {
    if (!update || !['sessionId', 'sessionDate', 'summary', 'preparedBy', 'preparedAt'].every((key) => typeof update[key] === 'string' && update[key].trim()) || update.summary.length > 8000 || seen.has(update.sessionId) || !Number.isFinite(Date.parse(update.sessionDate)) || !Number.isFinite(Date.parse(update.preparedAt))) throw new BadRequestError('Síntese de encontro inválida.')
    seen.add(update.sessionId)
    const session = e.app.findRecordById('cer_sessions', update.sessionId)
    if (session.getString('enrollment_id') !== e.record.getString('enrollment_id') || session.getString('status') === 'cancelled' || session.getString('professional_user_id') !== update.preparedBy) throw new BadRequestError('O encontro não pertence a este acompanhamento e profissional.')
    let previous = null
    try { previous = JSON.parse(e.record.original()?.getString('reading_snapshot') || 'null')?.sessionUpdates?.find((item) => item.sessionId === update.sessionId) } catch (_) {}
    if (JSON.stringify(previous) !== JSON.stringify(update)) {
      const auth = e.requestInfo().auth
      if (!auth || auth.id !== update.preparedBy) throw new BadRequestError('Somente a profissional do encontro pode preparar esta síntese.')
    }
  }
  e.next()
}, 'cer_maps')

onRecordUpdateRequest((e) => {
  const raw = e.record.getString('reading_snapshot')
  if (!raw || raw === 'null') return e.next()
  let snapshot
  try { snapshot = JSON.parse(raw) } catch (_) { throw new BadRequestError('Leitura inválida.') }
  if (snapshot.sessionUpdates === undefined) return e.next()
  if (!Array.isArray(snapshot.sessionUpdates)) throw new BadRequestError('Atualizações de encontro inválidas.')
  const seen = new Set()
  for (const update of snapshot.sessionUpdates) {
    if (!update || !['sessionId', 'sessionDate', 'summary', 'preparedBy', 'preparedAt'].every((key) => typeof update[key] === 'string' && update[key].trim()) || update.summary.length > 8000 || seen.has(update.sessionId) || !Number.isFinite(Date.parse(update.sessionDate)) || !Number.isFinite(Date.parse(update.preparedAt))) throw new BadRequestError('Síntese de encontro inválida.')
    seen.add(update.sessionId)
    const session = e.app.findRecordById('cer_sessions', update.sessionId)
    if (session.getString('enrollment_id') !== e.record.getString('enrollment_id') || session.getString('status') === 'cancelled' || session.getString('professional_user_id') !== update.preparedBy) throw new BadRequestError('O encontro não pertence a este acompanhamento e profissional.')
    let previous = null
    try { previous = JSON.parse(e.record.original()?.getString('reading_snapshot') || 'null')?.sessionUpdates?.find((item) => item.sessionId === update.sessionId) } catch (_) {}
    if (JSON.stringify(previous) !== JSON.stringify(update)) {
      const auth = e.requestInfo().auth
      if (!auth || auth.id !== update.preparedBy) throw new BadRequestError('Somente a profissional do encontro pode preparar esta síntese.')
    }
  }
  e.next()
}, 'cer_maps')

