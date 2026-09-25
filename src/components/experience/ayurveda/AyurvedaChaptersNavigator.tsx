import React, { useState, useEffect, useCallback } from 'react'
import { AyurvedaChaptersHub } from './AyurvedaChaptersHub'
import { AyurvedaChapter1Flow } from './AyurvedaChapter1Flow'
import { AyurvedaChapter2Flow } from './AyurvedaChapter2Flow'
import { AyurvedaPostAvatarTransition } from './AyurvedaPostAvatarTransition'
import { AvatarPresentation } from '@/services/avatarCompositor'
import { deriveChapter1Status, AyurvedaChapter1Status } from '@/services/ayurvedaChapter1'
import {
  deriveChapter2Status,
  AyurvedaChapter2Status,
  Chapter2TreatmentVariant,
  getPersistedActiveChapter2Revision,
  migrateLegacyChapter2Responses,
} from '@/services/ayurvedaChapter2'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
import { ExperienceResponseRecord, EnrollmentExperienceRecord } from '@/types/cer'

export type AyurvedaNavigationChapterId = 'c1' | 'c2'

export type AyurvedaNavigationChapterMode =
  | 'intro'
  | 'answering'
  | 'ready_to_complete'
  | 'completed'
  | 'review'
  | 'correcting'

export type AyurvedaNavigationState =
  | {
      chapterId: null
      mode: 'hub' | 'post_avatar_transition'
      currentStep: null
      activeRevision: null
    }
  | {
      chapterId: 'c1'
      mode: AyurvedaNavigationChapterMode
      currentStep: number | null
      activeRevision: null
    }
  | {
      chapterId: 'c2'
      mode: AyurvedaNavigationChapterMode
      currentStep: number | null
      activeRevision: number | null
    }

