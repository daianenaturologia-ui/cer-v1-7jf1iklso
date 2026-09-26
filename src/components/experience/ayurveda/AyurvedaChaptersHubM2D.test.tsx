import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AyurvedaChaptersHub, HubCanonicalStateId } from './AyurvedaChaptersHub'
import { AyurvedaChaptersNavigator } from './AyurvedaChaptersNavigator'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
import { demoAdapter } from '@/services/demoAdapter'
import {
  AYV_C1_PROMPTS,
  createChapter1Revision,
  setPersistedActiveChapter1Revision,
  getPersistedActiveChapter1Revision,
} from '@/services/ayurvedaChapter1'
import {
  AYV_C2_PROMPTS,
  createChapter2Revision,
  setPersistedActiveChapter2Revision,
  getPersistedActiveChapter2Revision,
} from '@/services/ayurvedaChapter2'

const DEMO_ENROLLMENT_ID = 'demo-enr-m2d-hub-test'
const DEMO_USER_ID = 'demo-user-hub-test'
const DEMO_EXPERIENCE_ID = 'exp-corpo-fisiologia-07b'

describe('Microlote M2D — Hub Canônico de Corpo & Fisiologia: 20 Testes Canônicos', () => {
  beforeEach(async () => {
    localStorage.clear()
    sessionStorage.clear()
    demoAdapter.enableDemo('mariana')
    const all = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      DEMO_EXPERIENCE_ID,
    )
    const stateResponses = (demoAdapter as any).state?.experienceResponses
    if (Array.isArray(stateResponses)) {
      ;(demoAdapter as any).state.experienceResponses = stateResponses.filter(
        (r: any) => r.enrollment_id !== DEMO_ENROLLMENT_ID,
      )
    }
  })

  // 1. C2 bloqueado antes da conclusão do C1
  it('1. C2 bloqueado antes da conclusão do C1: container inerte, aria-disabled, tabIndex=-1', async () => {
    const user = userEvent.setup()
    const handleStartC2 = vi.fn()

    render(
      <AyurvedaChaptersHub
        chapter1Status="not_started"
        answeredStepsCount={0}
        totalSteps={5}
        chapter2Status="not_started"
        answeredMomentsCountC2={0}
        totalMomentsC2={5}
        onStartChapter2={handleStartC2}
      />,
    )

    // C1 está Não iniciado, C2 deve ser Bloqueado
    const c2Badge = screen.getByText('Bloqueado')
    expect(c2Badge).toBeInTheDocument()
    expect(screen.getByText('Conclua o Capítulo 1 para liberar este capítulo.')).toBeInTheDocument()

    // O container do C2 possui aria-disabled="true" e tabIndex={-1}
    const c2Card = c2Badge.closest('[aria-disabled="true"]')
    expect(c2Card).not.toBeNull()
    expect(c2Card).toHaveAttribute('aria-disabled', 'true')
    expect(c2Card).toHaveAttribute('tabIndex', '-1')

    // Nenhuma ação disponível para C2
    expect(screen.queryByRole('button', { name: /Começar Capítulo 2/i })).not.toBeInTheDocument()
    expect(handleStartC2).not.toHaveBeenCalled()
  })

  // 2. Não iniciado
  it('2. Não iniciado: badge "Não iniciado", textos corretos, botões "Começar Capítulo 1/2"', async () => {
    const user = userEvent.setup()
    const handleStartC1 = vi.fn()
    const handleStartC2 = vi.fn()

    // Com C1 não iniciado
    const { rerender } = render(
      <AyurvedaChaptersHub
        chapter1Status="not_started"
        answeredStepsCount={0}
        totalSteps={5}
        chapter2Status="not_started"
        answeredMomentsCountC2={0}
        totalMomentsC2={5}
        onStartChapter1={handleStartC1}
        onStartChapter2={handleStartC2}
      />,
    )

    expect(screen.getByText('Você ainda não iniciou este capítulo.')).toBeInTheDocument()
    const startC1Btn = screen.getByRole('button', { name: /Começar Capítulo 1/i })
    expect(startC1Btn).toBeInTheDocument()
    await user.click(startC1Btn)
    expect(handleStartC1).toHaveBeenCalledTimes(1)

    // Com C1 concluído e C2 não iniciado
    rerender(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        isChapter1Completed={true}
        answeredStepsCount={5}
        totalSteps={5}
        chapter2Status="not_started"
        answeredMomentsCountC2={0}
        totalMomentsC2={5}
        onStartChapter1={handleStartC1}
        onStartChapter2={handleStartC2}
      />,
    )

    expect(
      screen.getByText('Capítulo liberado. Observe o ritmo da sua fome, digestão, sono e energia.'),
    ).toBeInTheDocument()
    const startC2Btn = screen.getByRole('button', { name: /Começar Capítulo 2/i })
    expect(startC2Btn).toBeInTheDocument()
    await user.click(startC2Btn)
    expect(handleStartC2).toHaveBeenCalledTimes(1)
  })

  // 3. Em andamento com contagem real
  it('3. Em andamento com contagem real: X de 5 etapas/momentos respondidas, ação Retomar', async () => {
    const user = userEvent.setup()
    const handleStartC1 = vi.fn()
    const handleStartC2 = vi.fn()

    const { rerender } = render(
      <AyurvedaChaptersHub
        chapter1Status="in_progress"
        answeredStepsCount={3}
        totalSteps={5}
        chapter2Status="not_started"
        onStartChapter1={handleStartC1}
        onStartChapter2={handleStartC2}
      />,
    )

    expect(screen.getByText('3 de 5 etapas respondidas')).toBeInTheDocument()
    const resumeC1 = screen.getByRole('button', { name: /Retomar Capítulo 1/i })
    expect(resumeC1).toBeInTheDocument()
    await user.click(resumeC1)
    expect(handleStartC1).toHaveBeenCalledTimes(1)

    // Agora C2 em andamento (com C1 concluído)
    rerender(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        isChapter1Completed={true}
        chapter2Status="in_progress"
        answeredMomentsCountC2={2}
        totalMomentsC2={5}
        onStartChapter1={handleStartC1}
        onStartChapter2={handleStartC2}
      />,
    )

    expect(screen.getByText('2 de 5 momentos respondidas')).toBeInTheDocument()
    const resumeC2 = screen.getByRole('button', { name: /Retomar Capítulo 2/i })
    expect(resumeC2).toBeInTheDocument()
    await user.click(resumeC2)
    expect(handleStartC2).toHaveBeenCalledTimes(1)
  })

  // 4. Pronto para concluir sem falso "Concluído"
  it('4. Pronto para concluir sem falso "Concluído": badge "Pronto para concluir", "Revisar e concluir", NUNCA "100% concluído"', async () => {
    const user = userEvent.setup()
    const handleStartC1 = vi.fn()

    render(
      <AyurvedaChaptersHub
        chapter1Status="ready_to_complete"
        answeredStepsCount={5}
        totalSteps={5}
        chapter2Status="not_started"
        onStartChapter1={handleStartC1}
      />,
    )

    expect(screen.getByText('Pronto para concluir')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Suas respostas estão preenchidas. Revise e confirme a conclusão deste capítulo.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('100% concluído')).not.toBeInTheDocument()
    // C2 deve continuar bloqueado porque C1 ainda não foi canonicamente concluído
    expect(screen.getByText('Bloqueado')).toBeInTheDocument()

    const reviewBtn = screen.getByRole('button', { name: /Revisar e concluir/i })
    expect(reviewBtn).toBeInTheDocument()
    await user.click(reviewBtn)
    expect(handleStartC1).toHaveBeenCalledTimes(1)
  })

  // 5. Correção em andamento
  it('5. Correção em andamento: badge "Correção em andamento", "X de 5 etapas revisadas", ação "Retomar correção"', async () => {
    const user = userEvent.setup()
    const handleStartC1 = vi.fn()

    render(
      <AyurvedaChaptersHub
        chapter1Status="in_progress"
        answeredStepsCount={2}
        totalSteps={5}
        chapter1ActiveRevision={2}
        chapter1LastCompletedRevision={1}
        chapter1HasCorrectionInProgress={true}
        onStartChapter1={handleStartC1}
      />,
    )

    expect(screen.getByText('Correção em andamento')).toBeInTheDocument()
    expect(
      screen.getByText(/2 de 5 etapas revisadas\. Você iniciou uma correção das suas respostas\./i),
    ).toBeInTheDocument()
    const resumeCorrectionBtn = screen.getByRole('button', { name: /Retomar correção/i })
    expect(resumeCorrectionBtn).toBeInTheDocument()
    await user.click(resumeCorrectionBtn)
    expect(handleStartC1).toHaveBeenCalledTimes(1)
  })

  // 6. Correção pronta para concluir
  it('6. Correção pronta para concluir: badge "Correção pronta para concluir", ação "Revisar e concluir correção"', async () => {
    const user = userEvent.setup()
    const handleStartC1 = vi.fn()

    render(
      <AyurvedaChaptersHub
        chapter1Status="ready_to_complete"
        answeredStepsCount={5}
        totalSteps={5}
        chapter1ActiveRevision={2}
        chapter1LastCompletedRevision={1}
        chapter1HasCorrectionInProgress={true}
        onStartChapter1={handleStartC1}
      />,
    )

    expect(screen.getByText('Correção pronta para concluir')).toBeInTheDocument()
    expect(
      screen.getByText('Suas correções estão preenchidas. Revise e confirme a nova versão.'),
    ).toBeInTheDocument()
    const reviewCorrectionBtn = screen.getByRole('button', {
      name: /Revisar e concluir correção/i,
    })
    expect(reviewCorrectionBtn).toBeInTheDocument()
    await user.click(reviewCorrectionBtn)
    expect(handleStartC1).toHaveBeenCalledTimes(1)
  })

  // 7. Concluído
  it('7. Concluído: badge "Concluído", texto "100% concluído", ações secundárias Rever + Corrigir', async () => {
    const user = userEvent.setup()
    const handleStartC1 = vi.fn()
    const handleCorrectC1 = vi.fn()

    render(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        isChapter1Completed={true}
        answeredStepsCount={5}
        totalSteps={5}
        onStartChapter1={handleStartC1}
        onCorrectChapter1={handleCorrectC1}
      />,
    )

    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByText('100% concluído')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Corrigir minhas respostas/i })).toBeInTheDocument()
  })

  // 8. Revisão ativa prevalece sobre conclusão antiga
  it('8. Revisão ativa prevalece sobre conclusão antiga: rev ativa 2 não concluída sobrepõe conclusão da rev 1', async () => {
    render(
      <AyurvedaChaptersHub
        chapter1Status="in_progress"
        answeredStepsCount={2}
        totalSteps={5}
        chapter1ActiveRevision={2}
        chapter1LastCompletedRevision={1}
        chapter1HasCorrectionInProgress={true}
      />,
    )

    // Prevalece "Correção em andamento" e NUNCA "Concluído"
    expect(screen.getByText('Correção em andamento')).toBeInTheDocument()
    expect(screen.queryByText('100% concluído')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rever Capítulo 1/i })).not.toBeInTheDocument()
  })

  // 9. "Retomar correção" abre a mesma revisão sem criar nova
  it('9. "Retomar correção" abre a mesma revisão sem criar nova', async () => {
    const user = userEvent.setup()

    // Criar rev 1 concluída no DB
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'slender_frame', choice: 'slender_frame', revision_number: 1 },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: { completed: true, revision_number: 1 },
    })

    // Agora criar revisão 2 com 1 resposta (em andamento)
    const { nextRevisionNumber, newActiveResponses } = createChapter1Revision({
      existingResponses: await experienceResponseService.listResponsesByExperience(
        DEMO_ENROLLMENT_ID,
        DEMO_EXPERIENCE_ID,
      ),
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      respondentUserId: DEMO_USER_ID,
    })
    for (const r of newActiveResponses) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: DEMO_EXPERIENCE_ID,
        promptId: r.prompt_id,
        promptKey: (r as any).prompt_key,
        respondentUserId: DEMO_USER_ID,
        responseType: r.response_type,
        promptVersion: 1,
        structuredValue: r.structured_value,
      })
    }
    setPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID, nextRevisionNumber)

    const responsesCountBefore = (
      await experienceResponseService.listResponsesByExperience(
        DEMO_ENROLLMENT_ID,
        DEMO_EXPERIENCE_ID,
      )
    ).length

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Correção em andamento')).toBeInTheDocument()
    })

    const resumeBtn = screen.getByRole('button', { name: /Retomar correção/i })
    await user.click(resumeBtn)

    // Deve abrir o fluxo C1 em modo correcting na revisão ativa 2
    await waitFor(() => {
      expect(screen.getByTestId('banner-c1-correcting-mode')).toBeInTheDocument()
    })

    // Contagem de respostas no DB NÃO deve ter aumentado (não criou revisão)
    const responsesCountAfter = (
      await experienceResponseService.listResponsesByExperience(
        DEMO_ENROLLMENT_ID,
        DEMO_EXPERIENCE_ID,
      )
    ).length
    expect(responsesCountAfter).toBe(responsesCountBefore)
    expect(getPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID)).toBe(nextRevisionNumber)
  })

  // 10. "Revisar e concluir correção" não cria revisão
  it('10. "Revisar e concluir correção" não cria revisão', async () => {
    const user = userEvent.setup()

    // Criar rev 1 concluída no DB
    const prompts = [
      AYV_C1_PROMPTS.P1_STRUCTURE,
      AYV_C1_PROMPTS.P2_SKIN,
      AYV_C1_PROMPTS.P3_HAIR,
      AYV_C1_PROMPTS.P4_TEMPERATURE,
      AYV_C1_PROMPTS.P5_THIRST,
    ]
    for (const p of prompts) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: DEMO_EXPERIENCE_ID,
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_ID,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        structuredValue: { value: 'opt_1', choice: 'opt_1', revision_number: 1 },
      })
    }
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: { completed: true, revision_number: 1 },
    })

    // Criar cópias para rev 2 (5/5 prontas)
    const { nextRevisionNumber, newActiveResponses } = createChapter1Revision({
      existingResponses: await experienceResponseService.listResponsesByExperience(
        DEMO_ENROLLMENT_ID,
        DEMO_EXPERIENCE_ID,
      ),
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      respondentUserId: DEMO_USER_ID,
    })
    for (const r of newActiveResponses) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: DEMO_EXPERIENCE_ID,
        promptId: r.prompt_id,
        promptKey: (r as any).prompt_key,
        respondentUserId: DEMO_USER_ID,
        responseType: r.response_type,
        promptVersion: 1,
        structuredValue: r.structured_value,
      })
    }
    setPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID, nextRevisionNumber)

    const countBefore = (
      await experienceResponseService.listResponsesByExperience(
        DEMO_ENROLLMENT_ID,
        DEMO_EXPERIENCE_ID,
      )
    ).length

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Correção pronta para concluir')).toBeInTheDocument()
    })

    const reviewBtn = screen.getByRole('button', { name: /Revisar e concluir correção/i })
    await user.click(reviewBtn)

    await waitFor(() => {
      expect(screen.getByTestId('banner-c1-correcting-mode')).toBeInTheDocument()
    })

    const countAfter = (
      await experienceResponseService.listResponsesByExperience(
        DEMO_ENROLLMENT_ID,
        DEMO_EXPERIENCE_ID,
      )
    ).length
    expect(countAfter).toBe(countBefore)
  })

  // 11. "Rever" abre somente-leitura
  it('11. "Rever" abre somente-leitura', async () => {
    const user = userEvent.setup()

    const prompts = [
      AYV_C1_PROMPTS.P1_STRUCTURE,
      AYV_C1_PROMPTS.P2_SKIN,
      AYV_C1_PROMPTS.P3_HAIR,
      AYV_C1_PROMPTS.P4_TEMPERATURE,
      AYV_C1_PROMPTS.P5_THIRST,
    ]
    for (const p of prompts) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: DEMO_EXPERIENCE_ID,
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_ID,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        structuredValue: { value: 'opt_1', choice: 'opt_1' },
      })
    }
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: { completed: true },
    })

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Rever Capítulo 1/i }))

    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
      expect(screen.getByText(/Modo somente-leitura/i)).toBeInTheDocument()
    })
  })

  // 12. "Corrigir" abre o diálogo aprovado
  it('12. "Corrigir" abre o diálogo aprovado', async () => {
    const user = userEvent.setup()
    const handleCorrectC1 = vi.fn()

    render(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        isChapter1Completed={true}
        answeredStepsCount={5}
        totalSteps={5}
        onCorrectChapter1={handleCorrectC1}
      />,
    )

    const correctBtn = screen.getByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)

    // Abre diálogo de confirmação
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Confirmar abertura de correção do Capítulo 1/i),
    ).toBeInTheDocument()

    // Clicar em Cancelar fecha o diálogo sem chamar onCorrectChapter1
    const cancelBtn = within(dialog).getByRole('button', { name: /Cancelar/i })
    await user.click(cancelBtn)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(handleCorrectC1).not.toHaveBeenCalled()

    // Abrir de novo e confirmar
    await user.click(screen.getByRole('button', { name: /Corrigir minhas respostas/i }))
    const confirmBtn = screen.getByRole('button', { name: /Confirmar e corrigir/i })
    await user.click(confirmBtn)
    expect(handleCorrectC1).toHaveBeenCalledTimes(1)
  })

  // 13. Recarga mantém o mesmo estado do hub
  it('13. Recarga mantém o mesmo estado do hub', async () => {
    // Configurar C1 concluído no storage / DB
    const prompts = [
      AYV_C1_PROMPTS.P1_STRUCTURE,
      AYV_C1_PROMPTS.P2_SKIN,
      AYV_C1_PROMPTS.P3_HAIR,
      AYV_C1_PROMPTS.P4_TEMPERATURE,
      AYV_C1_PROMPTS.P5_THIRST,
    ]
    for (const p of prompts) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: DEMO_EXPERIENCE_ID,
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_ID,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        structuredValue: { value: 'opt_1', choice: 'opt_1' },
      })
    }
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: { completed: true },
    })

    const { unmount } = render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Começar Capítulo 2/i })).toBeInTheDocument()
    })

    unmount()

    // Simula recarga renderizando novamente com o mesmo enrollmentId
    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Começar Capítulo 2/i })).toBeInTheDocument()
    })
  })

  // 14. Alternar entre capítulos não mistura estados
  it('14. Alternar entre capítulos não mistura estados', async () => {
    render(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        isChapter1Completed={true}
        answeredStepsCount={5}
        totalSteps={5}
        chapter2Status="in_progress"
        answeredMomentsCountC2={3}
        totalMomentsC2={5}
      />,
    )

    // C1 deve exibir Concluído
    expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    // C2 deve exibir Em andamento (3 de 5 momentos respondidas)
    expect(screen.getByText('3 de 5 momentos respondidas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retomar Capítulo 2/i })).toBeInTheDocument()
  })

  // 15. Dúvida e recusa contam como respondidas
  it('15. Dúvida e recusa contam como respondidas', async () => {
    // 5 etapas preenchidas com 'dont_know' ou 'prefer_not_to_say'
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'dont_know', choice: 'dont_know' },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.P2_SKIN.id,
      promptKey: AYV_C1_PROMPTS.P2_SKIN.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'prefer_not_to_say', choice: 'prefer_not_to_say' },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.P3_HAIR.id,
      promptKey: AYV_C1_PROMPTS.P3_HAIR.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'dont_know', choice: 'dont_know' },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
      promptKey: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'prefer_not_to_say', choice: 'prefer_not_to_say' },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.P5_THIRST.id,
      promptKey: AYV_C1_PROMPTS.P5_THIRST.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'dont_know', choice: 'dont_know' },
    })

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    // Todas as 5 etapas respondidas (mesmo com dúvida/recusa) -> Pronto para concluir!
    await waitFor(() => {
      expect(screen.getByText('Pronto para concluir')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Revisar e concluir/i })).toBeInTheDocument()
    })
  })

  // 16. Respostas de revisões diferentes não são somadas
  it('16. Respostas de revisões diferentes não são somadas', async () => {
    // Rev 1 tem 5 respostas completas e concluídas
    const prompts = [
      AYV_C1_PROMPTS.P1_STRUCTURE,
      AYV_C1_PROMPTS.P2_SKIN,
      AYV_C1_PROMPTS.P3_HAIR,
      AYV_C1_PROMPTS.P4_TEMPERATURE,
      AYV_C1_PROMPTS.P5_THIRST,
    ]
    for (const p of prompts) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: DEMO_EXPERIENCE_ID,
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_ID,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        structuredValue: { value: 'opt_1', choice: 'opt_1', revision_number: 1 },
      })
    }
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: { completed: true, revision_number: 1 },
    })

    // Na rev 2 salvamos apenas 2 respostas
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: 'c1-p1-structure-rev2',
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: {
        value: 'opt_2',
        choice: 'opt_2',
        revision_number: 2,
        metadata: { revision_number: 2, canonical_prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id },
      },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: 'c1-p2-skin-rev2',
      promptKey: AYV_C1_PROMPTS.P2_SKIN.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: {
        value: 'opt_2',
        choice: 'opt_2',
        revision_number: 2,
        metadata: { revision_number: 2, canonical_prompt_id: AYV_C1_PROMPTS.P2_SKIN.id },
      },
    })
    setPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID, 2)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    // O hub canônico deve apontar 2 de 5 etapas revisadas, e NÃO 7 (somando rev1 + rev2)
    await waitFor(() => {
      expect(screen.getByText('Correção em andamento')).toBeInTheDocument()
      expect(screen.getByText(/2 de 5 etapas revisadas/i)).toBeInTheDocument()
      expect(screen.queryByText(/7 de 5/i)).not.toBeInTheDocument()
    })
  })

  // 17. Fixture legada derivada corretamente
  it('17. Fixture legada derivada corretamente: respostas sem revision_number derivam como rev 1', async () => {
    // 3 respostas legadas sem revision_number nem metadata
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'opt_legacy' },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: DEMO_EXPERIENCE_ID,
      promptId: AYV_C1_PROMPTS.P2_SKIN.id,
      promptKey: AYV_C1_PROMPTS.P2_SKIN.key,
      respondentUserId: DEMO_USER_ID,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'opt_legacy' },
    })

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    // Deve derivar Em andamento: 2 de 5 etapas respondidas
    await waitFor(() => {
      expect(screen.getByText('Em andamento')).toBeInTheDocument()
      expect(screen.getByText('2 de 5 etapas respondidas')).toBeInTheDocument()
    })
  })

  // 18. Zero chamadas ao PocketBase no demo
  it('18. Zero chamadas ao PocketBase no demo', async () => {
    // Mock global fetch para certificar que nenhuma URL pocketbase/api seja chamada
    const fetchSpy = vi.spyOn(global, 'fetch')

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const pbCalls = fetchSpy.mock.calls.filter((call) =>
      String(call[0]).includes('/api/collections/'),
    )
    expect(pbCalls.length).toBe(0)
    fetchSpy.mockRestore()
  })

  // 19. Nenhum texto técnico na interface
  it('19. Nenhum texto técnico na interface (revision_number, ready_to_complete, IDs)', async () => {
    render(
      <AyurvedaChaptersHub
        chapter1Status="ready_to_complete"
        answeredStepsCount={5}
        totalSteps={5}
        chapter1ActiveRevision={2}
        chapter1HasCorrectionInProgress={true}
        chapter2Status="in_progress"
        answeredMomentsCountC2={3}
        totalMomentsC2={5}
      />,
    )

    const containerText = document.body.textContent || ''
    expect(containerText).not.toContain('revision_number')
    expect(containerText).not.toContain('ready_to_complete')
    expect(containerText).not.toContain('parent_version_id')
    expect(containerText).not.toContain('canonical_prompt_id')
    expect(containerText).not.toContain('AYV_C1_')
    expect(containerText).not.toContain('AYV_C2_')
  })

  // 20. Nenhum botão leva a tela vazia
  it('20. Nenhum botão leva a tela vazia', async () => {
    const user = userEvent.setup()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={DEMO_EXPERIENCE_ID}
        respondentUserId={DEMO_USER_ID}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Começar Capítulo 1/i })).toBeInTheDocument()
    })

    // Clicar em Começar Capítulo 1
    await user.click(screen.getByRole('button', { name: /Começar Capítulo 1/i }))

    // Deve abrir o fluxo C1 com conteúdo (não vazio)
    await waitFor(() => {
      expect(
        screen.getByText(
          /Estrutura e Características Corporais|Estrutura Corporal|Qual é a sua estrutura/i,
        ),
      ).toBeInTheDocument()
    })
  })
})
