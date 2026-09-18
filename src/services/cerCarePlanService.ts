import pb from '@/lib/pocketbase/client'
import type {
  CerCarePlanRecord,
  CerCarePlanPriorityRecord,
  CerCarePlanPrioritySourceRecord,
  CerCarePlanPresentationRecord,
  CerCareCycleRecord,
  CerOperationalAcceptanceRecord,
  CerOperationalAcceptancePrivateNoteRecord,
  CarePlanStatus,
  CarePlanPriorityStatus,
  CarePlanPrioritySourceType,
  CarePlanPresentationStatus,
  CareCycleStatus,
  CareCycleReviewEventType,
  OperationalAcceptanceResponseType,
  CarePlanDirectionMode,
  VisibilityClass,
} from '@/types/cer'

export interface CreateCarePlanInput {
  enrollment_id: string
  direction_mode: CarePlanDirectionMode
  direction_statement?: string
  direction_source_id?: string
  professional_context?: string
  professional_rationale?: string
  created_by_user_id?: string
}

export interface ReviseCarePlanInput {
  direction_mode?: CarePlanDirectionMode
  direction_statement?: string
  direction_source_id?: string
  professional_context?: string
  professional_rationale?: string
}

export interface CreatePriorityInput {
  plan_id: string
  title: string
  description?: string
  is_therapeutic_priority?: boolean
  is_possible_now?: boolean
  order_index?: number
  professional_rationale?: string
  access_class?: VisibilityClass
  created_by_user_id?: string
}

export interface AddPrioritySourceInput {
  priority_id: string
  source_type: CarePlanPrioritySourceType
  source_id: string
  source_version_anchor?: string
  access_class?: VisibilityClass
}

export interface CreatePlanPresentationInput {
  plan_id: string
  priority_id?: string
  participant_title: string
  participant_summary?: string
  practical_invitation?: string
  channel?: 'app' | 'session'
}

export interface CreateCareCycleInput {
  plan_id: string
  planned_end_date?: string
  review_event_type?: CareCycleReviewEventType
  capacity_context_ref?: string
  focus_summary?: string
  professional_notes?: string
}

export interface RecordAcceptanceInput {
  presentation_id: string
  response_type: OperationalAcceptanceResponseType
  shared_comment?: string
  private_note?: string
}

class CerCarePlanService {
  // -------------------------------------------------------------
  // PLAN MANAGEMENT
  // -------------------------------------------------------------
  async getCurrentPlan(enrollmentId: string): Promise<CerCarePlanRecord | null> {
    try {
      const records = await pb.collection('cer_care_plans').getFullList<CerCarePlanRecord>({
        filter: `enrollment_id = "${enrollmentId}" && status = "active"`,
        sort: '-revision_number',
      })
      return records[0] || null
    } catch {
      return null
    }
  }

  async getPlanById(planId: string): Promise<CerCarePlanRecord> {
    return await pb.collection('cer_care_plans').getOne<CerCarePlanRecord>(planId)
  }

