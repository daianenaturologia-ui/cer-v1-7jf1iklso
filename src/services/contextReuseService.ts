/**
 * Build 07A — Context Reuse Service
 *
 * Princípio do Registro Único e Governança de Reuso:
 * - Lookup puramente determinístico por identificadores estruturados (enrollment_id, concept_key, temporality, framework_id).
 * - SEM similaridade semântica por IA, sem LLM decidindo equivalência.
 * - Privacy Gate estrito:
 *   - Fonte participant_private: lookup-only, NUNCA exposta diretamente em contexto mais permissivo.
 *   - Cross-enrollment terminantemente proibido.
 *   - Anti-laundering: nenhuma contextualização pode elevar o nível de acesso da fonte.
 * - Reuso Puro:
 *   - NÃO cria response.
 *   - NÃO cria signal.
 *   - NÃO cria evidence.
 *   - Não grava collection_origin em registro inexistente.
 *   - Audit REUSED_CONTEXT_PRESENTED com metadados puramente técnicos (sem texto livre nem respostas).
 */

import pb from '@/lib/pocketbase/client'
import type {
  CerSignalRecord,
  ExperienceResponseRecord,
  SignalTemporality,
  VisibilityClass,
} from '@/types/cer'

export interface ContextReuseLookupQuery {
  enrollmentId: string
  conceptKey: string
  temporality?: SignalTemporality
  frameworkId?: string
  requestingAccessDestination?: VisibilityClass
}

export interface ReusedContextResult {
  hasMatch: boolean
  sourceSignalId?: string
  sourceResponseId?: string
  conceptKey?: string
  temporality?: SignalTemporality
  sourceAccessClass?: VisibilityClass
  // Read-only presentation data (apenas se passar no Privacy Gate)
  isDisplayableToParticipant: boolean
  readOnlyValue?: unknown
  denialReason?: 'cross_enrollment_blocked' | 'privacy_gate_participant_private' | 'not_found'
}

export const contextReuseService = {
  /**
   * Localiza elemento de contexto estruturado para reuso no enrollment
   */
  async findReusableContext(query: ContextReuseLookupQuery): Promise<ReusedContextResult> {
    const { enrollmentId, conceptKey, temporality, frameworkId, requestingAccessDestination } =
      query

    if (!enrollmentId || !conceptKey) {
      return { hasMatch: false, isDisplayableToParticipant: false, denialReason: 'not_found' }
    }

    try {
      // 1. Buscar Signals estruturados correspondentes ao concept_key no enrollment
      let filter = `enrollment_id = "${enrollmentId}" && concept_key = "${conceptKey}" && status = "active"`
      if (temporality) {
        filter += ` && temporality = "${temporality}"`
      }
      if (frameworkId) {
        filter += ` && framework_id = "${frameworkId}"`
      }

      const signals = await pb.collection('cer_signals').getFullList<CerSignalRecord>({
        filter,
        sort: '-created',
      })

      if (!signals || signals.length === 0) {
        return { hasMatch: false, isDisplayableToParticipant: false, denialReason: 'not_found' }
      }

      const matchSignal = signals[0]

      // 2. Proteção Cross-Enrollment
      if (matchSignal.enrollment_id !== enrollmentId) {
        return {
          hasMatch: false,
          isDisplayableToParticipant: false,
          denialReason: 'cross_enrollment_blocked',
        }
      }

      const sourceAccessClass = matchSignal.access_class as VisibilityClass
      let sourceResponse: ExperienceResponseRecord | null = null

      if (matchSignal.source_response_id) {
        try {
          sourceResponse = await pb
            .collection('experience_responses')
            .getOne<ExperienceResponseRecord>(matchSignal.source_response_id)
        } catch {
          sourceResponse = null
        }
      }

      // 3. Privacy Gate:
      // Se a fonte for participant_private, ela NUNCA pode ser exibida ou parafraseada
      // em um prompt/contexto com access_destination mais permissivo (ex.: shared_care ou participant_shared).
      // Ela é utilizável apenas para controle de branching/lógica interna (lookup-only).
      const isSourcePrivate = sourceAccessClass === 'participant_private'
      const isTargetMorePermissive =
        requestingAccessDestination && requestingAccessDestination !== 'participant_private'

      let isDisplayable = true
      let denialReason: ReusedContextResult['denialReason'] = undefined

      if (isSourcePrivate && isTargetMorePermissive) {
        isDisplayable = false
        denialReason = 'privacy_gate_participant_private'
      }

      return {
        hasMatch: true,
        sourceSignalId: matchSignal.id,
        sourceResponseId: matchSignal.source_response_id,
        conceptKey: matchSignal.concept_key,
        temporality: matchSignal.temporality,
        sourceAccessClass,
        isDisplayableToParticipant: isDisplayable,
        readOnlyValue: isDisplayable
          ? sourceResponse?.structured_value || matchSignal.concept_key
          : null,
        denialReason,
      }
    } catch {
      return { hasMatch: false, isDisplayableToParticipant: false, denialReason: 'not_found' }
    }
  },

  /**
   * Registra a auditoria REUSED_CONTEXT_PRESENTED quando um contexto reutilizado
   * puro é apresentado ao participante em tela.
   * Regra estrita: metadados puramente técnicos, NUNCA respostas ou texto livre.
   */
  async auditReusedContextPresented(params: {
    actorUserId?: string
    enrollmentId: string
    promptKey: string
    sourceConceptKey: string
    sourceAccessClass: VisibilityClass
  }) {
    try {
      await pb.collection('audit_events').create({
        actor_user_id: params.actorUserId || null,
        action: 'REUSED_CONTEXT_PRESENTED',
        resource_type: 'context_reuse',
        resource_id: params.sourceConceptKey,
        enrollment_id: params.enrollmentId,
        timestamp: new Date().toISOString(),
        result: 'success',
        request_context: 'reused_context_binding',
        metadata: {
          prompt_key: params.promptKey,
          concept_key: params.sourceConceptKey,
          access_class: params.sourceAccessClass,
        },
      })
    } catch {
      // Fail-safe
    }
  },
}
