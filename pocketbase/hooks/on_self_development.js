onRecordCreateRequest((e) => {
  const r = e.record
  const enrollment = e.app.findRecordById('enrollments', r.getString('enrollment_id'))
  if (!e.auth || enrollment.getString('person_id') !== e.auth.getString('person_id'))
    throw new ForbiddenError('Somente a pessoa pode criar seu passo.')
  const sourceId = r.getString('direction_id')
  if (sourceId) {
    const direction = e.app.findRecordById('cer_life_directions', sourceId)
    if (
      direction.getString('enrollment_id') !== enrollment.id ||
      direction.getString('kind') !== 'future'
    )
      throw new BadRequestError('Escolha um futuro desta matrícula.')
  }
  if (r.getString('status') !== 'planned') throw new BadRequestError('Comece planejando seu passo.')
  for (const field of ['goal', 'action', 'context'])
    if (!r.getString(field).trim()) throw new BadRequestError('Defina direção, ação e contexto.')
  const snapshot = r.get('resource_snapshot')
  if (
    !snapshot ||
    !snapshot.id ||
    !snapshot.title ||
    !snapshot.lesson ||
    !Array.isArray(snapshot.instructions) ||
    !snapshot.instructions.length
  )
    throw new BadRequestError('Confira o recurso educativo.')
  e.next()
}, 'cer_development_experiments')

onRecordUpdateRequest((e) => {
  const r = e.record
  const original = r.original()
  const enrollment = e.app.findRecordById('enrollments', original.getString('enrollment_id'))
  if (!e.auth || enrollment.getString('person_id') !== e.auth.getString('person_id'))
    throw new ForbiddenError('Somente a pessoa pode ajustar seu passo.')
  if (r.getString('enrollment_id') !== original.getString('enrollment_id'))
    throw new BadRequestError('A matrícula não pode mudar.')
  const canonical = (value) =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === 'object'
        ? Object.keys(value)
            .sort()
            .reduce((out, key) => {
              out[key] = canonical(value[key])
              return out
            }, {})
        : value
  if (
    JSON.stringify(canonical(r.get('resource_snapshot'))) !==
    JSON.stringify(canonical(original.get('resource_snapshot')))
  )
    throw new BadRequestError(
      'O conteúdo desta tentativa é preservado. Crie outra para usar um novo recurso.',
    )
  if (r.getString('direction_id') !== original.getString('direction_id'))
    throw new BadRequestError('A origem desta tentativa é preservada.')
  for (const field of ['goal', 'action', 'context'])
    if (!r.getString(field).trim()) throw new BadRequestError('Defina direção, ação e contexto.')
  if (r.getString('status') === 'reviewed' && !r.getString('reflection').trim())
    throw new BadRequestError('Registre o aprendizado antes de concluir a revisão.')
  if (original.getString('status') === 'reviewed') {
    for (const field of [
      'goal',
      'action',
      'context',
      'fallback',
      'signal',
      'reflection',
      'next_step',
      'scheduled_at',
      'status',
    ])
      if (r.getString(field) !== original.getString(field))
        throw new BadRequestError('A revisão concluída é preservada. Crie uma nova tentativa.')
  }
  e.next()
}, 'cer_development_experiments')

onRecordCreateRequest((e) => {
  if (!e.auth || e.record.getString('author_user_id') !== e.auth.id)
    throw new ForbiddenError('Autoria profissional necessária.')
  const roles = e.app.findRecordsByFilter(
    'user_roles',
    'user_id = {:id} && role = "profissional" && is_active = true',
    '',
    1,
    0,
    { id: e.auth.id },
  )
  if (!roles.length) throw new ForbiddenError('Acesso profissional necessário.')
  const r = e.record
  const steps = r.get('instructions')
  if (
    !r.getString('title').trim() ||
    !r.getString('lesson').trim() ||
    !Array.isArray(steps) ||
    !steps.length ||
    steps.length > 12 ||
    steps.some((s) => typeof s !== 'string' || !s.trim() || s.length > 1500)
  )
    throw new BadRequestError('Informe título, ensinamento e de 1 a 12 passos.')
  e.next()
}, 'cer_development_resources')

onRecordUpdateRequest((e) => {
  const r = e.record
  const original = r.original()
  if (
    !e.auth ||
    original.getString('author_user_id') !== e.auth.id ||
    r.getString('author_user_id') !== original.getString('author_user_id')
  )
    throw new ForbiddenError('Somente a autora pode editar este recurso.')
  const roles = e.app.findRecordsByFilter(
    'user_roles',
    'user_id = {:id} && role = "profissional" && is_active = true',
    '',
    1,
    0,
    { id: e.auth.id },
  )
  if (!roles.length) throw new ForbiddenError('Acesso profissional necessário.')
  if (original.getString('status') !== 'draft') {
    if (r.getString('status') !== 'archived')
      throw new BadRequestError('Crie uma nova versão para preservar o recurso publicado.')
    for (const field of ['title', 'theme', 'duration', 'lesson', 'fallback', 'reflection'])
      if (r.getString(field) !== original.getString(field))
        throw new BadRequestError('O conteúdo publicado é preservado.')
    if (JSON.stringify(r.get('instructions')) !== JSON.stringify(original.get('instructions')))
      throw new BadRequestError('O conteúdo publicado é preservado.')
  }
  const steps = r.get('instructions')
  if (
    !r.getString('title').trim() ||
    !r.getString('lesson').trim() ||
    !Array.isArray(steps) ||
    !steps.length ||
    steps.length > 12 ||
    steps.some((s) => typeof s !== 'string' || !s.trim() || s.length > 1500)
  )
    throw new BadRequestError('Informe título, ensinamento e de 1 a 12 passos.')
  e.next()
}, 'cer_development_resources')
