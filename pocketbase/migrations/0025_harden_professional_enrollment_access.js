migrate(
  (app) => {
    // Hardening de professional_enrollment_access (Build 04A - Hardening Local)
    // Desabilitar deleção física da collection (deleteRule = null)
    // Concessões e revogações devem ocorrer apenas por is_active=false, preservando histórico para auditoria e autoria histórica de sessões.
    const accessCol = app.findCollectionByNameOrId('professional_enrollment_access')
    accessCol.deleteRule = null
    app.save(accessCol)
  },
  (app) => {
    try {
      const accessCol = app.findCollectionByNameOrId('professional_enrollment_access')
      accessCol.deleteRule =
        "@request.auth.id != '' && @request.auth.status = 'active' && @request.auth.user_roles_via_user_id.role ?= 'admin'"
      app.save(accessCol)
    } catch (_) {}
  },
)
