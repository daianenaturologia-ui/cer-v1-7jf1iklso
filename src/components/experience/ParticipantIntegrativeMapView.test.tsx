// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParticipantIntegrativeMapView } from './ParticipantIntegrativeMapView'
import { buildCerMapReadings, CER_READING_DIMENSIONS } from '@/services/cerMapReadings'

afterEach(cleanup)
const snapshot = () => buildCerMapReadings([], 'enr', 'Pessoa teste')
describe('Mapa CER: somente a publicação revisada, em duas profundidades', () => {
  it('distingue ausência de respostas de seis dimensões concluídas mesmo sem respostas carregadas', () => {
    const progress = CER_READING_DIMENSIONS.map((d) => ({
      experience_id: d.experienceId,
      progress_status: 'completed',
    })) as any
    render(
      <ParticipantIntegrativeMapView responses={[]} progress={progress} participantName="Teste" />,
    )
    expect(screen.getByText('Cobertura das dimensões (6 de 6)')).toBeInTheDocument()
    expect(screen.getAllByText('Concluída')).toHaveLength(6)
    expect(
      screen.queryByText('Você ainda não iniciou as descobertas das dimensões.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId('cer-map-readings')).not.toBeInTheDocument()
  })
  it('nunca usa rascunho como interpretação compartilhada', () => {
    const document = snapshot()
    document.integration = 'CONTEÚDO AINDA PRIVADO'
    render(
      <ParticipantIntegrativeMapView
        responses={[]}
        participantName="Teste"
        currentMap={{ status: 'draft', reading_snapshot: document, items: [] } as any}
      />,
    )
    expect(screen.queryByText('CONTEÚDO AINDA PRIVADO')).not.toBeInTheDocument()
    expect(screen.getByText('Cobertura das dimensões (0 de 6)')).toBeInTheDocument()
  })
  it('exibe exatamente o snapshot publicado e mantém explicações e referências nas duas versões', async () => {
    const document = snapshot()
    document.dimensions[1].summaryRows = [
      { label: 'Resumo revisado', text: 'RESPOSTA DA VERSÃO PUBLICADA' },
    ]
    document.dimensions[1].detailedRows = [
      { label: 'Detalhe revisado', text: 'DETALHE DA VERSÃO PUBLICADA' },
    ]
    document.dimensions[1].interpretation = 'INTERPRETAÇÃO REVISADA'
    const map = { status: 'published', reading_snapshot: document, items: [] } as any
    const { rerender } = render(
      <ParticipantIntegrativeMapView responses={[]} participantName="Teste" currentMap={map} />,
    )
    expect(screen.getByText('RESPOSTA DA VERSÃO PUBLICADA')).toBeInTheDocument()
    expect(screen.getAllByText('Como compreender esta dimensão')).toHaveLength(6)
    expect(screen.getByText('Referências e fundamentos desta leitura')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Versão aprofundada' }))
    expect(screen.getByText('DETALHE DA VERSÃO PUBLICADA')).toBeInTheDocument()
    expect(screen.getByText('INTERPRETAÇÃO REVISADA')).toBeInTheDocument()
    rerender(
      <ParticipantIntegrativeMapView
        responses={
          [{ free_text: 'RESPOSTA NOVA PRIVADA', experience_id: 'exp-mente-emocoes-07c' }] as any
        }
        participantName="Teste"
        currentMap={map}
      />,
    )
    expect(screen.queryByText('RESPOSTA NOVA PRIVADA')).not.toBeInTheDocument()
    expect(screen.getByText('DETALHE DA VERSÃO PUBLICADA')).toBeInTheDocument()
  })
  it('mantém publicações legadas literais sem inventar uma interpretação nova', () => {
    render(
      <ParticipantIntegrativeMapView
        responses={[]}
        participantName="Teste"
        currentMap={
          {
            status: 'published',
            items: [{ section: 'minha_natureza', position: 1, item_text: 'TEXTO LEGADO REVISADO' }],
          } as any
        }
      />,
    )
    expect(screen.getByText('TEXTO LEGADO REVISADO')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })
})
