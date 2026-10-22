// A shared, agreed document is the source of the operational cycle anchor.
// No draft or private note is copied. Existing care histories remain unchanged.
routerAdd(
  'POST',
  '/backend/v1/cer/care-plan-for-cycle',
  (e) => {
    const enrollmentId = e.requestInfo().body.enrollment_id
    if (typeof enrollmentId !== 'string' || !/^[a-zA-Z0-9]{15}$/.test(enrollmentId))
      throw new BadRequestError('Matrícula inválida.')
    const actor = e.auth.id
    if (e.app.findRecordById('users', actor).getString('status') !== 'active')
      throw new ForbiddenError('Sua conta não está ativa.')
    try {
      e.app.findFirstRecordByFilter(
        'user_roles',
        'user_id = {:actor} && role = "profissional" && is_active = true',
        { actor },
      )
      e.app.findFirstRecordByFilter(
        'professional_enrollment_access',
        'enrollment_id = {:enrollmentId} && professional_user_id = {:actor} && is_active = true',
        { enrollmentId, actor },
      )
    } catch (_) {
      throw new ForbiddenError('Esta ação requer a profissional responsável.')
    }
    let result
    e.app.runInTransaction((app) => {
      const active = app.findRecordsByFilter(
        'cer_care_plans',
        'enrollment_id = {:enrollmentId} && status = "active"',
        '-revision_number',
        1,
        0,
        { enrollmentId },
      )
      if (active.length) {
        result = active[0]
        return
      }
      const versions = app.findRecordsByFilter(
        'cer_development_plan_versions',
        'enrollment_id = {:enrollmentId}',
        '-created,-revision',
        1,
        0,
        { enrollmentId },
      )
      const version = versions[0]
      if (!version || version.getString('stage') !== 'agreed')
        throw new BadRequestError(
          'Compartilhe uma versão combinada do Plano de Desenvolvimento antes de criar o ciclo.',
        )
      const doc = JSON.parse(version.getString('document'))
      const plan = new Record(app.findCollectionByNameOrId('cer_care_plans'))
      plan.set('enrollment_id', enrollmentId)
      plan.set('development_version_id', version.id)
      plan.set('direction_mode', 'contextualized')
      plan.set('direction_statement', (doc.title + '\n' + doc.priorities).slice(0, 5000))
      plan.set('created_by_user_id', actor)
      plan.set('status', 'active')
      app.save(plan)
      result = plan
    })
    return e.json(200, { id: result.id, enrollment_id: enrollmentId })
  },
  $apis.requireAuth('users'),
  $apis.bodyLimit(2000),
)
