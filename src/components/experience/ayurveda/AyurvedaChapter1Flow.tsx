import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Eye, Sparkles } from 'lucide-react'
import {
  AyurvedaChapter1State,
  AYV_C1_PROMPTS,
  AYV_TEXTS,
  AyurvedaCanonicalResponseMetadata,
  AYURVEDA_EXPERIENCE_VERSION,
  deriveChapter1Status,
  AyurvedaChapter1Status,
  createChapter1Revision,
  repairIncompleteChapter1Revision,
  migrateLegacyChapter1Responses,
  getChapter1RevisionPromptId,
  getChapter1BasePromptId,
  getPersistedActiveChapter1Revision,
  setPersistedActiveChapter1Revision,
  getChapter1ResponseRevisionNumber,
} from '@/services/ayurvedaChapter1'
import {
  deriveChapter2Status,
  AyurvedaChapter2Status,
  Chapter2TreatmentVariant,
} from '@/services/ayurvedaChapter2'
import { AvatarPresentation } from '@/services/avatarCompositor'
import { AyurvedaChapter2Flow } from './AyurvedaChapter2Flow'
import { AyurvedaChaptersHub } from './AyurvedaChaptersHub'
import { AyurvedaPostAvatarTransition } from './AyurvedaPostAvatarTransition'
import { AyurvedaChapter1Opening } from './AyurvedaChapter1Opening'
import { AyurvedaTela1Structure } from './AyurvedaTela1Structure'
import { AyurvedaTela2Skin } from './AyurvedaTela2Skin'
import { AyurvedaTela3Hair } from './AyurvedaTela3Hair'
import { AyurvedaTela4Temperature } from './AyurvedaTela4Temperature'
import { AyurvedaTela5Habits } from './AyurvedaTela5Habits'
import { AyurvedaClosing } from './AyurvedaClosing'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
import { ExperienceResponseRecord, EnrollmentExperienceRecord } from '@/types/cer'

export interface AyurvedaChapter1FlowProps {
  enrollmentId: string
  experienceId: string
  respondentUserId: string
  userPresentation?: AvatarPresentation
  avatarDeferred?: boolean
  initialShowPostAvatarTransition?: boolean
  mode?: 'intro' | 'answering' | 'ready_to_complete' | 'completed' | 'review' | 'correcting' | 'hub'
  revisionNumber?: number
  initialStep?: number
  onExitToHub?: () => void
  onEnterReview?: () => void
  onExitReview?: () => void
  onStartCorrection?: () => void
  onClose?: () => void
  onCompleted?: () => void
  onOpenAvatarCustomization?: () => void
}

type Chapter1Stage =
  | 'hub'
  | 'post_avatar_transition'
  | 'opening'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'step5'
  | 'closing'
  | 'chapter2_flow'

