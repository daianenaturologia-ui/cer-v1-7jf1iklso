/**
 * Build 07G — Candidate Synthesis Service
 * Algoritmo determinístico de síntese e elegibilidade para o momento I1
 * e momentos subsequentes da integração da consciência.
 *
 * Regras Constitucionais:
 * 1. VIA A: Mesmo concept_key presente em >= 2 dimensões elegíveis distintas.
 * 2. VIA B: Association canônica já existente (cer_associations), active + temporality current/recurring,
 *    pertencente ao enrollment correto, com provenance completa via cer_association_evidence
 *    (relation_type + signal_id, evidence_group_key) sustentando fontes de DIMENSÕES DIFERENTES.
 * 3. Proibido: string matching; inferência semântica por similaridade de texto; criar Association automaticamente;
 *    IA criar ou modificar Association.
 * 4. Keys diferentes SEM Association canônica NÃO entram em I1 — originam apenas cer_ai_proposals pending_review.
 * 5. Filtros de Recognition:
 *    - does_not_recognize: bloqueia formulação current e torna item inelegível para Map.
 *    - partially_makes_sense: exige formulação qualificada da participante.
 *    - depends_on_context: exige formulação contextual.
 *    - rejeitado: history permanece, current perde currency.
 * 6. Mixed-source / Derived Privacy:
 *    - A formulação herda a classe mais restritiva das fontes que MATERIALMENTE a sustentam.
 *    - Se puder ser produzida somente com fontes shared, não incorpora private.
 *    - Se depender de fonte private, permanece private (nunca revelada para destinos shared).
 * 7. Limite estrito: 2 a 3 formulações determinísticas por tela.
 * 8. Priorização determinística (sem score oculto):
 *    current > recognized > multidimensionalidade > variedade entre dimensões > ausência de redundância.
 */

import type {
  CerSignalRecord,
  CerAssociationRecord,
  CerAssociationEvidenceRecord,
  CerParticipantRecognitionRecord,
  VisibilityClass,
  SignalTemporality,
} from '@/types/cer'
import { NEUTRAL_TEMPLATE_PREFIXES } from './build07gPrompts'

export interface SynthesisSourceEvidence {
  sourceType: 'signal' | 'association' | 'recognition'
  id: string
  dimensionId?: string
  conceptKey: string
  accessClass: VisibilityClass
  temporality: SignalTemporality
  evidenceGroupKey?: string
}

export interface IntegrativeFormulationCandidate {
  id: string
  via: 'VIA_A' | 'VIA_B'
  conceptKey: string
  statement: string
  accessClass: VisibilityClass
  temporality: SignalTemporality
  dimensions: string[]
  evidenceSources: SynthesisSourceEvidence[]
  isRecognized: boolean
  isPartiallyRecognized: boolean
  isContextDependent: boolean
  isRejected: boolean
  qualificationNote?: string
  priorityScore: number // Score determinístico para ordenação (não-clínico)
}

export interface CandidateSynthesisParams {
  enrollmentId: string
  targetAccessClass?: VisibilityClass // Default: 'participant_shared'
  signals?: CerSignalRecord[]
  associations?: (CerAssociationRecord & {
    evidence?: (CerAssociationEvidenceRecord & { signal?: CerSignalRecord })[]
  })[]
  recognitions?: CerParticipantRecognitionRecord[]
  currentResponseIds?: Set<string>
  maxItems?: number // Default: 3
}

/**
 * Calcula a visibilidade mais restritiva entre um conjunto de classes
 * Ordem de restrição: participant_private > shared_care > participant_shared
 */
export function getMostRestrictiveVisibility(classes: VisibilityClass[]): VisibilityClass {
  if (classes.includes('participant_private')) return 'participant_private'
  if (classes.includes('shared_care')) return 'shared_care'
  return 'participant_shared'
}

/**
 * Normaliza o rótulo do conceito em linguagem humana funcional e neutra
 */
