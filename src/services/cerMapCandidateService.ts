/**
 * Build 06: Deterministic Candidate Service (Item 25)
 *
 * SEM IA, sem chamada a modelo LLM.
 * Agrupa Knowledge elegível do enrollment, busca a Recognition mais recente (imutável histórica),
 * avalia o Epistemic Gate e organiza por seções sugeridas para o profissional.
 */

import pb from '@/lib/pocketbase/client'
import {
  CerMapSection,
  CerKnowledgeItemRecord,
  CerParticipantRecognitionRecord,
  CerKnowledgePresentationRecord,
  CerFrameworkRecord,
} from '@/types/cer'
import {
  evaluateEpistemicGate,
  CandidateSourcePayload,
  EpistemicEvaluationResult,
} from './cerEpistemicGate'

export interface MapCandidateItem {
  id: string
  knowledgeItem: CerKnowledgeItemRecord
  latestRecognition?: CerParticipantRecognitionRecord
  presentationContext?: CerKnowledgePresentationRecord
  framework?: CerFrameworkRecord
  evaluation: EpistemicEvaluationResult
  sourceContextSummary: string
  eligibilityReason: string
}

export interface CandidateGroupingBySection {
  section: CerMapSection
  candidates: MapCandidateItem[]
}

export const cerMapCandidateService = {
  /**
   * Lista candidatos determinísticos para o profissional sem modelo de IA
   */
  async listCandidatesForEnrollment(enrollmentId: string): Promise<MapCandidateItem[]> {
    if (!enrollmentId) return []

    // 1. Buscar todos os KIs do enrollment
    const kis = await pb.collection('cer_knowledge_items').getFullList<CerKnowledgeItemRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      sort: '-created',
      expand: 'framework_id',
    })

    // 2. Buscar todas as recognitions do enrollment (para pegar a mais recente por KI)
    const recognitions = await pb
      .collection('cer_participant_recognitions')
      .getFullList<CerParticipantRecognitionRecord>({
        filter: `enrollment_id = "${enrollmentId}"`,
        sort: '-created',
        expand: 'presentation_id',
      })

    // 3. Mapear recognition mais recente por knowledge_item_id
    const latestRecogByKi = new Map<string, CerParticipantRecognitionRecord>()
    for (const r of recognitions) {
      if (!latestRecogByKi.has(r.knowledge_item_id)) {
        latestRecogByKi.set(r.knowledge_item_id, r)
      }
    }

    const candidateList: MapCandidateItem[] = []

    for (const ki of kis) {
      const latestRecog = latestRecogByKi.get(ki.id)
      const presContext = latestRecog?.expand?.presentation_id

      const payload: CandidateSourcePayload = {
        knowledgeItem: ki,
        latestRecognition: latestRecog,
        presentationContext: presContext,
      }

      const evaluation = evaluateEpistemicGate(payload)

      // Se for candidato elegível
      if (evaluation.isEligibleForCandidate) {
        let sourceContextSummary = `Fonte: ${ki.epistemic_source || 'relato'}`
        if (latestRecog) {
          sourceContextSummary += ` • Reconhecimento: ${latestRecog.recognition_type}`
        }
        if (ki.expand?.framework_id) {
          sourceContextSummary += ` • Referencial: ${ki.expand.framework_id.name}`
        }

        let eligibilityReason = 'Elemento de conhecimento consistente com a jornada'
        if (ki.status === 'observing') {
          eligibilityReason = 'Em observação — exige legitimação adicional antes da publicação'
        } else if (latestRecog?.recognition_type === 'makes_sense') {
          eligibilityReason = 'Acolhido pela participante com reconhecimento pleno ("faz sentido")'
        } else if (latestRecog?.recognition_type === 'partially_makes_sense') {
          eligibilityReason = 'Reconhecido parcialmente pela participante'
        } else if (ki.epistemic_source === 'participant_report') {
          eligibilityReason = 'Relatado diretamente pela participante'
        }

        candidateList.push({
          id: ki.id,
          knowledgeItem: ki,
          latestRecognition: latestRecog,
          presentationContext: presContext,
          framework: ki.expand?.framework_id,
          evaluation,
          sourceContextSummary,
          eligibilityReason,
        })
      }
    }

    return candidateList
  },

  /**
   * Agrupa candidatos pelas seções recomendadas
   */
  groupBySections(candidates: MapCandidateItem[]): CandidateGroupingBySection[] {
    const sectionMap = new Map<CerMapSection, MapCandidateItem[]>()

    for (const cand of candidates) {
      for (const sec of cand.evaluation.recommendedSections) {
        if (!sectionMap.has(sec)) {
          sectionMap.set(sec, [])
        }
        sectionMap.get(sec)!.push(cand)
      }
    }

    const result: CandidateGroupingBySection[] = []
    sectionMap.forEach((cands, section) => {
      result.push({ section, candidates: cands })
    })

    return result
  },
}
