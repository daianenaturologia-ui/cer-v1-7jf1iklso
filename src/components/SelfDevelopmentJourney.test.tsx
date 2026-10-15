import { sharedPlanCareResource, clinicalCarePrioritySource } from '@/services/carePlanFlow'
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SelfDevelopmentJourney } from './SelfDevelopmentJourney'
import { demoAdapter, DEMO_ENROLLMENT_ID } from '@/services/demoAdapter'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import { careEpisodeInput, emptyCareEpisode } from '@/services/careEpisode'
import { episodeReviewInput, emptyEpisodeReview } from '@/services/careEpisodeReview'
import { lifeDirectionsService } from '@/services/lifeDirections'
import { WeeklyAgenda } from './WeeklyAgenda'
import { localDateInput, mondayOf } from '@/services/weeklyAgenda'
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
afterEach(cleanup)
it('o horário digitado ao planejar permanece na agenda após reabrir', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Escolher meu primeiro recurso' }))
  await user.click(screen.getAllByRole('button', { name: 'Quero experimentar' })[0])
  await user.type(screen.getByLabelText('Que vida quero cultivar?'), 'Ter espaço para descansar')
  await user.type(screen.getByLabelText('Meu pequeno passo'), 'Encerrar o expediente')
  await user.type(
    screen.getByLabelText('Quando isso cabe na minha vida?'),
    'Segunda ao fim do trabalho',
  )
  await user.click(screen.getByText('Personalizar · horário, alternativa e sinais'))
  const moment = mondayOf(new Date())
  moment.setHours(17, 15)
  fireEvent.input(screen.getByLabelText('Reservar data e horário (opcional)'), {
    target: { value: localDateInput(moment) },
  })
  await user.click(screen.getByRole('button', { name: 'Salvar meu passo' }))
  await screen.findByText('Encerrar o expediente')
  const [saved] = await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)
  expect(saved.scheduled_at).toBe(moment.toISOString())
  cleanup()
  render(
    <MemoryRouter>
      <WeeklyAgenda enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('button', { name: 'Encerrar o expediente, 17:15' })).toBeVisible()
  expect(screen.getByRole('tab', { name: 'Sem horário' })).toBeVisible()
})
it('uma situação explorada não vira tarefa no Planner nem exibe metadados do exercício', async () => {
  const source = await lifeDirectionsService.save({
    enrollment_id: DEMO_ENROLLMENT_ID,
    kind: 'future',
    horizon: 'open',
    title: 'Minha direção',
    narrative: '',
    meaning: '',
    resources: '',
    limits: '',
    first_step: '',
    access_class: 'participant_private',
  })
  const episode = await selfDevelopmentService.save(
    careEpisodeInput(
      source,
      {
        ...emptyCareEpisode(),
        facts: 'Minha cena privada',
        alternative: 'Alternativa ainda não agendada',
      },
      false,
    ),
  )
  await selfDevelopmentService.save(
    episodeReviewInput(
      source,
      episode,
      {
        ...emptyEpisodeReview(episode.id),
        observation: 'Aprendizado privado',
        adjustment: 'Ajuste ainda não agendado',
      },
      false,
    ),
  )
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} mode="play" />
    </MemoryRouter>,
  )
  await waitFor(() => expect(screen.queryByText('Carregando seus passos…')).toBeNull())
  expect(screen.queryByText('Alternativa ainda não agendada')).toBeNull()
  expect(screen.queryByText(/"version":1/)).toBeNull()
  expect(screen.queryByText('Aprendizado privado')).toBeNull()
  expect(screen.queryByText('Ajuste ainda não agendado')).toBeNull()
})
it('a pessoa escolhe recurso, planeja no seu ritmo, executa no Planner e revisa sem intervenção profissional', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Escolher meu primeiro recurso' }))
  await user.click(screen.getAllByRole('button', { name: 'Quero experimentar' })[0])
  await user.type(screen.getByLabelText('Que vida quero cultivar?'), 'Ter tempo livre')
  await user.type(screen.getByLabelText('Meu pequeno passo'), 'Observar minha concentração')
  await user.type(
    screen.getByLabelText('Quando isso cabe na minha vida?'),
    'Depois do almoço de terça',
  )
  await user.click(screen.getByRole('button', { name: 'Salvar meu passo' }))
  await screen.findByText('Observar minha concentração')
  cleanup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} mode="play" />
    </MemoryRouter>,
  )
  await user.click(await screen.findByText('Mais opções'))
  await user.click(screen.getByRole('button', { name: 'Experimentei' }))
  await screen.findByText(/tentativa\(s\) pronta/)
  cleanup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('tab', { name: /Aprendizados/ }))
  await user.click(screen.getByRole('button', { name: 'Revisar o que aprendi' }))
  await user.type(
    screen.getByLabelText('O que percebi e aprendi?'),
    'Depois do almoço preciso reduzir o bloco',
  )
  await user.click(screen.getByRole('button', { name: 'Guardar meu aprendizado' }))
  await screen.findByText('Aprendizado registrado · Só meu')
  expect((await selfDevelopmentService.list(DEMO_ENROLLMENT_ID))[0].status).toBe('reviewed')
})
it('visão profissional não mostra privados nem oferece ações de autoria da pessoa', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Escolher meu primeiro recurso' }))
  await user.click(screen.getAllByRole('button', { name: 'Quero experimentar' })[0])
  await user.type(screen.getByLabelText('Que vida quero cultivar?'), 'Um desejo privado')
  await user.type(screen.getByLabelText('Meu pequeno passo'), 'Uma ação privada')
  await user.type(screen.getByLabelText('Quando isso cabe na minha vida?'), 'Na terça')
  await user.click(screen.getByRole('button', { name: 'Salvar meu passo' }))
  await screen.findByText('Uma ação privada')
  cleanup()
  demoAdapter.setActivePersona('daiane')
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} readOnly />
    </MemoryRouter>,
  )
  await screen.findByText('Nenhum passo educativo foi compartilhado ainda.')
  expect(screen.queryByText('Uma ação privada')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Começar' })).toBeNull()
})
it('registra um cuidado existente, preserva a privacidade e o mesmo horário no Planner', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} carePlan />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Adicionar cuidado que já faço' }))
  await user.selectOptions(screen.getByLabelText('Categoria do cuidado'), 'Atividades físicas')
  await user.type(screen.getByLabelText('O que esse cuidado significa para mim?'), 'Ter disposição')
  await user.type(screen.getByLabelText('Meu cuidado na prática'), 'Minha caminhada habitual')
  await user.type(screen.getByLabelText('Quando isso cabe na minha vida?'), 'Depois do café')
  await user.click(screen.getByText('Personalizar · horário, alternativa e sinais'))
  const moment = mondayOf(new Date())
  moment.setHours(8, 30)
  fireEvent.input(screen.getByLabelText('Reservar data e horário (opcional)'), {
    target: { value: localDateInput(moment) },
  })
  await user.click(screen.getByRole('button', { name: 'Salvar no meu plano de cuidado' }))
  await screen.findByText('Minha caminhada habitual')
  let [record] = await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)
  expect(record.resource_snapshot.care_plan).toEqual({
    category: 'Atividades físicas',
    origin: 'existing_routine',
  })
  expect(record.access_class).toBe('participant_private')
  demoAdapter.setActivePersona('daiane')
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toEqual([])
  demoAdapter.setActivePersona('mariana')
  record = await selfDevelopmentService.save(
    { ...record, access_class: 'participant_shared' },
    record.id,
  )
  cleanup()
  const prepare = vi.fn()
  demoAdapter.setActivePersona('daiane')
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney
        enrollmentId={DEMO_ENROLLMENT_ID}
        carePlan
        readOnly
        onPrepareCare={prepare}
      />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Revisar este cuidado para o plano' }))
  expect(prepare).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'Minha caminhada habitual',
      source: expect.stringContaining(record.id),
    }),
  )
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toHaveLength(1)
  cleanup()
  demoAdapter.setActivePersona('mariana')
  render(
    <MemoryRouter>
      <WeeklyAgenda enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  expect(
    await screen.findByRole('button', { name: 'Minha caminhada habitual, 08:30' }),
  ).toBeVisible()
})
it('a escolha na biblioteca mantém o conteúdo de origem e só salva após a pessoa planejar', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} carePlan />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Escolher na Biblioteca CER' }))
  await user.click(screen.getAllByRole('button', { name: 'Adicionar ao meu plano' })[0])
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toEqual([])
  expect(screen.getByText('Recurso de origem')).toBeVisible()
  await user.type(
    screen.getByLabelText('O que esse cuidado significa para mim?'),
    'Respeitar meu ritmo',
  )
  await user.type(screen.getByLabelText('Meu cuidado na prática'), 'Observar uma atividade')
  await user.type(screen.getByLabelText('Quando isso cabe na minha vida?'), 'No almoço')
  await user.click(screen.getByRole('button', { name: 'Salvar no meu plano de cuidado' }))
  await screen.findByText('Observar uma atividade')
  const [saved] = await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)
  expect(saved.resource_snapshot.care_plan?.origin).toBe('library')
  expect(saved.resource_snapshot.instructions.length).toBeGreaterThan(0)
  expect(saved.scheduled_at).toBe('')
})

