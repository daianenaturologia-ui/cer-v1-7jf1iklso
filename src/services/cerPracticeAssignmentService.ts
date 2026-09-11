/**
 * Serviço do Build 08D — Practice Assignment & Lifecycle Control
 * Ancoragem estrita, verificação de gates, dose/bounds e confirmação.
 */

import pb from '@/lib/pocketbase/client'
import type {
  CerPracticeAssignmentRecord,
  PracticeAssignmentStatus,
  ParticipantConfirmationResponse,
  CapacityResponseValue,
} from '@/types/cer'

export interface CreateAssignmentInput {
  enrollment_id: string
  participant_user_id: string
  care_plan_priority_id: string
  care_cycle_id: string
  practice_version_id: string
  variant_id?: string
  safety_check_id: string
  consent_id?: string
  operational_acceptance_id: string
  assigned_by_user_id: string
  previous_assignment_id?: string
  status?: PracticeAssignmentStatus
  internal_title: string
  internal_context?: string
  participant_safe_title: string
  participant_safe_summary?: string
  assigned_duration?: string
  assigned_frequency?: string
  assigned_repetitions?: string
  assigned_quantity?: string
  assigned_time_window?: string
  context_tags?: string[]
}

export interface MaterialAdaptationInput {
  previous_assignment_id: string
  care_plan_priority_id?: string
  care_cycle_id?: string
  practice_version_id?: string
  variant_id?: string
  safety_check_id?: string
  consent_id?: string
  operational_acceptance_id?: string
  assigned_by_user_id: string
  internal_title: string
  internal_context?: string
  participant_safe_title: string
  participant_safe_summary?: string
  assigned_duration?: string
  assigned_frequency?: string
  assigned_repetitions?: string
  assigned_quantity?: string
  assigned_time_window?: string
  context_tags?: string[]
  reason?: string
}

export interface ConfirmAssignmentInput {
  participant_response_type: ParticipantConfirmationResponse
  capacity_response?: CapacityResponseValue
}

