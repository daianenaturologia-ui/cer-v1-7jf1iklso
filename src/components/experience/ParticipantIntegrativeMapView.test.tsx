import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParticipantIntegrativeMapView } from '@/components/experience/ParticipantIntegrativeMapView'
import { buildConscienciaQaFixture } from '@/services/conscienciaQaFixture'
import { demoAdapter, DEMO_ENROLLMENT_ID } from '@/services/demoAdapter'

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
      demoAdapter.enableDemo()
      demoAdapter.setActiveScenario('default')
    })

    afterEach(() => {
      demoAdapter.setActiveScenario('default')
    })

    it('transita deterministicamente entre perfis: QA off (0/6) -> profissional ativa QA (6/6) -> profissional desativa QA (0/6) com asserts de privacidade', () => {
      // 1. QA off -> participante vê 0/6
      expect(demoAdapter.getActiveScenario()).toBe('default')
      const responsesOff = demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID)
      const { rerender } = render(
        <ParticipantIntegrativeMapView
          responses={responsesOff}
          participantName={participantName}
        />,
      )

      expect(screen.getByTestId('participant-integrative-map-empty')).toBeInTheDocument()
      expect(screen.getByText(/Cobertura das dimensões \(0 de 6\)/i)).toBeInTheDocument()

      // Asserts de AUSÊNCIA de strings profissionais no estado 0/6
      let bodyText = document.body.textContent || ''
      expect(bodyText).not.toContain('Prioridades para a escuta')
      expect(bodyText).not.toContain('Prioridades Possíveis para a Escuta Profissional')
      expect(bodyText).not.toContain('perguntas para a sessão')
      expect(bodyText).not.toContain('Perguntas Clínicas')
      expect(bodyText).not.toContain('hipótese de trabalho')
      expect(bodyText).not.toContain('Hipótese de Trabalho')
      expect(bodyText).not.toContain('Área Exclusiva da Profissional')
      expect(bodyText).not.toContain('Confiança geral:')

      // 2. Profissional ativa o cenário QA via demoAdapter
      demoAdapter.setActiveScenario('qa_consciencia_completa')
      expect(demoAdapter.getActiveScenario()).toBe('qa_consciencia_completa')

      const responsesOn = demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID)
      rerender(
        <ParticipantIntegrativeMapView responses={responsesOn} participantName={participantName} />,
      )

      expect(screen.getByTestId('participant-integrative-map-complete')).toBeInTheDocument()
      expect(screen.getByText(/Cobertura: 6\/6 dimensões/i)).toBeInTheDocument()

      // "Meu mapa essencial" disponível
      expect(screen.getByTestId('participant-map-essencial-view')).toBeInTheDocument()
      expect(screen.getByText('Meu mapa essencial')).toBeInTheDocument()

      // "Compreender em profundidade" disponível
      const deepTabTrigger = screen.getByTestId('tab-trigger-profundidade')
      expect(deepTabTrigger).toBeInTheDocument()
      fireEvent.click(deepTabTrigger)
      expect(screen.getByTestId('participant-map-profundidade-view')).toBeInTheDocument()

      // Asserts de AUSÊNCIA de strings profissionais no estado 6/6 (essencial e profundidade)
      bodyText = document.body.textContent || ''
      expect(bodyText).not.toContain('Prioridades para a escuta')
      expect(bodyText).not.toContain('Prioridades Possíveis para a Escuta Profissional')
      expect(bodyText).not.toContain('perguntas para a sessão')
      expect(bodyText).not.toContain('Perguntas Clínicas')
      expect(bodyText).not.toContain('hipótese de trabalho')
      expect(bodyText).not.toContain('Hipótese de Trabalho')
      expect(bodyText).not.toContain('Área Exclusiva da Profissional')
      expect(bodyText).not.toContain('Confiança geral:')

      // 3. Profissional desativa o cenário QA -> participante volta a 0/6
      demoAdapter.setActiveScenario('default')
      expect(demoAdapter.getActiveScenario()).toBe('default')

      const responsesBackOff = demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID)
      rerender(
        <ParticipantIntegrativeMapView
          responses={responsesBackOff}
          participantName={participantName}
        />,
      )

      expect(screen.getByTestId('participant-integrative-map-empty')).toBeInTheDocument()
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
    })
  })
})
