// Deliberately accepts enumerated diagnostics only, never error messages/URLs/stacks.
routerAdd('POST', '/backend/v1/cer/quality', (e) => {
  const app = e.app
  const body = e.requestInfo().body
  const actor = app.findRecordById('users', e.auth.id)
  if (actor.getString('status') !== 'active') throw new ForbiddenError('Conta inativa.')
  const hasRole = (role) => app.findRecordsByFilter('user_roles', 'user_id = {:id} && role = {:role} && is_active = true', '', 1, 0, { id: actor.id, role }).length > 0
  const isProfessional = hasRole('profissional')
  const ownEnrollments = () => app.findRecordsByFilter('enrollments', 'person_id = {:person} && status = "active"', '', 100, 0, { person: actor.getString('person_id') })
  const primary = (enrollment) => {
    const links = app.findRecordsByFilter('professional_enrollment_access', 'enrollment_id = {:id} && access_role = "primary" && is_active = true', '', 2, 0, { id: enrollment.id })
    if (links.length !== 1) throw new BadRequestError('Não foi possível identificar sua profissional responsável.')
    const professional = app.findRecordById('users', links[0].getString('professional_user_id'))
    if (professional.getString('status') !== 'active') throw new ForbiddenError('Profissional indisponível.')
    return professional.id
  }
  const canReview = (record) => {
    if (!isProfessional || record.getString('professional_id') !== actor.id) throw new ForbiddenError('Sem acesso.')
    // A former professional cannot continue reading therapeutic feedback after unlinking.
    const links = app.findRecordsByFilter('professional_enrollment_access', 'enrollment_id = {:id} && professional_user_id = {:user} && access_role = "primary" && is_active = true', '', 1, 0, { id: record.getString('enrollment_id'), user: actor.id })
    if (!links.length) throw new ForbiddenError('Vínculo encerrado.')
  }
  // Keep generated helpers out of isolated JSVM callbacks: object spread can
  // compile to a module-level helper that is unavailable when this route runs.
  const feedbackDTO = (r, internal = false) => {
    const dto = { id: r.id, category: r.getString('category'), message: r.getString('message'), status: r.getString('status'), created: r.getString('created') }
    if (internal) {
      dto.enrollment_id = r.getString('enrollment_id')
      dto.review_note = r.getString('review_note')
    }
    return dto
  }
  if (body.action === 'context') {
    if (!hasRole('interagente')) throw new ForbiddenError('Espaço das interagentes.')
    return e.json(200, ownEnrollments().map((r) => ({ id: r.id, professional: app.findRecordById('users', primary(r)).getString('name'), product: app.findRecordById('cer_products', r.getString('product_id')).getString('name') })))
  }
  if (body.action === 'submit') {
    if (!hasRole('interagente')) throw new ForbiddenError('Espaço das interagentes.')
    if (!['app', 'process'].includes(body.category) || typeof body.message !== 'string' || !body.message.trim() || body.message.trim().length > 3000 || typeof body.request_id !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(body.request_id)) throw new BadRequestError('Confira seu relato (até 3.000 caracteres).')
    let result
    app.runInTransaction((tx) => {
      const enrollment = tx.findRecordById('enrollments', String(body.enrollment_id || ''))
      if (enrollment.getString('person_id') !== actor.getString('person_id') || enrollment.getString('status') !== 'active') throw new ForbiddenError('Sem acesso.')
      const old = tx.findRecordsByFilter('cer_pilot_feedback', 'author_id = {:id} && request_id = {:request}', '', 1, 0, { id: actor.id, request: body.request_id })
      if (old.length) {
        if (old[0].getString('message') !== body.message.trim() || old[0].getString('category') !== body.category || old[0].getString('enrollment_id') !== enrollment.id) throw new BadRequestError('Atualize o formulário antes de enviar outro relato.')
        result = old[0]; return
      }
      if (tx.countRecords('cer_pilot_feedback', $dbx.exp('author_id = {:id} AND created >= {:since}', { id: actor.id, since: new Date(Date.now() - 86400000).toISOString().replace('T', ' ') })) >= 10) throw new BadRequestError('Limite de relatos de hoje atingido. Tente novamente amanhã.')
      const r = new Record(tx.findCollectionByNameOrId('cer_pilot_feedback'))
      const values = { author_id: actor.id, enrollment_id: enrollment.id, professional_id: primary(enrollment), category: body.category, message: body.message.trim(), status: 'new', request_id: body.request_id }
      for (const k in values) r.set(k, values[k])
      tx.save(r); result = r
    })
    return e.json(200, feedbackDTO(result))
  }
  if (body.action === 'mine') {
    if (!hasRole('interagente')) throw new ForbiddenError('Espaço das interagentes.')
    return e.json(200, app.findRecordsByFilter('cer_pilot_feedback', 'author_id = {:id}', '-created,-id', 100, 0, { id: actor.id }).map((r) => feedbackDTO(r)))
  }
  if (body.action === 'incident') {
    if (!['ui_exception', 'unhandled_rejection', 'onboarding_save', 'feedback_save', 'quality_load'].includes(body.code) || !['journey', 'professional', 'feedback', 'other'].includes(body.area) || body.release !== 'pilot-quality-v1') throw new BadRequestError('Diagnóstico inválido.')
    let professional
    if (isProfessional) professional = actor.id
    else {
      if (!hasRole('interagente')) throw new ForbiddenError('Sem acesso.')
      const enrollment = ownEnrollments().find((r) => r.id === body.enrollment_id)
      if (!enrollment) throw new ForbiddenError('Sem acesso.')
      professional = primary(enrollment)
    }
    // Hard cap, including forged clients; no arbitrary metadata is persisted.
    let accepted = false
    app.runInTransaction((tx) => {
      if (tx.countRecords('cer_pilot_incidents', $dbx.exp('actor_id = {:id} AND created >= {:since}', { id: actor.id, since: new Date(Date.now() - 86400000).toISOString().replace('T', ' ') })) >= 30) return
      const r = new Record(tx.findCollectionByNameOrId('cer_pilot_incidents'))
      const values = { actor_id: actor.id, professional_id: professional, code: body.code, area: body.area, release: body.release }
      for (const k in values) r.set(k, values[k])
      tx.save(r); accepted = true
    })
    return e.json(200, { accepted })
  }
  if (!isProfessional) throw new ForbiddenError('Espaço profissional.')
  if (body.action === 'inbox') {
    const page = Math.max(0, Math.min(10000, Math.floor(Number(body.page) || 0)))
    const rows = app.findRecordsByFilter('cer_pilot_feedback', 'professional_id = {:id} && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= {:id} && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active = true && enrollment_id.professional_enrollment_access_via_enrollment_id.access_role = "primary"', '-created,-id', 51, page * 50, { id: actor.id })
    const visible = rows.filter((r) => { try { canReview(r); return true } catch { return false } })
    return e.json(200, { items: visible.slice(0, 50).map((r) => feedbackDTO(r, true)), has_more: rows.length > 50 })
  }
  if (body.action === 'review') {
    if (!['new', 'reviewing', 'resolved'].includes(body.status) || typeof body.note !== 'string' || body.note.length > 1000) throw new BadRequestError('Revisão inválida.')
    const r = app.findRecordById('cer_pilot_feedback', String(body.id || ''))
    canReview(r)
    r.set('status', body.status); r.set('review_note', body.note.trim()); app.save(r)
    return e.json(200, feedbackDTO(r, true))
  }
  if (body.action === 'audits') {
    return e.json(200, app.findRecordsByFilter('cer_pilot_weekly_audits', 'professional_id = {:id}', '-week_start', 26, 0, { id: actor.id }).map((r) => ({ id: r.id, week_start: r.getString('week_start'), week_end: r.getString('week_end'), summary: r.get('summary'), reviewed_at: r.getString('reviewed_at') })))
  }
  if (body.action === 'acknowledge') {
    const r = app.findRecordById('cer_pilot_weekly_audits', String(body.id || ''))
    if (r.getString('professional_id') !== actor.id) throw new ForbiddenError('Sem acesso.')
    if (!r.getString('reviewed_at')) { r.set('reviewed_at', new Date().toISOString()); app.save(r) }
    return e.json(200, { reviewed: true })
  }
  throw new BadRequestError('Ação inválida.')
}, $apis.requireAuth('users'), $apis.bodyLimit(16000))