  async createDraftPlan(input: CreateCarePlanInput): Promise<CerCarePlanRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.createDraftPlan(input)
    }
    return await pb.collection('cer_care_plans').create<CerCarePlanRecord>({
      enrollment_id: input.enrollment_id,
      status: 'draft',
      direction_mode: input.direction_mode,
      direction_statement: input.direction_statement || '',
      direction_source_id: input.direction_source_id || '',
      professional_context: input.professional_context || '',
      professional_rationale: input.professional_rationale || '',
      created_by_user_id: input.created_by_user_id || pb.authStore.record?.id,
    })
  }

  async activatePlan(planId: string): Promise<CerCarePlanRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.activatePlan(planId)
    }
    return await pb.collection('cer_care_plans').update<CerCarePlanRecord>(planId, {
      status: 'active',
    })
  }

  async pausePlan(planId: string): Promise<CerCarePlanRecord> {
    return await pb.collection('cer_care_plans').update<CerCarePlanRecord>(planId, {
      status: 'paused',
    })
  }

  async resumePlan(planId: string): Promise<CerCarePlanRecord> {
    return await pb.collection('cer_care_plans').update<CerCarePlanRecord>(planId, {
      status: 'active',
    })
  }

  async revisePlan(
    previousPlanId: string,
    revisionData: ReviseCarePlanInput,
  ): Promise<CerCarePlanRecord> {
    const prev = await this.getPlanById(previousPlanId)

    // Criar novo record com revision_number + 1 e previous_plan_id apontado
    const newPlan = await pb.collection('cer_care_plans').create<CerCarePlanRecord>({
      enrollment_id: prev.enrollment_id,
      status: 'active',
      direction_mode: revisionData.direction_mode || prev.direction_mode,
      direction_statement:
        revisionData.direction_statement !== undefined
          ? revisionData.direction_statement
          : prev.direction_statement,
      direction_source_id:
        revisionData.direction_source_id !== undefined
          ? revisionData.direction_source_id
          : prev.direction_source_id,
      professional_context:
        revisionData.professional_context !== undefined
          ? revisionData.professional_context
          : prev.professional_context,
      professional_rationale:
        revisionData.professional_rationale !== undefined
          ? revisionData.professional_rationale
          : prev.professional_rationale,
      previous_plan_id: prev.id,
      created_by_user_id: pb.authStore.record?.id || prev.created_by_user_id,
    })

    // O anterior passa para superseded (feito no hook ou garantido aqui)
    try {
      await pb.collection('cer_care_plans').update(prev.id, {
        status: 'superseded',
      })
    } catch {
      /* intentionally ignored */
    }

    return newPlan
  }

  // -------------------------------------------------------------
  // PRIORITY MANAGEMENT
  // -------------------------------------------------------------
  async listPriorities(planId: string): Promise<CerCarePlanPriorityRecord[]> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.listPriorities(planId)
    }
    return await pb.collection('cer_care_plan_priorities').getFullList<CerCarePlanPriorityRecord>({
      filter: `plan_id = "${planId}"`,
      sort: 'order_index,created',
    })
  }

  async addPriority(input: CreatePriorityInput): Promise<CerCarePlanPriorityRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.addPriority(input)
    }
    return await pb.collection('cer_care_plan_priorities').create<CerCarePlanPriorityRecord>({
      plan_id: input.plan_id,
      title: input.title,
      description: input.description || '',
      status: 'candidate',
      is_therapeutic_priority: input.is_therapeutic_priority ?? true,
      is_possible_now: input.is_possible_now ?? true,
      order_index: input.order_index ?? 1,
      professional_rationale: input.professional_rationale || '',
      access_class: input.access_class || 'shared_care',
      created_by_user_id: input.created_by_user_id || pb.authStore.record?.id,
    })
  }

  async updatePriorityStatus(
    priorityId: string,
    status: CarePlanPriorityStatus,
    deferralReason?: string,
  ): Promise<CerCarePlanPriorityRecord> {
    const updatePayload: Record<string, any> = { status }
    if (deferralReason !== undefined) {
      updatePayload.deferral_reason = deferralReason
    }
    return await pb
      .collection('cer_care_plan_priorities')
      .update<CerCarePlanPriorityRecord>(priorityId, updatePayload)
  }

  async addPrioritySource(input: AddPrioritySourceInput): Promise<CerCarePlanPrioritySourceRecord> {
    const pri = await pb
      .collection('cer_care_plan_priorities')
      .getOne<CerCarePlanPriorityRecord>(input.priority_id)
    const plan = await this.getPlanById(pri.plan_id)

    return await pb
      .collection('cer_care_plan_priority_sources')
      .create<CerCarePlanPrioritySourceRecord>({
        priority_id: input.priority_id,
        enrollment_id: plan.enrollment_id,
        source_type: input.source_type,
        source_id: input.source_id,
        source_version_anchor: input.source_version_anchor || '',
        access_class: input.access_class || 'shared_care',
        created_by_user_id: pb.authStore.record?.id,
      })
  }

  async listPrioritySources(priorityId: string): Promise<CerCarePlanPrioritySourceRecord[]> {
    return await pb
      .collection('cer_care_plan_priority_sources')
      .getFullList<CerCarePlanPrioritySourceRecord>({
        filter: `priority_id = "${priorityId}"`,
      })
  }

  // -------------------------------------------------------------
  // PRESENTATION MANAGEMENT (CANAL CANÔNICO PARTICIPANT-FACING)
  // -------------------------------------------------------------
  async createPresentation(
    input: CreatePlanPresentationInput,
  ): Promise<CerCarePlanPresentationRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.createPresentation(input)
    }
    const plan = await this.getPlanById(input.plan_id)
    return await pb
      .collection('cer_care_plan_presentations')
      .create<CerCarePlanPresentationRecord>({
        plan_id: input.plan_id,
        priority_id: input.priority_id || '',
        enrollment_id: plan.enrollment_id,
        status: 'draft',
        participant_title: input.participant_title,
        participant_summary: input.participant_summary || '',
        practical_invitation: input.practical_invitation || '',
        channel: input.channel || 'app',
        created_by_user_id: pb.authStore.record?.id,
      })
  }

  async presentPresentation(presentationId: string): Promise<CerCarePlanPresentationRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.presentPresentation(presentationId)
    }
    return await pb
      .collection('cer_care_plan_presentations')
      .update<CerCarePlanPresentationRecord>(presentationId, {
        status: 'presented',
        presented_at: new Date().toISOString(),
      })
  }

  async withdrawPresentation(presentationId: string): Promise<CerCarePlanPresentationRecord> {
    return await pb
      .collection('cer_care_plan_presentations')
      .update<CerCarePlanPresentationRecord>(presentationId, {
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      })
  }

  // -------------------------------------------------------------
  // OPERATIONAL ACCEPTANCE & PRIVATE NOTES
  // -------------------------------------------------------------
  async listPresentedForParticipant(
    enrollmentId: string,
  ): Promise<CerCarePlanPresentationRecord[]> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.listPresentedForParticipant(enrollmentId)
    }
    try {
      return await pb
        .collection('cer_care_plan_presentations')
        .getFullList<CerCarePlanPresentationRecord>({
          filter: `enrollment_id = "${enrollmentId}" && status = "presented"`,
          sort: '-presented_at,-created',
        })
    } catch {
      return []
    }
  }

  async listAcceptancesByEnrollment(
    enrollmentId: string,
  ): Promise<CerOperationalAcceptanceRecord[]> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.listAcceptancesByEnrollment(enrollmentId)
    }
    try {
      return await pb
        .collection('cer_operational_acceptances')
        .getFullList<CerOperationalAcceptanceRecord>({
          filter: `enrollment_id = "${enrollmentId}"`,
          sort: '-created',
        })
    } catch {
      return []
    }
  }

  async recordAcceptance(input: RecordAcceptanceInput): Promise<{
    acceptance: CerOperationalAcceptanceRecord
    privateNote?: CerOperationalAcceptancePrivateNoteRecord
  }> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      const acc = demoAdapter.recordAcceptance(input)
      return { acceptance: acc }
    }

    const pres = await pb
      .collection('cer_care_plan_presentations')
      .getOne<CerCarePlanPresentationRecord>(input.presentation_id)

    // 1. Criar aceite operacional (lockado em shared_care)
    const acceptance = await pb
      .collection('cer_operational_acceptances')
      .create<CerOperationalAcceptanceRecord>({
        presentation_id: pres.id,
        plan_id: pres.plan_id,
        priority_id: pres.priority_id || '',
        enrollment_id: pres.enrollment_id,
        participant_user_id: pb.authStore.record?.id,
        response_type: input.response_type,
        shared_comment: input.shared_comment || '',
        access_class: 'shared_care',
        record_status: 'current',
      })

    // 2. Se informada nota privada, criar em collection separada
    let privateNote: CerOperationalAcceptancePrivateNoteRecord | undefined = undefined
    if (input.private_note && input.private_note.trim().length > 0) {
      privateNote = await pb
        .collection('cer_operational_acceptance_private_notes')
        .create<CerOperationalAcceptancePrivateNoteRecord>({
          acceptance_id: acceptance.id,
          participant_user_id: pb.authStore.record?.id,
          enrollment_id: pres.enrollment_id,
          note_text: input.private_note.trim(),
          status: 'current',
        })
    }

    return { acceptance, privateNote }
  }

  // -------------------------------------------------------------
  // CARE CYCLES
  // -------------------------------------------------------------
  async createCycle(input: CreateCareCycleInput): Promise<CerCareCycleRecord> {
    const plan = await this.getPlanById(input.plan_id)

    // Obter próximo cycle_number
    let nextNum = 1
    try {
      const existing = await pb.collection('cer_care_cycles').getFullList<CerCareCycleRecord>({
        filter: `enrollment_id = "${plan.enrollment_id}"`,
        sort: '-cycle_number',
      })
      if (existing.length > 0) {
        nextNum = existing[0].cycle_number + 1
      }
    } catch {
      /* intentionally ignored */
    }

    return await pb.collection('cer_care_cycles').create<CerCareCycleRecord>({
      enrollment_id: plan.enrollment_id,
      plan_id: plan.id,
      cycle_number: nextNum,
      status: 'planned',
      planned_end_date: input.planned_end_date || '',
      review_event_type: input.review_event_type || 'participant_checkin',
      capacity_context_ref: input.capacity_context_ref || '',
      focus_summary: input.focus_summary || '',
      professional_notes: input.professional_notes || '',
      created_by_user_id: pb.authStore.record?.id,
    })
  }

  async startCycle(cycleId: string): Promise<CerCareCycleRecord> {
    return await pb.collection('cer_care_cycles').update<CerCareCycleRecord>(cycleId, {
      status: 'active',
      start_date: new Date().toISOString(),
    })
  }

  async extendCycle(cycleId: string, newUntilDate: string): Promise<CerCareCycleRecord> {
    return await pb.collection('cer_care_cycles').update<CerCareCycleRecord>(cycleId, {
      extended_until: newUntilDate,
    })
  }

  async pauseCycle(cycleId: string): Promise<CerCareCycleRecord> {
    return await pb.collection('cer_care_cycles').update<CerCareCycleRecord>(cycleId, {
      status: 'paused',
    })
  }

  async resumeCycle(cycleId: string): Promise<CerCareCycleRecord> {
    return await pb.collection('cer_care_cycles').update<CerCareCycleRecord>(cycleId, {
      status: 'active',
    })
  }

  async closeCycle(cycleId: string): Promise<CerCareCycleRecord> {
    return await pb.collection('cer_care_cycles').update<CerCareCycleRecord>(cycleId, {
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
  }
}

export const cerCarePlanService = new CerCarePlanService()
