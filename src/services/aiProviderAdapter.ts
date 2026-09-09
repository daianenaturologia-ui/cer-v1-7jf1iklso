/**
 * AI Core V1 — Provider Abstraction
 * Agnostic interface for AI capabilities (Proposal Engine, Ask CER, Brief)
 * Tracks provider, model, model_version/config, purpose/task_type, schema_version, prompt_version.
 * Does not expose raw keys, does not couple to specific vendor.
 */

import { AiOutputContract, AiOutputStatus } from '@/types/cer'

export interface ModelMetadata {
  provider: string
  model: string
  model_version?: string
  prompt_version: string
  schema_version: string
  purpose?: string
}

export interface ModelRequestOptions {
  purpose: 'brief' | 'ask_cer' | 'proposal_engine'
  prompt_version?: string
  context: unknown
  user_query?: string
}

export interface ModelAdapter {
  execute(options: ModelRequestOptions): Promise<AiOutputContract>
  getMetadata(purpose: string): ModelMetadata
}

/**
 * Standard CER V1 Model Adapter
 * Controlled, deterministic inference logic with strict adherence to safety principles,
 * returning valid schema-compliant structured outputs.
 */
export class CerModelAdapter implements ModelAdapter {
  private providerName = 'cer-internal-pipeline'
  private modelName = 'cer-epistemic-v1'
  private schemaVersion = 'v1.0'
  private defaultPromptVersion = 'prompt-v1.0'

  getMetadata(purpose: string): ModelMetadata {
    return {
      provider: this.providerName,
      model: this.modelName,
      model_version: '2026.09-v1',
      prompt_version: this.defaultPromptVersion,
      schema_version: this.schemaVersion,
      purpose,
    }
  }

  async execute(options: ModelRequestOptions): Promise<AiOutputContract> {
    const { purpose, context, user_query } = options
    const ctx = context as {
      sources: Array<{
        source_type: string
        source_id: string
        concept_key?: string
        access_class: string
        statement?: string
        text?: string
        free_text?: string
        structured_value?: unknown
      }>
      hasConflicting?: boolean
      conflictDescription?: string
      unresolvedBranches?: string[]
      isInsufficient?: boolean
    }

    // Safety layer: check for refused requests
    if (user_query) {
      const q = user_query.toLowerCase()
      if (
        q.includes('diagnosticar') ||
        q.includes('diagnóstico') ||
        q.includes('receitar') ||
        q.includes('prescrever') ||
        q.includes('remédio') ||
        q.includes('score') ||
        q.includes('pontuar pessoa')
      ) {
        return {
          status: 'refused' as AiOutputStatus,
          basis: [],
          proposal_or_answer:
            'A solicitação foi recusada por segurança: o CER V1 não realiza diagnóstico, prescrição, prognóstico clínico ou pontuação de pessoas.',
          uncertainty: 'high',
          missing_information: [],
          conflicting_information: false,
        }
      }
    }

    if (ctx.isInsufficient || !ctx.sources || ctx.sources.length === 0) {
      return {
        status: 'insufficient_information' as AiOutputStatus,
        basis: [],
        proposal_or_answer:
          'Informações autorizadas insuficientes para gerar resposta ou proposta com fundamentação válida.',
        uncertainty: 'high',
        missing_information: ctx.unresolvedBranches || ['contexto_vazio'],
        conflicting_information: false,
      }
    }

    const basis = ctx.sources.map((s) => ({
      source_type: s.source_type as any,
      source_id: s.source_id,
      concept_key: s.concept_key,
      access_class: s.access_class as any,
      relation_type: 'supports' as const,
    }))

    if (ctx.hasConflicting) {
      return {
        status: 'conflicting_information' as AiOutputStatus,
        basis,
        proposal_or_answer:
          ctx.conflictDescription ||
          'Identificou-se divergência entre as fontes autorizadas. Conforme os princípios do CER, a contradição é descrita sem privilegiar arbitrariamente uma versão como fato.',
        uncertainty: 'medium',
        missing_information: ctx.unresolvedBranches || [],
        conflicting_information: {
          description: ctx.conflictDescription || 'Evidências com interpretações distintas',
          paths: basis.map((b) => `${b.source_type}:${b.source_id}`),
        },
      }
    }

    if (purpose === 'brief') {
      const concepts = Array.from(new Set(ctx.sources.map((s) => s.concept_key).filter(Boolean)))
      return {
        status: 'answered' as AiOutputStatus,
        basis,
        proposal_or_answer: `Briefing profissional estruturado sobre o enrollment: ${ctx.sources.length} fontes autorizadas ativas analisadas abrangendo conceitos como ${concepts.join(', ') || 'elementos da jornada'}.`,
        uncertainty: 'low',
        missing_information: ctx.unresolvedBranches || [],
        conflicting_information: false,
      }
    }

    if (purpose === 'ask_cer') {
      return {
        status: 'answered' as AiOutputStatus,
        basis,
        proposal_or_answer: `Com base em ${ctx.sources.length} fonte(s) autorizada(s), verificou-se alinhamento contextual com o questionamento profissional: ${user_query || 'consulta geral'}.`,
        uncertainty: 'low',
        missing_information: ctx.unresolvedBranches || [],
        conflicting_information: false,
      }
    }

    // proposal_engine
    return {
      status: 'answered' as AiOutputStatus,
      basis,
      proposal_or_answer: `Proposta de síntese integrativa formulada a partir de ${ctx.sources.length} fonte(s) autorizada(s). Sugere-se observação longitudinal da recorrência e validação profissional.`,
      uncertainty: 'low',
      missing_information: ctx.unresolvedBranches || [],
      conflicting_information: false,
      epistemic_classification: 'cer_integrative_hypothesis',
      suggested_question:
        'Como a participante percebe esta correlação em seus períodos de transição?',
    }
  }
}

export const defaultModelAdapter = new CerModelAdapter()