export const cerPracticeAssignmentService = {
  /**
   * Listar assignments por enrollment
   */
  async listByEnrollment(enrollmentId: string): Promise<CerPracticeAssignmentRecord[]> {
    return await pb
      .collection('cer_practice_assignments')
      .getFullList<CerPracticeAssignmentRecord>({
        filter: `enrollment_id = "${enrollmentId}"`,
        sort: '-created',
        expand:
          'practice_version_id,variant_id,care_plan_priority_id,care_cycle_id,safety_check_id,consent_id,operational_acceptance_id,assigned_by_user_id',
      })
  },

  /**
   * Obter assignment por ID
   */
  async getById(id: string): Promise<CerPracticeAssignmentRecord> {
    return await pb.collection('cer_practice_assignments').getOne<CerPracticeAssignmentRecord>(id, {
      expand:
        'practice_version_id,variant_id,care_plan_priority_id,care_cycle_id,safety_check_id,consent_id,operational_acceptance_id,assigned_by_user_id',
    })
  },

  /**
   * Criar novo Assignment (draft ou active)
   */
  async createAssignment(input: CreateAssignmentInput): Promise<CerPracticeAssignmentRecord> {
    const payload = {
      ...input,
      status: input.status || 'draft',
      participant_response_type: 'unconfirmed',
    }
    return await pb
      .collection('cer_practice_assignments')
      .create<CerPracticeAssignmentRecord>(payload)
  },

  /**
   * Ativar Assignment (passa pelos 4 gates de validação no hook do servidor)
   */
  async activateAssignment(id: string): Promise<CerPracticeAssignmentRecord> {
    return await pb.collection('cer_practice_assignments').update<CerPracticeAssignmentRecord>(id, {
      status: 'active',
    })
  },

  /**
   * Pausar Assignment
   */
  async pauseAssignment(id: string): Promise<CerPracticeAssignmentRecord> {
    return await pb.collection('cer_practice_assignments').update<CerPracticeAssignmentRecord>(id, {
      status: 'paused',
    })
  },

  /**
   * Retomar Assignment (resume de paused para active)
   */
  async resumeAssignment(id: string): Promise<CerPracticeAssignmentRecord> {
    return await pb.collection('cer_practice_assignments').update<CerPracticeAssignmentRecord>(id, {
      status: 'active',
    })
  },

  /**
   * Interromper Assignment antes do planejado (stopped)
   */
  async stopAssignment(id: string, stopReasonCode: string): Promise<CerPracticeAssignmentRecord> {
    return await pb.collection('cer_practice_assignments').update<CerPracticeAssignmentRecord>(id, {
      status: 'stopped',
      stop_reason_code: stopReasonCode,
    })
  },

  /**
   * Concluir Assignment explicitamente (completed)
   * NUNCA inferir completion por fim de ciclo.
   */
  async completeAssignment(id: string): Promise<CerPracticeAssignmentRecord> {
    return await pb.collection('cer_practice_assignments').update<CerPracticeAssignmentRecord>(id, {
      status: 'completed',
    })
  },

  /**
   * Confirmação / Feedback do participante no experimento
   */
  async recordConfirmation(
    id: string,
    input: ConfirmAssignmentInput,
  ): Promise<CerPracticeAssignmentRecord> {
    return await pb.collection('cer_practice_assignments').update<CerPracticeAssignmentRecord>(id, {
      participant_response_type: input.participant_response_type,
      capacity_response: input.capacity_response,
      confirmed_at: new Date().toISOString(),
    })
  },

  /**
   * Adaptação Material: Dose/Variante/Contexto
   * Gera uma NOVA linha de Assignment com previous_assignment_id;
   * O hook do servidor automaticamente marca a anterior como 'superseded'.
   */
  async adaptMaterially(input: MaterialAdaptationInput): Promise<CerPracticeAssignmentRecord> {
    const prev = await this.getById(input.previous_assignment_id)
    const payload: Partial<CerPracticeAssignmentRecord> = {
      enrollment_id: prev.enrollment_id,
      participant_user_id: prev.participant_user_id,
      care_plan_priority_id: input.care_plan_priority_id || prev.care_plan_priority_id,
      care_cycle_id: input.care_cycle_id || prev.care_cycle_id,
      practice_version_id: input.practice_version_id || prev.practice_version_id,
      variant_id: input.variant_id !== undefined ? input.variant_id : prev.variant_id,
      safety_check_id: input.safety_check_id || prev.safety_check_id,
      consent_id: input.consent_id !== undefined ? input.consent_id : prev.consent_id,
      operational_acceptance_id: input.operational_acceptance_id || prev.operational_acceptance_id,
      assigned_by_user_id: input.assigned_by_user_id,
      previous_assignment_id: prev.id,
      status: 'draft',
      internal_title: input.internal_title,
      internal_context: input.internal_context || prev.internal_context,
      participant_safe_title: input.participant_safe_title,
      participant_safe_summary: input.participant_safe_summary || prev.participant_safe_summary,
      assigned_duration: input.assigned_duration || prev.assigned_duration,
      assigned_frequency: input.assigned_frequency || prev.assigned_frequency,
      assigned_repetitions: input.assigned_repetitions || prev.assigned_repetitions,
      assigned_quantity: input.assigned_quantity || prev.assigned_quantity,
      assigned_time_window: input.assigned_time_window || prev.assigned_time_window,
      context_tags: input.context_tags || prev.context_tags,
      participant_response_type: 'unconfirmed',
    }

    return await pb
      .collection('cer_practice_assignments')
      .create<CerPracticeAssignmentRecord>(payload)
  },

  /**
   * Carry-forward explícito para novo ciclo de cuidado
   * NUNCA move a assignment antiga nem faz silent copy.
   */
  async carryForwardToNewCycle(
    previousAssignmentId: string,
    newCycleId: string,
    newPriorityId: string,
    assignedByUserId: string,
  ): Promise<CerPracticeAssignmentRecord> {
    const prev = await this.getById(previousAssignmentId)
    const payload = {
      enrollment_id: prev.enrollment_id,
      participant_user_id: prev.participant_user_id,
      care_plan_priority_id: newPriorityId,
      care_cycle_id: newCycleId,
      practice_version_id: prev.practice_version_id,
      variant_id: prev.variant_id,
      safety_check_id: prev.safety_check_id,
      consent_id: prev.consent_id,
      operational_acceptance_id: prev.operational_acceptance_id,
      assigned_by_user_id: assignedByUserId,
      previous_assignment_id: prev.id,
      status: 'draft',
      internal_title: prev.internal_title,
      internal_context: prev.internal_context,
      participant_safe_title: prev.participant_safe_title,
      participant_safe_summary: prev.participant_safe_summary,
      assigned_duration: prev.assigned_duration,
      assigned_frequency: prev.assigned_frequency,
      assigned_repetitions: prev.assigned_repetitions,
      assigned_quantity: prev.assigned_quantity,
      assigned_time_window: prev.assigned_time_window,
      context_tags: prev.context_tags,
      participant_response_type: 'unconfirmed',
    }

    return await pb
      .collection('cer_practice_assignments')
      .create<CerPracticeAssignmentRecord>(payload)
  },
}
