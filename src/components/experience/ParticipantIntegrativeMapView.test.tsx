// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
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
    expect(screen.queryByText('RESPOSTA DA VERSÃO PUBLICADA')).not.toBeInTheDocument()
    expect(screen.getAllByText('Como compreender esta dimensão')).toHaveLength(6)
    expect(screen.getByText('Referências e fundamentos desta leitura')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Versão detalhada' }))
    expect(screen.queryByText('DETALHE DA VERSÃO PUBLICADA')).not.toBeInTheDocument()
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
    expect(screen.queryByText('DETALHE DA VERSÃO PUBLICADA')).not.toBeInTheDocument()
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

describe('Mapa inicial automático', () => {
  it('abre duas versões sem encontro, exclui outras pessoas e não expõe leitura profissional em rascunho', async () => {
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
    expect(screen.getByRole('tab', { name: 'Versão resumida' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Versão detalhada' }))
    for (const option of options)
      expect(screen.getByText(new RegExp(option.title))).toBeInTheDocument()
    expect(screen.queryByText('NOTA PROFISSIONAL PRIVADA')).not.toBeInTheDocument()
    expect(screen.queryByText('OUTRA PESSOA')).not.toBeInTheDocument()
    expect(screen.queryByText(/compartilhado após o primeiro encontro/)).not.toBeInTheDocument()
  })
})

it('atualiza os marcos no mapa ao salvar e isola histórias ao trocar a pessoa', async () => {
  const record = {
    id: 'life',
    enrollment_id: 'enr',
    title: 'Meu nascimento',
    time_kind: 'age',
    time_value: '0',
    emotions: [],
    narrative: 'História privada minha',
    access_class: 'participant_private',
    updated: '2026-10-05',
  } as any
  const list = vi.spyOn(lifeTimelineService, 'list').mockResolvedValue([record])
  vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([])
  const view = render(
    <ParticipantIntegrativeMapView responses={[]} enrollmentId="enr" participantName="Teste" />,
  )
  expect(await screen.findByText('Meu nascimento')).toBeInTheDocument()
  list.mockResolvedValue([{ ...record, title: 'Nascimento atualizado' }])
  act(() =>
    window.dispatchEvent(
      new CustomEvent('cer-life-records-changed', { detail: { enrollmentId: 'enr' } }),
    ),
  )
  expect(await screen.findByText('Nascimento atualizado')).toBeInTheDocument()
  expect(screen.queryByText('Meu nascimento')).toBeNull()
  list.mockResolvedValue([record])
  view.rerender(
    <ParticipantIntegrativeMapView responses={[]} enrollmentId="outra" participantName="Outra" />,
  )
  expect(screen.queryByText('Nascimento atualizado')).toBeNull()
  expect(screen.queryByText('História privada minha')).toBeNull()
})
