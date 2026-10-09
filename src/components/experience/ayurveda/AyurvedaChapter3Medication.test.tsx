// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import userEvent from '@testing-library/user-event'
import { AyurvedaChapter3Flow } from './AyurvedaChapter3Flow'
import { experienceResponseService } from '@/services/experienceEngine'
import { buildIntegratedAyurvedaQaFixture } from '@/services/conscienciaQaFixture'

describe('Capítulo 3 — contexto de medicamentos e suplementos', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue([])
    vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(
      async (input) =>
        ({
          id: `response-${input.promptId}`,
          enrollment_id: input.enrollmentId,
          experience_id: input.experienceId,
          prompt_id: input.promptId,
          respondent_user_id: input.respondentUserId,
          response_type: input.responseType,
          access_class: input.accessClass || 'shared_care',
          structured_value: input.structuredValue,
          free_text: input.freeText || '',
          prompt_version: input.promptVersion,
          version: 1,
          status: 'saved',
          created: '2026-09-28T12:00:00.000Z',
          updated: '2026-09-28T12:00:00.000Z',
        }) as any,
    )
  })

  afterEach(() => cleanup())

  it('reavalia somente o momento ayurvédico e não escreve antes de a pessoa responder', async () => {
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue(
      buildIntegratedAyurvedaQaFixture().responses,
    )
    const user = userEvent.setup()
    render(
      <AyurvedaChapter3Flow
        enrollmentId="demo-enr-01"
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId="participant-demo"
        onBackToHub={() => {}}
      />,
    )
    await screen.findByText('Capítulo 3 concluído')
    await user.click(screen.getByRole('button', { name: 'Reavaliar meu Ayurveda' }))
    expect(
      screen.getByRole('dialog', { name: 'Reavaliar seu momento ayurvédico?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Começar reavaliação' }))
    expect(screen.getByText('O que está diferente agora')).toBeInTheDocument()
    expect(experienceResponseService.saveResponse).not.toHaveBeenCalled()
  })

  it('abre detalhes somente quando necessário e exige apenas o nome do item', async () => {
    const user = userEvent.setup()
    render(
      <AyurvedaChapter3Flow
        enrollmentId="enrollment-demo"
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId="participant-demo"
        onBackToHub={() => {}}
      />,
    )

    await screen.findByText('O que está diferente agora')
    await user.click(screen.getByRole('button', { name: 'Não percebo mudanças importantes agora' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByText('Medicamentos e suplementos')).toBeTruthy()
    const reviewButton = screen.getByRole('button', { name: /Revisar/i })
    expect(reviewButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Uso atualmente' }))
    expect(screen.getByPlaceholderText('Nome do medicamento ou suplemento')).toBeTruthy()
    expect(reviewButton).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText('Nome do medicamento ou suplemento'),
      'Medicamento informado',
    )
    await user.tab()

    await waitFor(() => expect(reviewButton).toBeEnabled())
    await user.click(reviewButton)
    expect(screen.getByText(/Medicamento informado/)).toBeTruthy()
  })

  it('salva a mudança de início do uso antes de sair do seletor e preserva ao reabrir', async () => {
    const user = userEvent.setup()
    const props = {
      enrollmentId: 'enrollment-demo',
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: 'participant-demo',
      onBackToHub: () => {},
      initialStep: 5,
    }
    const view = render(<AyurvedaChapter3Flow {...props} />)
    await screen.findByText('Medicamentos e suplementos')
    await user.click(screen.getByRole('button', { name: 'Uso atualmente' }))
    await user.type(
      screen.getByPlaceholderText('Nome do medicamento ou suplemento'),
      'Item informado',
    )
    const select = screen.getByLabelText('Como está esse uso?')
    await user.selectOptions(select, 'started_recently')
    const save = vi.mocked(experienceResponseService.saveResponse)
    await waitFor(() =>
      expect(
        save.mock.calls.some(
          ([input]) =>
            input.promptId === 'ayv_c3_medication_details' &&
            (input.structuredValue as any).value[0]?.timing === 'started_recently',
        ),
      ).toBe(true),
    )
    const saved = await Promise.all(save.mock.results.map((result) => result.value))
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue(saved)
    view.unmount()
    render(<AyurvedaChapter3Flow {...props} />)
    await waitFor(() =>
      expect(screen.getByLabelText('Como está esse uso?')).toHaveValue('started_recently'),
    )
    expect(screen.getByPlaceholderText('Nome do medicamento ou suplemento')).toHaveValue(
      'Item informado',
    )
  })

  it('preserva a versão concluída enquanto a correção está em rascunho e publica só ao concluir', async () => {
    const completedResponses = [
      {
        id: 'domains-v1',
        prompt_id: 'ayv_c3_changed_domains',
        structured_value: {
          value: ['no_current_changes'],
          metadata: { prompt_key: 'ayv_c3_changed_domains' },
        },
      },
      {
        id: 'med-status-v1',
        prompt_id: 'ayv_c3_medication_status',
        structured_value: {
          value: 'no_use',
          metadata: { prompt_key: 'ayv_c3_medication_status' },
        },
      },
      {
        id: 'completion-v1',
        prompt_id: 'ayv_c3_chapter_completion',
        structured_value: {
          completed: true,
          metadata: { prompt_key: 'ayv_c3_chapter_completion' },
        },
      },
    ] as any
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue(
      completedResponses,
    )
    const saveSpy = vi.mocked(experienceResponseService.saveResponse)
    const user = userEvent.setup()

    render(
      <AyurvedaChapter3Flow
        enrollmentId="enrollment-demo"
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId="participant-demo"
        onBackToHub={() => {}}
      />,
    )

    await screen.findByText('Capítulo 3 concluído')
    await user.click(screen.getByRole('button', { name: 'Corrigir minhas respostas' }))
    expect(screen.getByRole('dialog', { name: 'Corrigir respostas do Capítulo 3?' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Começar correção' }))

    expect(screen.getByText(/versão anterior preservada/i)).toBeTruthy()
    expect(saveSpy).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Uso atualmente' }))
    await user.type(
      screen.getByPlaceholderText('Nome do medicamento ou suplemento'),
      'Medicamento fictício',
    )
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'Revisar' }))

    expect(saveSpy).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Concluir correção' }))

    await waitFor(() =>
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          promptId: 'ayv_c3_medication_details',
          changeReason: expect.stringContaining('Correção concluída'),
        }),
      ),
    )
  })
  it('contextualiza pele e cabelo, conserva a escolha salva e a recupera ao reabrir', async () => {
    const user = userEvent.setup()
    const domain = {
      id: 'domain-response',
      prompt_id: 'ayv_c3_changed_domains',
      structured_value: { value: ['skin_hair'] },
    } as any
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue([domain])
    const props = {
      enrollmentId: 'enrollment-demo',
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: 'participant-demo',
      initialStep: 2,
      onBackToHub: () => {},
    }
    const view = render(<AyurvedaChapter3Flow {...props} />)
    const choice = await screen.findByRole('button', {
      name: 'Uma característica da pele ou do cabelo diminuiu',
    })
    expect(
      screen.getByText(/ressecamento, oleosidade, sensibilidade, textura ou queda de cabelo/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Diminuiu ou ficou mais fraco' })).toBeNull()
    await user.click(choice)
    await waitFor(() =>
      expect(experienceResponseService.saveResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          promptId: 'ayv_c3_change_directions',
          structuredValue: expect.objectContaining({ value: { skin_hair: 'decreased' } }),
        }),
      ),
    )
    const results = await Promise.all(
      vi.mocked(experienceResponseService.saveResponse).mock.results.map((r) => r.value),
    )
    view.unmount()
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue([
      domain,
      ...results,
    ])
    render(<AyurvedaChapter3Flow {...props} />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Uma característica da pele ou do cabelo diminuiu',
        }),
      ).toHaveAttribute('aria-pressed', 'true'),
    )
  })

  it('permite abrir o bloco opcional "Como meu corpo está agora" no caminho curto e registrar área com comparação e detalhes', async () => {
    const user = userEvent.setup()
    const props = {
      enrollmentId: 'enrollment-demo',
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: 'participant-demo',
      onBackToHub: () => {},
    }
    render(<AyurvedaChapter3Flow {...props} />)

    await screen.findByText('O que está diferente agora')
    // Caminho curto: seleciona "Não percebo mudanças importantes agora"
    await user.click(screen.getByRole('button', { name: 'Não percebo mudanças importantes agora' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    // Chega na Etapa 5
    expect(screen.getByText('Como meu corpo está agora')).toBeInTheDocument()
    // Abre o bloco recolhível
    await user.click(screen.getByRole('button', { name: /Abrir/i }))
    expect(screen.getByText(/Pense nos últimos 14 dias/i)).toBeInTheDocument()

    // Abre a área de Fome
    const preencherBtns = screen.getAllByRole('button', { name: /Preencher/i })
    await user.click(screen.getByRole('button', { name: 'Preencher Fome' }))
    expect(screen.getByText('Como está sua fome nestes últimos 14 dias?')).toBeInTheDocument()

    // Seleciona um estado de fome
    await user.click(
      screen.getByRole('button', { name: 'Surge de repente e pode ficar muito intensa' }),
    )
    // Seleciona comparação "Diferente do meu habitual"
    await user.click(screen.getByRole('button', { name: 'Diferente do meu habitual' }))

    // Abre campos condicionais
    expect(
      screen.getByText(/Há quanto tempo percebe essa diferença em fome\?/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Com que frequência isso tem acontecido?')).toBeInTheDocument()
    expect(
      screen.getByText(
        /O que estava acontecendo nesse período\? Isso registra contexto, sem afirmar causa\./i,
      ),
    ).toBeInTheDocument()

    // Preenche duração e frequência
    await user.click(screen.getByRole('button', { name: 'Entre 1 e 3 meses' }))
    await user.click(screen.getByRole('button', { name: 'Em vários dias' }))
    await user.click(screen.getByRole('button', { name: 'Estresse ou acontecimentos emocionais' }))

    // Verifica que foi persistido sob a chave correspondente
    await waitFor(() =>
      expect(experienceResponseService.saveResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          promptId: 'ayv_c3_current_hunger',
          promptKey: 'ayv_c3_current_hunger',
          structuredValue: expect.objectContaining({
            value: expect.objectContaining({
              area_key: 'hunger',
              comparison: 'different',
              duration: 'one_to_three_months',
              frequency: 'several_days',
            }),
          }),
        }),
      ),
    )

    // Preenche medicamentos para poder revisar
    await user.click(
      screen.getByRole('button', { name: 'Não uso medicamentos ou suplementos atualmente' }),
    )
    await user.click(screen.getByRole('button', { name: 'Revisar' }))

    // Na tela de revisão (step 6), deve exibir os campos respondidos e a referência
    expect(screen.getByText('Como meu corpo está agora (últimos 14 dias)')).toBeInTheDocument()
    expect(screen.getByText(/Surge de repente e pode ficar muito intensa/)).toBeInTheDocument()
    expect(screen.getByText(/Diferente do meu habitual/)).toBeInTheDocument()
    expect(screen.getByText(/Entre 1 e 3 meses/)).toBeInTheDocument()
    expect(screen.getByText(/Em vários dias/)).toBeInTheDocument()
    expect(screen.getByText(/Estresse ou acontecimentos emocionais/)).toBeInTheDocument()
  })

  it('quando a comparação muda de different para same_as_usual, a revisão não exibe os detalhes obsoletos', async () => {
    const user = userEvent.setup()
    const props = {
      enrollmentId: 'enrollment-demo',
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: 'participant-demo',
      onBackToHub: () => {},
    }
    render(<AyurvedaChapter3Flow {...props} />)

    await screen.findByText('O que está diferente agora')
    await user.click(screen.getByRole('button', { name: 'Não percebo mudanças importantes agora' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    await user.click(screen.getByRole('button', { name: 'Abrir Como meu corpo está agora' }))
    await user.click(screen.getByRole('button', { name: 'Preencher Sono' }))

    await user.click(screen.getByRole('button', { name: 'Diferente do meu habitual' }))
    await user.click(screen.getByRole('button', { name: 'Nas últimas semanas' }))
    await user.click(screen.getByRole('button', { name: 'Quase todos os dias' }))

    // Muda a comparação para "Parecido com meu habitual"
    await user.click(screen.getByRole('button', { name: 'Parecido com meu habitual' }))

    await user.click(
      screen.getByRole('button', { name: 'Não uso medicamentos ou suplementos atualmente' }),
    )
    await user.click(screen.getByRole('button', { name: 'Revisar' }))

    expect(screen.getByText('Parecido com meu habitual')).toBeInTheDocument()
    // Detalhes condicionais não devem ser exibidos na revisão para sono
    expect(screen.queryByText(/Duração da mudança:/)).toBeNull()
    expect(screen.queryByText(/Frequência:/)).toBeNull()
  })

  it('Microbloco 3C: acessibilidade (aria-labels das áreas e bloco geral), frase de uso presente sem frase técnica, e recusa persistindo na duração', async () => {
    const user = userEvent.setup()
    const props = {
      enrollmentId: 'enrollment-demo',
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: 'participant-demo',
      onBackToHub: () => {},
    }
    render(<AyurvedaChapter3Flow {...props} />)

    await screen.findByText('O que está diferente agora')
    await user.click(screen.getByRole('button', { name: 'Não percebo mudanças importantes agora' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    // 1. Bloco geral recolhível: aria-label explícito "Abrir Como meu corpo está agora"
    const openBlockBtn = screen.getByRole('button', { name: 'Abrir Como meu corpo está agora' })
    expect(openBlockBtn).toHaveAttribute('aria-expanded', 'false')
    await user.click(openBlockBtn)

    // Estado aberto: aria-label "Recolher Como meu corpo está agora"
    expect(
      screen.getByRole('button', { name: 'Recolher Como meu corpo está agora' }),
    ).toHaveAttribute('aria-expanded', 'true')

    // 2. Acessibilidade de cada área: botões com aria-label específico "Preencher <Área>"
    expect(screen.getByRole('button', { name: 'Preencher Fome' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Preencher Sensação após comer / digestão' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Preencher Eliminação intestinal' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preencher Sono' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Preencher Sensação de temperatura' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preencher Pele' })).toBeInTheDocument()

    // Abrir Fome -> aria-label passa a ser "Fechar Fome"
    await user.click(screen.getByRole('button', { name: 'Preencher Fome' }))
    expect(screen.getByRole('button', { name: 'Fechar Fome' })).toBeInTheDocument()

    // 3. Frase de uso presente e frase técnica ausente
    expect(
      screen.getByText(
        "Você pode escolher até 2 opções. Se escolher 'Não sei identificar' ou 'Prefiro não responder', essa será sua única resposta.",
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Opções de incerteza e recusa são exclusivas/i)).toBeNull()

    // 4. Recusa na duração: disponível no novo bloco e persiste no registro
    await user.click(
      screen.getByRole('button', { name: 'Aparece em horários relativamente previsíveis' }),
    )
    await user.click(screen.getByRole('button', { name: 'Diferente do meu habitual' }))

    // Em duração, a opção "Prefiro não responder" deve existir
    const durationRefusalBtn = within(
      screen.getByText('Há quanto tempo percebe essa diferença em fome?').parentElement!,
    ).getByRole('button', { name: 'Prefiro não responder' })
    expect(durationRefusalBtn).toBeInTheDocument()
    await user.click(durationRefusalBtn)

    await waitFor(() =>
      expect(experienceResponseService.saveResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          promptId: 'ayv_c3_current_hunger',
          structuredValue: expect.objectContaining({
            value: expect.objectContaining({
              area_key: 'hunger',
              comparison: 'different',
              duration: 'refusal',
            }),
          }),
        }),
      ),
    )

    // Preenche medicamentos para prosseguir à revisão
    await user.click(
      screen.getByRole('button', { name: 'Não uso medicamentos ou suplementos atualmente' }),
    )
    await user.click(screen.getByRole('button', { name: 'Revisar' }))

    // 5. Na revisão: o valor refusal aparece literalmente como "Prefiro não responder"
    expect(screen.getByText('Como meu corpo está agora (últimos 14 dias)')).toBeInTheDocument()
    expect(screen.getByText(/Duração da mudança:/)).toBeInTheDocument()
    expect(screen.getByText(/Prefiro não responder/)).toBeInTheDocument()
  })
})
