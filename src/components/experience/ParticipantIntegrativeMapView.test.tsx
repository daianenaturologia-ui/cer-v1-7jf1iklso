// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BUILD_07C_MENTE_PROMPTS, BUILD_07C_REGULACAO_PROMPTS } from '@/services/build07cPrompts'
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

function liveResponse(key: string, value: string[], overrides = {}) {
  const prompt = [...BUILD_07C_MENTE_PROMPTS, ...BUILD_07C_REGULACAO_PROMPTS].find(
    (p) => (p.schema_config as any).prompt_key === key,
  )!
  return {
    id: key,
    enrollment_id: 'enr',
    experience_id: prompt.experience_id,
    prompt_id: prompt.id,
    access_class: 'participant_shared',
    status: 'saved',
    created: '2026-10-01',
    updated: '2026-10-02',
    structured_value: { value },
    ...overrides,
  } as any
}
it('mantém a síntese visível no mapa publicado e a atualiza sem reescrever a publicação', async () => {
  vi.spyOn(lifeTimelineService, 'list').mockResolvedValue([])
  vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([])
  const document = snapshot()
  document.integration = 'Texto aprovado na sessão'
  const before = JSON.stringify(document)
  const map = { status: 'published', reading_snapshot: document, items: [] } as any
  const responses = [
    liveResponse('emocoes_recorrentes', ['medo']),
    liveResponse('resposta_tendencia', ['resolver_imediatamente']),
  ]
  const view = render(
    <ParticipantIntegrativeMapView
      enrollmentId="enr"
      responses={responses}
      participantName="Lia"
      currentMap={map}
    />,
  )
  const integrated = screen.getByRole('region', { name: 'Sua leitura integrada' })
  expect(within(integrated).getByText(/busca de segurança se transforma em ação/)).toBeVisible()
  await userEvent.click(within(integrated).getByText('Aprofundar minha leitura integrada'))
  expect(within(integrated).getByText('Quando proteger vira urgência')).toBeVisible()
  view.rerender(
    <ParticipantIntegrativeMapView
      enrollmentId="enr"
      responses={[responses[0], liveResponse('resposta_tendencia', ['afastar_recolher'])]}
      participantName="Lia"
      currentMap={map}
    />,
  )
  expect(
    within(integrated).queryByText(/busca de segurança se transforma em ação/),
  ).not.toBeInTheDocument()
  expect(within(integrated).getByText(/recuperar segurança passa pelo recolhimento/)).toBeVisible()
  expect(JSON.stringify(document)).toBe(before)
})
it('incorpora, corrige e retira conexões com a história ao receber mudanças salvas', async () => {
  const record = {
    id: 'life',
    enrollment_id: 'enr',
    title: 'Marco fictício',
    time_kind: 'year',
    time_value: '2020',
    emotions: ['Medo'],
    narrative: 'Relato',
    access_class: 'participant_private',
    updated: '2026-10-03',
  } as any
  const list = vi.spyOn(lifeTimelineService, 'list').mockResolvedValue([record])
  vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([])
  render(
    <ParticipantIntegrativeMapView
      enrollmentId="enr"
      responses={[liveResponse('emocoes_recorrentes', ['medo'])]}
      participantName="Lia"
    />,
  )
  const integrated = screen.getByRole('region', { name: 'Sua leitura integrada' })
  await userEvent.click(await within(integrated).findByText('Aprofundar minha leitura integrada'))
  expect(await within(integrated).findByText('Sua história e seu momento atual')).toBeVisible()
  list.mockResolvedValue([{ ...record, emotions: ['Alegria'] }])
  act(() =>
    window.dispatchEvent(
      new CustomEvent('cer-life-records-changed', { detail: { enrollmentId: 'enr' } }),
    ),
  )
  expect(await within(integrated).findByText('Sua história acrescenta contexto')).toBeVisible()
  expect(within(integrated).queryByText('Sua história e seu momento atual')).not.toBeInTheDocument()
  list.mockResolvedValue([])
  act(() =>
    window.dispatchEvent(
      new CustomEvent('cer-life-records-changed', { detail: { enrollmentId: 'enr' } }),
    ),
  )
  expect(
    await within(integrated).findByText(/Sua Linha da Vida ainda não acrescentou marcos/),
  ).toBeVisible()
  expect(within(integrated).queryByText('Sua história acrescenta contexto')).not.toBeInTheDocument()
})
it('não inclui história particular na síntese nem na trilha profissional', async () => {
  vi.spyOn(lifeTimelineService, 'list').mockResolvedValue([
    {
      id: 'private',
      enrollment_id: 'enr',
      title: 'TÍTULO PARTICULAR',
      time_kind: 'unknown',
      time_value: '',
      emotions: ['Medo'],
      narrative: 'PRIVADO',
      access_class: 'participant_private',
    } as any,
  ])
  vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([])
  render(
    <ParticipantIntegrativeMapView
      audience="professional"
      enrollmentId="enr"
      responses={[liveResponse('emocoes_recorrentes', ['medo'])]}
      participantName="Lia"
    />,
  )
  expect(await screen.findByText(/Sua Linha da Vida ainda não acrescentou marcos/)).toBeVisible()
  expect(screen.queryByText('TÍTULO PARTICULAR')).not.toBeInTheDocument()
  expect(screen.queryByText('Sua história e seu momento atual')).not.toBeInTheDocument()
})
