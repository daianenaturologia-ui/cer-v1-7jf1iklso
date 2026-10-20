import type { CerMapReadingSnapshot } from '@/types/cerMapReadings'
import type { ExperienceResponseRecord } from '@/types/cer'
import type { LifeEvent } from './lifeTimeline'
import type { LifeDirection } from './lifeDirections'
import { BUILD_07C_MENTE_PROMPTS, BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'
import { BUILD_07D_RELACOES_PROMPTS } from './build07dPrompts'
import { BUILD_07E_SEXUALIDADE_PROMPTS } from './build07ePrompts'
import { BUILD_07F_SENTIDO_PROMPTS } from './build07fPrompts'
import { selectedReadingChoices } from './cerPersonalReadings'

export interface LiveIntegrationSection {
  id: string
  title: string
  text: string
  dimensionIds: string[]
  responseIds: string[]
  eventIds: string[]
}
export interface CerLiveIntegration {
  sections: LiveIntegrationSection[]
  summary: string
  priorities: string[]
  availableDimensions: string[]
  missingDimensions: string[]
  updatedAt?: string
  historyAvailable: boolean
}
const prompts = [
  ...BUILD_07C_MENTE_PROMPTS,
  ...BUILD_07C_REGULACAO_PROMPTS,
  ...BUILD_07D_RELACOES_PROMPTS,
  ...BUILD_07E_SEXUALIDADE_PROMPTS,
  ...BUILD_07F_SENTIDO_PROMPTS,
]

/** Live projection, never written into a reviewed publication. Interpret authored choices,
 * not narrative keywords; retain sources for every connection and isolate each audience. */
export function buildCerLiveIntegration({
  snapshot,
  responses,
  events = [],
  directions = [],
  audience = 'participant',
}: {
  snapshot: CerMapReadingSnapshot
  responses: ExperienceResponseRecord[]
  events?: LifeEvent[]
  directions?: LifeDirection[]
  audience?: 'participant' | 'professional'
}): CerLiveIntegration {
  const records = responses.filter(
    (r) =>
      r.enrollment_id === snapshot.enrollmentId &&
      ['participant_shared', 'shared_care'].includes(r.access_class) &&
      !['draft', 'superseded', 'discarded'].includes(r.status),
  )
  const latest = (key: string) => {
    const prompt = prompts.find((p) => (p.schema_config as any).prompt_key === key)
    if (!prompt) return undefined
    return records
      .filter(
        (r) =>
          r.prompt_id === prompt.id ||
          (r as any).canonical_prompt_id === prompt.id ||
          (r as any).prompt_key === key ||
          (r.structured_value as any)?.prompt_key === key ||
          (r.structured_value as any)?.metadata?.prompt_key === key,
      )
      .sort((a, b) => (a.updated || a.created || '').localeCompare(b.updated || b.created || ''))
      .at(-1)
  }
  const choices = (key: string) => {
    const record = latest(key)
    const prompt = prompts.find((p) => (p.schema_config as any).prompt_key === key)
    return record && prompt ? selectedReadingChoices(prompt, record) : []
  }
  const has = (key: string, ...ids: string[]) => choices(key).some((id) => ids.includes(id))
  const life = events.filter(
    (e) =>
      e.enrollment_id === snapshot.enrollmentId &&
      (e.access_class === 'participant_shared' ||
        (audience === 'participant' && e.access_class === 'participant_private')),
  )
  const goals = directions.filter(
    (e) =>
      e.enrollment_id === snapshot.enrollmentId &&
      (e.access_class === 'participant_shared' ||
        (audience === 'participant' && e.access_class === 'participant_private')),
  )
  const sections: LiveIntegrationSection[] = []
  const priorities: string[] = []
  const add = (
    id: string,
    title: string,
    text: string,
    dimensionIds: string[],
    keys: string[],
    eventIds: string[] = [],
  ) =>
    sections.push({
      id,
      title,
      text,
      dimensionIds,
      responseIds: [...new Set(keys.flatMap((k) => (latest(k)?.id ? [latest(k)!.id] : [])))],
      eventIds,
    })
  const emotionalAlert = has('emocoes_recorrentes', 'medo', 'ansiedade_apreensao')
  const act = has('resposta_tendencia', 'resolver_imediatamente')
  const yieldResponse = has('resposta_tendencia', 'ceder_agradar')
  const retreat = has('resposta_tendencia', 'afastar_recolher')
  const boundaries = has(
    'limites_cena_adaptativa',
    'tento_me_adaptar',
    'percebo_mas_demoro',
    'percebo_depois',
  )
  const support = has(
    'pedir_apoio_tendencia',
    'tento_resolver_sozinha',
    'espero_que_percebam',
    'demoro_a_perceber',
  )
  const clearBoundary = has('limites_cena_adaptativa', 'percebo_e_falo')
  const directSupport = has('pedir_apoio_tendencia', 'peco_diretamente')
  const littleMeaningSpace = has('espaco_para_o_que_importa_sc2', 'sim_pouco_espaco', 'um_pouco')
  const littleIntimacySpace = has('disponibilidade_camada_experiencia', 'quero_mas_sem_espaco')
  const body = snapshot.dimensions.find((d) => d.id === 'corpo')
  const bodyAvailable = !!body?.ayurvedaReading
  if (emotionalAlert && act) {
    add(
      'alert-action',
      'Quando proteger vira urgência',
      'O medo ou a ansiedade se encontram com a tendência de agir imediatamente diante da pressão. Resolver pode devolver uma sensação de segurança e tornar sua iniciativa um recurso. Quando essa combinação se prolonga, porém, o alívio pode depender de continuar fazendo. Distinguir o que precisa de ação do que pede acolhimento amplia seu espaço de escolha.',
      ['mente', 'regulacao'],
      ['emocoes_recorrentes', 'resposta_tendencia'],
    )
    priorities.push(
      'Criar um intervalo entre sentir urgência e assumir uma nova tarefa, verificando o que realmente precisa de ação.',
    )
  } else if (emotionalAlert && retreat) {
    add(
      'alert-retreat',
      'Proteção e aproximação',
      'O medo ou a ansiedade se combinam com o movimento de se recolher diante da pressão. A distância pode oferecer tempo para recuperar segurança; se permanece como a única alternativa, também pode adiar conversas e o acesso a apoio. O cuidado envolve preservar seu tempo e construir uma forma possível de retomar o contato.',
      ['mente', 'regulacao'],
      ['emocoes_recorrentes', 'resposta_tendencia'],
    )
    priorities.push(
      'Combinar tempo de recolhimento com uma forma segura de retomar o contato e receber apoio.',
    )
  }
  if ((act || yieldResponse) && (boundaries || support)) {
    add(
      'protection-bonds',
      'O esforço de sustentar os vínculos',
      `${act ? 'A iniciativa de resolver as dificuldades' : 'O movimento de ceder para reduzir a tensão'} se encontra com ${boundaries && support ? 'a dificuldade de sinalizar limites e de pedir apoio' : boundaries ? 'a dificuldade de sinalizar limites' : 'a dificuldade de pedir apoio'}. Essa combinação pode manter a situação funcionando enquanto suas necessidades ficam menos visíveis. A proteção procura preservar algo importante, mas pode concentrar o esforço em você. Comunicar sua disponibilidade e dividir responsabilidades permite cuidar do vínculo com mais reciprocidade.`,
      ['regulacao', 'relacoes'],
      ['resposta_tendencia', 'limites_cena_adaptativa', 'pedir_apoio_tendencia'],
    )
    priorities.push(
      'Tornar uma necessidade ou um limite visível e combinar uma responsabilidade que possa ser dividida.',
    )
  }
  if (bodyAvailable && (emotionalAlert || act)) {
    add(
      'body-emotion',
      'Um ritmo que sustente sua iniciativa',
      `${body?.ayurvedaReading?.currentDigestive ? 'Os sinais digestivos presentes na leitura corporal' : 'As características e o momento corporal descritos pela lente ayurvédica'} precisam ser considerados junto do esforço de ${act ? 'seguir resolvendo' : 'antecipar dificuldades'}. Mais mobilização mental não significa mais disponibilidade do corpo. Um ritmo que inclua alimentação, pausas e recuperação pode sustentar sua capacidade de agir. A leitura ayurvédica é uma lente tradicional; essa aproximação não estabelece uma causa emocional para os sinais físicos.`,
      ['corpo', emotionalAlert ? 'mente' : 'regulacao'],
      ['emocoes_recorrentes', 'resposta_tendencia'],
    )
    priorities.push(
      'Ajustar o tamanho das demandas à disponibilidade do corpo e observar as condições de recuperação.',
    )
  }
  if (
    littleIntimacySpace &&
    (boundaries || support || emotionalAlert || littleMeaningSpace || bodyAvailable)
  ) {
    add(
      'intimacy-space',
      'Espaço para receber e estar presente',
      'A falta de tempo ou energia para a intimidade se conecta ao espaço que as outras demandas ocupam na sua vida. Isso pode ajudar a compreender por que querer um encontro e conseguir estar disponível para ele são experiências diferentes. O cuidado é construir condições de presença, descanso e liberdade de escolha, sem transformar a intimidade em mais uma obrigação.',
      [
        'sexualidade',
        ...(boundaries || support ? ['relacoes'] : []),
        ...(emotionalAlert ? ['mente'] : []),
        ...(littleMeaningSpace ? ['sentido'] : []),
        ...(bodyAvailable ? ['corpo'] : []),
      ],
      [
        'disponibilidade_camada_experiencia',
        'limites_cena_adaptativa',
        'pedir_apoio_tendencia',
        'emocoes_recorrentes',
        'espaco_para_o_que_importa_sc2',
      ],
    )
  }
  if (littleMeaningSpace && (boundaries || support || act || littleIntimacySpace)) {
    add(
      'values-routine',
      'O que importa também precisa caber na vida',
      'O pouco espaço para o que importa se encontra com demandas que ocupam sua disponibilidade. A distância entre valores e rotina pode ser compreendida como uma necessidade de reorganizar condições e prioridades, em vez de acrescentar cobrança pessoal. Reservar um espaço pequeno e viável para algo significativo ajuda a transformar intenção em experiência e a avaliar quais compromissos precisam ser renegociados.',
      [
        'sentido',
        ...(boundaries || support ? ['relacoes'] : []),
        ...(act ? ['regulacao'] : []),
        ...(littleIntimacySpace ? ['sexualidade'] : []),
      ],
      [
        'espaco_para_o_que_importa_sc2',
        'limites_cena_adaptativa',
        'pedir_apoio_tendencia',
        'resposta_tendencia',
        'disponibilidade_camada_experiencia',
      ],
    )
    priorities.push(
      'Reservar um espaço possível para o que importa e rever uma demanda que hoje ocupa esse lugar.',
    )
  }
  if ((clearBoundary || directSupport) && (emotionalAlert || act || yieldResponse || retreat)) {
    add(
      'available-support',
      'Recursos que ampliam suas escolhas',
      `${clearBoundary && directSupport ? 'Reconhecer e comunicar limites, junto de pedir apoio diretamente, oferece' : clearBoundary ? 'Reconhecer e comunicar limites oferece' : 'Pedir apoio diretamente oferece'} um contraponto ao seu modo de responder à pressão. Você pode sentir medo, mobilizar-se ou precisar se recolher e, ainda assim, contar com caminhos de comunicação. Essas experiências podem coexistir: a presença de um recurso não apaga a dificuldade, mas amplia as alternativas para atravessá-la.`,
      ['relacoes', emotionalAlert ? 'mente' : 'regulacao'],
      [
        'limites_cena_adaptativa',
        'pedir_apoio_tendencia',
        'emocoes_recorrentes',
        'resposta_tendencia',
      ],
    )
  }
  // Only explicit emotions support temporal links. Never infer trauma or causality from narrative text.
  const emotionalIds: Record<string, string> = {
    medo: 'Medo',
    alegria: 'Alegria',
    tristeza: 'Tristeza',
    raiva: 'Raiva',
    culpa: 'Culpa',
    vergonha: 'Vergonha',
  }
  const recurring = choices('emocoes_recorrentes')
    .map((id) => emotionalIds[id])
    .filter(Boolean)
  const matches = life.filter((e) => e.emotions.some((emotion) => recurring.includes(emotion)))
  if (matches.length) {
    const emotions = [
      ...new Set(
        matches.flatMap((e) => e.emotions.filter((emotion) => recurring.includes(emotion))),
      ),
    ]
    add(
      'history-emotions',
      'Sua história e seu momento atual',
      `${emotions.join(', ')} aparece${emotions.length === 1 ? '' : 'm'} nas emoções atuais e nos marcos ${matches
        .slice(0, 3)
        .map((e) => `“${e.title}”`)
        .join(
          ', ',
        )}${matches.length > 3 ? ' e em outros acontecimentos registrados' : ''}. Essa continuidade pode abrir uma compreensão de como necessidades de proteção, acolhimento ou apoio reaparecem em contextos diferentes. A emoção em comum não significa que as situações tenham a mesma origem ou o mesmo sentido. O que mudou nas suas condições de vida e nos recursos disponíveis ajuda a compreender esse percurso sem reduzir você ao passado.`,
      ['mente'],
      ['emocoes_recorrentes'],
      matches.map((e) => e.id),
    )
  } else if (life.length) {
    add(
      'history-context',
      'Sua história acrescenta contexto',
      'Os marcos registrados ampliam o contexto para compreender seu momento. Ainda não há uma conexão interpretativa sustentada entre as emoções desses marcos e as respostas atuais. Isso não significa ausência de relação: essa compreensão pode se aprofundar com novos registros e com a elaboração do que cada experiência representa para você.',
      [],
      [],
      life.map((e) => e.id),
    )
  }
  const summaryParts: string[] = []
  if (emotionalAlert && act)
    summaryParts.push(
      'O conjunto sugere um movimento em que a busca de segurança se transforma em ação: resolver oferece alívio, mas pode manter você mobilizada mesmo quando precisa se recuperar.',
    )
  else if (emotionalAlert && retreat)
    summaryParts.push(
      'O conjunto sugere que recuperar segurança passa pelo recolhimento; preservar esse tempo e manter um caminho de volta ao apoio pode ampliar suas escolhas.',
    )
  if ((act || yieldResponse) && (boundaries || support))
    summaryParts.push(
      'Quando esse modo de se proteger encontra dificuldade para comunicar limites ou pedir ajuda, o esforço pode ficar concentrado em você e suas necessidades se tornam menos visíveis nos vínculos.',
    )
  if (bodyAvailable && (emotionalAlert || act))
    summaryParts.push(
      'Ao incluir o corpo nessa leitura, aparece a importância de ajustar a mobilização mental às condições de ritmo e recuperação, sem presumir uma causa emocional para os sinais físicos.',
    )
  if (littleIntimacySpace && littleMeaningSpace)
    summaryParts.push(
      'O pouco espaço tanto para a intimidade quanto para o que dá sentido à vida amplia esse fio de compreensão: cuidar inclui recuperar disponibilidade para receber, escolher e viver o que importa.',
    )
  else if (sections.some((s) => s.id === 'intimacy-space'))
    summaryParts.push(
      'Na intimidade, essa disponibilidade também pede condições para estar presente e receber, além de responder às demandas.',
    )
  else if (sections.some((s) => s.id === 'values-routine'))
    summaryParts.push(
      'O espaço reduzido para o que importa indica que reorganizar compromissos pode ser tão necessário quanto desenvolver recursos pessoais.',
    )
  if (sections.some((s) => s.id === 'available-support'))
    summaryParts.push(
      'A capacidade de comunicar limites ou pedir apoio oferece um recurso concreto para interromper esse acúmulo e construir respostas com mais escolha.',
    )
  if (matches.length)
    summaryParts.push(
      'Emoções presentes hoje também aparecem na sua história: essa continuidade acrescenta contexto ao cuidado, sem determinar a origem dos padrões atuais.',
    )
  const available = snapshot.dimensions
    .filter((d) => d.ayurvedaReading || d.interpretation || d.personalSections?.length)
    .map((d) => d.id)
  const dates = [...records, ...life, ...goals]
    .map((r) => r.updated || ('created' in r ? r.created : undefined))
    .filter((s): s is string => !!s && Number.isFinite(Date.parse(s)))
  return {
    sections,
    summary: summaryParts.join(' '),
    priorities: [...new Set(priorities)],
    availableDimensions: available,
    missingDimensions: snapshot.dimensions
      .filter((d) => !available.includes(d.id))
      .map((d) => d.title),
    updatedAt: dates.sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1),
    historyAvailable: life.length > 0,
  }
}
