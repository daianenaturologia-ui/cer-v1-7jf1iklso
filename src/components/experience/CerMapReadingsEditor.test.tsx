// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapReadingsEditor } from './CerMapReadingsEditor'
import { buildCerMapReadings } from '@/services/cerMapReadings'
import { BUILD_07E_SEXUALIDADE_PROMPTS } from '@/services/build07ePrompts'
vi.mock('@/services/lifeTimeline', () => ({
  lifeTimelineService: { list: vi.fn(async () => []) },
  sharedLifeEvents: (x: any) => x,
  lifeTimeLabel: () => '',
}))
vi.mock('@/services/lifeDirections', () => ({
  lifeDirectionsService: { list: vi.fn(async () => []) },
  sharedLifeDirections: (x: any) => x,
}))
afterEach(cleanup)
it('refreshes an empty session draft and preserves professional wording in the interactive preview', async () => {
  const p = BUILD_07E_SEXUALIDADE_PROMPTS.find(
    (p) => (p.schema_config as any).prompt_key === 'comunicacao_desconforto_cena',
  )!
  const save = vi.fn(async (_snapshot: any, _reviewed: boolean) => {})
  const responses = [
    {
      id: 'r',
      enrollment_id: 'enr',
      experience_id: p.experience_id,
      prompt_id: p.id,
      structured_value: { value: 'percebo_mas_hesito' },
      status: 'saved',
      access_class: 'participant_shared',
      created: '2026-10-12',
      updated: '2026-10-12',
    },
  ] as any
  const initial = buildCerMapReadings([], 'enr', 'Teste')
  initial.sessionUpdates = [
    {
      sessionId: 's',
      sessionDate: '2026-10-12',
      summary: 'Síntese do encontro',
      preparedBy: 'prof',
      preparedAt: '2026-10-12',
    },
  ]
  render(
    <CerMapReadingsEditor
      initial={initial}
      responses={responses}
      enrollmentId="enr"
      participantName="Teste"
      onDirty={vi.fn()}
      onSave={save}
    />,
  )
  await userEvent.click(
    screen.getByRole('button', { name: 'Atualizar respostas e histórias do rascunho' }),
  )
  await userEvent.click(screen.getByText('Revisar Sexualidade & Intimidade'))
  const field = screen.getAllByLabelText('Interpretação e contexto · leitura aprofundada')[4]
  expect((field as HTMLTextAreaElement).value).toContain('Você percebe o desconforto')
  await userEvent.clear(field)
  await userEvent.type(field, 'Leitura revisada: percebe o limite e quer praticar a comunicação.')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar como rascunho' }))
  expect(save.mock.calls[0][0].sessionUpdates[0].summary).toBe('Síntese do encontro')
  expect(save.mock.calls[0][0].dimensions[4].personalSections[0].text).toContain('Leitura revisada')
  await userEvent.click(screen.getByRole('button', { name: 'Conferir prévia do mapa' }))
  await userEvent.click(
    screen.getByRole('button', { name: 'Interpretação dessa dimensão: Sexualidade & Intimidade' }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Como você funciona nesta dimensão' }))
  expect(
    await within(screen.getByRole('dialog')).findByText(
      'Leitura revisada: percebe o limite e quer praticar a comunicação.',
    ),
  ).toBeInTheDocument()
})
it('exige revisão explícita e retira a marca após nova edição', async () => {
  const save = vi.fn(async (_snapshot: unknown, _reviewed: boolean) => {})
  render(
    <CerMapReadingsEditor
      initial={buildCerMapReadings([], 'enr', 'Teste')}
      responses={[]}
      enrollmentId="enr"
      participantName="Teste"
      onDirty={vi.fn()}
      onSave={save}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Salvar como rascunho' }))
  expect(save.mock.calls[0][1]).toBe(false)
  await userEvent.click(screen.getByRole('checkbox'))
  await userEvent.click(screen.getByRole('button', { name: 'Revisar e salvar o Mapa CER' }))
  expect(save.mock.calls[1][1]).toBe(true)
  await userEvent.type(screen.getByLabelText('Apresentação do mapa'), ' Nova frase')
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  expect(screen.getByRole('button', { name: 'Salvar como rascunho' })).toBeInTheDocument()
})
it('mantém edições quando falha ao salvar e informa a tentativa necessária', async () => {
  render(
    <CerMapReadingsEditor
      initial={buildCerMapReadings([], 'enr', 'Teste')}
      responses={[]}
      enrollmentId="enr"
      participantName="Teste"
      onDirty={vi.fn()}
      onSave={async () => {
        throw new Error('Falha de rede')
      }}
    />,
  )
  await userEvent.type(screen.getByLabelText('Apresentação do mapa'), 'Texto teste')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar como rascunho' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede')
  expect(screen.getByLabelText('Apresentação do mapa')).toHaveValue(
    buildCerMapReadings([], 'enr', 'Teste').overview + 'Texto teste',
  )
})
