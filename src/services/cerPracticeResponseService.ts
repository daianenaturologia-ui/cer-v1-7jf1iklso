import pb from '@/lib/pocketbase/client'
import type {
  CerPracticeResponseRecord,
  CerPracticeResponsePrivateNoteRecord,
  PracticeResponseType,
  PracticeResponseSafetyFlag,
} from '@/types/cer'

export interface CreatePracticeResponseInput {
  assignment_id: string
  planner_item_id?: string
  participant_user_id: string
  enrollment_id: string
  care_cycle_id: string
  practice_version_id: string
  response_type: PracticeResponseType
  perceived_helpfulness?: number
  difficulty?: number
  adaptation_used?: string
  wants_to_continue?: boolean
  safety_flag?: PracticeResponseSafetyFlag
  shared_reflection?: string
  previous_response_id?: string
  private_note_text?: string
  // Correção 3A-1: campos de execução real e dose realizada
  completed_repetitions?: number
  completed_cycles?: number
  completed_series?: number
  actual_duration_seconds?: number
  ended_early?: boolean
  stop_reason?: string
  completed_step_ids?: string[]
}

export const cerPracticeResponseService = {
  async listByEnrollment(enrollmentId: string): Promise<CerPracticeResponseRecord[]> {
    return await pb.collection('cer_practice_responses').getFullList<CerPracticeResponseRecord>({
      filter: `enrollment_id = "${enrollmentId}" && record_status = "current"`,
      sort: '-created',
      expand: 'assignment_id,practice_version_id,planner_item_id',
    })
  },

  async listByAssignment(assignmentId: string): Promise<CerPracticeResponseRecord[]> {
    return await pb.collection('cer_practice_responses').getFullList<CerPracticeResponseRecord>({
      filter: `assignment_id = "${assignmentId}" && record_status = "current"`,
      sort: '-created',
      expand: 'assignment_id,practice_version_id',
    })
  },

  async getById(id: string): Promise<CerPracticeResponseRecord> {
    return await pb.collection('cer_practice_responses').getOne<CerPracticeResponseRecord>(id, {
      expand: 'assignment_id,practice_version_id',
    })
  },

  async recordResponse(input: CreatePracticeResponseInput): Promise<{
    response: CerPracticeResponseRecord
    privateNote?: CerPracticeResponsePrivateNoteRecord
  }> {
    // 1. Determinar safety_flag canônica
    let sFlag: PracticeResponseSafetyFlag = input.safety_flag || 'none'
    if (input.response_type === 'was_too_much' && sFlag === 'none') {
      sFlag = 'needs_review'
    }

    // 2. Criar registro operacional compartilhado (shared_care)
    const responsePayload: Record<string, unknown> = {
      assignment_id: input.assignment_id,
      participant_user_id: input.participant_user_id,
      enrollment_id: input.enrollment_id,
      care_cycle_id: input.care_cycle_id,
      practice_version_id: input.practice_version_id,
      response_type: input.response_type,
      safety_flag: sFlag,
      record_status: 'current',
    }

    if (input.planner_item_id) responsePayload.planner_item_id = input.planner_item_id
    if (input.perceived_helpfulness !== undefined)
      responsePayload.perceived_helpfulness = input.perceived_helpfulness
    if (input.difficulty !== undefined) responsePayload.difficulty = input.difficulty
    if (input.adaptation_used) responsePayload.adaptation_used = input.adaptation_used
    if (input.wants_to_continue !== undefined)
      responsePayload.wants_to_continue = input.wants_to_continue
    if (input.shared_reflection) responsePayload.shared_reflection = input.shared_reflection
    if (input.previous_response_id)
      responsePayload.previous_response_id = input.previous_response_id

    // Correção 3A-1: dose realizada e execução
    if (input.completed_repetitions !== undefined)
      responsePayload.completed_repetitions = Math.max(0, Math.floor(input.completed_repetitions))
    if (input.completed_cycles !== undefined)
      responsePayload.completed_cycles = Math.max(0, Math.floor(input.completed_cycles))
    if (input.completed_series !== undefined)
      responsePayload.completed_series = Math.max(0, Math.floor(input.completed_series))
    if (input.actual_duration_seconds !== undefined)
      responsePayload.actual_duration_seconds = Math.max(
        0,
        Math.floor(input.actual_duration_seconds),
      )
    if (input.ended_early !== undefined) responsePayload.ended_early = Boolean(input.ended_early)
    if (input.stop_reason) responsePayload.stop_reason = input.stop_reason
    if (input.completed_step_ids && Array.isArray(input.completed_step_ids))
      responsePayload.completed_step_ids = input.completed_step_ids

    const createdResponse = await pb
      .collection('cer_practice_responses')
      .create<CerPracticeResponseRecord>(responsePayload)

    // 3. Se houver nota privada íntima, salvar em cer_practice_response_private_notes (participant-only)
    let createdNote: CerPracticeResponsePrivateNoteRecord | undefined
    if (input.private_note_text && input.private_note_text.trim().length > 0) {
      createdNote = await pb
        .collection('cer_practice_response_private_notes')
        .create<CerPracticeResponsePrivateNoteRecord>({
          response_id: createdResponse.id,
          participant_user_id: input.participant_user_id,
          enrollment_id: input.enrollment_id,
          note_text: input.private_note_text.trim(),
          status: 'current',
        })
    }

    // 4. Se tiver planner_item_id associado, marcar como completed
    if (input.planner_item_id) {
      try {
        await pb.collection('cer_planner_items').update(input.planner_item_id, {
          status: 'completed',
        })
      } catch {
        /* intentional non-blocking */
      }
    }

    return { response: createdResponse, privateNote: createdNote }
  },

  async correctResponse(
    previousResponseId: string,
    input: Omit<CreatePracticeResponseInput, 'previous_response_id'>,
  ): Promise<CerPracticeResponseRecord> {
    const res = await this.recordResponse({
      ...input,
      previous_response_id: previousResponseId,
    })
    return res.response
  },

  async listParticipantPrivateNotes(
    enrollmentId: string,
    participantUserId: string,
  ): Promise<CerPracticeResponsePrivateNoteRecord[]> {
    return await pb
      .collection('cer_practice_response_private_notes')
      .getFullList<CerPracticeResponsePrivateNoteRecord>({
        filter: `enrollment_id = "${enrollmentId}" && participant_user_id = "${participantUserId}" && status = "current"`,
        sort: '-created',
      })
  },
}
