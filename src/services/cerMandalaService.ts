import { readDemoPracticeStore, safeDemoAssignment } from './demoPracticeFlow'
import pb from '@/lib/pocketbase/client'
import type {
  MandalaReadModel,
  CerPracticeAssignmentRecord,
  CerPracticeResponseRecord,
  CerCarePlanPriorityRecord,
  CerCareCycleRecord,
  CerCarePlanRecord,
  CerKnowledgeItemRecord,
} from '@/types/cer'
import { cerCycleReviewService } from './cerCycleReviewService'
import { demoAdapter } from './demoAdapter'

export type MandalaAudience = 'participant' | 'professional'

/** Demonstração lê registros existentes; não cria respostas nem consulta o servidor. */
export function getDemoMandalaProjection(
  enrollmentId: string,
  audience: MandalaAudience,
): MandalaReadModel {
  if (audience === 'professional' && demoAdapter.getActivePersona() !== 'daiane') {
    throw new Error('Esta leitura está disponível na visão profissional.')
  }
  const plans = demoAdapter.listPlans(enrollmentId)
  const plan = plans.find((value) => value.status === 'active') || plans[0]
  const presentation = demoAdapter
    .listPresentedForParticipant(enrollmentId)
    .find((value) => value.status === 'presented' && (!plan || value.plan_id === plan.id))
  // A interagente recebe somente o snapshot explicitamente compartilhado.
  // Títulos, descrições e fundamentos internos de prioridades não são uma devolutiva.
  const priorities =
    audience === 'professional' && plan
      ? demoAdapter
          .listPriorities(plan.id)
          .filter(
            (value) => value.status === 'active' || value.status === 'active_pending_adaptation',
          )
      : []
  const statement =
    audience === 'professional'
      ? plan?.direction_statement
      : presentation?.participant_summary || presentation?.participant_title
  const store = demoAdapter.readCareStore()
  const data = readDemoPracticeStore(store)
  const cycle = store.cycles
    .filter((c) => c.enrollment_id === enrollmentId && (!plan || c.plan_id === plan.id))
    .sort((a, b) => b.cycle_number - a.cycle_number)[0]
  const shared = data.assignments.filter(
    (a) => a.enrollment_id === enrollmentId && data.sharedAssignmentIds.includes(a.id),
  )
  const experiments = (audience === 'professional' ? data.assignments : shared)
    .filter(
      (a) =>
        a.enrollment_id === enrollmentId &&
        a.status === 'active' &&
        (!cycle || a.care_cycle_id === cycle.id),
    )
    .map(safeDemoAssignment)
  const responses = data.responses
    .filter(
      (r) =>
        r.enrollment_id === enrollmentId &&
        r.record_status === 'current' &&
        (!cycle || r.care_cycle_id === cycle.id),
    )
    .sort((a, b) => b.created.localeCompare(a.created))
  const lastCapacity = shared
    .filter((a) => a.capacity_response && (!cycle || a.care_cycle_id === cycle.id))
    .sort((a, b) =>
      (b.confirmed_at || '').localeCompare(a.confirmed_at || ''),
    )[0]?.capacity_response
  const capacitySummary = {
    cabe_bem: 'A interagente informou que o experimento cabe bem neste momento.',
    cabe_se_adaptar: 'A interagente pediu adaptações para o experimento caber.',
    parece_demais: 'A interagente informou que o experimento parece demais agora.',
    nao_cabe_agora: 'A interagente informou que o experimento não cabe agora.',
    ainda_nao_sei: 'A interagente ainda está percebendo o que cabe neste momento.',
  }
  const digest = cerCycleReviewService.generateDescriptiveDigest(responses)
  return {
    enrollment_id: enrollmentId,
    care_cycle: cycle
      ? {
          id: cycle.id,
          cycle_number: cycle.cycle_number,
          status: cycle.status,
          focus_summary: audience === 'professional' ? cycle.focus_summary : undefined,
        }
      : undefined,
    direction: statement
      ? { mode: audience === 'professional' ? plan!.direction_mode : 'contextualized', statement }
      : undefined,
    active_priorities: priorities.map((value) => ({
      id: value.id,
      title: value.title,
      description: value.description,
      is_therapeutic_priority: value.is_therapeutic_priority,
      is_possible_now: value.is_possible_now,
    })),
    active_experiments: experiments.map((a) => ({
      assignment_id: a.id,
      safe_title: a.participant_safe_title,
      safe_summary: a.participant_safe_summary,
      frequency: a.assigned_frequency,
      duration: a.assigned_duration,
      status: a.status,
    })),
    recognized_resources: [],
    current_capacity: {
      last_response: lastCapacity,
      summary: lastCapacity
        ? capacitySummary[lastCapacity]
        : 'Ainda não há capacidade registrada para os experimentos deste ciclo.',
    },
    recent_movement: {
      total_recorded_responses: responses.length,
      descriptive_digest: digest.summary_text,
      recent_responses: responses.slice(0, 5).map((r) => ({
        id: r.id,
        safe_title:
          shared.find((a) => a.id === r.assignment_id)?.participant_safe_title ||
          'Experimento de cuidado',
        response_type: r.response_type,
        date: r.created,
      })),
    },
    evolution_highlights: presentation?.practical_invitation
      ? [presentation.practical_invitation]
      : [],
  }
}

