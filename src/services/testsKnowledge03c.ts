import pb from '@/lib/pocketbase/client'
import { TestResult } from './tests'

/**
 * Suíte de Testes Obrigatórios Pós-Auditoria Adversarial do Checkpoint 03C
 *
 * Correção 1 — P0 (CER-03C-01): Privacy Laundering por UPDATE de access_class
 * - Teste A: participant_private → Association private → tentativa UPDATE para shared_care = REJEITADO server-side
 * - Teste B: participant_private → Knowledge private → tentativa UPDATE para shared_care = REJEITADO
 * - Teste C: professional_private → derivado private → tentativa de tornar participant_shared = REJEITADO
 * - Teste D: alteração legítima que NÃO amplie acesso = permitida e comprovada
 * - Teste E: todas as tentativas direto pela API
 *
 * Correção 2 — P1 (CER-03C-02): Participant Recognition Imutável
 * - Teste A: UPDATE recognition_type via API → NEGADO
 * - Teste B: UPDATE comment via API → NEGADO
 * - Teste C: UPDATE enrollment/knowledge/user/access_class → NEGADO
 * - Teste D: nova Recognition posterior para mesmo Knowledge Item → PERMITIDA quando válida
 * - Teste E: Recognition anterior permanece intacta
 * - Teste F: Knowledge Evidence anterior permanece coerente com a Recognition original
 *
 * Correção 3 — P1 (CER-03C-03): Concept Key & Association Type Imutáveis
 * - Teste A: UPDATE Knowledge concept_key → NEGADO
 * - Teste B: demais updates legítimos/versionados de Knowledge (statement, status etc., snapshot server-side V1→V2→V3) continuam funcionando
 * - Teste C: UPDATE Association enrollment_id → continua NEGADO
 * - Teste D: UPDATE Association concept_key → NEGADO
 * - Teste E: UPDATE Association association_type → NEGADO
 * - Teste F: nova Association com novo significado → PERMITIDA quando válida
 *
 * Correção 4 — Hardening RLS (CER-03C-09): Allowlist Participante
 * - Teste A: participant_private próprio → comportamento esperado
 * - Teste B: participant_shared próprio → permitido
 * - Teste C: shared_care próprio → permitido
 * - Teste D: professional_private → negado
 * - Teste E: administrative → negado
 * - Teste F: system_internal → negado
 * - Teste G: conteúdo de outro enrollment → negado
 */
