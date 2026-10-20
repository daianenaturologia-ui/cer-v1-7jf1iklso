import React from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CycleMandala } from './CycleMandala'
import { CyclePlannerReminder } from './CyclePlannerReminder'
import { demoAdapter, DEMO_ENROLLMENT_ID as ID } from '@/services/demoAdapter'
import {
  cycleJournalService,
  defaultCycleProfile,
  emptyCycleEntry,
  localDay,
} from '@/services/cycleJournal'
import { selfDevelopmentService } from '@/services/selfDevelopment'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: () => {
      throw Error('No backend in demo')
    },
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
const show = async (readOnly = false) => {
  const view = render(
    <MemoryRouter>
      <CycleMandala key={ID} enrollmentId={ID} readOnly={readOnly} />
    </MemoryRouter>,
  )
  fireEvent.click(await screen.findByRole('button', { name: /selecionado$/ }))
  return view
}
it('salva, reabre, mantém privacidade e só depois oferece o convite lunar', async () => {
  await cycleJournalService.saveProfile({ ...defaultCycleProfile(ID), lunar_reflections: true })
  const user = userEvent.setup()
  await show()
  await screen.findByText('Meu ciclo, meu ritmo')
  expect(
    screen.queryByText(
      'Um convite simbólico; não descreve como você deveria se sentir. Se quiser, registre em “Quero aprofundar”.',
    ),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Baixa' }))
  await user.click(screen.getByRole('button', { name: 'Tranquila' }))
  await user.click(screen.getByRole('button', { name: 'Maior' }))
  fireEvent.change(screen.getByLabelText(/Um cuidado que escolho para mim/), {
    target: { value: 'Reservar uma pausa' },
  })
  await user.click(screen.getByRole('button', { name: 'Salvar e continuar depois' }))
  await screen.findByText('Registro salvo. Só você pode vê-lo.')
  cleanup()
  await show()
  await screen.findByText('Meu ciclo, meu ritmo')
  expect(screen.getByRole('button', { name: 'Baixa' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByLabelText(/Um cuidado que escolho para mim/)).toHaveValue('Reservar uma pausa')
  await user.click(screen.getByRole('button', { name: 'Adicionar ao meu plano' }))
  await screen.findByText('Cuidado adicionado ao seu plano. Você pode agendá-lo depois.')
  const all = await selfDevelopmentService.list(ID)
  expect(all.find((v) => v.action === 'Reservar uma pausa')?.access_class).toBe(
    'participant_private',
  )
  demoAdapter.enableDemo('daiane')
  cleanup()
  await show(true)
  await screen.findByText('Ritmo compartilhado')
  expect(screen.queryByText('Reservar uma pausa')).not.toBeInTheDocument()
})
it('registra o início da menstruação com fluxo explícito', async () => {
  const user = userEvent.setup()
  await show()
  await screen.findByText('Meu ciclo, meu ritmo')
  await user.click(screen.getByRole('button', { name: 'Leve' }))
  await user.click(screen.getByLabelText('Este foi o primeiro dia da menstruação'))
  await user.click(screen.getByRole('button', { name: 'Salvar meu registro' }))
  await screen.findByText('Registro salvo. Só você pode vê-lo.')
  expect((await cycleJournalService.list(ID))[0].period_start).toBe(true)
})
it('profissional vê o compartilhado, sem preferências privadas ou ações de escrita', async () => {
  await cycleJournalService.save({
    ...emptyCycleEntry(ID),
    energy: 2,
    reflection: 'Compartilhado de propósito',
    access_class: 'participant_shared',
  })
  demoAdapter.enableDemo('daiane')
  await show(true)
  await screen.findByText('Ritmo compartilhado')
  expect(screen.getByText('Compartilhado de propósito')).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Salvar meu registro' })).not.toBeInTheDocument()
  expect(screen.queryByText('Meu momento de vida')).not.toBeInTheDocument()
})
it('lembrete do Planner depende de escolha explícita e usa observação atual', async () => {
  const { unmount } = render(
    <MemoryRouter>
      <CyclePlannerReminder enrollmentId={ID} />
    </MemoryRouter>,
  )
  expect(screen.queryByText(/Como estão seu corpo/)).not.toBeInTheDocument()
  unmount()
  await cycleJournalService.saveProfile({ ...defaultCycleProfile(ID), planner_reminders: true })
  await cycleJournalService.save({
    ...emptyCycleEntry(ID, localDay()),
    period_start: true,
    bleeding: 'Moderado',
  })
  // No phase is assigned when the context is unknown; only natural context permits a menstrual phase label.
  render(
    <MemoryRouter>
      <CyclePlannerReminder enrollmentId={ID} />
    </MemoryRouter>,
  )
  await screen.findByText(/Você registrou menstruação hoje/)
})
it('falha ao salvar preserva o preenchimento e permite tentar de novo', async () => {
  const user = userEvent.setup()
  await show()
  await screen.findByText('Meu ciclo, meu ritmo')
  const spy = vi
    .spyOn(cycleJournalService, 'save')
    .mockRejectedValueOnce(new Error('Não foi possível salvar agora.'))
  await user.click(screen.getByRole('button', { name: 'Baixa' }))
  await user.click(screen.getByRole('button', { name: 'Salvar meu registro' }))
  await screen.findByText('Não foi possível salvar agora.')
  expect(screen.getByRole('button', { name: 'Baixa' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Salvar meu registro' })).toBeEnabled()
  await user.click(screen.getByRole('button', { name: 'Salvar meu registro' }))
  await screen.findByText('Registro salvo. Só você pode vê-lo.')
  spy.mockRestore()
})

it('pétala abre diretamente o dia para editar pensamentos, acontecimentos e sinais percebidos', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <CycleMandala enrollmentId={ID} />
    </MemoryRouter>,
  )
  const petal = await screen.findByRole('button', { name: /selecionado$/ })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Dia do registro')).not.toBeInTheDocument()
  await user.click(petal)
  expect(await screen.findByRole('dialog')).toBeVisible()
  fireEvent.change(screen.getByLabelText(/Que pensamentos estiveram presentes/), {
    target: { value: 'Pensei em pedir ajuda' },
  })
  fireEvent.change(screen.getByLabelText(/Um acontecimento que pode ter influenciado/), {
    target: { value: 'Um dia diferente' },
  })
  await user.click(screen.getByRole('button', { name: 'TPM percebida' }))
  await user.click(screen.getByRole('button', { name: 'Salvar meu registro' }))
  await screen.findByText('Registro salvo. Só você pode vê-lo.')
  const record = (await cycleJournalService.list(ID))[0]
  expect(record.thoughts).toBe('Pensei em pedir ajuda')
  expect(record.context_note).toBe('Um dia diferente')
  expect(record.cycle_signs).toEqual(['TPM percebida'])
  cleanup()
  await show()
  expect(screen.getByLabelText(/Que pensamentos estiveram presentes/)).toHaveValue(
    'Pensei em pedir ajuda',
  )
  expect(screen.getByRole('button', { name: 'TPM percebida' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