it('organiza o plano profissional sem cortar o convite e sem criar ação automaticamente', async () => {
  const invitation = 'Cuidado combinado. '.repeat(100)
  const resource = sharedPlanCareResource({
    id: 'presentation-1',
    participant_title: 'Descanso',
    participant_summary: 'Resumo compartilhado',
    practical_invitation: invitation,
  })
  expect(resource.instructions.join('')).toBe(invitation)
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney
        enrollmentId={DEMO_ENROLLMENT_ID}
        carePlan
        initialCareResource={resource}
      />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('dialog', { name: 'Descanso' })).toBeVisible()
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toEqual([])
  expect(resource.care_plan?.origin).toBe('professional_plan')
})

it('leva a versão clínica ao rascunho preservando instruções, limites e origem', () => {
  const source = clinicalCarePrioritySource(
    { id: 'practice-1', participant_facing_name_base: 'Prática de teste' } as any,
    {
      id: 'version-2',
      version_number: 2,
      participant_title: 'Título de teste',
      participant_summary: 'Resumo de teste',
      instructions: 'Instrução de teste',
      stop_conditions: 'Condição de interrupção de teste',
      guidance_requirements: 'Acompanhamento de teste',
      duration: 'Duração de teste',
    } as any,
  )
  expect(source.description).toContain('Quando interromper: Condição de interrupção de teste')
  expect(source.description).toContain('Acompanhamento necessário: Acompanhamento de teste')
  expect(source.description).toContain('Como realizar: Instrução de teste')
  expect(source.source).toContain('versão version-2 (v2)')
})
