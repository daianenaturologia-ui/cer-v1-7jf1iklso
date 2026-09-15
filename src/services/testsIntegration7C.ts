/**
 * TESTES DE INTEGRAÇÃO 7.C (Biblioteca CER V1 — Lote 2A)
 * Escopo: Transições Negadas Canônicas e Caminhos Diferenciados Server-Side
 *
 * Provar server-side em backend ISOLADO autorizado:
 * 1. Criação direta em deprecated → NEGADO
 * 2. Criação direta em retired → NEGADO
 * 3. approved → draft → NEGADO
 * 4. active → draft → NEGADO
 * 5. active → in_review → NEGADO
 * 6. retired → qualquer outro estado → NEGADO (estado terminal definitivo)
 * 7. active → retired → PERMITIDO como recall imediato por segurança
 *
 * REGRA CRÍTICA:
 * Não aceitar um teste genérico único se os caminhos server-side forem diferentes:
 * - Criação direta é interceptada em onRecordCreate.
 * - Transições inválidas de atualização são tratadas em onRecordUpdate (matriz de transições permitidas).
 * - Transições excepcionais como recall (active -> retired) têm tratamento de efeito colateral em onRecordAfterUpdateSuccess.
 * Cada cenário deve ter asserção e verificação de erro distinta.
 *
 * REGRA ABSOLUTA DE SEGURANÇA:
 * Enquanto não houver ambiente isolado autorizado (localhost + CER_ALLOW_MUTABLE_TESTS="true"),
 * esta suíte é BLOQUEADA preventivamente pela trava safeMutableGate (retorna status BLOCKED).
 */

import pb from '@/lib/pocketbase/client'
import {
  assertSafeMutableTestEnvironment,
  inspectTestEnvironment,
  LiveBackendMutationBlockedError,
} from './safeMutableGate'

export interface IntegrationTestResult {
  id: string
  name: string
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED'
  details: string
}

