/**
 * Build 05: Core Services for AI V1
 *
 * 1. Professional Brief (Efêmero, sem persistência de brief gerado cru, só audit metadata)
 * 2. Ask CER (Efêmero, sem persistência de Q&A crua, status explícitos, sources autorizadas)
 * 3. Proposal Engine (Inferencial, persistente em cer_ai_proposals + cer_ai_proposal_sources)
 * 4. Proposal Review Service (Aprovação, Edição+Aprovação, Descarte, Observação)
 */

import pb from '@/lib/pocketbase/client'
import { AiOutputContract, AiProposalType, AiReviewAction, CerAiProposalRecord } from '@/types/cer'
import { resolveAuthorizedContext, auditAiEvent } from './aiContextResolver'
import { defaultModelAdapter } from './aiProviderAdapter'

export interface AskCerParams {
  humanUserId: string
  enrollmentId: string
  question: string
  requestedCategories?: Array<
    | 'experience_responses'
    | 'cer_signals'
    | 'cer_associations'
    | 'cer_knowledge_items'
    | 'cer_participant_recognitions'
    | 'cer_session_observations'
  >
}

export interface ProfessionalBriefParams {
  humanUserId: string
  enrollmentId: string
  focusArea?: string
}

export interface GenerateProposalParams {
  humanUserId: string
  enrollmentId: string
  proposalType: AiProposalType
  frameworkId?: string
  targetKnowledgeItemId?: string
  targetAssociationId?: string
  rootEntity?: {
    type: 'knowledge_item' | 'association' | 'signal'
    id: string
  }
}

export interface ReviewProposalParams {
  humanUserId: string
  proposalId: string
  action: AiReviewAction
  editedText?: string
}

