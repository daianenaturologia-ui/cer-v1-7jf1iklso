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
} from '@/types/cer'

/**
 * Service de Sessões Longitudinais (Build 04A - Session Core)
 */
export const cerSessionService = {
  /**
   * Lista todas as sessões de um enrollment (visíveis ao profissional com acesso ativo)
   */
  async listByEnrollment(enrollmentId: string): Promise<CerSessionRecord[]> {
    return await pb.collection('cer_sessions').getFullList<CerSessionRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      sort: '-created',
      expand: 'professional_user_id,enrollment_id',
    })
  },

  /**
   * Obtém detalhes de uma sessão por ID
   */
  async getById(sessionId: string): Promise<CerSessionRecord> {
    return await pb.collection('cer_sessions').getOne<CerSessionRecord>(sessionId, {
      expand: 'professional_user_id,enrollment_id',
    })
  },

  /**
   * Cria uma nova sessão agendada para o enrollment
   */
  async createScheduled(enrollmentId: string, scheduledAt?: string): Promise<CerSessionRecord> {
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
    return await pb.collection('cer_sessions').update<CerSessionRecord>(sessionId, {
      status: 'in_progress',
    })
  },

  /**
   * Conclui a sessão (in_progress -> completed)
   */
  async completeSession(sessionId: string): Promise<CerSessionRecord> {
    return await pb.collection('cer_sessions').update<CerSessionRecord>(sessionId, {
      status: 'completed',
    })
  },

  /**
   * Cancela a sessão (scheduled -> cancelled)
   */
  async cancelSession(sessionId: string): Promise<CerSessionRecord> {
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

  return {
    enrollment,
    participantName,
    lastCompletedSession,
    lastSessionNote,
    recentKnowledgeItems,
    recentRecognitions,
    recentCompletedExperiences,
  }
}
