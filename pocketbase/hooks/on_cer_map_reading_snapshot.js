// Model guard also protects writes made outside the HTTP API.
onRecordUpdate((e) => {
  const original = e.record.original()
  if (
    original &&
    original.getString('status') !== 'draft' &&
    e.record.getString('reading_snapshot') !== original.getString('reading_snapshot')
  ) {
    throw new BadRequestError('As leituras de um mapa publicado ou arquivado são imutáveis.')
  }
  e.next()
}, 'cer_maps')

onRecordUpdateRequest((e) => {
  const record = e.record
  const original = record.original()
  const text = record.getString('reading_snapshot')
  if (!text || text === 'null') {
    if (
      original?.getString('reading_snapshot') &&
      original.getString('reading_snapshot') !== 'null'
    )
      throw new BadRequestError(
        'A leitura salva não pode ser removida. Crie uma nova versão para revisar.',
      )
    return e.next()
  }
  let snapshot
  try {
    snapshot = JSON.parse(text)
  } catch (_) {
    throw new BadRequestError('Leitura inválida.')
  }
  const dimensionIds = ['corpo', 'mente', 'regulacao', 'relacoes', 'sexualidade', 'sentido']
  const strings = (values) => values.every((v) => typeof v === 'string')
  const rows = (value) =>
    Array.isArray(value) && value.every((row) => row && strings([row.label, row.text]))
  if (
    !snapshot ||
    snapshot.schemaVersion !== 1 ||
    snapshot.enrollmentId !== record.getString('enrollment_id') ||
    !strings([
      snapshot.participantName,
      snapshot.generatedAt,
      snapshot.overview,
      snapshot.integration,
      snapshot.history,
    ]) ||
    !Array.isArray(snapshot.sourceResponseIds) ||
    !strings(snapshot.sourceResponseIds) ||
    !Array.isArray(snapshot.dimensions) ||
    snapshot.dimensions.length !== 6 ||
    !dimensionIds.every((id) => snapshot.dimensions.some((d) => d.id === id)) ||
    !snapshot.dimensions.every(
      (d) =>
        strings([d.title, d.explanation, d.summary, d.interpretation]) &&
        rows(d.summaryRows) &&
        rows(d.detailedRows) &&
        Array.isArray(d.referenceIds),
    ) ||
    !Array.isArray(snapshot.references) ||
    !snapshot.references.every((r) => r && strings([r.id, r.citation, r.kind, r.scope]))
  )
    throw new BadRequestError(
      'As duas versões precisam de uma estrutura válida com seis dimensões.',
    )
  const changed = !original || text !== original.getString('reading_snapshot')
  if (changed) {
    const auth = e.requestInfo().auth
    if (!auth || !auth.getString('person_id'))
      throw new BadRequestError('A revisão exige uma profissional humana autenticada.')
    const links = e.app.findRecordsByFilter(
      'professional_enrollment_access',
      'enrollment_id = {:enrollment} && professional_user_id = {:user} && is_active = true',
      '',
      1,
      0,
      { enrollment: snapshot.enrollmentId, user: auth.id },
    )
    const roles = e.app.findRecordsByFilter(
      'user_roles',
      'user_id = {:user} && is_active = true && role = "profissional"',
      '',
      1,
      0,
      { user: auth.id },
    )
    if (!links.length || !roles.length)
      throw new BadRequestError('Profissional sem acesso ativo a esta interagente.')
    if (snapshot.reviewedBy || snapshot.reviewedAt) {
      if (snapshot.reviewedBy !== auth.id || !snapshot.reviewedAt)
        throw new BadRequestError('A revisão deve ser registrada por quem revisou as duas versões.')
      // A previous review cannot silently approve an edited document.
      let oldSnapshot = null
      try {
        oldSnapshot = JSON.parse(original?.getString('reading_snapshot') || 'null')
      } catch (_) {}
      if (oldSnapshot?.reviewedAt === snapshot.reviewedAt)
        throw new BadRequestError('Registre uma nova revisão após editar as leituras.')
      snapshot.reviewedAt = new Date().toISOString()
      record.set('reading_snapshot', snapshot)
    }
    for (const id of snapshot.sourceResponseIds) {
      const response = e.app.findRecordById('experience_responses', id)
      if (
        response.getString('enrollment_id') !== snapshot.enrollmentId ||
        !['participant_shared', 'shared_care'].includes(response.getString('access_class'))
      )
        throw new BadRequestError(
          'Respostas privadas ou de outra interagente não podem entrar no mapa compartilhado.',
        )
    }
    for (const dimension of snapshot.dimensions) {
      for (const row of [...dimension.summaryRows, ...dimension.detailedRows]) {
        if (!row.sourceResponseId) continue
        const response = e.app.findRecordById('experience_responses', row.sourceResponseId)
        if (
          response.getString('enrollment_id') !== snapshot.enrollmentId ||
          !['participant_shared', 'shared_care'].includes(response.getString('access_class'))
        )
          throw new BadRequestError(
            'Respostas privadas ou de outra interagente não podem sustentar a leitura compartilhada.',
          )
      }
    }
  }
  e.next()
}, 'cer_maps')

