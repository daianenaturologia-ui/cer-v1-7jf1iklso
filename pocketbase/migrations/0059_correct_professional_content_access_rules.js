migrate(
  (app) => {
    // Migration 0059: Altera exclusivamente listRule e viewRule de cer_practice_step_professional_content
    // para incluir o branch admin ativo.
    const targetCol = app.findCollectionByNameOrId('cer_practice_step_professional_content')
    if (!targetCol) {
      throw new Error(
        '[MIGRATION 0059] Coleção cer_practice_step_professional_content não encontrada.',
      )
    }

    const correctedRule =
      "@request.auth.id != '' && ((@request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.auth.user_roles_via_user_id.is_active ?= true) || (@request.auth.user_roles_via_user_id.role ?= 'admin' && @request.auth.user_roles_via_user_id.is_active ?= true)) && record_status = 'current'"

    targetCol.listRule = correctedRule
    targetCol.viewRule = correctedRule

    app.save(targetCol)
  },
  (app) => {
    // DOWN-MIGRATION 0059: Restaura exclusivamente as rules anteriores da 0049 original
    const targetCol = app.findCollectionByNameOrId('cer_practice_step_professional_content')
    if (!targetCol) {
      throw new Error(
        '[DOWN 0059] Coleção cer_practice_step_professional_content não encontrada para restauração de rules.',
      )
    }

    const previousRule =
      "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.auth.user_roles_via_user_id.is_active ?= true && record_status = 'current'"

    targetCol.listRule = previousRule
    targetCol.viewRule = previousRule

    app.save(targetCol)
  },
)
