import pb from '@/lib/pocketbase/client'
import type {
  CerSessionRecord,
  CerSessionNoteRecord,
  CerSessionObservationRecord,
  SessionObservationType,
  SessionStatus,
  SessionPreparationData,
  EnrollmentRecord,
  CerKnowledgeItemRecord,
  CerParticipantRecognitionRecord,
  EnrollmentExperienceRecord,
  CerKnowledgePresentationRecord,
} from '@/types/cer'

/**
 * Service de Sessões Longitudinais (Build 04A - Session Core)
 */
export const cerSessionService = {
  /**
   * Lista todas as sessões de um enrollment (visíveis ao profissional com acesso ativo)
   */
  async listByEnrollment(enrollmentId: string): Promise<CerSessionRecord[]> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.listSessions(enrollmentId)
    }
    return await pb.collection('cer_sessions').getFullList<CerSessionRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      sort: '-created',
      expand: 'professional_user_id,enrollment_id',
    })
  },

  /**
   * Alias de conveniência canônico para listByEnrollment
   */
  async listSessionsByEnrollment(enrollmentId: string): Promise<CerSessionRecord[]> {
    return this.listByEnrollment(enrollmentId)
  },

  /**
   * Obtém detalhes de uma sessão por ID
   */
  async getById(sessionId: string): Promise<CerSessionRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      const s = demoAdapter.listSessions('').find((x) => x.id === sessionId)
      if (s) return s
    }
    return await pb.collection('cer_sessions').getOne<CerSessionRecord>(sessionId, {
      expand: 'professional_user_id,enrollment_id',
    })
  },

  /**
   * Cria uma nova sessão agendada para o enrollment
   */
  async createScheduled(enrollmentId: string, scheduledAt?: string): Promise<CerSessionRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.createScheduledSession(enrollmentId, scheduledAt)
    }
    const currentUserId = pb.authStore.record?.id
    return await pb.collection('cer_sessions').create<CerSessionRecord>({
      enrollment_id: enrollmentId,
      professional_user_id: currentUserId,
      scheduled_at: scheduledAt || null,
      status: 'scheduled',
    })
  },

  /**
   * Inicia a sessão imediatamente (scheduled -> in_progress)
   */
  async startSession(sessionId: string): Promise<CerSessionRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.startSession(sessionId)
    }
    return await pb.collection('cer_sessions').update<CerSessionRecord>(sessionId, {
      status: 'in_progress',
    })
  },

  /**
   * Conclui a sessão (in_progress -> completed)
   */
  async completeSession(sessionId: string): Promise<CerSessionRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.completeSession(sessionId)
    }
    return await pb.collection('cer_sessions').update<CerSessionRecord>(sessionId, {
      status: 'completed',
    })
  },

  /**
   * Cancela a sessão (scheduled -> cancelled)
   */
  async cancelSession(sessionId: string): Promise<CerSessionRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.cancelSession(sessionId)
    }
    return await pb.collection('cer_sessions').update<CerSessionRecord>(sessionId, {
      status: 'cancelled',
    })
  },

  /**
   * Atualiza data prevista de agendamento (somente se status = 'scheduled')
   */
  async updateScheduledDate(sessionId: string, scheduledAt: string): Promise<CerSessionRecord> {
    return await pb.collection('cer_sessions').update<CerSessionRecord>(sessionId, {
      scheduled_at: scheduledAt,
    })
  },
}

/**
 * Service de Notas Canônicas Privadas da Sessão (Build 04A - Session Core)
 */
export const cerSessionNoteService = {
  /**
   * Busca a nota canônica de uma sessão específica (se existir)
   */
  async getBySessionId(sessionId: string): Promise<CerSessionNoteRecord | null> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.getSessionNote(sessionId)
    }
    try {
      const records = await pb.collection('cer_session_notes').getList<CerSessionNoteRecord>(1, 1, {
        filter: `session_id = "${sessionId}"`,
        expand: 'author_user_id',
      })
      return records.items[0] || null
    } catch {
      return null
    }
  },

  /**
   * Cria a nota canônica para uma sessão
   */
  async create(sessionId: string, text: string): Promise<CerSessionNoteRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.createOrUpdateNote(sessionId, text)
    }
    const session = await pb.collection('cer_sessions').getOne<CerSessionRecord>(sessionId)
    const currentUserId = pb.authStore.record?.id
    return await pb.collection('cer_session_notes').create<CerSessionNoteRecord>({
      session_id: sessionId,
      enrollment_id: session.enrollment_id,
      author_user_id: currentUserId,
      text: text,
    })
  },

  /**
   * Atualiza o texto da nota (permitido somente enquanto sessão for scheduled ou in_progress)
   */
  async update(noteId: string, text: string): Promise<CerSessionNoteRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      // No demo mode, localizamos a nota pelo noteId ou atualizamos
      return demoAdapter.createOrUpdateNote('', text)
    }
    return await pb.collection('cer_session_notes').update<CerSessionNoteRecord>(noteId, {
      text: text,
    })
  },
}

