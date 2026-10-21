// All raw collection APIs are locked. This endpoint returns explicit public DTOs only.
routerAdd(
  'POST',
  '/backend/v1/cer/library',
  (e) => {
    const account = e.app.findRecordById('users', e.auth.id)
    if (account.getString('status') !== 'active')
      throw new ForbiddenError('Sua conta não está ativa.')
    const b = e.requestInfo().body,
      actor = account.id
    const action = b.action
    const text = (v, max, required = false) => {
      if (typeof v !== 'string' || v.length > max || (required && !v.trim()))
        throw new BadRequestError('Confira os textos e os limites de tamanho.')
      return v.trim()
    }
    const id = (v) => text(v, 180, true)
    const page = Number(b.page || 1)
    if (!Number.isInteger(page) || page < 1 || page > 10000)
      throw new BadRequestError('Página inválida.')
    const rows = (
      app,
      col,
      filter,
      params = {},
      sort = '-created,-id',
      limit = 21,
      offset = (page - 1) * 20,
    ) => app.findRecordsByFilter(col, filter, sort, limit, offset, params)
    const parse = (r) => JSON.parse(r.getString('payload'))
    let curator = false
    try {
      e.app.findFirstRecordByFilter('cer_library_curators', 'author_id = {:id}', { id: actor })
      e.app.findFirstRecordByFilter(
        'user_roles',
        'user_id = {:id} && role = "profissional" && is_active = true',
        { id: actor },
      )
      curator = true
    } catch (_) {}
    const requireCurator = () => {
      if (!curator) throw new ForbiddenError('Somente Daiane pode avaliar as contribuições.')
    }
    const own = (r) => {
      if (r.getString('author_id') !== actor)
        throw new ForbiddenError('Esta contribuição é de outra pessoa.')
    }
    const revision = (r) => {
      if (b.revision !== r.getInt('revision'))
        throw new BadRequestError('Esta versão mudou. Atualize antes de continuar.')
    }
    const dto = (r) => ({
      id: r.id,
      payload: parse(r),
      status: r.getString('status'),
      revision: r.getInt('revision'),
      review_note: r.getString('review_note'),
      updated: r.getString('updated'),
    })
    const payload = (v, complete) => {
      if (
        !v ||
        typeof v !== 'object' ||
        Array.isArray(v) ||
        Object.keys(v).some(
          (k) =>
            !['title', 'theme', 'duration', 'instructions', 'experience', 'display_name'].includes(
              k,
            ),
        )
      )
        throw new BadRequestError('Confira sua prática.')
      return {
        title: text(v.title, 160, complete),
        theme: text(v.theme, 100),
        duration: text(v.duration, 100),
        instructions: text(v.instructions, 6000, complete),
        experience: text(v.experience, 3000, complete),
        display_name: text(v.display_name, 60, complete),
      }
    }
    const save = (app, col, values) => {
      const r = new Record(app.findCollectionByNameOrId(col))
      for (const k in values) r.set(k, values[k])
      app.save(r)
      return r
    }
    const audit = (app, r, decision, note = '', target = '') =>
      save(app, 'cer_library_reviews', {
        author_id: actor,
        submission_id: r ? r.id : '',
        revision: r ? r.getInt('revision') : 0,
        decision,
        note,
        target_key: target,
      })
    const unpublish = (app, r) => {
      const postId = r.getString('post_id')
      if (postId) {
        const p = app.findRecordById('cer_library_posts', postId)
        p.set('available', false)
        app.save(p)
      }
    }
    const target = (app, key) => {
      if (key.startsWith('community:')) {
        const p = app.findRecordById('cer_library_posts', key.slice(10))
        if (!p.getBool('available')) throw new NotFoundError('Esta prática não está disponível.')
      } else if (key.startsWith('catalog:')) {
        const keyId = key.slice(8)
        const shipped = [
          'cer-cycle-listening-v1',
          'cer-nature-connection-v1',
          'cer-ritmo-v1',
          'cer-foco-v1',
          'cer-margem-v1',
          'cer-encerrar-v1',
          'cer-apoio-v1',
          'cer-desejo-v1',
          'cer-pequeno-v1',
          'cer-retomar-v1',
        ]
        if (!shipped.includes(keyId)) {
          const r = app.findRecordById('cer_development_resources', keyId)
          if (r.getString('status') !== 'published')
            throw new NotFoundError('Material não disponível.')
        }
      } else throw new BadRequestError('Prática inválida.')
    }
    const resultPage = (rs, map) => ({
      items: rs.slice(0, 20).map(map),
      has_more: rs.length > 20,
      page,
    })
    if (action === 'access') return e.json(200, { curator })
    if (action === 'feed')
      return e.json(
        200,
        resultPage(rows(e.app, 'cer_library_posts', 'available = true'), (r) => ({
          id: r.id,
          payload: parse(r),
          created: r.getString('created'),
        })),
      )
    if (action === 'mine')
      return e.json(
        200,
        resultPage(
          rows(
            e.app,
            'cer_library_submissions',
            'author_id = {:id}',
            { id: actor },
            '-updated,-id',
          ),
          dto,
        ),
      )
    if (action === 'queue') {
      requireCurator()
      return e.json(
        200,
        resultPage(
          rows(
            e.app,
            'cer_library_submissions',
            'status = "pending" || status = "approved"',
            {},
            '-updated,-id',
          ),
          dto,
        ),
      )
    }
    if (action === 'history') {
      requireCurator()
      const submission = e.app.findRecordById('cer_library_submissions', id(b.id))
      return e.json(
        200,
        resultPage(
          rows(e.app, 'cer_library_reviews', 'submission_id = {:id}', { id: submission.id }),
          (r) => ({
            id: r.id,
            decision: r.getString('decision'),
            note: r.getString('note'),
            revision: r.getInt('revision'),
            created: r.getString('created'),
          }),
        ),
      )
    }
    if (action === 'save') {
      const p = payload(b.payload, b.submit === true)
      if (b.submit === true && b.consent !== true)
        throw new BadRequestError('Confirme o envio para avaliação e a publicação após aprovação.')
      let result
      e.app.runInTransaction((tx) => {
        let r
        if (b.id) {
          r = tx.findRecordById('cer_library_submissions', id(b.id))
          own(r)
          revision(r)
          unpublish(tx, r)
        } else r = new Record(tx.findCollectionByNameOrId('cer_library_submissions'))
        r.set('author_id', actor)
        r.set('payload', p)
        r.set('revision', r.getInt('revision') + 1)
        r.set('status', b.submit === true ? 'pending' : 'draft')
        r.set('review_note', '')
        tx.save(r)
        audit(tx, r, b.submit === true ? 'submitted' : 'draft_saved')
        result = dto(r)
      })
      return e.json(200, result)
    }
    if (action === 'withdraw') {
      let result
      e.app.runInTransaction((tx) => {
        const r = tx.findRecordById('cer_library_submissions', id(b.id))
        own(r)
        revision(r)
        unpublish(tx, r)
        r.set('status', 'withdrawn')
        r.set('revision', r.getInt('revision') + 1)
        tx.save(r)
        audit(tx, r, 'withdrawn')
        result = dto(r)
      })
      return e.json(200, result)
    }
    if (action === 'review') {
      requireCurator()
      if (!['approve', 'request_changes', 'unpublish'].includes(b.decision))
        throw new BadRequestError('Decisão inválida.')
      const note = text(b.note, 2000, b.decision !== 'approve')
      let result
      e.app.runInTransaction((tx) => {
        const r = tx.findRecordById('cer_library_submissions', id(b.id))
        revision(r)
        const status = r.getString('status')
        if (
          (b.decision === 'unpublish' && status !== 'approved') ||
          (b.decision !== 'unpublish' && status !== 'pending')
        )
          throw new BadRequestError('Atualize a fila antes de avaliar.')
        unpublish(tx, r)
        if (b.decision === 'approve') {
          const p = payload(parse(r), true)
          const post = save(tx, 'cer_library_posts', { payload: p, available: true })
          r.set('post_id', post.id)
          r.set('status', 'approved')
        } else r.set('status', 'changes_requested')
        r.set('review_note', note)
        r.set('revision', r.getInt('revision') + 1)
        tx.save(r)
        audit(tx, r, b.decision, note)
        result = dto(r)
      })
      return e.json(200, result)
    }
    if (action === 'comments') {
      const key = id(b.target_key)
      target(e.app, key)
      return e.json(
        200,
        resultPage(
          rows(e.app, 'cer_library_comments', 'target_key = {:key} && withdrawn = false', { key }),
          (r) => ({
            id: r.id,
            display_name: r.getString('display_name'),
            body: r.getString('body'),
            created: r.getString('created'),
            mine: r.getString('author_id') === actor,
          }),
        ),
      )
    }
    if (action === 'comment') {
      if (b.consent !== true)
        throw new BadRequestError(
          'Confirme que este comentário ficará visível aos usuários do app.',
        )
      const key = id(b.target_key),
        name = text(b.display_name, 60, true),
        body = text(b.body, 2000, true)
      let result
      e.app.runInTransaction((tx) => {
        target(tx, key)
        const r = save(tx, 'cer_library_comments', {
          author_id: actor,
          target_key: key,
          display_name: name,
          body,
          withdrawn: false,
        })
        result = { id: r.id, display_name: name, body, created: r.getString('created'), mine: true }
      })
      return e.json(200, result)
    }
    if (action === 'remove_comment') {
      const note = text(b.note || '', 2000)
      e.app.runInTransaction((tx) => {
        const r = tx.findRecordById('cer_library_comments', id(b.id))
        if (r.getString('author_id') !== actor) {
          requireCurator()
          if (!note) throw new BadRequestError('Informe o motivo da moderação.')
        }
        r.set('withdrawn', true)
        tx.save(r)
        audit(tx, null, 'comment_removed', note, r.id)
      })
      return e.json(200, { ok: true })
    }
    throw new BadRequestError('Operação inválida.')
  },
  $apis.requireAuth('users'),
  $apis.bodyLimit(40000),
)