export interface AyurvedaChaptersNavigatorProps {
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

export const AyurvedaChaptersNavigator: React.FC<AyurvedaChaptersNavigatorProps> = ({
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
  // Fonte única de verdade discriminada para capítulo, modo e etapa
  const [navState, setNavState] = useState<AyurvedaNavigationState>(() => {
    if (initialShowPostAvatarTransition) {
      return {
        chapterId: null,
        mode: 'post_avatar_transition',
        currentStep: null,
        activeRevision: null,
      }
    }
    return {
      chapterId: null,
      mode: 'hub',
      currentStep: null,
      activeRevision: null,
    }
  })

  const [loading, setLoading] = useState(true)
  const [rawResponses, setRawResponses] = useState<ExperienceResponseRecord[]>([])
  const [enrollmentExp, setEnrollmentExp] = useState<EnrollmentExperienceRecord | null>(null)

  // Carregar respostas e progresso do backend / demoAdapter
  const reloadData = useCallback(async () => {
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
    } catch (err) {
      console.error('Erro ao carregar dados do navegador de Ayurveda:', err)
    } finally {
      setLoading(false)
    }
  }, [enrollmentId, experienceId])

  useEffect(() => {
    reloadData()
  }, [reloadData])

  // Derivações canônicas de C1 e C2
  const derivedC1 = deriveChapter1Status(rawResponses)
  const isC1Completed = derivedC1.status === 'completed'
  const isC1ReadyToComplete = derivedC1.status === 'ready_to_complete'
  const chapter1Status: AyurvedaChapter1Status = derivedC1.status
  const chapter1Progress = derivedC1.progress
  const answeredStepsCountC1 = derivedC1.answeredStepsCount
  const totalStepsC1 = derivedC1.totalSteps
  const firstUnansweredStepC1 = derivedC1.firstUnansweredStep

  const persistedC2Rev = getPersistedActiveChapter2Revision(enrollmentId)
  const { migratedResponses: migratedC2 } = migrateLegacyChapter2Responses(rawResponses)
  const derivedC2 = deriveChapter2Status(migratedC2, persistedC2Rev ?? undefined)
  const isC2Completed = derivedC2.status === 'completed'
  const isC2ReadyToComplete = derivedC2.status === 'ready_to_complete'
  const chapter2Status: AyurvedaChapter2Status = derivedC2.status
  const chapter2Progress = derivedC2.progress
  const answeredMomentsCountC2 = derivedC2.answeredMomentsCount
  const totalMomentsC2 = derivedC2.totalMoments
  const firstUnansweredMomentC2 = derivedC2.firstUnansweredMoment

  const treatmentVariant: Chapter2TreatmentVariant =
    userPresentation === 'feminine'
      ? 'feminino'
      : userPresentation === 'masculine'
        ? 'masculino'
        : 'neutro'

  // Transições canônicas do Hub
  const handleExitToHub = useCallback(() => {
    // Voltar ao hub limpa capítulo, modo e etapa anteriores
    setNavState({
      chapterId: null,
      mode: 'hub',
      currentStep: null,
      activeRevision: null,
    })
    reloadData()
  }, [reloadData])

  // Ações explícitas do Hub para Capítulo 1
  const handleStartChapter1FromHub = useCallback(() => {
    if (isC1Completed) {
      setNavState({
        chapterId: 'c1',
        mode: 'review',
        currentStep: 1,
        activeRevision: null,
      })
    } else if (isC1ReadyToComplete) {
      setNavState({
        chapterId: 'c1',
        mode: 'ready_to_complete',
        currentStep: 5,
        activeRevision: null,
      })
    } else if (chapter1Status === 'in_progress') {
      setNavState({
        chapterId: 'c1',
        mode: 'answering',
        currentStep: firstUnansweredStepC1 || 1,
        activeRevision: null,
      })
    } else {
      setNavState({
        chapterId: 'c1',
        mode: 'intro',
        currentStep: null,
        activeRevision: null,
      })
    }
  }, [isC1Completed, isC1ReadyToComplete, chapter1Status, firstUnansweredStepC1])

  const handleReviewChapter1 = useCallback(() => {
    setNavState({
      chapterId: 'c1',
      mode: 'review',
      currentStep: 1,
      activeRevision: null,
    })
  }, [])

  const handleCorrectChapter1 = useCallback(() => {
    setNavState({
      chapterId: 'c1',
      mode: 'correcting',
      currentStep: 1,
      activeRevision: null,
    })
  }, [])

  // Ações explícitas do Hub para Capítulo 2
  const handleStartChapter2FromHub = useCallback(() => {
    if (isC2Completed) {
      setNavState({
        chapterId: 'c2',
        mode: 'review',
        currentStep: 1,
        activeRevision: persistedC2Rev ?? derivedC2.activeRevisionNumber ?? 1,
      })
    } else if (isC2ReadyToComplete) {
      setNavState({
        chapterId: 'c2',
        mode: 'ready_to_complete',
        currentStep: 5,
        activeRevision: persistedC2Rev ?? derivedC2.activeRevisionNumber ?? 1,
      })
    } else if (chapter2Status === 'in_progress') {
      setNavState({
        chapterId: 'c2',
        mode: 'answering',
        currentStep: firstUnansweredMomentC2 || 1,
        activeRevision: persistedC2Rev ?? derivedC2.activeRevisionNumber ?? 1,
      })
    } else {
      setNavState({
        chapterId: 'c2',
        mode: 'intro',
        currentStep: null,
        activeRevision: persistedC2Rev ?? derivedC2.activeRevisionNumber ?? 1,
      })
    }
  }, [
    isC2Completed,
    isC2ReadyToComplete,
    chapter2Status,
    firstUnansweredMomentC2,
    persistedC2Rev,
    derivedC2.activeRevisionNumber,
  ])

  const handleReviewChapter2 = useCallback(() => {
    setNavState({
      chapterId: 'c2',
      mode: 'review',
      currentStep: 1,
      activeRevision: persistedC2Rev ?? derivedC2.activeRevisionNumber ?? 1,
    })
  }, [persistedC2Rev, derivedC2.activeRevisionNumber])

  const handleCorrectChapter2 = useCallback(() => {
    setNavState({
      chapterId: 'c2',
      mode: 'correcting',
      currentStep: 1,
      activeRevision: (persistedC2Rev ?? derivedC2.activeRevisionNumber ?? 1) + 1,
    })
  }, [persistedC2Rev, derivedC2.activeRevisionNumber])

  // RENDERIZAÇÃO CONFORME ESTADO CANÔNICO

  // 1. Transição Pós-Avatar
  if (navState.chapterId === null) {
    if (navState.mode === 'post_avatar_transition') {
      return (
        <AyurvedaPostAvatarTransition
          onStartChapter1={() => {
            setNavState({
              chapterId: 'c1',
              mode: 'intro',
              currentStep: null,
              activeRevision: null,
            })
          }}
        />
      )
    }

    // Hub dos Capítulos (renderizado diretamente pelo navegador, fora do C1)
    return (
      <AyurvedaChaptersHub
        onStartChapter1={handleStartChapter1FromHub}
        onStartChapter2={handleStartChapter2FromHub}
        onOpenCustomization={onOpenAvatarCustomization}
        onCorrectChapter1={handleCorrectChapter1}
        onCorrectChapter2={handleCorrectChapter2}
        isChapter1Completed={isC1Completed}
        chapter1Status={chapter1Status}
        chapter1Progress={chapter1Progress}
        chapter1StepOrder={firstUnansweredStepC1 || 1}
        answeredStepsCount={answeredStepsCountC1}
        totalSteps={totalStepsC1}
        chapter2Status={chapter2Status}
        chapter2Progress={chapter2Progress}
        answeredMomentsCountC2={answeredMomentsCountC2}
        totalMomentsC2={totalMomentsC2}
        avatarDeferred={avatarDeferred}
        onClose={onClose}
      />
    )
  }

  // 3. Capítulo 1 subordinado
  if (navState.chapterId === 'c1') {
    const c1State = navState
    return (
      <AyurvedaChapter1Flow
        enrollmentId={enrollmentId}
        experienceId={experienceId}
        respondentUserId={respondentUserId}
        userPresentation={userPresentation}
        avatarDeferred={avatarDeferred}
        mode={c1State.mode}
        initialStep={c1State.currentStep ?? undefined}
        onExitToHub={handleExitToHub}
        onEnterReview={handleReviewChapter1}
        onStartCorrection={handleCorrectChapter1}
        onClose={onClose}
        onCompleted={() => {
          reloadData()
          onCompleted?.()
        }}
        onOpenAvatarCustomization={onOpenAvatarCustomization}
      />
    )
  }

  // 4. Capítulo 2 subordinado
  if (navState.chapterId === 'c2') {
    const c2State = navState
    return (
      <AyurvedaChapter2Flow
        enrollmentId={enrollmentId}
        experienceId={experienceId}
        respondentUserId={respondentUserId}
        treatmentVariant={treatmentVariant}
        mode={c2State.mode}
        revisionNumber={c2State.activeRevision ?? undefined}
        initialStep={c2State.currentStep ?? undefined}
        onBackToHub={handleExitToHub}
        onEnterReview={handleReviewChapter2}
        onStartCorrection={handleCorrectChapter2}
        onCompleted={() => {
          reloadData()
          onCompleted?.()
        }}
      />
    )
  }

  return null
}

export default AyurvedaChaptersNavigator