/**
 * Service de Observações de Sessão Epistemicamente Preservadas (Build 04B - Knowledge from Session)
 * Registro único e imutável. Observation é create-only; DELETE e UPDATE são negados.
 */
export const cerSessionObservationService = {
  /**
   * Lista as observações registradas para uma sessão
   */
  async listBySession(sessionId: string): Promise<CerSessionObservationRecord[]> {
    return await pb
      .collection('cer_session_observations')
      .getFullList<CerSessionObservationRecord>({
        filter: `session_id = "${sessionId}"`,
        sort: 'created',
        expand: 'recorded_by_user_id',
      })
  },

  /**
   * Lista as observações de um enrollment inteiro
   */
  async listByEnrollment(enrollmentId: string): Promise<CerSessionObservationRecord[]> {
    return await pb
      .collection('cer_session_observations')
      .getFullList<CerSessionObservationRecord>({
        filter: `enrollment_id = "${enrollmentId}"`,
        sort: '-created',
        expand: 'recorded_by_user_id,session_id',
      })
  },

  /**
   * Cria uma observação de sessão (participant_report ou professional_observation)
   */
  async create(data: {
    session_id: string
    observation_type: SessionObservationType
    text: string
  }): Promise<CerSessionObservationRecord> {
    const session = await pb.collection('cer_sessions').getOne<CerSessionRecord>(data.session_id)
    const currentUserId = pb.authStore.record?.id
    return await pb.collection('cer_session_observations').create<CerSessionObservationRecord>({
      session_id: data.session_id,
      enrollment_id: session.enrollment_id,
      recorded_by_user_id: currentUserId,
      observation_type: data.observation_type,
      text: data.text,
      access_class: 'professional_private',
    })
  },
}

/**
 * PREPARAÇÃO PRÉ-SESSÃO DETERMINÍSTICA (SEM PERSISTÊNCIA, SEM SNAPSHOT, SEM COLLECTION)
 * Reúne em tempo de execução:
 * - Dados do enrollment e pessoa
 * - Última sessão completed e sua nota associada
 * - Itens de conhecimento autorizados para este enrollment (RLS 0024 allowlist)
 * - Reconhecimentos ativos da interagente
 * - Experiências recentes completadas
 */