export function formatConceptToNaturalText(conceptKey: string): string {
  const map: Record<string, string> = {
    // Recursos
    natureza: 'o contato com a natureza e o ar livre',
    movimento: 'o movimento do corpo e a atividade física',
    silencio: 'o silêncio, a quietude e as pausas',
    cuidado: 'o cuidado e a atenção aos detalhes',
    conversa: 'a escuta atenta e o diálogo verdadeiro',
    arte_expressao: 'a expressão criativa e artística',
    musica: 'a música e a sensibilidade sonora',
    solitude: 'momentos de solitude e respiro',
    // Desafios
    sobrecarga: 'a sensação de sobrecarga diante de muitas demandas',
    autocobranca: 'a autocobrança e a pressa de resolver tudo',
    dificuldade_dizer_nao: 'a dificuldade de estabelecer limites claros',
    tensao_muscular: 'a tensão somática que se acumula no corpo',
    cansaco: 'o cansaço que pede mais tempo de recuperação',
    dispersao: 'a dispersão em momentos de excesso de estímulos',
    // Padrões transversais
    busca_de_espaco: 'a necessidade de recolhimento para clarear as ideias',
    afastamento_sob_pressao: 'a tendência a se afastar quando a pressão aumenta',
    atencao_ao_ritmo: 'a importância de respeitar o próprio ritmo',
  }

  if (map[conceptKey]) return map[conceptKey]

  // Fallback neutro formatando snake_case para frase amigável
  return conceptKey.replace(/_/g, ' ')
}

/**
 * Serviço de Síntese de Candidatos à Integração da Consciência
 */
