/**
 * SUÍTE DE TESTES OBRIGATÓRIOS DO MICROLOTE M1
 * Estabilização da Navegação de Corpo & Fisiologia (CER V1)
 *
 * 1. Hub -> Rever Capítulo 1 -> somente-leitura do C1 -> voltar ao encerramento do C1 -> hub
 * 2. Hub -> Rever Capítulo 2 -> somente-leitura do C2 -> voltar ao encerramento do C2 -> hub
 * 3. C2 concluído -> Corrigir -> confirmar -> modo correcting editável, sem banner de somente-leitura
 * 4. C1 concluído -> Corrigir -> modo editável do C1
 * 5. Cancelar a confirmação da correção não altera estado nem dados
 * 6. C1 -> hub -> C2 -> hub -> C1 sem vazamento de capítulo, banner, etapa ou modo
 * 7. Recarregar no hub não abre automaticamente o último formulário
 * 8. Dados legados 0.0.148–0.0.150 não são apagados nem reinterpretados
 * 9. Nenhuma resposta é gravada apenas por navegar
 * 10. Zero chamadas ao PocketBase no modo demonstração
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { AyurvedaChaptersNavigator } from '@/components/experience/ayurveda/AyurvedaChaptersNavigator'
import {
  demoAdapter,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_MARIANA,
  DEMO_PERSON_MARIANA,
} from '@/services/demoAdapter'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'
import { AYV_C2_PROMPTS, setPersistedActiveChapter2Revision } from '@/services/ayurvedaChapter2'
import pb from '@/lib/pocketbase/client'

describe('Microlote M1 — Estabilização da Navegação de Corpo & Fisiologia', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    demoAdapter.resetToDefaultState()
    demoAdapter.enableDemo('mariana')
    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
      avatar_presentation: 'feminine',
    })
  })

  // Helper para popular C1 como concluído
  const seedC1Completed = async () => {
    // 5 respostas de C1
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'light_narrow', choice: 'light_narrow' },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P2_SKIN.id,
      promptKey: AYV_C1_PROMPTS.P2_SKIN.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'MultiSelectCards',
      promptVersion: 1,
      structuredValue: { value: ['dry_rough'], selectedOptionIds: ['dry_rough'] },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P3_HAIR.id,
      promptKey: AYV_C1_PROMPTS.P3_HAIR.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'MultiSelectCards',
      promptVersion: 1,
      structuredValue: { value: ['fine_delicate'], selectedOptionIds: ['fine_delicate'] },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
      promptKey: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'cold_easily', choice: 'cold_easily' },
    })
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P5_THIRST.id,
      promptKey: AYV_C1_PROMPTS.P5_THIRST.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'frequent', choice: 'frequent' },
    })
    // Conclusão canônica de C1
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: { completed: true, chapter_id: 'capitulo-1-estrutura-caracteristicas' },
    })
  }

  // Helper para popular C2 como concluído com dados legados da 0.0.148 (sem revision_number ou parent_version_id)
  const seedC2Completed = async (isLegacyFixture = true) => {
    await seedC1Completed()
    const prompts = [
      AYV_C2_PROMPTS.P1_HUNGER_PATTERN,
      AYV_C2_PROMPTS.P2_DELAYED_MEAL,
      AYV_C2_PROMPTS.P3_POST_MEAL,
      AYV_C2_PROMPTS.P4_HUNGER_RETURN,
      AYV_C2_PROMPTS.P5_FOOD_DEMANDS,
      AYV_C2_PROMPTS.P6_BOWEL_RHYTHM,
      AYV_C2_PROMPTS.P7_STOOL_PATTERN,
      AYV_C2_PROMPTS.P8_SLEEP_PATTERN,
      AYV_C2_PROMPTS.P9_WAKING,
      AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION,
      AYV_C2_PROMPTS.P11_BODY_PACE,
      AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE,
    ]
    for (const p of prompts) {
      const val = p.id === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id ? ['sharp_hunger'] : 'opt_a'
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: Array.isArray(val) ? 'MultiSelectCards' : 'ChoiceCards',
        promptVersion: 1,
        structuredValue: isLegacyFixture
          ? {
              value: val,
              choice: typeof val === 'string' ? val : undefined,
              selectedOptionIds: Array.isArray(val) ? val : [val],
            }
          : {
              value: val,
              choice: typeof val === 'string' ? val : undefined,
              selectedOptionIds: Array.isArray(val) ? val : [val],
              revision_number: 1,
              metadata: { revision_number: 1 },
            },
      })
    }
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: isLegacyFixture
        ? {
            completed: true,
            completed_at: new Date().toISOString(),
            chapter_id: 'capitulo-2-ritmo-digestao-sono',
          }
        : {
            completed: true,
            completed_at: new Date().toISOString(),
            chapter_id: 'capitulo-2-ritmo-digestao-sono',
            revision_number: 1,
            metadata: { revision_number: 1 },
          },
    })
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 1)
  }

  // 1. encerramento C1 -> "Voltar aos capítulos" -> hub
  it('1. encerramento C1 -> "Voltar aos capítulos" -> hub', async () => {
    await seedC1Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // C1 concluído clicado a partir do Hub entra no fluxo
    const reviewC1Btn = screen.getByRole('button', { name: /Rever Capítulo 1/i })
    fireEvent.click(reviewC1Btn)

    // Voltar ao encerramento
    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))

    // No encerramento de C1, clica em "Voltar aos capítulos"
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 1 Concluído/i)).toBeInTheDocument()
    })
    const backToHubBtn = screen.getByRole('button', { name: /Voltar ao percurso dos capítulos/i })
    fireEvent.click(backToHubBtn)

    // Deve retornar ao Hub
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })
  })

  // 2. revisão C1 -> encerramento -> hub
  it('2. revisão C1 -> encerramento -> hub', async () => {
    await seedC1Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 1/i }))

    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))

    await waitFor(() => {
      expect(screen.getByText(/Capítulo 1 Concluído/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Voltar ao percurso dos capítulos/i }))

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })
  })

  // 3. encerramento C2 -> "Voltar aos capítulos" -> hub
  it('3. encerramento C2 -> "Voltar aos capítulos" -> hub', async () => {
    await seedC2Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 2/i }))

    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))

    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })

    // Botão Voltar aos capítulos
    const backToHubBtn = screen.getByRole('button', { name: /Voltar aos capítulos/i })
    fireEvent.click(backToHubBtn)

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })
  })

  // 4. revisão C2 -> encerramento -> hub
  it('4. revisão C2 -> encerramento -> hub', async () => {
    await seedC2Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 2/i }))

    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))

    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Voltar aos capítulos/i }))

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })
  })

  // 1. Hub -> Rever Capítulo 1 -> somente-leitura do C1 -> voltar ao encerramento do C1 -> hub
  it('1. Hub -> Rever Capítulo 1 -> somente-leitura do C1 -> voltar ao encerramento do C1 -> hub', async () => {
    await seedC1Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    // Aguarda carregar o Hub
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // Botão Rever Capítulo 1
    const reviewC1Btn = screen.getByRole('button', { name: /Rever Capítulo 1/i })
    fireEvent.click(reviewC1Btn)

    // Deve abrir em modo somente-leitura do C1 com banner explícito de C1
    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
      expect(screen.getByText(/Capítulo 1 — Revisão das suas respostas/i)).toBeInTheDocument()
    })

    // Clicar em "Voltar ao encerramento"
    const backToClosingBtn = screen.getByRole('button', { name: /Voltar ao encerramento/i })
    fireEvent.click(backToClosingBtn)

    // Encerramento do Capítulo 1
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 1 Concluído/i)).toBeInTheDocument()
    })

    // Voltar ao hub
    const backToHubBtn = screen.getByRole('button', { name: /Voltar ao percurso dos capítulos/i })
    fireEvent.click(backToHubBtn)

    // Confirma que retornou ao Hub
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })
  })

  // 2. Hub -> Rever Capítulo 2 -> somente-leitura do C2 -> voltar ao encerramento do C2 -> hub
  it('2. Hub -> Rever Capítulo 2 -> somente-leitura do C2 -> voltar ao encerramento do C2 -> hub', async () => {
    await seedC2Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // Botão Rever Capítulo 2
    const reviewC2Btn = screen.getByRole('button', { name: /Rever Capítulo 2/i })
    fireEvent.click(reviewC2Btn)

    // Deve abrir somente-leitura do C2 com banner explícito de C2
    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
      expect(screen.getByText(/Capítulo 2 — Revisão das suas respostas/i)).toBeInTheDocument()
    })

    // Voltar ao encerramento do C2
    const backToClosingBtn = screen.getByRole('button', { name: /Voltar ao encerramento/i })
    fireEvent.click(backToClosingBtn)

    // Encerramento do Capítulo 2
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })

    // Voltar ao hub
    const backToHubBtn = screen.getByRole('button', { name: /Voltar ao percurso dos capítulos/i })
    fireEvent.click(backToHubBtn)

    // Retornou ao Hub
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })
  })

  // 3. C2 concluído -> Corrigir -> confirmar -> modo correcting editável, sem banner de somente-leitura
  it('3. C2 concluído -> Corrigir -> confirmar -> modo correcting editável, sem banner de somente-leitura', async () => {
    await seedC2Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // Os dois botões de corrigir: C1 e C2
    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    // Segundo botão é do C2
    const correctC2Btn = correctBtns[1] || correctBtns[0]
    fireEvent.click(correctC2Btn)

    // Deve abrir o encerramento ou diálogo de confirmação de C2
    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })

    // Confirmar correção
    const confirmBtn = screen.getByRole('button', { name: /Confirmar e corrigir/i })
    fireEvent.click(confirmBtn)

    // Deve abrir Momento 1 em modo correcting editável, SEM banner de somente-leitura
    await waitFor(() => {
      expect(screen.queryByTestId('banner-c2-review-mode')).toBeNull()
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })
  })

  // 4. C1 concluído -> Corrigir -> modo editável do C1
  it('4. C1 concluído -> Corrigir -> modo editável do C1', async () => {
    await seedC1Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    const correctC1Btn = correctBtns[0]
    fireEvent.click(correctC1Btn)

    // Deve abrir o fluxo do C1 na Tela 1 sem banner de revisão
    await waitFor(() => {
      expect(screen.queryByTestId('banner-review-mode')).toBeNull()
      expect(
        screen.getByText(
          /Qual das opções abaixo mais se aproxima da sua estrutura corporal habitual\?/i,
        ),
      ).toBeInTheDocument()
    })
  })

  // 5. Cancelar a confirmação da correção não altera estado nem dados
  it('5. Cancelar a confirmação da correção não altera estado nem dados', async () => {
    await seedC2Completed()

    const responsesBefore = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    fireEvent.click(correctBtns[1] || correctBtns[0])

    // Diálogo aberto
    await waitFor(() => {
      expect(screen.getByText(/Cancelar/i)).toBeInTheDocument()
    })

    // Cancelar
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })
    fireEvent.click(cancelBtn)

    // Permanece no encerramento de C2 sem navegar para a tela editável
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })

    const responsesAfter = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    expect(responsesAfter.length).toBe(responsesBefore.length)
  })

  // 6. C1 -> hub -> C2 -> hub -> C1 sem vazamento de capítulo, banner, etapa ou modo
  it('6. C1 -> hub -> C2 -> hub -> C1 sem vazamento de capítulo, banner, etapa ou modo', async () => {
    await seedC2Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // 1. Entra em Rever C1
    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 1/i }))
    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
      expect(screen.getByText(/Capítulo 1 — Revisão das suas respostas/i)).toBeInTheDocument()
      expect(screen.queryByTestId('banner-c2-review-mode')).toBeNull()
    })

    // 2. Volta para o encerramento do C1 e depois para o Hub
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 1 Concluído/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao percurso dos capítulos/i }))

    // 3. Chegou no Hub
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
      expect(screen.queryByTestId('banner-review-mode')).toBeNull()
      expect(screen.queryByTestId('banner-c2-review-mode')).toBeNull()
    })

    // 4. Entra em Rever C2
    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 2/i }))
    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
      expect(screen.getByText(/Capítulo 2 — Revisão das suas respostas/i)).toBeInTheDocument()
      expect(screen.queryByTestId('banner-review-mode')).toBeNull()
    })

    // 5. Volta para o encerramento de C2 e depois para o Hub
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao percurso dos capítulos/i }))

    // 6. De volta ao Hub -> entra de novo em C1
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 1/i }))
    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
      expect(screen.getByText(/Capítulo 1 — Revisão das suas respostas/i)).toBeInTheDocument()
      expect(screen.queryByTestId('banner-c2-review-mode')).toBeNull()
    })
  })

  // 7. Recarregar no hub não abre automaticamente o último formulário
  it('7. Recarregar no hub não abre automaticamente o último formulário', async () => {
    await seedC1Completed()

    // Primeira montagem
    const { unmount } = render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    unmount()

    // Simula reload
    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    // O Hub renderiza diretamente sem abrir formulário automaticamente
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
      expect(
        screen.queryByText(/Qual das opções abaixo mais se aproxima da sua estrutura/i),
      ).toBeNull()
      expect(screen.queryByText(/Padrão habitual da sua fome/i)).toBeNull()
    })
  })

  // 8. Dados legados 0.0.148–0.0.150 não são apagados nem reinterpretados
  it('8. Dados legados 0.0.148–0.0.150 não são apagados nem reinterpretados', async () => {
    // Salvar resposta legada da 0.0.148 (sem revision_number)
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: 'p-07b-pm1-p1-peso-historico',
      promptKey: 'peso_historico_legado',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'historico_estavel', legacy: true },
    })

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const responses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const legacyResp = responses.find((r) => r.prompt_id === 'p-07b-pm1-p1-peso-historico')
    expect(legacyResp).toBeDefined()
    expect((legacyResp?.structured_value as any)?.value).toBe('historico_estavel')
  })

  // 9. Nenhuma resposta é gravada apenas por navegar
  it('9. Nenhuma resposta é gravada apenas por navegar', async () => {
    await seedC1Completed()

    const responsesCountBefore = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    ).length

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // Navega para Rever C1
    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 1/i }))
    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
    })

    // Navega para Encerramento C1
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 1 Concluído/i)).toBeInTheDocument()
    })

    // Volta ao Hub
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao percurso dos capítulos/i }))
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const responsesCountAfter = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    ).length

    expect(responsesCountAfter).toBe(responsesCountBefore)
  })

  // 10. Zero chamadas ao PocketBase no modo demonstração
  it('10. Zero chamadas ao PocketBase no modo demonstração', async () => {
    const pbCollectionSpy = vi.spyOn(pb, 'collection')

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // Clica para rever ou iniciar
    const startC1Btn = screen.getByRole('button', { name: /Começar Capítulo 1/i })
    fireEvent.click(startC1Btn)

    await waitFor(() => {
      expect(
        screen.getByText(/Capítulo 1 — Estrutura Corporal & Características Habituais/i),
      ).toBeInTheDocument()
    })

    const forbiddenCollections = [
      'persons',
      'cer_experiences',
      'experience_responses',
      'enrollment_experiences',
    ]
    for (const call of pbCollectionSpy.mock.calls) {
      expect(forbiddenCollections).not.toContain(call[0])
    }
  })

  // 15 TESTES CANÔNICOS DO FECHAMENTO DO M1 (ESTRITAMENTE CONFORME ESPECIFICAÇÃO)
  // 5. C2 concluído -> Corrigir -> confirmar -> nova revisão ativa
  it('Teste 5. C2 concluído -> Corrigir -> confirmar -> nova revisão ativa', async () => {
    await seedC2Completed(true) // fixture legada sem revision_number

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // No hub, clica em "Corrigir minhas respostas" do C2
    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    const correctC2Btn = correctBtns[1] || correctBtns[0]
    fireEvent.click(correctC2Btn)

    // Abre diálogo ou encerramento
    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    // Momento 1 abre e a nova revisão 2 fica ativa
    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    // Verifica persistência da revisão 2
    const all = demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID, 'exp-corpo-fisiologia-07b')
    const rev2Responses = all.filter(
      (r) => (r as any).revision_number === 2 || (r.structured_value as any)?.revision_number === 2,
    )
    expect(rev2Responses.length).toBeGreaterThanOrEqual(12)
  })

  // 6. o formulário do teste 5 é editável
  it('Teste 6. o formulário do teste 5 é editável', async () => {
    await seedC2Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    fireEvent.click(correctBtns[1] || correctBtns[0])

    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    // Verifica se os botões/cards estão interativos (não desabilitados)
    const options = screen.getAllByRole('button')
    const hungerOption = options.find(
      (btn) =>
        btn.textContent?.includes('Fome pontual') || btn.textContent?.includes('Fome intensa'),
    )
    expect(hungerOption).toBeDefined()
    expect(hungerOption).not.toBeDisabled()
  })

  // 7. o texto "Modo somente-leitura" NÃO aparece no teste 5
  it('Teste 7. o texto "Modo somente-leitura" NÃO aparece no teste 5', async () => {
    await seedC2Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    fireEvent.click(correctBtns[1] || correctBtns[0])

    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    expect(screen.queryByText(/Modo somente-leitura/i)).toBeNull()
    expect(screen.queryByText(/Revisão das suas respostas/i)).toBeNull()
    expect(screen.queryByTestId('banner-c2-review-mode')).toBeNull()
  })

  // 8. respostas anteriores aparecem preenchidas na nova revisão
  it('Teste 8. respostas anteriores aparecem preenchidas na nova revisão', async () => {
    await seedC2Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    fireEvent.click(correctBtns[1] || correctBtns[0])

    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    // Na semente foi seeded 'sharp_hunger' ("Fome intensa")
    // O card preenchido deve conter a indicação de selecionado (ex: aria-pressed ou classe de selecionado)
    const cardSelected = screen.getByText(/Fome intensa e pontual/i).closest('button')
    expect(cardSelected).toBeDefined()
    expect(cardSelected).toHaveAttribute('aria-pressed', 'true')
  })

  // 9. a conclusão anterior não conclui automaticamente a nova revisão
  it('Teste 9. a conclusão anterior não conclui automaticamente a nova revisão', async () => {
    await seedC2Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    fireEvent.click(correctBtns[1] || correctBtns[0])

    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    // Não deve renderizar a tela de encerramento de imediato
    expect(screen.queryByText(/Capítulo 2 Concluído/i)).toBeNull()

    // O status no banco para a revisão 2 não deve ter completion record
    const all = demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID, 'exp-corpo-fisiologia-07b')
    const rev2Completion = all.find((r) => {
      const isCompletion =
        r.prompt_id?.includes(AYV_C2_PROMPTS.CHAPTER_COMPLETION.id) ||
        (r as any).prompt_key === AYV_C2_PROMPTS.CHAPTER_COMPLETION.key
      const isRev2 =
        (r as any).revision_number === 2 || (r.structured_value as any)?.revision_number === 2
      return isCompletion && isRev2
    })
    expect(rev2Completion).toBeUndefined()
  })

  // 10. cancelar não cria revisão nem altera respostas
  it('Teste 10. cancelar não cria revisão nem altera respostas', async () => {
    await seedC2Completed(true)

    const responsesBefore = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    fireEvent.click(correctBtns[1] || correctBtns[0])

    await waitFor(() => {
      expect(screen.getByText(/Cancelar/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))

    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })

    const responsesAfter = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    expect(responsesAfter.length).toBe(responsesBefore.length)
  })

  // 11. falha simulada mostra erro e não abre revisão
  it('Teste 11. falha simulada mostra erro e não abre revisão', async () => {
    await seedC2Completed(true)

    // Espionar e simular erro ao salvar na criação de nova resposta
    const saveSpy = vi
      .spyOn(experienceResponseService, 'saveResponse')
      .mockRejectedValueOnce(new Error('Simulated network failure'))

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // Entra em Rever Capítulo 2 -> Encerramento -> Corrigir minhas respostas
    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 2/i }))
    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))

    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })

    // Clica em "Corrigir minhas respostas"
    fireEvent.click(screen.getByRole('button', { name: /Corrigir minhas respostas/i }))

    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    // Deve exibir banner de erro, permanecer no encerramento anterior e não abrir o formulário
    await waitFor(() => {
      expect(screen.getByTestId('c2-correction-error-banner')).toBeInTheDocument()
      expect(
        screen.getByText(/Não foi possível abrir a correção agora. Tente novamente./i),
      ).toBeInTheDocument()
      expect(screen.queryByText(/Padrão habitual da sua fome/i)).toBeNull()
      expect(screen.queryByTestId('banner-c2-review-mode')).toBeNull()
    })

    saveSpy.mockRestore()
  })

  // 12. C1 concluído -> Corrigir -> modo editável sem banner de revisão
  it('Teste 12. C1 concluído -> Corrigir -> modo editável sem banner de revisão', async () => {
    await seedC1Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    fireEvent.click(correctBtns[0])

    await waitFor(() => {
      expect(screen.queryByTestId('banner-review-mode')).toBeNull()
      expect(
        screen.getByText(
          /Qual das opções abaixo mais se aproxima da sua estrutura corporal habitual\?/i,
        ),
      ).toBeInTheDocument()
    })
  })

  // 13. voltar ao hub não grava, modifica ou apaga respostas
  it('Teste 13. voltar ao hub não grava, modifica ou apaga respostas', async () => {
    await seedC2Completed(true)

    const initialResponses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // Navega para Rever C2
    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 2/i }))
    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
    })

    // Encerramento
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })

    // Volta ao Hub
    fireEvent.click(screen.getByRole('button', { name: /Voltar aos capítulos/i }))
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const finalResponses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    expect(finalResponses).toEqual(initialResponses)
  })

  // 14. fixture de dados legados 0.0.148–0.0.150 continua compatível
  it('Teste 14. fixture de dados legados 0.0.148–0.0.150 continua compatível', async () => {
    await seedC2Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // O status canônico deve identificar C1 e C2 concluídos mesmo a partir de fixture legada
    expect(screen.getByText('Capítulo 1 Concluído')).toBeInTheDocument()
    expect(screen.getByText('Capítulo 2 Concluído')).toBeInTheDocument()
  })

  // 15. zero chamadas ao PocketBase no modo demonstração
  it('Teste 15. zero chamadas ao PocketBase no modo demonstração', async () => {
    const pbCollectionSpy = vi.spyOn(pb, 'collection')

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const startC1Btn = screen.getByRole('button', { name: /Começar Capítulo 1/i })
    fireEvent.click(startC1Btn)

    await waitFor(() => {
      expect(
        screen.getByText(/Capítulo 1 — Estrutura Corporal & Características Habituais/i),
      ).toBeInTheDocument()
    })

    const forbiddenCollections = [
      'persons',
      'cer_experiences',
      'experience_responses',
      'enrollment_experiences',
    ]
    for (const call of pbCollectionSpy.mock.calls) {
      expect(forbiddenCollections).not.toContain(call[0])
    }
  })
})
