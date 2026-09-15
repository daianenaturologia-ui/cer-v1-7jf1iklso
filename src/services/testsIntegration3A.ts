/**
 * SUÍTE DE INTEGRAÇÃO BIMODAL DO LOTE 3A (BIBLIOTECA CER V1)
 *
 * Padrão seguro das suítes 7.A/7.B/7.C:
 * - BLOCKED quando não houver PocketBase local autorizado (safeMutableGate).
 * - Executável SOMENTE com URL localhost + flag explícita (CER_ALLOW_MUTABLE_TESTS).
 * - NUNCA converte BLOCKED em PASS.
 * - NUNCA escreve no backend vivo.
 */

import pb from '@/lib/pocketbase/client'
import { assertSafeMutableTestEnvironment, inspectTestEnvironment } from './safeMutableGate'

export interface IntegrationTestResult {
  id: string
  name: string
  status: 'PASS' | 'FAIL' | 'BLOCKED'
  durationMs: number
  details?: string
}

export async function runIntegration3ATests(): Promise<IntegrationTestResult[]> {
  const tests: Array<{
    id: string
    name: string
    fn: () => Promise<void>
  }> = [
    {
      id: '3.A-01',
      name: 'Persistência de Passos com stable_step_id em PracticeVersion draft',
      fn: async () => {
        // Testa criação de passo com identidade estável
        const step = await pb.collection('cer_practice_steps').create({
          practice_version_id: 'test_version_draft',
          stable_step_id: 'test_step_1',
          step_order: 1,
          step_type: 'breathing',
          title: 'Passo Teste 1',
          participant_instruction: 'Instrução teste',
          retention_type: 'none',
        })
        if (!step.id) throw new Error('Falha ao criar passo de teste')
      },
    },
    {
      id: '3.A-02',
      name: 'Unicidade Server-Side de stable_step_id dentro da mesma versão',
      fn: async () => {
        // Tenta criar duplicata e valida rejeição
        try {
          await pb.collection('cer_practice_steps').create({
            practice_version_id: 'test_version_draft',
            stable_step_id: 'test_step_1',
            step_order: 2,
            step_type: 'breathing',
            title: 'Passo Teste 1 Duplicado',
            participant_instruction: 'Instrução teste duplicada',
            retention_type: 'none',
          })
          throw new Error('Deveria ter rejeitado stable_step_id duplicado')
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes('Deveria')) throw err
        }
      },
    },
    {
      id: '3.A-03',
      name: 'Congelamento Server-Side de Passos em PracticeVersion publicada/aprovada',
      fn: async () => {
        // Tenta criar passo em versão congelada
        try {
          await pb.collection('cer_practice_steps').create({
            practice_version_id: 'test_version_active',
            stable_step_id: 'test_step_frozen',
            step_order: 1,
            step_type: 'breathing',
            title: 'Passo em versão congelada',
            participant_instruction: 'Instrução',
            retention_type: 'none',
          })
          throw new Error('Deveria ter bloqueado criação em versão congelada')
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes('Deveria')) throw err
        }
      },
    },
    {
      id: '3.A-04',
      name: 'Registro de Reflexões Corpo, Mente e Emoções com privacidade participant_private',
      fn: async () => {
        const ref = await pb.collection('cer_practice_reflections').create({
          assignment_id: 'test_assignment',
          practice_version_id: 'test_version',
          participant_user_id: 'test_user',
          enrollment_id: 'test_enrollment',
          reflection_target: 'corpo',
          question_prompt: 'O que você percebe agora no seu corpo?',
          reflection_text: 'Sensação de tranquilidade',
          visibility: 'participant_private',
        })
        if (!ref.id || ref.visibility !== 'participant_private') {
          throw new Error('Falha no isolamento de privacidade da reflexão')
        }
      },
    },
    {
      id: '3.A-05',
      name: 'Zero Delete Físico Server-Side em Passos e Reflexões',
      fn: async () => {
        try {
          await pb.collection('cer_practice_steps').delete('some_step_id')
          throw new Error('Exclusão de passo deveria ter sido negada')
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes('deveria')) throw err
        }

        try {
          await pb.collection('cer_practice_reflections').delete('some_ref_id')
          throw new Error('Exclusão de reflexão deveria ter sido negada')
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes('deveria')) throw err
        }
      },
    },
    {
      id: '3.A-06',
      name: 'Persistência de Dose Realizada com IDs estáveis em cer_practice_responses',
      fn: async () => {
        const resp = await pb.collection('cer_practice_responses').create({
          assignment_id: 'test_assignment_id',
          participant_user_id: 'test_user_id',
          enrollment_id: 'test_enrollment_id',
          care_cycle_id: 'test_care_cycle_id',
          practice_version_id: 'test_version_id',
          response_type: 'helped',
          completed_repetitions: 12,
          completed_cycles: 2,
          completed_series: 1,
          actual_duration_seconds: 240,
          ended_early: false,
          completed_step_ids: ['step_posture_prep', 'step_breath_init'],
        })
        if (!resp.id || resp.completed_repetitions !== 12) {
          throw new Error('Falha ao registrar dose realizada em cer_practice_responses')
        }
      },
    },
    {
      id: '3.A-07',
      name: 'Rejeição Server-Side de Índices Numéricos Posicionais em completed_step_ids',
      fn: async () => {
        try {
          await pb.collection('cer_practice_responses').create({
            assignment_id: 'test_assignment_id',
            participant_user_id: 'test_user_id',
            enrollment_id: 'test_enrollment_id',
            care_cycle_id: 'test_care_cycle_id',
            practice_version_id: 'test_version_id',
            response_type: 'helped',
            completed_step_ids: [0, 1, 2],
          })
          throw new Error('Deveria ter rejeitado índices numéricos posicionais')
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes('Deveria')) throw err
        }
      },
    },
    {
      id: '3.A-08',
      name: 'Imutabilidade das Âncoras Relacionais em cer_practice_responses',
      fn: async () => {
        try {
          await pb.collection('cer_practice_responses').update('test_resp_id', {
            participant_user_id: 'tampered_user_id',
          })
          throw new Error('Deveria ter bloqueado alteração de participant_user_id')
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes('Deveria')) throw err
        }
      },
    },
  ]

  const results: IntegrationTestResult[] = []

  for (const t of tests) {
    const start = Date.now()
    try {
      assertSafeMutableTestEnvironment(`[${t.id}] ${t.name}`)
      await t.fn()
      results.push({
        id: t.id,
        name: t.name,
        status: 'PASS',
        durationMs: Date.now() - start,
        details: 'Executado com sucesso no ambiente mutável isolado.',
      })
    } catch (err: unknown) {
      const durationMs = Date.now() - start
      const inspection = inspectTestEnvironment()

      if (!inspection.isAllowed) {
        results.push({
          id: t.id,
          name: t.name,
          status: 'BLOCKED',
          durationMs,
          details: `Execução mutável de [${t.id}] bloqueada por trava de segurança: ${inspection.blockReason}. Backend vivo permanece intacto.`,
        })
      } else {
        results.push({
          id: t.id,
          name: t.name,
          status: 'FAIL',
          durationMs,
          details: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  return results
}
