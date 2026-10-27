// Registration is enabled only through a professional-owned, revocable link.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const products = app.findCollectionByNameOrId('cer_products')
    const dates = [
      { name: 'created', type: 'autodate', onCreate: true },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]
    const links = new Collection({
      name: 'cer_registration_links',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'professional_user_id',
          type: 'relation',
          collectionId: users.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'product_id',
          type: 'relation',
          collectionId: products.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'slug', type: 'text', required: true, min: 48, max: 48 },
        { name: 'active', type: 'bool' },
        ...dates,
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_registration_slug ON cer_registration_links (slug)',
        'CREATE UNIQUE INDEX idx_registration_active_product ON cer_registration_links (professional_user_id, product_id) WHERE active = 1',
      ],
    })
    app.save(links)
    app.save(
      new Collection({
        name: 'cer_registration_requests',
        type: 'base',
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            collectionId: users.id,
            required: true,
            maxSelect: 1,
          },
          {
            name: 'link_id',
            type: 'relation',
            collectionId: links.id,
            required: true,
            maxSelect: 1,
          },
          { name: 'completed', type: 'bool' },
          ...dates,
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_registration_user ON cer_registration_requests (user_id)',
        ],
      }),
    )
  },
  () => {
    throw new Error('Preserve cadastros e vínculos; reversão exige migração revisada.')
  },
)
