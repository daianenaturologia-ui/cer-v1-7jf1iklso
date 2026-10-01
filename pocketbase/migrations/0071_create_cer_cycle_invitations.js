migrate(
  (app) => {
    const owner =
      'participant_user_id = @request.auth.id && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id'
    const professional =
      '@collection.professional_enrollment_access:inviteAccess.enrollment_id ?= enrollment_id && @collection.professional_enrollment_access:inviteAccess.professional_user_id ?= @request.auth.id && @collection.professional_enrollment_access:inviteAccess.is_active ?= true'
    const immutable = [
      'enrollment_id',
      'care_cycle_id',
      'participant_user_id',
      'invited_by_user_id',
      'shared_prompt',
    ]
      .map((name) => `@request.body.${name}:changed = false`)
      .join(' && ')
    app.save(
      new Collection({
        name: 'cer_cycle_invitations',
        type: 'base',
        listRule: `@request.auth.id != '' && ((${owner}) || (${professional}))`,
        viewRule: `@request.auth.id != '' && ((${owner}) || (${professional}))`,
        createRule: `@request.auth.id != '' && (${professional}) && @request.body.invited_by_user_id = @request.auth.id && @request.body.participant_reflection:isset = false && @request.body.completed_at:isset = false`,
        updateRule: `@request.auth.id != '' && (${owner}) && completed_at = '' && ${immutable}`,
        deleteRule: null,
        fields: [
          ...[
            ['enrollment_id', 'enrollments'],
            ['care_cycle_id', 'cer_care_cycles'],
            ['participant_user_id', '_pb_users_auth_'],
            ['invited_by_user_id', '_pb_users_auth_'],
          ].map(([name, collection]) => ({
            name,
            type: 'relation',
            required: true,
            maxSelect: 1,
            collectionId: app.findCollectionByNameOrId(collection).id,
          })),
          { name: 'shared_prompt', type: 'text', required: true, max: 2000 },
          { name: 'participant_reflection', type: 'text', max: 5000 },
          { name: 'completed_at', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cycle_invitation_cycle ON cer_cycle_invitations (care_cycle_id)',
        ],
      }),
    )
  },
  (app) => app.delete(app.findCollectionByNameOrId('cer_cycle_invitations')),
)
