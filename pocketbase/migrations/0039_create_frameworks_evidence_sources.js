migrate(
  (app) => {
    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')
    const frameworksCol = app.findCollectionByNameOrId('cer_frameworks')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // MIGRATION 0039: cer_practice_frameworks, cer_practice_evidence, cer_practice_evidence_sources
    // 4. cer_practice_frameworks (prática vinculada a frameworks existentes)
    // usage_role: origin | indication | adaptation | safety_framework
    // deleteRule = null
    const practiceFrameworksCol = new Collection({
      name: 'cer_practice_frameworks',
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
          name: 'framework_id',
          type: 'relation',
          required: true,
          collectionId: frameworksCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'usage_role',
          type: 'select',
          required: true,
          values: ['origin', 'indication', 'adaptation', 'safety_framework'],
          maxSelect: 1,
        },
        {
          name: 'notes',
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
        'CREATE INDEX idx_cpf_version ON cer_practice_frameworks (practice_version_id)',
        'CREATE INDEX idx_cpf_framework ON cer_practice_frameworks (framework_id)',
      ],
    })
    app.save(practiceFrameworksCol)

    // 5. cer_practice_evidence (3 eixos separados: Basis ≠ Confidence ≠ Maturity)
    // evidence_basis_type: scientific_research | traditional_knowledge | clinical_practice_framework | experiential_support | cer_professional_hypothesis
    // confidence: high | moderate | low | uncertain
    // maturity: established | developing | preliminary
    // population_context_applicability: texto / tags
    // safety_evidence_note: nota de evidência de segurança separada
    // supported_claim_text: claim suportada
    // deleteRule = null
    const practiceEvidenceCol = new Collection({
      name: 'cer_practice_evidence',
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
          name: 'evidence_basis_type',
          type: 'select',
          required: true,
          values: [
            'scientific_research',
            'traditional_knowledge',
            'clinical_practice_framework',
            'experiential_support',
            'cer_professional_hypothesis',
          ],
          maxSelect: 1,
        },
        {
          name: 'confidence',
          type: 'select',
          required: true,
          values: ['high', 'moderate', 'low', 'uncertain'],
          maxSelect: 1,
        },
        {
          name: 'maturity',
          type: 'select',
          required: true,
          values: ['established', 'developing', 'preliminary'],
          maxSelect: 1,
        },
        {
          name: 'population_context_applicability',
          type: 'text',
          required: false,
        },
        {
          name: 'safety_evidence_note',
          type: 'text',
          required: false,
        },
        {
          name: 'supported_claim_text',
          type: 'text',
          required: false,
        },
        {
          name: 'author_user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'reviewer_user_id',
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
        {
          name: 'review_due_at',
          type: 'date',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cpe_version ON cer_practice_evidence (practice_version_id)',
        'CREATE INDEX idx_cpe_basis ON cer_practice_evidence (evidence_basis_type)',
        'CREATE INDEX idx_cpe_confidence ON cer_practice_evidence (confidence)',
      ],
    })
    app.save(practiceEvidenceCol)

    const savedPracticeEvidenceCol = app.findCollectionByNameOrId('cer_practice_evidence')

    // 6. cer_practice_evidence_sources (fontes e citações rastreáveis)
    // deleteRule = null
    const practiceEvidenceSourcesCol = new Collection({
      name: 'cer_practice_evidence_sources',
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
          name: 'evidence_id',
          type: 'relation',
          required: true,
          collectionId: savedPracticeEvidenceCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'citation_title',
          type: 'text',
          required: true,
        },
        {
          name: 'author_source',
          type: 'text',
          required: true,
        },
        {
          name: 'publication_year',
          type: 'number',
          required: false,
          onlyInt: true,
        },
        {
          name: 'url_identifier',
          type: 'text',
          required: false,
        },
        {
          name: 'evidence_type',
          type: 'text',
          required: false,
        },
        {
          name: 'notes',
          type: 'text',
          required: false,
        },
        {
          name: 'reviewed_at',
          type: 'date',
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
      indexes: ['CREATE INDEX idx_cpes_evidence ON cer_practice_evidence_sources (evidence_id)'],
    })
    app.save(practiceEvidenceSourcesCol)
  },
  (app) => {
    try {
      const pesCol = app.findCollectionByNameOrId('cer_practice_evidence_sources')
      app.delete(pesCol)
    } catch (_) {}
    try {
      const peCol = app.findCollectionByNameOrId('cer_practice_evidence')
      app.delete(peCol)
    } catch (_) {}
    try {
      const pfCol = app.findCollectionByNameOrId('cer_practice_frameworks')
      app.delete(pfCol)
    } catch (_) {}
  },
)
