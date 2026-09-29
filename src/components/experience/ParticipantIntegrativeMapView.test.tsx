import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ParticipantIntegrativeMapView } from '@/components/experience/ParticipantIntegrativeMapView'
import { ProfessionalConscienciaSection } from '@/components/ProfessionalConscienciaSection'
import { InteragenteHome } from '@/pages/InteragenteHome'
import { buildConscienciaQaFixture } from '@/services/conscienciaQaFixture'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_ENROLLMENT } from '@/services/demoAdapter'

// Mock useAuth para montagens completas de telas de Interagente
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'usr_mariana_01',
      email: 'mariana@cer.local',
      role: 'interagente',
      person_id: 'demo-person-mariana',
    },
    person: {
      id: 'demo-person-mariana',
      full_name: 'Mariana Silva',
      preferred_name: 'Mariana',
      email: 'mariana@cer.local',
      treatment_preference: 'feminino',
    },
    persona: 'mariana',
    setPersona: vi.fn(),
    logout: vi.fn(),
  }),
}))

describe('ParticipantIntegrativeMapView (Duas Profundidades e Gate de Privacidade)', () => {
  const enrollmentId = 'enr-participant-test-123'
  const participantName = 'Mariana Silva'

  it('renderiza o estado vazio/insuficiente de forma gentil sem inventar padrões', () => {
    render(<ParticipantIntegrativeMapView responses={[]} participantName={participantName} />)

    expect(screen.getByTestId('participant-integrative-map-empty')).toBeInTheDocument()
    expect(
      screen.getByText('Você ainda não iniciou as descobertas das dimensões.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Cobertura das dimensões \(0 de 6\)/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Ao responder às experiências de cada dimensão, seu mapa essencial começará a se formar/i,
      ),
    ).toBeInTheDocument()

    // Gate de privacidade em estado vazio: NUNCA expor strings profissionais
    const bodyText = document.body.textContent || ''
    expect(bodyText).not.toContain('Prioridades para a escuta')
    expect(bodyText).not.toContain('perguntas para a sessão')
    expect(bodyText).not.toContain('hipótese de trabalho')
    expect(bodyText).not.toContain('Área Exclusiva da Profissional')
  })

  it('renderiza "Meu mapa essencial" como padrão com a faixa superior e os cards dimensionais', () => {
    const fullResponses = buildConscienciaQaFixture(enrollmentId).responses
    render(
      <ParticipantIntegrativeMapView responses={fullResponses} participantName={participantName} />,
    )

    expect(screen.getByTestId('participant-integrative-map-complete')).toBeInTheDocument()

    // Profundidade 1 é o padrão ao abrir
    expect(screen.getByTestId('participant-map-essencial-view')).toBeInTheDocument()

    // Faixa superior
    expect(screen.getByText(/Cobertura: 6\/6 dimensões/i)).toBeInTheDocument()
    expect(screen.getByText(/Baseado em várias respostas suas/i)).toBeInTheDocument()
    expect(screen.getByText(/História de vida:/i)).toBeInTheDocument()
    expect(screen.getByText(/Ainda não integrada/i)).toBeInTheDocument()
    expect(screen.getByText(/Recursos Pessoais/i)).toBeInTheDocument()
    expect(screen.getByText(/Pontos de Atenção/i)).toBeInTheDocument()
    expect(screen.getByText(/Formas de Proteção/i)).toBeInTheDocument()

    // 6 Cards dimensionais curtos
    expect(screen.getByTestId('participant-card-corpo')).toBeInTheDocument()
    expect(screen.getByTestId('participant-card-mente')).toBeInTheDocument()
    expect(screen.getByTestId('participant-card-regulacao')).toBeInTheDocument()
    expect(screen.getByTestId('participant-card-relacoes')).toBeInTheDocument()
    expect(screen.getByTestId('participant-card-sexualidade')).toBeInTheDocument()
    expect(screen.getByTestId('participant-card-sentido')).toBeInTheDocument()

    // Nota conceitual de autoconhecimento
    expect(screen.getByText(/Quem você é hoje combina a sua/i)).toBeInTheDocument()
    expect(screen.getByText(/Nenhuma leitura é um rótulo ou um destino fixo/i)).toBeInTheDocument()
  })

  it('transita para "Compreender em profundidade" com 4 eixos por dimensão e linguagem provisória', () => {
    const fullResponses = buildConscienciaQaFixture(enrollmentId).responses
    render(
      <ParticipantIntegrativeMapView responses={fullResponses} participantName={participantName} />,
    )

    // Clica na tab de profundidade
    const deepTabTrigger = screen.getByTestId('tab-trigger-profundidade')
    fireEvent.click(deepTabTrigger)

    expect(screen.getByTestId('participant-map-profundidade-view')).toBeInTheDocument()

    // Nota conceitual e linguagem provisória na profundidade
    expect(
      screen.getByText(
        /Essa forma de funcionar pode ter sido uma adaptação muito útil no seu caminho/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/A história de vida está atualmente/i)).toBeInTheDocument()

    // 4 Eixos da dimensão ativa (Corpo & Fisiologia como inicial)
    expect(screen.getByText(/1\. Como isso aparece no seu cotidiano/i)).toBeInTheDocument()
    expect(
      screen.getByText(/2\. O que essa forma de funcionar tenta proteger/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/3\. Qual recurso já existe em você/i)).toBeInTheDocument()
    expect(screen.getByText(/4\. O que pode ser observado ou experimentado/i)).toBeInTheDocument()

    // Alterna para Mente & Emoções
    const menteTab = screen.getByTestId('deep-dim-tab-mente')
    fireEvent.click(menteTab)
    expect(screen.getByTestId('deep-content-mente')).toBeInTheDocument()

    // Alterna para Regulação & Padrões
    const regTab = screen.getByTestId('deep-dim-tab-regulacao')
    fireEvent.click(regTab)
    expect(screen.getByTestId('deep-content-regulacao')).toBeInTheDocument()

    // Botão de retorno ao essencial funciona
    const voltarBtn = screen.getByTestId('btn-voltar-essencial')
    fireEvent.click(voltarBtn)
    expect(screen.getByTestId('participant-map-essencial-view')).toBeInTheDocument()
  })

  it('GATE DE PRIVACIDADE CRÍTICO: NUNCA expõe strings profissionais ou confiança técnica interna', () => {
    const fullResponses = buildConscienciaQaFixture(enrollmentId).responses
    render(
      <ParticipantIntegrativeMapView responses={fullResponses} participantName={participantName} />,
    )

    // 1) Na profundidade 1 (essencial)
    let bodyText = document.body.textContent || ''
    expect(bodyText).not.toContain('Prioridades para a escuta')
    expect(bodyText).not.toContain('Prioridades Possíveis para a Escuta Profissional')
    expect(bodyText).not.toContain('perguntas para a sessão')
    expect(bodyText).not.toContain('Perguntas Clínicas')
    expect(bodyText).not.toContain('hipótese de trabalho')
    expect(bodyText).not.toContain('Hipótese de Trabalho')
    expect(bodyText).not.toContain('Área Exclusiva da Profissional')
    expect(bodyText).not.toContain('Confiança geral:')

    // 2) Na profundidade 2 (compreender em profundidade)
    const deepTabTrigger = screen.getByTestId('tab-trigger-profundidade')
    fireEvent.click(deepTabTrigger)

    bodyText = document.body.textContent || ''
    expect(bodyText).not.toContain('Prioridades para a escuta')
    expect(bodyText).not.toContain('Prioridades Possíveis para a Escuta Profissional')
    expect(bodyText).not.toContain('perguntas para a sessão')
    expect(bodyText).not.toContain('Perguntas Clínicas')
    expect(bodyText).not.toContain('hipótese de trabalho')
    expect(bodyText).not.toContain('Hipótese de Trabalho')
    expect(bodyText).not.toContain('Área Exclusiva da Profissional')
  })

  describe('Sequência interperfil explícita com demoAdapter compartilhado', () => {
    beforeEach(() => {
      localStorage.clear()
      demoAdapter.enableDemo('mariana')
      demoAdapter.setActiveScenario('default')
    })

    afterEach(() => {
      localStorage.clear()
      demoAdapter.setActiveScenario('default')
    })

    it('transita deterministicamente entre perfis com unmount/remount real: profissional ativa QA -> Mariana monta do zero e vê 6/6 no Meu Mapa CER -> desativa -> Mariana remonta e vê 0/6', async () => {
      // (a) Montar visão profissional com QA off
      expect(demoAdapter.getActiveScenario()).toBe('default')
      const { unmount: unmountProf } = render(
        <ProfessionalConscienciaSection
          enrollment={DEMO_ENROLLMENT}
          participantName={participantName}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('toggle-qa-scenario-btn')).toBeInTheDocument()
      })
      expect(screen.getByText('Ativar Cenário QA (6 Dimensões)')).toBeInTheDocument()

      // (b) Ativar QA como profissional (demoAdapter.setActiveScenario('qa_consciencia_completa'))
      fireEvent.click(screen.getByTestId('toggle-qa-scenario-btn'))
      await waitFor(() => {
        expect(screen.getByText('Cenário QA Consciência Ativo')).toBeInTheDocument()
      })
      expect(demoAdapter.getActiveScenario()).toBe('qa_consciencia_completa')

      // (c) DESMONTAR a visão profissional
      unmountProf()

      // (d) Montar InteragenteHome do zero APÓS a ativação
      const { unmount: unmountInteragente } = render(
        <MemoryRouter>
          <InteragenteHome />
        </MemoryRouter>,
      )

      // Ir para a fase de Consciência
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /2\. Consciência/i })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: /2\. Consciência/i }))

      // Rótulo central do "Meu Mapa CER" derivado da cobertura/mapa publicado:
      // com 6/6 e mapa publicado, NÃO mostrar apenas "em construção"
      await waitFor(() => {
        expect(screen.getByTestId('ser-integral-map-center')).toBeInTheDocument()
      })
      expect(screen.queryAllByText('Meu Mapa CER — em construção')).toHaveLength(0)
      expect(screen.getAllByText('Abrir Meu Mapa CER').length).toBeGreaterThan(0)

      // (e) Abrir Meu Mapa CER
      fireEvent.click(screen.getByTestId('ser-integral-map-center'))

      await waitFor(() => {
        expect(screen.getByTestId('participant-integrative-map-complete')).toBeInTheDocument()
      })
      expect(screen.getByText(/Cobertura: 6\/6 dimensões/i)).toBeInTheDocument()

      // As duas tabs devem existir
      expect(screen.getByTestId('tab-trigger-essencial')).toBeInTheDocument()
      expect(screen.getByText('Meu mapa essencial')).toBeInTheDocument()

      const deepTabTrigger = screen.getByTestId('tab-trigger-profundidade')
      expect(deepTabTrigger).toBeInTheDocument()
      expect(screen.getByText('Compreender em profundidade')).toBeInTheDocument()

      // Clicar e verificar profundidade
      fireEvent.click(deepTabTrigger)
      expect(screen.getByTestId('participant-map-profundidade-view')).toBeInTheDocument()

      // Gate de privacidade: ausência de strings profissionais em ambas as tabs
      let bodyText = document.body.textContent || ''
      expect(bodyText).not.toContain('Prioridades para a escuta')
      expect(bodyText).not.toContain('Prioridades Possíveis para a Escuta Profissional')
      expect(bodyText).not.toContain('perguntas para a sessão')
      expect(bodyText).not.toContain('Perguntas Clínicas')
      expect(bodyText).not.toContain('hipótese de trabalho')
      expect(bodyText).not.toContain('Hipótese de Trabalho')
      expect(bodyText).not.toContain('Área Exclusiva da Profissional')
      expect(bodyText).not.toContain('Confiança geral:')

      // (f) Desmontar Mariana, desativar QA como profissional, remontar Mariana: verificar 0/6
      unmountInteragente()

      // Montar profissional para desativar QA
      const { unmount: unmountProf2 } = render(
        <ProfessionalConscienciaSection
          enrollment={DEMO_ENROLLMENT}
          participantName={participantName}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('toggle-qa-scenario-btn')).toBeInTheDocument()
      })
      expect(screen.getByText('Cenário QA Consciência Ativo')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('toggle-qa-scenario-btn'))
      await waitFor(() => {
        expect(screen.getByText('Ativar Cenário QA (6 Dimensões)')).toBeInTheDocument()
      })
      expect(demoAdapter.getActiveScenario()).toBe('default')

      unmountProf2()

      // Remontar Mariana do zero
      const { unmount: unmountInteragente2 } = render(
        <MemoryRouter>
          <InteragenteHome />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /2\. Consciência/i })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: /2\. Consciência/i }))

      // Agora sem QA: rótulo volta a "em construção"
      await waitFor(() => {
        expect(screen.getByTestId('ser-integral-map-center')).toBeInTheDocument()
      })
      expect(screen.getAllByText('Meu Mapa CER — em construção').length).toBeGreaterThan(0)

      // Abrir Meu Mapa CER e verificar estado vazio 0/6
      fireEvent.click(screen.getByTestId('ser-integral-map-center'))

      await waitFor(() => {
        expect(screen.getByTestId('participant-integrative-map-empty')).toBeInTheDocument()
      })
      expect(screen.getByText(/Cobertura das dimensões \(0 de 6\)/i)).toBeInTheDocument()

      bodyText = document.body.textContent || ''
      expect(bodyText).not.toContain('Prioridades para a escuta')
      expect(bodyText).not.toContain('Prioridades Possíveis para a Escuta Profissional')
      expect(bodyText).not.toContain('perguntas para a sessão')
      expect(bodyText).not.toContain('Perguntas Clínicas')
      expect(bodyText).not.toContain('hipótese de trabalho')
      expect(bodyText).not.toContain('Hipótese de Trabalho')
      expect(bodyText).not.toContain('Área Exclusiva da Profissional')
      expect(bodyText).not.toContain('Confiança geral:')

      unmountInteragente2()
    })
  })
})