export const candidateSynthesisService = {
  /**
   * Avalia elegibilidade do quarteto de proteção funcional para o Momento I4:
   * Requisitos: Contexto + Resposta + Função Percebida + Consequência (Custo/Benefício).
   * Sem o quarteto completo, I4 NÃO abre (ausência silenciosa).
   */
  hasProtectiveQuartetEligibility(params: {
    signals?: CerSignalRecord[]
    responses?: { structured_value?: any; prompt_id?: string; concept_key?: string }[]
  }): boolean {
    const { signals = [], responses = [] } = params

    // 1. Verificar em Signals ativos
    const activeSignals = signals.filter((s) => s.status === 'active')
    const signalKeys = new Set(activeSignals.map((s) => s.concept_key))

    const hasContextSignal =
      signalKeys.has('stress_trigger_context') ||
      signalKeys.has('relational_boundary_context') ||
      signalKeys.has('challenge_context') ||
      signalKeys.has('self_disconnection_context')

    const hasResponseSignal =
      signalKeys.has('immediate_response_tendency') ||
      signalKeys.has('enacted_response_pattern') ||
      signalKeys.has('relational_response_pattern') ||
      signalKeys.has('response_pattern')

    const hasFunctionSignal =
      signalKeys.has('perceived_response_function') ||
      signalKeys.has('perceived_protective_benefit') ||
      signalKeys.has('possible_protective_pattern')

    const hasConsequenceSignal =
      signalKeys.has('perceived_short_term_benefit') ||
      signalKeys.has('perceived_protective_cost') ||
      signalKeys.has('response_consequence')

    if (hasContextSignal && hasResponseSignal && hasFunctionSignal && hasConsequenceSignal) {
      return true
    }

    // 2. Verificar em Respostas estruturadas de 07C/07D
    let hasContextResp = false
    let hasResponseResp = false
    let hasFunctionResp = false
    let hasConsequenceResp = false

    for (const r of responses) {
      const sVal = r.structured_value as any
      if (!sVal) continue

      if (
        sVal.trigger_context ||
        sVal.context ||
        r.concept_key === 'stress_trigger_context' ||
        r.concept_key === 'relational_boundary_context'
      ) {
        hasContextResp = true
      }

      if (
        sVal.urge ||
        sVal.enacted ||
        sVal.choice ||
        r.concept_key === 'immediate_response_tendency' ||
        r.concept_key === 'relational_response_pattern'
      ) {
        hasResponseResp = true
      }

      if (
        sVal.function ||
        sVal.perceived_function ||
        r.concept_key === 'perceived_response_function' ||
        r.concept_key === 'possible_protective_pattern'
      ) {
        hasFunctionResp = true
      }

      if (
        sVal.cost ||
        sVal.benefit ||
        sVal.consequence ||
        r.concept_key === 'perceived_short_term_benefit' ||
        r.concept_key === 'perceived_protective_cost'
      ) {
        hasConsequenceResp = true
      }
    }

    return (
      (hasContextSignal || hasContextResp) &&
      (hasResponseSignal || hasResponseResp) &&
      (hasFunctionSignal || hasFunctionResp) &&
      (hasConsequenceSignal || hasConsequenceResp)
    )
  },

  /**
   * Síntese determinística de formulações para o Momento I1.
   * Executa Via A e Via B com rigor e aplica filtros e priorização.
   */
  synthesizeRecurrences(params: CandidateSynthesisParams): IntegrativeFormulationCandidate[] {
    const {
      enrollmentId,
      targetAccessClass = 'participant_shared',
      signals = [],
      associations = [],
      recognitions = [],
      currentResponseIds,
      maxItems = 3,
    } = params

    const candidates: IntegrativeFormulationCandidate[] = []

    // Mapas de recognition para bloqueio ou qualificação
    const doesNotRecognizeConcepts = new Set<string>()
    const partiallyMakesSenseMap = new Map<string, string>() // conceptKey -> comment
    const dependsOnContextMap = new Map<string, string>()

    for (const rec of recognitions) {
      if (rec.enrollment_id !== enrollmentId) continue
      const targetKey = (rec.expand?.knowledge_item_id as any)?.concept_key || rec.knowledge_item_id

      if (rec.recognition_type === 'does_not_recognize') {
        doesNotRecognizeConcepts.add(targetKey)
      } else if (rec.recognition_type === 'partially_makes_sense') {
        partiallyMakesSenseMap.set(targetKey, rec.comment || '')
      } else if (rec.recognition_type === 'depends_on_context') {
        dependsOnContextMap.set(targetKey, rec.comment || '')
      }
    }

    // Filtrar apenas signals ativos e com currency válida (se fornecido currentResponseIds)
    const validSignals = signals.filter((s) => {
      if (s.enrollment_id !== enrollmentId) return false
      if (s.status !== 'active') return false
      if (s.temporality !== 'current' && s.temporality !== 'recurring') return false
      if (currentResponseIds && s.source_response_id) {
        return currentResponseIds.has(s.source_response_id)
      }
      return true
    })

    // ==========================================
    // VIA A: Mesmo concept_key em >= 2 dimensões distintas
    // ==========================================
    const signalsByConcept = new Map<string, CerSignalRecord[]>()
    for (const sig of validSignals) {
      if (!sig.concept_key) continue
      const list = signalsByConcept.get(sig.concept_key) || []
      list.push(sig)
      signalsByConcept.set(sig.concept_key, list)
    }

    for (const [cKey, sigs] of signalsByConcept.entries()) {
      // Bloqueio estrito se o participante rejeitou previamente
      if (doesNotRecognizeConcepts.has(cKey)) continue

      // Coletar dimensões distintas
      const dimensions = Array.from(
        new Set(sigs.map((s) => s.dimension_id).filter((d): d is string => Boolean(d))),
      )

      if (dimensions.length >= 2) {
        // Multi-source privacy: herda a classe mais restritiva
        const sourceClasses = sigs.map((s) => s.access_class as VisibilityClass)
        const mostRestrictive = getMostRestrictiveVisibility(sourceClasses)

        // Se o target for participant_shared mas a síntese exigir private, bloqueia exibição
        if (
          targetAccessClass === 'participant_shared' &&
          mostRestrictive === 'participant_private'
        ) {
          continue
        }

        const isPartial = partiallyMakesSenseMap.has(cKey)
        const isContext = dependsOnContextMap.has(cKey)
        const qualificationNote = isPartial
          ? partiallyMakesSenseMap.get(cKey)
          : isContext
            ? dependsOnContextMap.get(cKey)
            : undefined

        const naturalConcept = formatConceptToNaturalText(cKey)
        let statement = `${NEUTRAL_TEMPLATE_PREFIXES[0]} ${naturalConcept} costuma ter um papel importante.`
        if (isContext) {
          statement = `${statement} (Isso parece depender do contexto vivido).`
        }

        // Prioridade determinística: current(100) + recognized(50) + dims(10 * count)
        const priorityScore = 100 + (isPartial ? 20 : 50) + dimensions.length * 10

        candidates.push({
          id: `cand-via-a-${cKey}`,
          via: 'VIA_A',
          conceptKey: cKey,
          statement,
          accessClass: mostRestrictive,
          temporality: 'current',
          dimensions,
          evidenceSources: sigs.map((s) => ({
            sourceType: 'signal',
            id: s.id,
            dimensionId: s.dimension_id,
            conceptKey: s.concept_key,
            accessClass: s.access_class as VisibilityClass,
            temporality: s.temporality,
          })),
          isRecognized: true,
          isPartiallyRecognized: isPartial,
          isContextDependent: isContext,
          isRejected: false,
          qualificationNote,
          priorityScore,
        })
      }
    }

    // ==========================================
    // VIA B: Association canônica existente (cer_associations)
    // Exigências: active + current/recurring + provenance completa via cer_association_evidence
    // sustentando fontes de DIMENSÕES DIFERENTES
    // ==========================================
    for (const assoc of associations) {
      if (assoc.enrollment_id !== enrollmentId) continue
      if (assoc.status !== 'active') continue // Rejeita archived, superseded, rejected
      if (assoc.temporality !== 'current' && assoc.temporality !== 'recurring') continue

      // Bloqueio se a chave da associação foi rejeitada no recognition
      if (doesNotRecognizeConcepts.has(assoc.concept_key)) continue

      const evidenceItems = assoc.evidence || []
      if (evidenceItems.length === 0) continue

      // Coletar dimensões a partir dos signals de evidência
      const evDimensions = new Set<string>()
      const evClasses: VisibilityClass[] = [assoc.access_class as VisibilityClass]
      const evSources: SynthesisSourceEvidence[] = []

      for (const ev of evidenceItems) {
        const sig = ev.signal
        if (sig && sig.status === 'active') {
          if (sig.dimension_id) evDimensions.add(sig.dimension_id)
          evClasses.push(sig.access_class as VisibilityClass)
          evSources.push({
            sourceType: 'signal',
            id: sig.id,
            dimensionId: sig.dimension_id,
            conceptKey: sig.concept_key,
            accessClass: sig.access_class as VisibilityClass,
            temporality: sig.temporality,
            evidenceGroupKey: ev.evidence_group_key,
          })
        }
      }

      // Via B EXIGE dimensões diferentes nas evidências sustentantes
      if (evDimensions.size >= 2) {
        const mostRestrictive = getMostRestrictiveVisibility(evClasses)

        // Privacy Gate
        if (
          targetAccessClass === 'participant_shared' &&
          mostRestrictive === 'participant_private'
        ) {
          continue
        }

        const isPartial = partiallyMakesSenseMap.has(assoc.concept_key)
        const isContext = dependsOnContextMap.has(assoc.concept_key)

        const naturalConcept = formatConceptToNaturalText(assoc.concept_key)
        const statement = `${NEUTRAL_TEMPLATE_PREFIXES[1]} ${naturalConcept} aparece relacionado a mais de uma dimensão da sua rotina.`

        const priorityScore = 120 + (isPartial ? 15 : 40) + evDimensions.size * 10

        candidates.push({
          id: `cand-via-b-${assoc.id}`,
          via: 'VIA_B',
          conceptKey: assoc.concept_key,
          statement,
          accessClass: mostRestrictive,
          temporality: assoc.temporality,
          dimensions: Array.from(evDimensions),
          evidenceSources: evSources,
          isRecognized: true,
          isPartiallyRecognized: isPartial,
          isContextDependent: isContext,
          isRejected: false,
          qualificationNote: isPartial ? partiallyMakesSenseMap.get(assoc.concept_key) : undefined,
          priorityScore,
        })
      }
    }

    // ==========================================
    // ORDENAÇÃO DETERMINÍSTICA E LIMITE (2–3 CARDS)
    // Prioridade: maior priorityScore > maior variedade de dimensões > ordem determinística de ID
    // ==========================================
    candidates.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore
      }
      if (b.dimensions.length !== a.dimensions.length) {
        return b.dimensions.length - a.dimensions.length
      }
      return a.id.localeCompare(b.id)
    })

    return candidates.slice(0, maxItems)
  },

  /**
   * Avalia trava de IA (AI-G1 a AI-G18):
   * Toda sugestão de inferência ou relação pela IA DEVE nascer em cer_ai_proposals
   * com status 'pending_review' e provenance explícita.
   * A IA NUNCA cria Association diretamente, NUNCA alimenta I1 diretamente
   * e NUNCA cria item no Mapa sem revisão humana.
   */
  validateAiProposalSafety(proposal: {
    status?: string
    proposal_type?: string
    sources?: any[]
    hasHumanReview?: boolean
  }): { isAllowedInParticipantFacing: boolean; reason?: string } {
    if (proposal.status === 'pending_review' || !proposal.hasHumanReview) {
      return {
        isAllowedInParticipantFacing: false,
        reason:
          'TRAVA P0: Sugestão de IA está em pending_review e não pode alimentar interface participant-facing sem revisão profissional prévia.',
      }
    }

    if (!proposal.sources || proposal.sources.length === 0) {
      return {
        isAllowedInParticipantFacing: false,
        reason: 'TRAVA P0: Sugestão de IA sem provenance explícita em cer_ai_proposal_sources.',
      }
    }

    return { isAllowedInParticipantFacing: true }
  },
}