export const cerAiCoreService = {
  /**
   * Capacidade A: Professional Brief
   * Output estritamente efêmero. Apenas auditoria de metadata técnica.
   */
  async generateBrief(params: ProfessionalBriefParams): Promise<AiOutputContract> {
    const { humanUserId, enrollmentId, focusArea } = params

    // 1. Resolver contexto autorizado
    const ctx = await resolveAuthorizedContext({
      humanUserId,
      enrollmentId,
      purpose: 'brief',
    })

    if (!ctx.isAuthorized) {
      return {
        status: 'refused',
        basis: [],
        proposal_or_answer: ctx.failureReason || 'Acesso não autorizado ao enrollment.',
        uncertainty: 'high',
        missing_information: ['autorização_negada'],
        conflicting_information: false,
      }
    }

    if (ctx.sources.length === 0) {
      return {
        status: 'insufficient_information',
        basis: [],
        proposal_or_answer:
          'Não há fontes autorizadas disponíveis para este enrollment para compor um Professional Brief.',
        uncertainty: 'high',
        missing_information: ['dados_insuficientes'],
        conflicting_information: false,
      }
    }

    // 2. Chamar adapter do modelo (efêmero)
    const modelRes = await defaultModelAdapter.execute({
      purpose: 'brief',
      context: {
        sources: ctx.sources,
        hasConflicting: ctx.hasConflicting,
        conflictDescription: ctx.conflictDescription,
        unresolvedBranches: ctx.unresolvedBranches,
      },
      user_query: focusArea,
    })

    // Output efêmero retornado diretamente ao chamador
    return modelRes
  },

  /**
   * Capacidade B: Ask CER
   * Output efêmero. Nunca persiste Q&A crua. Source refs obrigatórios.
   */
  async askCer(params: AskCerParams): Promise<AiOutputContract> {
    const { humanUserId, enrollmentId, question, requestedCategories } = params

    // 1. Resolver contexto autorizado
    const ctx = await resolveAuthorizedContext({
      humanUserId,
      enrollmentId,
      purpose: 'ask_cer',
      requestedCategories: requestedCategories as any,
    })

    if (!ctx.isAuthorized) {
      return {
        status: 'refused',
        basis: [],
        proposal_or_answer: ctx.failureReason || 'Acesso não autorizado ao enrollment.',
        uncertainty: 'high',
        missing_information: ['autorização_negada'],
        conflicting_information: false,
      }
    }

    if (ctx.sources.length === 0) {
      return {
        status: 'insufficient_information',
        basis: [],
        proposal_or_answer:
          'Não há informações autorizadas suficientes para responder a esta consulta profissional.',
        uncertainty: 'high',
        missing_information: ['nenhuma_fonte_disponivel'],
        conflicting_information: false,
      }
    }

    // 2. Chamar adapter do modelo
    const modelRes = await defaultModelAdapter.execute({
      purpose: 'ask_cer',
      context: {
        sources: ctx.sources,
        hasConflicting: ctx.hasConflicting,
        conflictDescription: ctx.conflictDescription,
        unresolvedBranches: ctx.unresolvedBranches,
      },
      user_query: question,
    })

    return modelRes
  },

  /**
   * Capacidade C: Proposal Engine
   * Inferencial, persistente. Só gera Proposal com sources autorizadas válidas.
   * Se fonte necessária não puder ser resolvida ou privacy violada -> não persiste, retorna insufficient_information.
   */
  async generateProposal(
    params: GenerateProposalParams,
  ): Promise<{ proposal?: CerAiProposalRecord; output: AiOutputContract }> {
    const {
      humanUserId,
      enrollmentId,
      proposalType,
      frameworkId,
      targetKnowledgeItemId,
      targetAssociationId,
      rootEntity,
    } = params

    // 1. Resolver contexto autorizado
    const ctx = await resolveAuthorizedContext({
      humanUserId,
      enrollmentId,
      purpose: 'proposal_engine',
      rootEntity,
    })

    if (!ctx.isAuthorized) {
      const output: AiOutputContract = {
        status: 'refused',
        basis: [],
        proposal_or_answer: ctx.failureReason || 'Acesso não autorizado.',
        uncertainty: 'high',
        missing_information: ['autorização_negada'],
        conflicting_information: false,
      }
      return { output }
    }

    // Unresolved Source Policy (item 7):
    // Proposal inferencial: se fonte necessária não puder ser resolvida -> NÃO persistir, retornar insufficient_information.
    if (ctx.sources.length === 0 || ctx.unresolvedBranches.length > 0) {
      const output: AiOutputContract = {
        status: 'insufficient_information',
        basis: [],
        proposal_or_answer:
          'A Proposal não pôde ser gerada pois há ramos de evidência não resolvidos, ausentes ou com privacidade restrita.',
        uncertainty: 'high',
        missing_information:
          ctx.unresolvedBranches.length > 0 ? ctx.unresolvedBranches : ['sem_fontes'],
        conflicting_information: false,
      }
      return { output }
    }

    // 2. Executar modelo
    const meta = defaultModelAdapter.getMetadata('proposal_engine')
    const modelRes = await defaultModelAdapter.execute({
      purpose: 'proposal_engine',
      context: {
        sources: ctx.sources,
        hasConflicting: ctx.hasConflicting,
        conflictDescription: ctx.conflictDescription,
        unresolvedBranches: ctx.unresolvedBranches,
      },
    })

    if (modelRes.status !== 'answered') {
      return { output: modelRes }
    }

    // 3. Persistir Proposal em cer_ai_proposals
    const proposalData = {
      enrollment_id: enrollmentId,
      requested_by_user_id: humanUserId,
      proposal_type: proposalType,
      proposal_text: modelRes.proposal_or_answer,
      status: 'pending_review',
      framework_id: frameworkId || undefined,
      target_knowledge_item_id: targetKnowledgeItemId || undefined,
      target_association_id: targetAssociationId || undefined,
      purpose: 'proposal_engine',
      model_metadata: meta,
    }

    const createdProp = await pb
      .collection('cer_ai_proposals')
      .create<CerAiProposalRecord>(proposalData)

    // 4. Persistir Proposal Sources em cer_ai_proposal_sources
    for (const b of modelRes.basis) {
      try {
        await pb.collection('cer_ai_proposal_sources').create({
          proposal_id: createdProp.id,
          source_type: b.source_type,
          source_id: b.source_id,
          source_version: b.source_version,
          relation_type: b.relation_type || 'supports',
          access_class: b.access_class,
        })
      } catch (srcErr) {
        console.warn('Erro ao registrar Proposal Source:', srcErr)
      }
    }

    // Retornar com expand de sources
    const fullProposal = await pb
      .collection('cer_ai_proposals')
      .getOne<CerAiProposalRecord>(createdProp.id, {
        expand: 'cer_ai_proposal_sources_via_proposal_id,framework_id',
      })

    return {
      proposal: fullProposal,
      output: modelRes,
    }
  },

  /**
   * Revisão profissional da Proposal
   * approved | edited_and_approved | discarded | observing
   */
  async reviewProposal(params: ReviewProposalParams): Promise<CerAiProposalRecord> {
    const { humanUserId, proposalId, action, editedText } = params

    // A action determina o status final
    let status: 'approved' | 'discarded' | 'observing' = 'observing'
    if (action === 'approved' || action === 'edited_and_approved') {
      status = 'approved'
    } else if (action === 'discarded') {
      status = 'discarded'
    } else if (action === 'observing') {
      status = 'observing'
    }

    const updatePayload: Record<string, any> = {
      status,
      review_action: action,
      reviewed_by_user_id: humanUserId,
      reviewed_at: new Date().toISOString(),
    }

    if (action === 'edited_and_approved' && editedText) {
      updatePayload.edited_text = editedText
    }

    const updated = await pb
      .collection('cer_ai_proposals')
      .update<CerAiProposalRecord>(proposalId, updatePayload)

    return updated
  },

  /**
   * Buscar Proposals de um enrollment para o profissional
   */
  async listProposals(enrollmentId: string): Promise<CerAiProposalRecord[]> {
    try {
      const records = await pb.collection('cer_ai_proposals').getFullList<CerAiProposalRecord>({
        filter: `enrollment_id = "${enrollmentId}"`,
        sort: '-created',
        expand: 'cer_ai_proposal_sources_via_proposal_id,framework_id,target_knowledge_item_id',
      })
      return records
    } catch {
      return []
    }
  },
}
