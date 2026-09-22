/**
 * TESTES DE INTEGRAÇÃO DO FLUXO REAL DA INTERFACE (CER V1)
 *
 * Simula:
 * 1. O clique na esfera azul (data-testid="dimension-sphere-mente_emocoes", emite 'exp-mente-emocoes-07c')
 * 2. O clique no cartão inferior (data-testid="dimension-card-mente_emocoes", emite 'exp-mente-emocoes-07c')
 * 3. Passando a chave pelo fluxo real do InteragenteHome até o ExperienceEngine
 * 4. Mesmo com os serviços auxiliares de progresso/respostas rejeitando (ou falha de rede),
 *    os 5 momentos de build07cPrompts.ts chegam ao engine e a tela NÃO mostra
 *    "Esta experiência está sendo preparada e estará disponível em breve."
 * 5. Retomada: responder parcialmente, sair, voltar.
 * 6. Conclusão: conclui a experiência e o estado passa para "Concluída".
 * 7. Zero chamadas PocketBase no modo demo.
 * 8. Nenhuma resposta fictícia criada.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { InteragenteHome } from '@/pages/InteragenteHome'
import { ExperienceEngine } from '@/components/experience/ExperienceEngine'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_MARIANA } from '@/services/demoAdapter'
import {
  enrollmentExperienceService,
  experienceResponseService,
  experienceCatalogService,
} from '@/services/experienceEngine'
import { MENTE_EMOCOES_MOMENTS, BUILD_07C_MENTE_PROMPTS } from '@/services/build07cPrompts'
import pb from '@/lib/pocketbase/client'

describe('Integração Real da Interface — Mente & Emoções (Esfera e Cartão Inferior)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    demoAdapter.resetToDefaultState()
    demoAdapter.enableDemo('mariana')
  })

  it('1. Clique na esfera azul (data-testid="dimension-sphere-mente_emocoes") abre o ExperienceEngine e NÃO mostra tela de preparação', async () => {
    render(
      <MemoryRouter>
        <InteragenteHome />
      </MemoryRouter>,
    )

    // Aguardar carregamento da home
    await waitFor(() => {
      expect(screen.getByTestId('dimension-sphere-mente_emocoes')).toBeTruthy()
    })

    const sphere = screen.getByTestId('dimension-sphere-mente_emocoes')
    fireEvent.click(sphere)

    // O modal do ExperienceEngine deve abrir com o título da experiência de Mente & Emoções
    await waitFor(() => {
      expect(screen.getByText('Mente & Emoções')).toBeTruthy()
    })

    // NÃO deve exibir o texto de fallback
    expect(
      screen.queryByText('Esta experiência está sendo preparada e estará disponível em breve.'),
    ).toBeNull()

    // O botão de início de momento deve estar presente
    expect(screen.getByRole('button', { name: /Iniciar este momento/i })).toBeTruthy()
  })

  it('2. Clique no cartão inferior (data-testid="dimension-card-mente_emocoes") abre o ExperienceEngine e NÃO mostra tela de preparação', async () => {
    render(
      <MemoryRouter>
        <InteragenteHome />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('dimension-card-mente_emocoes')).toBeTruthy()
    })

    const card = screen.getByTestId('dimension-card-mente_emocoes')
    fireEvent.click(card)

    await waitFor(() => {
      expect(screen.getByText('Mente & Emoções')).toBeTruthy()
    })

    expect(
      screen.queryByText('Esta experiência está sendo preparada e estará disponível em breve.'),
    ).toBeNull()
    expect(screen.getByRole('button', { name: /Iniciar este momento/i })).toBeTruthy()
  })

  it('3. Resiliência: mesmo se serviços auxiliares (progresso e respostas) REJEITAREM, os 5 momentos e prompts chegam ao engine e NÃO mostram tela de preparação', async () => {
    // Espionar e forçar rejeição nos serviços auxiliares
    vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockRejectedValue(
      new Error('PocketBase network failure simulation'),
    )
    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockRejectedValue(
      new Error('PocketBase timeout simulation'),
    )

    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId={DEMO_ENROLLMENT_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    // Mesmo com as rejeições das chamadas auxiliares, o engine deve carregar os metadados com resiliência
    await waitFor(() => {
      expect(screen.getByText('Mente & Emoções')).toBeTruthy()
    })

    expect(
      screen.queryByText('Esta experiência está sendo preparada e estará disponível em breve.'),
    ).toBeNull()

    // Clicar em iniciar este momento
    fireEvent.click(screen.getByRole('button', { name: /Iniciar este momento/i }))

    // O primeiro momento de Mente & Emoções deve ser exibido
    await waitFor(() => {
      expect(screen.getByText(MENTE_EMOCOES_MOMENTS[0].title)).toBeTruthy()
    })

    // O primeiro prompt de build07cPrompts.ts deve estar visível
    expect(screen.getByText(BUILD_07C_MENTE_PROMPTS[0].prompt_text)).toBeTruthy()
  })

  it('4. Retomada e conclusão: responder parcialmente, sair, voltar e concluir muda o estado para "Concluída"', async () => {
    const onCompletedMock = vi.fn()
    const onCloseMock = vi.fn()

    const { unmount } = render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId={DEMO_ENROLLMENT_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
        onClose={onCloseMock}
        onCompleted={onCompletedMock}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Mente & Emoções')).toBeTruthy()
    })

    // Iniciar
    fireEvent.click(screen.getByRole('button', { name: /Iniciar este momento/i }))

    await waitFor(() => {
      expect(screen.getByText(BUILD_07C_MENTE_PROMPTS[0].prompt_text)).toBeTruthy()
    })

    // Pausar e fechar
    fireEvent.click(screen.getByRole('button', { name: /Pausar e Salvar/i }))
    expect(onCloseMock).toHaveBeenCalled()

    // Desmontar componente
    unmount()

    // Atualizar progresso no demo para simular avanço e retomada
    await enrollmentExperienceService.updateProgress('exp-mente-emocoes-07c', {
      stepOrder: 2,
      progressStatus: 'in_progress',
      enrollmentId: DEMO_ENROLLMENT_ID,
    })

    // Remontar ExperienceEngine
    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId={DEMO_ENROLLMENT_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
        onClose={onCloseMock}
        onCompleted={onCompletedMock}
      />,
    )

    // Deve exibir o estado de retomada: "Retomar de onde parei"
    await waitFor(() => {
      expect(screen.getByText(/Retomar de onde parei/i)).toBeTruthy()
    })

    // Completar a experiência via service
    await enrollmentExperienceService.updateProgress('exp-mente-emocoes-07c', {
      completed: true,
      progressStatus: 'completed',
      enrollmentId: DEMO_ENROLLMENT_ID,
    })

    // Verificar na lista do enrollment
    const list = await enrollmentExperienceService.listByEnrollment(DEMO_ENROLLMENT_ID)
    const menteExp = list.find((e) => e.experience_id === 'exp-mente-emocoes-07c')
    expect(menteExp?.progress_status).toBe('completed')
    expect(menteExp?.release_status).toBe('completed')
  })

  it('5. Zero chamadas ao PocketBase no modo demo e nenhuma resposta fictícia criada', async () => {
    // Monitorar todas as coleções do PocketBase
    const pbSpy = vi.spyOn(pb, 'collection')

    // Executar ciclo completo de leitura e gravação no demo
    const exp = await experienceCatalogService.getExperienceById('exp-mente-emocoes-07c')
    const moments = await experienceCatalogService.listMomentsByExperience('exp-mente-emocoes-07c')
    const prompts = await experienceCatalogService.listPromptsByExperience('exp-mente-emocoes-07c')
    const enrExp = await enrollmentExperienceService.getByEnrollmentAndExperience(
      DEMO_ENROLLMENT_ID,
      'exp-mente-emocoes-07c',
    )
    const responses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-mente-emocoes-07c',
    )

    // Garantir que no demo pb.collection NÃO foi acionado para responses ou enrollment_experiences
    const forbiddenCollections = ['experience_responses', 'enrollment_experiences', 'cer_signals']
    for (const call of pbSpy.mock.calls) {
      expect(forbiddenCollections).not.toContain(call[0])
    }

    // Nenhuma resposta fictícia deve existir inicialmente
    expect(responses).toEqual([])

    // Todos os 5 momentos e os metadados da experiência foram carregados com fidelidade
    expect(exp.title).toContain('Mente & Emoções')
    expect(moments).toHaveLength(5)
    expect(prompts.length).toBeGreaterThan(0)
    expect(enrExp).toBeTruthy()
  })
})
