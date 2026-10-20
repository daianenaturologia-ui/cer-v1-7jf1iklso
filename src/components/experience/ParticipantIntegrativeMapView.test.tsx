// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BUILD_07C_REGULACAO_PROMPTS } from '@/services/build07cPrompts'
import { ParticipantIntegrativeMapView } from './ParticipantIntegrativeMapView'
import { buildCerMapReadings, CER_READING_DIMENSIONS } from '@/services/cerMapReadings'

import { lifeTimelineService } from '@/services/lifeTimeline'
import { lifeDirectionsService } from '@/services/lifeDirections'
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
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
  it('exibe exatamente o snapshot publicado e aprofunda explicações e referências no diálogo ao clicar', async () => {
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
    expect(screen.queryByText('RESPOSTA DA VERSÃO PUBLICADA')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Interpretação dessa dimensão: Mente e Emoções' }),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Interpretação dessa dimensão: Mente e Emoções' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Respostas e registros deste mapa' }))
    expect(await screen.findByText('DETALHE DA VERSÃO PUBLICADA')).toBeInTheDocument()
    expect(screen.getByText('INTERPRETAÇÃO REVISADA')).toBeInTheDocument()
    expect(screen.getByText('Referências e fontes de consulta')).toBeInTheDocument()
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
  })
  it('mantém publicações legadas literais sem inventar uma interpretação nova', async () => {
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
    await userEvent.click(
      screen.getByRole('button', { name: 'Interpretação dessa dimensão: Corpo' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Respostas e registros deste mapa' }))
    expect(screen.getByText('TEXTO LEGADO REVISADO')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })
})

describe('Mapa inicial automático', () => {
  it('abre leitura interativa sem abas, exclui outras pessoas e não expõe leitura profissional em rascunho', async () => {
    const prompt = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => (p.schema_config as any).prompt_key === 'resposta_tendencia',
    )!
    const options = (prompt.schema_config as any).options.slice(0, 2)
    const response = {
      id: 'mine',
      enrollment_id: 'enr',
      experience_id: prompt.experience_id,
      prompt_id: prompt.id,
      access_class: 'shared_care',
      status: 'saved',
      created: '2026-10-05',
      updated: '2026-10-05',
      structured_value: { value: options.map((o: any) => o.id) },
    }
    const draft = snapshot()
    draft.integration = 'NOTA PROFISSIONAL PRIVADA'
    render(
      <ParticipantIntegrativeMapView
        enrollmentId="enr"
        participantName="Teste"
        responses={
          [
            response,
            { ...response, id: 'other', enrollment_id: 'other', free_text: 'OUTRA PESSOA' },
          ] as any
        }
        currentMap={{ status: 'draft', reading_snapshot: draft, items: [] } as any}
      />,
    )
    expect(screen.getByTestId('participant-initial-map')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Interpretação dessa dimensão: Regulação' }),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Interpretação dessa dimensão: Regulação' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Respostas e registros deste mapa' }))
    for (const option of options)
      expect(await screen.findByText(new RegExp(option.title))).toBeInTheDocument()
    expect(screen.queryByText('NOTA PROFISSIONAL PRIVADA')).not.toBeInTheDocument()
    expect(screen.queryByText('OUTRA PESSOA')).not.toBeInTheDocument()
    expect(screen.queryByText(/compartilhado após o primeiro encontro/)).not.toBeInTheDocument()
  })
})

it.each(['participant', 'professional'] as const)(
  'não carrega nem mostra histórias na visão %s do mapa publicado',
  async (audience) => {
    const list = vi.spyOn(lifeTimelineService, 'list')
    const directions = vi.spyOn(lifeDirectionsService, 'list')
    const document = snapshot()
    document.history = 'HISTÓRIA ANTIGA'
    document.lifeEvents = [
      {
        id: 'e',
        enrollment_id: 'enr',
        title: 'MARCO PARTICULAR',
        time_kind: 'unknown',
        time_value: '',
        emotions: [],
        narrative: 'RELATO',
        updated: '2026-10-20',
        access_class: 'participant_shared',
      },
    ]
    document.integration = 'INTEGRAÇÃO DAS DIMENSÕES REVISADA'
    const before = JSON.stringify(document)
    render(
      <ParticipantIntegrativeMapView
        enrollmentId="enr"
        participantName="Teste"
        responses={[]}
        audience={audience}
        currentMap={{ status: 'published', reading_snapshot: document, items: [] } as any}
      />,
    )
    expect(list).not.toHaveBeenCalled()
    expect(directions).not.toHaveBeenCalled()
    expect(screen.queryByText('Sua leitura integrada')).toBeNull()
    expect(screen.queryByText('Minha história em movimento')).toBeNull()
    expect(screen.queryByText('MARCO PARTICULAR')).toBeNull()
    expect(screen.queryByRole('button', { name: /histórico e conexões/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Centro integrador: seis dimensões/ }))
    expect(screen.getByText('INTEGRAÇÃO DAS DIMENSÕES REVISADA')).toBeInTheDocument()
    expect(screen.queryByText('HISTÓRIA ANTIGA')).toBeNull()
    expect(JSON.stringify(document)).toBe(before)
  },
)
