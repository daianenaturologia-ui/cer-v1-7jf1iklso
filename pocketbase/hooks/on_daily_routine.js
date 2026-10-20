/// <reference path="../pb_data/types.d.ts" />
onRecordValidate((e) => {
  let moments
  try {
    moments = JSON.parse(e.record.getString('moments'))
  } catch (_) {
    throw new BadRequestError('Confira os momentos do dia.')
  }
  if (!Array.isArray(moments) || !moments.length || moments.length > 64)
    throw new BadRequestError('Registre de 1 a 64 momentos do dia.')
  for (const m of moments) {
    if (
      !m ||
      typeof m.time !== 'string' ||
      (m.time !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time)) ||
      typeof m.activity !== 'string' ||
      !m.activity.trim() ||
      m.activity.length > 500
    )
      throw new BadRequestError('Confira os horários e as atividades do dia.')
  }
  e.next()
}, 'cer_daily_routines')
