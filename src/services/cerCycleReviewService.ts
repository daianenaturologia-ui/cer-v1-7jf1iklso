import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
import pb from '@/lib/pocketbase/client'
import type {
  CerCycleReviewRecord,
  CycleReviewStatus,
  CycleReviewDecision,
  CerPracticeResponseRecord,
} from '@/types/cer'

export interface CreateCycleReviewInput {
  enrollment_id: string
  care_cycle_id: string
  created_by_user_id: string
  status: CycleReviewStatus
  decision?: CycleReviewDecision
  participant_highlights?: string
  professional_summary?: string
  participant_review_invited_at?: string
  participant_review_completed_at?: string
}

export interface DescriptiveCycleDigest {
  total_responses: number
  summary_text: string
  distribution_by_type: Record<string, number>
  safety_flags_count: {
    needs_review: number
    escalation_required: number
  }
}

function demoProfessional() {
  if (demoAdapter.getActivePersona() !== 'daiane')
    throw new Error('Revisão interna disponível somente para a profissional.')
}
export const cerCycleReviewService = {
  async listByEnrollment(enrollmentId: string): Promise<CerCycleReviewRecord[]> {
    if (demoAdapter.isEnabled()) {
      demoProfessional()
      return demoAdapter.readCareStore().reviews.filter((r) => r.enrollment_id === enrollmentId)
    }
    return await pb.collection('cer_cycle_reviews').getFullList<CerCycleReviewRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      sort: '-created',
      expand: 'care_cycle_id,created_by_user_id',
    })
  },

  async getByCycleId(cycleId: string): Promise<CerCycleReviewRecord | null> {
    if (demoAdapter.isEnabled()) {
      demoProfessional()
      return demoAdapter.readCareStore().reviews.find((r) => r.care_cycle_id === cycleId) || null
    }
    try {
      const records = await pb.collection('cer_cycle_reviews').getList<CerCycleReviewRecord>(1, 1, {
        filter: `care_cycle_id = "${cycleId}"`,
        sort: '-created',
        expand: 'care_cycle_id,created_by_user_id',
      })
      return records.items[0] || null
    } catch (error) {
      throw error
    }
  },

  async createReview(input: CreateCycleReviewInput): Promise<CerCycleReviewRecord> {
    if (demoAdapter.isEnabled()) {
      demoProfessional()
      const store = demoAdapter.readCareStore()
      const cycle = store.cycles.find(
        (c) => c.id === input.care_cycle_id && c.enrollment_id === input.enrollment_id,
      )
      if (
        !cycle ||
        cycle.status === 'planned' ||
        input.enrollment_id !== DEMO_ENROLLMENT_ID ||
        input.created_by_user_id !== demoAdapter.getCurrentUser().id
      )
        throw new Error('Inicie um ciclo válido antes de registrar a revisão.')
      if (store.reviews.some((r) => r.care_cycle_id === cycle.id))
        throw new Error('Este ciclo já tem uma revisão.')
      const now = new Date().toISOString()
      const review: CerCycleReviewRecord = {
        ...input,
        id: `demo-review-${crypto.randomUUID()}`,
        created: now,
        updated: now,
      }
      store.reviews.push(review)
      demoAdapter.writeCareStore(store)
      return review
    }
    return await pb.collection('cer_cycle_reviews').create<CerCycleReviewRecord>(input)
  },

  async updateReview(
    reviewId: string,
    patch: Partial<
      Pick<
        CerCycleReviewRecord,
        | 'status'
        | 'decision'
        | 'participant_highlights'
        | 'professional_summary'
        | 'participant_review_invited_at'
        | 'participant_review_completed_at'
      >
    >,
  ): Promise<CerCycleReviewRecord> {
    if (demoAdapter.isEnabled()) {
      demoProfessional()
      const store = demoAdapter.readCareStore()
      const review = store.reviews.find((r) => r.id === reviewId)
      if (!review) throw new Error('Revisão não encontrada.')
      Object.assign(review, patch, { updated: new Date().toISOString() })
      demoAdapter.writeCareStore(store)
      return review
    }
    return await pb.collection('cer_cycle_reviews').update<CerCycleReviewRecord>(reviewId, patch)
  },

  /**
   * Projeção On-Demand do Cycle Digest (NÃO PERSISTIDO, ZERO ENTIDADE).
   * Sem percentual de eficácia, sem score de adesão, sem causalidade automática ("Prática X causou Y").
   * Somente agregação descritiva transparente ("Em 2 de 3 registros, o participante relatou ajuda").
   */
  generateDescriptiveDigest(responses: CerPracticeResponseRecord[]): DescriptiveCycleDigest {
    const total = responses.length
    const dist: Record<string, number> = {}
    let needsReviewCount = 0
    let escalationCount = 0

    responses.forEach((r) => {
      dist[r.response_type] = (dist[r.response_type] || 0) + 1
      if (r.safety_flag === 'needs_review') needsReviewCount++
      if (r.safety_flag === 'escalation_required') escalationCount++
    })

    if (total === 0) {
      return {
        total_responses: 0,
        summary_text: 'Ainda não há registros de resposta neste ciclo.',
        distribution_by_type: {},
        safety_flags_count: { needs_review: 0, escalation_required: 0 },
      }
    }

    const helpedCount = (dist['helped'] || 0) + (dist['helped_a_bit'] || 0)
    const difficultCount = (dist['was_difficult'] || 0) + (dist['was_too_much'] || 0)
    const notDoneCount = (dist['could_not_do'] || 0) + (dist['chose_not_to_do'] || 0)

    const parts: string[] = []
    if (helpedCount > 0) {
      parts.push(
        `Em ${helpedCount} de ${total} registros, o interagente relatou que a prática ajudou ou ajudou um pouco`,
      )
    }
    if (difficultCount > 0) {
      parts.push(`Em ${difficultCount} momento(s), relatou que a prática foi difícil ou intensa`)
    }
    if (notDoneCount > 0) {
      parts.push(
        `Em ${notDoneCount} ocasião(ões), não foi possível realizar ou optou-se por pausar`,
      )
    }

    const summary_text =
      parts.length > 0 ? parts.join('. ') + '.' : `${total} registro(s) de resposta efetuado(s).`

    return {
      total_responses: total,
      summary_text,
      distribution_by_type: dist,
      safety_flags_count: {
        needs_review: needsReviewCount,
        escalation_required: escalationCount,
      },
    }
  },
}
