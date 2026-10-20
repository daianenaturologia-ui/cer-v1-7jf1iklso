// Separate private drafts from immutable shared snapshots. Never copy private_notes.
onRecordCreateRequest((e) => {
  const read = (record, key) => {
    const value = record.getString(key)
    try {
      return value ? JSON.parse(value) : null
    } catch (_) {
      throw new BadRequestError('Confira o conteúdo do plano.')
    }
  }
  const text = (s, max) => typeof s === 'string' && s.length <= max
  const keys = (obj, allowed) =>
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    Object.keys(obj).every((k) => allowed.includes(k))
  const validate = (doc, stage) => {
    if (
      !keys(doc, ['title', 'moment', 'priorities', 'goals', 'next_session']) ||
      !text(doc.title, 160) ||
      !doc.title.trim() ||
      !text(doc.moment, 10000) ||
      !text(doc.priorities, 10000) ||
      !text(doc.next_session, 10000) ||
      !Array.isArray(doc.goals) ||
      doc.goals.length > 12
    )
      throw new BadRequestError('Confira os textos do plano.')
    const ids = []
    const id = (s) => {
      if (!text(s, 80) || !/^[a-zA-Z0-9-]+$/.test(s) || ids.includes(s))
        throw new BadRequestError('Identificações de metas e ações devem ser únicas.')
      ids.push(s)
    }
    for (const goal of doc.goals) {
      if (
        !keys(goal, ['id', 'title', 'progress', 'actions']) ||
        !text(goal.title, 5000) ||
        !text(goal.progress, 5000) ||
        !Array.isArray(goal.actions) ||
        goal.actions.length > 12
      )
        throw new BadRequestError('Confira as metas.')
      id(goal.id)
      for (const action of goal.actions) {
        if (
          !keys(action, ['id', 'title', 'context', 'fallback', 'resource']) ||
          !text(action.title, 5000) ||
          !text(action.context, 5000) ||
          !text(action.fallback, 5000)
        )
          throw new BadRequestError('Confira as ações.')
        id(action.id)
        if (stage === 'agreed' && (!action.title.trim() || !action.context.trim()))
          throw new BadRequestError('Complete as ações antes de combinar o plano.')
        if (action.resource) {
          const resource = action.resource
          if (
            !keys(resource, [
              'id',
              'title',
              'theme',
              'duration',
              'lesson',
              'instructions',
              'fallback',
              'reflection',
              'material',
            ]) ||
            !text(resource.id, 160) ||
            !resource.id ||
            !text(resource.title, 160) ||
            !resource.title.trim() ||
            !text(resource.lesson, 5000) ||
            !resource.lesson.trim() ||
            !Array.isArray(resource.instructions) ||
            !resource.instructions.length ||
            resource.instructions.length > 12 ||
            resource.instructions.some((s) => !text(s, 1500) || !s.trim())
          )
            throw new BadRequestError('Confira o recurso de apoio.')
          for (const k of ['theme', 'duration', 'fallback', 'reflection'])
            if (!text(resource[k], 5000)) throw new BadRequestError('Confira o recurso.')
          if (resource.material) {
            const m = resource.material
            if (
              !keys(m, ['format', 'url', 'author', 'references', 'conditions']) ||
              !['text', 'pdf', 'audio', 'video'].includes(m.format)
            )
              throw new BadRequestError('Confira o material.')
            for (const k of ['url', 'author', 'references', 'conditions'])
              if (m[k] !== undefined && !text(m[k], k === 'url' ? 2000 : 5000))
                throw new BadRequestError('Confira o material.')
            if (m.format !== 'text' && !m.url)
              throw new BadRequestError('Informe o endereço do material.')
            if (
              m.url &&
              (!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?(?:[/?#]|$)/i.test(m.url) ||
                /[\s\\\x00-\x1f\x7f]/.test(m.url) ||
                /^https:\/\/[^/?#]*@/i.test(m.url))
            )
              throw new BadRequestError('Use um endereço HTTPS válido.')
          }
        }
      }
      if (
        stage === 'agreed' &&
        (!goal.title.trim() || !goal.progress.trim() || !goal.actions.length)
      )
        throw new BadRequestError('Complete metas, sinais de avanço e ações.')
    }
    if (stage === 'agreed' && doc.goals.filter((g) => g.id !== 'cer-integrative-care').length > 1)
      throw new BadRequestError('Escolham uma meta principal para este ciclo.')
    if (stage && !doc.moment.trim())
      throw new BadRequestError('Escreva a síntese antes de compartilhar.')
    if (
      stage === 'agreed' &&
      (!doc.priorities.trim() || !doc.goals.some((g) => g.id !== 'cer-integrative-care'))
    )
      throw new BadRequestError('Definam prioridades e metas antes de combinar.')
  }

  validate(read(e.record, 'document'))
  const old = e.record.original()
  const expected = old.id && old.getInt('revision') ? old.getInt('revision') + 1 : 1
  if (e.record.getInt('revision') !== expected)
    throw new BadRequestError('O plano mudou em outra janela. Recarregue antes de editar.')
  e.next()
}, 'cer_development_plan_drafts')
onRecordUpdateRequest((e) => {
  const read = (record, key) => {
    const value = record.getString(key)
    try {
      return value ? JSON.parse(value) : null
    } catch (_) {
      throw new BadRequestError('Confira o conteúdo do plano.')
    }
  }
  const text = (s, max) => typeof s === 'string' && s.length <= max
  const keys = (obj, allowed) =>
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    Object.keys(obj).every((k) => allowed.includes(k))
  const validate = (doc, stage) => {
    if (
      !keys(doc, ['title', 'moment', 'priorities', 'goals', 'next_session']) ||
      !text(doc.title, 160) ||
      !doc.title.trim() ||
      !text(doc.moment, 10000) ||
      !text(doc.priorities, 10000) ||
      !text(doc.next_session, 10000) ||
      !Array.isArray(doc.goals) ||
      doc.goals.length > 12
    )
      throw new BadRequestError('Confira os textos do plano.')
    const ids = []
    const id = (s) => {
      if (!text(s, 80) || !/^[a-zA-Z0-9-]+$/.test(s) || ids.includes(s))
        throw new BadRequestError('Identificações de metas e ações devem ser únicas.')
      ids.push(s)
    }
    for (const goal of doc.goals) {
      if (
        !keys(goal, ['id', 'title', 'progress', 'actions']) ||
        !text(goal.title, 5000) ||
        !text(goal.progress, 5000) ||
        !Array.isArray(goal.actions) ||
        goal.actions.length > 12
      )
        throw new BadRequestError('Confira as metas.')
      id(goal.id)
      for (const action of goal.actions) {
        if (
          !keys(action, ['id', 'title', 'context', 'fallback', 'resource']) ||
          !text(action.title, 5000) ||
          !text(action.context, 5000) ||
          !text(action.fallback, 5000)
        )
          throw new BadRequestError('Confira as ações.')
        id(action.id)
        if (stage === 'agreed' && (!action.title.trim() || !action.context.trim()))
          throw new BadRequestError('Complete as ações antes de combinar o plano.')
        if (action.resource) {
          const resource = action.resource
          if (
            !keys(resource, [
              'id',
              'title',
              'theme',
              'duration',
              'lesson',
              'instructions',
              'fallback',
              'reflection',
              'material',
            ]) ||
            !text(resource.id, 160) ||
            !resource.id ||
            !text(resource.title, 160) ||
            !resource.title.trim() ||
            !text(resource.lesson, 5000) ||
            !resource.lesson.trim() ||
            !Array.isArray(resource.instructions) ||
            !resource.instructions.length ||
            resource.instructions.length > 12 ||
            resource.instructions.some((s) => !text(s, 1500) || !s.trim())
          )
            throw new BadRequestError('Confira o recurso de apoio.')
          for (const k of ['theme', 'duration', 'fallback', 'reflection'])
            if (!text(resource[k], 5000)) throw new BadRequestError('Confira o recurso.')
          if (resource.material) {
            const m = resource.material
            if (
              !keys(m, ['format', 'url', 'author', 'references', 'conditions']) ||
              !['text', 'pdf', 'audio', 'video'].includes(m.format)
            )
              throw new BadRequestError('Confira o material.')
            for (const k of ['url', 'author', 'references', 'conditions'])
              if (m[k] !== undefined && !text(m[k], k === 'url' ? 2000 : 5000))
                throw new BadRequestError('Confira o material.')
            if (m.format !== 'text' && !m.url)
              throw new BadRequestError('Informe o endereço do material.')
            if (
              m.url &&
              (!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?(?:[/?#]|$)/i.test(m.url) ||
                /[\s\\\x00-\x1f\x7f]/.test(m.url) ||
                /^https:\/\/[^/?#]*@/i.test(m.url))
            )
              throw new BadRequestError('Use um endereço HTTPS válido.')
          }
        }
      }
      if (
        stage === 'agreed' &&
        (!goal.title.trim() || !goal.progress.trim() || !goal.actions.length)
      )
        throw new BadRequestError('Complete metas, sinais de avanço e ações.')
    }
    if (stage === 'agreed' && doc.goals.filter((g) => g.id !== 'cer-integrative-care').length > 1)
      throw new BadRequestError('Escolham uma meta principal para este ciclo.')
    if (stage && !doc.moment.trim())
      throw new BadRequestError('Escreva a síntese antes de compartilhar.')
    if (
      stage === 'agreed' &&
      (!doc.priorities.trim() || !doc.goals.some((g) => g.id !== 'cer-integrative-care'))
    )
      throw new BadRequestError('Definam prioridades e metas antes de combinar.')
  }

  validate(read(e.record, 'document'))
  e.app.runInTransaction((tx) => {
    const current = tx.findRecordById('cer_development_plan_drafts', e.record.id)
    if (e.record.getInt('revision') !== current.getInt('revision') + 1)
      throw new BadRequestError('O plano mudou em outra janela. Recarregue antes de editar.')
    e.app = tx
    e.next()
  })
}, 'cer_development_plan_drafts')
onRecordCreateRequest((e) => {
  const read = (record, key) => {
    const value = record.getString(key)
    try {
      return value ? JSON.parse(value) : null
    } catch (_) {
      throw new BadRequestError('Confira o conteúdo do plano.')
    }
  }
  const text = (s, max) => typeof s === 'string' && s.length <= max
  const keys = (obj, allowed) =>
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    Object.keys(obj).every((k) => allowed.includes(k))
  const validate = (doc, stage) => {
    if (
      !keys(doc, ['title', 'moment', 'priorities', 'goals', 'next_session']) ||
      !text(doc.title, 160) ||
      !doc.title.trim() ||
      !text(doc.moment, 10000) ||
      !text(doc.priorities, 10000) ||
      !text(doc.next_session, 10000) ||
      !Array.isArray(doc.goals) ||
      doc.goals.length > 12
    )
      throw new BadRequestError('Confira os textos do plano.')
    const ids = []
    const id = (s) => {
      if (!text(s, 80) || !/^[a-zA-Z0-9-]+$/.test(s) || ids.includes(s))
        throw new BadRequestError('Identificações de metas e ações devem ser únicas.')
      ids.push(s)
    }
    for (const goal of doc.goals) {
      if (
        !keys(goal, ['id', 'title', 'progress', 'actions']) ||
        !text(goal.title, 5000) ||
        !text(goal.progress, 5000) ||
        !Array.isArray(goal.actions) ||
        goal.actions.length > 12
      )
        throw new BadRequestError('Confira as metas.')
      id(goal.id)
      for (const action of goal.actions) {
        if (
          !keys(action, ['id', 'title', 'context', 'fallback', 'resource']) ||
          !text(action.title, 5000) ||
          !text(action.context, 5000) ||
          !text(action.fallback, 5000)
        )
          throw new BadRequestError('Confira as ações.')
        id(action.id)
        if (stage === 'agreed' && (!action.title.trim() || !action.context.trim()))
          throw new BadRequestError('Complete as ações antes de combinar o plano.')
        if (action.resource) {
          const resource = action.resource
          if (
            !keys(resource, [
              'id',
              'title',
              'theme',
              'duration',
              'lesson',
              'instructions',
              'fallback',
              'reflection',
              'material',
            ]) ||
            !text(resource.id, 160) ||
            !resource.id ||
            !text(resource.title, 160) ||
            !resource.title.trim() ||
            !text(resource.lesson, 5000) ||
            !resource.lesson.trim() ||
            !Array.isArray(resource.instructions) ||
            !resource.instructions.length ||
            resource.instructions.length > 12 ||
            resource.instructions.some((s) => !text(s, 1500) || !s.trim())
          )
            throw new BadRequestError('Confira o recurso de apoio.')
          for (const k of ['theme', 'duration', 'fallback', 'reflection'])
            if (!text(resource[k], 5000)) throw new BadRequestError('Confira o recurso.')
          if (resource.material) {
            const m = resource.material
            if (
              !keys(m, ['format', 'url', 'author', 'references', 'conditions']) ||
              !['text', 'pdf', 'audio', 'video'].includes(m.format)
            )
              throw new BadRequestError('Confira o material.')
            for (const k of ['url', 'author', 'references', 'conditions'])
              if (m[k] !== undefined && !text(m[k], k === 'url' ? 2000 : 5000))
                throw new BadRequestError('Confira o material.')
            if (m.format !== 'text' && !m.url)
              throw new BadRequestError('Informe o endereço do material.')
            if (
              m.url &&
              (!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?(?:[/?#]|$)/i.test(m.url) ||
                /[\s\\\x00-\x1f\x7f]/.test(m.url) ||
                /^https:\/\/[^/?#]*@/i.test(m.url))
            )
              throw new BadRequestError('Use um endereço HTTPS válido.')
          }
        }
      }
      if (
        stage === 'agreed' &&
        (!goal.title.trim() || !goal.progress.trim() || !goal.actions.length)
      )
        throw new BadRequestError('Complete metas, sinais de avanço e ações.')
    }
    if (stage === 'agreed' && doc.goals.filter((g) => g.id !== 'cer-integrative-care').length > 1)
      throw new BadRequestError('Escolham uma meta principal para este ciclo.')
    if (stage && !doc.moment.trim())
      throw new BadRequestError('Escreva a síntese antes de compartilhar.')
    if (
      stage === 'agreed' &&
      (!doc.priorities.trim() || !doc.goals.some((g) => g.id !== 'cer-integrative-care'))
    )
      throw new BadRequestError('Definam prioridades e metas antes de combinar.')
  }

  const draft = e.app.findRecordById('cer_development_plan_drafts', e.record.getString('draft_id'))
  if (
    draft.getString('enrollment_id') !== e.record.getString('enrollment_id') ||
    draft.getString('author_id') !== e.auth.id ||
    draft.getInt('revision') !== e.record.getInt('revision')
  )
    throw new BadRequestError('Reabra a revisão atual deste plano.')
  const doc = read(draft, 'document')
  validate(doc, e.record.getString('stage'))
  e.record.set('document', doc)
  e.next()
}, 'cer_development_plan_versions')
onRecordCreateRequest((e) => {
  const read = (record, key) => {
    const value = record.getString(key)
    try {
      return value ? JSON.parse(value) : null
    } catch (_) {
      throw new BadRequestError('Confira o conteúdo do plano.')
    }
  }
  const text = (s, max) => typeof s === 'string' && s.length <= max
  const keys = (obj, allowed) =>
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    Object.keys(obj).every((k) => allowed.includes(k))
  const validate = (doc, stage) => {
    if (
      !keys(doc, ['title', 'moment', 'priorities', 'goals', 'next_session']) ||
      !text(doc.title, 160) ||
      !doc.title.trim() ||
      !text(doc.moment, 10000) ||
      !text(doc.priorities, 10000) ||
      !text(doc.next_session, 10000) ||
      !Array.isArray(doc.goals) ||
      doc.goals.length > 12
    )
      throw new BadRequestError('Confira os textos do plano.')
    const ids = []
    const id = (s) => {
      if (!text(s, 80) || !/^[a-zA-Z0-9-]+$/.test(s) || ids.includes(s))
        throw new BadRequestError('Identificações de metas e ações devem ser únicas.')
      ids.push(s)
    }
    for (const goal of doc.goals) {
      if (
        !keys(goal, ['id', 'title', 'progress', 'actions']) ||
        !text(goal.title, 5000) ||
        !text(goal.progress, 5000) ||
        !Array.isArray(goal.actions) ||
        goal.actions.length > 12
      )
        throw new BadRequestError('Confira as metas.')
      id(goal.id)
      for (const action of goal.actions) {
        if (
          !keys(action, ['id', 'title', 'context', 'fallback', 'resource']) ||
          !text(action.title, 5000) ||
          !text(action.context, 5000) ||
          !text(action.fallback, 5000)
        )
          throw new BadRequestError('Confira as ações.')
        id(action.id)
        if (stage === 'agreed' && (!action.title.trim() || !action.context.trim()))
          throw new BadRequestError('Complete as ações antes de combinar o plano.')
        if (action.resource) {
          const resource = action.resource
          if (
            !keys(resource, [
              'id',
              'title',
              'theme',
              'duration',
              'lesson',
              'instructions',
              'fallback',
              'reflection',
              'material',
            ]) ||
            !text(resource.id, 160) ||
            !resource.id ||
            !text(resource.title, 160) ||
            !resource.title.trim() ||
            !text(resource.lesson, 5000) ||
            !resource.lesson.trim() ||
            !Array.isArray(resource.instructions) ||
            !resource.instructions.length ||
            resource.instructions.length > 12 ||
            resource.instructions.some((s) => !text(s, 1500) || !s.trim())
          )
            throw new BadRequestError('Confira o recurso de apoio.')
          for (const k of ['theme', 'duration', 'fallback', 'reflection'])
            if (!text(resource[k], 5000)) throw new BadRequestError('Confira o recurso.')
          if (resource.material) {
            const m = resource.material
            if (
              !keys(m, ['format', 'url', 'author', 'references', 'conditions']) ||
              !['text', 'pdf', 'audio', 'video'].includes(m.format)
            )
              throw new BadRequestError('Confira o material.')
            for (const k of ['url', 'author', 'references', 'conditions'])
              if (m[k] !== undefined && !text(m[k], k === 'url' ? 2000 : 5000))
                throw new BadRequestError('Confira o material.')
            if (m.format !== 'text' && !m.url)
              throw new BadRequestError('Informe o endereço do material.')
            if (
              m.url &&
              (!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?(?:[/?#]|$)/i.test(m.url) ||
                /[\s\\\x00-\x1f\x7f]/.test(m.url) ||
                /^https:\/\/[^/?#]*@/i.test(m.url))
            )
              throw new BadRequestError('Use um endereço HTTPS válido.')
          }
        }
      }
      if (
        stage === 'agreed' &&
        (!goal.title.trim() || !goal.progress.trim() || !goal.actions.length)
      )
        throw new BadRequestError('Complete metas, sinais de avanço e ações.')
    }
    if (stage === 'agreed' && doc.goals.filter((g) => g.id !== 'cer-integrative-care').length > 1)
      throw new BadRequestError('Escolham uma meta principal para este ciclo.')
    if (stage && !doc.moment.trim())
      throw new BadRequestError('Escreva a síntese antes de compartilhar.')
    if (
      stage === 'agreed' &&
      (!doc.priorities.trim() || !doc.goals.some((g) => g.id !== 'cer-integrative-care'))
    )
      throw new BadRequestError('Definam prioridades e metas antes de combinar.')
  }

  const version = e.app.findRecordById(
    'cer_development_plan_versions',
    e.record.getString('version_id'),
  )
  if (
    version.getString('enrollment_id') !== e.record.getString('enrollment_id') ||
    version.getString('stage') !== 'agreed'
  )
    throw new BadRequestError('Escolha uma versão combinada deste plano.')
  // A historical plan remains readable, but newly organised routines use the latest shared version.
  const latest = e.app.findRecordsByFilter(
    'cer_development_plan_versions',
    'enrollment_id = {:enrollment}',
    '-created,-revision',
    1,
    0,
    { enrollment: version.getString('enrollment_id') },
  )
  if (e.record.getBool('enabled') && (!latest.length || latest[0].id !== version.id))
    throw new BadRequestError(
      'O plano foi atualizado. Reabra a versão mais recente antes de organizar a rotina.',
    )
  const doc = read(version, 'document')
  validate(doc, 'agreed')
  let goal, action
  for (const g of doc.goals)
    for (const a of g.actions)
      if (a.id === e.record.getString('action_id')) {
        goal = g
        action = a
      }
  if (!action) throw new BadRequestError('Esta ação não pertence ao plano.')
  const schedule = read(e.record, 'schedule')
  if (
    !keys(schedule, ['days', 'time', 'duration', 'timezone']) ||
    !Array.isArray(schedule.days) ||
    !schedule.days.length ||
    schedule.days.length > 7 ||
    new Set(schedule.days).size !== schedule.days.length ||
    schedule.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time) ||
    !Number.isInteger(schedule.duration) ||
    schedule.duration < 5 ||
    schedule.duration > 240
  )
    throw new BadRequestError('Confira dias, horário e duração.')
  // Explicit supported zones avoid silently interpreting unknown identifiers in the runtime.
  if (
    ![
      'America/Sao_Paulo',
      'America/Manaus',
      'America/Rio_Branco',
      'America/Noronha',
      'Europe/Lisbon',
      'UTC',
    ].includes(schedule.timezone)
  )
    throw new BadRequestError('Escolha um fuso disponível.')
  const day = e.record.getString('effective_day'),
    date = new Date(day + 'T12:00:00Z')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== day ||
    date.getTime() < Date.now() - 36 * 3600000
  )
    throw new BadRequestError('Escolha hoje ou uma data futura para mudar a rotina.')
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(e.record.getString('command_key')))
    throw new BadRequestError('Confira a identificação desta organização.')
  e.record.set('snapshot', { goal: goal.title, progress: goal.progress, action })
  e.next()
}, 'cer_development_plan_routines')