onRecordCreateRequest((e) => {
  const record = e.record
  const original = record.original()
  const text = record.getString('reading_snapshot')
  if (!text || text === 'null') {
    if (
      original?.getString('reading_snapshot') &&
      original.getString('reading_snapshot') !== 'null'
    )
      throw new BadRequestError(
        'A leitura salva não pode ser removida. Crie uma nova versão para revisar.',
      )
    return e.next()
  }
  let snapshot
  try {
    snapshot = JSON.parse(text)
  } catch (_) {
    throw new BadRequestError('Leitura inválida.')
  }
  const dimensionIds = ['corpo', 'mente', 'regulacao', 'relacoes', 'sexualidade', 'sentido']
  const strings = (values) => values.every((v) => typeof v === 'string')
  const rows = (value) =>
    Array.isArray(value) && value.every((row) => row && strings([row.label, row.text]))
  if (
    !snapshot ||
    snapshot.schemaVersion !== 1 ||
    snapshot.enrollmentId !== record.getString('enrollment_id') ||
    !strings([
      snapshot.participantName,
      snapshot.generatedAt,
      snapshot.overview,
      snapshot.integration,
      snapshot.history,
    ]) ||
    !Array.isArray(snapshot.sourceResponseIds) ||
    !strings(snapshot.sourceResponseIds) ||
    !Array.isArray(snapshot.dimensions) ||
    snapshot.dimensions.length !== 6 ||
    !dimensionIds.every((id) => snapshot.dimensions.some((d) => d.id === id)) ||
    !snapshot.dimensions.every(
      (d) =>
        strings([d.title, d.explanation, d.summary, d.interpretation]) &&
        rows(d.summaryRows) &&
        rows(d.detailedRows) &&
        Array.isArray(d.referenceIds),
    ) ||
    !Array.isArray(snapshot.references) ||
    !snapshot.references.every((r) => r && strings([r.id, r.citation, r.kind, r.scope]))
  )
    throw new BadRequestError(
      'As duas versões precisam de uma estrutura válida com seis dimensões.',
    )
  const changed = !original || text !== original.getString('reading_snapshot')
  if (changed) {
    const auth = e.requestInfo().auth
    if (!auth || !auth.getString('person_id'))
      throw new BadRequestError('A revisão exige uma profissional humana autenticada.')
    const links = e.app.findRecordsByFilter(
      'professional_enrollment_access',
      'enrollment_id = {:enrollment} && professional_user_id = {:user} && is_active = true',
      '',
      1,
      0,
      { enrollment: snapshot.enrollmentId, user: auth.id },
    )
    const roles = e.app.findRecordsByFilter(
      'user_roles',
      'user_id = {:user} && is_active = true && role = "profissional"',
      '',
      1,
      0,
      { user: auth.id },
    )
    if (!links.length || !roles.length)
      throw new BadRequestError('Profissional sem acesso ativo a esta interagente.')
    if (snapshot.reviewedBy || snapshot.reviewedAt) {
      if (snapshot.reviewedBy !== auth.id || !snapshot.reviewedAt)
        throw new BadRequestError('A revisão deve ser registrada por quem revisou as duas versões.')
      // A previous review cannot silently approve an edited document.
      let oldSnapshot = null
      try {
        oldSnapshot = JSON.parse(original?.getString('reading_snapshot') || 'null')
      } catch (_) {}
      if (oldSnapshot?.reviewedAt === snapshot.reviewedAt)
        throw new BadRequestError('Registre uma nova revisão após editar as leituras.')
      snapshot.reviewedAt = new Date().toISOString()
      record.set('reading_snapshot', snapshot)
    }
    for (const id of snapshot.sourceResponseIds) {
      const response = e.app.findRecordById('experience_responses', id)
      if (
        response.getString('enrollment_id') !== snapshot.enrollmentId ||
        !['participant_shared', 'shared_care'].includes(response.getString('access_class'))
      )
        throw new BadRequestError(
          'Respostas privadas ou de outra interagente não podem entrar no mapa compartilhado.',
        )
    }
    for (const dimension of snapshot.dimensions) {
      for (const row of [...dimension.summaryRows, ...dimension.detailedRows]) {
        if (!row.sourceResponseId) continue
        const response = e.app.findRecordById('experience_responses', row.sourceResponseId)
        if (
          response.getString('enrollment_id') !== snapshot.enrollmentId ||
          !['participant_shared', 'shared_care'].includes(response.getString('access_class'))
        )
          throw new BadRequestError(
            'Respostas privadas ou de outra interagente não podem sustentar a leitura compartilhada.',
          )
      }
    }
  }
  e.next()
}, 'cer_maps')
