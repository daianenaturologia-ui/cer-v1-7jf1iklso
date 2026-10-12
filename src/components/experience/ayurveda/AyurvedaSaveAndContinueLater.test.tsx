import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AyurvedaChapter1Flow } from './AyurvedaChapter1Flow'
import { AyurvedaChapter2Flow } from './AyurvedaChapter2Flow'
import { AyurvedaChapter3Flow } from './AyurvedaChapter3Flow'
import { AyurvedaChapter4Flow } from './AyurvedaChapter4Flow'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
import { AYV_C2_PROMPTS } from '@/services/ayurvedaChapter2'

describe('Salvar e continuar depois durante perguntas (C1, C2, C3, C4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockResolvedValue({
      id: 'test-enroll-exp-123',
      current_step_order: 1,
      progress_status: 'in_progress',
    } as any)
    vi.spyOn(enrollmentExperienceService, 'updateProgress').mockResolvedValue({
      id: 'test-enroll-exp-123',
    } as any)
    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue([])
  })

  // TESTE 1: Pausar já na primeira etapa com resposta parcial (sem respostas completas, sem criar conclusão)
  it('1. C1: permite salvar e continuar depois já na primeira etapa com resposta parcial, sem criar conclusão', async () => {
    let savedResponses: any[] = []
    vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(async (params) => {
      const rec = {
        id: `rec-${params.promptId}`,
        prompt_id: params.promptId,
        experience_id: params.experienceId,
        structured_value: params.structuredValue,
        response_type: params.responseType,
      }
      savedResponses = [...savedResponses.filter((r) => r.prompt_id !== params.promptId), rec]
      return rec as any
    })

    const onExitToHub = vi.fn()
    render(
      <AyurvedaChapter1Flow
        enrollmentId="enr-test-01"
        experienceId="exp-test-01"
        respondentUserId="user-daiane"
        mode="answering"
        initialStep={1}
        onExitToHub={onExitToHub}
      />,
    )

    // Aguardar carregar etapa 1
    await screen.findByRole('button', { name: 'Avançar para Pele' })

    // O cabeçalho de salvar e continuar depois está visível
    const headerSaveBtn = screen.getByRole('button', { name: 'Salvar e continuar depois' })
    expect(headerSaveBtn).toBeInTheDocument()

    // Clica em apenas uma opção de estrutura (resposta parcial)
    fireEvent.click(
      screen.getByRole('button', { name: 'Figura feminina — estrutura leve ou estreita' }),
    )

    // Clica em "Salvar e continuar depois"
    fireEvent.click(headerSaveBtn)

    await waitFor(() => {
      expect(onExitToHub).toHaveBeenCalledOnce()
    })

    // Resposta parcial foi gravada no backend
    expect(savedResponses.length).toBeGreaterThan(0)
    // NENHUMA conclusão de capítulo foi gerada
    const completionRecords = savedResponses.filter(
      (r) => r.response_type === 'ChapterCompletion' || r.structured_value?.completed === true,
    )
    expect(completionRecords).toHaveLength(0)
  })

  // TESTE 2: Aguardar a gravação (saver.flush()) antes de sair
  it('2. C1: aguarda saver.flush() completar antes de acionar onExitToHub', async () => {
    let resolveSave: ((val: any) => void) | null = null
    const savePromise = new Promise((res) => {
      resolveSave = res
    })

    vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(async () => {
      await savePromise
      return { id: 'saved-delayed', prompt_id: 'some-prompt' } as any
    })

    const onExitToHub = vi.fn()
    render(
      <AyurvedaChapter1Flow
        enrollmentId="enr-test-02"
        experienceId="exp-test-02"
        respondentUserId="user-daiane"
        mode="answering"
        initialStep={1}
        onExitToHub={onExitToHub}
      />,
    )

    await screen.findByRole('button', { name: 'Avançar para Pele' })

    // Seleciona uma opção para engatilhar saver.enqueue
    fireEvent.click(
      screen.getByRole('button', { name: 'Figura feminina — estrutura intermediária' }),
    )

    const headerSaveBtn = screen.getByRole('button', { name: 'Salvar e continuar depois' })
    fireEvent.click(headerSaveBtn)

    // Enquanto a promise de salvamento não resolveu, onExitToHub NÃO foi chamado ainda
    expect(onExitToHub).not.toHaveBeenCalled()

    // O botão entra em estado salvando com guard contra repetição
    expect(headerSaveBtn).toBeDisabled()

    // Resolve o salvamento
    resolveSave!({ success: true })

    await waitFor(() => {
      expect(onExitToHub).toHaveBeenCalledOnce()
    })
  })

  // TESTE 3: Falha de salvamento impede a saída e mantém a escolha na tela
  it('3. C1: falha de salvamento bloqueia a saída, mostra erro e mantém a escolha na tela', async () => {
    vi.spyOn(experienceResponseService, 'saveResponse').mockRejectedValue(
      new Error('Erro de conexão com o banco'),
    )

    const onExitToHub = vi.fn()
    render(
      <AyurvedaChapter1Flow
        enrollmentId="enr-test-03"
        experienceId="exp-test-03"
        respondentUserId="user-daiane"
        mode="answering"
        initialStep={1}
        onExitToHub={onExitToHub}
      />,
    )

    await screen.findByRole('button', { name: 'Avançar para Pele' })

    // Seleciona opção
    const optionBtn = screen.getByRole('button', {
      name: 'Figura feminina — estrutura intermediária',
    })
    fireEvent.click(optionBtn)

    const headerSaveBtn = screen.getByRole('button', { name: 'Salvar e continuar depois' })
    fireEvent.click(headerSaveBtn)

    // Aguarda o alerta de erro do saver
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Saída foi BLOQUEADA
    expect(onExitToHub).not.toHaveBeenCalled()

    // Escolha na tela é preservada!
    expect(optionBtn).toHaveAttribute('aria-pressed', 'true')
  })

  // TESTE 4: Retomada mantém a resposta e não marca o capítulo como concluído
  it('4. C2: retomar após salvar e continuar depois mantém a resposta e status em andamento (não concluído)', async () => {
    const savedResponses = [
      {
        id: 'c2-resp-1',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        canonical_prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        experience_id: 'exp-c2',
        response_type: 'ChoiceCards',
        structured_value: {
          value: ['regular_predictable'],
          selectedOptionIds: ['regular_predictable'],
          chapter_id: 'capitulo-2-digestao-rotina',
          chapter_revision_number: 1,
          metadata: {
            prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
            canonical_prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
            revision_number: 1,
          },
        },
      },
    ]

    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue(
      savedResponses as any,
    )

    const onBackToHub = vi.fn()
    render(
      <AyurvedaChapter2Flow
        enrollmentId="enr-c2-test"
        experienceId="exp-c2"
        respondentUserId="user-daiane"
        mode="answering"
        initialStep={1}
        onBackToHub={onBackToHub}
      />,
    )

    // Aguarda carregar momento 1 (Fome)
    await screen.findByRole('button', { name: 'Avançar para Digestão' })

    // A resposta anterior foi restaurada na tela
    const regularBtn = screen.getByRole('button', {
      name: /Regular e previsível/,
    })
    expect(regularBtn).toHaveAttribute('aria-pressed', 'true')

    // O cabeçalho de salvar e continuar depois está presente durante a pergunta
    const headerSaveBtn = screen.getByRole('button', { name: 'Salvar e continuar depois' })
    expect(headerSaveBtn).toBeInTheDocument()

    // Não existe indicação de capítulo concluído
    expect(screen.queryByText('Capítulo 2 concluído')).not.toBeInTheDocument()
  })

  // TESTE 5: Validar acesso e equivalência em C2 e C3 (inclusive em correção)
  it('5. C2: botão de pausa disponível na correção e não duplicado no encerramento nem exibido em modo somente leitura', async () => {
    // 5.1 No encerramento normal, existe apenas 1 botão com label "Salvar e continuar depois"
    const { unmount: unmountClosing } = render(
      <AyurvedaChapter2Flow
        enrollmentId="enr-c2-closing"
        experienceId="exp-c2"
        respondentUserId="user-daiane"
        mode="ready_to_complete"
        onBackToHub={vi.fn()}
      />,
    )
    await screen.findByText('Suas respostas deste capítulo estão completas')
    const closingButtons = screen.getAllByRole('button', { name: 'Salvar e continuar depois' })
    expect(closingButtons).toHaveLength(1) // Não duplicou!
    unmountClosing()

    // 5.2 Em modo de revisão somente-leitura (review), a pausa NÃO é exibida
    const { unmount: unmountReview } = render(
      <AyurvedaChapter2Flow
        enrollmentId="enr-c2-review"
        experienceId="exp-c2"
        respondentUserId="user-daiane"
        mode="review"
        initialStep={1}
        onBackToHub={vi.fn()}
      />,
    )
    await screen.findByTestId('banner-c2-review-mode')
    expect(
      screen.queryByRole('button', { name: 'Salvar e continuar depois' }),
    ).not.toBeInTheDocument()
    unmountReview()

    // 5.3 Em modo de correção (correcting), a pausa está disponível!
    render(
      <AyurvedaChapter2Flow
        enrollmentId="enr-c2-corr"
        experienceId="exp-c2"
        respondentUserId="user-daiane"
        mode="correcting"
        initialStep={1}
        onBackToHub={vi.fn()}
      />,
    )
    await screen.findByRole('button', { name: 'Avançar para Digestão' })
    expect(screen.getByRole('button', { name: 'Salvar e continuar depois' })).toBeInTheDocument()
  })

  it('5. C3: exitSafely com saver.flush() e disponibilidade durante as etapas e correção', async () => {
    let flushCalled = false
    vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(async (params) => {
      flushCalled = true
      return { id: 'c3-save', prompt_id: params.promptId } as any
    })

    const onBackToHub = vi.fn()
    const { unmount } = render(
      <AyurvedaChapter3Flow
        enrollmentId="enr-c3"
        experienceId="exp-c3"
        respondentUserId="user-daiane"
        initialStep={1}
        onBackToHub={onBackToHub}
      />,
    )

    await screen.findByText('Em quais áreas você percebe alguma mudança atualmente?')

    // Cabeçalho de pausa está visível
    const headerSaveBtn = screen.getByRole('button', { name: 'Salvar e continuar depois' })
    expect(headerSaveBtn).toBeInTheDocument()

    // Seleciona uma opção e clica em salvar e continuar depois
    fireEvent.click(screen.getByRole('button', { name: 'Digestão ou apetite' }))
    fireEvent.click(headerSaveBtn)

    await waitFor(() => {
      expect(onBackToHub).toHaveBeenCalledOnce()
    })
    expect(flushCalled).toBe(true)
    unmount()

    // Em modo review (revisão somente-leitura), a pausa NÃO deve ser mostrada
    render(
      <AyurvedaChapter3Flow
        enrollmentId="enr-c3"
        experienceId="exp-c3"
        respondentUserId="user-daiane"
        mode="review"
        initialStep={1}
        onBackToHub={vi.fn()}
      />,
    )
    await screen.findByText('Em quais áreas você percebe alguma mudança atualmente?')
    expect(
      screen.queryByRole('button', { name: 'Salvar e continuar depois' }),
    ).not.toBeInTheDocument()
  })

  it('6. C4: síntese sem etapas — voltar aos capítulos não marca completion', async () => {
    const onBackToHub = vi.fn()
    const onCompleted = vi.fn()

    render(
      <AyurvedaChapter4Flow
        enrollmentId="enr-c4"
        experienceId="exp-c4"
        respondentUserId="user-daiane"
        onBackToHub={onBackToHub}
        onCompleted={onCompleted}
      />,
    )

    await screen.findByText('Síntese de Corpo & Fisiologia')

    // Clica em 'Voltar aos capítulos'
    fireEvent.click(screen.getByRole('button', { name: 'Voltar aos capítulos' }))

    expect(onBackToHub).toHaveBeenCalledOnce()
    expect(onCompleted).not.toHaveBeenCalled()
  })
})
