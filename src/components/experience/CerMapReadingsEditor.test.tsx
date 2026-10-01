// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapReadingsEditor } from './CerMapReadingsEditor'
import { buildCerMapReadings } from '@/services/cerMapReadings'
afterEach(cleanup)
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
  await userEvent.click(
    screen.getByRole('button', { name: 'Salvar as duas versões como rascunho' }),
  )
  expect(save.mock.calls[0][1]).toBe(false)
  await userEvent.click(screen.getByRole('checkbox'))
  await userEvent.click(screen.getByRole('button', { name: 'Revisar e salvar as duas versões' }))
  expect(save.mock.calls[1][1]).toBe(true)
  await userEvent.type(screen.getByLabelText('Apresentação do mapa'), ' Nova frase')
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  expect(
    screen.getByRole('button', { name: 'Salvar as duas versões como rascunho' }),
  ).toBeInTheDocument()
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
  await userEvent.type(screen.getByLabelText('Como as dimensões se relacionam'), 'Texto teste')
  await userEvent.click(
    screen.getByRole('button', { name: 'Salvar as duas versões como rascunho' }),
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede')
  expect(screen.getByLabelText('Como as dimensões se relacionam')).toHaveValue('Texto teste')
})
