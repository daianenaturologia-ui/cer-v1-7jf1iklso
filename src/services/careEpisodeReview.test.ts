import { beforeEach, expect, it, vi } from 'vitest'
import { careEpisodeInput, emptyCareEpisode } from './careEpisode'
import {
  emptyEpisodeReview,
  episodeReviewInput,
  readEpisodeReview,
  validateEpisodeReview,
} from './careEpisodeReview'
import { selfDevelopmentService } from './selfDevelopment'
import { lifeDirectionsService } from './lifeDirections'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: () => {
      throw new Error('No network in demo')
    },
    authStore: {},
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
async function setup() {
  const source = await lifeDirectionsService.save({
    enrollment_id: DEMO_ENROLLMENT_ID,
    kind: 'future',
    horizon: 'open',
    title: 'Expressar limites',
    narrative: '',
    meaning: '',
    resources: '',
    limits: '',
    first_step: '',
    access_class: 'participant_shared',
  })
  const parent = await selfDevelopmentService.save(
    careEpisodeInput(
      source,
      { ...emptyCareEpisode(), facts: 'Recebi um pedido', alternative: 'Pedir tempo' },
      true,
    ),
  )
  return { source, parent }
}
it('guarda retornos independentes e mantém a escolha original e o histórico', async () => {
  const { source, parent } = await setup()
  const value = {
    ...emptyEpisodeReview(parent.id),
    outcome: 'partial' as const,
    observation: 'Consegui pausar',
    adjustment: 'Pedir dez minutos',
    support: 'Organização',
  }
  const first = await selfDevelopmentService.save(episodeReviewInput(source, parent, value, false))
  const second = await selfDevelopmentService.save(
    episodeReviewInput(
      source,
      { ...parent, action: first.next_step },
      { ...value, observation: 'A pausa ajudou', adjustment: 'Continuar com a pausa' },
      true,
    ),
  )
  expect(readEpisodeReview(first)).toEqual(value)
  expect(second.action).toBe('Pedir dez minutos')
  expect(second.scheduled_at).toBe('')
  expect(second.context).not.toContain(parent.context)
  expect(
    (await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).find((v) => v.id === parent.id)?.action,
  ).toBe('Pedir tempo')
  demoAdapter.setActivePersona('daiane')
  expect((await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).map((v) => v.id)).toEqual([
    second.id,
    parent.id,
  ])
  demoAdapter.setActivePersona('mariana')
  await selfDevelopmentService.save({ ...first, access_class: 'participant_shared' }, first.id)
  demoAdapter.setActivePersona('daiane')
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toHaveLength(3)
})
it('recusa retorno de outra situação, matrícula ou direção e campos ausentes', async () => {
  const { source, parent } = await setup()
  const value = {
    ...emptyEpisodeReview(parent.id),
    observation: 'Ainda não consegui',
    adjustment: 'Diminuir o passo',
  }
  expect(() => episodeReviewInput(source, parent, { ...value, episodeId: 'other' }, false)).toThrow(
    /ligado/,
  )
  expect(() =>
    episodeReviewInput({ ...source, enrollment_id: 'other' }, parent, value, false),
  ).toThrow(/ligado/)
  expect(() => episodeReviewInput({ ...source, id: 'other' }, parent, value, false)).toThrow(
    /ligado/,
  )
  expect(() => episodeReviewInput(source, parent, { ...value, observation: '' }, false)).toThrow(
    /percebeu/,
  )
  expect(() => episodeReviewInput(source, parent, { ...value, adjustment: '' }, false)).toThrow(
    /seguir/,
  )
  expect(() =>
    episodeReviewInput(source, { ...parent, access_class: 'participant_private' }, value, true),
  ).toThrow(/primeiro a situação/)
  expect(() => validateEpisodeReview({ ...value, outcome: 'invalid' })).toThrow()
  expect(() => validateEpisodeReview({ ...value, observation: 'x'.repeat(301) })).toThrow()
})