export const AyurvedaChapter1Flow: React.FC<AyurvedaChapter1FlowProps> = ({
  enrollmentId,
  experienceId,
  respondentUserId,
  userPresentation = 'feminine',
  avatarDeferred = false,
  initialShowPostAvatarTransition = false,
  mode,
  revisionNumber: propRevisionNumber,
  initialStep,
  onExitToHub,
  onEnterReview,
  onExitReview,
  onStartCorrection,
  onClose,
  onCompleted,
  onOpenAvatarCustomization,
}) => {
  // Inicialização do estágio subordinada ao prop mode/initialStep
  const resolveInitialStage = (): Chapter1Stage => {
    if (mode === 'review' || mode === 'correcting') {
      const stepMap: Record<number, Chapter1Stage> = {
        1: 'step1',
        2: 'step2',
        3: 'step3',
        4: 'step4',
        5: 'step5',
      }
      return stepMap[initialStep || 1] || 'step1'
    }
    if (mode === 'ready_to_complete' || mode === 'completed') {
      return 'closing'
    }
    if (mode === 'answering') {
      const stepMap: Record<number, Chapter1Stage> = {
        1: 'step1',
        2: 'step2',
        3: 'step3',
        4: 'step4',
        5: 'step5',
      }
      return stepMap[initialStep || 1] || 'step1'
    }
    if (mode === 'intro') {
      return 'opening'
    }
    if (initialShowPostAvatarTransition) {
      return 'post_avatar_transition'
    }
    return 'hub'
  }

  const [stage, setStage] = useState<Chapter1Stage>(resolveInitialStage)
  const [internalMode, setInternalMode] = useState<AyurvedaChapter1FlowProps['mode']>(mode)

  // Derivação estrita da permissão de edição a partir da prop canônica mode
  const isReviewOnly = mode ? mode === 'review' : internalMode === 'review'

  const [activeRevision, setActiveRevision] = useState<number>(() => {
    return propRevisionNumber ?? getPersistedActiveChapter1Revision(enrollmentId) ?? 1
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [correctionError, setCorrectionError] = useState<string | null>(null)
  const [enrollmentExp, setEnrollmentExp] = useState<EnrollmentExperienceRecord | null>(null)

  // Estado das respostas do Capítulo 1
  const [chapterState, setChapterState] = useState<AyurvedaChapter1State>({})
  const [rawResponses, setRawResponses] = useState<ExperienceResponseRecord[]>([])

  // Sincronizar caso o mode externo mude
  useEffect(() => {
    if (mode) {
      setInternalMode(mode)
    }
    if (mode === 'review') {
      if (stage === 'hub' || stage === 'opening') {
        setStage('step1')
      }
    } else if (mode === 'correcting') {
      if (stage === 'hub' || stage === 'opening') {
        setStage('step1')
      }
    } else if (mode === 'ready_to_complete' || mode === 'completed') {
      setStage('closing')
    } else if (mode === 'intro') {
      setStage('opening')
    } else if (mode === 'answering' && initialStep) {
      const stepMap: Record<number, Chapter1Stage> = {
        1: 'step1',
        2: 'step2',
        3: 'step3',
        4: 'step4',
        5: 'step5',
      }
      setStage(stepMap[initialStep] || 'step1')
    }
  }, [mode, initialStep])

  useEffect(() => {
    if (propRevisionNumber && propRevisionNumber !== activeRevision) {
      setActiveRevision(propRevisionNumber)
    }
  }, [propRevisionNumber])

  // Helper para preencher chapterState a partir de respostas de uma revisão específica
  const applyResponsesToState = (responses: ExperienceResponseRecord[], targetRevision: number) => {
    const loadedState: AyurvedaChapter1State = {}

    // Filtrar apenas respostas pertencentes à targetRevision (ou fallback na maior <= targetRevision)
    const matchingResponses = responses.filter(
      (r) => getChapter1ResponseRevisionNumber(r) === targetRevision,
    )
    const listToApply =
      matchingResponses.length > 0
        ? matchingResponses
        : responses.filter((r) => getChapter1ResponseRevisionNumber(r) <= targetRevision)

    for (const r of listToApply) {
      const sVal = r.structured_value as any
      const rawPromptId = (r as any).prompt_id || (r as any).canonical_prompt_id
      const basePromptId = getChapter1BasePromptId(rawPromptId || '')
      const pKey = (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key
      const basePromptKey = getChapter1BasePromptId(pKey || '')

      if (
        basePromptId === AYV_C1_PROMPTS.P1_STRUCTURE.id ||
        basePromptKey === AYV_C1_PROMPTS.P1_STRUCTURE.key
      ) {
        loadedState.structure_choice = sVal?.value || sVal?.choice || sVal?.structure_choice
        loadedState.secondary_structure_choice =
          sVal?.secondary_choice || sVal?.secondaryStructureChoice
      } else if (
        basePromptId === AYV_C1_PROMPTS.P1_DURATION.id ||
        basePromptKey === AYV_C1_PROMPTS.P1_DURATION.key
      ) {
        loadedState.structure_duration = sVal?.value || sVal?.choice || sVal?.durationChoice
      } else if (
        basePromptId === AYV_C1_PROMPTS.P2_SKIN.id ||
        basePromptKey === AYV_C1_PROMPTS.P2_SKIN.key
      ) {
        loadedState.skin_choices = Array.isArray(sVal?.selectedOptionIds)
          ? sVal.selectedOptionIds
          : Array.isArray(sVal?.value)
            ? sVal.value
            : Array.isArray(sVal)
              ? sVal
              : sVal?.choice
                ? [sVal.choice]
                : []
      } else if (
        basePromptId === AYV_C1_PROMPTS.P3_HAIR.id ||
        basePromptKey === AYV_C1_PROMPTS.P3_HAIR.key
      ) {
        loadedState.hair_choices = Array.isArray(sVal?.selectedOptionIds)
          ? sVal.selectedOptionIds
          : Array.isArray(sVal?.value)
            ? sVal.value
            : Array.isArray(sVal)
              ? sVal
              : sVal?.choice
                ? [sVal.choice]
                : []
      } else if (
        basePromptId === AYV_C1_PROMPTS.P4_TEMPERATURE.id ||
        basePromptKey === AYV_C1_PROMPTS.P4_TEMPERATURE.key
      ) {
        loadedState.temperature_choice = sVal?.value || sVal?.choice
      } else if (
        basePromptId === AYV_C1_PROMPTS.P5_THIRST.id ||
        basePromptKey === AYV_C1_PROMPTS.P5_THIRST.key
      ) {
        loadedState.thirst_choice = sVal?.value || sVal?.choice
      } else if (
        basePromptId === AYV_C1_PROMPTS.P5_DRINK_TEMP.id ||
        basePromptKey === AYV_C1_PROMPTS.P5_DRINK_TEMP.key
      ) {
        loadedState.drink_temperature_choice = sVal?.value || sVal?.choice
      } else if (
        basePromptId === AYV_C1_PROMPTS.P5_SWEAT.id ||
        basePromptKey === AYV_C1_PROMPTS.P5_SWEAT.key
      ) {
        loadedState.sweat_choice = sVal?.value || sVal?.choice
      }
    }

    setChapterState(loadedState)
  }

  // Carregar respostas existentes com IDs canônicos AYV_C1 e migração idempotente
  const loadResponses = async () => {
    setLoading(true)
    try {
      const enrList = await enrollmentExperienceService.listByEnrollment(enrollmentId)
      const currentEnrExp = enrList.find(
        (e) =>
          e.experience_id === experienceId || (e as any).expand?.experience_id?.id === experienceId,
      )
      if (currentEnrExp) {
        setEnrollmentExp(currentEnrExp)
      }

      const responses = await experienceResponseService.listResponsesByExperience(
        enrollmentId,
        experienceId,
      )
      const { migratedResponses } = migrateLegacyChapter1Responses(responses)
      setRawResponses(migratedResponses)

      // Identificar revisão ativa
      let targetRev = propRevisionNumber ?? getPersistedActiveChapter1Revision(enrollmentId)
      if (!targetRev) {
        let maxRev = 1
        for (const r of migratedResponses) {
          const rev = getChapter1ResponseRevisionNumber(r)
          if (rev > maxRev) maxRev = rev
        }
        targetRev = maxRev
      }
      setActiveRevision(targetRev)

      // Se estamos em modo correcting (ou revisão > 1 sem conclusão), executar reparo idempotente se parcial
      if (mode === 'correcting' || targetRev > 1) {
        try {
          const repairResult = await repairIncompleteChapter1Revision({
            existingResponses: migratedResponses,
            enrollmentId,
            experienceId,
            respondentUserId,
            targetActiveRevision: targetRev,
            saveResponseFn: experienceResponseService.saveResponse,
          })
          if (repairResult.repaired) {
            const freshAfterRepair = await experienceResponseService.listResponsesByExperience(
              enrollmentId,
              experienceId,
            )
            const { migratedResponses: finalMigrated } =
              migrateLegacyChapter1Responses(freshAfterRepair)
            setRawResponses(finalMigrated)
            applyResponsesToState(finalMigrated, targetRev)
            return
          }
        } catch (repairErr) {
          console.warn('Reparo automático de C1 ignorado ou sem revisão anterior:', repairErr)
        }
      }

      applyResponsesToState(migratedResponses, targetRev)
    } catch (err) {
      console.error('Erro ao carregar respostas do Capítulo 1:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResponses()
  }, [enrollmentId, experienceId])

  // Derivação canônica explícita do Capítulo 1 para a revisão ativa
  const derived = deriveChapter1Status(rawResponses, activeRevision)
  const isCompleted = derived.status === 'completed'
  const isReadyToComplete = derived.status === 'ready_to_complete'
  const chapter1Status: AyurvedaChapter1Status = derived.status
  const chapter1Progress = derived.progress
  const answeredStepsCount = derived.answeredStepsCount
  const totalSteps = derived.totalSteps
  const firstUnansweredStep = derived.firstUnansweredStep

  // Derivação canônica explícita do Capítulo 2
  const derivedC2 = deriveChapter2Status(rawResponses)
  const chapter2Status: AyurvedaChapter2Status = derivedC2.status
  const chapter2Progress = derivedC2.progress
  const answeredMomentsCountC2 = derivedC2.answeredMomentsCount
  const totalMomentsC2 = derivedC2.totalMoments

  const treatmentVariant: Chapter2TreatmentVariant =
    userPresentation === 'feminine'
      ? 'feminino'
      : userPresentation === 'masculine'
        ? 'masculino'
        : 'neutro'

  // Retomada inteligente: prioriza a primeira etapa não respondida calculada canonicamente
  const currentStepNum = firstUnansweredStep || enrollmentExp?.current_step_order || 1

  // Salvar Tela 1
  const handleSaveStep1 = async (data: {
    structureChoice?: string
    secondaryStructureChoice?: string
    durationChoice?: string
  }) => {
    setChapterState((prev) => ({
      ...prev,
      structure_choice: data.structureChoice,
      secondary_structure_choice: data.secondaryStructureChoice,
      structure_duration: data.durationChoice,
    }))

    if (isReviewOnly) return

    const physicalStructureId = getChapter1RevisionPromptId(
      AYV_C1_PROMPTS.P1_STRUCTURE.id,
      activeRevision,
    )
    const physicalDurationId = getChapter1RevisionPromptId(
      AYV_C1_PROMPTS.P1_DURATION.id,
      activeRevision,
    )

    if (data.structureChoice) {
      const isUnsure = data.structureChoice === 'dont_know'
      const isRefusal = data.structureChoice === 'refusal'
      const isChanged = data.structureChoice === 'changed_lot'
      const meta: AyurvedaCanonicalResponseMetadata = {
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        domain: 'ayurveda',
        option_ids: [
          data.structureChoice,
          ...(data.secondaryStructureChoice ? [data.secondaryStructureChoice] : []),
        ],
        time_layer: 'stable_history',
        stability: isChanged ? 'changed' : isUnsure ? 'uncertain' : 'long_term',
        source: 'participant_self_report',
        historical_confidence: isChanged || isUnsure ? 'low' : 'high',
        explicit_unsure: isUnsure,
        explicit_refusal: isRefusal,
        answered_at: new Date().toISOString(),
        experience_version: AYURVEDA_EXPERIENCE_VERSION,
        chapter_id: 'capitulo-1-estrutura-caracteristicas',
        revision_number: activeRevision,
        contradiction_flag: isChanged,
        notes_for_professional: isChanged
          ? 'Interagente relatou grande mudança corporal ou dificuldade de comparação.'
          : undefined,
      }

      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: physicalStructureId,
        respondentUserId,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        canonicalPromptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        stepOrder: 1,
        accessClass: 'shared_care',
        changeReason: 'Resposta do participante ao Capítulo 1',
        structuredValue: {
          value: data.structureChoice,
          choice: data.structureChoice,
          secondary_choice: data.secondaryStructureChoice,
          revision_number: activeRevision,
          metadata: meta,
        },
      })
      ;(saved as any).revision_number = activeRevision
      setRawResponses((prev) => {
        const next = prev.filter((r) => r.prompt_id !== physicalStructureId)
        return [...next, saved]
      })
    }

    if (data.durationChoice) {
      const isUnsure = data.durationChoice === 'dont_know'
      const isRefusal = data.durationChoice === 'refusal'
      const isChanged = data.durationChoice === 'changed_lot'
      const meta: AyurvedaCanonicalResponseMetadata = {
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        domain: 'ayurveda',
        option_ids: [data.durationChoice],
        time_layer: 'stable_history',
        stability:
          data.durationChoice === 'lifelong'
            ? 'lifelong'
            : data.durationChoice === 'most_adult'
              ? 'long_term'
              : data.durationChoice === 'some_phases'
                ? 'partial'
                : isChanged
                  ? 'changed'
                  : 'uncertain',
        source: 'participant_self_report',
        historical_confidence: isChanged || isUnsure ? 'low' : 'high',
        explicit_unsure: isUnsure,
        explicit_refusal: isRefusal,
        answered_at: new Date().toISOString(),
        experience_version: AYURVEDA_EXPERIENCE_VERSION,
        chapter_id: 'capitulo-1-estrutura-caracteristicas',
        revision_number: activeRevision,
      }

      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: physicalDurationId,
        respondentUserId,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        promptKey: AYV_C1_PROMPTS.P1_DURATION.key,
        canonicalPromptId: AYV_C1_PROMPTS.P1_DURATION.id,
        stepOrder: 1,
        accessClass: 'shared_care',
        changeReason: 'Resposta do participante ao Capítulo 1',
        structuredValue: {
          value: data.durationChoice,
          choice: data.durationChoice,
          revision_number: activeRevision,
          metadata: meta,
        },
      })
      ;(saved as any).revision_number = activeRevision
      setRawResponses((prev) => {
        const next = prev.filter((r) => r.prompt_id !== physicalDurationId)
        return [...next, saved]
      })
    }
  }

  // Salvar Tela 2
  const handleSaveStep2 = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, skin_choices: choices }))
    if (isReviewOnly) return

    const physicalSkinId = getChapter1RevisionPromptId(AYV_C1_PROMPTS.P2_SKIN.id, activeRevision)

    const isUnsure = choices.includes('dont_know')
    const isRefusal = choices.includes('refusal')
    const meta: AyurvedaCanonicalResponseMetadata = {
      prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
      domain: 'ayurveda',
      option_ids: choices,
      time_layer: 'habitual',
      stability: isUnsure
        ? 'uncertain'
        : choices.includes('varies_region')
          ? 'partial'
          : 'long_term',
      source: 'participant_self_report',
      historical_confidence: isUnsure ? 'low' : 'high',
      explicit_unsure: isUnsure,
      explicit_refusal: isRefusal,
      answered_at: new Date().toISOString(),
      experience_version: AYURVEDA_EXPERIENCE_VERSION,
      chapter_id: 'capitulo-1-estrutura-caracteristicas',
      revision_number: activeRevision,
    }

    const saved = await experienceResponseService.saveResponse({
      enrollmentId,
      experienceId,
      promptId: physicalSkinId,
      respondentUserId,
      responseType: 'MultiSelectCards',
      promptVersion: 1,
      promptKey: AYV_C1_PROMPTS.P2_SKIN.key,
      canonicalPromptId: AYV_C1_PROMPTS.P2_SKIN.id,
      stepOrder: 2,
      accessClass: 'shared_care',
      changeReason: 'Resposta do participante ao Capítulo 1',
      structuredValue: {
        selectedOptionIds: choices,
        value: choices,
        revision_number: activeRevision,
        metadata: meta,
      },
    })
    ;(saved as any).revision_number = activeRevision
    setRawResponses((prev) => {
      const next = prev.filter((r) => r.prompt_id !== physicalSkinId)
      return [...next, saved]
    })
  }

  // Salvar Tela 3
  const handleSaveStep3 = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, hair_choices: choices }))
    if (isReviewOnly) return

    const physicalHairId = getChapter1RevisionPromptId(AYV_C1_PROMPTS.P3_HAIR.id, activeRevision)

    const isUnsure = choices.includes('no_reference')
    const isRefusal = choices.includes('refusal')
    const meta: AyurvedaCanonicalResponseMetadata = {
      prompt_key: AYV_C1_PROMPTS.P3_HAIR.key,
      domain: 'ayurveda',
      option_ids: choices,
      time_layer: 'habitual',
      stability: isUnsure
        ? 'uncertain'
        : choices.includes('mixed_varies')
          ? 'partial'
          : 'long_term',
      source: 'participant_self_report',
      historical_confidence: isUnsure ? 'low' : 'high',
      explicit_unsure: isUnsure,
      explicit_refusal: isRefusal,
      answered_at: new Date().toISOString(),
      experience_version: AYURVEDA_EXPERIENCE_VERSION,
      chapter_id: 'capitulo-1-estrutura-caracteristicas',
      revision_number: activeRevision,
      notes_for_professional: isUnsure
        ? 'Interagente indicou ausência de referência suficiente sobre o cabelo natural.'
        : undefined,
    }

    const saved = await experienceResponseService.saveResponse({
      enrollmentId,
      experienceId,
      promptId: physicalHairId,
      respondentUserId,
      responseType: 'MultiSelectCards',
      promptVersion: 1,
      promptKey: AYV_C1_PROMPTS.P3_HAIR.key,
      canonicalPromptId: AYV_C1_PROMPTS.P3_HAIR.id,
      stepOrder: 3,
      accessClass: 'shared_care',
      changeReason: 'Resposta do participante ao Capítulo 1',
      structuredValue: {
        selectedOptionIds: choices,
        value: choices,
        revision_number: activeRevision,
        metadata: meta,
      },
    })
    ;(saved as any).revision_number = activeRevision
    setRawResponses((prev) => {
      const next = prev.filter((r) => r.prompt_id !== physicalHairId)
      return [...next, saved]
    })
  }

  // Salvar Tela 4
  const handleSaveStep4 = async (choice: string) => {
    setChapterState((prev) => ({ ...prev, temperature_choice: choice }))
    if (isReviewOnly) return

    const physicalTempId = getChapter1RevisionPromptId(
      AYV_C1_PROMPTS.P4_TEMPERATURE.id,
      activeRevision,
    )

    const isUnsure = choice === 'dont_know'
    const isRefusal = choice === 'refusal'
    const meta: AyurvedaCanonicalResponseMetadata = {
      prompt_key: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
      domain: 'ayurveda',
      option_ids: [choice],
      time_layer: 'habitual',
      stability: isUnsure
        ? 'uncertain'
        : choice === 'alternates' || choice === 'varies_climate'
          ? 'partial'
          : 'long_term',
      source: 'participant_self_report',
      historical_confidence: isUnsure ? 'low' : 'high',
      explicit_unsure: isUnsure,
      explicit_refusal: isRefusal,
      answered_at: new Date().toISOString(),
      experience_version: AYURVEDA_EXPERIENCE_VERSION,
      chapter_id: 'capitulo-1-estrutura-caracteristicas',
      revision_number: activeRevision,
    }

    const saved = await experienceResponseService.saveResponse({
      enrollmentId,
      experienceId,
      promptId: physicalTempId,
      respondentUserId,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      promptKey: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
      canonicalPromptId: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
      stepOrder: 4,
      accessClass: 'shared_care',
      changeReason: 'Resposta do participante ao Capítulo 1',
      structuredValue: {
        value: choice,
        choice,
        revision_number: activeRevision,
        metadata: meta,
      },
    })
    ;(saved as any).revision_number = activeRevision
    setRawResponses((prev) => {
      const next = prev.filter((r) => r.prompt_id !== physicalTempId)
      return [...next, saved]
    })
  }

  // Salvar Tela 5
  const handleSaveStep5 = async (data: {
    thirstChoice?: string
    drinkTemperatureChoice?: string
    sweatChoice?: string
  }) => {
    setChapterState((prev) => ({
      ...prev,
      thirst_choice: data.thirstChoice,
      drink_temperature_choice: data.drinkTemperatureChoice,
      sweat_choice: data.sweatChoice,
    }))

    if (isReviewOnly) return

    const physicalThirstId = getChapter1RevisionPromptId(
      AYV_C1_PROMPTS.P5_THIRST.id,
      activeRevision,
    )
    const physicalDrinkId = getChapter1RevisionPromptId(
      AYV_C1_PROMPTS.P5_DRINK_TEMP.id,
      activeRevision,
    )
    const physicalSweatId = getChapter1RevisionPromptId(AYV_C1_PROMPTS.P5_SWEAT.id, activeRevision)

    // Bloco A: Sede
    if (data.thirstChoice) {
      const isUnsure = data.thirstChoice === 'dont_know'
      const isRefusal = data.thirstChoice === 'refusal'
      const meta: AyurvedaCanonicalResponseMetadata = {
        prompt_key: AYV_C1_PROMPTS.P5_THIRST.key,
        domain: 'ayurveda',
        option_ids: [data.thirstChoice],
        time_layer: 'habitual',
        stability: isUnsure ? 'uncertain' : 'long_term',
        source: 'participant_self_report',
        historical_confidence: isUnsure ? 'low' : 'high',
        explicit_unsure: isUnsure,
        explicit_refusal: isRefusal,
        answered_at: new Date().toISOString(),
        experience_version: AYURVEDA_EXPERIENCE_VERSION,
        chapter_id: 'capitulo-1-estrutura-caracteristicas',
        revision_number: activeRevision,
      }

      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: physicalThirstId,
        respondentUserId,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        promptKey: AYV_C1_PROMPTS.P5_THIRST.key,
        canonicalPromptId: AYV_C1_PROMPTS.P5_THIRST.id,
        stepOrder: 5,
        accessClass: 'shared_care',
        changeReason: 'Resposta do participante ao Capítulo 1',
        structuredValue: {
          value: data.thirstChoice,
          choice: data.thirstChoice,
          revision_number: activeRevision,
          metadata: meta,
        },
      })
      ;(saved as any).revision_number = activeRevision
      setRawResponses((prev) => {
        const next = prev.filter((r) => r.prompt_id !== physicalThirstId)
        return [...next, saved]
      })
    }

    // Bloco B: Bebida
    if (data.drinkTemperatureChoice) {
      const isUnsure = data.drinkTemperatureChoice === 'dont_know'
      const isRefusal = data.drinkTemperatureChoice === 'refusal'
      const meta: AyurvedaCanonicalResponseMetadata = {
        prompt_key: AYV_C1_PROMPTS.P5_DRINK_TEMP.key,
        domain: 'ayurveda',
        option_ids: [data.drinkTemperatureChoice],
        time_layer: 'habitual',
        stability: isUnsure ? 'uncertain' : 'long_term',
        source: 'participant_self_report',
        historical_confidence: isUnsure ? 'low' : 'high',
        explicit_unsure: isUnsure,
        explicit_refusal: isRefusal,
        answered_at: new Date().toISOString(),
        experience_version: AYURVEDA_EXPERIENCE_VERSION,
        chapter_id: 'capitulo-1-estrutura-caracteristicas',
        revision_number: activeRevision,
      }

      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: physicalDrinkId,
        respondentUserId,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        promptKey: AYV_C1_PROMPTS.P5_DRINK_TEMP.key,
        canonicalPromptId: AYV_C1_PROMPTS.P5_DRINK_TEMP.id,
        stepOrder: 5,
        accessClass: 'shared_care',
        changeReason: 'Resposta do participante ao Capítulo 1',
        structuredValue: {
          value: data.drinkTemperatureChoice,
          choice: data.drinkTemperatureChoice,
          revision_number: activeRevision,
          metadata: meta,
        },
      })
      ;(saved as any).revision_number = activeRevision
      setRawResponses((prev) => {
        const next = prev.filter((r) => r.prompt_id !== physicalDrinkId)
        return [...next, saved]
      })
    }

    // Bloco C: Transpiração
    if (data.sweatChoice) {
      const isUnsure = data.sweatChoice === 'dont_know'
      const isRefusal = data.sweatChoice === 'refusal'
      const meta: AyurvedaCanonicalResponseMetadata = {
        prompt_key: AYV_C1_PROMPTS.P5_SWEAT.key,
        domain: 'ayurveda',
        option_ids: [data.sweatChoice],
        time_layer: 'habitual',
        stability: isUnsure ? 'uncertain' : 'long_term',
        source: 'participant_self_report',
        historical_confidence: isUnsure ? 'low' : 'high',
        explicit_unsure: isUnsure,
        explicit_refusal: isRefusal,
        answered_at: new Date().toISOString(),
        experience_version: AYURVEDA_EXPERIENCE_VERSION,
        chapter_id: 'capitulo-1-estrutura-caracteristicas',
        revision_number: activeRevision,
      }

      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: physicalSweatId,
        respondentUserId,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        promptKey: AYV_C1_PROMPTS.P5_SWEAT.key,
        canonicalPromptId: AYV_C1_PROMPTS.P5_SWEAT.id,
        stepOrder: 5,
        accessClass: 'shared_care',
        changeReason: 'Resposta do participante ao Capítulo 1',
        structuredValue: {
          value: data.sweatChoice,
          choice: data.sweatChoice,
          revision_number: activeRevision,
          metadata: meta,
        },
      })
      ;(saved as any).revision_number = activeRevision
      setRawResponses((prev) => {
        const next = prev.filter((r) => r.prompt_id !== physicalSweatId)
        return [...next, saved]
      })
    }
  }

  // Atualizar progresso de etapa
  const advanceStep = async (nextStep: Chapter1Stage, stepOrder: number) => {
    setStage(nextStep)
    if (enrollmentExp && !isReviewOnly) {
      const updated = await enrollmentExperienceService.updateProgress(enrollmentExp.id, {
        progressStatus: 'in_progress',
        stepOrder,
      })
      setEnrollmentExp(updated)
    }
  }

  // Concluir Capítulo 1 (exclusivo para a revisão ativa)
  const handleCompleteChapter1 = async () => {
    setSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const physicalCompletionId = getChapter1RevisionPromptId(
        AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        activeRevision,
      )

      // 1. Gravar registro canônico explícito de conclusão da revisão ativa do Capítulo 1
      const completionResp = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: physicalCompletionId,
        respondentUserId,
        responseType: 'ChapterCompletion' as any,
        promptVersion: 1,
        promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        canonicalPromptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        stepOrder: 5,
        accessClass: 'shared_care',
        changeReason: `Conclusão canônica da revisão ${activeRevision} do Capítulo 1 de Ayurveda`,
        structuredValue: {
          completed: true,
          completed_at: nowIso,
          chapter_id: 'capitulo-1-estrutura-caracteristicas',
          experience_version: AYURVEDA_EXPERIENCE_VERSION,
          step_order: 5,
          revision_number: activeRevision,
          metadata: {
            prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
            canonical_prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
            completed: true,
            completed_at: nowIso,
            chapter_id: 'capitulo-1-estrutura-caracteristicas',
            experience_version: AYURVEDA_EXPERIENCE_VERSION,
            revision_number: activeRevision,
          },
        },
      })
      ;(completionResp as any).revision_number = activeRevision

      // Atualiza lista local de respostas com a de conclusão canônica
      setRawResponses((prev) => {
        const existingIdx = prev.findIndex(
          (r) =>
            r.prompt_id === physicalCompletionId ||
            ((r as any).prompt_key === AYV_C1_PROMPTS.CHAPTER_COMPLETION.key &&
              getChapter1ResponseRevisionNumber(r) === activeRevision),
        )
        if (existingIdx >= 0) {
          const updated = [...prev]
          updated[existingIdx] = completionResp
          return updated
        }
        return [...prev, completionResp]
      })

      // 2. Preserva atualização de progresso de etapa no enrollmentExp
      if (enrollmentExp) {
        const updated = await enrollmentExperienceService.updateProgress(enrollmentExp.id, {
          progressStatus: 'completed',
          stepOrder: 5,
        })
        setEnrollmentExp(updated)
      }
      onCompleted?.()
    } catch (e) {
      console.error('Erro ao concluir Capítulo 1:', e)
    } finally {
      setSaving(false)
    }
  }

  // Rever Respostas (modo somente-leitura com banner visível e único comando para voltar)
  const handleReviewResponses = () => {
    setInternalMode('review')
    setStage('step1')
  }

  // Corrigir minhas respostas com histórico preservado e criação fail-closed
  const handleStartCorrection = async () => {
    setSaving(true)
    setCorrectionError(null)
    try {
      // 1. Carregar respostas frescas e migrar
      const freshResponses = await experienceResponseService.listResponsesByExperience(
        enrollmentId,
        experienceId,
      )
      const { migratedResponses } = migrateLegacyChapter1Responses(
        freshResponses.length > 0 ? freshResponses : rawResponses,
      )

      // 2. Criar nova revisão canônica a partir da última válida
      const { nextRevisionNumber, newActiveResponses } = createChapter1Revision({
        existingResponses: migratedResponses,
        enrollmentId,
        experienceId,
        respondentUserId,
      })

      // 3. Persistir cópias com ID físico exclusivo
      const persistedCopies: ExperienceResponseRecord[] = []
      for (const item of newActiveResponses) {
        const sVal = (item.structured_value || {}) as any
        const meta = sVal?.metadata || {}
        const pKey = (item as any).prompt_key || meta?.prompt_key || item.prompt_id
        const baseCanonicalPromptId = getChapter1BasePromptId(
          (item as any).canonical_prompt_id || meta?.canonical_prompt_id || item.prompt_id,
        )
        const physicalPromptId = getChapter1RevisionPromptId(
          baseCanonicalPromptId,
          nextRevisionNumber,
        )
        const step = (item as any).step_order ?? meta?.step_order ?? 1

        const enrichedStructuredVal = {
          ...sVal,
          revision_number: nextRevisionNumber,
          parent_version_id: (item as any).parent_version_id || sVal?.parent_version_id,
          metadata: {
            ...(meta || {}),
            revision_number: nextRevisionNumber,
            parent_version_id: (item as any).parent_version_id || sVal?.parent_version_id,
            canonical_prompt_id: baseCanonicalPromptId,
            prompt_key: pKey,
          },
        }

        const saved = await experienceResponseService.saveResponse({
          enrollmentId,
          experienceId,
          promptId: physicalPromptId,
          respondentUserId,
          responseType: item.response_type || ('ChoiceCards' as any),
          promptVersion: 1,
          promptKey: pKey,
          canonicalPromptId: baseCanonicalPromptId,
          stepOrder: step,
          accessClass: 'shared_care',
          changeReason: `Cópia inicial da revisão ${nextRevisionNumber} do Capítulo 1`,
          structuredValue: enrichedStructuredVal,
        })
        ;(saved as any).revision_number = nextRevisionNumber
        ;(saved as any).prompt_key = pKey
        ;(saved as any).canonical_prompt_id = baseCanonicalPromptId
        persistedCopies.push(saved)
      }

      // Validação: integridade de todas as cópias
      if (persistedCopies.length === 0 || persistedCopies.length !== newActiveResponses.length) {
        throw new Error(
          `Falha ao persistir cópias da revisão ${nextRevisionNumber}: persistidas ${persistedCopies.length} de ${newActiveResponses.length}`,
        )
      }

      // 4. Ponteiro ativo persistido SOMENTE após o salvamento completo de todas as cópias
      setPersistedActiveChapter1Revision(enrollmentId, nextRevisionNumber)
      setActiveRevision(nextRevisionNumber)

      // 5. Atualizar respostas em cache e estado de tela
      const combined = [...migratedResponses, ...persistedCopies]
      setRawResponses(combined)
      applyResponsesToState(combined, nextRevisionNumber)

      // 6. Transição de modo canônico para correcting
      setInternalMode('correcting')
      onStartCorrection?.()
      setStage('step1')
    } catch (err: any) {
      console.error('Falha ao criar revisão do Capítulo 1:', err)
      setCorrectionError('Não foi possível recuperar as respostas anteriores para esta correção.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full">
      {/* Banner de Modo Revisão Somente-Leitura com identificação explícita do Capítulo 1 */}
      {isReviewOnly && (
        <div
          data-testid="banner-review-mode"
          className="sticky top-0 z-30 mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between text-xs backdrop-blur-md"
        >
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Eye className="w-4 h-4 text-primary" />
            <span>Capítulo 1 — {AYV_TEXTS.REVISION_BANNER}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (onExitReview) {
                onExitReview()
              } else {
                setInternalMode(isCompleted ? 'completed' : 'ready_to_complete')
                setStage('closing')
              }
            }}
            className="text-xs h-7 px-3 bg-background"
          >
            {AYV_TEXTS.REVISION_RETURN_CMD}
          </Button>
        </div>
      )}
      {/* 1. Hub dos 4 Capítulos */}
      {stage === 'hub' && (
        <AyurvedaChaptersHub
          onStartChapter1={() => {
            if (isCompleted) {
              // Modo somente-leitura direto com banner e comando único "Voltar ao encerramento"
              handleReviewResponses()
            } else if (isReadyToComplete) {
              // Pronto para concluir: vai diretamente para o encerramento para revisão e conclusão explícita
              setStage('closing')
            } else if (chapter1Status === 'in_progress') {
              // Retoma exatamente na primeira tela não respondida sem perder nada
              const stageMap: Record<number, Chapter1Stage> = {
                1: 'step1',
                2: 'step2',
                3: 'step3',
                4: 'step4',
                5: 'step5',
              }
              setStage(stageMap[firstUnansweredStep] || 'step1')
            } else {
              setStage('opening')
            }
          }}
          onStartChapter2={() => {
            setStage('chapter2_flow')
          }}
          onOpenCustomization={onOpenAvatarCustomization}
          onCorrectChapter1={handleStartCorrection}
          onCorrectChapter2={() => {
            setStage('chapter2_flow')
          }}
          isChapter1Completed={isCompleted}
          chapter1Status={chapter1Status}
          chapter1Progress={chapter1Progress}
          chapter1StepOrder={currentStepNum}
          answeredStepsCount={answeredStepsCount}
          totalSteps={totalSteps}
          chapter2Status={chapter2Status}
          chapter2Progress={chapter2Progress}
          answeredMomentsCountC2={answeredMomentsCountC2}
          totalMomentsC2={totalMomentsC2}
          avatarDeferred={avatarDeferred}
          onClose={onClose}
        />
      )}
      {/* Fluxo do Capítulo 2 */}
      {stage === 'chapter2_flow' && (
        <AyurvedaChapter2Flow
          enrollmentId={enrollmentId}
          experienceId={experienceId}
          respondentUserId={respondentUserId}
          treatmentVariant={treatmentVariant}
          onBackToHub={() => {
            loadResponses()
            setStage('hub')
          }}
          onCompleted={() => {
            loadResponses()
            onCompleted?.()
          }}
        />
      )}
      {/* 2. Transição pós-avatar */}
      {stage === 'post_avatar_transition' && (
        <AyurvedaPostAvatarTransition onStartChapter1={() => setStage('opening')} />
      )}
      {/* 3. Abertura do Capítulo 1 */}
      {stage === 'opening' && (
        <AyurvedaChapter1Opening
          onStartQuestions={() => advanceStep('step1', 1)}
          onBackToHub={() => {
            if (onExitToHub) {
              onExitToHub()
            } else {
              setStage('hub')
            }
          }}
        />
      )}
      {/* 4. Tela 1: Estrutura Corporal */}
      {stage === 'step1' && (
        <div className="space-y-6">
          <AyurvedaTela1Structure
            userPresentation={userPresentation}
            structureChoice={chapterState.structure_choice}
            secondaryStructureChoice={chapterState.secondary_structure_choice}
            durationChoice={chapterState.structure_duration}
            onSave={handleSaveStep1}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            {isReviewOnly ? (
              <div />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStage('opening')}
                className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Abertura</span>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => advanceStep('step2', 2)}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 whitespace-normal shrink-0"
            >
              <span>Avançar para Pele</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}
      {/* 5. Tela 2: Pele */}
      {stage === 'step2' && (
        <div className="space-y-6">
          <AyurvedaTela2Skin
            skinChoices={chapterState.skin_choices}
            onSave={handleSaveStep2}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStage('step1')}
              className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Estrutura</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => advanceStep('step3', 3)}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 whitespace-normal shrink-0"
            >
              <span>Avançar para Cabelo</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}
      {/* 6. Tela 3: Cabelo */}
      {stage === 'step3' && (
        <div className="space-y-6">
          <AyurvedaTela3Hair
            hairChoices={chapterState.hair_choices}
            onSave={handleSaveStep3}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStage('step2')}
              className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Pele</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => advanceStep('step4', 4)}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 whitespace-normal shrink-0"
            >
              <span>Avançar para Temperatura</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}
      {/* 7. Tela 4: Temperatura */}
      {stage === 'step4' && (
        <div className="space-y-6">
          <AyurvedaTela4Temperature
            temperatureChoice={chapterState.temperature_choice}
            onSave={handleSaveStep4}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStage('step3')}
              className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Cabelo</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => advanceStep('step5', 5)}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 whitespace-normal shrink-0"
            >
              <span>Avançar para Hábitos</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}
      {/* 8. Tela 5: Sede, Bebida e Transpiração */}
      {stage === 'step5' && (
        <div className="space-y-6">
          <AyurvedaTela5Habits
            thirstChoice={chapterState.thirst_choice}
            drinkTemperatureChoice={chapterState.drink_temperature_choice}
            sweatChoice={chapterState.sweat_choice}
            onSave={handleSaveStep5}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStage('step4')}
              className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Temperatura</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setStage('closing')}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 whitespace-normal shrink-0"
            >
              <span>Ir para Encerramento</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}
      {/* 9. Encerramento do Capítulo 1 */}
      {stage === 'closing' && (
        <AyurvedaClosing
          state={chapterState}
          isCompleted={isCompleted}
          onSaveAndContinueLater={() => {
            if (onExitToHub) {
              onExitToHub()
            } else {
              setStage('hub')
            }
          }}
          onCompleteChapter={handleCompleteChapter1}
          onReviewResponses={() => {
            if (onEnterReview) {
              onEnterReview()
            }
            handleReviewResponses()
          }}
          onStartCorrection={handleStartCorrection}
          onBackToHub={() => {
            if (onExitToHub) {
              onExitToHub()
            } else {
              setStage('hub')
            }
          }}
          loading={saving}
          correctionError={correctionError}
          onClearCorrectionError={() => setCorrectionError(null)}
        />
      )}{' '}
    </div>
  )
}
export default AyurvedaChapter1Flow
