import type { CerMapReadingDimension } from '@/types/cerMapReadings'
import { CER_PROTECTION_PATTERNS } from './cerProtectionPatterns'

// Existing ordinal choices, not a new score or a clinical stress scale.
const priority = [
  'prestativo',
  'hipervigilante',
  'hiper_racional',
  'insistente',
  'hiper_realizador',
  'vitima',
  'inquieto',
  'comandante',
  'evitativo',
  'critico',
]
const names: Record<string, string> = {
  prestativo: 'Prestativo',
  hipervigilante: 'Hipervigilante',
  hiper_racional: 'Analítico',
  insistente: 'Insistente',
  hiper_realizador: 'Hiper-realizador',
  vitima: 'Desamparado',
  inquieto: 'Inquieto',
  comandante: 'Comandante',
  evitativo: 'Evitativo',
  critico: 'Crítico',
}
const meaning: Record<string, string> = {
  prestativo:
    'Seu cuidado com as pessoas pode fazer você perceber uma necessidade e logo se oferecer para ajudar. Existe sensibilidade e generosidade aí. O desgaste começa quando as necessidades dos outros chegam sempre antes das suas: você continua disponível, mesmo quando já precisava de uma pausa ou de alguém cuidando de você.',
  hipervigilante:
    'Sua atenção percebe detalhes e tenta se preparar para o que pode dar errado. Isso pode ajudar você a evitar dificuldades, mas também manter sua mente ocupada depois que o dia terminou. Descansar fica difícil quando uma parte sua ainda sente que precisa conferir, antecipar ou garantir que tudo está seguro.',
  hiper_racional:
    'Compreender as coisas pela razão pode trazer clareza e ajudar você a organizar o que vive. Às vezes, porém, tentar encontrar a explicação certa ocupa o espaço de sentir e receber acolhimento. Você pode entender muito bem o que está acontecendo e, ainda assim, continuar precisando de tempo, presença e apoio para atravessar aquilo.',
  insistente:
    'Você pode encontrar segurança em organizar, revisar e fazer as coisas com cuidado. Essa dedicação é uma força. Quando a exigência cresce, um detalhe fora do lugar pode pesar mais do que tudo o que você já conseguiu fazer. Reconhecer uma conclusão suficiente ajuda seu cuidado a caminhar junto com descanso.',
  hiper_realizador:
    'Realizar pode trazer satisfação e dar forma ao que você deseja. Quando o resultado passa a ser a principal maneira de reconhecer seu valor, parar pode parecer perder tempo ou ficar para trás. Sua capacidade de fazer continua disponível quando descanso e vínculos também têm lugar na sua vida.',
  vitima:
    'Em algumas dificuldades, pode ficar difícil perceber uma saída, mesmo que ela exista. Nesses momentos, você pode precisar de apoio para recuperar a sensação de escolha. Reconhecer um passo pequeno ao seu alcance ajuda a retomar movimento sem exigir que você resolva tudo de uma vez.',
  inquieto:
    'Sua curiosidade pode abrir caminhos e trazer ideias novas. Sob pressão, mudar rapidamente de atividade também pode aliviar o desconforto por um momento, deixando assuntos importantes em aberto. Escolher uma prioridade pequena ajuda sua energia a encontrar continuidade sem perder a criatividade.',
  comandante:
    'Assumir a frente pode ajudar você a se posicionar e organizar uma situação difícil. O esforço cresce quando tudo parece depender da sua condução. Sua firmeza também pode servir para combinar responsabilidades e pedir ajuda, permitindo que você seja apoiada enquanto participa das decisões.',
  evitativo:
    'Adiar ou se afastar pode oferecer um respiro quando algo parece difícil de enfrentar. O alívio pode durar pouco se a situação continuar esperando por você. Dar ao assunto um tamanho possível, com tempo e apoio, permite se aproximar sem precisar enfrentar tudo de uma vez.',
  critico:
    'Você percebe o que poderia melhorar e pode usar isso com discernimento. Quando essa atenção se transforma em cobrança contínua, fica difícil reconhecer o que já está bom ou tratar um erro com gentileza. Sua capacidade de avaliar pode ajudar mais quando também reconhece esforço, contexto e limites.',
}
const intensity = (text: string) =>
  /muita força|sob pressão/i.test(text)
    ? 3
    : /frequência|frequencia|frequente/i.test(text)
      ? 2
      : /algumas situações/i.test(text)
        ? 1
        : 0
