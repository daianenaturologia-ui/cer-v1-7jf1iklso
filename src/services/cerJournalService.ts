import pb from '@/lib/pocketbase/client'
import type {
  CerJournalEntryRecord,
  CerJournalEntryVersionRecord,
  CerNextSessionMessageRecord,
} from '@/types/cer'

export interface CreateJournalEntryInput {
  enrollment_id: string
  title?: string
  content: string
}

export interface UpdateJournalEntryInput {
  title?: string
  content: string
  change_reason?: string
}

export interface CreateNextSessionMessageInput {
  enrollment_id: string
  message_text: string
  summary_text?: string
  as_draft?: boolean
}

export interface ApproveNextSessionMessageInput {
  summary_text?: string
}

/**
 * SERVIÇO DO CADERNO PRIVADO (CER V1)
 *
 * P0 CONSTITUCIONAL:
 * - Caderno e suas versões são 100% privados da interagente (access_class: participant_private).
 * - NENHUM profissional pode listar, ler, buscar ou acessar entradas ou versões do Caderno.
 * - Recados para a próxima sessão são mensagens SEPARADAS, com ciclo: draft -> approved -> withdrawn.
 * - O resumo é gerado EXCLUSIVAMENTE a partir do recado separado — NUNCA copia ou resume o Caderno.
 */
