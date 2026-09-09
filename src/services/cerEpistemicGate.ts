/**
 * Build 06: Epistemic Gate & Validação Epistêmica Server/Client
 *
 * Ontologia existente reutilizada:
 * - KI status: reported | observed | reviewed | updated | withdrawn | new | observing | supported | recognized | not_confirmed | discarded
 * - epistemic_source: participant_report, professional_observation, recurrence_association, framework_reading, pattern_hypothesis, integrative_hypothesis, participant_recognition
 * - Recognition types: makes_sense | partially_makes_sense | does_not_recognize | depends_on_context | wants_to_add
 *
 * REGRAS DE PRIMEIRA PESSOA & DISTÂNCIA EPISTEMOLÓGICA:
 * A. participant_report: primeira pessoa descritiva sem exigir Recognition duplicada
 * B. makes_sense: legitima formulação afirmativa compatível
 * C. partially_makes_sense: permite apenas formulação qualificada/parcial
 * D. depends_on_context: exige formulação contextual
 * E. does_not_recognize: BLOQUEIA formulação afirmativa
 * F. professional_observation: não vira 1ª pessoa afirmativa integral sem Recognition
 * G. recurrence_association / framework_reading: não vira 1ª pessoa integral apenas por estar supported
 * H. pattern_hypothesis / integrative_hypothesis: primeira pessoa afirmativa exige Recognition compatível. supported != recognized!
 *
 * OBSERVING (item 13): observing isolado não sustenta sozinho Map Item publicado como compreensão consolidada.
 * KNOWLEDGE STATUS (item 14): withdrawn, discarded, not_confirmed, new NÃO são elegíveis.
 * SECTION O_QUE_RECONHECI (item 18): exige autoria/recognition participante suficiente.
 */

import {
  CerMapSection,
  CerKnowledgeItemRecord,
  CerParticipantRecognitionRecord,
  CerKnowledgePresentationRecord,
  RecognitionType,
  SignalSourceType,
  KnowledgeStatus,
} from '@/types/cer'

export interface EpistemicEvaluationResult {
  isEligibleForCandidate: boolean
  isEligibleForPublish: boolean
  recommendedSections: CerMapSection[]
  editorialWarning?: string
  blockingReason?: string
  allowFirstPersonAffirmative: boolean
  requiresQualification: boolean
  requiresContextualFormulation: boolean
  requiresFrameworkAttribution?: boolean
  attributionSuggestion?: string
}

export interface CandidateSourcePayload {
  knowledgeItem: CerKnowledgeItemRecord
  latestRecognition?: CerParticipantRecognitionRecord
  presentationContext?: CerKnowledgePresentationRecord
  associatedRecognitions?: CerParticipantRecognitionRecord[]
}

/**
 * Avalia elegibilidade epistemológica determinística de uma fonte para o Mapa CER
 */
