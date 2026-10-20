import React, { useState } from 'react'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LifeIntegrationGame } from './experience/LifeIntegrationGame'
import { MyNextStepWizard } from './experience/MyNextStepWizard'
import { CerPracticeLibrary } from './CerPracticeLibrary'
import { PersonalPracticeLibrary } from './PersonalPracticeLibrary'
import { IntegrativeCareComposer } from './IntegrativeCareComposer'
import { LifeGoalImport } from './LifeGoalImport'
import { PrintablePlannerWeek } from './PrintablePlannerWeek'
import { emptyPlanDocument } from '@/services/developmentPlanDocument'
import type { LifeDirectionInput } from '@/services/lifeDirections'
import { lifeDirectionsService } from '@/services/lifeDirections'
import { demoAdapter, DEMO_ENROLLMENT_ID as ID } from '@/services/demoAdapter'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    authStore: { record: { id: 'demo-owner' } },
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
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
it('jogo permite passar, voltar e salvar uma reflexão privada apenas por escolha explícita', async () => {
  const save = vi.spyOn(lifeDirectionsService, 'save')
  render(<LifeIntegrationGame enrollmentId={ID} />)
  expect(save).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: /Dar lugar a uma perda/ }))
  fireEvent.change(screen.getByLabelText(/Um vínculo ou situação/), {
    target: { value: 'Uma despedida' },
  })
  fireEvent.click(screen.getByText('Levar minhas escolhas adiante'))
  fireEvent.click(screen.getByText('Passar por enquanto'))
  fireEvent.click(screen.getByRole('button', { name: /Realizar com mais leveza/ }))
  fireEvent.click(screen.getByText('Levar minhas escolhas adiante'))
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  fireEvent.click(screen.getByText('Guardar esta reflexão no meu presente'))
  await screen.findByText(/Reflexão salva/)
  const values = await lifeDirectionsService.list(ID)
  expect(values[0].access_class).toBe('participant_private')
  expect(values[0].narrative).toContain('Uma despedida')
  expect(values[0].narrative).toContain('Ainda em descoberta')
})
it('impede avançar sem o nome da meta e não substitui o campo vazio por conteúdo fictício', () => {
  const save = vi.fn()
  function Form() {
    const [value, setValue] = useState<LifeDirectionInput>({
      enrollment_id: ID,
      kind: 'future' as const,
      horizon: 'open' as const,
      title: '',
      narrative: 'Meu contexto',
      meaning: '',
      resources: '',
      limits: '',
      first_step: '',
      access_class: 'participant_private' as const,
    })
    return (
      <MyNextStepWizard
        value={value}
        busy={false}
        strategies={[]}
        onChange={setValue}
        onSave={save}
        onPause={() => {}}
      />
    )
  }
  render(<Form />)
  fireEvent.click(screen.getByText('Continuar'))
  fireEvent.click(screen.getByText('Continuar'))
  expect(screen.getByText(/Dê um nome à sua meta/)).toBeVisible()
  expect(save).not.toHaveBeenCalled()
  expect(screen.queryByText('Salvar como meta principal')).toBeNull()
})
it('Biblioteca abre materiais por área sem exigir plano ativo e só envia por escolha', async () => {
  const add = vi.fn()
  render(<CerPracticeLibrary onAddToPlan={add} />)
  expect(
    (await screen.findAllByRole('button', { name: 'Acrescentar ao plano de cuidado' })).length,
  ).toBeGreaterThan(0)
  expect(screen.getByText('Da consciência à experiência')).toBeVisible()
  fireEvent.click(screen.getByRole('tab', { name: 'Sono e descanso' }))
  expect(screen.getByRole('tab', { name: 'Sono e descanso' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Explorar tudo' }))
  expect(add).not.toHaveBeenCalled()
  fireEvent.click(screen.getAllByRole('button', { name: 'Acrescentar ao plano de cuidado' })[0])
  expect(add).toHaveBeenCalledTimes(1)
})
it('práticas pessoais podem ser escolhidas e personalizadas sem editar o plano profissional', async () => {
  render(
    <MemoryRouter>
      <PersonalPracticeLibrary enrollmentId={ID} />
    </MemoryRouter>,
  )
  const choices = await screen.findAllByRole('button', { name: 'Quero experimentar esta prática' })
  fireEvent.click(choices[0])
  expect(await screen.findByRole('dialog')).toBeVisible()
  expect(screen.queryByText('Minhas anotações profissionais · privadas')).toBeNull()
})
it('orientações individuais ficam em campos próprios sem prescrição preenchida automaticamente', () => {
  function Form() {
    const [doc, setDoc] = useState(emptyPlanDocument())
    return (
      <IntegrativeCareComposer
        document={doc}
        onChange={setDoc}
        resources={[]}
        onLoadResources={() => {}}
      />
    )
  }
  render(<Form />)
  fireEvent.click(screen.getByRole('button', { name: 'Fitoterapia' }))
  expect(screen.getByLabelText(/Orientação individual/)).toHaveValue('')
  fireEvent.change(screen.getByLabelText(/Orientação individual/), {
    target: { value: 'Orientação preparada pela profissional' },
  })
  expect(screen.getByLabelText(/Orientação individual/)).toHaveValue(
    'Orientação preparada pela profissional',
  )
})
it('importação mostra somente metas futuras compartilhadas da matrícula atual', async () => {
  const choose = vi.fn()
  vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([
    {
      id: 'one',
      enrollment_id: ID,
      kind: 'future',
      access_class: 'participant_shared',
      title: 'Meta compartilhada',
    },
    {
      id: 'two',
      enrollment_id: ID,
      kind: 'future',
      access_class: 'participant_private',
      title: 'Meta privada',
    },
    {
      id: 'three',
      enrollment_id: 'other',
      kind: 'future',
      access_class: 'participant_shared',
      title: 'Outra pessoa',
    },
  ] as any)
  render(<LifeGoalImport enrollmentId={ID} onChoose={choose} />)
  fireEvent.click(screen.getByText('Trazer meta da Linha da Vida'))
  await screen.findByText('Meta compartilhada')
  expect(screen.queryByText('Meta privada')).toBeNull()
  expect(screen.queryByText('Outra pessoa')).toBeNull()
  fireEvent.click(screen.getByText('Usar esta meta no plano'))
  expect(choose).toHaveBeenCalledTimes(1)
})
it('painel de impressão inclui horários e títulos da semana e não inclui campos clínicos ou outras semanas', () => {
  const days = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 18 + i))
  render(
    <PrintablePlannerWeek
      days={days}
      events={
        [
          {
            id: 'one',
            title: 'Minha prática',
            start: new Date(2026, 9, 19, 9).toISOString(),
            kind: 'development',
            private_notes: 'SEGREDO',
          },
          {
            id: 'old',
            title: 'Outra semana',
            start: new Date(2026, 8, 19, 9).toISOString(),
            kind: 'development',
          },
        ] as any
      }
    />,
  )
  const text = screen.getByLabelText('Painel semanal para impressão').textContent
  expect(text).toContain('Minha prática')
  expect(text).toContain('09:00')
  expect(text).not.toMatch(/SEGREDO|Outra semana/)
})
