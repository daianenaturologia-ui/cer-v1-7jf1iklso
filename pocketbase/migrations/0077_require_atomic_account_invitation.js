// Install together with on_invite_participant and its frontend caller after homologation.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.createRule = null // Ordinary clients use the scoped transactional invitation route.
    app.save(users)
  },
  () => {
    throw new Error(
      'Rollback requires reviewed replacement; do not reopen direct account creation.',
    )
  },
)
