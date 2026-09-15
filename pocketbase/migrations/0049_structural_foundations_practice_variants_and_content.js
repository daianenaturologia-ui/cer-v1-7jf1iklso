migrate(
  (app) => {
    // LOTE ESTRUTURAL 0049-A: Fundações Estruturais de Práticas (CER V1)
    // Especificação Técnica V2 + Erratas V2.1 (Unique keys) + V2.2 (supersedes_id) + V2.3 (Segurança RLS fail-closed)
    //
    // Ações autorizadas:
    // A. ALTERAR cer_practice_steps:
    //    - semantic_role (select, maxSelect 1, opcional, allowlist 10 papéis)
    //    - duration_min_seconds (number, opcional, 0..7200)
    //    - duration_max_seconds (number, opcional, 0..7200)
    // B. ALTERAR cer_practice_variants:
    //    - is_default (bool, opcional, default false)
    // C. CRIAR cer_practice_variant_steps:
    //    - practice_variant_id (relation -> cer_practice_variants)
    //    - practice_step_id (relation -> cer_practice_steps)
    //    - practice_version_id (relation -> cer_practice_versions)
    //    - step_order (number, onlyInt: true, min: 1)
    //    - record_status (select: current | superseded, default: current)
    //    - supersedes_id (relation autorreferente, opcional)
    //    - current_uniqueness_key (text, obrigatório)
    //    - current_order_key (text, obrigatório)
    //    - Índices UNIQUE: current_uniqueness_key, current_order_key
    //    - Rules: createRule: null, updateRule: null, deleteRule: null
    // D. CRIAR cer_practice_step_professional_content:
    //    - practice_step_id (relation -> cer_practice_steps)
    //    - practice_version_id (relation -> cer_practice_versions)
    //    - content_kind (select: traditional_framework_note | forbidden_inference | professional_guidance)
    //    - content_text (text, obrigatório)
    //    - source_manifest_path (text, opcional)
    //    - content_classification (select: professional_only, default: professional_only)
    //    - record_status (select: current | superseded, default: current)
    //    - supersedes_id (relation autorreferente, opcional)
    //    - current_uniqueness_key (text, obrigatório)
    //    - Índice UNIQUE: current_uniqueness_key
    //    - Rules: createRule: null, updateRule: null, deleteRule: null

    const practiceVersionsCol = app.findCollectionByNameOrId('cer_practice_versions')
    const practiceStepsCol = app.findCollectionByNameOrId('cer_practice_steps')
    const practiceVariantsCol = app.findCollectionByNameOrId('cer_practice_variants')

    // ═══ A. ALTERAR cer_practice_steps ═══
    // 1. semantic_role: select, maxSelect 1, opcional, allowlist V1 exata:
    //    external_orientation, body_awareness, body_resource, chronological_orientation,
    //    challenge_awareness, internal_resource, external_resource, possibility_rehearsal,
    //    resource_awareness, direction
    if (!practiceStepsCol.fields.getByName('semantic_role')) {
      practiceStepsCol.fields.add(
        new SelectField({
          name: 'semantic_role',
          required: false,
          values: [
            'external_orientation',
            'body_awareness',
            'body_resource',
            'chronological_orientation',
            'challenge_awareness',
            'internal_resource',
            'external_resource',
            'possibility_rehearsal',
            'resource_awareness',
            'direction',
          ],
          maxSelect: 1,
        }),
      )
    }

    // 2. duration_min_seconds: number, opcional, mín 0, máx 7200
    if (!practiceStepsCol.fields.getByName('duration_min_seconds')) {
      practiceStepsCol.fields.add(
        new NumberField({
          name: 'duration_min_seconds',
          required: false,
          min: 0,
          max: 7200,
        }),
      )
    }

    // 3. duration_max_seconds: number, opcional, mín 0, máx 7200
    if (!practiceStepsCol.fields.getByName('duration_max_seconds')) {
      practiceStepsCol.fields.add(
        new NumberField({
          name: 'duration_max_seconds',
          required: false,
          min: 0,
          max: 7200,
        }),
      )
    }

    app.save(practiceStepsCol)

    // ═══ B. ALTERAR cer_practice_variants ═══
    // is_default: bool, default false, opcional
    if (!practiceVariantsCol.fields.getByName('is_default')) {
      practiceVariantsCol.fields.add(
        new BoolField({
          name: 'is_default',
          required: false,
        }),
      )
    }

    app.save(practiceVariantsCol)

    // ═══ C. CRIAR cer_practice_variant_steps (se não existir) ═══
    // Padrão de autorreferência: cria a collection sem o campo supersedes_id,
    // salva para obter ID e registrar a tabela, depois adiciona supersedes_id e salva novamente.
    let variantStepsCol = null
    try {
      variantStepsCol = app.findCollectionByNameOrId('cer_practice_variant_steps')
    } catch (_) {
      variantStepsCol = new Collection({
        name: 'cer_practice_variant_steps',
        type: 'base',
        listRule: "@request.auth.id != '' && record_status = 'current'",
        viewRule: "@request.auth.id != '' && record_status = 'current'",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'practice_variant_id',
            type: 'relation',
            required: true,
            collectionId: practiceVariantsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'practice_step_id',
            type: 'relation',
            required: true,
            collectionId: practiceStepsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'practice_version_id',
            type: 'relation',
            required: true,
            collectionId: practiceVersionsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'step_order',
            type: 'number',
            required: true,
            min: 1,
            onlyInt: true,
          },
          {
            name: 'record_status',
            type: 'select',
            required: true,
            values: ['current', 'superseded'],
            maxSelect: 1,
          },
          {
            name: 'current_uniqueness_key',
            type: 'text',
            required: true,
          },
          {
            name: 'current_order_key',
            type: 'text',
            required: true,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cpvs_current_unique ON cer_practice_variant_steps (current_uniqueness_key)',
          'CREATE UNIQUE INDEX idx_cpvs_current_order ON cer_practice_variant_steps (current_order_key)',
          'CREATE INDEX idx_cpvs_variant ON cer_practice_variant_steps (practice_variant_id)',
          'CREATE INDEX idx_cpvs_step ON cer_practice_variant_steps (practice_step_id)',
          'CREATE INDEX idx_cpvs_version ON cer_practice_variant_steps (practice_version_id)',
          'CREATE INDEX idx_cpvs_status ON cer_practice_variant_steps (record_status)',
        ],
      })
      app.save(variantStepsCol)
    }

    // Adiciona relação autorreferente supersedes_id em cer_practice_variant_steps se necessário
    const savedVariantStepsCol = app.findCollectionByNameOrId('cer_practice_variant_steps')
    if (!savedVariantStepsCol.fields.getByName('supersedes_id')) {
      savedVariantStepsCol.fields.add(
        new RelationField({
          name: 'supersedes_id',
          required: false,
          collectionId: savedVariantStepsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      savedVariantStepsCol.addIndex('idx_cpvs_supersedes', false, 'supersedes_id', '')
      app.save(savedVariantStepsCol)
    }

    // ═══ D. CRIAR cer_practice_step_professional_content (se não existir) ═══
    // Padrão de autorreferência idêntico: criar collection, salvar, adicionar supersedes_id, salvar.
    // listRule e viewRule fail-closed com branch profissional ativo OU admin ativo, somente record_status current.
    // Nota de modelagem de segurança: Na sintaxe de filtro do PocketBase, @request.auth.user_roles_via_user_id
    // avalia linhas da relação user_roles. Mantém-se o padrão conservador do ecossistema CER V1 exigindo autenticação,
    // status ativo e record_status = 'current', com branch explícito para admin.
    let stepProfContentCol = null
    try {
      stepProfContentCol = app.findCollectionByNameOrId('cer_practice_step_professional_content')
    } catch (_) {
      stepProfContentCol = new Collection({
        name: 'cer_practice_step_professional_content',
        type: 'base',
        listRule:
          "@request.auth.id != '' && ((@request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.auth.user_roles_via_user_id.is_active ?= true) || (@request.auth.user_roles_via_user_id.role ?= 'admin' && @request.auth.user_roles_via_user_id.is_active ?= true)) && record_status = 'current'",
        viewRule:
          "@request.auth.id != '' && ((@request.auth.user_roles_via_user_id.role ?= 'profissional' && @request.auth.user_roles_via_user_id.is_active ?= true) || (@request.auth.user_roles_via_user_id.role ?= 'admin' && @request.auth.user_roles_via_user_id.is_active ?= true)) && record_status = 'current'",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'practice_step_id',
            type: 'relation',
            required: true,
            collectionId: practiceStepsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'practice_version_id',
            type: 'relation',
            required: true,
            collectionId: practiceVersionsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'content_kind',
            type: 'select',
            required: true,
            values: ['traditional_framework_note', 'forbidden_inference', 'professional_guidance'],
            maxSelect: 1,
          },
          {
            name: 'content_text',
            type: 'text',
            required: true,
          },
          {
            name: 'source_manifest_path',
            type: 'text',
            required: false,
          },
          {
            name: 'content_classification',
            type: 'select',
            required: true,
            values: ['professional_only'],
            maxSelect: 1,
          },
          {
            name: 'record_status',
            type: 'select',
            required: true,
            values: ['current', 'superseded'],
            maxSelect: 1,
          },
          {
            name: 'current_uniqueness_key',
            type: 'text',
            required: true,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cpspc_current_unique ON cer_practice_step_professional_content (current_uniqueness_key)',
          'CREATE INDEX idx_cpspc_step ON cer_practice_step_professional_content (practice_step_id)',
          'CREATE INDEX idx_cpspc_version ON cer_practice_step_professional_content (practice_version_id)',
          'CREATE INDEX idx_cpspc_kind ON cer_practice_step_professional_content (content_kind)',
          'CREATE INDEX idx_cpspc_status ON cer_practice_step_professional_content (record_status)',
        ],
      })
      app.save(stepProfContentCol)
    }

    // Adiciona relação autorreferente supersedes_id em cer_practice_step_professional_content se necessário
    const savedProfContentCol = app.findCollectionByNameOrId(
      'cer_practice_step_professional_content',
    )
    if (!savedProfContentCol.fields.getByName('supersedes_id')) {
      savedProfContentCol.fields.add(
        new RelationField({
          name: 'supersedes_id',
          required: false,
          collectionId: savedProfContentCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      savedProfContentCol.addIndex('idx_cpspc_supersedes', false, 'supersedes_id', '')
      app.save(savedProfContentCol)
    }
  },
  (app) => {
    // DOWN-MIGRATION FAIL-CLOSED:
    // (1) Concluir todas as verificações antes da primeira alteração estrutural;
    // (2) Relançar qualquer erro de consulta / nunca engolir falha;
    // (3) Abortar se houver dados nas collections novas;
    // (4) Abortar se qualquer campo novo possuir valor;
    // (5) Somente iniciar remoções depois de todas as verificações passarem;
    // (6) Abortar imediatamente se qualquer remoção falhar;
    // (7) Nunca continuar após falha;
    // (8) Nunca remover dados para facilitar rollback;
    // (9) Nunca apagar audit_events;
    // (10) Nunca tocar em 0047 ou 0048.
    // Nenhum catch vazio ou engolidor permitido.

    // ── ETAPA 1: VERIFICAÇÕES PRÉVIAS (nenhuma remoção antes desta etapa passar inteira) ──

    // 1.1 Verificação fail-closed de cer_practice_variant_steps
    let vsCol = null
    try {
      vsCol = app.findCollectionByNameOrId('cer_practice_variant_steps')
    } catch (err) {
      throw new Error(
        `[ROLLBACK BLOQUEADO] Falha ao localizar cer_practice_variant_steps: ${err.message || err}`,
      )
    }
    const countVs = app.countRecords('cer_practice_variant_steps')
    if (countVs > 0) {
      throw new Error(
        `[ROLLBACK BLOQUEADO - FAIL CLOSED] Coleção cer_practice_variant_steps contém ${countVs} registros. Rollback abortado para proteger dados.`,
      )
    }

    // 1.2 Verificação fail-closed de cer_practice_step_professional_content
    let spcCol = null
    try {
      spcCol = app.findCollectionByNameOrId('cer_practice_step_professional_content')
    } catch (err) {
      throw new Error(
        `[ROLLBACK BLOQUEADO] Falha ao localizar cer_practice_step_professional_content: ${err.message || err}`,
      )
    }
    const countSpc = app.countRecords('cer_practice_step_professional_content')
    if (countSpc > 0) {
      throw new Error(
        `[ROLLBACK BLOQUEADO - FAIL CLOSED] Coleção cer_practice_step_professional_content contém ${countSpc} registros. Rollback abortado para proteger dados.`,
      )
    }

    // 1.3 Verificação fail-closed de dados nos novos campos de cer_practice_steps
    let stepsCol = null
    try {
      stepsCol = app.findCollectionByNameOrId('cer_practice_steps')
    } catch (err) {
      throw new Error(
        `[ROLLBACK BLOQUEADO] Falha ao localizar cer_practice_steps: ${err.message || err}`,
      )
    }
    const countStepFieldsWithData = app.countRecords(
      'cer_practice_steps',
      "semantic_role != '' || duration_min_seconds > 0 || duration_max_seconds > 0",
    )
    if (countStepFieldsWithData > 0) {
      throw new Error(
        `[ROLLBACK BLOQUEADO - FAIL CLOSED] cer_practice_steps possui ${countStepFieldsWithData} registros com campos do lote 0049 preenchidos. Rollback abortado.`,
      )
    }

    // 1.4 Verificação fail-closed de dados nos novos campos de cer_practice_variants
    let variantsCol = null
    try {
      variantsCol = app.findCollectionByNameOrId('cer_practice_variants')
    } catch (err) {
      throw new Error(
        `[ROLLBACK BLOQUEADO] Falha ao localizar cer_practice_variants: ${err.message || err}`,
      )
    }
    const countVariantFieldsWithData = app.countRecords(
      'cer_practice_variants',
      'is_default = true',
    )
    if (countVariantFieldsWithData > 0) {
      throw new Error(
        `[ROLLBACK BLOQUEADO - FAIL CLOSED] cer_practice_variants possui ${countVariantFieldsWithData} registros com is_default=true. Rollback abortado.`,
      )
    }

    // ── ETAPA 2: REMOÇÕES ESTRUTURAIS (somente após todas as verificações passarem) ──

    // 2.1 Deletar cer_practice_step_professional_content (falha imediata se der erro)
    app.delete(spcCol)

    // 2.2 Deletar cer_practice_variant_steps (falha imediata se der erro)
    app.delete(vsCol)

    // 2.3 Remover campos novos de cer_practice_steps (falha imediata se der erro)
    const fieldsToRemove = ['semantic_role', 'duration_min_seconds', 'duration_max_seconds']
    for (const f of fieldsToRemove) {
      if (stepsCol.fields.getByName(f)) {
        stepsCol.fields.removeByName(f)
      }
    }
    app.save(stepsCol)

    // 2.4 Remover campo novo de cer_practice_variants (falha imediata se der erro)
    if (variantsCol.fields.getByName('is_default')) {
      variantsCol.fields.removeByName('is_default')
    }
    app.save(variantsCol)
  },
)
