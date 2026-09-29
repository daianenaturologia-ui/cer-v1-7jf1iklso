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

  it('permite alternar e inspecionar hipóteses e matriz de cobertura', () => {
    const fullResponses = buildConscienciaQaFixture(enrollmentId).responses
    render(
      <ProfessionalIntegrativeMapView
        responses={fullResponses}
        participantName={participantName}
      />,
    )

    // Abre matriz de cobertura no bloco 8
    const toggleMatrixBtn = screen.getByText('Ver matriz de cobertura')
    fireEvent.click(toggleMatrixBtn)
    expect(screen.getByText('Status das Seis Dimensões Canônicas')).toBeInTheDocument()
    expect(screen.getByText('Ocultar matriz')).toBeInTheDocument()
  })
})
