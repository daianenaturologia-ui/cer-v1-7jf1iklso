import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react'
import {
  AyurvedaChapter2State,
  AYV_C2_PROMPTS,
  AYV_C2_TEXTS,
  AYV_C2_TOTAL_MOMENTS,
  AYV_C2_TOTAL_QUESTIONS,
  AYV_C2_MOMENTS_METADATA,
  AYV_C2_QUESTION_PROMPT_KEYS,
  AyurvedaCanonicalC2ResponseMetadata,
  AYURVEDA_CHAPTER_2_VERSION,
  AYURVEDA_CHAPTER_2_ID,
  deriveChapter2Status,
  AyurvedaChapter2Status,
  Chapter2TreatmentVariant,
  createChapter2Revision,
  getResponseRevisionNumber,
  migrateLegacyChapter2Responses,
  getPersistedActiveChapter2Revision,
  setPersistedActiveChapter2Revision,
} from '@/services/ayurvedaChapter2'
import { AyurvedaChapter2Opening } from './AyurvedaChapter2Opening'
import { AyurvedaC2Momento1Hunger } from './AyurvedaC2Momento1Hunger'
import { AyurvedaC2Momento2Digestion } from './AyurvedaC2Momento2Digestion'
import { AyurvedaC2Momento3Elimination } from './AyurvedaC2Momento3Elimination'
import { AyurvedaC2Momento4Sleep } from './AyurvedaC2Momento4Sleep'
import { AyurvedaC2Momento5Energy } from './AyurvedaC2Momento5Energy'
import { AyurvedaChapter2Closing } from './AyurvedaChapter2Closing'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
import { ExperienceResponseRecord, EnrollmentExperienceRecord } from '@/types/cer'

export interface AyurvedaChapter2FlowProps {
  enrollmentId: string
  experienceId: string
  respondentUserId: string
  treatmentVariant?: Chapter2TreatmentVariant
  onBackToHub: () => void
  onCompleted?: () => void
  initialStage?: 'opening' | 'moments' | 'closing' | 'review'
  mode?: 'intro' | 'answering' | 'ready_to_complete' | 'completed' | 'review' | 'correcting'
  revisionNumber?: number
  initialStep?: number
  onEnterReview?: () => void
  onStartCorrection?: () => void
}

type Chapter2FlowStage =
  | 'opening'
  | 'momento1'
  | 'momento2'
  | 'momento3'
  | 'momento4'
  | 'momento5'
  | 'closing'