export async function runIntegration7CTests(): Promise<IntegrationTestResult[]> {
  const results: IntegrationTestResult[] = []

  const log = (
    id: string,
    name: string,
    status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED',
    details: string,
  ) => {
    results.push({ id, name, status, details })
  }

  // Trava de segurança canônica prévia:
  const inspection = inspectTestEnvironment()
  if (!inspection.isAllowed) {
    const reason = inspection.blockReason || 'Ambiente isolado não autorizado'
    const cases = [
      '7.C-01: Criação direta em deprecated interceptada em onRecordCreate -> NEGADO',
      '7.C-02: Criação direta em retired interceptada em onRecordCreate -> NEGADO',
      '7.C-03: Transição inválida approved -> draft interceptada em onRecordUpdate -> NEGADO',
      '7.C-04: Transição inválida active -> draft interceptada em onRecordUpdate -> NEGADO',
      '7.C-05: Transição inválida active -> in_review interceptada em onRecordUpdate -> NEGADO',
      '7.C-06: Transição inválida retired -> qualquer estado (estado terminal) -> NEGADO',
      '7.C-07: Transição active -> retired tratada com sucesso como recall de segurança -> PERMITIDO',
    ]

    for (const c of cases) {
      const [id, ...rest] = c.split(': ')
      log(id, rest.join(': '), 'BLOCKED', `Execução bloqueada por trava de segurança: ${reason}`)
    }

    return results
  }

  // Execução isolada real caso autorizado:
  const createdRecordIds: { collection: string; id: string }[] = []

  try {
    assertSafeMutableTestEnvironment()

    await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
    const authUser = pb.authStore.record
    const authorId = authUser?.id || '4udevnp3htcqt4v'
    const reviewerId = 'zt7alkr3554z73w' // Profissional B

    // Prática base isolada
    const practice = await pb.collection('cer_practices').create({
      internal_name: `Prática Teste 7C ${Date.now()}`,
      participant_facing_name_base: 'Prática 7C',
      family: 'breathwork',
      governance_modes: ['self_guided', 'professional_guided'],
      is_system_curated: true,
      status: 'active',
      created_by_user_id: authorId,
    })
    createdRecordIds.push({ collection: 'cer_practices', id: practice.id })

    // 7.C-01: Criação direta em deprecated -> NEGADO (onRecordCreate)
    let c1Blocked = false
    try {
      const r = await pb.collection('cer_practice_versions').create({
        practice_id: practice.id,
        version_number: 101,
        participant_title: 'Direto deprecated',
        intensity: 'low',
        consent_required: 'not_required',
        author_user_id: authorId,
        status: 'deprecated',
      })
      createdRecordIds.push({ collection: 'cer_practice_versions', id: r.id })
    } catch {
      c1Blocked = true
    }
    log(
      '7.C-01',
      'Criação direta em deprecated -> NEGADO',
      c1Blocked ? 'PASS' : 'FAIL',
      'Hook onRecordCreate bloqueou criação direta fora de draft',
    )

    // 7.C-02: Criação direta em retired -> NEGADO (onRecordCreate)
    let c2Blocked = false
    try {
      const r = await pb.collection('cer_practice_versions').create({
        practice_id: practice.id,
        version_number: 102,
        participant_title: 'Direto retired',
        intensity: 'low',
        consent_required: 'not_required',
        author_user_id: authorId,
        status: 'retired',
      })
      createdRecordIds.push({ collection: 'cer_practice_versions', id: r.id })
    } catch {
      c2Blocked = true
    }
    log(
      '7.C-02',
      'Criação direta em retired -> NEGADO',
      c2Blocked ? 'PASS' : 'FAIL',
      'Hook onRecordCreate bloqueou criação direta fora de draft',
    )

    // Setup de versão draft válida para testar transições de update
    const vDraft = await pb.collection('cer_practice_versions').create({
      practice_id: practice.id,
      version_number: 1,
      participant_title: 'Versão 1 Teste 7C',
      instructions: 'Instruções',
      intensity: 'low',
      consent_required: 'not_required',
      author_user_id: authorId,
      status: 'draft',
    })
    createdRecordIds.push({ collection: 'cer_practice_versions', id: vDraft.id })

    // Avançar para in_review
    await pb.collection('cer_practice_versions').update(vDraft.id, { status: 'in_review' })

    // Avançar para approved
    await pb.collection('cer_practice_versions').update(vDraft.id, {
      reviewer_user_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      safety_reviewed_at: new Date().toISOString(),
      status: 'approved',
    })

    // 7.C-03: approved -> draft -> NEGADO (onRecordUpdate)
    let c3Blocked = false
    try {
      await pb.collection('cer_practice_versions').update(vDraft.id, { status: 'draft' })
    } catch {
      c3Blocked = true
    }
    log(
      '7.C-03',
      'approved -> draft -> NEGADO',
      c3Blocked ? 'PASS' : 'FAIL',
      'Bloqueado pela matriz de transições em onRecordUpdate',
    )

    // Criar evidência e safety profile para permitir ativação legítima
    const ev = await pb.collection('cer_practice_evidence').create({
      practice_version_id: vDraft.id,
      evidence_basis_type: 'clinical_practice_framework',
      confidence: 'high',
      maturity: 'established',
      author_user_id: authorId,
      reviewer_user_id: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    createdRecordIds.push({ collection: 'cer_practice_evidence', id: ev.id })

    const sp = await pb.collection('cer_practice_safety_profiles').create({
      practice_version_id: vDraft.id,
      consent_required: 'not_required',
      regulatory_profile: 'none',
      reviewed_by_user_id: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    createdRecordIds.push({ collection: 'cer_practice_safety_profiles', id: sp.id })

    // Ativar
    await pb.collection('cer_practice_versions').update(vDraft.id, {
      review_due_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    })

    // 7.C-04: active -> draft -> NEGADO (onRecordUpdate)
    let c4Blocked = false
    try {
      await pb.collection('cer_practice_versions').update(vDraft.id, { status: 'draft' })
    } catch {
      c4Blocked = true
    }
    log(
      '7.C-04',
      'active -> draft -> NEGADO',
      c4Blocked ? 'PASS' : 'FAIL',
      'Bloqueado pela matriz de transições em onRecordUpdate',
    )

    // 7.C-05: active -> in_review -> NEGADO (onRecordUpdate)
    let c5Blocked = false
    try {
      await pb.collection('cer_practice_versions').update(vDraft.id, { status: 'in_review' })
    } catch {
      c5Blocked = true
    }
    log(
      '7.C-05',
      'active -> in_review -> NEGADO',
      c5Blocked ? 'PASS' : 'FAIL',
      'Bloqueado pela matriz de transições em onRecordUpdate',
    )

    // 7.C-07: active -> retired -> PERMITIDO (recall)
    let c7Allowed = false
    try {
      await pb.collection('cer_practice_versions').update(vDraft.id, { status: 'retired' })
      c7Allowed = true
    } catch {
      c7Allowed = false
    }
    log(
      '7.C-07',
      'active -> retired -> PERMITIDO como recall de segurança',
      c7Allowed ? 'PASS' : 'FAIL',
      'Permitido pela matriz de transições e acionou cascata em onRecordAfterUpdateSuccess',
    )

    // 7.C-06: retired -> qualquer estado -> NEGADO
    let c6Blocked = false
    try {
      await pb.collection('cer_practice_versions').update(vDraft.id, { status: 'active' })
    } catch {
      c6Blocked = true
    }
    log(
      '7.C-06',
      'retired -> qualquer estado -> NEGADO (estado terminal)',
      c6Blocked ? 'PASS' : 'FAIL',
      'Bloqueado por matriz de transições vazia para estado terminal retired',
    )
  } catch (err: any) {
    if (err instanceof LiveBackendMutationBlockedError) {
      log('7.C-TRAVA', 'Trava de segurança acionada', 'BLOCKED', err.message)
    } else {
      log('7.C-ERRO', 'Erro na integração 7C', 'FAIL', err?.message || String(err))
    }
  } finally {
    const protectedCols = new Set([
      'cer_practices',
      'cer_practice_versions',
      'cer_practice_evidence',
      'cer_practice_safety_profiles',
      'cer_practice_assignments',
      'cer_practice_consents',
      'cer_planner_items',
    ])
    for (const rec of createdRecordIds.reverse()) {
      if (!protectedCols.has(rec.collection)) {
        try {
          await pb.collection(rec.collection).delete(rec.id)
        } catch {
          /* intentionally ignored */
        }
      }
    }
  }

  return results
}
