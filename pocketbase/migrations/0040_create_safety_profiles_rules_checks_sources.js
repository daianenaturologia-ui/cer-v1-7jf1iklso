migrate(
  (app) => {
    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')
    const enrollmentsCol = app.findCollectionByNameOrId('enrollments')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0040: cer_practice_safety_profiles, cer_practice_safety_rules, cer_practice_safety_checks, cer_practice_safety_check_sources
    // 7. cer_practice_safety_profiles (Static Safety Profile da PracticeVersion)
    // Descreve a PracticeVersion, NÃO a participante. Practice risk ≠ participant risk.
    // intensity_implications, consent_required, supervision_requirements, monitoring, aftercare
    // regulatory_profile: none | health_adjacent | regulated_product | medical_coordination_required
    // required_dynamic_inputs: JSON array de inputs de segurança obrigatórios para regra P0
    // Campos estruturais para expansão com enraizamento (high/expansive)
    // deleteRule = null
    const safetyProfilesCol = new Collection({
      name: 'cer_practice_safety_profiles',
      type: 'base',
      listRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      viewRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      createRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      updateRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      deleteRule: null,
      fields: [
        {
          name: 'practice_version_id',
          type: 'relation',
          required: true,
          collectionId: practiceVersionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'intensity_implications',
          type: 'text',
          required: false,
        },
        {
          name: 'consent_required',
          type: 'select',
          required: true,
          values: ['not_required', 'required', 'conditional'],
          maxSelect: 1,
        },
        {
          name: 'supervision_requirements',
          type: 'text',
          required: false,
        },
        {
          name: 'monitoring',
          type: 'text',
          required: false,
        },
        {
          name: 'aftercare',
          type: 'text',
          required: false,
        },
        {
          name: 'regulatory_profile',
          type: 'select',
          required: true,
          values: ['none', 'health_adjacent', 'regulated_product', 'medical_coordination_required'],
          maxSelect: 1,
        },
        {
          name: 'safety_requirements',
          type: 'text',
          required: false,
        },
        {
          name: 'required_dynamic_inputs',
          type: 'json',
          required: false,
        },
        // Requisitos de Expansão com Enraizamento (obrigatórios para high/expansive)
        {
          name: 'informed_choice',
          type: 'text',
          required: false,
        },
        {
          name: 'orientation',
          type: 'text',
          required: false,
        },
        {
          name: 'body_contact_policy',
          type: 'text',
          required: false,
        },
        {
          name: 'capacity_to_stop',
          type: 'text',
          required: false,
        },
        {
          name: 'return_grounding',
          type: 'text',
          required: false,
        },
        {
          name: 'integration',
          type: 'text',
          required: false,
        },
        {
          name: 'daily_life_reorientation',
          type: 'text',
          required: false,
        },
        {
          name: 'escalation_pathway',
          type: 'text',
          required: false,
        },
        {
          name: 'reviewed_by_user_id',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'reviewed_at',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpsp_version ON cer_practice_safety_profiles (practice_version_id)',
      ],
    })
    app.save(safetyProfilesCol)

    // 8. cer_practice_safety_rules (regras de segurança vinculadas à practice_version_id)
    // rule_type: absolute_contraindication | relative_contraindication | caution | requires_medical_clearance | requires_professional_assessment
    // source_of_rule: evidence_source | professional_policy | traditional_framework | regulatory_guidance | manufacturer | cer_safety_policy
    // deleteRule = null
    const safetyRulesCol = new Collection({
      name: 'cer_practice_safety_rules',
      type: 'base',
      listRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      viewRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      createRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      updateRule:
        "@request.auth.id != '' && @request.auth.user_roles_via_user_id.role ?= 'profissional'",
      deleteRule: null,
      fields: [
        {
          name: 'practice_version_id',
          type: 'relation',
          required: true,
          collectionId: practiceVersionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'rule_type',
          type: 'select',
          required: true,
          values: [
            'absolute_contraindication',
            'relative_contraindication',
            'caution',
            'requires_medical_clearance',
            'requires_professional_assessment',
          ],
          maxSelect: 1,
        },
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'participant_facing_text',
          type: 'text',
          required: false,
        },
        {
          name: 'source_of_rule',
          type: 'select',
          required: true,
          values: [
            'evidence_source',
            'professional_policy',
            'traditional_framework',
            'regulatory_guidance',
            'manufacturer',
            'cer_safety_policy',
          ],
          maxSelect: 1,
        },
        {
          name: 'source_ref',
          type: 'text',
          required: false,
        },
        {
          name: 'created_by_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpsr_version ON cer_practice_safety_rules (practice_version_id)',
        'CREATE INDEX idx_cpsr_type ON cer_practice_safety_rules (rule_type)',
      ],
    })
    app.save(safetyRulesCol)

    // 9. cer_practice_safety_checks (Dynamic Safety Check - Julgamento Profissional)
    // outcome: eligible | eligible_with_caution | requires_professional_review | requires_supervision | not_currently_indicated | insufficient_information
    // record_status: current | superseded
    // professional_rationale: obrigatório se outcome != eligible
    // deleteRule = null
    const safetyChecksCol = new Collection({
      name: 'cer_practice_safety_checks',
      type: 'base',
      listRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      createRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      deleteRule: null,
      fields: [
        {
          name: 'practice_version_id',
          type: 'relation',
          required: true,
          collectionId: practiceVersionsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'outcome',
          type: 'select',
          required: true,
          values: [
            'eligible',
            'eligible_with_caution',
            'requires_professional_review',
            'requires_supervision',
            'not_currently_indicated',
            'insufficient_information',
          ],
          maxSelect: 1,
        },
        {
          name: 'reviewed_by_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'professional_rationale',
          type: 'text',
          required: false,
        },
        {
          name: 'reviewed_at',
          type: 'date',
          required: true,
        },
        {
          name: 'record_status',
          type: 'select',
          required: true,
          values: ['current', 'superseded'],
          maxSelect: 1,
        },
        {
          name: 'metadata',
          type: 'json',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpsc_enrollment ON cer_practice_safety_checks (enrollment_id)',
        'CREATE INDEX idx_cpsc_version ON cer_practice_safety_checks (practice_version_id)',
        'CREATE INDEX idx_cpsc_status ON cer_practice_safety_checks (record_status)',
      ],
    })
    app.save(safetyChecksCol)

    const savedSafetyChecksCol = app.findCollectionByNameOrId('cer_practice_safety_checks')

    // 10. cer_practice_safety_check_sources (provenance relacional estrita)
    // Allowlist congelada de 6 tipos: experience_response | signal | association | knowledge_item | participant_recognition | session_observation
    // deleteRule = null
    const safetyCheckSourcesCol = new Collection({
      name: 'cer_practice_safety_check_sources',
      type: 'base',
      listRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      viewRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      createRule:
        "@request.auth.id != '' && enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id && enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true",
      updateRule: null, // Imutável
      deleteRule: null, // Zero delete físico
      fields: [
        {
          name: 'safety_check_id',
          type: 'relation',
          required: true,
          collectionId: savedSafetyChecksCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'source_type',
          type: 'select',
          required: true,
          values: [
            'experience_response',
            'signal',
            'association',
            'knowledge_item',
            'participant_recognition',
            'session_observation',
          ],
          maxSelect: 1,
        },
        {
          name: 'source_id',
          type: 'text',
          required: true,
        },
        {
          name: 'source_version_anchor',
          type: 'text',
          required: false,
        },
        {
          name: 'enrollment_id',
          type: 'relation',
          required: true,
          collectionId: enrollmentsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'access_class',
          type: 'select',
          required: true,
          values: [
            'participant_private',
            'participant_shared',
            'professional_private',
            'shared_care',
            'administrative',
            'system_internal',
          ],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpscs_check ON cer_practice_safety_check_sources (safety_check_id)',
        'CREATE INDEX idx_cpscs_enrollment ON cer_practice_safety_check_sources (enrollment_id)',
        'CREATE INDEX idx_cpscs_source ON cer_practice_safety_check_sources (source_type, source_id)',
      ],
    })
    app.save(safetyCheckSourcesCol)
  },
  (app) => {
    try {
      const scsCol = app.findCollectionByNameOrId('cer_practice_safety_check_sources')
      app.delete(scsCol)
    } catch (_) {}
    try {
      const scCol = app.findCollectionByNameOrId('cer_practice_safety_checks')
      app.delete(scCol)
    } catch (_) {}
    try {
      const srCol = app.findCollectionByNameOrId('cer_practice_safety_rules')
      app.delete(srCol)
    } catch (_) {}
    try {
      const spCol = app.findCollectionByNameOrId('cer_practice_safety_profiles')
      app.delete(spCol)
    } catch (_) {}
  },
)
