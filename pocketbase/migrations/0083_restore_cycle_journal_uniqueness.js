// Additive: restore uniqueness constraints for cycle journal collections
migrate(
  (app) => {
    const profileCol = app.findCollectionByNameOrId('cer_cycle_profiles')
    profileCol.addIndex('idx_cycle_profile_owner', true, 'enrollment_id', '')
    app.save(profileCol)

    const entriesCol = app.findCollectionByNameOrId('cer_cycle_entries')
    entriesCol.addIndex('idx_cycle_entry_day', true, 'enrollment_id, day', '')
    app.save(entriesCol)
  },
  (app) => {
    try {
      const profileCol = app.findCollectionByNameOrId('cer_cycle_profiles')
      profileCol.removeIndex('idx_cycle_profile_owner')
      app.save(profileCol)
    } catch (_) {}

    try {
      const entriesCol = app.findCollectionByNameOrId('cer_cycle_entries')
      entriesCol.removeIndex('idx_cycle_entry_day')
      app.save(entriesCol)
    } catch (_) {}
  },
)
