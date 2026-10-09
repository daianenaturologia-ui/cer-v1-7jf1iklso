// Personal goals; no automatic clinical plan or agenda writes.
onRecordCreateRequest((e) => {
  if (e.record.getInt('revision') !== 1) throw new BadRequestError('Revisão inicial inválida.')
  if (!e.auth || e.record.getString('owner_id') !== e.auth.id)
    throw new ForbiddenError('Somente a pessoa pode ajustar seu planejamento.')
  const enrollment = e.app.findRecordById('enrollments', e.record.getString('enrollment_id'))
  if (enrollment.getString('person_id') !== e.auth.getString('person_id'))
    throw new ForbiddenError('Confira a pessoa deste planejamento.')
  const source = e.app.findRecordById('cer_life_directions', e.record.getString('direction_id'))
  if (source.getString('kind') !== 'future' || source.getString('enrollment_id') !== enrollment.id)
    throw new BadRequestError('A direção precisa pertencer à mesma matrícula.')
  if (
    e.record.getString('access_class') === 'participant_shared' &&
    source.getString('access_class') !== 'participant_shared'
  )
    throw new BadRequestError('Compartilhe primeiro a direção.')
  let value
  try {
    value = JSON.parse(e.record.getString('roadmap'))
  } catch (_) {
    throw new BadRequestError('Planejamento inválido.')
  }
  const text = (v, max) => typeof v === 'string' && v.length <= max
  const order = ['short', 'medium', 'long']
  if (
    !value ||
    value.schemaVersion !== 1 ||
    !text(value.objective, 160) ||
    !value.objective.trim() ||
    !text(value.capacity, 5000) ||
    !text(value.resources, 5000) ||
    !Array.isArray(value.milestones) ||
    value.milestones.length < 1 ||
    value.milestones.length > 3 ||
    !Array.isArray(value.actions) ||
    value.actions.length > 24 ||
    value.milestones.some((m) => !m || !order.includes(m.horizon))
  )
    throw new BadRequestError('Confira as metas e ações.')
  const horizons = new Set()
  let lastDate = ''
  for (const m of value.milestones
    .slice()
    .sort((a, b) => order.indexOf(a.horizon) - order.indexOf(b.horizon))) {
    if (
      horizons.has(m.horizon) ||
      !text(m.title, 160) ||
      !m.title.trim() ||
      !text(m.signal, 2000) ||
      typeof m.targetDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(m.targetDate) ||
      !Number.isFinite(Date.parse(m.targetDate)) ||
      new Date(m.targetDate).toISOString().slice(0, 10) !== m.targetDate ||
      m.targetDate < lastDate
    )
      throw new BadRequestError('Confira os nomes e a ordem das datas das metas.')
    horizons.add(m.horizon)
    lastDate = m.targetDate
  }
  const ids = new Set()
  for (const a of value.actions) {
    if (
      !a ||
      !text(a.id, 200) ||
      !a.id ||
      ids.has(a.id) ||
      !horizons.has(a.horizon) ||
      !text(a.title, 160) ||
      !a.title.trim() ||
      !text(a.frequency, 240) ||
      !text(a.resource, 2000) ||
      !text(a.fallback, 2000)
    )
      throw new BadRequestError('Confira as ações e seus recursos.')
    ids.add(a.id)
  }
  e.next()
}, 'cer_goal_roadmaps')
onRecordUpdateRequest((e) => {
  const old = e.record.original()
  for (const field of ['enrollment_id', 'direction_id', 'owner_id'])
    if (e.record.getString(field) !== old.getString(field))
      throw new BadRequestError('A origem do planejamento deve ser preservada.')
  if (e.record.getInt('revision') !== old.getInt('revision') + 1)
    throw new BadRequestError('O planejamento mudou em outra janela. Reabra antes de salvar.')
  if (!e.auth || e.record.getString('owner_id') !== e.auth.id)
    throw new ForbiddenError('Somente a pessoa pode ajustar seu planejamento.')
  const enrollment = e.app.findRecordById('enrollments', e.record.getString('enrollment_id'))
  if (enrollment.getString('person_id') !== e.auth.getString('person_id'))
    throw new ForbiddenError('Confira a pessoa deste planejamento.')
  const source = e.app.findRecordById('cer_life_directions', e.record.getString('direction_id'))
  if (source.getString('kind') !== 'future' || source.getString('enrollment_id') !== enrollment.id)
    throw new BadRequestError('A direção precisa pertencer à mesma matrícula.')
  if (
    e.record.getString('access_class') === 'participant_shared' &&
    source.getString('access_class') !== 'participant_shared'
  )
    throw new BadRequestError('Compartilhe primeiro a direção.')
  let value
  try {
    value = JSON.parse(e.record.getString('roadmap'))
  } catch (_) {
    throw new BadRequestError('Planejamento inválido.')
  }
  const text = (v, max) => typeof v === 'string' && v.length <= max
  const order = ['short', 'medium', 'long']
  if (
    !value ||
    value.schemaVersion !== 1 ||
    !text(value.objective, 160) ||
    !value.objective.trim() ||
    !text(value.capacity, 5000) ||
    !text(value.resources, 5000) ||
    !Array.isArray(value.milestones) ||
    value.milestones.length < 1 ||
    value.milestones.length > 3 ||
    !Array.isArray(value.actions) ||
    value.actions.length > 24 ||
    value.milestones.some((m) => !m || !order.includes(m.horizon))
  )
    throw new BadRequestError('Confira as metas e ações.')
  const horizons = new Set()
  let lastDate = ''
  for (const m of value.milestones
    .slice()
    .sort((a, b) => order.indexOf(a.horizon) - order.indexOf(b.horizon))) {
    if (
      horizons.has(m.horizon) ||
      !text(m.title, 160) ||
      !m.title.trim() ||
      !text(m.signal, 2000) ||
      typeof m.targetDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(m.targetDate) ||
      !Number.isFinite(Date.parse(m.targetDate)) ||
      new Date(m.targetDate).toISOString().slice(0, 10) !== m.targetDate ||
      m.targetDate < lastDate
    )
      throw new BadRequestError('Confira os nomes e a ordem das datas das metas.')
    horizons.add(m.horizon)
    lastDate = m.targetDate
  }
  const ids = new Set()
  for (const a of value.actions) {
    if (
      !a ||
      !text(a.id, 200) ||
      !a.id ||
      ids.has(a.id) ||
      !horizons.has(a.horizon) ||
      !text(a.title, 160) ||
      !a.title.trim() ||
      !text(a.frequency, 240) ||
      !text(a.resource, 2000) ||
      !text(a.fallback, 2000)
    )
      throw new BadRequestError('Confira as ações e seus recursos.')
    ids.add(a.id)
  }
  e.next()
}, 'cer_goal_roadmaps')
