onRecordCreateRequest((e) => {
  const readJSON = (record, field, fallback) => {
    const raw = record.getString(field)
    if (typeof raw !== 'string') return raw || fallback
    try {
      return raw ? JSON.parse(raw) : fallback
    } catch (_) {
      throw new BadRequestError('Confira o conteúdo estruturado do recurso.')
    }
  }
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
  const snapshot = readJSON(r, 'resource_snapshot', null)
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
  const readJSON = (record, field, fallback) => {
    const raw = record.getString(field)
    if (typeof raw !== 'string') return raw || fallback
    try {
      return raw ? JSON.parse(raw) : fallback
    } catch (_) {
      throw new BadRequestError('Confira o conteúdo estruturado do recurso.')
    }
  }
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
    JSON.stringify(canonical(readJSON(r, 'resource_snapshot', null))) !==
    JSON.stringify(canonical(readJSON(original, 'resource_snapshot', null)))
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
  const readJSON = (record, field, fallback) => {
    const raw = record.getString(field)
    if (typeof raw !== 'string') return raw || fallback
    try {
      return raw ? JSON.parse(raw) : fallback
    } catch (_) {
      throw new BadRequestError('Confira o conteúdo estruturado do recurso.')
    }
  }
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
  const published = r.getString('status') === 'published'
  const steps = readJSON(r, 'instructions', [])
  if (
    !r.getString('title').trim() ||
    r.getString('title').length > 160 ||
    !Array.isArray(steps) ||
    steps.length > 12 ||
    steps.some((s) => typeof s !== 'string' || !s.trim() || s.length > 1500)
  )
    throw new BadRequestError('Informe nome e até 12 passos curtos.')
  if (published && (!r.getString('lesson').trim() || !steps.length))
    throw new BadRequestError('Antes de publicar, informe ensinamento e de 1 a 12 passos.')
  const material = readJSON(r, 'material', null)
  if (material) {
    if (
      typeof material !== 'object' ||
      Array.isArray(material) ||
      !['text', 'pdf', 'audio', 'video'].includes(material.format)
    )
      throw new BadRequestError('Confira o formato do material.')
    for (const field of ['url', 'author', 'references', 'conditions'])
      if (
        typeof material[field] !== 'string' ||
        material[field].length > (field === 'url' ? 2000 : 3000)
      )
        throw new BadRequestError('Confira os campos do material.')
    if (material.url && !/^https:\/\/[^/?#@\s\\]+(?:[/?#][^\s\\]*)?$/i.test(material.url))
      throw new BadRequestError('Use um endereço HTTPS válido, sem credenciais.')
    if (published && material.format !== 'text' && !material.url.trim())
      throw new BadRequestError('Informe o endereço do material antes de publicar.')
  }
  e.next()
}, 'cer_development_resources')

onRecordUpdateRequest((e) => {
  const readJSON = (record, field, fallback) => {
    const raw = record.getString(field)
    if (typeof raw !== 'string') return raw || fallback
    try {
      return raw ? JSON.parse(raw) : fallback
    } catch (_) {
      throw new BadRequestError('Confira o conteúdo estruturado do recurso.')
    }
  }
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
    if (
      JSON.stringify(readJSON(r, 'instructions', [])) !==
      JSON.stringify(readJSON(original, 'instructions', []))
    )
      throw new BadRequestError('O conteúdo publicado é preservado.')
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
      JSON.stringify(canonical(readJSON(r, 'material', null))) !==
      JSON.stringify(canonical(readJSON(original, 'material', null)))
    )
      throw new BadRequestError('O material publicado é preservado.')
  }
  const published = r.getString('status') === 'published'
  const steps = readJSON(r, 'instructions', [])
  if (
    !r.getString('title').trim() ||
    r.getString('title').length > 160 ||
    !Array.isArray(steps) ||
    steps.length > 12 ||
    steps.some((s) => typeof s !== 'string' || !s.trim() || s.length > 1500)
  )
    throw new BadRequestError('Informe nome e até 12 passos curtos.')
  if (published && (!r.getString('lesson').trim() || !steps.length))
    throw new BadRequestError('Antes de publicar, informe ensinamento e de 1 a 12 passos.')
  const material = readJSON(r, 'material', null)
  if (material) {
    if (
      typeof material !== 'object' ||
      Array.isArray(material) ||
      !['text', 'pdf', 'audio', 'video'].includes(material.format)
    )
      throw new BadRequestError('Confira o formato do material.')
    for (const field of ['url', 'author', 'references', 'conditions'])
      if (
        typeof material[field] !== 'string' ||
        material[field].length > (field === 'url' ? 2000 : 3000)
      )
        throw new BadRequestError('Confira os campos do material.')
    if (material.url && !/^https:\/\/[^/?#@\s\\]+(?:[/?#][^\s\\]*)?$/i.test(material.url))
      throw new BadRequestError('Use um endereço HTTPS válido, sem credenciais.')
    if (published && material.format !== 'text' && !material.url.trim())
      throw new BadRequestError('Informe o endereço do material antes de publicar.')
  }
  e.next()
}, 'cer_development_resources')
