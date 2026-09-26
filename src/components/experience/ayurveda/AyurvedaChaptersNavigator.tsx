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
  createChapter2Revision,
  setPersistedActiveChapter2Revision,
  getPersistedActiveChapter2Revision,
  migrateLegacyChapter2Responses,
  getChapter2RevisionPromptId,
  getChapter2BasePromptId,
  getResponseRevisionNumber as getChapter2ResponseRevisionNumber,
  AYV_C2_PROMPTS,
} from '@/services/ayurvedaChapter2'
import {
  createChapter1Revision,
  setPersistedActiveChapter1Revision,
  getPersistedActiveChapter1Revision,
  migrateLegacyChapter1Responses,
  getChapter1RevisionPromptId,
  getChapter1BasePromptId,
  getChapter1ResponseRevisionNumber,
  AYV_C1_PROMPTS,
} from '@/services/ayurvedaChapter1'
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
      activeRevision: number | null
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

  const handleCorrectionStartedInC1 = useCallback(() => {
    const currentPersisted = getPersistedActiveChapter1Revision(enrollmentId)
    setNavState((prev): AyurvedaNavigationState => {
      return {
        chapterId: 'c1',
        mode: 'correcting',
        currentStep: 1,
        activeRevision:
          currentPersisted ?? (prev.chapterId === 'c1' ? prev.activeRevision : null) ?? 2,
      }
    })
  }, [enrollmentId])

  const handleCorrectionStartedInC2 = useCallback(() => {
    const currentPersisted = getPersistedActiveChapter2Revision(enrollmentId)
    setNavState((prev): AyurvedaNavigationState => {
      return {
        chapterId: 'c2',
        mode: 'correcting',
        currentStep: 1,
        activeRevision:
          currentPersisted ?? (prev.chapterId === 'c2' ? prev.activeRevision : null) ?? 2,
      }
    })
  }, [enrollmentId])

  useEffect(() => {
    reloadData()
  }, [reloadData])

  // Derivações canônicas de C1 e C2
  const persistedC1Rev = getPersistedActiveChapter1Revision(enrollmentId)
  const { migratedResponses: migratedC1 } = migrateLegacyChapter1Responses(rawResponses)
  const derivedC1 = deriveChapter1Status(migratedC1, persistedC1Rev ?? undefined)
  const isC1Completed = derivedC1.status === 'completed'
  const isC1ReadyToComplete = derivedC1.status === 'ready_to_complete'
  const chapter1Status: AyurvedaChapter1Status = derivedC1.status
  const chapter1Progress = derivedC1.progress
  const answeredStepsCountC1 = derivedC1.answeredStepsCount
  const totalStepsC1 = derivedC1.totalSteps
  const firstUnansweredStepC1 = derivedC1.firstUnansweredStep

  // Identificar última revisão concluída de C1
  let c1LastCompletedRev: number | null = null
  for (const r of migratedC1) {
    const pId = (r as any).prompt_id || (r as any).canonical_prompt_id
    const pKey = (r as any).prompt_key || (r as any).structured_value?.prompt_key
    const bId = getChapter1BasePromptId(pId || '')
    const bKey = getChapter1BasePromptId(pKey || '')
    if (
      bId === AYV_C1_PROMPTS.CHAPTER_COMPLETION.id ||
      bKey === AYV_C1_PROMPTS.CHAPTER_COMPLETION.key
    ) {
      const sVal = (r as any).structured_value
      const isComp =
        sVal?.completed === true || sVal?.value?.completed === true || sVal?.status === 'completed'
      if (isComp) {
        const rev = getChapter1ResponseRevisionNumber(r)
        if (c1LastCompletedRev === null || rev > c1LastCompletedRev) {
          c1LastCompletedRev = rev
        }
      }
    }
  }

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

  // Identificar última revisão concluída de C2
  let c2LastCompletedRev: number | null = null
  for (const r of migratedC2) {
    const pId = (r as any).prompt_id || (r as any).canonical_prompt_id
    const pKey = (r as any).prompt_key || (r as any).structured_value?.prompt_key
    const bId = getChapter2BasePromptId(pId || '')
    const bKey = getChapter2BasePromptId(pKey || '')
    if (
      bId === AYV_C2_PROMPTS.CHAPTER_COMPLETION.id ||
      bKey === AYV_C2_PROMPTS.CHAPTER_COMPLETION.key
    ) {
      const sVal = (r as any).structured_value
      const isComp =
        sVal?.completed === true || sVal?.value?.completed === true || sVal?.status === 'completed'
      if (isComp) {
        const rev = getChapter2ResponseRevisionNumber(r)
        if (c2LastCompletedRev === null || rev > c2LastCompletedRev) {
          c2LastCompletedRev = rev
        }
      }
    }
  }

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
    const currentPersisted = getPersistedActiveChapter1Revision(enrollmentId)
    const effectiveRev = currentPersisted ?? derivedC1.activeRevisionNumber ?? 1
    // Se há revisão ativa > 1 incompleta (sem conclusão), retoma em correcting preenchido
    if (
      (currentPersisted && currentPersisted > 1 && !isC1Completed) ||
      (derivedC1.activeRevisionNumber > 1 && !isC1Completed)
    ) {
      setNavState({
        chapterId: 'c1',
        mode: 'correcting',
        currentStep: firstUnansweredStepC1 || 1,
        activeRevision: effectiveRev,
      })
    } else if (isC1Completed) {
      setNavState({
        chapterId: 'c1',
        mode: 'review',
        currentStep: 1,
        activeRevision: effectiveRev,
      })
    } else if (isC1ReadyToComplete) {
      setNavState({
        chapterId: 'c1',
        mode: 'ready_to_complete',
        currentStep: 5,
        activeRevision: effectiveRev,
      })
    } else if (chapter1Status === 'in_progress') {
      setNavState({
        chapterId: 'c1',
        mode: 'answering',
        currentStep: firstUnansweredStepC1 || 1,
        activeRevision: effectiveRev,
      })
    } else {
      setNavState({
        chapterId: 'c1',
        mode: 'answering',
        currentStep: 1,
        activeRevision: effectiveRev,
      })
    }
  }, [
    enrollmentId,
    isC1Completed,
    isC1ReadyToComplete,
    chapter1Status,
    firstUnansweredStepC1,
    derivedC1.activeRevisionNumber,
  ])

  const handleReviewChapter1 = useCallback(() => {
    const currentPersisted = getPersistedActiveChapter1Revision(enrollmentId)
    setNavState({
      chapterId: 'c1',
      mode: 'review',
      currentStep: 1,
      activeRevision: currentPersisted ?? derivedC1.activeRevisionNumber ?? 1,
    })
  }, [enrollmentId, derivedC1.activeRevisionNumber])

  const handleExitReviewChapter1 = useCallback(() => {
    const currentPersisted = getPersistedActiveChapter1Revision(enrollmentId)
    setNavState((prev): AyurvedaNavigationState => {
      return {
        chapterId: 'c1',
        mode: isC1Completed ? 'completed' : 'ready_to_complete',
        currentStep: 5,
        activeRevision:
          currentPersisted ?? (prev.chapterId === 'c1' ? prev.activeRevision : null) ?? 1,
      }
    })
  }, [enrollmentId, isC1Completed])

  const handleStartCorrectionC1 = useCallback(async () => {
    try {
      // 1. Carregar respostas frescas
      const freshResponses = await experienceResponseService.listResponsesByExperience(
        enrollmentId,
        experienceId,
      )
      const { migratedResponses } = migrateLegacyChapter1Responses(
        freshResponses.length > 0 ? freshResponses : rawResponses,
      )

      // 2. Criar nova revisão canônica
      const { nextRevisionNumber, newActiveResponses } = createChapter1Revision({
        existingResponses: migratedResponses,
        enrollmentId,
        experienceId,
        respondentUserId,
      })

      // 3. Persistir cópias da nova revisão com ID físico canônico exclusivo
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

      // Validação: garantir que todas as cópias foram persistidas
      if (persistedCopies.length === 0 || persistedCopies.length !== newActiveResponses.length) {
        throw new Error(
          `Falha ao persistir cópias da revisão ${nextRevisionNumber}: persistidas ${persistedCopies.length} de ${newActiveResponses.length}`,
        )
      }

      // 4. Persistir a nova revisão ativa no storage SOMENTE após sucesso de todas as cópias
      setPersistedActiveChapter1Revision(enrollmentId, nextRevisionNumber)

      // 5. Atualizar respostas em cache e transicionar navegação canônica
      await reloadData()

      setNavState({
        chapterId: 'c1',
        mode: 'correcting',
        currentStep: 1,
        activeRevision: nextRevisionNumber,
      })
    } catch (err) {
      console.error('Erro ao iniciar correção do C1 a partir do hub:', err)
      // Fallback gracioso: abre o encerramento do C1 para o usuário tentar novamente
      setNavState({
        chapterId: 'c1',
        mode: 'ready_to_complete',
        currentStep: 5,
        activeRevision: persistedC1Rev ?? derivedC1.activeRevisionNumber ?? 1,
      })
    }
  }, [
    enrollmentId,
    experienceId,
    respondentUserId,
    rawResponses,
    reloadData,
    persistedC1Rev,
    derivedC1.activeRevisionNumber,
  ])

  const handleCorrectChapter1 = handleStartCorrectionC1

  const handleStartCorrectionC2 = useCallback(async () => {
    try {
      // 1. Carregar respostas frescas
      const freshResponses = await experienceResponseService.listResponsesByExperience(
        enrollmentId,
        experienceId,
      )
      const { migratedResponses } = migrateLegacyChapter2Responses(
        freshResponses.length > 0 ? freshResponses : rawResponses,
      )

      // 2. Criar nova revisão canônica
      const { nextRevisionNumber, newActiveResponses } = createChapter2Revision({
        existingResponses: migratedResponses,
        enrollmentId,
        experienceId,
        respondentUserId,
      })

      // 3. Persistir cópias da nova revisão com ID físico canônico exclusivo
      const persistedCopies: ExperienceResponseRecord[] = []
      for (const item of newActiveResponses) {
        const sVal = (item.structured_value || {}) as any
        const meta = sVal?.metadata || {}
        const pKey = (item as any).prompt_key || meta?.prompt_key || item.prompt_id
        const baseCanonicalPromptId = getChapter2BasePromptId(
          (item as any).canonical_prompt_id || meta?.canonical_prompt_id || item.prompt_id,
        )
        const physicalPromptId = getChapter2RevisionPromptId(
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
          responseType: item.response_type || ('MultiSelectCards' as any),
          promptVersion: 1,
          promptKey: pKey,
          canonicalPromptId: baseCanonicalPromptId,
          stepOrder: step,
          accessClass: 'shared_care',
          changeReason: `Cópia inicial da revisão ${nextRevisionNumber} do Capítulo 2`,
          structuredValue: enrichedStructuredVal,
        })
        ;(saved as any).revision_number = nextRevisionNumber
        ;(saved as any).prompt_key = pKey
        ;(saved as any).canonical_prompt_id = baseCanonicalPromptId
        persistedCopies.push(saved)
      }

      // Validação: garantir que todas as cópias foram persistidas
      if (persistedCopies.length === 0 || persistedCopies.length !== newActiveResponses.length) {
        throw new Error(
          `Falha ao persistir cópias da revisão ${nextRevisionNumber}: persistidas ${persistedCopies.length} de ${newActiveResponses.length}`,
        )
      }

      // 4. Persistir a nova revisão ativa no storage SOMENTE após sucesso de todas as cópias
      setPersistedActiveChapter2Revision(enrollmentId, nextRevisionNumber)

      // 5. Atualizar respostas em cache e transicionar navegação canônica
      await reloadData()

      setNavState({
        chapterId: 'c2',
        mode: 'correcting',
        currentStep: 1,
        activeRevision: nextRevisionNumber,
      })
    } catch (err) {
      console.error('Erro ao iniciar correção do C2 a partir do hub:', err)
      // Fallback gracioso: abre o encerramento do C2 para o usuário tentar novamente
      setNavState({
        chapterId: 'c2',
        mode: 'ready_to_complete',
        currentStep: 5,
        activeRevision: persistedC2Rev ?? derivedC2.activeRevisionNumber ?? 1,
      })
    }
  }, [
    enrollmentId,
    experienceId,
    respondentUserId,
    rawResponses,
    reloadData,
    persistedC2Rev,
    derivedC2.activeRevisionNumber,
  ])

  // Ações explícitas do Hub para Capítulo 2
  const handleStartChapter2FromHub = useCallback(() => {
    const currentPersisted = getPersistedActiveChapter2Revision(enrollmentId)
    const effectiveRev = currentPersisted ?? derivedC2.activeRevisionNumber ?? 1
    // Se a revisão ativa foi iniciada como correção (revisão > 1 sem conclusão),
    // ao retomar do hub ela deve abrir como 'correcting' editável
    if (
      (currentPersisted && currentPersisted > 1 && !isC2Completed) ||
      (derivedC2.activeRevisionNumber > 1 && !isC2Completed)
    ) {
      setNavState({
        chapterId: 'c2',
        mode: 'correcting',
        currentStep: firstUnansweredMomentC2 || 1,
        activeRevision: effectiveRev,
      })
    } else if (isC2Completed) {
      setNavState({
        chapterId: 'c2',
        mode: 'review',
        currentStep: 1,
        activeRevision: effectiveRev,
      })
    } else if (isC2ReadyToComplete) {
      setNavState({
        chapterId: 'c2',
        mode: 'ready_to_complete',
        currentStep: 5,
        activeRevision: effectiveRev,
      })
    } else if (chapter2Status === 'in_progress') {
      setNavState({
        chapterId: 'c2',
        mode: 'answering',
        currentStep: firstUnansweredMomentC2 || 1,
        activeRevision: effectiveRev,
      })
    } else {
      setNavState({
        chapterId: 'c2',
        mode: 'answering',
        currentStep: 1,
        activeRevision: effectiveRev,
      })
    }
  }, [
    enrollmentId,
    isC2Completed,
    isC2ReadyToComplete,
    chapter2Status,
    firstUnansweredMomentC2,
    derivedC2.activeRevisionNumber,
  ])

  const handleReviewChapter2 = useCallback(() => {
    const currentPersisted = getPersistedActiveChapter2Revision(enrollmentId)
    setNavState({
      chapterId: 'c2',
      mode: 'review',
      currentStep: 1,
      activeRevision: currentPersisted ?? derivedC2.activeRevisionNumber ?? 1,
    })
  }, [enrollmentId, derivedC2.activeRevisionNumber])

  const handleExitReviewChapter2 = useCallback(() => {
    const currentPersisted = getPersistedActiveChapter2Revision(enrollmentId)
    setNavState((prev): AyurvedaNavigationState => {
      return {
        chapterId: 'c2',
        mode: isC2Completed ? 'completed' : 'ready_to_complete',
        currentStep: 5,
        activeRevision:
          currentPersisted ?? (prev.chapterId === 'c2' ? prev.activeRevision : null) ?? 1,
      }
    })
  }, [enrollmentId, isC2Completed])

  const handleCorrectChapter2 = handleStartCorrectionC2

  // RENDERIZAÇÃO CONFORME ESTADO CANÔNICO

  // Renderização de acordo com o estado canônico
  const activeChapterId = navState.chapterId
  if (activeChapterId === 'c1') {
    const currentStep = navState.currentStep
    const c1Mode = navState.mode as AyurvedaNavigationChapterMode
    const activeRev = navState.activeRevision
    return (
      <AyurvedaChapter1Flow
        enrollmentId={enrollmentId}
        experienceId={experienceId}
        respondentUserId={respondentUserId}
        userPresentation={userPresentation}
        avatarDeferred={avatarDeferred}
        mode={c1Mode}
        revisionNumber={activeRev ?? undefined}
        initialStep={currentStep ?? undefined}
        onExitToHub={handleExitToHub}
        onEnterReview={handleReviewChapter1}
        onExitReview={handleExitReviewChapter1}
        onStartCorrection={handleCorrectionStartedInC1}
        onClose={onClose}
        onCompleted={() => {
          reloadData()
          onCompleted?.()
        }}
        onOpenAvatarCustomization={onOpenAvatarCustomization}
      />
    )
  }

  if (activeChapterId === 'c2') {
    const currentStep = navState.currentStep
    const c2Mode = navState.mode as AyurvedaNavigationChapterMode
    const activeRev = navState.activeRevision
    return (
      <AyurvedaChapter2Flow
        enrollmentId={enrollmentId}
        experienceId={experienceId}
        respondentUserId={respondentUserId}
        treatmentVariant={treatmentVariant}
        mode={c2Mode}
        revisionNumber={activeRev ?? undefined}
        initialStep={currentStep ?? undefined}
        onBackToHub={handleExitToHub}
        onEnterReview={handleReviewChapter2}
        onExitReview={handleExitReviewChapter2}
        onStartCorrection={handleCorrectionStartedInC2}
        onCompleted={() => {
          reloadData()
          onCompleted?.()
        }}
      />
    )
  }

  const nullState = navState as { chapterId: null; mode: 'hub' | 'post_avatar_transition' }
  if (nullState.mode === 'post_avatar_transition') {
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
      chapter1ActiveRevision={persistedC1Rev ?? derivedC1.activeRevisionNumber ?? 1}
      chapter1LastCompletedRevision={c1LastCompletedRev}
      chapter1HasCorrectionInProgress={Boolean(
        (persistedC1Rev && persistedC1Rev > (c1LastCompletedRev ?? 0) && !isC1Completed) ||
        (derivedC1.activeRevisionNumber > 1 &&
          !isC1Completed &&
          derivedC1.activeRevisionNumber > (c1LastCompletedRev ?? 0)),
      )}
      chapter2Status={chapter2Status}
      chapter2Progress={chapter2Progress}
      answeredMomentsCountC2={answeredMomentsCountC2}
      totalMomentsC2={totalMomentsC2}
      chapter2ActiveRevision={persistedC2Rev ?? derivedC2.activeRevisionNumber ?? 1}
      chapter2LastCompletedRevision={c2LastCompletedRev}
      chapter2HasCorrectionInProgress={Boolean(
        (persistedC2Rev && persistedC2Rev > (c2LastCompletedRev ?? 0) && !isC2Completed) ||
        (derivedC2.activeRevisionNumber > 1 &&
          !isC2Completed &&
          derivedC2.activeRevisionNumber > (c2LastCompletedRev ?? 0)),
      )}
      avatarDeferred={avatarDeferred}
      onClose={onClose}
    />
  )
}

export default AyurvedaChaptersNavigator