/**
 * MANDALA = READ-MODEL.
 * ZERO TABELA, ZERO QUESTIONÁRIO, ZERO SCORE, ZERO PUBLICATION GATE PRÓPRIO.
 * Objetivo: "Como o meu cuidado está se organizando e mudando?"
 * Deriva SOMENTE de dados existentes de ciclo, plano, prioridades, assignments, recursos reconhecidos,
 * capacidade percebida e respostas operacionais do participante.
 */
export const cerMandalaReadModelService = {
  async getMandalaProjection(
    enrollmentId: string,
    audience: MandalaAudience = 'participant',
  ): Promise<MandalaReadModel> {
    if (demoAdapter.isEnabled()) return getDemoMandalaProjection(enrollmentId, audience)
    // 1. Buscar plano ativo e ciclo
    let careCycle: CerCareCycleRecord | undefined
    let carePlan: CerCarePlanRecord | undefined

    try {
      const cycles = await pb.collection('cer_care_cycles').getFullList<CerCareCycleRecord>({
        filter: `enrollment_id = "${enrollmentId}" && (status = "active" || status = "paused" || status = "closed")`,
        sort: '-cycle_number',
      })
      careCycle = cycles[0]
    } catch {
      /* ignore */
    }

    try {
      const plans = await pb.collection('cer_care_plans').getFullList<CerCarePlanRecord>({
        filter: `enrollment_id = "${enrollmentId}" && status = "active"`,
        sort: '-revision_number',
      })
      carePlan = plans[0]
    } catch {
      /* ignore */
    }

    // 2. Buscar prioridades ativas
    let activePriorities: CerCarePlanPriorityRecord[] = []
    if (carePlan?.id) {
      try {
        activePriorities = await pb
          .collection('cer_care_plan_priorities')
          .getFullList<CerCarePlanPriorityRecord>({
            filter: `plan_id = "${carePlan.id}" && (status = "active" || status = "active_pending_adaptation")`,
            sort: 'order_index',
          })
      } catch {
        /* ignore */
      }
    }

    // 3. Buscar assignments ativas
    let activeAssignments: CerPracticeAssignmentRecord[] = []
    try {
      activeAssignments = await pb
        .collection('cer_practice_assignments')
        .getFullList<CerPracticeAssignmentRecord>({
          filter: `enrollment_id = "${enrollmentId}" && (status = "active" || status = "paused")`,
          sort: '-created',
        })
    } catch {
      /* ignore */
    }

    // 4. Buscar recursos reconhecidos (knowledge_items do tipo resource / recognizing)
    let recognizedResources: CerKnowledgeItemRecord[] = []
    try {
      recognizedResources = await pb
        .collection('cer_knowledge_items')
        .getFullList<CerKnowledgeItemRecord>({
          filter: `enrollment_id = "${enrollmentId}" && (knowledge_type = "resource" || status = "recognized")`,
          sort: '-created',
        })
    } catch {
      /* ignore */
    }

    // 5. Buscar respostas operacionais de prática
    let responses: CerPracticeResponseRecord[] = []
    try {
      responses = await pb
        .collection('cer_practice_responses')
        .getFullList<CerPracticeResponseRecord>({
          filter: `enrollment_id = "${enrollmentId}" && record_status = "current"`,
          sort: '-created',
          expand: 'assignment_id',
        })
    } catch {
      /* ignore */
    }

    // 6. Resumo descritivo (sem score e sem causalidade)
    const digest = cerCycleReviewService.generateDescriptiveDigest(responses)

    // 7. Capacidade percebida (última resposta do assignment)
    const lastCapacity = activeAssignments.find((a) => a.capacity_response)?.capacity_response
    let capacitySummary = 'Capacidade em calibração contínua com a rotina.'
    if (lastCapacity === 'cabe_bem') {
      capacitySummary = 'Experimentos fluindo com espaço favorável na rotina atual.'
    } else if (lastCapacity === 'cabe_se_adaptar') {
      capacitySummary = 'Demandando adaptações e flexibilidade para encaixar no momento.'
    } else if (lastCapacity === 'parece_demais') {
      capacitySummary = 'Momento com sobrecarga percebida; ritmo mais suave recomendado.'
    }

    // 8. Destaques de evolução
    const evolutionHighlights: string[] = []
    if (activePriorities.length > 0) {
      evolutionHighlights.push(
        `Foco prioritário em: ${activePriorities.map((p) => p.title).join(', ')}`,
      )
    }
    if (recognizedResources.length > 0) {
      evolutionHighlights.push(
        `${recognizedResources.length} recurso(s) de autocuidado e ancoragem reconhecido(s) na jornada`,
      )
    }
    if (responses.length > 0) {
      evolutionHighlights.push(digest.summary_text)
    }

    return {
      enrollment_id: enrollmentId,
      care_cycle: careCycle
        ? {
            id: careCycle.id,
            cycle_number: careCycle.cycle_number,
            status: careCycle.status,
            focus_summary: careCycle.focus_summary,
          }
        : undefined,
      direction: carePlan
        ? {
            mode: carePlan.direction_mode,
            statement: carePlan.direction_statement,
          }
        : undefined,
      active_priorities: activePriorities.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        is_therapeutic_priority: p.is_therapeutic_priority,
        is_possible_now: p.is_possible_now,
      })),
      active_experiments: activeAssignments.map((a) => ({
        assignment_id: a.id,
        safe_title: a.participant_safe_title,
        safe_summary: a.participant_safe_summary,
        frequency: a.assigned_frequency,
        duration: a.assigned_duration,
        status: a.status,
      })),
      recognized_resources: recognizedResources.slice(0, 5).map((r) => ({
        id: r.id,
        statement: r.statement,
        concept_key: r.concept_key,
      })),
      current_capacity: {
        last_response: lastCapacity,
        summary: capacitySummary,
      },
      recent_movement: {
        total_recorded_responses: responses.length,
        descriptive_digest: digest.summary_text,
        recent_responses: responses.slice(0, 5).map((r) => ({
          id: r.id,
          safe_title:
            r.expand?.assignment_id?.participant_safe_title || 'Experimento de autocuidado',
          response_type: r.response_type,
          date: r.created,
        })),
      },
      evolution_highlights: evolutionHighlights,
    }
  },
}
