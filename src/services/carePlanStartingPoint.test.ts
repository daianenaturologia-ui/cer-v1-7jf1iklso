import { expect, it } from 'vitest'
import { carePlanChoices, directionCareContext } from './carePlanStartingPoint'
import { careEpisodeInput, emptyCareEpisode } from './careEpisode'
import { episodeReviewInput, emptyEpisodeReview } from './careEpisodeReview'
import type { LifeDirection } from './lifeDirections'
import type { DevelopmentExperiment } from './selfDevelopment'

const source: LifeDirection = {
  id: 'direction',
  enrollment_id: 'enrollment',
  kind: 'future',
  horizon: 'open',
  title: 'Expressar limites',
  resources: 'Organização',
  limits: 'Uma conversa',
  first_step: 'Pedir tempo',
  narrative: '',
  meaning: '',
  access_class: 'participant_shared',
}
const parent: DevelopmentExperiment = {
  ...careEpisodeInput(
    source,
    {
      ...emptyCareEpisode(),
      facts: 'Situação privada do relato',
      alternative: 'Pedir tempo',
      support: 'Uma pausa',
    },
    true,
  ),
  id: 'episode',
}
function review(id: string, date: string, adjustment: string): DevelopmentExperiment {
  return {
    ...episodeReviewInput(
      source,
      parent,
      {
        ...emptyEpisodeReview(parent.id),
        observation: 'Percebi um limite',
        adjustment,
        support: 'Apoio',
      },
      true,
    ),
    id,
    created: date,
  }
}
it('usa o ajuste compartilhado mais recente sem copiar o relato da situação', () => {
  const choices = carePlanChoices(source, [
    parent,
    review('old', '2026-10-01', 'Passo antigo'),
    review('new', '2026-10-02', 'Passo atual'),
  ])
  expect(choices).toHaveLength(1)
  expect(choices[0].action).toBe('Passo atual')
  expect(JSON.stringify(choices)).not.toContain(parent.context)
})
it('exclui conteúdo privado, outra direção e retorno cujo pai não está compartilhado', () => {
  const shared = review('shared', '2026-10-01', 'Passo compartilhado')
  const hidden = {
    ...review('private', '2026-10-03', 'Segredo'),
    access_class: 'participant_private' as const,
  }
  expect(carePlanChoices(source, [parent, shared, hidden])[0].action).toBe('Passo compartilhado')
  expect(
    carePlanChoices(source, [{ ...parent, access_class: 'participant_private' }, shared]),
  ).toEqual([])
  expect(carePlanChoices(source, [parent, { ...shared, direction_id: 'other' }])[0].action).toBe(
    'Pedir tempo',
  )
  expect(
    carePlanChoices({ ...source, access_class: 'participant_private' }, [parent, shared]),
  ).toEqual([])
})
it('preserva a pausa para conversa e reúne somente recursos, limites e primeiro passo', () => {
  const paused = review('pause', '2026-10-01', 'Quero conversar')
  paused.reflection = JSON.stringify({
    ...emptyEpisodeReview(parent.id),
    outcome: 'paused',
    observation: 'Cansaço',
    adjustment: 'Quero conversar',
    support: '',
  })
  expect(carePlanChoices(source, [parent, paused])[0].needsConversation).toBe(true)
  expect(directionCareContext(source)).toContain('Disposição e limites: Uma conversa')
  expect(directionCareContext(source)).not.toContain(source.title)
  const conversation = {
    ...parent,
    reflection: JSON.stringify({
      ...emptyCareEpisode(),
      facts: 'Um pedido',
      alternative:
        'Quero compreender esta situação com minha profissional antes de escolher uma ação.',
    }),
  }
  expect(carePlanChoices(source, [conversation])[0].needsConversation).toBe(true)
})