export const AyurvedaChapter2Flow: React.FC<AyurvedaChapter2FlowProps> = ({
  enrollmentId,
  experienceId,
  respondentUserId,
  treatmentVariant = 'neutro',
  onBackToHub,
  onCompleted,
  initialStage,
  mode,
  revisionNumber,
  initialStep,
  onEnterReview,
  onStartCorrection,
}) => {
  const resolveInitialStage = (): Chapter2FlowStage => {
    if (mode === 'review' || mode === 'correcting') {
      const stepMap: Record<number, Chapter2FlowStage> = {
        1: 'momento1',
        2: 'momento2',
        3: 'momento3',
        4: 'momento4',
        5: 'momento5',
      }
      return stepMap[initialStep || 1] || 'momento1'
    }
    if (mode === 'ready_to_complete' || mode === 'completed') {
      return 'closing'
    }
    if (mode === 'answering') {
      const stepMap: Record<number, Chapter2FlowStage> = {
        1: 'momento1',
        2: 'momento2',
        3: 'momento3',
        4: 'momento4',
        5: 'momento5',
      }
      return stepMap[initialStep || 1] || 'momento1'
    }
    if (mode === 'intro') {
      return 'opening'
    }
    if (initialStage === 'review') return 'momento1'
    if (initialStage === 'closing') return 'closing'
    if (initialStage === 'moments') return 'momento1'
    return 'opening'
  }

  const [stage, setStage] = useState<Chapter2FlowStage>(resolveInitialStage)
  const [isReviewOnly, setIsReviewOnly] = useState<boolean>(
    () => mode === 'review' || initialStage === 'review',
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [correctionError, setCorrectionError] = useState<string | null>(null)
  const [enrollmentExp, setEnrollmentExp] = useState<EnrollmentExperienceRecord | null>(null)

  const [chapterState, setChapterState] = useState<AyurvedaChapter2State>({})
  const [rawResponses, setRawResponses] = useState<ExperienceResponseRecord[]>([])
  const [activeRevision, setActiveRevision] = useState<number | undefined>(() => {
    return revisionNumber ?? getPersistedActiveChapter2Revision(enrollmentId) ?? undefined
  })

  // Sincronizar caso o mode externo mude
  useEffect(() => {
    if (mode === 'review') {
      setIsReviewOnly(true)
      if (stage === 'opening') {
        setStage('momento1')
      }
    } else if (mode === 'correcting') {
      setIsReviewOnly(false)
      if (stage === 'opening') {
        setStage('momento1')
      }
    } else if (mode === 'ready_to_complete' || mode === 'completed') {
      setIsReviewOnly(false)
      setStage('closing')
    } else if (mode === 'intro') {
      setIsReviewOnly(false)
      setStage('opening')
    } else if (mode === 'answering' && initialStep) {
      setIsReviewOnly(false)
      const stepMap: Record<number, Chapter2FlowStage> = {
        1: 'momento1',
        2: 'momento2',
        3: 'momento3',
        4: 'momento4',
        5: 'momento5',
      }
      setStage(stepMap[initialStep] || 'momento1')
    }
  }, [mode, initialStep])

  useEffect(() => {
    if (typeof revisionNumber === 'number' && revisionNumber !== activeRevision) {
      setActiveRevision(revisionNumber)
    }
  }, [revisionNumber])

  // Carregar respostas existentes com IDs canônicos AYV_C2
  const loadResponses = async (explicitTargetRevision?: number) => {
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

      const rawFromBackend = await experienceResponseService.listResponsesByExperience(
        enrollmentId,
        experienceId,
      )

      // Migração não destrutiva e idempotente de registros legados da 0.0.148
      const { migratedResponses } = migrateLegacyChapter2Responses(rawFromBackend)
      setRawResponses(migratedResponses)

      // Identificar revisão ativa a ser carregada: prioriza explícito > persistido no localStorage > derivado
      const persistedRev = getPersistedActiveChapter2Revision(enrollmentId)
      const derivedTemp = deriveChapter2Status(
        migratedResponses,
        explicitTargetRevision ?? persistedRev ?? undefined,
      )
      const targetRev = explicitTargetRevision ?? persistedRev ?? derivedTemp.activeRevisionNumber

      setActiveRevision(targetRev)
      setPersistedActiveChapter2Revision(enrollmentId, targetRev)

      // Filtrar respostas estritamente pertencentes à revisão ativa
      const activeResponses = migratedResponses.filter(
        (r) => getResponseRevisionNumber(r) === targetRev,
      )

      const loadedState: AyurvedaChapter2State = {}

      for (const r of activeResponses) {
        const sVal = r.structured_value as any
        const pKey =
          (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key
        const pId = r.prompt_id || (r as any).canonical_prompt_id

        const matches = (keyOrId: string) => pKey === keyOrId || pId === keyOrId

        if (matches(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key)) {
          loadedState.hunger_pattern = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P2_DELAYED_MEAL.key)) {
          loadedState.delayed_meal_response = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P3_POST_MEAL.key)) {
          loadedState.post_meal = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P4_HUNGER_RETURN.key)) {
          loadedState.hunger_return = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key)) {
          loadedState.food_demands = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key)) {
          loadedState.bowel_rhythm = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P7_STOOL_PATTERN.key)) {
          loadedState.stool_pattern = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key)) {
          loadedState.sleep_pattern = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P9_WAKING.key)) {
          loadedState.waking = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key)) {
          loadedState.energy_distribution = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P11_BODY_PACE.key)) {
          loadedState.body_pace = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key)) {
          loadedState.historical_confidence = sVal?.value || sVal?.choice
        }
      }

      setChapterState(loadedState)

      // Determinar stage inicial inteligente: respeita prioritariamente o prop mode canônico se fornecido
      const derived = deriveChapter2Status(migratedResponses, targetRev)
      if (mode) {
        if (mode === 'review') {
          setIsReviewOnly(true)
          setStage('momento1')
        } else if (mode === 'correcting') {
          setIsReviewOnly(false)
          setStage('momento1')
        } else if (mode === 'ready_to_complete' || mode === 'completed') {
          setIsReviewOnly(false)
          setStage('closing')
        } else if (mode === 'intro') {
          setIsReviewOnly(false)
          setStage('opening')
        } else if (mode === 'answering') {
          setIsReviewOnly(false)
          const stageMap: Record<number, Chapter2FlowStage> = {
            1: 'momento1',
            2: 'momento2',
            3: 'momento3',
            4: 'momento4',
            5: 'momento5',
          }
          setStage(stageMap[initialStep || derived.firstUnansweredMoment] || 'momento1')
        }
      } else {
        // Fallback legado se nenhum mode explícito foi passado
        if (initialStage === 'review') {
          setIsReviewOnly(true)
          setStage('momento1')
        } else if (initialStage === 'closing' || derived.status === 'ready_to_complete') {
          setStage('closing')
        } else if (initialStage === 'moments' || derived.status === 'in_progress') {
          const stageMap: Record<number, Chapter2FlowStage> = {
            1: 'momento1',
            2: 'momento2',
            3: 'momento3',
            4: 'momento4',
            5: 'momento5',
          }
          setStage(stageMap[derived.firstUnansweredMoment] || 'momento1')
        } else if (derived.status === 'completed') {
          setStage('closing')
        } else {
          setStage('opening')
        }
      }
    } catch (err) {
      console.error('Erro ao carregar respostas do Capítulo 2:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResponses(activeRevision)
  }, [enrollmentId, experienceId])

  const derived = deriveChapter2Status(rawResponses, activeRevision)
  const currentActiveRev = activeRevision ?? derived.activeRevisionNumber
  const isCompleted = derived.status === 'completed'
  const isReadyToComplete = derived.status === 'ready_to_complete'
  const chapter2Status: AyurvedaChapter2Status = derived.status

  // Helper de persistência epistêmica genérica
  const persistCanonicalResponse = async (params: {
    promptId: string
    promptKey: string
    momentNumber: number
    stepOrder: number
    responseType: 'MultiSelectCards' | 'ChoiceCards'
    value: string | string[]
    optionIds: string[]
    explicitUnsure?: boolean
    explicitRefusal?: boolean
    notesForProfessional?: string
  }) => {
    const isUnsure =
      params.explicitUnsure !== undefined
        ? params.explicitUnsure
        : params.optionIds.includes('dont_know') ||
          params.optionIds.includes('no_pattern') ||
          params.optionIds.includes('hard_to_remember')

    const isRefusal =
      params.explicitRefusal !== undefined
        ? params.explicitRefusal
        : params.optionIds.includes('refusal')

    const nowIso = new Date().toISOString()
    const targetRev = currentActiveRev

    const meta: AyurvedaCanonicalC2ResponseMetadata = {
      prompt_key: params.promptKey,
      canonical_prompt_id: params.promptId,
      domain: 'ayurveda',
      chapter_id: AYURVEDA_CHAPTER_2_ID,
      moment_id: `momento-${params.momentNumber}`,
      moment_number: params.momentNumber,
      step_order: params.stepOrder,
      option_ids: params.optionIds,
      time_layer: 'habitual_adult',
      source: 'participant_self_report',
      explicit_unsure: isUnsure,
      explicit_refusal: isRefusal,
      historical_confidence: isUnsure ? 'low' : 'high',
      answered_at: nowIso,
      experience_version: AYURVEDA_CHAPTER_2_VERSION,
      notes_for_professional: params.notesForProfessional,
      revision_number: targetRev,
    }

    // Se estivermos em uma revisão > 1, usamos um promptId específico ou identificador único por revisão
    // para que no demo e no backend a versão anterior fique 100% imutável
    const promptIdToPersist = targetRev > 1 ? `${params.promptId}_rev${targetRev}` : params.promptId

    const saved = await experienceResponseService.saveResponse({
      enrollmentId,
      experienceId,
      promptId: promptIdToPersist,
      respondentUserId,
      responseType: params.responseType,
      promptVersion: 1,
      promptKey: params.promptKey,
      canonicalPromptId: params.promptId,
      stepOrder: params.stepOrder,
      accessClass: 'shared_care',
      changeReason: `Resposta do participante ao Capítulo 2 (revisão ${targetRev})`,
      structuredValue: {
        value: params.value,
        selectedOptionIds: Array.isArray(params.value) ? params.value : [params.value],
        revision_number: targetRev,
        metadata: meta,
      },
    })
    ;(saved as any).revision_number = targetRev
    ;(saved as any).prompt_key = params.promptKey
    ;(saved as any).canonical_prompt_id = params.promptId

    setRawResponses((prev) => {
      // Atualizar ou inserir na lista de respostas estritamente para a revisão ativa
      const idx = prev.findIndex((r) => {
        const rev = getResponseRevisionNumber(r)
        if (rev !== targetRev) return false
        const pId = r.prompt_id || (r as any).canonical_prompt_id
        const pKey =
          (r as any).prompt_key ||
          (r.structured_value as any)?.prompt_key ||
          (r.structured_value as any)?.metadata?.prompt_key
        return (
          r.id === saved.id ||
          pId === promptIdToPersist ||
          pId === params.promptId ||
          pKey === params.promptKey
        )
      })
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }

  // --- Handlers Momento 1: Fome ---
  const handleSaveHungerPattern = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, hunger_pattern: choices }))
    if (isReviewOnly || choices.length === 0) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
      promptKey: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
      momentNumber: 1,
      stepOrder: 1,
      responseType: 'MultiSelectCards',
      value: choices,
      optionIds: choices,
    })
  }

  const handleSaveDelayedMeal = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, delayed_meal_response: choices }))
    if (isReviewOnly || choices.length === 0) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P2_DELAYED_MEAL.id,
      promptKey: AYV_C2_PROMPTS.P2_DELAYED_MEAL.key,
      momentNumber: 1,
      stepOrder: 1,
      responseType: 'MultiSelectCards',
      value: choices,
      optionIds: choices,
    })
  }

  // --- Handlers Momento 2: Digestão ---
  const handleSavePostMeal = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, post_meal: choices }))
    if (isReviewOnly || choices.length === 0) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P3_POST_MEAL.id,
      promptKey: AYV_C2_PROMPTS.P3_POST_MEAL.key,
      momentNumber: 2,
      stepOrder: 2,
      responseType: 'MultiSelectCards',
      value: choices,
      optionIds: choices,
    })
  }

  const handleSaveHungerReturn = async (choice: string) => {
    setChapterState((prev) => ({ ...prev, hunger_return: choice }))
    if (isReviewOnly || !choice) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P4_HUNGER_RETURN.id,
      promptKey: AYV_C2_PROMPTS.P4_HUNGER_RETURN.key,
      momentNumber: 2,
      stepOrder: 2,
      responseType: 'ChoiceCards',
      value: choice,
      optionIds: [choice],
    })
  }

  const handleSaveFoodDemands = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, food_demands: choices }))
    if (isReviewOnly || choices.length === 0) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P5_FOOD_DEMANDS.id,
      promptKey: AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key,
      momentNumber: 2,
      stepOrder: 2,
      responseType: 'MultiSelectCards',
      value: choices,
      optionIds: choices,
      notesForProfessional:
        'Percepção de alimentos exigentes (sem caráter diagnóstico de alergias).',
    })
  }

  // --- Handlers Momento 3: Eliminação ---
  const handleSaveBowelRhythm = async (choice: string) => {
    setChapterState((prev) => ({ ...prev, bowel_rhythm: choice }))
    if (isReviewOnly || !choice) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.id,
      promptKey: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key,
      momentNumber: 3,
      stepOrder: 3,
      responseType: 'ChoiceCards',
      value: choice,
      optionIds: [choice],
    })
  }

  const handleSaveStoolPattern = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, stool_pattern: choices }))
    if (isReviewOnly || choices.length === 0) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P7_STOOL_PATTERN.id,
      promptKey: AYV_C2_PROMPTS.P7_STOOL_PATTERN.key,
      momentNumber: 3,
      stepOrder: 3,
      responseType: 'MultiSelectCards',
      value: choices,
      optionIds: choices,
    })
  }

  // --- Handlers Momento 4: Sono ---
  const handleSaveSleepPattern = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, sleep_pattern: choices }))
    if (isReviewOnly || choices.length === 0) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id,
      promptKey: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
      momentNumber: 4,
      stepOrder: 4,
      responseType: 'MultiSelectCards',
      value: choices,
      optionIds: choices,
    })
  }

  const handleSaveWaking = async (choice: string) => {
    setChapterState((prev) => ({ ...prev, waking: choice }))
    if (isReviewOnly || !choice) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P9_WAKING.id,
      promptKey: AYV_C2_PROMPTS.P9_WAKING.key,
      momentNumber: 4,
      stepOrder: 4,
      responseType: 'ChoiceCards',
      value: choice,
      optionIds: [choice],
    })
  }

  // --- Handlers Momento 5: Energia ---
  const handleSaveEnergyDistribution = async (choice: string) => {
    setChapterState((prev) => ({ ...prev, energy_distribution: choice }))
    if (isReviewOnly || !choice) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.id,
      promptKey: AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key,
      momentNumber: 5,
      stepOrder: 5,
      responseType: 'ChoiceCards',
      value: choice,
      optionIds: [choice],
    })
  }

  const handleSaveBodyPace = async (choice: string) => {
    setChapterState((prev) => ({ ...prev, body_pace: choice }))
    if (isReviewOnly || !choice) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P11_BODY_PACE.id,
      promptKey: AYV_C2_PROMPTS.P11_BODY_PACE.key,
      momentNumber: 5,
      stepOrder: 5,
      responseType: 'ChoiceCards',
      value: choice,
      optionIds: [choice],
    })
  }

  const handleSaveHistoricalConfidence = async (choice: string) => {
    setChapterState((prev) => ({ ...prev, historical_confidence: choice }))
    if (isReviewOnly || !choice) return
    await persistCanonicalResponse({
      promptId: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.id,
      promptKey: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
      momentNumber: 5,
      stepOrder: 5,
      responseType: 'ChoiceCards',
      value: choice,
      optionIds: [choice],
      notesForProfessional:
        'Grau de segurança histórica autoatribuído pelo participante ao Capítulo 2.',
    })
  }

  // Concluir explicitamente o Capítulo 2
  const handleCompleteChapter2 = async () => {
    setSaving(true)
    try {
      const nowIso = new Date().toISOString()
      const targetRev = currentActiveRev

      const completionPromptId =
        targetRev > 1
          ? `${AYV_C2_PROMPTS.CHAPTER_COMPLETION.id}_rev${targetRev}`
          : AYV_C2_PROMPTS.CHAPTER_COMPLETION.id

      const completionResp = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: completionPromptId,
        respondentUserId,
        responseType: 'ChapterCompletion' as any,
        promptVersion: 1,
        promptKey: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        canonicalPromptId: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        stepOrder: 5,
        accessClass: 'shared_care',
        changeReason: `Conclusão canônica explícita do Capítulo 2 de Ayurveda (revisão ${targetRev})`,
        structuredValue: {
          completed: true,
          completed_at: nowIso,
          chapter_id: AYURVEDA_CHAPTER_2_ID,
          experience_version: AYURVEDA_CHAPTER_2_VERSION,
          revision_number: targetRev,
          step_order: 5,
          metadata: {
            prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
            canonical_prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
            completed: true,
            completed_at: nowIso,
            chapter_id: AYURVEDA_CHAPTER_2_ID,
            experience_version: AYURVEDA_CHAPTER_2_VERSION,
            revision_number: targetRev,
          },
        },
      })
      ;(completionResp as any).revision_number = targetRev
      ;(completionResp as any).prompt_key = AYV_C2_PROMPTS.CHAPTER_COMPLETION.key
      ;(completionResp as any).canonical_prompt_id = AYV_C2_PROMPTS.CHAPTER_COMPLETION.id

      setRawResponses((prev) => {
        const existingIdx = prev.findIndex((r) => {
          const rev = getResponseRevisionNumber(r)
          if (rev !== targetRev) return false
          const pId = r.prompt_id || (r as any).canonical_prompt_id
          const pKey =
            (r as any).prompt_key ||
            (r.structured_value as any)?.prompt_key ||
            (r.structured_value as any)?.metadata?.prompt_key
          return (
            r.id === completionResp.id ||
            pId === completionPromptId ||
            pId === AYV_C2_PROMPTS.CHAPTER_COMPLETION.id ||
            pKey === AYV_C2_PROMPTS.CHAPTER_COMPLETION.key
          )
        })
        if (existingIdx >= 0) {
          const updated = [...prev]
          updated[existingIdx] = completionResp
          return updated
        }
        return [...prev, completionResp]
      })

      onCompleted?.()
    } catch (e) {
      console.error('Erro ao concluir Capítulo 2:', e)
    } finally {
      setSaving(false)
    }
  }

  // Rever Respostas (modo somente-leitura com banner visível e único comando para voltar)
  const handleReviewResponses = () => {
    setIsReviewOnly(true)
    setStage('momento1')
  }

  // Corrigir minhas respostas com histórico preservado
  const handleStartCorrection = async () => {
    setCorrectionError(null)
    setSaving(true)

    // Snapshot das respostas antes de qualquer operação para garantir rollback atômico em caso de falha
    const previousRawResponses = [...rawResponses]
    const previousActiveRevision = currentActiveRev

    try {
      // 0. Garantir sanitização/migração não destrutiva prévia nos registros existentes
      const { migratedResponses } = migrateLegacyChapter2Responses(rawResponses)

      // 1. Criar nova revisão canônica desvinculada de qualquer conclusão
      const { nextRevisionNumber, newActiveResponses } = createChapter2Revision({
        existingResponses: migratedResponses,
        enrollmentId,
        experienceId,
        respondentUserId,
      })

      // 2. Persistir de forma robusta e assíncrona todas as respostas copiadas
      const persistedActiveResponses: ExperienceResponseRecord[] = []
      for (const item of newActiveResponses) {
        const sVal = (item.structured_value || {}) as any
        const meta = sVal?.metadata || {}
        const pKey = (item as any).prompt_key || meta?.prompt_key || item.prompt_id
        const pId = (item as any).canonical_prompt_id || meta?.canonical_prompt_id || item.prompt_id
        const step = (item as any).step_order ?? meta?.step_order ?? 1

        const saved = await experienceResponseService.saveResponse({
          enrollmentId,
          experienceId,
          promptId: item.prompt_id,
          respondentUserId,
          responseType: item.response_type || ('MultiSelectCards' as any),
          promptVersion: 1,
          promptKey: pKey,
          canonicalPromptId: pId,
          stepOrder: step,
          accessClass: 'shared_care',
          changeReason: `Cópia inicial da revisão ${nextRevisionNumber} do Capítulo 2`,
          structuredValue: sVal,
        })
        ;(saved as any).revision_number = nextRevisionNumber
        ;(saved as any).prompt_key = pKey
        ;(saved as any).canonical_prompt_id = pId
        persistedActiveResponses.push(saved)
      }

      // 3. Persistir no storage local que a nova revisão é a ATIVA antes de qualquer transição
      setPersistedActiveChapter2Revision(enrollmentId, nextRevisionNumber)

      // 4. Recarregar o chapterState com as respostas da nova revisão
      const newLoadedState: AyurvedaChapter2State = {}
      for (const r of persistedActiveResponses) {
        const sVal = r.structured_value as any
        const pKey =
          (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key
        const pId = r.prompt_id || (r as any).canonical_prompt_id
        const matches = (keyOrId: string) => pKey === keyOrId || pId === keyOrId

        if (matches(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key)) {
          newLoadedState.hunger_pattern = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P2_DELAYED_MEAL.key)) {
          newLoadedState.delayed_meal_response = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P3_POST_MEAL.key)) {
          newLoadedState.post_meal = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P4_HUNGER_RETURN.key)) {
          newLoadedState.hunger_return = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key)) {
          newLoadedState.food_demands = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key)) {
          newLoadedState.bowel_rhythm = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P7_STOOL_PATTERN.key)) {
          newLoadedState.stool_pattern = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key)) {
          newLoadedState.sleep_pattern = Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : Array.isArray(sVal?.value)
              ? sVal.value
              : Array.isArray(sVal)
                ? sVal
                : sVal?.choice
                  ? [sVal.choice]
                  : []
        } else if (matches(AYV_C2_PROMPTS.P9_WAKING.key)) {
          newLoadedState.waking = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key)) {
          newLoadedState.energy_distribution = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P11_BODY_PACE.key)) {
          newLoadedState.body_pace = sVal?.value || sVal?.choice
        } else if (matches(AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key)) {
          newLoadedState.historical_confidence = sVal?.value || sVal?.choice
        }
      }

      // 5. Atualizar respostas e estado local da nova revisão
      setRawResponses((prev) => [...prev, ...persistedActiveResponses])
      setChapterState(newLoadedState)

      // 6. Só então comutar revisão ativa e navegar para o Momento 1 editável
      setActiveRevision(nextRevisionNumber)
      setIsReviewOnly(false)
      setStage('momento1')
    } catch (err) {
      console.error('Falha ao abrir correção do Capítulo 2:', err)
      // Rollback seguro em caso de falha: permanece no encerramento anterior
      setRawResponses(previousRawResponses)
      setActiveRevision(previousActiveRevision)
      setPersistedActiveChapter2Revision(enrollmentId, previousActiveRevision)
      setCorrectionError('Não foi possível abrir a correção agora. Tente novamente.')
      setStage('closing')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full">
      {/* Banner de Modo Revisão Somente-Leitura com identificação explícita do Capítulo 2 */}
      {isReviewOnly && (
        <div
          data-testid="banner-c2-review-mode"
          className="sticky top-0 z-30 mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between text-xs backdrop-blur-md"
        >
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Eye className="w-4 h-4 text-primary" />
            <span>Capítulo 2 — {AYV_C2_TEXTS.REVISION_BANNER}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsReviewOnly(false)
              setStage('closing')
            }}
            className="text-xs h-7 px-3 bg-background"
          >
            {AYV_C2_TEXTS.REVISION_RETURN_CMD}
          </Button>
        </div>
      )}

      {/* Abertura do Capítulo 2 */}
      {stage === 'opening' && (
        <AyurvedaChapter2Opening
          onStartQuestions={() => setStage('momento1')}
          onBackToHub={onBackToHub}
        />
      )}

      {/* Momento 1: Fome */}
      {stage === 'momento1' && (
        <div className="space-y-6">
          <AyurvedaC2Momento1Hunger
            hungerPatternChoices={chapterState.hunger_pattern}
            delayedMealChoices={chapterState.delayed_meal_response}
            treatmentVariant={treatmentVariant}
            onSaveHungerPattern={handleSaveHungerPattern}
            onSaveDelayedMeal={handleSaveDelayedMeal}
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
              onClick={() => setStage('momento2')}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 whitespace-normal shrink-0"
            >
              <span>Avançar para Digestão</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}

      {/* Momento 2: Digestão */}
      {stage === 'momento2' && (
        <div className="space-y-6">
          <AyurvedaC2Momento2Digestion
            postMealChoices={chapterState.post_meal}
            hungerReturnChoice={chapterState.hunger_return}
            foodDemandsChoices={chapterState.food_demands}
            treatmentVariant={treatmentVariant}
            onSavePostMeal={handleSavePostMeal}
            onSaveHungerReturn={handleSaveHungerReturn}
            onSaveFoodDemands={handleSaveFoodDemands}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStage('momento1')}
              className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Fome</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setStage('momento3')}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 whitespace-normal shrink-0"
            >
              <span>Avançar para Eliminação</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}

      {/* Momento 3: Eliminação */}
      {stage === 'momento3' && (
        <div className="space-y-6">
          <AyurvedaC2Momento3Elimination
            bowelRhythmChoice={chapterState.bowel_rhythm}
            stoolPatternChoices={chapterState.stool_pattern}
            onSaveBowelRhythm={handleSaveBowelRhythm}
            onSaveStoolPattern={handleSaveStoolPattern}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStage('momento2')}
              className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Digestão</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setStage('momento4')}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 whitespace-normal shrink-0"
            >
              <span>Avançar para Sono</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}

      {/* Momento 4: Sono */}
      {stage === 'momento4' && (
        <div className="space-y-6">
          <AyurvedaC2Momento4Sleep
            sleepPatternChoices={chapterState.sleep_pattern}
            wakingChoice={chapterState.waking}
            onSaveSleepPattern={handleSaveSleepPattern}
            onSaveWaking={handleSaveWaking}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStage('momento3')}
              className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Eliminação</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setStage('momento5')}
              className="text-xs h-9 px-3 sm:px-4 gap-1.5 whitespace-normal shrink-0"
            >
              <span>Avançar para Energia</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}

      {/* Momento 5: Energia */}
      {stage === 'momento5' && (
        <div className="space-y-6">
          <AyurvedaC2Momento5Energy
            energyDistributionChoice={chapterState.energy_distribution}
            bodyPaceChoice={chapterState.body_pace}
            historicalConfidenceChoice={chapterState.historical_confidence}
            onSaveEnergyDistribution={handleSaveEnergyDistribution}
            onSaveBodyPace={handleSaveBodyPace}
            onSaveHistoricalConfidence={handleSaveHistoricalConfidence}
            disabled={isReviewOnly}
          />
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStage('momento4')}
              className="text-xs h-9 gap-1.5 whitespace-normal shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Sono</span>
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

      {/* Encerramento do Capítulo 2 */}
      {stage === 'closing' && (
        <AyurvedaChapter2Closing
          state={chapterState}
          isCompleted={isCompleted}
          treatmentVariant={treatmentVariant}
          onSaveAndContinueLater={onBackToHub}
          onCompleteChapter={handleCompleteChapter2}
          onReviewResponses={() => {
            if (onEnterReview) {
              onEnterReview()
            }
            handleReviewResponses()
          }}
          onStartCorrection={() => {
            if (onStartCorrection) {
              onStartCorrection()
            }
            handleStartCorrection()
          }}
          onBackToHub={onBackToHub}
          loading={saving}
          correctionError={correctionError}
          onClearCorrectionError={() => setCorrectionError(null)}
        />
      )}
    </div>
  )
}

export default AyurvedaChapter2Flow
