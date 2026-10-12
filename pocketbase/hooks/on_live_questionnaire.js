// Resolve the shipped catalog and prepare only the caller's already-authorized enrollment.
// Existing collection rules remain unchanged; no arbitrary catalog creation is exposed.
routerAdd('POST', '/backend/v1/cer/questionnaires/prepare', (e) => {
  function idFor(kind, logical) {
    function hash(salt) {
      let value = 2166136261
      const input = salt + ':' + kind + ':' + logical
      for (let i = 0; i < input.length; i++) value = Math.imul(value ^ input.charCodeAt(i), 16777619) >>> 0
      return ('0000000' + value.toString(36)).slice(-7)
    }
    return 'c' + hash('cer1') + hash('cer2')
  }
  const allowed = ['exp-corpo-fisiologia-07b', 'exp-mente-emocoes-07c', 'exp-regulacao-respostas-07c', 'exp-relacoes-07d', 'exp-sexualidade-07e', 'exp-sentido-conexao-07f', 'exp-integracao-consciencia-07g']
  const body = e.requestInfo().body
  const logicalExperience = String(body.experience_id || '')
  const logicalPrompt = String(body.prompt_id || '')
  if (!allowed.includes(logicalExperience)) throw new BadRequestError('Questionário não disponível.')
  const enrollment = $app.findRecordById('enrollments', String(body.enrollment_id || ''))
  const own = enrollment.getString('person_id') && enrollment.getString('person_id') === e.auth.getString('person_id')
  let professional = false
  if (!own) {
    try {
      $app.findFirstRecordByFilter('professional_enrollment_access', 'enrollment_id = {:enrollment} && professional_user_id = {:user} && is_active = true', { enrollment: enrollment.id, user: e.auth.id })
      professional = true
    } catch (_) {}
  }
  if (!own && !professional) throw new ForbiddenError('Sem acesso a este acompanhamento.')
  if (enrollment.getString('status') !== 'active') throw new ForbiddenError('Acompanhamento não está ativo.')
  const actualExperience = idFor('experience', logicalExperience)
  $app.findRecordById('cer_experiences', actualExperience)
  let result
  $app.runInTransaction((tx) => {
    let progress
    try {
      progress = tx.findFirstRecordByFilter('enrollment_experiences', 'enrollment_id = {:enrollment} && experience_id = {:experience}', { enrollment: enrollment.id, experience: actualExperience })
    } catch (_) {
      progress = new Record(tx.findCollectionByNameOrId('enrollment_experiences'), {
        enrollment_id: enrollment.id, experience_id: actualExperience,
        release_status: 'available', progress_status: 'not_started', current_step_order: 1,
        released_by_user_id: professional ? e.auth.id : '',
      })
      tx.save(progress)
    }
    // Viewing an explicitly locked/paused record is allowed; writing or starting it is not.
    const blocked = ['locked', 'paused'].includes(progress.getString('release_status'))
    let actualPrompt = ''
    if (logicalPrompt) {
      if (!own || blocked) throw new ForbiddenError('Este capítulo não está disponível para responder.')
      const revision = logicalPrompt.match(/^(ayv_c[12]_.+)_rev([2-9]|[1-9][0-9]{1,2})$/)
      const baseLogical = revision ? revision[1] : logicalPrompt
      const base = tx.findRecordById('cer_prompts', idFor('prompt', baseLogical))
      let schema = base.get('schema_config')
      if (typeof schema === 'string') schema = JSON.parse(schema)
      if (schema.cer_logical_prompt_id !== baseLogical || base.getString('experience_id') !== actualExperience) throw new BadRequestError('Pergunta fora deste questionário.')
      actualPrompt = idFor('prompt', logicalPrompt)
      if (revision) {
        const chapter = baseLogical.slice(0, 6)
        const completed = tx.findRecordsByFilter('experience_responses', 'enrollment_id = {:enrollment} && experience_id = {:experience} && response_type = "ChapterCompletion"', '', 0, 0, { enrollment: enrollment.id, experience: actualExperience })
        let maxCompleted = 0
        for (const response of completed) {
          let value = response.get('structured_value')
          if (typeof value === 'string') value = JSON.parse(value)
          const metadata = value.metadata || {}
          if (String(metadata.prompt_key || '').startsWith(chapter) && value.completed === true) maxCompleted = Math.max(maxCompleted, Number(value.revision_number || metadata.revision_number || 1))
        }
        if (Number(revision[2]) > maxCompleted + 1) throw new BadRequestError('Conclua a revisão anterior antes de iniciar outra.')
        let existing
        try { existing = tx.findRecordById('cer_prompts', actualPrompt) } catch (_) {}
        if (!existing) {
          const clone = new Record(tx.findCollectionByNameOrId('cer_prompts'))
          clone.set('id', actualPrompt)
          for (const field of ['experience_id', 'step_order', 'step_title', 'step_subtitle', 'component_type', 'prompt_text', 'helper_text', 'is_required', 'version', 'moment_id', 'prompt_order']) clone.set(field, base.get(field))
          clone.set('schema_config', Object.assign({}, schema, { cer_logical_prompt_id: logicalPrompt }))
          tx.save(clone)
        }
      }
    }
    result = { experience_id: actualExperience, prompt_id: actualPrompt, enrollment_experience: progress.publicExport() }
  })
  return e.json(200, result)
}, $apis.requireAuth())
