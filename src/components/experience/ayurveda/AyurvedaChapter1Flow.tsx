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
} from '@/services/ayurvedaChapter1'
import { AvatarPresentation } from '@/services/avatarCompositor'
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

export const AyurvedaChapter1Flow: React.FC<AyurvedaChapter1FlowProps> = ({
  enrollmentId,
  experienceId,
  respondentUserId,
  userPresentation = 'feminine',
  avatarDeferred = false,
  initialShowPostAvatarTransition = false,
  onClose,
  onCompleted,
  onOpenAvatarCustomization,
}) => {
  const [stage, setStage] = useState<Chapter1Stage>(() =>
    initialShowPostAvatarTransition ? 'post_avatar_transition' : 'hub',
  )
  const [isReviewOnly, setIsReviewOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enrollmentExp, setEnrollmentExp] = useState<EnrollmentExperienceRecord | null>(null)

  // Estado das respostas do Capítulo 1
  const [chapterState, setChapterState] = useState<AyurvedaChapter1State>({})
  const [rawResponses, setRawResponses] = useState<ExperienceResponseRecord[]>([])

  // Carregar respostas existentes com IDs canônicos AYV_C1
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
      setRawResponses(responses)

      const loadedState: AyurvedaChapter1State = {}

      for (const r of responses) {
        const sVal = r.structured_value as any
        const pKey =
          (r as any).prompt_key || sVal?.prompt_key || (sVal?.metadata as any)?.prompt_key

        if (
          r.prompt_id === AYV_C1_PROMPTS.P1_STRUCTURE.id ||
          pKey === AYV_C1_PROMPTS.P1_STRUCTURE.key
        ) {
          loadedState.structure_choice = sVal?.value || sVal?.choice || sVal?.structure_choice
          loadedState.secondary_structure_choice =
            sVal?.secondary_choice || sVal?.secondaryStructureChoice
        } else if (
          r.prompt_id === AYV_C1_PROMPTS.P1_DURATION.id ||
          pKey === AYV_C1_PROMPTS.P1_DURATION.key
        ) {
          loadedState.structure_duration = sVal?.value || sVal?.choice || sVal?.durationChoice
        } else if (
          r.prompt_id === AYV_C1_PROMPTS.P2_SKIN.id ||
          pKey === AYV_C1_PROMPTS.P2_SKIN.key
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
          r.prompt_id === AYV_C1_PROMPTS.P3_HAIR.id ||
          pKey === AYV_C1_PROMPTS.P3_HAIR.key
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
          r.prompt_id === AYV_C1_PROMPTS.P4_TEMPERATURE.id ||
          pKey === AYV_C1_PROMPTS.P4_TEMPERATURE.key
        ) {
          loadedState.temperature_choice = sVal?.value || sVal?.choice
        } else if (
          r.prompt_id === AYV_C1_PROMPTS.P5_THIRST.id ||
          pKey === AYV_C1_PROMPTS.P5_THIRST.key
        ) {
          loadedState.thirst_choice = sVal?.value || sVal?.choice
        } else if (
          r.prompt_id === AYV_C1_PROMPTS.P5_DRINK_TEMP.id ||
          pKey === AYV_C1_PROMPTS.P5_DRINK_TEMP.key
        ) {
          loadedState.drink_temperature_choice = sVal?.value || sVal?.choice
        } else if (
          r.prompt_id === AYV_C1_PROMPTS.P5_SWEAT.id ||
          pKey === AYV_C1_PROMPTS.P5_SWEAT.key
        ) {
          loadedState.sweat_choice = sVal?.value || sVal?.choice
        }
      }

      setChapterState(loadedState)
    } catch (err) {
      console.error('Erro ao carregar respostas do Capítulo 1:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResponses()
  }, [enrollmentId, experienceId])

  // Derivação canônica explícita do Capítulo 1 — NUNCA usa enrollmentExp.progress_status
  const derived = deriveChapter1Status(rawResponses)
  const isCompleted = derived.status === 'completed'
  const isReadyToComplete = derived.status === 'ready_to_complete'
  const chapter1Status: AyurvedaChapter1Status = derived.status
  const chapter1Progress = derived.progress
  const answeredStepsCount = derived.answeredStepsCount
  const totalSteps = derived.totalSteps
  const firstUnansweredStep = derived.firstUnansweredStep

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
        contradiction_flag: isChanged,
        notes_for_professional: isChanged
          ? 'Interagente relatou grande mudança corporal ou dificuldade de comparação.'
          : undefined,
      }

      await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
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
          metadata: meta,
        },
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
      }

      await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: AYV_C1_PROMPTS.P1_DURATION.id,
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
          metadata: meta,
        },
      })
    }
  }

  // Salvar Tela 2
  const handleSaveStep2 = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, skin_choices: choices }))
    if (isReviewOnly) return

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
    }

    await experienceResponseService.saveResponse({
      enrollmentId,
      experienceId,
      promptId: AYV_C1_PROMPTS.P2_SKIN.id,
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
        metadata: meta,
      },
    })
  }

  // Salvar Tela 3
  const handleSaveStep3 = async (choices: string[]) => {
    setChapterState((prev) => ({ ...prev, hair_choices: choices }))
    if (isReviewOnly) return

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
      notes_for_professional: isUnsure
        ? 'Interagente indicou ausência de referência suficiente sobre o cabelo natural.'
        : undefined,
    }

    await experienceResponseService.saveResponse({
      enrollmentId,
      experienceId,
      promptId: AYV_C1_PROMPTS.P3_HAIR.id,
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
        metadata: meta,
      },
    })
  }

  // Salvar Tela 4
  const handleSaveStep4 = async (choice: string) => {
    setChapterState((prev) => ({ ...prev, temperature_choice: choice }))
    if (isReviewOnly) return

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
    }

    await experienceResponseService.saveResponse({
      enrollmentId,
      experienceId,
      promptId: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
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
        metadata: meta,
      },
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
      }

      await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: AYV_C1_PROMPTS.P5_THIRST.id,
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
          metadata: meta,
        },
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
      }

      await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: AYV_C1_PROMPTS.P5_DRINK_TEMP.id,
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
          metadata: meta,
        },
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
      }

      await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: AYV_C1_PROMPTS.P5_SWEAT.id,
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
          metadata: meta,
        },
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

  // Concluir Capítulo 1
  const handleCompleteChapter1 = async () => {
    setSaving(true)
    try {
      const nowIso = new Date().toISOString()

      // 1. Gravar registro canônico explícito de conclusão do Capítulo 1
      const completionResp = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        respondentUserId,
        responseType: 'ChapterCompletion' as any,
        promptVersion: 1,
        promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        canonicalPromptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        stepOrder: 5,
        accessClass: 'shared_care',
        changeReason: 'Conclusão canônica do Capítulo 1 de Ayurveda',
        structuredValue: {
          completed: true,
          completed_at: nowIso,
          chapter_id: 'capitulo-1-estrutura-caracteristicas',
          experience_version: AYURVEDA_EXPERIENCE_VERSION,
          step_order: 5,
          metadata: {
            prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
            canonical_prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
            completed: true,
            completed_at: nowIso,
            chapter_id: 'capitulo-1-estrutura-caracteristicas',
            experience_version: AYURVEDA_EXPERIENCE_VERSION,
          },
        },
      })

      // Atualiza lista local de respostas com a de conclusão canônica
      setRawResponses((prev) => {
        const existingIdx = prev.findIndex(
          (r) =>
            r.prompt_id === AYV_C1_PROMPTS.CHAPTER_COMPLETION.id ||
            (r as any).prompt_key === AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
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
    setIsReviewOnly(true)
    setStage('step1')
  }

  // Corrigir minhas respostas com histórico preservado
  const handleStartCorrection = () => {
    setIsReviewOnly(false)
    setStage('step1')
  }

  return (
    <div className="w-full">
      {/* Banner de Modo Revisão Somente-Leitura */}
      {isReviewOnly && (
        <div
          data-testid="banner-review-mode"
          className="sticky top-0 z-30 mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between text-xs backdrop-blur-md"
        >
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Eye className="w-4 h-4 text-primary" />
            <span>{AYV_TEXTS.REVISION_BANNER}</span>
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
          onOpenCustomization={onOpenAvatarCustomization}
          onCorrectChapter1={handleStartCorrection}
          isChapter1Completed={isCompleted}
          chapter1Status={chapter1Status}
          chapter1Progress={chapter1Progress}
          chapter1StepOrder={currentStepNum}
          answeredStepsCount={answeredStepsCount}
          totalSteps={totalSteps}
          avatarDeferred={avatarDeferred}
          onClose={onClose}
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
          onBackToHub={() => setStage('hub')}
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
          onSaveAndContinueLater={() => setStage('hub')}
          onCompleteChapter={handleCompleteChapter1}
          onReviewResponses={handleReviewResponses}
          onStartCorrection={handleStartCorrection}
          loading={saving}
        />
      )}
    </div>
  )
}
export default AyurvedaChapter1Flow
