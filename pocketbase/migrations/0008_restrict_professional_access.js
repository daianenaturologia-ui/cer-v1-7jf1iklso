migrate(
  (app) => {
    const profAccessCol = app.findCollectionByNameOrId('professional_enrollment_access')

    // CORREÇÃO CRÍTICA DE SEGURANÇA:
    // Nunca permitir self-grant arbitrário por profissional!
    // Apenas platform_admin pode criar concessões diretamente via API REST.
    // O fluxo legítimo de criação de enrollment cria a concessão no backend de forma atômica/privilegiada via hook server-side (onRecordAfterCreateSuccess em enrollments).
    profAccessCol.createRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && @request.auth.user_roles_via_user_id.role ?= 'admin'"

    // Update e Delete: apenas platform_admin
    // (a revogação oficial de vínculo profissional é ação administrativa de governança)
    profAccessCol.updateRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && @request.auth.user_roles_via_user_id.role ?= 'admin'"

    profAccessCol.deleteRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && @request.auth.user_roles_via_user_id.role ?= 'admin'"

    app.save(profAccessCol)
  },
  (app) => {
    // Reversão (não recomendada em produção, mas necessária para migrações reversíveis)
    const profAccessCol = app.findCollectionByNameOrId('professional_enrollment_access')
    profAccessCol.createRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (@request.auth.user_roles_via_user_id.role ?= 'admin' || (@request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.body.professional_user_id = @request.auth.id))"
    profAccessCol.updateRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (@request.auth.user_roles_via_user_id.role ?= 'admin' || professional_user_id = @request.auth.id)"
    profAccessCol.deleteRule =
      "@request.auth.id != '' && @request.auth.status = 'active' && (@request.auth.user_roles_via_user_id.role ?= 'admin' || professional_user_id = @request.auth.id)"
    app.save(profAccessCol)
  },
)
