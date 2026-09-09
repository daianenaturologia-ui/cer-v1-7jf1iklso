migrate(
  (app) => {
    // 1. Hardening RLS (CER-03C-09) em cer_knowledge_items:
    // Substituir a leitura participante de "access_class != 'professional_private'" por ALLOWLIST explícita:
    // Apenas participant_private, participant_shared e shared_care são visíveis à interagente/participante.
    // Classes administrative, system_internal e professional_private NÃO devem tornar-se visíveis.
    const kiCol = app.findCollectionByNameOrId('cer_knowledge_items')
    const kiParticipantAllowlist =
      "(access_class = 'participant_private' || access_class = 'participant_shared' || access_class = 'shared_care')"
    const kiParticipantCheck =
      'enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && ' +
      kiParticipantAllowlist
    const kiProfCheck =
      "(access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true"

    kiCol.listRule =
      "@request.auth.id != '' && ((" + kiParticipantCheck + ') || (' + kiProfCheck + '))'
    kiCol.viewRule =
      "@request.auth.id != '' && ((" + kiParticipantCheck + ') || (' + kiProfCheck + '))'
    app.save(kiCol)

    // 2. Reforçar imutabilidade de cer_participant_recognitions (CER-03C-02):
    // Bloquear updateRule (updateRule = null) na migration, impedindo qualquer update via REST API.
    const recogCol = app.findCollectionByNameOrId('cer_participant_recognitions')
    recogCol.updateRule = null
    app.save(recogCol)
  },
  (app) => {
    try {
      const kiCol = app.findCollectionByNameOrId('cer_knowledge_items')
      kiCol.listRule =
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))"
      kiCol.viewRule =
        "@request.auth.id != '' && ((enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && access_class != 'professional_private') || ((access_class = 'shared_care' || access_class = 'participant_shared') && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))"
      app.save(kiCol)
    } catch (_) {}

    try {
      const recogCol = app.findCollectionByNameOrId('cer_participant_recognitions')
      recogCol.updateRule =
        "@request.auth.id != '' && enrollment_id.person_id.users_via_person_id.id ?= @request.auth.id && participant_user_id = @request.auth.id"
      app.save(recogCol)
    } catch (_) {}
  },
)
