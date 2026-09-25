/**
 * TESTE DE REGRESSÃO OBRIGATÓRIO (0.0.159 → 0.0.160)
 * Microcorreção do Banner Somente-Leitura do Capítulo 2
 *
 * Percurso real na árvore de componentes (hub → navegador → fluxo):
 * 1. iniciar no hub com Capítulo 2 concluído;
 * 2. clicar em "Rever Capítulo 2";
 * 3. afirmar que o banner banner-c2-review-mode existe;
 * 4. clicar em "Voltar ao encerramento";
 * 5. clicar em "Corrigir minhas respostas";
 * 6. clicar em "Confirmar e corrigir";
 * 7. aguardar todas as operações assíncronas;
 * 8. afirmar que banner-c2-review-mode NÃO existe e "Modo somente-leitura" não aparece;
 * 9. clicar com userEvent numa segunda opção da primeira pergunta;
 * 10. afirmar contador mudando de 1/2 para 2/2 e a nova escolha marcada;
 * 11. remontar o componente e afirmar que a escolha permanece salva;
 * 12. teste inverso: o percurso "Rever Capítulo 2" continua bloqueando cliques e salvamento.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AyurvedaChaptersNavigator } from '@/components/experience/ayurveda/AyurvedaChaptersNavigator'
import {
  demoAdapter,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_MARIANA,
  DEMO_PERSON_MARIANA,
} from '@/services/demoAdapter'
import { experienceResponseService } from '@/services/experienceEngine'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'
import {
  AYV_C2_PROMPTS,
  setPersistedActiveChapter2Revision,
  getChapter2RevisionPromptId,
} from '@/services/ayurvedaChapter2'

describe('Regressão: Banner Somente-Leitura ao transicionar de Revisão para Correção no Capítulo 2', () => {
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

  // Semente C1 concluído
  const seedC1Completed = async () => {
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
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        structuredValue: { value: 'opt_val', choice: 'opt_val' },
      })
    }
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

  // Semente C2 concluído com fixture legada da 0.0.148 (sem revision_number)
  const seedC2Completed = async () => {
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
      const val = p.id === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id ? ['regular_hours'] : 'opt_sample'
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: Array.isArray(val) ? 'MultiSelectCards' : 'ChoiceCards',
        promptVersion: 1,
        structuredValue: {
          value: val,
          choice: typeof val === 'string' ? val : undefined,
          selectedOptionIds: Array.isArray(val) ? val : [val],
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
      structuredValue: {
        completed: true,
        completed_at: new Date().toISOString(),
        chapter_id: 'capitulo-2-ritmo-digestao-sono',
      },
    })
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 1)
  }

  it('percurso completo: Rever C2 -> Voltar ao encerramento -> Corrigir -> banner de somente-leitura desaparece e permite edição real e persistência', async () => {
    const user = userEvent.setup()
    await seedC2Completed()

    // 1. Iniciar no hub com Capítulo 2 concluído
    const { unmount } = render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
      expect(screen.getByText('Capítulo 2 Concluído')).toBeInTheDocument()
    })

    // 2. Clicar em "Rever Capítulo 2"
    const reviewBtn = screen.getByRole('button', { name: /Rever respostas do Capítulo 2/i })
    await user.click(reviewBtn)

    // 3. Afirmar que o banner banner-c2-review-mode existe
    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
    })
    expect(screen.getByText(/Modo somente-leitura/i)).toBeInTheDocument()

    // 4. Clicar em "Voltar ao encerramento"
    const returnToClosingBtn = screen.getByRole('button', { name: /Voltar ao encerramento/i })
    await user.click(returnToClosingBtn)

    await waitFor(() => {
      expect(screen.getByText(/O ritmo que você observou no seu corpo/i)).toBeInTheDocument()
    })
    // Ao voltar ao encerramento, o banner de somente-leitura DEVE ser removido canonicamente
    expect(screen.queryByTestId('banner-c2-review-mode')).not.toBeInTheDocument()
    expect(screen.queryByText(/Modo somente-leitura/i)).not.toBeInTheDocument()

    // 5. Clicar em "Corrigir minhas respostas"
    const startCorrectionBtn = screen.getByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(startCorrectionBtn)

    // 6. Clicar em "Confirmar e corrigir"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirmar e corrigir/i })).toBeInTheDocument()
    })
    const confirmCorrectionBtn = screen.getByRole('button', { name: /Confirmar e corrigir/i })
    await user.click(confirmCorrectionBtn)

    // 7. Aguardar todas as operações assíncronas (criação da revisão 2, repair, etc.)
    await waitFor(() => {
      expect(screen.getByText(/1\. Como a sua fome costuma funcionar\?/i)).toBeInTheDocument()
    })

    // 8. Afirmar que banner-c2-review-mode NÃO existe e "Modo somente-leitura" não aparece
    // NOTA DO BUG: No código sem o patch canônico no banner "Voltar ao encerramento",
    // o navegador continuava em mode: 'review' porque handleStartCorrection em C2
    // chamava setStage('momento1') mantendo o mode do prop em 'review' se o navegador não trocasse para 'correcting'.
    expect(screen.queryByTestId('banner-c2-review-mode')).not.toBeInTheDocument()
    expect(screen.queryByText(/Modo somente-leitura/i)).not.toBeInTheDocument()

    // 9. Clicar com userEvent numa segunda opção da primeira pergunta
    // A opção 1 ("Aparece em horários relativamente previsíveis.") já está marcada (1/2)
    expect(screen.getByText(/Até 2 escolhas • 1\/2/i)).toBeInTheDocument()

    // Clicar na opção 2 ("Oscila muito: às vezes forte, às vezes sem fome.")
    const secondOptionBtn = screen
      .getByText(/Oscila muito: às vezes forte, às vezes sem fome/i)
      .closest('button')!
    expect(secondOptionBtn).toBeInTheDocument()
    await user.click(secondOptionBtn)

    // 10. Afirmar contador mudando de 1/2 para 2/2 e a nova escolha marcada
    await waitFor(() => {
      expect(screen.getByText(/Até 2 escolhas • 2\/2/i)).toBeInTheDocument()
    })
    expect(secondOptionBtn).toHaveAttribute('aria-pressed', 'true')

    // 11. Remontar o componente e afirmar que a escolha permanece salva
    unmount()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    // Ao retomar, o hub deve mostrar a revisão ativa em correção ou retomar no form editável
    await waitFor(() => {
      // Como a revisão ativa 2 está em andamento (in_progress / correcting),
      // abrir o Capítulo 2 ou esperar ele estar no Hub
      expect(
        screen.getByText('Percurso de Avaliação Corporal') ||
          screen.getByText(/1\. Como a sua fome costuma funcionar\?/i),
      ).toBeInTheDocument()
    })

    // Se estiver no hub, clica no C2 (que está em correção)
    const resumeBtn = screen.queryByRole('button', { name: /Continuar Capítulo 2/i })
    if (resumeBtn) {
      await user.click(resumeBtn)
    }

    await waitFor(() => {
      expect(screen.getByText(/1\. Como a sua fome costuma funcionar\?/i)).toBeInTheDocument()
    })

    // Deve estar com 2/2 escolhas salvas na revisão 2
    expect(screen.getByText(/Até 2 escolhas • 2\/2/i)).toBeInTheDocument()
    const reloadedSecondOption = screen
      .getByText(/Oscila muito: às vezes forte, às vezes sem fome/i)
      .closest('button')!
    expect(reloadedSecondOption).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByTestId('banner-c2-review-mode')).not.toBeInTheDocument()
  })

  // 12. Teste inverso: o percurso "Rever Capítulo 2" continua bloqueando cliques e salvamento
  it('teste inverso: percurso "Rever Capítulo 2" continua bloqueando cliques e salvamento (clique real não muda seleção nem grava)', async () => {
    const user = userEvent.setup()
    await seedC2Completed()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Capítulo 2 Concluído')).toBeInTheDocument()
    })

    const reviewBtn = screen.getByRole('button', { name: /Rever respostas do Capítulo 2/i })
    await user.click(reviewBtn)

    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
    })

    // Afirmar contador 1/2
    expect(screen.getByText(/Até 2 escolhas • 1\/2/i)).toBeInTheDocument()

    // Clicar numa opção desmarcada não deve mudar nada
    const secondOptionBtn = screen
      .getByText(/Oscila muito: às vezes forte, às vezes sem fome/i)
      .closest('button')!
    await user.click(secondOptionBtn)

    // O contador continua 1/2 e aria-pressed não é true
    expect(screen.getByText(/Até 2 escolhas • 1\/2/i)).toBeInTheDocument()
    expect(secondOptionBtn).not.toHaveAttribute('aria-pressed', 'true')

    // Nenhuma resposta nova de revisão foi criada
    const savedResponses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev2Items = savedResponses.filter((r) => r.prompt_id.includes('_rev2'))
    expect(rev2Items.length).toBe(0)
  })
})
