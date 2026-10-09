onRecordCreateRequest((e) => {
  const r = e.record
  // A future direction can begin provisionally while the Map is still being completed.
  // Collection rules continue to enforce ownership and professional access.
  if (r.getString('kind') === 'present') {
    const requiredCodes = [
      'corpo_fisiologia_ayurveda',
      'mente_emocoes_cer',
      'regulacao_respostas_cer',
      'relacoes_cer',
      'sexualidade_cer',
      'sentido_conexao_cer',
    ]
    const completed = e.app.findRecordsByFilter(
      'enrollment_experiences',
      'enrollment_id = {:id} && progress_status = "completed"',
      '',
      0,
      0,
      { id: r.getString('enrollment_id') },
    )
    const codes = completed.map((item) =>
      e.app.findRecordById('cer_experiences', item.getString('experience_id')).getString('code'),
    )
    if (!requiredCodes.every((code) => codes.includes(code)))
      throw new BadRequestError(
        'Conclua as seis dimensões da Consciência antes de registrar esta leitura do presente.',
      )
  }

  const kind = r.getString('kind')
  const horizon = r.getString('horizon')
  if (
    !['present', 'future'].includes(kind) ||
    !(kind === 'present'
      ? horizon === 'now'
      : ['short', 'medium', 'long', 'open'].includes(horizon))
  )
    throw new BadRequestError('Confira o momento e o horizonte.')
  if (!r.getString('title').trim() || r.getString('title').length > 160)
    throw new BadRequestError('Informe um título de até 160 caracteres.')
  for (const field of ['narrative', 'meaning', 'resources', 'limits', 'first_step'])
    if (r.getString(field).length > 5000)
      throw new BadRequestError('Cada relato pode ter até 5.000 caracteres.')
  e.next()
}, 'cer_life_directions')

onRecordUpdateRequest((e) => {
  const r = e.record
  const kind = r.getString('kind')
  const horizon = r.getString('horizon')
  if (
    !['present', 'future'].includes(kind) ||
    !(kind === 'present'
      ? horizon === 'now'
      : ['short', 'medium', 'long', 'open'].includes(horizon))
  )
    throw new BadRequestError('Confira o momento e o horizonte.')
  if (!r.getString('title').trim() || r.getString('title').length > 160)
    throw new BadRequestError('Informe um título de até 160 caracteres.')
  for (const field of ['narrative', 'meaning', 'resources', 'limits', 'first_step'])
    if (r.getString(field).length > 5000)
      throw new BadRequestError('Cada relato pode ter até 5.000 caracteres.')
  e.next()
}, 'cer_life_directions')
