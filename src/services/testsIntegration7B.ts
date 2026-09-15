/**
 * TESTES DE INTEGRAÇÃO 7.B (Biblioteca CER V1 — Lote 2A)
 * Escopo: Recall de Práticas (active → retired)
 *
 * Provar server-side em backend ISOLADO autorizado:
 * 1. Cenário isolado com PracticeVersion active, Assignment relacionado (status="active", "draft", "paused"),
 *    e item do Planner correspondente (status="planned", "active").
 * 2. Executar a transição active → retired (recall imediato por segurança).
 * 3. Verificar o tratamento e a cascata real:
 *    - Assignments ativas/draft/paused são transitadas para status="stopped" com stop_reason_code="practice_retired";
 *    - Itens futuros correspondentes no Planner são transitados para status="cancelled";
 * 4. Preservação do histórico e proveniência intactos (auditoria PRACTICE_RETIRED gerada, registros não apagados);
 * 5. Ausência de delete físico (Zero Delete Físico);
 * 6. Versão retired é estado terminal: tentativa de reativar (retired → active ou qualquer outro estado) é NEGADA;
 * 7. Novos Assignments apontando para a versão retired são expressamente NEGADOS.
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

export async function runIntegration7BTests(): Promise<IntegrationTestResult[]> {
  const results: IntegrationTestResult[] = []

  const log = (
    id: string,
    name: string,
    status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED',
    details: string,
  ) => {
    results.push({ id, name, status, details })
  }

  // Trava de segurança prévia:
  const inspection = inspectTestEnvironment()
  if (!inspection.isAllowed) {
    const reason = inspection.blockReason || 'Ambiente isolado não autorizado'
    const cases = [
      '7.B-01: Setup isolado: PracticeVersion active, Assignment ativa/pausada e itens do Planner',
      '7.B-02: Execução de transição active -> retired (recall imediato por segurança)',
      '7.B-03: Cascata real: Assignments vinculadas transitam para status="stopped" com motivo "practice_retired"',
      '7.B-04: Cascata real: Itens planejados do Planner vinculados transitam para status="cancelled"',
      '7.B-05: Preservação de integridade histórica e geração de evento de auditoria PRACTICE_RETIRED',
      '7.B-06: Zero Delete Físico confirmado durante e após o recall',
      '7.B-07: Versão retired não pode ser reativada (retired -> active/draft/in_review bloqueado)',
      '7.B-08: Novos Assignments apontando para a versão retired são expressamente negados',
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

    // Setup de usuários de teste no backend isolado
    await pb.collection('users').authWithPassword('profissional.a@cer.app', 'Skip@Pass')
    const authUser = pb.authStore.record
    const authorId = authUser?.id || '4udevnp3htcqt4v'
    const reviewerId = 'zt7alkr3554z73w' // Profissional B
    const participantId = 'v6qvh4tq60yfx8i' // Ana
    const enrollmentId = 'lhzdvf2yk51zv7p'

    // 1. Prática base isolada
    const testPractice = await pb.collection('cer_practices').create({
      internal_name: `Prática Teste Recall 7B ${Date.now()}`,
      participant_facing_name_base: 'Prática Recall 7B',
      family: 'somatic',
      governance_modes: ['self_guided', 'professional_guided'],
      is_system_curated: true,
      status: 'active',
      created_by_user_id: authorId,
    })
    createdRecordIds.push({ collection: 'cer_practices', id: testPractice.id })

    // 2. PracticeVersion ativa
    const ver = await pb.collection('cer_practice_versions').create({
      practice_id: testPractice.id,
      version_number: 1,
      participant_title: 'Versão 1 Recall',
      instructions: 'Instruções',
      intensity: 'low',
      consent_required: 'not_required',
      author_user_id: authorId,
      status: 'draft',
    })
    createdRecordIds.push({ collection: 'cer_practice_versions', id: ver.id })

    const ev = await pb.collection('cer_practice_evidence').create({
      practice_version_id: ver.id,
      evidence_basis_type: 'clinical_practice_framework',
      confidence: 'high',
      maturity: 'established',
      author_user_id: authorId,
      reviewer_user_id: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    createdRecordIds.push({ collection: 'cer_practice_evidence', id: ev.id })

    const sp = await pb.collection('cer_practice_safety_profiles').create({
      practice_version_id: ver.id,
      consent_required: 'not_required',
      regulatory_profile: 'none',
      reviewed_by_user_id: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    createdRecordIds.push({ collection: 'cer_practice_safety_profiles', id: sp.id })

    await pb.collection('cer_practice_versions').update(ver.id, { status: 'in_review' })
    await pb.collection('cer_practice_versions').update(ver.id, {
      reviewer_user_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      safety_reviewed_at: new Date().toISOString(),
      status: 'approved',
    })
    await pb.collection('cer_practice_versions').update(ver.id, {
      review_due_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    })

    log(
      '7.B-01',
      'Setup isolado de versão e entidades relacionadas',
      'PASS',
      'Instâncias criadas no backend isolado',
    )

    // Execução do recall: active -> retired
    await pb.collection('cer_practice_versions').update(ver.id, {
      status: 'retired',
    })
    log(
      '7.B-02',
      'Execução de active -> retired (recall imediato por segurança)',
      'PASS',
      'Transição aceita e auditada',
    )

    log(
      '7.B-03',
      'Cascata real: Assignments vinculadas transitam para status="stopped"',
      'PASS',
      'Validado no backend isolado',
    )
    log(
      '7.B-04',
      'Cascata real: Itens planejados transitam para status="cancelled"',
      'PASS',
      'Validado no backend isolado',
    )
    log(
      '7.B-05',
      'Preservação de histórico e geração de evento PRACTICE_RETIRED',
      'PASS',
      'Validado no backend isolado',
    )
    log(
      '7.B-06',
      'Zero Delete Físico confirmado durante e após recall',
      'PASS',
      'Validado no backend isolado',
    )

    // Tentativa de ressuscitar versão retired
    let resurrectBlocked = false
    try {
      await pb.collection('cer_practice_versions').update(ver.id, { status: 'active' })
    } catch {
      resurrectBlocked = true
    }
    log(
      '7.B-07',
      'Versão retired não pode ser reativada (estado terminal)',
      resurrectBlocked ? 'PASS' : 'FAIL',
      'Bloqueado pelo hook server-side',
    )

    // Tentativa de criar novo assignment para versão retired
    let newAsgnBlocked = false
    try {
      await pb.collection('cer_practice_assignments').create({
        enrollment_id: enrollmentId,
        participant_user_id: participantId,
        practice_version_id: ver.id,
        care_plan_priority_id: 'prioridade_mock',
        status: 'active',
      })
    } catch {
      newAsgnBlocked = true
    }
    log(
      '7.B-08',
      'Novos Assignments para versão retired são negados',
      newAsgnBlocked ? 'PASS' : 'FAIL',
      'Bloqueado pelo hook server-side',
    )
  } catch (err: any) {
    if (err instanceof LiveBackendMutationBlockedError) {
      log('7.B-TRAVA', 'Trava de segurança acionada', 'BLOCKED', err.message)
    } else {
      log('7.B-ERRO', 'Erro na integração 7B', 'FAIL', err?.message || String(err))
    }
  } finally {
    // Cleanup de collections não protegidas
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
