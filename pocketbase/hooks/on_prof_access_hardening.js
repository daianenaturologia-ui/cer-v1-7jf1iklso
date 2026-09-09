// Hook de Hardening Local do Build 04A para professional_enrollment_access
// Bloquear qualquer deleção física de vínculo profissional via REST ou SDK, mesmo por admin
onRecordDelete((e) => {
  throw new BadRequestError(
    'Deleção física de professional_enrollment_access não é permitida. Use is_active = false para revogação.',
  )
}, 'professional_enrollment_access')
