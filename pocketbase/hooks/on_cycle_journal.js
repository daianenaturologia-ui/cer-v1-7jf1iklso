// Validate dates and cross-field consistency even for direct API callers.
const validateCycleDay = (e) => {
  const r = e.record
  const signs = Array.from(r.get('cycle_signs') || [])
  if (
    !Array.isArray(signs) ||
    signs.length > 2 ||
    signs.some(
      (v) => !['TPM percebida', 'Sinais de ovulação percebidos', 'Não sei identificar'].includes(v),
    ) ||
    (signs.includes('Não sei identificar') && signs.length > 1)
  )
    throw new BadRequestError('Confira os sinais percebidos do ciclo.')
  const day = r.getString('day')
  const parsed = new Date(day + 'T12:00:00Z')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== day
  )
    throw new BadRequestError('Data inválida.')
  // One-day tolerance for client timezones; frontend restricts to the user's today.
  if (parsed.getTime() > Date.now() + 36 * 3600000)
    throw new BadRequestError('Não é possível registrar dias futuros.')
  if (
    r.getBool('period_start') &&
    !['Leve', 'Moderado', 'Intenso'].includes(r.getString('bleeding'))
  )
    throw new BadRequestError('Informe o fluxo antes de marcar o início da menstruação.')
  e.next()
}
onRecordCreateRequest(validateCycleDay, 'cer_cycle_entries')
onRecordUpdateRequest(validateCycleDay, 'cer_cycle_entries')
const validateCycleProfile = (e) => {
  const length = e.record.getInt('cycle_length')
  if (length !== 0 && length < 21)
    throw new BadRequestError('Deixe a duração em branco ou informe de 21 a 45 dias.')
  e.next()
}
onRecordCreateRequest(validateCycleProfile, 'cer_cycle_profiles')
onRecordUpdateRequest(validateCycleProfile, 'cer_cycle_profiles')
