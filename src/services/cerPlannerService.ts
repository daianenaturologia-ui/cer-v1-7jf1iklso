/**
 * Serviço do Build 08D — Minimal Planner & Operational Window Projection
 * Projeta ocorrências na janela corrente, preserva histórico imutável, gerencia timezone e contextual resources.
 */

import { pb } from '@/lib/pocketbase/client'
import type {
  CerPlannerItemRecord,
  PlannerItemType,
  PlannerSchedulingMode,
  PlannerDaypart,
  PlannerItemStatus,
} from '@/types/cer'

export interface CreatePlannerItemInput {
  assignment_id: string
  enrollment_id: string
  participant_user_id: string
  care_cycle_id: string
  safe_title: string
  safe_summary?: string
  item_type: PlannerItemType
  scheduling_mode: PlannerSchedulingMode
  scheduled_at?: string
  window_start?: string
  window_end?: string
  daypart?: PlannerDaypart
  timezone_snapshot?: string
  status?: PlannerItemStatus
  created_by: string
}

export interface ReschedulePlannerItemInput {
  scheduled_at?: string
  window_start?: string
  window_end?: string
  daypart?: PlannerDaypart
}

export const cerPlannerService = {
  /**
   * Listar itens do planner por enrollment
   */
  async listByEnrollment(enrollmentId: string): Promise<CerPlannerItemRecord[]> {
    return await pb.collection('cer_planner_items').getFullList<CerPlannerItemRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      sort: 'scheduled_at,created',
      expand: 'assignment_id,care_cycle_id,created_by',
    })
  },

  /**
   * Listar itens do planner para a visão do participante (apenas safe metadata)
   */
  async listForParticipant(
    enrollmentId: string,
    participantUserId: string,
  ): Promise<CerPlannerItemRecord[]> {
    return await pb.collection('cer_planner_items').getFullList<CerPlannerItemRecord>({
      filter: `enrollment_id = "${enrollmentId}" && participant_user_id = "${participantUserId}"`,
      sort: 'scheduled_at,created',
      expand: 'assignment_id',
    })
  },

  /**
   * Criar item no planner
   */
  async createItem(input: CreatePlannerItemInput): Promise<CerPlannerItemRecord> {
    const payload = {
      ...input,
      status: input.status || 'planned',
    }
    return await pb.collection('cer_planner_items').create<CerPlannerItemRecord>(payload)
  },

  /**
   * Reagendar item (reschedule temporal sem criar novo status)
   * O hook do servidor gera o evento audit PLANNER_ITEM_RESCHEDULED.
   */
  async rescheduleItem(
    id: string,
    input: ReschedulePlannerItemInput,
  ): Promise<CerPlannerItemRecord> {
    return await pb.collection('cer_planner_items').update<CerPlannerItemRecord>(id, input)
  },

  /**
   * Marcar item como concluído (completed)
   * Apenas reflete a ocorrência conforme registro (não adesão/score).
   */
  async completeItem(id: string): Promise<CerPlannerItemRecord> {
    return await pb.collection('cer_planner_items').update<CerPlannerItemRecord>(id, {
      status: 'completed',
    })
  },

  /**
   * Cancelar item individual futuro
   */
  async cancelItem(id: string): Promise<CerPlannerItemRecord> {
    return await pb.collection('cer_planner_items').update<CerPlannerItemRecord>(id, {
      status: 'cancelled',
    })
  },

  /**
   * Algoritmo determinístico simples de projeção da Janela Operacional Corrente
   * Projeta de 1 a 3 próximas ocorrências OU disponibiliza recurso contextual;
   * NUNCA materializa antecipadamente todas as ocorrências do ciclo;
   * Preserva itens concluídos/históricos.
   */
  async projectOperationalWindow(params: {
    assignmentId: string
    enrollmentId: string
    participantUserId: string
    careCycleId: string
    safeTitle: string
    safeSummary?: string
    assignedFrequency?: string // ex: 'daily', 'twice_a_week', 'as_needed'
    daypart?: PlannerDaypart
    timezone: string
    userId: string
    windowDays?: number // default ~7 dias da janela operacional
  }): Promise<CerPlannerItemRecord[]> {
    const {
      assignmentId,
      enrollmentId,
      participantUserId,
      careCycleId,
      safeTitle,
      safeSummary,
      assignedFrequency = 'daily',
      daypart = 'morning',
      timezone,
      userId,
      windowDays = 7,
    } = params

    // Se a frequência for 'as_needed' ou recurso de suporte, projeta como contextual_resource único
    if (assignedFrequency === 'as_needed' || assignedFrequency === 'contextual') {
      const existing = await pb.collection('cer_planner_items').getFullList<CerPlannerItemRecord>({
        filter: `assignment_id = "${assignmentId}" && item_type = "contextual_resource" && (status = "planned" || status = "active")`,
      })
      if (existing.length > 0) {
        return existing
      }
      const item = await this.createItem({
        assignment_id: assignmentId,
        enrollment_id: enrollmentId,
        participant_user_id: participantUserId,
        care_cycle_id: careCycleId,
        safe_title: safeTitle,
        safe_summary: safeSummary || 'Recurso disponível para quando você precisar.',
        item_type: 'contextual_resource',
        scheduling_mode: 'contextual',
        daypart: 'any',
        timezone_snapshot: timezone,
        status: 'active',
        created_by: userId,
      })
      return [item]
    }

    // Para práticas com ritmo/frequência, projetar apenas para os próximos N dias
    // (ex: até 3 ocorrências futuras projetadas, evitando sobrecarga e materialização antecipada)
    const existingFuture = await pb
      .collection('cer_planner_items')
      .getFullList<CerPlannerItemRecord>({
        filter: `assignment_id = "${assignmentId}" && (status = "planned" || status = "active")`,
        sort: 'scheduled_at',
      })

    if (existingFuture.length >= 3) {
      return existingFuture
    }

    const itemsNeeded = 3 - existingFuture.length
    const created: CerPlannerItemRecord[] = []
    const baseDate = new Date()

    for (let i = 1; i <= itemsNeeded; i++) {
      const scheduledDate = new Date(baseDate)
      scheduledDate.setDate(baseDate.getDate() + (existingFuture.length + i))

      const item = await this.createItem({
        assignment_id: assignmentId,
        enrollment_id: enrollmentId,
        participant_user_id: participantUserId,
        care_cycle_id: careCycleId,
        safe_title: safeTitle,
        safe_summary: safeSummary,
        item_type: 'scheduled_action',
        scheduling_mode: 'window',
        scheduled_at: scheduledDate.toISOString(),
        daypart: daypart,
        timezone_snapshot: timezone,
        status: 'planned',
        created_by: userId,
      })
      created.push(item)
    }

    return [...existingFuture, ...created]
  },
}