export async function computeSessionPreparation(
  enrollmentId: string,
): Promise<SessionPreparationData> {
  const { demoAdapter } = await import('@/services/demoAdapter')
  if (demoAdapter.isEnabled()) {
    return demoAdapter.computeSessionPreparation(enrollmentId)
  }

  // 1. Enrollment
  const enrollment = await pb.collection('enrollments').getOne<EnrollmentRecord>(enrollmentId, {
    expand: 'person_id,product_id',
  })

  const participantName =
    enrollment.expand?.person_id?.preferred_name ||
    enrollment.expand?.person_id?.full_name ||
    'Interagente'

  // 2. Última sessão completed
  let lastCompletedSession: CerSessionRecord | undefined
  let lastSessionNote: CerSessionNoteRecord | undefined
  try {
    const sessions = await pb.collection('cer_sessions').getList<CerSessionRecord>(1, 1, {
      filter: `enrollment_id = "${enrollmentId}" && status = "completed"`,
      sort: '-completed_at,-created',
    })
    if (sessions.items.length > 0) {
      lastCompletedSession = sessions.items[0]
      const note = await cerSessionNoteService.getBySessionId(lastCompletedSession.id)
      if (note) {
        lastSessionNote = note
      }
    }
  } catch {
    // Silencioso se não houver sessões
  }

  // 3. Knowledge Items autorizados recentes (respeitando RLS live da allowlist)
  let recentKnowledgeItems: CerKnowledgeItemRecord[] = []
  try {
    const kiList = await pb
      .collection('cer_knowledge_items')
      .getList<CerKnowledgeItemRecord>(1, 6, {
        filter: `enrollment_id = "${enrollmentId}" && (status = "supported" || status = "recognized" || status = "observed" || status = "reported")`,
        sort: '-created',
        expand: 'primary_dimension_id,framework_id',
      })
    recentKnowledgeItems = kiList.items
  } catch {
    recentKnowledgeItems = []
  }

  // 4. Reconhecimentos recentes
  let recentRecognitions: CerParticipantRecognitionRecord[] = []
  try {
    const recogList = await pb
      .collection('cer_participant_recognitions')
      .getList<CerParticipantRecognitionRecord>(1, 5, {
        filter: `enrollment_id = "${enrollmentId}"`,
        sort: '-created',
        expand: 'knowledge_item_id',
      })
    recentRecognitions = recogList.items
  } catch {
    recentRecognitions = []
  }

  // 5. Experiências recentemente concluídas
  let recentCompletedExperiences: EnrollmentExperienceRecord[] = []
  try {
    const expList = await pb
      .collection('enrollment_experiences')
      .getList<EnrollmentExperienceRecord>(1, 4, {
        filter: `enrollment_id = "${enrollmentId}" && progress_status = "completed"`,
        sort: '-completed_at,-updated',
        expand: 'experience_id',
      })
    recentCompletedExperiences = expList.items
  } catch {
    recentCompletedExperiences = []
  }

  // BUILD 07A — Evidence Currency Layer no SessionPreparation:
  // KIs cujas evidências exclusivas foram invalidadas por fechamento de branch são filtradas do resumo ativo
  try {
    const [allResps, allPrompts, allSigs] = await Promise.all([
      pb.collection('experience_responses').getFullList({
        filter: `enrollment_id = "${enrollmentId}"`,
      }),
      pb.collection('cer_prompts').getFullList({
        sort: 'step_order',
      }),
      pb.collection('cer_signals').getFullList({
        filter: `enrollment_id = "${enrollmentId}"`,
      }),
    ])
    const { deriveEvidenceCurrency } = await import('@/services/orchestrationResolver')
    const currency = deriveEvidenceCurrency({
      prompts: allPrompts as any,
      responses: allResps as any,
      signals: allSigs as any,
    })

    // Se um KI tiver como única evidência um Signal que se tornou inativo, não destacar na preparação corrente
    if (currency.historicalSignalIds.size > 0) {
      const activeRecentKIs: CerKnowledgeItemRecord[] = []
      for (const ki of recentKnowledgeItems) {
        const evs = await pb.collection('cer_knowledge_evidence').getFullList({
          filter: `knowledge_item_id = "${ki.id}"`,
        })
        const hasActiveEvidence =
          evs.length === 0 ||
          evs.some((ev) => {
            if (ev.evidence_type === 'signal') {
              return !currency.historicalSignalIds.has(ev.evidence_id)
            }
            if (ev.evidence_type === 'response') {
              return !currency.historicalResponseIds.has(ev.evidence_id)
            }
            return true
          })
        if (hasActiveEvidence) {
          activeRecentKIs.push(ki)
        }
      }
      recentKnowledgeItems = activeRecentKIs
    }
  } catch {
    // Fail-safe
  }

  // 6. BUILD 04C — CONTINUITY (aditivo, sem persistência, sem scoring, sem IA):
  // Incluir Presentations recentes status=presented e Recognitions vinculados.
  // Destacar deterministicamente para preparação:
  // - criticalRecognitions: partially_makes_sense, does_not_recognize, depends_on_context, wants_to_add
  // - supportiveRecognitions: makes_sense de forma secundária
  let recentPresentations: CerKnowledgePresentationRecord[] = []
  try {
    const presList = await pb
      .collection('cer_knowledge_presentations')
      .getList<CerKnowledgePresentationRecord>(1, 6, {
        filter: `enrollment_id = "${enrollmentId}" && status = "presented"`,
        sort: '-presented_at,-created',
        expand: 'knowledge_item_id',
      })
    recentPresentations = presList.items
  } catch {
    recentPresentations = []
  }

  const criticalRecognitions = recentRecognitions.filter((r) =>
    ['partially_makes_sense', 'does_not_recognize', 'depends_on_context', 'wants_to_add'].includes(
      r.recognition_type,
    ),
  )

  const supportiveRecognitions = recentRecognitions.filter(
    (r) => r.recognition_type === 'makes_sense',
  )

  // 7. CER V1 — Recados aprovados da interagente para o próximo encontro
  // Ligados ao enrollment_id (não ao session_id), garantindo persistência mesmo se a sessão ainda não foi agendada ou remarcada
  let approvedNextSessionMessages: any[] = []
  try {
    const { cerJournalService } = await import('@/services/cerJournalService')
    approvedNextSessionMessages =
      await cerJournalService.listApprovedMessagesForProfessional(enrollmentId)
  } catch {
    approvedNextSessionMessages = []
  }

  return {
    enrollment,
    participantName,
    lastCompletedSession,
    lastSessionNote,
    recentKnowledgeItems,
    recentRecognitions,
    recentCompletedExperiences,
    recentPresentations,
    continuityHighlights: {
      criticalRecognitions,
      supportiveRecognitions,
    },
    approvedNextSessionMessages,
  }
}
