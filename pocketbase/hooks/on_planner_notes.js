// Notas da agenda são privadas. Não concedem acesso à profissional nem criam atribuições clínicas.
onRecordCreateRequest((e) => {
  const r = e.record
  const enrollment = e.app.findRecordById('enrollments', r.getString('enrollment_id'))
  if (
    !e.auth ||
    e.auth.getString('status') !== 'active' ||
    enrollment.getString('person_id') !== e.auth.getString('person_id')
  )
    throw new ForbiddenError('Somente a pessoa pode escrever na sua agenda.')
  const start = Date.parse(r.getString('starts_at')),
    end = Date.parse(r.getString('ends_at'))
  if (
    !r.getString('title').trim() ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    end - start > 86400000
  )
    throw new BadRequestError('Confira o título e os horários.')
  e.next()
}, 'cer_planner_notes')
onRecordUpdateRequest((e) => {
  const r = e.record,
    old = r.original()
  const enrollment = e.app.findRecordById('enrollments', old.getString('enrollment_id'))
  if (
    !e.auth ||
    e.auth.getString('status') !== 'active' ||
    enrollment.getString('person_id') !== e.auth.getString('person_id')
  )
    throw new ForbiddenError('Somente a pessoa pode escrever na sua agenda.')
  if (r.getString('enrollment_id') !== old.getString('enrollment_id'))
    throw new BadRequestError('A agenda não pode mudar de pessoa.')
  const start = Date.parse(r.getString('starts_at')),
    end = Date.parse(r.getString('ends_at'))
  if (
    !r.getString('title').trim() ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    end - start > 86400000
  )
    throw new BadRequestError('Confira o título e os horários.')
  e.next()
}, 'cer_planner_notes')