// Mondays 11:00 UTC = 08:00 America/Sao_Paulo. Previous complete local week.
// Catch up the last four weeks after downtime; unique index makes reruns safe.
cronAdd('cer_pilot_weekly_quality', '0 11 * * 1', () => {
  const app = $app
  const count = (collection, filter, params) => app.countRecords(collection, $dbx.exp(filter.replace(/ && /g, ' AND '), params))
  const local = new Date(Date.now() - 3 * 3600000)
  const day = (local.getUTCDay() + 6) % 7
  const monday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - day) + 3 * 3600000
  const roles = app.findRecordsByFilter('user_roles', 'role = "profissional" && is_active = true && user_id.status = "active"', '', 0, 0)
  const seen = {}
  for (const role of roles) {
    const professional = role.getString('user_id')
    if (seen[professional]) continue
    seen[professional] = true
    for (let offset = 1; offset <= 4; offset++) {
      const start = new Date(monday - offset * 7 * 86400000).toISOString()
      const end = new Date(monday - (offset - 1) * 7 * 86400000).toISOString()
      const week = start.slice(0, 10)
      if (count('cer_pilot_weekly_audits', 'professional_id = {:id} && week_start = {:week}', { id: professional, week })) continue
      const params = { id: professional, start: start.replace('T', ' '), end: end.replace('T', ' ') }
      const filter = 'professional_id = {:id} && created >= {:start} && created < {:end}'
      const appFeedback = count('cer_pilot_feedback', filter + ' && category = "app"', params)
      const processFeedback = count('cer_pilot_feedback', filter + ' && category = "process"', params)
      const incidents = count('cer_pilot_incidents', filter, params)
      // No empty retroactive reports; zero incidents never certifies system health.
      if (!appFeedback && !processFeedback && !incidents) continue
      const byCode = {}
      for (const code of ['ui_exception', 'unhandled_rejection', 'onboarding_save', 'feedback_save', 'quality_load']) byCode[code] = count('cer_pilot_incidents', filter + ' && code = {:code}', Object.assign({}, params, { code }))
      const r = new Record(app.findCollectionByNameOrId('cer_pilot_weekly_audits'))
      r.set('professional_id', professional); r.set('week_start', week); r.set('week_end', end.slice(0, 10))
      r.set('summary', { app_feedback: appFeedback, process_feedback: processFeedback, incidents, by_code: byCode, pending_review_at_generation: count('cer_pilot_feedback', filter + ' && status != "resolved"', params) })
      app.save(r)
    }
  }
})
