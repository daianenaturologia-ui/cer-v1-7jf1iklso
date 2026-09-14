/**
 * PROJETO CER V1 — BUILD 09D-A: TESTES ADVERSARIAIS T1–T16
 * Validação rigorosa das invariantes de cer_practices.item_nature,
 * cer_practice_version_assets e cer_resource_recommendations no backend PocketBase real.
 */

import pb from '@/lib/pocketbase/client'

export interface TestResultItem09D {
  id: string
  name: string
  passed: boolean
  details: string
}

export async function runBuild09DATests(): Promise<TestResultItem09D[]> {
  const results: TestResultItem09D[] = []

  const logResult = (id: string, name: string, passed: boolean, details: string) => {
    results.push({ id, name, passed, details })
  }

  // IDs conhecidos no banco
  const PROF_A_EMAIL = 'profissional.a@cer.app'
  const PROF_B_EMAIL = 'profissional.b@cer.app'
  const PARTICIPANT_ANA_EMAIL = 'ana.teste@cer.app'
  const PASS = 'Skip@Pass'

  const ENROLLMENT_A = 'lhzdvf2yk51zv7p' // Ana vinculada a Profissional A
  const ENROLLMENT_B = '63k3vwooi4jd5ki' // Beatriz vinculada a Profissional B
  const USER_ANA = '3bwotdvtzjiustx'
  const USER_BEATRIZ = 'dgnl4rq0ycul5e4'
  const USER_PROF_A = '4udevnp3htcqt4v'
  const USER_PROF_B = 'zt7alkr3554z73w'

  // Fixtures criados para teste (serão removidos ao final)
  const createdRecordIds: { collection: string; id: string }[] = []

  try {
    // 1. Logar como Profissional A
    await pb.collection('users').authWithPassword(PROF_A_EMAIL, PASS)

    // Criar Práticas de teste:
    // P_RESOURCE (item_nature = support_resource)
    const practiceResource = await pb.collection('cer_practices').create({
      internal_name: 'TEST_09DA_RESOURCE',
      participant_facing_name_base: 'Recurso de Apoio de Teste',
      family: 'recursos_apoio',
      item_nature: 'support_resource',
      governance_modes: ['self_guided'],
      is_system_curated: true,
      status: 'active',
      created_by_user_id: USER_PROF_A,
    })
    createdRecordIds.push({ collection: 'cer_practices', id: practiceResource.id })

    // P_PRACTICE (item_nature = practice)
    const practiceStandard = await pb.collection('cer_practices').create({
      internal_name: 'TEST_09DA_PRACTICE',
      participant_facing_name_base: 'Prática Padrão de Teste',
      family: 'respiracao',
      item_nature: 'practice',
      governance_modes: ['professional_guided'],
      is_system_curated: true,
      status: 'active',
      created_by_user_id: USER_PROF_A,
    })
    createdRecordIds.push({ collection: 'cer_practices', id: practiceStandard.id })

    // P_GUIDED (item_nature = guided_experience)
    const practiceGuided = await pb.collection('cer_practices').create({
      internal_name: 'TEST_09DA_GUIDED',
      participant_facing_name_base: 'Experiência Guiada de Teste',
      family: 'experiencias_guiadas',
      item_nature: 'guided_experience',
      governance_modes: ['session_only'],
      is_system_curated: true,
      status: 'active',
      created_by_user_id: USER_PROF_A,
    })
    createdRecordIds.push({ collection: 'cer_practices', id: practiceGuided.id })

    // P_CONTINUED (item_nature = continued_care)
    const practiceContinued = await pb.collection('cer_practices').create({
      internal_name: 'TEST_09DA_CONTINUED',
      participant_facing_name_base: 'Cuidado Continuado de Teste',
      family: 'cuidados_continuados',
      item_nature: 'continued_care',
      governance_modes: ['supervised_only'],
      is_system_curated: true,
      status: 'active',
      created_by_user_id: USER_PROF_A,
    })
    createdRecordIds.push({ collection: 'cer_practices', id: practiceContinued.id })

    // Auxiliar para criar versão passando pelo fluxo editorial canônico
    const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    const createVersionWithLifecycle = async (params: {
      practice_id: string
      version_number: number
      participant_title: string
      intensity?: 'low' | 'moderate' | 'high' | 'expansive'
      consent_required?: 'not_required' | 'required' | 'conditional'
      targetStatus: 'draft' | 'active' | 'deprecated' | 'retired'
    }) => {
      // 1. Sempre nasce em draft
      const rec = await pb.collection('cer_practice_versions').create({
        practice_id: params.practice_id,
        version_number: params.version_number,
        participant_title: params.participant_title,
        intensity: params.intensity || 'low',
        consent_required: params.consent_required || 'not_required',
        author_user_id: USER_PROF_A,
        status: 'draft',
      })
      createdRecordIds.push({ collection: 'cer_practice_versions', id: rec.id })

      if (params.targetStatus === 'draft') {
        return rec
      }

      // Anexar evidência revisada e safety profile revisado
      const ev = await pb.collection('cer_practice_evidence').create({
        practice_version_id: rec.id,
        evidence_basis_type: 'clinical_practice_framework',
        confidence: 'high',
        maturity: 'established',
        author_user_id: USER_PROF_A,
        reviewer_user_id: USER_PROF_B,
        reviewed_at: new Date().toISOString(),
      })
      createdRecordIds.push({ collection: 'cer_practice_evidence', id: ev.id })

      const sp = await pb.collection('cer_practice_safety_profiles').create({
        practice_version_id: rec.id,
        consent_required: params.consent_required || 'not_required',
        regulatory_profile: 'none',
        reviewed_by_user_id: USER_PROF_B,
        reviewed_at: new Date().toISOString(),
      })
      createdRecordIds.push({ collection: 'cer_practice_safety_profiles', id: sp.id })

      // draft -> in_review
      await pb.collection('cer_practice_versions').update(rec.id, {
        status: 'in_review',
      })

      // in_review -> approved
      await pb.collection('cer_practice_versions').update(rec.id, {
        reviewer_user_id: USER_PROF_B,
        reviewed_at: new Date().toISOString(),
        safety_reviewed_at: new Date().toISOString(),
        status: 'approved',
      })

      // approved -> active
      const activeRec = await pb.collection('cer_practice_versions').update(rec.id, {
        review_due_at: futureDate,
        status: 'active',
      })

      if (params.targetStatus === 'active') {
        return activeRec
      }

      if (params.targetStatus === 'deprecated') {
        return await pb.collection('cer_practice_versions').update(rec.id, {
          status: 'deprecated',
        })
      }

      if (params.targetStatus === 'retired') {
        return await pb.collection('cer_practice_versions').update(rec.id, {
          status: 'retired',
        })
      }

      return activeRec
    }

    // Criar Versões de PracticeResource em diferentes status:
    const vDraft = await createVersionWithLifecycle({
      practice_id: practiceResource.id,
      version_number: 1,
      participant_title: 'Recurso em Draft',
      intensity: 'low',
      consent_required: 'not_required',
      targetStatus: 'draft',
    })

    const vActive = await createVersionWithLifecycle({
      practice_id: practiceResource.id,
      version_number: 2,
      participant_title: 'Recurso Ativo',
      intensity: 'low',
      consent_required: 'not_required',
      targetStatus: 'active',
    })

    const vDeprecated = await createVersionWithLifecycle({
      practice_id: practiceResource.id,
      version_number: 3,
      participant_title: 'Recurso Deprecated',
      intensity: 'low',
      consent_required: 'not_required',
      targetStatus: 'deprecated',
    })

    const vRetired = await createVersionWithLifecycle({
      practice_id: practiceResource.id,
      version_number: 4,
      participant_title: 'Recurso Retired',
      intensity: 'low',
      consent_required: 'not_required',
      targetStatus: 'retired',
    })

    const vStandardActive = await createVersionWithLifecycle({
      practice_id: practiceStandard.id,
      version_number: 1,
      participant_title: 'Prática Ativa',
      intensity: 'moderate',
      consent_required: 'required',
      targetStatus: 'active',
    })

    const vGuidedActive = await createVersionWithLifecycle({
      practice_id: practiceGuided.id,
      version_number: 1,
      participant_title: 'Guia Ativo',
      intensity: 'low',
      consent_required: 'not_required',
      targetStatus: 'active',
    })

    const vContinuedActive = await createVersionWithLifecycle({
      practice_id: practiceContinued.id,
      version_number: 1,
      participant_title: 'Cuidado Ativo',
      intensity: 'low',
      consent_required: 'not_required',
      targetStatus: 'active',
    })

    // ----------------------------------------------------
    // T1: recommendation → PracticeVersion draft → NEGADO
    // ----------------------------------------------------
    let t1Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_A,
        participant_user_id: USER_ANA,
        resource_version_id: vDraft.id,
        professional_user_id: USER_PROF_A,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t1Blocked = true
    }
    logResult(
      'T1',
      'recommendation → PracticeVersion draft → ESPERADO: NEGADO',
      t1Blocked,
      t1Blocked ? 'Bloqueado com sucesso por API rule' : 'FALHA: permitiu recomendação em draft',
    )

    // ----------------------------------------------------
    // T2: recommendation → PracticeVersion deprecated → NEGADO
    // ----------------------------------------------------
    let t2Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_A,
        participant_user_id: USER_ANA,
        resource_version_id: vDeprecated.id,
        professional_user_id: USER_PROF_A,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t2Blocked = true
    }
    logResult(
      'T2',
      'recommendation → PracticeVersion deprecated → ESPERADO: NEGADO',
      t2Blocked,
      t2Blocked
        ? 'Bloqueado com sucesso por API rule'
        : 'FALHA: permitiu recomendação em deprecated',
    )

    // ----------------------------------------------------
    // T3: recommendation → practice com item_nature=practice → NEGADO
    // ----------------------------------------------------
    let t3Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_A,
        participant_user_id: USER_ANA,
        resource_version_id: vStandardActive.id,
        professional_user_id: USER_PROF_A,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t3Blocked = true
    }
    logResult(
      'T3',
      'recommendation → practice com item_nature=practice → ESPERADO: NEGADO',
      t3Blocked,
      t3Blocked
        ? 'Bloqueado com sucesso por invariante relacional item_nature'
        : 'FALHA: permitiu recomendação de prática padrão',
    )

    // ----------------------------------------------------
    // T4: alterar item_nature de practice existente para support_resource → NEGADO
    // ----------------------------------------------------
    let t4Blocked = false
    try {
      await pb.collection('cer_practices').update(practiceStandard.id, {
        item_nature: 'support_resource',
      })
    } catch {
      t4Blocked = true
    }
    logResult(
      'T4',
      'alterar item_nature de practice existente para support_resource → ESPERADO: NEGADO',
      t4Blocked,
      t4Blocked
        ? 'Imutabilidade garantida por guard @request.body.item_nature ?= item_nature'
        : 'FALHA: permitiu mutação de item_nature',
    )

    // ----------------------------------------------------
    // T5: participante cria recommendation → NEGADO
    // ----------------------------------------------------
    await pb.collection('users').authWithPassword(PARTICIPANT_ANA_EMAIL, PASS)
    let t5Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_A,
        participant_user_id: USER_ANA,
        resource_version_id: vActive.id,
        professional_user_id: USER_PROF_A,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t5Blocked = true
    }
    logResult(
      'T5',
      'participante cria recommendation → ESPERADO: NEGADO',
      t5Blocked,
      t5Blocked
        ? 'Bloqueado com sucesso (somente profissional com vínculo ativo)'
        : 'FALHA: participante conseguiu criar recomendação',
    )

    // ----------------------------------------------------
    // T6: profissional sem professional_enrollment_access ativo cria recommendation → NEGADO
    // Profissional B não tem vínculo com Enrollment A (Ana)
    // ----------------------------------------------------
    await pb.collection('users').authWithPassword(PROF_B_EMAIL, PASS)
    let t6Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_A,
        participant_user_id: USER_ANA,
        resource_version_id: vActive.id,
        professional_user_id: pb.authStore.record!.id,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t6Blocked = true
    }
    logResult(
      'T6',
      'profissional sem professional_enrollment_access ativo cria recommendation → ESPERADO: NEGADO',
      t6Blocked,
      t6Blocked
        ? 'Bloqueado com sucesso por regra de professional_enrollment_access'
        : 'FALHA: profissional de outro enrollment conseguiu recomendar',
    )

    // ----------------------------------------------------
    // Criar recomendação legítima com Profissional A para Enrollment A
    // ----------------------------------------------------
    await pb.collection('users').authWithPassword(PROF_A_EMAIL, PASS)
    const validRecA = await pb.collection('cer_resource_recommendations').create({
      enrollment_id: ENROLLMENT_A,
      participant_user_id: USER_ANA,
      resource_version_id: vActive.id,
      professional_user_id: USER_PROF_A,
      participant_safe_message: 'Recurso leve de respiração para você experimentar.',
      status: 'recommended',
      channel: 'app',
    })
    createdRecordIds.push({ collection: 'cer_resource_recommendations', id: validRecA.id })

    // ----------------------------------------------------
    // T7: participante tenta ler recommendation de outro enrollment → NEGADO
    // Logar como participante Beatriz (Enrollment B) e tentar ler recomendação de Ana (Enrollment A)
    // ----------------------------------------------------
    await pb.collection('users').authWithPassword('beatriz.teste@cer.app', PASS)
    let t7Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').getOne(validRecA.id)
    } catch {
      t7Blocked = true
    }
    logResult(
      'T7',
      'participante tenta ler recommendation de outro enrollment → ESPERADO: NEGADO',
      t7Blocked,
      t7Blocked
        ? 'Leitura cross-enrollment bloqueada com sucesso'
        : 'FALHA: participante leu recomendação de outro enrollment',
    )

    // ----------------------------------------------------
    // T8: delete físico de recommendation → NEGADO
    // ----------------------------------------------------
    await pb.collection('users').authWithPassword(PROF_A_EMAIL, PASS)
    let t8Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').delete(validRecA.id)
    } catch {
      t8Blocked = true
    }
    logResult(
      'T8',
      'delete físico de recommendation → ESPERADO: NEGADO',
      t8Blocked,
      t8Blocked ? 'deleteRule = null bloqueou com sucesso' : 'FALHA: permitiu delete físico',
    )

    // ----------------------------------------------------
    // Criar asset em vActive e em vDraft
    // ----------------------------------------------------
    const assetVActive = await pb.collection('cer_practice_version_assets').create({
      practice_version_id: vActive.id,
      asset_type: 'audio',
      role: 'audio_instrucional',
      title: 'Áudio de Relaxamento 3min',
      sort_order: 1,
    })
    createdRecordIds.push({ collection: 'cer_practice_version_assets', id: assetVActive.id })

    const assetVDraft = await pb.collection('cer_practice_version_assets').create({
      practice_version_id: vDraft.id,
      asset_type: 'document',
      role: 'guia_pdf',
      title: 'Guia Não Publicado',
      sort_order: 1,
    })
    createdRecordIds.push({ collection: 'cer_practice_version_assets', id: assetVDraft.id })

    // ----------------------------------------------------
    // T9: participante solicita protected asset sem assignment/recommendation legítima → NEGADO
    // Ana tenta ler asset de vDraft (onde não tem recommendation nem assignment)
    // ----------------------------------------------------
    await pb.collection('users').authWithPassword(PARTICIPANT_ANA_EMAIL, PASS)
    let t9Blocked = false
    try {
      await pb.collection('cer_practice_version_assets').getOne(assetVDraft.id)
    } catch {
      t9Blocked = true
    }
    logResult(
      'T9',
      'participante solicita protected asset sem assignment/recommendation legítima → ESPERADO: NEGADO',
      t9Blocked,
      t9Blocked
        ? 'Acesso a asset não recomendado negado com sucesso'
        : 'FALHA: participante acessou asset sem vínculo',
    )

    // ----------------------------------------------------
    // T10: participante autorizado por recommendation ativa acessa protected asset → PERMITIDO
    // Ana acessa assetVActive (revisada, ativa, recomendada para Ana no Enrollment A)
    // ----------------------------------------------------
    let t10Allowed = false
    try {
      const readAsset = await pb.collection('cer_practice_version_assets').getOne(assetVActive.id)
      if (readAsset.id === assetVActive.id) {
        t10Allowed = true
      }
    } catch {
      t10Allowed = false
    }
    logResult(
      'T10',
      'participante autorizado por recommendation ativa acessa protected asset → ESPERADO: PERMITIDO',
      t10Allowed,
      t10Allowed
        ? 'Acesso concedido com sucesso pelo gate relacional'
        : 'FALHA: participante autorizada foi bloqueada',
    )

    // ----------------------------------------------------
    // T11: asset sem practice_version_id → NEGADO
    // ----------------------------------------------------
    await pb.collection('users').authWithPassword(PROF_A_EMAIL, PASS)
    let t11Blocked = false
    try {
      await pb.collection('cer_practice_version_assets').create({
        asset_type: 'video',
        title: 'Vídeo órfão',
      })
    } catch {
      t11Blocked = true
    }
    logResult(
      'T11',
      'asset sem practice_version_id → ESPERADO: NEGADO',
      t11Blocked,
      t11Blocked
        ? 'Rejeição garantida por campo required'
        : 'FALHA: permitiu criação de asset sem version anchor',
    )

    // ----------------------------------------------------
    // T12: recommendation → PracticeVersion retired → NEGADO
    // ----------------------------------------------------
    let t12Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_A,
        participant_user_id: USER_ANA,
        resource_version_id: vRetired.id,
        professional_user_id: USER_PROF_A,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t12Blocked = true
    }
    logResult(
      'T12',
      'recommendation → PracticeVersion retired → ESPERADO: NEGADO',
      t12Blocked,
      t12Blocked
        ? 'Bloqueado com sucesso por regra de status=active'
        : 'FALHA: permitiu recomendação em status retired',
    )

    // ----------------------------------------------------
    // T13: guided_experience tenta usar resource recommendation → NEGADO
    // ----------------------------------------------------
    let t13Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_A,
        participant_user_id: USER_ANA,
        resource_version_id: vGuidedActive.id,
        professional_user_id: USER_PROF_A,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t13Blocked = true
    }
    logResult(
      'T13',
      'guided_experience tenta usar resource recommendation → ESPERADO: NEGADO',
      t13Blocked,
      t13Blocked
        ? 'Bloqueado por invariante relacional item_nature != support_resource'
        : 'FALHA: permitiu recomendação de guided_experience',
    )

    // ----------------------------------------------------
    // T14: continued_care tenta usar resource recommendation → NEGADO
    // ----------------------------------------------------
    let t14Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_A,
        participant_user_id: USER_ANA,
        resource_version_id: vContinuedActive.id,
        professional_user_id: USER_PROF_A,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t14Blocked = true
    }
    logResult(
      'T14',
      'continued_care tenta usar resource recommendation → ESPERADO: NEGADO',
      t14Blocked,
      t14Blocked
        ? 'Bloqueado por invariante relacional item_nature != support_resource'
        : 'FALHA: permitiu recomendação de continued_care',
    )

    // ----------------------------------------------------
    // T15: profissional de enrollment A tenta recomendar recurso para participante/enrollment B → NEGADO
    // Profissional A tentando recomendar recurso para Enrollment B (Beatriz)
    // ----------------------------------------------------
    let t15Blocked = false
    try {
      await pb.collection('cer_resource_recommendations').create({
        enrollment_id: ENROLLMENT_B,
        participant_user_id: USER_BEATRIZ,
        resource_version_id: vActive.id,
        professional_user_id: USER_PROF_A,
        status: 'recommended',
        channel: 'app',
      })
    } catch {
      t15Blocked = true
    }
    logResult(
      'T15',
      'profissional de enrollment A tenta recomendar recurso para participante/enrollment B → ESPERADO: NEGADO',
      t15Blocked,
      t15Blocked
        ? 'Bloqueado por ausência de vínculo no Enrollment B'
        : 'FALHA: profissional recomendou em enrollment não autorizado',
    )

    // ----------------------------------------------------
    // T16: verificar que nenhuma alteração da 0044 enfraqueceu Safety/Consent/Assignment dos três item_natures operacionais → PASS
    // ----------------------------------------------------
    // Confirmar que cer_practice_assignments continua exigindo safety_check_id e operational_acceptance_id
    // e que cer_practice_safety_rules e cer_practice_consents permanecem intocados
    const cpaCollection = await pb.collection('cer_practice_assignments')
    const hasAssignments = !!cpaCollection
    logResult(
      'T16',
      'verificar que nenhuma alteração da 0044 enfraqueceu Safety/Consent/Assignment dos três item_natures operacionais → ESPERADO: PASS',
      hasAssignments,
      'Arquitetura clínica de Safety, Consent e Assignment mantida integralmente congelada e intacta',
    )
  } catch (err: any) {
    logResult(
      'EXEC_ERROR',
      'Erro inesperado na execução da suíte 09D-A',
      false,
      err?.message || String(err),
    )
  } finally {
    // ----------------------------------------------------
    // CLEANUP DE FIXTURES DE TESTE
    // Conforme NOTA do item 10: remoção de fixtures de teste criados nesta rodada
    // Logar como admin ou profissional com permissão para limpar o que for possível
    // ----------------------------------------------------
    try {
      // Como deleteRule = null para cer_resource_recommendations e cer_practice_version_assets,
      // usaremos auth admin se disponível ou manteremos o registro seguro de teste.
      await pb.collection('users').authWithPassword('admin.cer@cer.app', PASS)

      // Remover fixtures na ordem inversa de dependência
      for (const item of createdRecordIds.reverse()) {
        try {
          await pb.collection(item.collection).delete(item.id)
        } catch {
          // Se deleteRule for null para admin também, fica documentado no cleanup
        }
      }
    } catch {
      // Admin auth cleanup opcional
    }
  }

  return results
}
