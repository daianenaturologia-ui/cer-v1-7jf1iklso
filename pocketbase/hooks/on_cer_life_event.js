onRecordCreateRequest((e) => {
  const r = e.record
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
      'Conclua as seis dimensões da Consciência antes de começar a Linha da Vida.',
    )

  const kind = r.getString('time_kind'),
    value = r.getString('time_value')
  const now = new Date()
  if (kind === 'date') {
    const date = new Date(value + 'T12:00:00Z')
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value ||
      value > now.toISOString().slice(0, 10)
    )
      throw new BadRequestError('Informe uma data válida até hoje.')
  } else if (kind === 'year') {
    if (!/^\d{4}$/.test(value) || +value < 1900 || +value > now.getUTCFullYear())
      throw new BadRequestError('Ano inválido.')
  } else if (kind === 'age') {
    if (!/^\d{1,3}$/.test(value) || +value > 130)
      throw new BadRequestError('Idade aproximada inválida.')
  } else if (kind === 'unknown') r.set('time_value', '')
  else throw new BadRequestError('Tipo de data inválido.')
  const allowed = [
    'Alegria',
    'Tristeza',
    'Medo',
    'Raiva',
    'Vergonha',
    'Culpa',
    'Alívio',
    'Gratidão',
    'Não sei nomear',
  ]
  let emotions
  try {
    emotions = JSON.parse(r.getString('emotions') || '[]')
  } catch (_) {
    throw new BadRequestError('Emoções inválidas.')
  }
  if (!Array.isArray(emotions) || emotions.some((value) => !allowed.includes(value)))
    throw new BadRequestError('Emoções inválidas.')
  if (!r.getString('title').trim()) throw new BadRequestError('Dê um nome ao acontecimento.')
  e.next()
}, 'cer_life_events')

onRecordUpdateRequest((e) => {
  const r = e.record
  const kind = r.getString('time_kind'),
    value = r.getString('time_value')
  const now = new Date()
  if (kind === 'date') {
    const date = new Date(value + 'T12:00:00Z')
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value ||
      value > now.toISOString().slice(0, 10)
    )
      throw new BadRequestError('Informe uma data válida até hoje.')
  } else if (kind === 'year') {
    if (!/^\d{4}$/.test(value) || +value < 1900 || +value > now.getUTCFullYear())
      throw new BadRequestError('Ano inválido.')
  } else if (kind === 'age') {
    if (!/^\d{1,3}$/.test(value) || +value > 130)
      throw new BadRequestError('Idade aproximada inválida.')
  } else if (kind === 'unknown') r.set('time_value', '')
  else throw new BadRequestError('Tipo de data inválido.')
  const allowed = [
    'Alegria',
    'Tristeza',
    'Medo',
    'Raiva',
    'Vergonha',
    'Culpa',
    'Alívio',
    'Gratidão',
    'Não sei nomear',
  ]
  let emotions
  try {
    emotions = JSON.parse(r.getString('emotions') || '[]')
  } catch (_) {
    throw new BadRequestError('Emoções inválidas.')
  }
  if (!Array.isArray(emotions) || emotions.some((value) => !allowed.includes(value)))
    throw new BadRequestError('Emoções inválidas.')
  if (!r.getString('title').trim()) throw new BadRequestError('Dê um nome ao acontecimento.')
  e.next()
}, 'cer_life_events')
