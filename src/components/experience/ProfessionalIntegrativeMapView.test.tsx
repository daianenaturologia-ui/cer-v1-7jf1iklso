import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProfessionalIntegrativeMapView } from '@/components/experience/ProfessionalIntegrativeMapView'
import { buildConscienciaQaFixture } from '@/services/conscienciaQaFixture'

describe('Componente ProfessionalIntegrativeMapView (UI do Mapa Integrativo)', () => {
  const enrollmentId = 'enr-ui-test-123'
  const participantName = 'Juliana Pereira'

  it('renderiza o estado vazio/insuficiente com aviso canônico quando não há respostas', () => {
    render(<ProfessionalIntegrativeMapView responses={[]} participantName={participantName} />)

    expect(screen.getByTestId('professional-integrative-map-empty')).toBeInTheDocument()
    expect(
      screen.getByText('Esta interagente ainda não iniciou este capítulo.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /O Mapa Integrativo Profissional aguarda o preenchimento de pelo menos duas dimensões/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Área Exclusiva da Profissional · Somente Leitura/i),
    ).toBeInTheDocument()
  })

  it('renderiza todos os 8 blocos obrigatórios quando as 6 dimensões estão ativas', () => {
    const fullResponses = buildConscienciaQaFixture(enrollmentId).responses
    render(
      <ProfessionalIntegrativeMapView
        responses={fullResponses}
        participantName={participantName}
      />,
    )

    expect(screen.getByTestId('professional-integrative-map-complete')).toBeInTheDocument()

    // 1) Minimapa é a visualização padrão ao abrir
    expect(screen.getByTestId('professional-minimapa-view')).toBeInTheDocument()
    expect(screen.getByText(/Cobertura: 6\/6 dimensões/i)).toBeInTheDocument()
    expect(screen.getByText(/Confiança geral: Alta/i)).toBeInTheDocument()
    expect(screen.getByText(/Nota conceitual:/i)).toBeInTheDocument()

    // Cards do Minimapa
    expect(screen.getByTestId('minimapa-card-corpo')).toBeInTheDocument()
    expect(screen.getByTestId('minimapa-card-mente')).toBeInTheDocument()
    expect(screen.getByTestId('minimapa-card-regulacao')).toBeInTheDocument()
    expect(screen.getByTestId('minimapa-card-relacoes')).toBeInTheDocument()
    expect(screen.getByTestId('minimapa-card-sexualidade')).toBeInTheDocument()
    expect(screen.getByTestId('minimapa-card-sentido')).toBeInTheDocument()

    // 2) Alterna para Leitura Aprofundada e verifica os 8 blocos integrais
    const deepTab = screen.getByTestId('tab-trigger-aprofundada')
    fireEvent.click(deepTab)

    expect(screen.getByTestId('professional-deep-reading-view')).toBeInTheDocument()

    // Bloco 1: Síntese Essencial
    expect(
      screen.getByText('1. Síntese Essencial da Pessoa e do Momento Atual'),
    ).toBeInTheDocument()
    expect(screen.getByText(/A leitura integrativa de Juliana Pereira/i)).toBeInTheDocument()

    // Bloco 2: Recursos e Forças Transversais
    expect(screen.getByText('2. Recursos e Forças Transversais')).toBeInTheDocument()
    expect(
      screen.getByText(/Pausas em Quietude, Contato com a Natureza e Grounding/i),
    ).toBeInTheDocument()

    // Bloco 3: Convergências Centrais
    expect(screen.getByText('3. Convergências Centrais entre as Dimensões')).toBeInTheDocument()
    expect(screen.getByText(/Eixo Somatocognitivo de Mobilização Preventiva/i)).toBeInTheDocument()

    // Bloco 4: Padrões de Proteção
    expect(
      screen.getByText('4. Padrões de Proteção e Tensões que Dificultam o Movimento'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Hipervigilância Operacional e Rigor do "Fazer Certo"/i),
    ).toBeInTheDocument()

    // Bloco 5: Hipóteses Integrativas CER
    expect(screen.getByText(/5. Hipóteses Integrativas CER/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Hipótese Integrativa Somatocognitiva: Retroalimentação Tensão-Digestão/i),
    ).toBeInTheDocument()

    // Bloco 6: Ayurveda Conciso
    expect(screen.getByText(/6. Bloco Ayurveda Conciso/i)).toBeInTheDocument()
    expect(screen.getByText(/Hipótese de Prakriti/i)).toBeInTheDocument()
    expect(screen.getByText(/Vishama Agni/i)).toBeInTheDocument()

    // Bloco 7: Prioridades para a Escuta Profissional
    expect(
      screen.getByText(/7. Prioridades Possíveis para a Escuta Profissional \(Não Prescrição\)/i),
    ).toBeInTheDocument()

    // Bloco 8: Lacunas de Informação
    expect(screen.getByText('8. Lacunas de Informação e Limites de Evidência')).toBeInTheDocument()
  })

  it('permite alternar entre minimapa e leitura aprofundada via botões e atalhos de dimensão', () => {
    const fullResponses = buildConscienciaQaFixture(enrollmentId).responses
    render(
      <ProfessionalIntegrativeMapView
        responses={fullResponses}
        participantName={participantName}
      />,
    )

    // Inicialmente no Minimapa
    expect(screen.getByTestId('professional-minimapa-view')).toBeInTheDocument()

    // Clica em botão de aprofundar no topo
    const aprofundarTopo = screen.getByTestId('btn-aprofundar-topo')
    fireEvent.click(aprofundarTopo)
    expect(screen.getByTestId('professional-deep-reading-view')).toBeInTheDocument()

    // Retorna ao Minimapa
    const voltarBtn = screen.getByTestId('btn-voltar-minimapa')
    fireEvent.click(voltarBtn)
    expect(screen.getByTestId('professional-minimapa-view')).toBeInTheDocument()
  })

  it('permite alternar e inspecionar hipóteses e matriz de cobertura na leitura aprofundada', () => {
    const fullResponses = buildConscienciaQaFixture(enrollmentId).responses
    render(
      <ProfessionalIntegrativeMapView
        responses={fullResponses}
        participantName={participantName}
      />,
    )

    // Muda para leitura aprofundada
    const deepTab = screen.getByTestId('tab-trigger-aprofundada')
    fireEvent.click(deepTab)

    // Abre matriz de cobertura no bloco 8
    const toggleMatrixBtn = screen.getByText('Ver matriz de cobertura')
    fireEvent.click(toggleMatrixBtn)
    expect(screen.getByText('Status das Seis Dimensões Canônicas')).toBeInTheDocument()
    expect(screen.getByText('Ocultar matriz')).toBeInTheDocument()
  })
})