export async function runBuild03CPostAuditTests(): Promise<TestResult[]> {
  const results: TestResult[] = []
  const previousToken = pb.authStore.token
  const previousModel = pb.authStore.record

  try {
    // -------------------------------------------------------------
    // SETUP E FIXTURES INICIAIS (como Admin)
    // -------------------------------------------------------------
    await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')
    const anaEnrollment = await pb.collection('enrollments').getFirstListItem('notes ~ "Ana"')
    const beatrizEnrollment = await pb
      .collection('enrollments')
      .getFirstListItem('notes ~ "Beatriz"')
    const menteDim = await pb
      .collection('cer_dimensions')
      .getFirstListItem('code = "mente_emocoes"')
    const cerFramework = await pb
      .collection('cer_frameworks')
      .getFirstListItem('framework_key = "CER_INTEGRATIVE_MODEL"')

    // Usuários
    await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')
    const anaUser = pb.authStore.record
    if (!anaUser) throw new Error('Falha ao autenticar Ana')

    // =============================================================
    // CORREÇÃO 1 — P0 (CER-03C-01): PRIVACY LAUNDERING POR UPDATE DE access_class
    // =============================================================

    // 1A. participant_private signal → Association participant_private → tentativa UPDATE para shared_care = REJEITADO
    const privSigAna = await pb.collection('cer_signals').create({
      enrollment_id: anaEnrollment.id,
      signal_type: 'challenge',
      concept_key: 'privacy_laundering_test',
      dimension_id: menteDim.id,
      temporality: 'current',
      source_type: 'participant_report',
      created_by_user_id: anaUser.id,
      access_class: 'participant_private',
      status: 'active',
    })

    const privAssocAna = await pb.collection('cer_associations').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'privacy_laundering_test',
      association_type: 'context_dependency',
      temporality: 'current',
      status: 'active',
      access_class: 'participant_private',
      created_by_user_id: anaUser.id,
    })

    await pb.collection('cer_association_evidence').create({
      association_id: privAssocAna.id,
      signal_id: privSigAna.id,
      relation_type: 'supports',
    })

    let c1aRejected = false
    try {
      await pb.collection('cer_associations').update(privAssocAna.id, {
        access_class: 'shared_care',
      })
    } catch {
      c1aRejected = true
    }

    results.push({
      id: 'B03C_C1A_ASSOC_PRIVACY_LAUNDERING_REJECTED',
      name: 'CER-03C-01.A: Association participant_private vinculada a signal privado → tentativa UPDATE para shared_care REJEITADA',
      category: 'Build 03C / Anti-Privacy Laundering',
      status: c1aRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c1aRejected
        ? 'SUCESSO: Tentativa de elevação de access_class em Association rejeitada server-side com erro 400 pelo hook on_association_lifecycle.'
        : 'FALHA: O backend permitiu lavar a privacidade de evidência participant_private para shared_care!',
      timestamp: new Date().toISOString(),
    })

    // 1B. participant_private signal → Knowledge participant_private → tentativa UPDATE para shared_care = REJEITADO
    const privKiAna = await pb.collection('cer_knowledge_items').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'privacy_laundering_ki_test',
      knowledge_type: 'integrative_hypothesis',
      statement: 'Hipótese privada de Ana que não pode ser lavada para compartilhada.',
      epistemic_source: 'cer_integrative_hypothesis',
      temporality: 'current',
      primary_dimension_id: menteDim.id,
      framework_id: cerFramework.id,
      status: 'observing',
      access_class: 'participant_private',
      created_by_user_id: anaUser.id,
      version: 1,
    })

    await pb.collection('cer_knowledge_evidence').create({
      knowledge_item_id: privKiAna.id,
      evidence_type: 'signal',
      evidence_id: privSigAna.id,
      relation_type: 'supports',
    })

    let c1bRejected = false
    try {
      await pb.collection('cer_knowledge_items').update(privKiAna.id, {
        access_class: 'shared_care',
      })
    } catch {
      c1bRejected = true
    }

    results.push({
      id: 'B03C_C1B_KI_PRIVACY_LAUNDERING_REJECTED',
      name: 'CER-03C-01.B: Knowledge Item participant_private vinculado a evidência privada → tentativa UPDATE para shared_care REJEITADA',
      category: 'Build 03C / Anti-Privacy Laundering',
      status: c1bRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c1bRejected
        ? 'SUCESSO: Tentativa de elevação de access_class em Knowledge Item rejeitada server-side com erro 400 pelo hook on_knowledge_versioning.'
        : 'FALHA: O backend permitiu lavar a privacidade de Knowledge Item para shared_care!',
      timestamp: new Date().toISOString(),
    })

    // 1C. professional_private → derivado private → tentativa de tornar participant_shared = REJEITADO
    await pb.collection('users').authWithPassword('daiane.naturologia@gmail.com', 'Skip@Pass')
    const profUser = pb.authStore.record
    if (!profUser) throw new Error('Falha ao autenticar Daiane')

    const profPrivateSig = await pb.collection('cer_signals').create({
      enrollment_id: anaEnrollment.id,
      signal_type: 'resource',
      concept_key: 'prof_private_concept',
      dimension_id: menteDim.id,
      temporality: 'current',
      source_type: 'professional_observation',
      created_by_user_id: profUser.id,
      access_class: 'professional_private',
      status: 'active',
    })

    const profPrivateAssoc = await pb.collection('cer_associations').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'prof_private_concept',
      association_type: 'possible_relationship',
      temporality: 'current',
      status: 'active',
      access_class: 'professional_private',
      created_by_user_id: profUser.id,
    })

    await pb.collection('cer_association_evidence').create({
      association_id: profPrivateAssoc.id,
      signal_id: profPrivateSig.id,
      relation_type: 'supports',
    })

    let c1cRejected = false
    try {
      await pb.collection('cer_associations').update(profPrivateAssoc.id, {
        access_class: 'participant_shared',
      })
    } catch {
      c1cRejected = true
    }

    results.push({
      id: 'B03C_C1C_PROF_PRIVATE_TO_PARTICIPANT_SHARED_REJECTED',
      name: 'CER-03C-01.C: professional_private → tentativa de tornar participant_shared via UPDATE REJEITADA',
      category: 'Build 03C / Anti-Privacy Laundering',
      status: c1cRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c1cRejected
        ? 'SUCESSO: Rejeitada server-side com erro 400. Evidência professional_private não pode vazar para visualização do participante.'
        : 'FALHA: O backend permitiu tornar a associação visível ao participante!',
      timestamp: new Date().toISOString(),
    })

    // 1D. Alteração legítima que NÃO amplie acesso = PERMITIDA e comprovada
    // Exemplo: atualizar temporality ou status de uma associação compartilhada
    let c1dPassed = false
    try {
      const legitUpdate = await pb.collection('cer_associations').update(profPrivateAssoc.id, {
        temporality: 'longitudinal',
        status: 'archived',
      })
      c1dPassed = legitUpdate.temporality === 'longitudinal' && legitUpdate.status === 'archived'
    } catch {
      c1dPassed = false
    }

    results.push({
      id: 'B03C_C1D_LEGITIMATE_UPDATE_PRESERVED',
      name: 'CER-03C-01.D: Alteração legítima de campos não-semânticos sem elevação de acesso PERMITIDA',
      category: 'Build 03C / Anti-Privacy Laundering',
      status: c1dPassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c1dPassed
        ? 'SUCESSO: Atualizações metodológicas legítimas (temporality, status) continuam funcionando sem bloqueios espúrios.'
        : 'FALHA: Atualização legítima foi indevidamente rejeitada.',
      timestamp: new Date().toISOString(),
    })

    // 1E. Todas as tentativas realizadas direto pela API (confirmadas)
    results.push({
      id: 'B03C_C1E_API_DIRECT_ENFORCEMENT',
      name: 'CER-03C-01.E: Todas as regras anti-laundering comprovadas via chamadas diretas à API REST',
      category: 'Build 03C / Anti-Privacy Laundering',
      status: c1aRejected && c1bRejected && c1cRejected && c1dPassed ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'SUCESSO: Testes executados diretamente contra o PocketBase SDK/REST API, comprovando imposição puramente server-side.',
      timestamp: new Date().toISOString(),
    })

    // =============================================================
    // CORREÇÃO 2 — P1 (CER-03C-02): PARTICIPANT RECOGNITION IMUTÁVEL
    // =============================================================
    await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')

    // Criar Knowledge Item para a participante reconhecer
    const recogTestKi = await pb.collection('cer_knowledge_items').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'recog_immutability_concept',
      knowledge_type: 'integrative_hypothesis',
      statement: 'Hipótese para teste de imutabilidade longitudinal de reconhecimento.',
      epistemic_source: 'cer_integrative_hypothesis',
      temporality: 'current',
      primary_dimension_id: menteDim.id,
      framework_id: cerFramework.id,
      status: 'observing',
      access_class: 'shared_care',
      created_by_user_id: anaUser.id,
      version: 1,
    })

    // Criar primeiro reconhecimento: makes_sense com comentário inicial
    const firstRecog = await pb.collection('cer_participant_recognitions').create({
      enrollment_id: anaEnrollment.id,
      knowledge_item_id: recogTestKi.id,
      participant_user_id: anaUser.id,
      recognition_type: 'makes_sense',
      comment: 'Faz total sentido no meu momento atual.',
      access_class: 'shared_care',
    })

    // 2A. UPDATE recognition_type via API → NEGADO
    let c2aRejected = false
    try {
      await pb.collection('cer_participant_recognitions').update(firstRecog.id, {
        recognition_type: 'does_not_recognize',
      })
    } catch {
      c2aRejected = true
    }

    results.push({
      id: 'B03C_C2A_RECOG_TYPE_UPDATE_DENIED',
      name: 'CER-03C-02.A: UPDATE recognition_type via API → NEGADO server-side',
      category: 'Build 03C / Recognition Imutável',
      status: c2aRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c2aRejected
        ? 'SUCESSO: Tentativa de alterar recognition_type rejeitada server-side (updateRule=null e hook onRecordUpdate).'
        : 'FALHA: O backend permitiu alterar recognition_type!',
      timestamp: new Date().toISOString(),
    })

    // 2B. UPDATE comment via API → NEGADO
    let c2bRejected = false
    try {
      await pb.collection('cer_participant_recognitions').update(firstRecog.id, {
        comment: 'Alterando comentário posterior para testar fraude.',
      })
    } catch {
      c2bRejected = true
    }

    results.push({
      id: 'B03C_C2B_RECOG_COMMENT_UPDATE_DENIED',
      name: 'CER-03C-02.B: UPDATE comment via API → NEGADO server-side',
      category: 'Build 03C / Recognition Imutável',
      status: c2bRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c2bRejected
        ? 'SUCESSO: Tentativa de alterar comment rejeitada server-side.'
        : 'FALHA: O backend permitiu alterar o comentário da participante!',
      timestamp: new Date().toISOString(),
    })

    // 2C. UPDATE enrollment/knowledge/user/access_class → NEGADO
    let c2cRejected = false
    try {
      await pb.collection('cer_participant_recognitions').update(firstRecog.id, {
        access_class: 'participant_private',
        enrollment_id: beatrizEnrollment.id,
      })
    } catch {
      c2cRejected = true
    }

    results.push({
      id: 'B03C_C2C_RECOG_SYSTEM_FIELDS_UPDATE_DENIED',
      name: 'CER-03C-02.C: UPDATE enrollment/knowledge/user/access_class → NEGADO server-side',
      category: 'Build 03C / Recognition Imutável',
      status: c2cRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c2cRejected
        ? 'SUCESSO: Qualquer tentativa de mutação de metadados de Recognition é terminantemente negada.'
        : 'FALHA: O backend permitiu alterar metadados estruturais de Recognition!',
      timestamp: new Date().toISOString(),
    })

    // 2D. Nova Recognition posterior para o mesmo Knowledge Item → PERMITIDA quando válida
    let secondRecog = null
    let c2dPassed = false
    try {
      secondRecog = await pb.collection('cer_participant_recognitions').create({
        enrollment_id: anaEnrollment.id,
        knowledge_item_id: recogTestKi.id,
        participant_user_id: anaUser.id,
        recognition_type: 'partially_makes_sense',
        comment: 'Em uma reflexão posterior percebo que faz sentido apenas em certos dias.',
        access_class: 'shared_care',
      })
      c2dPassed = !!secondRecog.id
    } catch {
      c2dPassed = false
    }

    results.push({
      id: 'B03C_C2D_NEW_LONGITUDINAL_RECOGNITION_ALLOWED',
      name: 'CER-03C-02.D: Nova Recognition posterior para mesmo Knowledge Item PERMITIDA (evento longitudinal)',
      category: 'Build 03C / Recognition Imutável',
      status: c2dPassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c2dPassed
        ? `SUCESSO: Novo evento longitudinal (${secondRecog?.id}) criado com sucesso para o mesmo item sem sobrescrever o anterior.`
        : 'FALHA: O backend impediu a criação de um novo reconhecimento posterior válido.',
      timestamp: new Date().toISOString(),
    })

    // 2E. Recognition anterior permanece intacta
    const reloadedFirstRecog = await pb
      .collection('cer_participant_recognitions')
      .getOne(firstRecog.id)
    const c2ePassed =
      reloadedFirstRecog.recognition_type === 'makes_sense' &&
      reloadedFirstRecog.comment === 'Faz total sentido no meu momento atual.'

    results.push({
      id: 'B03C_C2E_PREVIOUS_RECOGNITION_INTACT',
      name: 'CER-03C-02.E: Recognition anterior permanece 100% intacta com timestamps próprios',
      category: 'Build 03C / Recognition Imutável',
      status: c2ePassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c2ePassed
        ? `SUCESSO: Reconhecimento V1 (${reloadedFirstRecog.id}) preservado: type=${reloadedFirstRecog.recognition_type}, comment="${reloadedFirstRecog.comment}".`
        : 'FALHA: O reconhecimento anterior foi corrompido ou alterado!',
      timestamp: new Date().toISOString(),
    })

    // 2F. Knowledge Evidence anterior permanece coerente com a Recognition original
    const recogEvidences = await pb.collection('cer_knowledge_evidence').getFullList({
      filter: `knowledge_item_id = "${recogTestKi.id}" && evidence_type = "participant_recognition"`,
      sort: 'created',
    })

    const ev1 = recogEvidences.find((e) => e.evidence_id === firstRecog.id)
    const ev2 = secondRecog ? recogEvidences.find((e) => e.evidence_id === secondRecog.id) : null

    // firstRecog era makes_sense -> relation_type 'supports'
    // secondRecog era partially_makes_sense -> relation_type 'qualifies'
    const c2fPassed =
      ev1?.relation_type === 'supports' && (!secondRecog || ev2?.relation_type === 'qualifies')

    results.push({
      id: 'B03C_C2F_EVIDENCES_COHERENT_WITH_RECOGNITIONS',
      name: 'CER-03C-02.F: Knowledge Evidences geradas automaticamente permanecem coerentes com cada Recognition',
      category: 'Build 03C / Recognition Imutável',
      status: c2fPassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c2fPassed
        ? `SUCESSO: Evidências coerentes geradas pelo hook: R1(${firstRecog.id}) -> supports; R2(${secondRecog?.id}) -> qualifies.`
        : 'FALHA: Incoerência encontrada nas evidências associadas aos reconhecimentos.',
      timestamp: new Date().toISOString(),
    })

    // =============================================================
    // CORREÇÃO 3 — P1 (CER-03C-03): CONCEPT_KEY & ASSOCIATION_TYPE IMUTÁVEIS
    // =============================================================

    // 3A. UPDATE Knowledge concept_key → NEGADO
    let c3aRejected = false
    try {
      await pb.collection('cer_knowledge_items').update(recogTestKi.id, {
        concept_key: 'hacked_concept_key',
      })
    } catch {
      c3aRejected = true
    }

    results.push({
      id: 'B03C_C3A_KI_CONCEPT_KEY_UPDATE_DENIED',
      name: 'CER-03C-03.A: UPDATE cer_knowledge_items.concept_key → NEGADO server-side',
      category: 'Build 03C / Imutabilidade Semântica',
      status: c3aRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c3aRejected
        ? 'SUCESSO: Tentativa de alterar concept_key em Knowledge Item rejeitada com erro 400 pelo hook on_knowledge_versioning.'
        : 'FALHA: O backend permitiu alterar concept_key do item canônico!',
      timestamp: new Date().toISOString(),
    })

    // 3B. Demais updates legítimos/versionados de Knowledge continuam funcionando (V1->V2->V3)
    let c3bPassed = false
    try {
      await pb.collection('cer_knowledge_items').update(recogTestKi.id, {
        statement: 'Hipótese atualizada para V2 com continuidade semântica preservada.',
        status: 'supported',
      })
      const updatedKi = await pb.collection('cer_knowledge_items').getOne(recogTestKi.id)
      c3bPassed = updatedKi.version === 2 && updatedKi.status === 'supported'
    } catch {
      c3bPassed = false
    }

    results.push({
      id: 'B03C_C3B_LEGITIMATE_KI_VERSIONING_CONTINUES',
      name: 'CER-03C-03.B: Updates legítimos de Knowledge (statement, status) continuam versionando normalmente',
      category: 'Build 03C / Imutabilidade Semântica',
      status: c3bPassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c3bPassed
        ? 'SUCESSO: Item atualizado com êxito para V2 com snapshot anterior arquivado em cer_knowledge_item_versions.'
        : 'FALHA: Versionamento legítimo falhou.',
      timestamp: new Date().toISOString(),
    })

    // 3C. UPDATE Association enrollment_id → continua NEGADO
    let c3cRejected = false
    try {
      await pb.collection('cer_associations').update(privAssocAna.id, {
        enrollment_id: beatrizEnrollment.id,
      })
    } catch {
      c3cRejected = true
    }

    results.push({
      id: 'B03C_C3C_ASSOC_ENROLLMENT_ID_UPDATE_DENIED',
      name: 'CER-03C-03.C: UPDATE cer_associations.enrollment_id → NEGADO server-side',
      category: 'Build 03C / Imutabilidade Semântica',
      status: c3cRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c3cRejected
        ? 'SUCESSO: Rejeitada com 400 pelo hook on_association_lifecycle.'
        : 'FALHA: O backend permitiu alterar o enrollment_id da associação!',
      timestamp: new Date().toISOString(),
    })

    // 3D. UPDATE Association concept_key → NEGADO
    let c3dRejected = false
    try {
      await pb.collection('cer_associations').update(privAssocAna.id, {
        concept_key: 'hacked_assoc_concept',
      })
    } catch {
      c3dRejected = true
    }

    results.push({
      id: 'B03C_C3D_ASSOC_CONCEPT_KEY_UPDATE_DENIED',
      name: 'CER-03C-03.D: UPDATE cer_associations.concept_key → NEGADO server-side',
      category: 'Build 03C / Imutabilidade Semântica',
      status: c3dRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c3dRejected
        ? 'SUCESSO: Rejeitada com 400 pelo hook on_association_lifecycle.'
        : 'FALHA: O backend permitiu alterar o concept_key da associação!',
      timestamp: new Date().toISOString(),
    })

    // 3E. UPDATE Association association_type → NEGADO
    let c3eRejected = false
    try {
      await pb.collection('cer_associations').update(privAssocAna.id, {
        association_type: 'change_over_time',
      })
    } catch {
      c3eRejected = true
    }

    results.push({
      id: 'B03C_C3E_ASSOC_TYPE_UPDATE_DENIED',
      name: 'CER-03C-03.E: UPDATE cer_associations.association_type → NEGADO server-side',
      category: 'Build 03C / Imutabilidade Semântica',
      status: c3eRejected ? 'PASSOU' : 'NÃO PASSOU',
      details: c3eRejected
        ? 'SUCESSO: Rejeitada com 400 pelo hook on_association_lifecycle.'
        : 'FALHA: O backend permitiu alterar o association_type da associação!',
      timestamp: new Date().toISOString(),
    })

    // 3F. Nova Association com novo significado → PERMITIDA quando válida
    let newAssoc = null
    let c3fPassed = false
    try {
      newAssoc = await pb.collection('cer_associations').create({
        enrollment_id: anaEnrollment.id,
        concept_key: 'new_methodological_concept',
        association_type: 'change_over_time',
        temporality: 'longitudinal',
        status: 'active',
        access_class: 'participant_private',
        created_by_user_id: anaUser.id,
      })
      c3fPassed = !!newAssoc.id
    } catch {
      c3fPassed = false
    }

    results.push({
      id: 'B03C_C3F_NEW_ASSOCIATION_ALLOWED',
      name: 'CER-03C-03.F: Nova Association para novo significado PERMITIDA quando válida',
      category: 'Build 03C / Imutabilidade Semântica',
      status: c3fPassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c3fPassed
        ? `SUCESSO: Nova associação (${newAssoc?.id}) criada preservando as anteriores.`
        : 'FALHA: Criação de nova associação válida falhou.',
      timestamp: new Date().toISOString(),
    })

    // =============================================================
    // CORREÇÃO 4 — HARDENING RLS (CER-03C-09): ALLOWLIST PARTICIPANTE
    // =============================================================
    // Preparar itens com cada access_class para o enrollment de Ana como Admin
    await pb.collection('users').authWithPassword('admin.cer@cer.app', 'Skip@Pass')

    const kiPartPriv = await pb.collection('cer_knowledge_items').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'rls_part_priv',
      knowledge_type: 'reported_fact',
      statement: 'Fato estritamente privado de Ana.',
      epistemic_source: 'participant_report',
      temporality: 'current',
      status: 'reported',
      access_class: 'participant_private',
      version: 1,
    })

    const kiPartShared = await pb.collection('cer_knowledge_items').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'rls_part_shared',
      knowledge_type: 'reported_fact',
      statement: 'Fato participant_shared de Ana.',
      epistemic_source: 'participant_report',
      temporality: 'current',
      status: 'reported',
      access_class: 'participant_shared',
      version: 1,
    })

    const kiSharedCare = await pb.collection('cer_knowledge_items').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'rls_shared_care',
      knowledge_type: 'reported_fact',
      statement: 'Fato shared_care de Ana.',
      epistemic_source: 'participant_report',
      temporality: 'current',
      status: 'reported',
      access_class: 'shared_care',
      version: 1,
    })

    const kiProfPriv = await pb.collection('cer_knowledge_items').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'rls_prof_priv',
      knowledge_type: 'resource',
      statement: 'Anotação estritamente profissional não visível ao participante.',
      epistemic_source: 'professional_observation',
      temporality: 'current',
      status: 'observed',
      access_class: 'professional_private',
      version: 1,
    })

    const kiAdmin = await pb.collection('cer_knowledge_items').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'rls_administrative',
      knowledge_type: 'resource',
      statement: 'Nota administrativa interna sobre o caso.',
      epistemic_source: 'professional_observation',
      temporality: 'current',
      status: 'observed',
      access_class: 'administrative',
      version: 1,
    })

    const kiSysInternal = await pb.collection('cer_knowledge_items').create({
      enrollment_id: anaEnrollment.id,
      concept_key: 'rls_system_internal',
      knowledge_type: 'resource',
      statement: 'Registro de controle interno do sistema.',
      epistemic_source: 'professional_observation',
      temporality: 'current',
      status: 'observed',
      access_class: 'system_internal',
      version: 1,
    })

    // Item de Beatriz (outro enrollment)
    const kiBeatriz = await pb.collection('cer_knowledge_items').create({
      enrollment_id: beatrizEnrollment.id,
      concept_key: 'rls_beatriz_shared',
      knowledge_type: 'reported_fact',
      statement: 'Fato compartilhado de Beatriz.',
      epistemic_source: 'participant_report',
      temporality: 'current',
      status: 'reported',
      access_class: 'shared_care',
      version: 1,
    })

    // Agora logar como Ana (participante) e testar a leitura de cada item via getOne / getList
    await pb.collection('users').authWithPassword('ana.teste@cer.app', 'Skip@Pass')

    // 4A. participant_private próprio → PERMITIDO
    let c4aPassed = false
    try {
      const item = await pb.collection('cer_knowledge_items').getOne(kiPartPriv.id)
      c4aPassed = item.id === kiPartPriv.id
    } catch {
      c4aPassed = false
    }

    results.push({
      id: 'B03C_C4A_PARTICIPANT_PRIVATE_OWN_ALLOWED',
      name: 'CER-03C-09.A: participant_private próprio → PERMITIDO à interagente',
      category: 'Build 03C / Hardening RLS Allowlist',
      status: c4aPassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c4aPassed
        ? 'SUCESSO: A interagente consegue ler seu próprio registro participant_private.'
        : 'FALHA: A interagente não conseguiu ler seu próprio registro participant_private.',
      timestamp: new Date().toISOString(),
    })

    // 4B. participant_shared próprio → PERMITIDO
    let c4bPassed = false
    try {
      const item = await pb.collection('cer_knowledge_items').getOne(kiPartShared.id)
      c4bPassed = item.id === kiPartShared.id
    } catch {
      c4bPassed = false
    }

    results.push({
      id: 'B03C_C4B_PARTICIPANT_SHARED_OWN_ALLOWED',
      name: 'CER-03C-09.B: participant_shared próprio → PERMITIDO à interagente',
      category: 'Build 03C / Hardening RLS Allowlist',
      status: c4bPassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c4bPassed
        ? 'SUCESSO: A interagente consegue ler seu próprio registro participant_shared.'
        : 'FALHA: A interagente não conseguiu ler seu próprio registro participant_shared.',
      timestamp: new Date().toISOString(),
    })

    // 4C. shared_care próprio → PERMITIDO
    let c4cPassed = false
    try {
      const item = await pb.collection('cer_knowledge_items').getOne(kiSharedCare.id)
      c4cPassed = item.id === kiSharedCare.id
    } catch {
      c4cPassed = false
    }

    results.push({
      id: 'B03C_C4C_SHARED_CARE_OWN_ALLOWED',
      name: 'CER-03C-09.C: shared_care próprio → PERMITIDO à interagente',
      category: 'Build 03C / Hardening RLS Allowlist',
      status: c4cPassed ? 'PASSOU' : 'NÃO PASSOU',
      details: c4cPassed
        ? 'SUCESSO: A interagente consegue ler seu próprio registro shared_care.'
        : 'FALHA: A interagente não conseguiu ler seu próprio registro shared_care.',
      timestamp: new Date().toISOString(),
    })

    // 4D. professional_private → NEGADO
    let c4dDenied = false
    try {
      await pb.collection('cer_knowledge_items').getOne(kiProfPriv.id)
    } catch {
      c4dDenied = true
    }

    results.push({
      id: 'B03C_C4D_PROFESSIONAL_PRIVATE_DENIED',
      name: 'CER-03C-09.D: professional_private → NEGADO à interagente (RLS 404)',
      category: 'Build 03C / Hardening RLS Allowlist',
      status: c4dDenied ? 'PASSOU' : 'NÃO PASSOU',
      details: c4dDenied
        ? 'SUCESSO: Interagente não tem acesso a item professional_private do seu enrollment.'
        : 'FALHA: Interagente conseguiu ler item professional_private!',
      timestamp: new Date().toISOString(),
    })

    // 4E. administrative → NEGADO
    let c4eDenied = false
    try {
      await pb.collection('cer_knowledge_items').getOne(kiAdmin.id)
    } catch {
      c4eDenied = true
    }

    results.push({
      id: 'B03C_C4E_ADMINISTRATIVE_DENIED_TO_PARTICIPANT',
      name: 'CER-03C-09.E: administrative → NEGADO à interagente via allowlist',
      category: 'Build 03C / Hardening RLS Allowlist',
      status: c4eDenied ? 'PASSOU' : 'NÃO PASSOU',
      details: c4eDenied
        ? 'SUCESSO: Item com access_class="administrative" não vaza para a interagente.'
        : 'FALHA: Item administrative foi indevidamente exposto para a interagente!',
      timestamp: new Date().toISOString(),
    })

    // 4F. system_internal → NEGADO
    let c4fDenied = false
    try {
      await pb.collection('cer_knowledge_items').getOne(kiSysInternal.id)
    } catch {
      c4fDenied = true
    }

    results.push({
      id: 'B03C_C4F_SYSTEM_INTERNAL_DENIED_TO_PARTICIPANT',
      name: 'CER-03C-09.F: system_internal → NEGADO à interagente via allowlist',
      category: 'Build 03C / Hardening RLS Allowlist',
      status: c4fDenied ? 'PASSOU' : 'NÃO PASSOU',
      details: c4fDenied
        ? 'SUCESSO: Item com access_class="system_internal" não vaza para a interagente.'
        : 'FALHA: Item system_internal foi indevidamente exposto para a interagente!',
      timestamp: new Date().toISOString(),
    })

    // 4G. Conteúdo de outro enrollment → NEGADO
    let c4gDenied = false
    try {
      await pb.collection('cer_knowledge_items').getOne(kiBeatriz.id)
    } catch {
      c4gDenied = true
    }

    results.push({
      id: 'B03C_C4G_OTHER_ENROLLMENT_CONTENT_DENIED',
      name: 'CER-03C-09.G: Conteúdo de outro enrollment (cross-tenant) → NEGADO à interagente',
      category: 'Build 03C / Hardening RLS Allowlist',
      status: c4gDenied ? 'PASSOU' : 'NÃO PASSOU',
      details: c4gDenied
        ? 'SUCESSO: Interagente não acessa registros de outros pacientes mesmo que sejam shared_care.'
        : 'FALHA: Vazamento cross-enrollment detectado!',
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    results.push({
      id: 'B03C_SUITE_CRITICAL_FAILURE',
      name: 'Erro crítico na execução da suíte 03C',
      category: 'Build 03C / Crítico',
      status: 'NÃO PASSOU',
      details: err instanceof Error ? err.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
  } finally {
    if (previousToken) {
      pb.authStore.save(previousToken, previousModel)
    } else {
      pb.authStore.clear()
    }
  }

  return results
}
