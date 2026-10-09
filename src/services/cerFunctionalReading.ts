import type { CerMapReadingSnapshot, CerMapElementReading } from '@/types/cerMapReadings'
import type { ExperienceResponseRecord } from '@/types/cer'
import { BUILD_07C_MENTE_PROMPTS, BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'
import { selectedReadingChoices, regulationReadings, patternResources } from './cerPersonalReadings'
import { CER_PROTECTION_PATTERNS } from './cerProtectionPatterns'
import { buildProtectionPatternReading } from './cerProtectionPatternReading'

/** Connect supported characteristics, never classify a free narrative by keywords. */
export function applyFunctionalReading(
  snapshot: CerMapReadingSnapshot,
  responses: ExperienceResponseRecord[],
): CerMapReadingSnapshot {
  const records = responses.filter(
    (r) =>
      r.enrollment_id === snapshot.enrollmentId &&
      ['participant_shared', 'shared_care'].includes(r.access_class) &&
      !['draft', 'superseded', 'discarded'].includes(r.status),
  )
  const prompts = [...BUILD_07C_MENTE_PROMPTS, ...BUILD_07C_REGULACAO_PROMPTS]
  const choices = (key: string) => {
    const prompt = prompts.find((p) => (p.schema_config as any).prompt_key === key)
    if (!prompt) return []
    const response = records
      .filter(
        (r) =>
          r.prompt_id === prompt.id ||
          (r as any).canonical_prompt_id === prompt.id ||
          (r as any).prompt_key === key ||
          (r.structured_value as any)?.prompt_key === key ||
          (r.structured_value as any)?.metadata?.prompt_key === key,
      )
      .sort((a, b) => (a.updated || a.created).localeCompare(b.updated || b.created))
      .at(-1)
    return response ? selectedReadingChoices(prompt, response) : []
  }
  const body = snapshot.dimensions.find((d) => d.id === 'corpo')
  const mind = snapshot.dimensions.find((d) => d.id === 'mente')
  const regulation = snapshot.dimensions.find((d) => d.id === 'regulacao')
  const active = (key: string) =>
    mind?.detailedRows.some((row) => {
      const patterns = Object.values(CER_PROTECTION_PATTERNS).filter((p) => p.canonicalKey === key)
      return (
        patterns.some((p) => [p.id, p.movementDescription, p.baseName].includes(row.label)) &&
        /algumas situações|frequência|frequencia|sob pressão|muita força/.test(
          row.text.toLowerCase(),
        )
      )
    }) || false
  const helpful = active('prestativo')
  const vigilant = active('hipervigilante')
  const fear = choices('emocoes_recorrentes').includes('medo')
  const anxiety = choices('emocoes_recorrentes').includes('ansiedade_apreensao')
  const fight = choices('resposta_tendencia').includes('resolver_imediatamente')
  const regulationKnown = choices('resposta_tendencia').length > 0
  const mental: string[] = []
  if (helpful && vigilant)
    mental.push(
      'Seu cuidado com as pessoas se combina a uma atenção constante ao que pode dar errado. Você tende a perceber necessidades e riscos cedo e a se mobilizar para evitar que alguém fique desamparado. Essa combinação favorece dedicação e preparo, mas também pode fazer com que você assuma responsabilidades antes de avaliar quanto tem disponível. O descanso fica mais difícil quando estar disponível para todos parece uma condição para que tudo fique bem.',
    )
  else if (helpful)
    mental.push(
      'O movimento prestativo coloca sensibilidade e disponibilidade a serviço dos vínculos. Você tende a responder às necessidades de quem está perto e pode encontrar satisfação em ser útil. O ponto de desgaste aparece quando cuidar se transforma em obrigação: seu limite fica para depois e receber ajuda pode exigir mais esforço do que oferecer. Sua generosidade ganha sustentabilidade quando inclui suas próprias necessidades.',
    )
  else if (vigilant)
    mental.push(
      'O movimento hipervigilante organiza sua atenção em torno da preparação e da prevenção. Você percebe detalhes e procura antecipar dificuldades. Essa capacidade ajuda a planejar; quando permanece acionada, a mente continua trabalhando mesmo depois que a tarefa terminou. Reconhecer o que já está suficientemente seguro permite usar sua atenção sem precisar manter tudo sob vigilância.',
    )
  if (fear || anxiety)
    mental.push(
      fear && anxiety
        ? 'Medo e ansiedade juntos podem fazer sua atenção oscilar entre proteger-se de algo ameaçador agora e antecipar o que ainda pode acontecer. Com emoções intensas, a necessidade de segurança pode ganhar mais espaço que a curiosidade ou a flexibilidade. O pensamento busca garantias e a ação pode parecer urgente; compreender esse movimento ajuda a distinguir um problema concreto da necessidade de recuperar segurança interna.'
        : anxiety
          ? 'A ansiedade pode deslocar sua atenção do presente para o que ainda precisa ser prevenido ou resolvido. Você pode seguir funcionando por fora enquanto, por dentro, ensaia possibilidades e tenta reduzir a incerteza. Isso ajuda a compreender por que concluir uma tarefa nem sempre encerra o esforço mental. Recuperar espaço interno envolve voltar a perceber o que está acontecendo agora e o que realmente exige sua ação.'
          : 'O medo tende a estreitar a atenção em direção à proteção. Situações percebidas como ameaçadoras podem ocupar mais espaço e tornar menos acessíveis suas alternativas. A capacidade de perceber riscos continua sendo útil; o cuidado está em recuperar condições de segurança para que ela trabalhe junto com escolha e flexibilidade.',
    )
  const emotionReadings: Record<string, string> = {
    alegria:
      anxiety || fear
        ? 'Sua alegria pode coexistir com o estado de alerta: entusiasmo e preocupação não se anulam. Essa vitalidade abre espaço para interesse, encontros e prazer; usá-la como recurso envolve permitir experiências que não dependam de resolver algo ou ser útil. Assim, a vida pode oferecer recuperação além de responsabilidades.'
        : 'A alegria favorece aproximação, curiosidade e disposição para experimentar. Reconhecer o que alimenta essa vitalidade ajuda a sustentar escolhas alinhadas ao que importa, sem transformar entusiasmo em obrigação de estar sempre bem.',
    tristeza:
      'A tristeza pode mudar seu ritmo e pedir acolhimento antes de ação. Dar lugar à perda ou à frustração ajuda a reconhecer necessidades que a tentativa de seguir produzindo pode deixar para trás. Apoio e tempo para elaborar tornam mais possível retomar o envolvimento com a vida.',
    apatia_desanimo:
      'Com desânimo, começar e se envolver podem exigir mais esforço que o habitual. A dificuldade de mobilização pede ajustar o tamanho das demandas e recuperar condições de interesse e apoio. Pequenos movimentos possíveis ajudam a reconstruir participação sem acrescentar cobrança ao cansaço.',
    raiva:
      'A raiva pode tornar mais visível um limite atravessado ou uma necessidade sem espaço. Sua energia favorece posicionamento; quando vem com urgência, a forma de reagir pode dificultar ser compreendida. Transformar essa intensidade em comunicação clara permite defender o que importa preservando o vínculo.',
    calma:
      'A calma oferece espaço entre perceber e reagir. Esse recurso favorece escuta e escolhas com mais medida; reconhecer as condições que o tornam acessível permite utilizá-lo também nos momentos de pressão, sem exigir tranquilidade constante.',
    culpa:
      'A culpa pode orientar reparação e cuidado com os efeitos de suas escolhas. Quando assumir responsabilidade passa a incluir aquilo que não depende de você, ela consome energia e dificulta os limites. Distinguir sua parte da parte dos outros permite reparar com clareza e continuar cuidando de si.',
    vergonha:
      'A vergonha pode tornar exposição e pedido de apoio mais difíceis, mesmo quando o vínculo seria um recurso. Recuperar segurança para mostrar necessidades e imperfeições amplia suas alternativas e reduz o esforço de precisar parecer suficientemente adequada antes de receber cuidado.',
  }
  for (const id of choices('emocoes_recorrentes'))
    if (emotionReadings[id]) mental.push(emotionReadings[id])
  for (const key of Object.keys(patternResources))
    if (!['prestativo', 'hipervigilante'].includes(key) && active(key))
      mental.push(patternResources[key].text)
  const reg: string[] = []
  if (fight)
    reg.push(
      'A resposta de luta transforma pressão em mobilização: diante da dificuldade, sua primeira direção tende a ser agir, resolver e recuperar influência sobre a situação. Você pode parecer firme e capaz mesmo quando está assustada ou sobrecarregada por dentro. Essa resposta oferece iniciativa, posicionamento e proteção dos limites; seu custo aparece quando toda tensão precisa ser resolvida imediatamente e continuar agindo impede perceber a necessidade de recuperação.',
    )
  for (const id of choices('resposta_tendencia'))
    if (id !== 'resolver_imediatamente' && regulationReadings[id])
      reg.push(regulationReadings[id].text)
  if (fight && (helpful || vigilant))
    reg.push(
      'Quando esse movimento se encontra com sua dedicação às pessoas e sua atenção aos riscos, assumir a frente pode parecer a maneira mais rápida de devolver tranquilidade ao ambiente. Você se torna responsável tanto pela solução quanto pelo bem-estar de todos. Assim, pedir apoio ou esperar deixa de parecer uma opção simples. O caminho de desenvolvimento é preservar sua firmeza e distribuir a responsabilidade, para que agir seja uma escolha e não a única saída disponível.',
    )
  // Preserve other supported interpretations while grouping the dimension into one reading.
  const additional = (dimension: typeof mind, excluded: RegExp) =>
    (dimension?.personalSections || [])
      .filter(
        (section) =>
          section.title !== 'Como você funciona nesta dimensão' &&
          !section.sourceResponseIds.some((id) => {
            const record = records.find((r) => r.id === id)
            const prompt = prompts.find((p) => p.id === record?.prompt_id)
            return excluded.test(
              (prompt?.schema_config as any)?.prompt_key ||
                (record?.structured_value as any)?.prompt_key ||
                '',
            )
          }),
      )
      .map((section) => section.text)
  mental.push(...additional(mind, /movimentos_automaticos|emocoes_recorrentes/))
  reg.push(...additional(regulation, /resposta_tendencia/))
  const physical: string[] = []
  const vp =
    body?.ayurvedaConstitution?.length === 2 &&
    body.ayurvedaConstitution.includes('Vata') &&
    body.ayurvedaConstitution.includes('Pitta')
  const vk =
    body?.ayurvedaReading?.currentDoshas.length === 2 &&
    body.ayurvedaReading.currentDoshas.includes('Vata') &&
    body.ayurvedaReading.currentDoshas.includes('Kapha')
  if (vp && vk)
    physical.push(
      `Pela lente ayurvédica, sua base ${body!.ayurvedaConstitution!.join('–')} reúne movimento, sensibilidade, iniciativa e capacidade de transformar ideias em ação. O momento Vata–Kapha combina irregularidade com lentidão: você pode encontrar impulso para pensar e resolver, enquanto o corpo precisa de mais tempo para recuperar disposição e um ritmo previsível. Essa diferença ajuda a compreender o esforço de tentar sustentar o desempenho habitual com uma disponibilidade corporal que mudou.`,
    )
  if (body?.ayurvedaReading?.currentDigestive && (anxiety || vigilant || fight))
    physical.push(
      'A leitura digestiva atual e os movimentos de alerta e ação precisam ser considerados juntos no cuidado. A mente pode seguir mobilizada para as demandas enquanto alimentação, conforto digestivo e recuperação pedem um ritmo mais regular. O objetivo é construir condições em que seu corpo consiga acompanhar sua intenção de agir, em vez de compensar uma menor disponibilidade de energia com mais esforço. Essa conexão orienta o cuidado sem atribuir todos os sinais digestivos ao estado emocional.',
    )
  if (body?.ayurvedaReading?.amaPresence === 'Sinalizada' && body.ayurvedaReading.currentDigestive)
    physical.push(
      'Os sinais de Ama, na leitura tradicional, acrescentam uma necessidade de favorecer o processamento e a recuperação. Junto de Agni irregular ou lento, isso aponta para cuidar da capacidade de assimilar e recuperar conforto antes de ampliar exigências. Aproximar-se de sua base envolve recuperar estabilidade e disponibilidade, para que sua iniciativa possa encontrar sustentação no cotidiano.',
    )
  const connected = [...mental.slice(0, 3), ...reg.slice(0, 2), ...physical]
  const fallback = snapshot.dimensions.flatMap((d) => d.personalSections || []).map((s) => s.text)
  const integration = connected.length
    ? `${snapshot.participantName}, este conjunto ajuda a compreender onde suas forças se tornam disponíveis e onde o esforço se acumula.\n\n${connected.join('\n\n')}\n\nO desenvolvimento pode usar a atenção para escolher prioridades, a sensibilidade para incluir suas próprias necessidades e a iniciativa para pedir apoio e criar pausas. Recuperar condições de descanso, vínculo e ritmo corporal torna essas forças mais acessíveis.`
    : fallback.length
      ? `${snapshot.participantName}, seu funcionamento pode ser compreendido pelas conexões abaixo.\n\n${[...new Set(fallback)].slice(0, 4).join('\n\n')}`
      : ''
  const dimensions = snapshot.dimensions.map((d) => {
    if (d.id === 'corpo') return d
    let text =
      d.id === 'mente' && mental.length
        ? mental.join('\n\n')
        : d.id === 'regulacao' && reg.length
          ? reg.join('\n\n')
          : d.interpretation ||
            [...new Set((d.personalSections || []).map((s) => s.text))].join('\n\n')
    if (text && d.id === 'relacoes' && helpful)
      text +=
        '\n\nO movimento prestativo ajuda a compreender esse modo de se vincular: sua disponibilidade pode construir proximidade, mas, quando o cuidado se concentra em você, a relação perde espaço para a reciprocidade. Seu desenvolvimento inclui tornar necessidades e limites visíveis, para que o vínculo também possa sustentar você.'
    if (text && d.id === 'sexualidade' && (anxiety || fight || vigilant))
      text +=
        '\n\nAo conectar intimidade com seu modo de responder às demandas, o ponto de cuidado é recuperar presença. Uma atenção ocupada em prever, cuidar ou resolver pode deixar pouco espaço para perceber desejo, conforto e limites. Disponibilidade íntima também depende de condições em que você possa receber, escolher e estar no encontro sem precisar conduzir tudo.'
    if (text && d.id === 'sentido' && helpful)
      text +=
        '\n\nSua generosidade pode dar sentido ao que faz e, ao mesmo tempo, tornar difícil reservar tempo para si. Usar esse valor de forma estratégica inclui oferecer a si o cuidado que dedica aos outros. Assim, seus valores ajudam a organizar sua vida em vez de se tornarem uma exigência de disponibilidade permanente.'
    return {
      ...d,
      summary: '',
      interpretation: text,
      personalSections: text
        ? [
            {
              title: 'Como você funciona nesta dimensão',
              text,
              sourceResponseIds: [
                ...new Set((d.personalSections || []).flatMap((s) => s.sourceResponseIds)),
              ],
            },
          ]
        : [],
    }
  })
  const elements = { ...snapshot.elementReadings }
  if (fight)
    elements.luta = {
      summary: '',
      observations: [],
      interpretation: reg.join('\n\n'),
      resources: ['Iniciativa e firmeza para enfrentar dificuldades.'],
      costs: ['Urgência que pode reduzir espaço para escuta, apoio e recuperação.'],
      connections: physical.length ? [physical[0]] : [],
      questions: [],
    } satisfies CerMapElementReading
  for (const key of ['prestativo', 'hipervigilante'])
    if (active(key) && elements[key])
      elements[key] = {
        ...elements[key],
        summary: '',
        observations: [],
        connections: mental.length ? [mental[0]] : [],
      }
  for (const key of Object.keys(patternResources)) {
    if (active(key)) {
      const reading = buildProtectionPatternReading(key, true, elements[key])
      if (reading) {
        if (anxiety && !['prestativo', 'hipervigilante'].includes(key))
          reading.connections.push(
            ['insistente', 'critico', 'hiper_realizador'].includes(key)
              ? 'Ao se combinar com a ansiedade presente na sua leitura, a cobrança pode se tornar uma tentativa de recuperar segurança pelo desempenho. Fazer mais ou conferir mais oferece alívio por pouco tempo, enquanto a exigência seguinte mantém a mente ocupada. Definir uma conclusão suficiente ajuda a interromper esse ciclo.'
              : ['inquieto', 'evitativo', 'hiper_racional'].includes(key)
                ? 'Ao se combinar com a ansiedade presente na sua leitura, esse movimento pode oferecer alívio imediato ao mudar o foco, adiar ou procurar mais explicações. O cuidado é recuperar condições para entrar em contato com o que precisa de atenção e escolher um passo possível, em vez de prolongar a antecipação.'
                : 'A ansiedade presente na sua leitura pode tornar a incerteza mais difícil de sustentar. Quando esse movimento procura devolver segurança rapidamente, pedir apoio e distinguir o que depende de você ajudam a ampliar suas alternativas.',
          )
        if (fight && ['insistente', 'critico', 'hiper_realizador', 'comandante'].includes(key))
          reading.connections.push(
            'Com a resposta de luta presente na sua leitura, a pressão tende a virar ação rápida. A energia para resolver pode se juntar à necessidade de corrigir ou conduzir, tornando difícil esperar e dividir responsabilidades. Sua firmeza também pode servir para combinar prioridades, comunicar limites e pedir apoio antes de agir.',
          )
        elements[key] = reading
      }
    }
  }
  if (mental.length)
    elements.mente = {
      summary: '',
      observations: [],
      interpretation: mental.join('\n\n'),
      resources: [],
      costs: [],
      connections: physical,
      questions: [],
    }
  if (regulationKnown && regulation)
    elements.regulacao = {
      summary: '',
      observations: [],
      interpretation:
        reg.join('\n\n') || dimensions.find((d) => d.id === 'regulacao')?.interpretation || '',
      resources: [],
      costs: [],
      connections: [],
      questions: [],
    }
  if (body?.ayurvedaReading) {
    const interpretation = (text: string, connections: string[] = []): CerMapElementReading => ({
      summary: '',
      observations: [],
      interpretation: text,
      resources: [],
      costs: [],
      connections,
      questions: [],
    })
    const base = body.ayurvedaConstitution || []
    const current = body.ayurvedaReading.currentDoshas
    elements.vata = interpretation(
      'Vata representa movimento e variabilidade na lente ayurvédica. ' +
        (base.includes('Vata')
          ? 'Na sua base, essa qualidade favorece sensibilidade, percepção de mudanças e abertura para ideias. Seu recurso ganha sustentação quando encontra um ritmo que permita transformar interesse em continuidade.'
          : 'Esse princípio ajuda a compreender mudanças de ritmo; sua participação na constituição depende das tendências de base.') +
        (current.includes('Vata')
          ? ' No momento atual, a irregularidade pede previsibilidade e recuperação: aumentar o esforço pode ampliar a distância entre seu impulso e o ritmo que consegue sustentar.'
          : ''),
      physical.slice(0, 1),
    )
    elements.pitta = interpretation(
      'Pitta representa transformação e calor na lente ayurvédica. ' +
        (base.includes('Pitta')
          ? 'Na sua hipótese constitucional, essa qualidade oferece direção, discernimento e energia para realizar. Ela ajuda a escolher prioridades e converter ideias em ações; sob cobrança, a busca de resultado pode deixar pouco espaço para reconhecer limites e recuperar disposição.'
          : 'Esse princípio permite observar intensidade e transformação, sem pressupor sua predominância na sua base.') +
        (vp && vk
          ? ' Com o momento Vata–Kapha, sua intenção de avançar encontra um corpo mais irregular e lento. Recuperar sustentação permite reencontrar iniciativa com conforto, sem tentar obter a disposição habitual apenas pela exigência.'
          : ''),
      physical.slice(0, 1),
    )
    elements.kapha = interpretation(
      'Kapha representa sustentação e estabilidade na lente ayurvédica. ' +
        (current.includes('Kapha')
          ? 'No seu momento atual, essa qualidade aparece como maior lentidão. Começar, digerir e recuperar leveza podem pedir mais tempo; exigir rapidez de si pode aumentar frustração e desgaste. A direção do cuidado é recuperar mobilidade e disponibilidade respeitando o ritmo atual do corpo.'
          : 'Sua estabilidade favorece continuidade e recuperação; compreender como participa do momento depende da leitura atual.'),
      physical.slice(0, 1),
    )
    elements.agni = interpretation(body.ayurvedaReading.agniSummary, physical.slice(1, 2))
    elements.ama = interpretation(body.ayurvedaReading.amaSummary, physical.slice(2))
  }
  for (const key of [
    'emocoes',
    'pensamentos',
    'protecao',
    'meu_mundo_emocional',
    'mundo_emocional',
  ]) {
    if (elements.mente) elements[key] = { ...elements.mente }
    else delete elements[key]
  }
  for (const id of ['relacoes', 'sexualidade', 'sentido']) {
    const dimension = dimensions.find((d) => d.id === id)
    if (dimension?.interpretation)
      elements[id] = {
        summary: '',
        observations: [],
        interpretation: dimension.interpretation,
        resources: [],
        costs: [],
        connections: [],
        questions: [],
      }
  }
  if (physical.length)
    elements.corpo = {
      summary: '',
      observations: [],
      interpretation: physical.join('\n\n'),
      resources: [],
      costs: [],
      connections: [],
      questions: [],
    }
  const everyday = dimensions
    .filter((d) => ['sexualidade', 'sentido'].includes(d.id))
    .map((d) => d.interpretation)
    .filter(Boolean)
    .join('\n\n')
  if (everyday)
    elements.vida_cotidiana = {
      summary: '',
      observations: [],
      interpretation: everyday,
      resources: [],
      costs: [],
      connections: [],
      questions: [],
    }
  for (const reaction of Object.values(regulationReadings)) {
    if (!choices('resposta_tendencia').some((id) => regulationReadings[id]?.id === reaction.id))
      delete elements[reaction.id]
  }
  return { ...snapshot, dimensions, integration, elementReadings: elements }
}