export function evaluateEpistemicGate(
  payload: CandidateSourcePayload,
  targetSection?: CerMapSection,
  formulatedText?: string,
): EpistemicEvaluationResult {
  const { knowledgeItem: ki, latestRecognition: recog } = payload

  const kiStatus = ki.status
  const epistemicSource = ki.epistemic_source
  const temporality = ki.temporality
  const frameworkId = ki.framework_id

  // 1. KNOWLEDGE STATUS INELEGÍVEIS (item 14)
  const HARD_PROHIBITED_STATUSES: KnowledgeStatus[] = [
    'withdrawn',
    'discarded',
    'not_confirmed',
    'new',
  ]
  if (HARD_PROHIBITED_STATUSES.includes(kiStatus)) {
    return {
      isEligibleForCandidate: false,
      isEligibleForPublish: false,
      recommendedSections: [],
      blockingReason: `Conhecimento com status "${kiStatus}" não é elegível para o Mapa CER.`,
      allowFirstPersonAffirmative: false,
      requiresQualification: false,
      requiresContextualFormulation: false,
    }
  }

  // 2. PRIVACIDADE PROFISSIONAL (item 17)
  if (ki.access_class === 'professional_private') {
    // Só pode se foi apresentado e reconhecido em shared_care
    const hasSharedRecognition =
      recog &&
      (recog.recognition_type === 'makes_sense' ||
        recog.recognition_type === 'partially_makes_sense')
    if (!hasSharedRecognition) {
      return {
        isEligibleForCandidate: false,
        isEligibleForPublish: false,
        recommendedSections: [],
        blockingReason:
          'Conhecimento de privacidade profissional estrita (professional_private) não pode ser exposto no Mapa sem apresentação e reconhecimento prévio.',
        allowFirstPersonAffirmative: false,
        requiresQualification: false,
        requiresContextualFormulation: false,
      }
    }
  }

  // 3. RECOGNITION TIPO does_not_recognize (item 12E, F14, E8)
  if (recog && recog.recognition_type === 'does_not_recognize') {
    return {
      isEligibleForCandidate: false,
      isEligibleForPublish: false,
      recommendedSections: [],
      blockingReason:
        'A participante indicou não se reconhecer nesta formulação ("does_not_recognize"). Não é permitido usá-la como afirmação no Mapa.',
      allowFirstPersonAffirmative: false,
      requiresQualification: false,
      requiresContextualFormulation: false,
    }
  }

  // 4. Mapeamento de seções candidatas por temporality & tipo
  const recommendedSections: CerMapSection[] = []

  // Natureza x Momento (item 19)
  if (
    temporality === 'recurring' ||
    temporality === 'longitudinal' ||
    temporality === 'historical'
  ) {
    recommendedSections.push('minha_natureza')
    recommendedSections.push('meus_padroes')
    if (temporality === 'historical') {
      recommendedSections.push('minha_historia')
    }
  } else if (temporality === 'current' || temporality === 'context_dependent') {
    recommendedSections.push('meu_momento')
    if (temporality === 'context_dependent') {
      recommendedSections.push('quando_estou_no_meu_eixo')
      recommendedSections.push('quando_saio_do_meu_eixo')
    }
  } else {
    // undetermined ou geral
    recommendedSections.push('meu_momento')
    recommendedSections.push('minha_natureza')
  }

  // Reconhecimento participante
  if (
    recog &&
    (recog.recognition_type === 'makes_sense' ||
      recog.recognition_type === 'partially_makes_sense' ||
      recog.recognition_type === 'wants_to_add')
  ) {
    recommendedSections.push('o_que_reconheci_sobre_mim')
  }

  // 5. OBSERVING (item 13):
  // Pode aparecer como candidato com alerta, mas isolado não publica
  let editorialWarning: string | undefined
  let isEligibleForPublish = true

  if (kiStatus === 'observing') {
    editorialWarning =
      'Elemento em observação ("observing"). Pode ser explorado no rascunho, mas exige legitimação adicional (relato direto da interagente ou reconhecimento) antes da publicação.'
    const hasAdequateRecognition =
      recog &&
      (recog.recognition_type === 'makes_sense' ||
        recog.recognition_type === 'partially_makes_sense' ||
        recog.recognition_type === 'depends_on_context')
    const hasDirectReport = epistemicSource === 'participant_report'
    if (!hasAdequateRecognition && !hasDirectReport) {
      isEligibleForPublish = false
    }
  }

  // 6. FRAMEWORK READINGS (item 20)
  let requiresFrameworkAttribution = false
  let attributionSuggestion: string | undefined
  if (frameworkId || epistemicSource === 'framework_reading') {
    requiresFrameworkAttribution = true
    attributionSuggestion =
      'Este elemento deriva de um referencial teórico/tradicional. Recomenda-se explicitar a perspectiva na formulação (ex.: "Pelo olhar do Ayurveda / da Naturologia...").'
    if (!editorialWarning) {
      editorialWarning = attributionSuggestion
    }
  }

  // 7. DISTÂNCIA EPISTEMOLÓGICA E PRIMEIRA PESSOA (item 12)
  let allowFirstPersonAffirmative = false
  let requiresQualification = false
  let requiresContextualFormulation = false

  // A. Participant report / reported fact
  if (epistemicSource === 'participant_report' || ki.knowledge_type === 'reported_fact') {
    allowFirstPersonAffirmative = true
  }

  // B. Recognition makes_sense
  if (recog?.recognition_type === 'makes_sense') {
    allowFirstPersonAffirmative = true
  }

  // C. Recognition partially_makes_sense
  if (recog?.recognition_type === 'partially_makes_sense') {
    allowFirstPersonAffirmative = false
    requiresQualification = true
    if (!editorialWarning) {
      editorialWarning =
        'A participante indicou reconhecimento parcial ("em parte"). Use uma formulação qualificada, evitando afirmações absolutas.'
    }
  }

  // D. Recognition depends_on_context
  if (recog?.recognition_type === 'depends_on_context' || temporality === 'context_dependent') {
    requiresContextualFormulation = true
    if (!editorialWarning) {
      editorialWarning =
        'Este aspecto é dependente de contexto ("Depende da situação"). Formule com marcas contextuais (ex.: "Em certas fases...", "Quando...").'
    }
  }

  // F. professional_observation / recurrence_association / hypothesis
  // Não viram 1ª pessoa afirmativa integral sem Recognition (supported != recognized)
  const isHypothesisOrObservation =
    epistemicSource === 'professional_observation' ||
    epistemicSource === 'recurrence_association' ||
    epistemicSource === 'cer_integrative_hypothesis' ||
    (epistemicSource as string) === 'pattern_hypothesis' ||
    (epistemicSource as string) === 'integrative_hypothesis' ||
    epistemicSource === 'framework_reading'

  if (isHypothesisOrObservation && (!recog || recog.recognition_type !== 'makes_sense')) {
    allowFirstPersonAffirmative = false
    if (!requiresQualification && !requiresContextualFormulation) {
      requiresQualification = true
    }
  }

  // 8. Seção O_QUE_RECONHECI_SOBRE_MIM (item 18)
  if (targetSection === 'o_que_reconheci_sobre_mim') {
    const hasValidAuthorOrRecog =
      (recog &&
        (recog.recognition_type === 'makes_sense' ||
          recog.recognition_type === 'partially_makes_sense' ||
          recog.recognition_type === 'wants_to_add')) ||
      epistemicSource === 'participant_report' ||
      epistemicSource === 'participant_recognition'

    if (!hasValidAuthorOrRecog) {
      return {
        isEligibleForCandidate: false,
        isEligibleForPublish: false,
        recommendedSections,
        blockingReason:
          'A seção "O que reconheci sobre mim" exige fundamentação em autoria ou reconhecimento expresso da participante.',
        allowFirstPersonAffirmative: false,
        requiresQualification: false,
        requiresContextualFormulation: false,
      }
    }
  }

  return {
    isEligibleForCandidate: true,
    isEligibleForPublish,
    recommendedSections,
    editorialWarning,
    allowFirstPersonAffirmative,
    requiresQualification,
    requiresContextualFormulation,
    requiresFrameworkAttribution,
    attributionSuggestion,
  }
}
