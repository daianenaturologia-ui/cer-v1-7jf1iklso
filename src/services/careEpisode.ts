import type { LifeDirection } from './lifeDirections'
import type { DevelopmentExperiment, DevelopmentInput } from './selfDevelopment'
import type { DevelopmentResource } from './developmentCatalog'

export const EPISODE_RESOURCE_ID = 'cer-care-episode-v1'
export const EPISODE_RESPONSES = {
  confront: 'Confrontar ou tentar controlar',
  withdraw: 'Me afastar ou evitar',
  freeze: 'Travar ou ficar sem reação',
  please: 'Ceder ou agradar',
  mixed: 'Mais de um movimento',
  unsure: 'Ainda não consigo reconhecer',
} as const
export type EpisodeResponse = keyof typeof EPISODE_RESPONSES
export const EPISODE_FIELDS = [
  'facts',
  'thought',
  'emotion',
  'body',
  'behavior',
  'relief',
  'cost',
  'need',
  'alternative',
  'support',
] as const
export type CareEpisode = Record<(typeof EPISODE_FIELDS)[number], string> & {
  version: 1
  response: EpisodeResponse
}
export const emptyCareEpisode = (): CareEpisode => ({
  version: 1,
  response: 'unsure',
  facts: '',
  thought: '',
  emotion: '',
  body: '',
  behavior: '',
  relief: '',
  cost: '',
  need: '',
  alternative: '',
  support: '',
})
const resource: DevelopmentResource = {
  id: EPISODE_RESOURCE_ID,
  title: 'Uma situação, um novo caminho',
  theme: 'Autoconhecimento na vida cotidiana',
  duration: 'No seu ritmo',
  lesson:
    'Reconhecer a ligação entre uma situação, sua reação e os efeitos dela ajuda a escolher um começo possível em direção ao que deseja transformar.',
  instructions: [
    'Escolha uma situação cotidiana.',
    'Observe sua reação e seus efeitos.',
    'Reconheça uma necessidade e uma alternativa possível.',
  ],
  fallback: 'Você pode pausar e conversar sobre esta situação com sua profissional.',
  reflection: 'O que ficou mais claro sobre seu funcionamento nesta situação?',
}
export function validateCareEpisode(value: unknown): asserts value is CareEpisode {
  if (!value || typeof value !== 'object') throw new Error('Não foi possível ler esta situação.')
  const v = value as CareEpisode
  if (v.version !== 1 || !Object.hasOwn(EPISODE_RESPONSES, v.response))
    throw new Error('Confira o movimento escolhido.')
  for (const field of EPISODE_FIELDS)
    if (typeof v[field] !== 'string' || v[field].length > 300)
      throw new Error('Cada trecho pode ter até 300 caracteres.')
  if (JSON.stringify(v).length > 5000)
    throw new Error('Encurte um pouco os textos para guardar esta situação.')
}
export function isCareEpisode(value: DevelopmentExperiment) {
  return value.resource_snapshot?.id === EPISODE_RESOURCE_ID
}
export function readCareEpisode(value: DevelopmentExperiment): CareEpisode | null {
  if (!isCareEpisode(value)) return null
  try {
    const data: unknown = JSON.parse(value.reflection)
    validateCareEpisode(data)
    return data
  } catch {
    return null
  }
}
export function careEpisodeInput(
  source: LifeDirection,
  episode: CareEpisode,
  shared: boolean,
): DevelopmentInput {
  validateCareEpisode(episode)
  if (!episode.facts.trim()) throw new Error('Conte uma situação para começar.')
  if (!episode.alternative.trim())
    throw new Error('Escolha um começo possível ou a opção de compreender melhor juntas.')
  return {
    enrollment_id: source.enrollment_id,
    direction_id: source.id,
    resource_snapshot: resource,
    goal: source.title,
    action: episode.alternative,
    context: episode.facts,
    signal: [episode.emotion, episode.body].filter(Boolean).join(' · '),
    fallback: episode.support,
    reflection: JSON.stringify(episode),
    next_step: '',
    scheduled_at: '',
    status: 'planned',
    access_class: shared ? 'participant_shared' : 'participant_private',
  }
}
export function careEpisodeReading(episode: CareEpisode): string {
  const readings: Record<EpisodeResponse, string> = {
    confront:
      'Nesta situação, sua reação se voltou para agir, defender uma posição ou recuperar controle. Essa energia pode ajudar a expressar limites; quando a urgência toma a frente, pode diminuir o espaço para escutar e escolher como se posicionar. Perceber o começo dessa urgência abre espaço para uma resposta firme que também considere suas necessidades.',
    withdraw:
      'Nesta situação, criar distância parece ter sido seu movimento. Uma pausa pode diminuir a sobrecarga e dar tempo para se reorganizar. Se o afastamento se prolonga, a dificuldade pode continuar sem conversa ou solução. O caminho pode incluir respeitar a pausa e encontrar uma forma possível de voltar ao que precisa de cuidado.',
    freeze:
      'Nesta situação, você percebeu dificuldade para agir ou encontrar uma resposta. Sob tensão, organizar palavras e escolhas pode ficar mais difícil. Reconhecer os primeiros sinais permite buscar tempo e apoio, em vez de exigir uma solução imediata de si. Sua próxima escolha pode começar por um passo menor.',
    please:
      'Nesta situação, sua reação se voltou para atender ao outro ou evitar um atrito. Sua sensibilidade ao vínculo pode facilitar cooperação e cuidado. Quando suas necessidades ficam de fora, porém, o alívio imediato pode vir acompanhado de sobrecarga. Reconhecer esse movimento ajuda a construir uma resposta que cuide da relação e também de você.',
    mixed:
      'Você reconheceu mais de um movimento nesta situação. Uma reação pode começar de um jeito e mudar conforme a tensão cresce ou o contexto muda. Vale observar a sequência, em vez de procurar um único rótulo: assim fica mais fácil reconhecer em que ponto uma pausa, um limite ou um apoio pode ampliar suas escolhas.',
    unsure:
      'Você ainda está encontrando palavras para sua reação. O relato de uma situação concreta já oferece um ponto de partida para observar, junto com sua profissional, a ligação entre o que aconteceu, o que sentiu e o que fez. Não precisa preencher as lacunas com certezas para começar esse cuidado.',
  }
  const effects =
    episode.relief.trim() && episode.cost.trim()
      ? ' Ao reconhecer tanto o alívio quanto o custo da reação, você pode preservar o que ela tentou cuidar e experimentar outra maneira de fazer isso.'
      : ''
  const need = episode.need.trim()
    ? ' A necessidade que você reconheceu pode orientar essa alternativa: transformar a forma de responder sem abandonar aquilo que precisa de cuidado.'
    : ''
  return readings[episode.response] + effects + need
}
