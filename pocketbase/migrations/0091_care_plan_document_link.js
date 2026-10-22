migrate(
  (app) => {
    const plans = app.findCollectionByNameOrId('cer_care_plans')
    const versions = app.findCollectionByNameOrId('cer_development_plan_versions')
    plans.fields.add(
      new RelationField({
        name: 'development_version_id',
        collectionId: versions.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(plans)
  },
  (app) => {
    const plans = app.findCollectionByNameOrId('cer_care_plans')
    plans.fields.removeByName('development_version_id')
    app.save(plans)
  },
)
