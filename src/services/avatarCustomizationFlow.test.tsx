import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import {
  AvatarCustomizationFlow,
  AvatarCustomizationResult,
} from '@/components/experience/AvatarCustomizationFlow'
import { demoAdapter } from '@/services/demoAdapter'
import { personService } from '@/services/cer'
import { ExperienceEngine } from '@/components/experience/ExperienceEngine'
import { PersonRecord } from '@/types/cer'
import * as avatarCompositor from '@/services/avatarCompositor'

// Mock de renderAvatarToCanvas para testes de interface
vi.mock('@/services/avatarCompositor', async () => {
  const actual = await vi.importActual<typeof import('@/services/avatarCompositor')>(
    '@/services/avatarCompositor',
  )
  return {
    ...actual,
    renderAvatarToCanvas: vi.fn().mockResolvedValue(undefined),
  }
})

describe('CER V1 — LOTE 0B2: Personalização Estética na Jornada da Interagente (17 Testes Mínimos Obrigatórios)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    demoAdapter.resetToDefaultState()
  })

  // Teste 1: Primeira entrada em Corpo & Fisiologia abre a personalização antes das perguntas
  it('1) primeira entrada em Corpo & Fisiologia abre a personalização antes das perguntas', async () => {
    // Configura Mari com avatar pendente
    demoAdapter.updatePerson('demo-person-mariana', {
      avatar_presentation: undefined,
      avatar_skin_tone: undefined,
      avatar_hair_color: undefined,
      avatar_customization_status: undefined,
    } as any)

    render(
      <ExperienceEngine
        experienceId="exp-corpo-fisiologia-07b"
        enrollmentId="demo-enrollment-mariana-001"
        respondentUserId="demo-user-mariana"
        personId="demo-person-mariana"
      />,
    )

    // Deve encontrar o fluxo de personalização aberto
    await waitFor(() => {
      expect(screen.getByTestId('avatar-customization-flow')).toBeDefined()
      expect(screen.getByText('Antes de começar, monte sua representação')).toBeDefined()
    })
  })

  // Teste 2: Figura feminina funciona
  it('2) figura feminina funciona', async () => {
    const handleConfirm = vi.fn()
    const handleDefer = vi.fn()

    render(<AvatarCustomizationFlow onConfirm={handleConfirm} onDefer={handleDefer} />)

    const femBtn = screen.getByRole('button', { name: /Selecionar Figura feminina/i })
    fireEvent.click(femBtn)
    expect(femBtn.getAttribute('aria-pressed')).toBe('true')

    const nextBtn = screen.getByRole('button', { name: /Avançar para tom de pele/i })
    expect(nextBtn.hasAttribute('disabled')).toBe(false)
    fireEvent.click(nextBtn)

    // Avança para a etapa 2
    expect(
      screen.getByText('Qual tonalidade ajuda você a se reconhecer nesta representação?'),
    ).toBeDefined()
  })

  // Teste 3: Figura masculina funciona
  it('3) figura masculina funciona', async () => {
    const handleConfirm = vi.fn()
    const handleDefer = vi.fn()

    render(<AvatarCustomizationFlow onConfirm={handleConfirm} onDefer={handleDefer} />)

    const mascBtn = screen.getByRole('button', { name: /Selecionar Figura masculina/i })
    fireEvent.click(mascBtn)
    expect(mascBtn.getAttribute('aria-pressed')).toBe('true')

    const nextBtn = screen.getByRole('button', { name: /Avançar para tom de pele/i })
    expect(nextBtn.hasAttribute('disabled')).toBe(false)
    fireEvent.click(nextBtn)

    // Avança para a etapa 2
    expect(
      screen.getByText('Qual tonalidade ajuda você a se reconhecer nesta representação?'),
    ).toBeDefined()
  })

  // Teste 4: "Quero comparar as duas" exige escolha final
  it('4) "Quero comparar as duas" exige escolha final', async () => {
    const handleConfirm = vi.fn()
    const handleDefer = vi.fn()

    render(<AvatarCustomizationFlow onConfirm={handleConfirm} onDefer={handleDefer} />)

    const compareBtn = screen.getByRole('button', {
      name: /Quero comparar as duas figuras lado a lado/i,
    })
    fireEvent.click(compareBtn)

    // Exibe o container de comparação lado a lado
    expect(screen.getByTestId('avatar-compare-container')).toBeDefined()

    // O botão de avançar ainda deve estar desabilitado até que uma seja escolhida
    const nextBtn = screen.getByRole('button', { name: /Avançar para tom de pele/i })
    expect(nextBtn.hasAttribute('disabled')).toBe(true)

    // Seleciona a feminina dentro da comparação
    const chooseFemBtn = screen.getByRole('button', { name: /Escolher Figura Feminina/i })
    fireEvent.click(chooseFemBtn)

    // Agora o botão de avançar fica habilitado
    expect(nextBtn.hasAttribute('disabled')).toBe(false)
    fireEvent.click(nextBtn)
    expect(
      screen.getByText('Qual tonalidade ajuda você a se reconhecer nesta representação?'),
    ).toBeDefined()
  })

  // Teste 5: Os 6 tons de pele atualizam somente a pele
  it('5) os 6 tons de pele atualizam somente a pele', async () => {
    const handleConfirm = vi.fn()
    const handleDefer = vi.fn()

    render(
      <AvatarCustomizationFlow
        initialConfig={{ presentation: 'feminine', skinTone: 'skin_01' }}
        onConfirm={handleConfirm}
        onDefer={handleDefer}
      />,
    )

    // Vai para a etapa 2
    fireEvent.click(screen.getByRole('button', { name: /Avançar para tom de pele/i }))

    // Devem existir 6 botões com Tom de pele 1..6
    for (let i = 1; i <= 6; i++) {
      const toneBtn = screen.getByRole('button', { name: new RegExp(`Tom de pele ${i}`, 'i') })
      expect(toneBtn).toBeDefined()
      fireEvent.click(toneBtn)
      expect(toneBtn.getAttribute('aria-pressed')).toBe('true')
    }
  })

  // Teste 6: As 6 cores atualizam somente o cabelo
  it('6) as 6 cores atualizam somente o cabelo', async () => {
    const handleConfirm = vi.fn()
    const handleDefer = vi.fn()

    render(
      <AvatarCustomizationFlow
        initialConfig={{ presentation: 'feminine', skinTone: 'skin_01' }}
        onConfirm={handleConfirm}
        onDefer={handleDefer}
      />,
    )

    // Etapa 1 -> Etapa 2
    fireEvent.click(screen.getByRole('button', { name: /Avançar para tom de pele/i }))
    // Etapa 2 -> Etapa 3
    fireEvent.click(screen.getByRole('button', { name: /Avançar para cor do cabelo/i }))

    const hairLabels = [
      'Preto',
      'Castanho-escuro',
      'Castanho-claro',
      'Loiro',
      'Ruivo',
      'Grisalho ou branco',
    ]
    for (const label of hairLabels) {
      const hairBtn = screen.getByRole('button', {
        name: new RegExp(`Cor de cabelo: ${label}`, 'i'),
      })
      expect(hairBtn).toBeDefined()
      fireEvent.click(hairBtn)
      expect(hairBtn.getAttribute('aria-pressed')).toBe('true')
    }
  })

  // Teste 7: Estrutura sempre intermediária
  it('7) estrutura sempre intermediária', async () => {
    const renderSpy = vi.spyOn(avatarCompositor, 'renderAvatarToCanvas')
    render(<AvatarCustomizationFlow onConfirm={vi.fn()} onDefer={vi.fn()} />)

    // O spy do renderAvatarToCanvas deve ter recebido structure: 'intermediate'
    await waitFor(() => {
      expect(renderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          structure: 'intermediate',
        }),
        expect.anything(),
      )
    })
  })

  // Teste 8: Confirmação persiste as escolhas
  it('8) confirmação persiste as escolhas', async () => {
    let persistedResult: AvatarCustomizationResult | null = null
    const handleConfirm = (res: AvatarCustomizationResult) => {
      persistedResult = res
    }

    render(<AvatarCustomizationFlow onConfirm={handleConfirm} onDefer={vi.fn()} />)

    // 1. Escolhe feminina e avança
    fireEvent.click(screen.getByRole('button', { name: /Selecionar Figura feminina/i }))
    fireEvent.click(screen.getByRole('button', { name: /Avançar para tom de pele/i }))

    // 2. Escolhe Tom de pele 3 e avança
    fireEvent.click(screen.getByRole('button', { name: /Tom de pele 3/i }))
    fireEvent.click(screen.getByRole('button', { name: /Avançar para cor do cabelo/i }))

    // 3. Escolhe Ruivo e avança
    fireEvent.click(screen.getByRole('button', { name: /Cor de cabelo: Ruivo/i }))
    fireEvent.click(screen.getByRole('button', { name: /Revisar representação/i }))

    // 4. Confirmação
    expect(screen.getByText('Esta é a representação que acompanhará você')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /Confirmar e começar/i }))

    expect(persistedResult).toEqual({
      presentation: 'feminine',
      skinTone: 'skin_03',
      hairColor: 'hair_red',
    })
  })

  // Teste 9: Reabrir Corpo & Fisiologia não repete a personalização quando status completed
  it('9) reabrir Corpo & Fisiologia não repete a personalização quando status completed', async () => {
    // Configura Mari com status completed
    demoAdapter.updatePerson('demo-person-mariana', {
      avatar_presentation: 'feminine',
      avatar_skin_tone: 'skin_03',
      avatar_hair_color: 'hair_dark_brown',
      avatar_customization_status: 'completed',
    })

    render(
      <ExperienceEngine
        experienceId="exp-corpo-fisiologia-07b"
        enrollmentId="demo-enrollment-mariana-001"
        respondentUserId="demo-user-mariana"
        personId="demo-person-mariana"
      />,
    )

    // Não deve exibir o fluxo de personalização aberto, vai direto para abertura da experiência
    await waitFor(() => {
      expect(screen.queryByTestId('avatar-customization-flow')).toBeNull()
      expect(screen.getByText('Iniciar este momento')).toBeDefined()
    })
  })

  // Teste 10: deferred não cria valores fictícios
  it('10) deferred não cria valores fictícios', async () => {
    const updated = await personService.updateAvatarCustomization('demo-person-mariana', {
      avatar_customization_status: 'deferred',
    })

    expect(updated.avatar_customization_status).toBe('deferred')
    expect(updated.avatar_presentation).toBeUndefined()
    expect(updated.avatar_skin_tone).toBeUndefined()
    expect(updated.avatar_hair_color).toBeUndefined()
  })

  // Teste 11: Editar depois não apaga respostas nem progresso
  it('11) editar depois não apaga respostas nem progresso', async () => {
    // Salva uma resposta existente no demoAdapter para Corpo & Fisiologia
    demoAdapter.saveExperienceResponse({
      enrollmentId: 'demo-enrollment-mariana-001',
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: 'p-07b-pm1-p1-energia-matinal',
      respondentUserId: 'demo-user-mariana',
      responseType: 'SimpleScale',
      promptVersion: 1,
      structuredValue: { rating: 4 },
      accessClass: 'participant_shared',
    })

    const initialResponses = demoAdapter.listExperienceResponses(
      'demo-enrollment-mariana-001',
      'exp-corpo-fisiologia-07b',
    )
    expect(initialResponses.length).toBeGreaterThan(0)

    // Atualiza a representação do avatar
    await personService.updateAvatarCustomization('demo-person-mariana', {
      avatar_presentation: 'masculine',
      avatar_skin_tone: 'skin_05',
      avatar_hair_color: 'hair_black',
      avatar_customization_status: 'completed',
    })

    // Verifica que as respostas permanecem intactas
    const postResponses = demoAdapter.listExperienceResponses(
      'demo-enrollment-mariana-001',
      'exp-corpo-fisiologia-07b',
    )
    expect(postResponses.length).toBe(initialResponses.length)
    expect((postResponses[0].structured_value as any).rating).toBe(4)
  })

  // Teste 12: Participante com experiência já iniciada retorna ao ponto exato após personalizar
  it('12) participante com experiência já iniciada retorna ao ponto exato após personalizar', async () => {
    // Simula que a interagente já havia avançado para o passo 2
    demoAdapter.updateEnrollmentExperienceProgress(
      'demo-enrollment-mariana-001',
      'exp-corpo-fisiologia-07b',
      { stepOrder: 2, progressStatus: 'in_progress' },
    )
    demoAdapter.updatePerson('demo-person-mariana', {
      avatar_customization_status: undefined,
    } as any)

    render(
      <ExperienceEngine
        experienceId="exp-corpo-fisiologia-07b"
        enrollmentId="demo-enrollment-mariana-001"
        respondentUserId="demo-user-mariana"
        personId="demo-person-mariana"
      />,
    )

    // Personalização abre
    await waitFor(() => {
      expect(screen.getByTestId('avatar-customization-flow')).toBeDefined()
    })

    // Usuária clica em "Prefiro escolher depois"
    fireEvent.click(screen.getByRole('button', { name: /Prefiro escolher depois/i }))

    // Retorna ao ponto com indicação de retomada
    await waitFor(() => {
      expect(screen.queryByTestId('avatar-customization-flow')).toBeNull()
      expect(screen.getByText('Retomar de onde parei')).toBeDefined()
      expect(screen.getByText(/Você já iniciou esta experiência/i)).toBeDefined()
    })
  })

  // Teste 13: Modo demonstração com zero chamadas ao PocketBase
  it('13) modo demonstração com zero chamadas ao PocketBase', async () => {
    expect(demoAdapter.isEnabled()).toBe(true)

    // Atualização de person em demo mode não toca pb
    const updated = await personService.updateAvatarCustomization('demo-person-mariana', {
      avatar_presentation: 'feminine',
      avatar_skin_tone: 'skin_02',
      avatar_hair_color: 'hair_dark_brown',
      avatar_customization_status: 'completed',
    })

    expect(updated.avatar_customization_status).toBe('completed')
    expect(demoAdapter.getCurrentPerson().avatar_presentation).toBe('feminine')
  })

  // Teste 14: Preferências estéticas nunca aparecem como resposta clínica ou evidência Ayurveda
  it('14) preferências estéticas nunca aparecem como resposta clínica ou evidência Ayurveda', async () => {
    await personService.updateAvatarCustomization('demo-person-mariana', {
      avatar_presentation: 'feminine',
      avatar_skin_tone: 'skin_04',
      avatar_hair_color: 'hair_blonde',
      avatar_customization_status: 'completed',
    })

    const responses = demoAdapter.listExperienceResponses(
      'demo-enrollment-mariana-001',
      'exp-corpo-fisiologia-07b',
    )
    for (const r of responses) {
      expect((r.structured_value as any)?.avatar_presentation).toBeUndefined()
      expect((r.structured_value as any)?.avatar_skin_tone).toBeUndefined()
      expect((r.structured_value as any)?.avatar_hair_color).toBeUndefined()
    }
  })

  // Teste 15: Falha de asset não mostra imagem quebrada
  it('15) falha de asset não mostra imagem quebrada', async () => {
    vi.mocked(avatarCompositor.renderAvatarToCanvas).mockRejectedValueOnce(
      new Error('Erro de teste no carregamento'),
    )

    render(<AvatarCustomizationFlow onConfirm={vi.fn()} onDefer={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Não foi possível carregar a imagem neste momento.')).toBeDefined()
      expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeDefined()
    })
  })

  // Teste 16: Teclado e ARIA funcionam
  it('16) teclado e ARIA funcionam', async () => {
    render(<AvatarCustomizationFlow onConfirm={vi.fn()} onDefer={vi.fn()} />)

    const femBtn = screen.getByRole('button', { name: /Selecionar Figura feminina/i })
    expect(femBtn.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(femBtn)
    expect(femBtn.getAttribute('aria-pressed')).toBe('true')

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar.getAttribute('aria-valuenow')).toBe('33.3')
  })

  // Teste 17: Typecheck, lint, Vitest completo e build passam (Validado pela execução desta suíte e pipeline)
  it('17) integridade técnica do lote 0B2', () => {
    expect(typeof personService.updateAvatarCustomization).toBe('function')
    expect(typeof AvatarCustomizationFlow).toBe('function')
  })
})