export function strongestMindPatterns(dimension?: CerMapReadingDimension) {
  const ranks = new Map<string, number>()
  for (const row of dimension?.detailedRows || []) {
    const pattern = Object.values(CER_PROTECTION_PATTERNS).find((p) =>
      [p.id, p.baseName, p.movementDescription].includes(row.label),
    )
    if (pattern)
      ranks.set(
        pattern.canonicalKey,
        Math.max(ranks.get(pattern.canonicalKey) || 0, intensity(row.text)),
      )
  }
  const ranked = [...ranks]
    .filter(([, rank]) => rank > 0)
    .sort((a, b) => b[1] - a[1] || priority.indexOf(a[0]) - priority.indexOf(b[0]))
  return {
    keys: ranked.slice(0, 3).map(([key]) => key),
    tied: ranked.length > 3 && ranked[2][1] === ranked[3][1],
    allStrong: priority.every((key) => (ranks.get(key) || 0) >= 2),
  }
}
export function mindConversation(
  name: string,
  dimension: CerMapReadingDimension | undefined,
  emotions: string[],
  emotionTexts: Record<string, string>,
  fight: boolean,
) {
  const { keys, tied, allStrong } = strongestMindPatterns(dimension)
  const labels: Record<string, string> = {
    medo: 'medo',
    ansiedade_apreensao: 'ansiedade',
    alegria: 'alegria e entusiasmo',
    tristeza: 'tristeza',
    apatia_desanimo: 'desânimo',
    raiva: 'raiva',
    calma: 'calma',
    culpa: 'culpa',
    vergonha: 'vergonha',
  }
  const feelings = emotions.map((e) => labels[e]).filter(Boolean)
  const list = (items: string[]) =>
    items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' e ' + items.at(-1)
  if (!keys.length && !feelings.length) return ''
  const paragraphs = [
    `${name}, vamos olhar com carinho para o que suas respostas nos ajudam a compreender. ${feelings.length ? `No questionário, você destacou ${list(feelings)} entre as emoções mais presentes. ` : ''}${keys.length ? `Entre seus movimentos de proteção, vamos aprofundar aqui ${list(keys.map((k) => names[k]))}, que estão entre os mais intensos na sua leitura.` : ''}`,
  ]
  if (tied)
    paragraphs.push(
      'Alguns movimentos aparecem com a mesma intensidade. Escolhemos três para começar esta conversa; os demais continuam disponíveis no gráfico, com o destaque que você atribuiu a cada um.',
    )
  if (keys.length)
    paragraphs.push(
      'Sugiro que você também leia os detalhes desses comportamentos no gráfico. Aqui, vamos compreender como eles podem se encontrar no seu dia a dia: no jeito de pensar, sentir, cuidar dos vínculos e lidar com o que a vida pede de você.',
    )
  const helpful = keys.includes('prestativo'),
    vigilant = keys.includes('hipervigilante'),
    analytic = keys.includes('hiper_racional')
  if (helpful && vigilant) {
    paragraphs.push(
      'Quando sua vontade de cuidar se encontra com a atenção ao que pode dar errado, você pode perceber necessidades e riscos cedo e se mobilizar antes mesmo de alguém pedir. Há dedicação, sensibilidade e preparo nessa combinação. Ao mesmo tempo, pode sobrar pouco espaço para perceber quanto você tem disponível: ajudar, prevenir e manter tudo bem vão ocupando o dia, e suas próprias necessidades ficam esperando.',
    )
    paragraphs.push(
      analytic
        ? 'Seu lado analítico pode entrar nessa mesma tentativa de encontrar segurança: você procura entender o que aconteceu, antecipar o próximo passo e chegar à melhor solução. Assim, mesmo depois de ter ajudado ou resolvido algo, sua mente pode continuar trabalhando. Compreender é um recurso valioso, mas você também merece acolhimento e descanso enquanto as coisas ainda estão sendo compreendidas.'
        : 'Por isso, encerrar uma tarefa nem sempre encerra o esforço por dentro. Uma parte sua pode continuar acompanhando as pessoas e os problemas, como se descansar exigisse primeiro garantir que ninguém precisa de você. Aprender a incluir suas necessidades nesse cuidado torna sua generosidade mais sustentável.',
    )
  }
  for (const key of keys)
    if (
      !(
        helpful &&
        vigilant &&
        (['prestativo', 'hipervigilante'].includes(key) || (analytic && key === 'hiper_racional'))
      )
    )
      paragraphs.push(meaning[key])
  if (emotions.includes('ansiedade_apreensao') || emotions.includes('medo')) {
    paragraphs.push(
      emotions.includes('medo') && emotions.includes('ansiedade_apreensao')
        ? 'Com medo e ansiedade presentes, esse esforço pode ganhar urgência. O medo pode aproximar sua atenção do que parece ameaçador agora; a ansiedade pode levá-la ao que ainda nem aconteceu. Se você está tentando cuidar, prever ou entender, pode acabar buscando garantias que nunca parecem suficientes. Isso ajuda a compreender o cansaço de seguir resolvendo por fora enquanto, por dentro, ainda falta tranquilidade.'
        : emotions.includes('ansiedade_apreensao')
          ? 'A ansiedade pode fazer esse movimento continuar: você termina uma coisa, mas sua atenção já procura a próxima preocupação. Isso ajuda a compreender por que estar dando conta por fora nem sempre significa sentir tranquilidade por dentro. Aos poucos, reconhecer o que realmente precisa de você agora pode abrir espaço para descansar sem esperar que toda incerteza desapareça.'
          : 'O medo pode aproximar sua atenção do que parece ameaçador e tornar mais difícil perceber outras saídas. Quando isso acontece, acolher o que você sente e encontrar apoio pode ajudar antes de exigir uma solução. Sua capacidade de perceber riscos pode caminhar junto com a possibilidade de escolher e receber cuidado.',
    )
  }
  for (const emotion of emotions)
    if (emotionTexts[emotion])
      paragraphs.push(
        emotion === 'alegria'
          ? 'A alegria que você reconheceu também merece espaço nesta leitura. Ela pode coexistir com a preocupação e ajudar você a se aproximar de encontros, interesses e pequenas experiências de prazer. Permitir esses momentos sem precisar merecê-los pelo esforço é uma maneira de cuidar de si e de recuperar energia.'
          : emotionTexts[emotion],
      )
  if (fight)
    paragraphs.push(
      'Quando a pressão aumenta, sua tendência de responder pela luta pode transformar esse esforço em vontade de agir logo, resolver e recuperar o controle da situação. Sua iniciativa é uma força; o ponto de cuidado é perceber quando agir sem parar está deixando você sem espaço para escutar o que sente, dividir responsabilidades ou se recuperar.',
    )
  if (allStrong)
    paragraphs.push(
      'Você reconheceu muitos movimentos de proteção acontecendo com frequência ou com muita força. Isso merece uma conversa cuidadosa sobre a sobrecarga que pode estar vivendo. Você e Daiane poderão compreender como o estresse e, se fizerem parte da sua história, experiências traumáticas se relacionam com essas defesas. O cuidado começa por reconhecer o que precisa de apoio agora, no seu tempo.',
    )
  if (keys.length)
    paragraphs.push(
      'O caminho de desenvolvimento não precisa apagar suas forças. Podemos usar sua atenção para escolher prioridades, sua sensibilidade para incluir seus limites e sua capacidade de compreender para organizar passos possíveis. Em conversa com Daiane, essas forças podem ajudar você a cuidar de si e a construir o que deseja, com menos esforço acumulado e mais espaço para viver.',
    )
  return paragraphs.join('\n\n')
}
