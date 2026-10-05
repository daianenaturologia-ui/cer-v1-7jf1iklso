migrate(
  (app) => {
    const owner =
      "@request.auth.id != '' && @request.auth.status = 'active' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id"
    app.save(
      new Collection({
        name: 'cer_planner_notes',
        type: 'base',
        listRule: owner,
        viewRule: owner,
        createRule: owner,
        updateRule: `${owner} && @request.body.enrollment_id:changed = false`,
        deleteRule: null,
        fields: [
          {
            name: 'enrollment_id',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('enrollments').id,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true, max: 160 },
          { name: 'note', type: 'text', max: 5000 },
          { name: 'starts_at', type: 'date', required: true },
          { name: 'ends_at', type: 'date', required: true },
          {
            name: 'kind',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: ['focus', 'rest', 'life'],
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: ['planned', 'completed', 'archived'],
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_planner_notes_enrollment ON cer_planner_notes (enrollment_id)'],
      }),
    )
  },
  (app) => app.delete(app.findCollectionByNameOrId('cer_planner_notes')),
)
