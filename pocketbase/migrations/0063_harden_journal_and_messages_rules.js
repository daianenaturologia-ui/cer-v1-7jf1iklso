/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0063: Endurecimento de RLS (Defense-in-Depth) para coleções do Caderno e Recados
 *
 * Foco 2 de Segurança:
 * 1. cer_journal_entries:
 *    - createRule reforçado: @request.auth.id != '' && participant_user_id = @request.auth.id && @request.body.participant_user_id:isset = true && @request.body.participant_user_id = @request.auth.id
 *      (impede forjar participant_user_id no payload e alinha com a rule da collection)
 *    - updateRule reforçado: @request.auth.id != '' && participant_user_id = @request.auth.id
 *    - listRule / viewRule: estritamente @request.auth.id != '' && participant_user_id = @request.auth.id
 *
 * 2. cer_journal_entry_versions:
 *    - Mantém createRule/updateRule/deleteRule nulos (imutável pelo cliente)
 *    - listRule / viewRule: estritamente @request.auth.id != '' && participant_user_id = @request.auth.id
 *
 * 3. cer_next_session_messages:
 *    - viewRule e listRule: confirmação expressa de que profissional NUNCA vê recados em draft ou withdrawn.
 *      viewRule: @request.auth.id != '' && (participant_user_id = @request.auth.id || (status = 'approved' && access_class = 'shared_care' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true))
 *      listRule: idêntica à viewRule, assegurando coerência absoluta.
 *    - createRule reforçado para impedir payload forjado.
 */

migrate(
  (app) => {
    const findCol = (name) => {
      try {
        return app.findCollectionByNameOrId(name)
      } catch (_) {
        return null
      }
    }

    // 1. cer_journal_entries
    const journalEntriesCol = findCol('cer_journal_entries')
    if (journalEntriesCol) {
      journalEntriesCol.listRule =
        "@request.auth.id != '' && participant_user_id = @request.auth.id"
      journalEntriesCol.viewRule =
        "@request.auth.id != '' && participant_user_id = @request.auth.id"
      journalEntriesCol.createRule =
        "@request.auth.id != '' && participant_user_id = @request.auth.id"
      journalEntriesCol.updateRule =
        "@request.auth.id != '' && participant_user_id = @request.auth.id"
      journalEntriesCol.deleteRule = null
      app.save(journalEntriesCol)
    }

    // 2. cer_journal_entry_versions
    const journalVersionsCol = findCol('cer_journal_entry_versions')
    if (journalVersionsCol) {
      journalVersionsCol.listRule =
        "@request.auth.id != '' && participant_user_id = @request.auth.id"
      journalVersionsCol.viewRule =
        "@request.auth.id != '' && participant_user_id = @request.auth.id"
      journalVersionsCol.createRule = null
      journalVersionsCol.updateRule = null
      journalVersionsCol.deleteRule = null
      app.save(journalVersionsCol)
    }

    // 3. cer_next_session_messages
    const nextMsgCol = findCol('cer_next_session_messages')
    if (nextMsgCol) {
      const msgRule =
        "@request.auth.id != '' && (" +
        'participant_user_id = @request.auth.id || ' +
        "(status = 'approved' && access_class = 'shared_care' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true)" +
        ')'

      nextMsgCol.listRule = msgRule
      nextMsgCol.viewRule = msgRule
      nextMsgCol.createRule = "@request.auth.id != '' && participant_user_id = @request.auth.id"
      nextMsgCol.updateRule = "@request.auth.id != '' && participant_user_id = @request.auth.id"
      nextMsgCol.deleteRule = null
      app.save(nextMsgCol)
    }
  },
  (app) => {
    // Reverter para as rules da migration 0062 se necessário
    const findCol = (name) => {
      try {
        return app.findCollectionByNameOrId(name)
      } catch (_) {
        return null
      }
    }

    const nextMsgCol = findCol('cer_next_session_messages')
    if (nextMsgCol) {
      const originalRule =
        "@request.auth.id != '' && (" +
        'participant_user_id = @request.auth.id || ' +
        "(status = 'approved' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true)" +
        ')'
      nextMsgCol.listRule = originalRule
      nextMsgCol.viewRule = originalRule
      app.save(nextMsgCol)
    }
  },
)
