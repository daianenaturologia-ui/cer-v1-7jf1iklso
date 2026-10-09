import { beforeEach, expect, it, vi } from 'vitest'
import {
  careEpisodeInput,
  careEpisodeReading,
  emptyCareEpisode,
  readCareEpisode,
  validateCareEpisode,
} from './careEpisode'
import { selfDevelopmentService } from './selfDevelopment'
import { lifeDirectionsService, type LifeDirection } from './lifeDirections'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
const backend = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Unexpected network call')
  }),
)
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: backend, authStore: {} } }))
const source: LifeDirection = {
  id: '',
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
}
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
  backend.mockClear()
})
it('preserva todos os detalhes, vínculo e privacidade na persistência existente', async () => {
  const direction = await lifeDirectionsService.save(source)
  const episode = {
    ...emptyCareEpisode(),
    facts: 'Recebi um pedido.',
    thought: 'Vou decepcionar.',
    emotion: 'Medo',
    body: 'Tensão',
    response: 'please' as const,
    behavior: 'Aceitei.',
    relief: 'Evitei atrito.',
    cost: 'Fiquei sobrecarregada.',
    need: 'Tempo',
    alternative: 'Pedir tempo antes de aceitar.',
    support: 'Apoio de alguém próximo.',
  }
  const saved = await selfDevelopmentService.save(careEpisodeInput(direction, episode, false))
  expect(readCareEpisode(saved)).toEqual(episode)
  demoAdapter.setActivePersona('daiane')
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toEqual([])
  demoAdapter.setActivePersona('mariana')
  await selfDevelopmentService.save({ ...saved, access_class: 'participant_shared' }, saved.id)
  demoAdapter.setActivePersona('daiane')
  expect((await selfDevelopmentService.list(DEMO_ENROLLMENT_ID))[0].direction_id).toBe(direction.id)
  expect(backend).not.toHaveBeenCalled()
})
it('não transforma lacunas em conclusões ou origens traumáticas', () => {
  expect(careEpisodeReading(emptyCareEpisode())).toContain('ainda está encontrando palavras')
  expect(careEpisodeReading({ ...emptyCareEpisode(), response: 'please' })).toContain(
    'suas necessidades ficam de fora',
  )
  expect(careEpisodeReading({ ...emptyCareEpisode(), response: 'please' })).not.toMatch(
    /infância|trauma|negligência/,
  )
})
it('recusa conteúdos inválidos e uma alternativa não escolhida', () => {
  expect(() => validateCareEpisode({ ...emptyCareEpisode(), response: 'other' })).toThrow()
  expect(() => validateCareEpisode({ ...emptyCareEpisode(), thought: 'x'.repeat(301) })).toThrow()
  expect(() => careEpisodeInput(source, { ...emptyCareEpisode(), facts: 'Cena' }, false)).toThrow(
    /Escolha um começo/,
  )
})