export const cerJournalService = {
  // -------------------------------------------------------------
  // CADERNO PRIVADO (cer_journal_entries)
  // -------------------------------------------------------------

  /**
   * Listar anotações do Caderno para o participante autenticado
   */
  async listEntries(enrollmentId: string): Promise<CerJournalEntryRecord[]> {
    const authId = pb.authStore.record?.id
    if (!authId) return []

    return await pb.collection('cer_journal_entries').getFullList<CerJournalEntryRecord>({
      filter: `enrollment_id = "${enrollmentId}" && participant_user_id = "${authId}" && status = "active"`,
      sort: '-created',
    })
  },

  /**
   * Obter uma anotação específica pelo ID
   */
  async getEntry(id: string): Promise<CerJournalEntryRecord | null> {
    try {
      return await pb.collection('cer_journal_entries').getOne<CerJournalEntryRecord>(id)
    } catch {
      return null
    }
  },

  /**
   * Criar uma nova anotação espontânea no Caderno
   */
  async createEntry(input: CreateJournalEntryInput): Promise<CerJournalEntryRecord> {
    const authId = pb.authStore.record?.id
    if (!authId) {
      throw new Error('Usuário autenticado obrigatório para criar anotação no Caderno.')
    }

    return await pb.collection('cer_journal_entries').create<CerJournalEntryRecord>({
      enrollment_id: input.enrollment_id,
      participant_user_id: authId,
      title: input.title?.trim() || undefined,
      content: input.content.trim(),
      status: 'active',
      access_class: 'participant_private',
      version_number: 1,
    })
  },

  /**
   * Atualizar uma anotação do Caderno (gera versão histórica via hook server-side)
   */
  async updateEntry(id: string, input: UpdateJournalEntryInput): Promise<CerJournalEntryRecord> {
    return await pb.collection('cer_journal_entries').update<CerJournalEntryRecord>(id, {
      title: input.title?.trim() || undefined,
      content: input.content.trim(),
      change_reason: input.change_reason || 'edição de anotação',
    })
  },

  /**
   * Arquivar logicamente uma anotação do Caderno
   */
  async archiveEntry(id: string): Promise<CerJournalEntryRecord> {
    return await pb.collection('cer_journal_entries').update<CerJournalEntryRecord>(id, {
      status: 'archived',
    })
  },

  /**
   * Listar histórico de versões de uma anotação do Caderno
   */
  async listEntryVersions(entryId: string): Promise<CerJournalEntryVersionRecord[]> {
    const authId = pb.authStore.record?.id
    if (!authId) return []

    return await pb
      .collection('cer_journal_entry_versions')
      .getFullList<CerJournalEntryVersionRecord>({
        filter: `entry_id = "${entryId}" && participant_user_id = "${authId}"`,
        sort: '-version_number',
      })
  },

  // -------------------------------------------------------------
  // RECADOS PARA A PRÓXIMA SESSÃO (cer_next_session_messages)
  // -------------------------------------------------------------

  /**
   * Gerar resumo sucinto determinístico EXCLUSIVAMENTE a partir do texto do recado.
   * NUNCA toca, copia ou resume o Caderno.
   */
  generateMessageSummary(messageText: string): string {
    const clean = messageText.trim()
    if (!clean) return ''
    if (clean.length <= 120) return clean

    // Cortar na pontuação ou espaço até 120 caracteres
    const truncated = clean.slice(0, 120)
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > 80) {
      return truncated.slice(0, lastSpace) + '...'
    }
    return truncated + '...'
  },

  /**
   * Criar um recado para a próxima sessão
   * @param input.as_draft se true cria como draft; se false cria e aprova imediatamente
   */
  async createNextSessionMessage(
    input: CreateNextSessionMessageInput,
  ): Promise<CerNextSessionMessageRecord> {
    // Interceptação modo demonstração (ZERO REDE)
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.createNextSessionMessage(input)
    }

    const authId = pb.authStore.record?.id
    if (!authId) {
      throw new Error('Usuário autenticado obrigatório para criar recado.')
    }

    const summary = input.summary_text?.trim() || this.generateMessageSummary(input.message_text)
    const isDraft = input.as_draft ?? false

    return await pb.collection('cer_next_session_messages').create<CerNextSessionMessageRecord>({
      enrollment_id: input.enrollment_id,
      participant_user_id: authId,
      message_text: input.message_text.trim(),
      summary_text: summary,
      status: isDraft ? 'draft' : 'approved',
      access_class: isDraft ? 'participant_private' : 'shared_care',
      approved_at: isDraft ? undefined : new Date().toISOString(),
    })
  },

  /**
   * Aprovar um recado que estava em rascunho
   */
  async approveNextSessionMessage(
    id: string,
    input?: ApproveNextSessionMessageInput,
  ): Promise<CerNextSessionMessageRecord> {
    const updateData: Record<string, unknown> = {
      status: 'approved',
      approved_at: new Date().toISOString(),
    }
    if (input?.summary_text) {
      updateData.summary_text = input.summary_text.trim()
    }

    return await pb
      .collection('cer_next_session_messages')
      .update<CerNextSessionMessageRecord>(id, updateData)
  },

  /**
   * Retirar um recado previamente enviado/aprovado.
   * Impede novas leituras na área de preparação sem prometer apagar o que já foi lido.
   */
  async withdrawNextSessionMessage(id: string): Promise<CerNextSessionMessageRecord> {
    return await pb
      .collection('cer_next_session_messages')
      .update<CerNextSessionMessageRecord>(id, {
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      })
  },

  /**
   * Listar todos os recados da interagente autenticada (rascunhos, aprovados e retirados)
   */
  async listParticipantMessages(enrollmentId: string): Promise<CerNextSessionMessageRecord[]> {
    const authId = pb.authStore.record?.id
    if (!authId) return []

    return await pb
      .collection('cer_next_session_messages')
      .getFullList<CerNextSessionMessageRecord>({
        filter: `enrollment_id = "${enrollmentId}" && participant_user_id = "${authId}"`,
        sort: '-created',
      })
  },

  /**
   * Listar recados APROVADOS de um enrollment para a profissional (visão de preparação da sessão).
   * RLS no backend garante que a profissional só enxerga se status = 'approved' e access_class = 'shared_care'.
   * Não depende de session_id (vincula a enrollment_id), sobrevivendo a ausência de sessão agendada ou reagendamentos.
   */
  async listApprovedMessagesForProfessional(
    enrollmentId: string,
  ): Promise<CerNextSessionMessageRecord[]> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.listMessages(enrollmentId, true)
    }

    try {
      return await pb
        .collection('cer_next_session_messages')
        .getFullList<CerNextSessionMessageRecord>({
          filter: `enrollment_id = "${enrollmentId}" && status = "approved"`,
          sort: '-approved_at,-created',
          expand: 'participant_user_id',
        })
    } catch {
      return []
    }
  },
}
