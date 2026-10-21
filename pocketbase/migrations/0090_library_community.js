// Opt-in community only. Clinical records and existing access rules are untouched.
migrate(
  (app) => {
    const dates = () => [
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]
    const user = () => ({
      name: 'author_id',
      type: 'relation',
      required: true,
      collectionId: "_pb_users_auth_",
      maxSelect: 1,
    })
    const create = (name, fields, indexes = []) => {
      const col = new Collection({
        name,
        type: 'base',
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [...fields, ...dates()],
        indexes,
      })
      app.save(col)
      return col
    }
    create(
      'cer_library_curators',
      [user()],
      ['CREATE UNIQUE INDEX idx_library_curator ON cer_library_curators (author_id)'],
    )
    const posts = create(
      'cer_library_posts',
      [
        { name: 'payload', type: 'json', required: true, maxSize: 40000 },
        { name: 'available', type: 'bool' },
      ],
      ['CREATE INDEX idx_library_posts_available ON cer_library_posts (available, created)'],
    )
    const submissions = create(
      'cer_library_submissions',
      [
        user(),
        { name: 'payload', type: 'json', required: true, maxSize: 40000 },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['draft', 'pending', 'approved', 'changes_requested', 'withdrawn'],
        },
        { name: 'revision', type: 'number', required: true, min: 1, onlyInt: true },
        { name: 'post_id', type: 'relation', collectionId: posts.id, maxSelect: 1 },
        { name: 'review_note', type: 'text', max: 2000 },
      ],
      [
        'CREATE INDEX idx_library_submissions_author ON cer_library_submissions (author_id, updated)',
        'CREATE INDEX idx_library_submissions_status ON cer_library_submissions (status, updated)',
      ],
    )
    create(
      'cer_library_comments',
      [
        user(),
        { name: 'target_key', type: 'text', required: true, max: 180 },
        { name: 'display_name', type: 'text', required: true, max: 60 },
        { name: 'body', type: 'text', required: true, max: 2000 },
        { name: 'withdrawn', type: 'bool' },
      ],
      [
        'CREATE INDEX idx_library_comments_target ON cer_library_comments (target_key, withdrawn, created)',
      ],
    )
    create('cer_library_reviews', [
      user(),
      { name: 'submission_id', type: 'relation', collectionId: submissions.id, maxSelect: 1 },
      { name: 'target_key', type: 'text', max: 180 },
      { name: 'revision', type: 'number', onlyInt: true, min: 0 },
      { name: 'decision', type: 'text', required: true, max: 40 },
      { name: 'note', type: 'text', max: 2000 },
    ])
    // Curators are provisioned explicitly by the operator after verifying the existing account.
    // No personal account identifier is stored in source and no role/account is changed here.
  },
  (app) => {
    const names = [
      'cer_library_reviews',
      'cer_library_comments',
      'cer_library_submissions',
      'cer_library_posts',
      'cer_library_curators',
    ]
    for (const name of names.slice(0, 4))
      if (app.findRecordsByFilter(name, 'id != ""', '', 1, 0).length)
        throw new Error('Há contribuições ou auditorias. Preserve os registros da Biblioteca.')
    for (const name of names) app.delete(app.findCollectionByNameOrId(name))
  },
)
