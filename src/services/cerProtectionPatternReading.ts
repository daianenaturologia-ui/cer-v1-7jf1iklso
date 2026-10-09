import type { CerMapElementReading } from '@/types/cerMapReadings'
import { patternResources } from './cerPersonalReadings'

/** Original CER explanations: a present function, never an inferred childhood biography. */
const explanations: Record<string, [string, string, string, string, string]> = {
  insistente: [
    'A busca de fazer bem pode organizar sua vida em torno de critérios muito exigentes. Você percebe detalhes, prepara etapas e procura evitar descuidos. Quando essa capacidade passa a exigir ausência de qualquer falha, terminar deixa de ser suficiente: surge a necessidade de conferir mais uma vez. Uma tarefa pequena pode ocupar tempo e energia de uma tarefa grande, e o descanso fica esperando uma conclusão que sempre se afasta.',
    'A regra interna pode se aproximar de “preciso garantir que tudo esteja certo antes de relaxar”. Um erro passa a parecer maior que o trabalho bem feito, e uma sugestão pode ser recebida como cobrança. Isso favorece tensão, irritação ou frustração quando alguém trabalha de outra forma. A qualidade continua importante; o desgaste aparece quando há pouco espaço para aprender, improvisar e corrigir ao longo do caminho.',
    'Na rotina, revisar demais pode atrasar entregas ou tornar difícil delegar. Nos vínculos, o cuidado com os detalhes pode chegar ao outro como correção contínua, mesmo quando sua intenção é ajudar. Você termina assumindo mais trabalho e as outras pessoas têm menos espaço para participar. Assim, tentar garantir um bom resultado pode enfraquecer justamente a cooperação que tornaria esse resultado mais leve.',
    'Esse movimento pode procurar segurança pela previsibilidade: organizar e conferir oferecem uma sensação de menor exposição a erros ou críticas. Essa é uma maneira de compreender a proteção no presente. A história que deu forma a ela será compreendida com Daiane a partir dos acontecimentos que você trouxer.',
    'Sua organização, persistência e atenção à qualidade podem apoiar seus objetivos. Use essas forças para definir antecipadamente o que precisa ficar bem feito, o que pode ficar simples e quando uma tarefa estará concluída. Ao planejar, reserve também tempo para descanso e margem para imprevistos. A mesma capacidade de criar estrutura pode proteger sua energia, em vez de exigir disponibilidade sem fim.',
  ],
  prestativo: [
    'Sua atenção se dirige facilmente a quem precisa de ajuda. Você percebe necessidades, oferece apoio e pode construir proximidade por meio do cuidado. Quando esse movimento assume a frente de muitas escolhas, a disponibilidade para os outros vem antes da percepção do que cabe para você. Dizer sim oferece uma sensação imediata de vínculo, mas compromissos se acumulam e suas necessidades encontram cada vez menos espaço.',
    'A regra interna pode se aproximar de “se eu cuidar, a relação ficará bem”. Colocar um limite pode despertar culpa; pedir algo pode parecer mais difícil que oferecer. Quando sua dedicação não é percebida, podem surgir mágoa e frustração. Existe um desencontro: você se esforça para sustentar a proximidade, enquanto aquilo de que precisa continua pouco visível para quem está perto.',
    'No trabalho e em casa, isso pode transformar pedidos em obrigações assumidas rapidamente. Nas relações, você ocupa muito o lugar de quem sustenta e pouco o de quem recebe. Os outros podem se acostumar à sua disponibilidade sem perceber o custo. A sobrecarga cresce quando a ajuda substitui uma conversa clara sobre responsabilidade, tempo e reciprocidade.',
    'Cuidar pode funcionar como uma maneira de preservar pertencimento e reduzir o risco de desagradar. Ser útil oferece um caminho concreto para se sentir próxima das pessoas. A função protetiva ajuda a compreender o movimento atual; a relação dele com sua história será construída com Daiane a partir do que você reconhecer.',
    'Sua sensibilidade, generosidade e capacidade de cooperação são recursos valiosos. Direcione parte dessa atenção para reconhecer sua energia antes de assumir um pedido. No planejamento, inclua suas necessidades entre as prioridades e combine responsabilidades de forma explícita. Você pode continuar oferecendo cuidado e também praticar recebê-lo, para que a relação tenha espaço para os dois lados.',
  ],
  hiper_realizador: [
    'Você pode encontrar direção e entusiasmo ao transformar uma intenção em resultado. Quando realizar se torna a principal forma de confirmar seu valor, cada conquista oferece alívio breve e logo aparece uma nova exigência. O dia passa a ser avaliado pelo que foi entregue. Uma pausa pode parecer perda de tempo, mesmo quando seria necessária para sustentar o caminho que você escolheu.',
    'A regra interna pode se aproximar de “preciso continuar produzindo para merecer reconhecimento”. Isso pode alimentar comparação, ansiedade diante da queda de rendimento e dificuldade de desfrutar conquistas. Sentimentos que pedem atenção ficam adiados porque parecem interromper o andamento. Você pode parecer muito capaz por fora e ter pouco espaço, por dentro, para perceber satisfação, cansaço ou necessidade de apoio.',
    'Na rotina, novas metas podem ocupar o tempo destinado à recuperação. Nas relações, a presença pode ser dividida com pendências e a imagem de competência pode dificultar mostrar vulnerabilidade. Quanto mais o valor pessoal depende da entrega seguinte, menos uma entrega concluída consegue trazer repouso. O esforço cresce sem garantir uma sensação duradoura de realização.',
    'Buscar desempenho pode oferecer proteção diante da insegurança sobre reconhecimento e pertencimento. Conquistar torna seu esforço visível e dá uma sensação de direção. Essa leitura descreve uma função possível no presente; o significado das conquistas em sua história será aprofundado com Daiane.',
    'Iniciativa, foco e capacidade de execução podem servir aos seus objetivos com mais medida. Defina metas que incluam a qualidade da experiência, além da entrega. Use sua capacidade de planejamento para reservar recuperação, celebrar etapas e estabelecer um horário de encerramento. Isso permite construir algo importante sem fazer de cada dia uma nova prova do seu valor.',
  ],
  vitima: [
    'Quando o sofrimento ocupa muito espaço, pode ficar difícil perceber onde ainda existe escolha. Você pode reconhecer claramente o que dói e, ao mesmo tempo, ter dificuldade para enxergar uma ação que faça diferença. O desencorajamento aproxima situações diferentes de uma mesma conclusão: parece que nada poderá mudar. Isso reduz a disponibilidade para tentar, mesmo quando existem apoios ou pequenos passos possíveis.',
    'A regra interna pode se aproximar de “não adianta agir, o resultado será o mesmo”. Tristeza, frustração e sensação de solidão podem tornar tentativas anteriores mais visíveis que os recursos atuais. Receber uma sugestão pode soar como incompreensão quando sua primeira necessidade é ter a dor reconhecida. Acolhimento e ação precisam caminhar juntos, em um ritmo que não transforme sofrimento em mais cobrança.',
    'Na rotina, decisões e iniciativas podem ficar suspensas à espera de uma solução externa. Nos vínculos, pedidos pouco definidos podem deixar as pessoas sem saber como apoiar. A continuidade desse ciclo pode aprofundar o desânimo. Situações reais de violência, injustiça ou restrição precisam de proteção e apoio concreto; ter pouca margem de escolha nessas condições não é uma falha sua.',
    'Reconhecer a dor e procurar amparo pode preservar você de continuar enfrentando uma dificuldade sem apoio. Quando essa proteção ocupa todo o espaço, o que é possível hoje pode ficar escondido. Com Daiane, sua história e suas condições reais ajudarão a distinguir o que precisa de suporte externo e onde há margem para ação própria.',
    'Sua sensibilidade ao sofrimento pode ajudar a reconhecer necessidades e buscar cuidado. Use esse recurso para formular um pedido de apoio específico e escolher uma ação pequena sob seu alcance. No planejamento, diferencie sua parte, a parte dos outros e as condições que precisam mudar. Recuperar participação pode começar por uma decisão pequena que tenha apoio e possibilidade real de continuidade.',
  ],
  hiper_racional: [
    'Compreender oferece uma forma de se orientar. Você pode organizar informações, buscar coerência e elaborar soluções antes de agir. Quando a análise passa a ser a principal resposta para qualquer experiência, sentir e perceber o corpo ficam em segundo plano. Você pode explicar muito bem uma situação e ainda ter dificuldade para reconhecer o que ela desperta ou o que precisa naquele momento.',
    'A regra interna pode se aproximar de “se eu entender tudo, conseguirei lidar com isso”. A incerteza leva a procurar mais explicações; emoções podem parecer imprecisas ou difíceis de acomodar. Isso pode trazer frustração quando uma questão afetiva não se resolve por um argumento. Compreender é um recurso importante, mas algumas experiências também precisam de tempo, acolhimento e contato com o que se sente.',
    'Na rotina, analisar demais pode adiar uma decisão. Nas relações, oferecer uma solução quando o outro procura escuta pode criar distância, mesmo com boa intenção. Sua própria necessidade de cuidado também pode ficar escondida atrás de explicações. A conversa ganha profundidade quando o raciocínio inclui o impacto da experiência sobre você e sobre quem está perto.',
    'Organizar pela razão pode oferecer previsibilidade quando uma situação parece confusa ou emocionalmente intensa. A análise torna a experiência mais manejável e reduz a sensação de exposição. Como essa maneira de se proteger ganhou importância em sua vida será compreendido com Daiane, a partir da sua história.',
    'Análise, discernimento e capacidade de aprender podem ajudar a construir escolhas consistentes. Use essas forças para incluir também informações do corpo, das emoções e dos vínculos. No planejamento, defina um tempo para analisar e uma ação possível após esse tempo. Uma decisão pode ser suficientemente informada e ainda precisar de ajustes conforme você vive a experiência.',
  ],
  hipervigilante: [
    'Sua atenção pode se organizar em torno de antecipar dificuldades. Você percebe detalhes, considera riscos e procura chegar preparada às situações. Quando a preparação continua mesmo sem uma demanda concreta, a mente permanece de prontidão. Uma mensagem, uma mudança de plano ou uma demora podem abrir muitas interpretações, e concluir uma tarefa nem sempre encerra a sensação de que algo ainda precisa ser acompanhado.',
    'A regra interna pode se aproximar de “se eu prever tudo, não serei pega de surpresa”. A incerteza alimenta novas verificações; uma confirmação pode tranquilizar por pouco tempo antes de surgir outra preocupação. Isso ajuda a compreender a coexistência de competência prática e inquietação interna. Sua atenção segue procurando garantias, mesmo quando parte da situação já está suficientemente encaminhada.',
    'Na rotina, revisar possibilidades pode ocupar o tempo de descanso ou de uma ação simples. Nas relações, checar repetidamente pode ser recebido como desconfiança, enquanto sua intenção é sentir segurança. Quanto mais você tenta eliminar qualquer incerteza, mais detalhes encontra para acompanhar. O planejamento perde sua função de apoio quando passa a exigir vigilância contínua.',
    'Antecipar pode funcionar como proteção contra surpresa, perda de apoio ou sensação de estar despreparada. A mente procura reduzir o que não consegue controlar. Esse movimento mental complementa a leitura das emoções e das respostas corporais; sua presença, sozinha, não estabelece um estado fisiológico nem conta como foi sua infância.',
    'Atenção, prudência e preparação podem apoiar escolhas cuidadosas. Use essas forças para separar riscos concretos de cenários ainda hipotéticos e definir uma preparação suficiente. No planejamento, combine um momento de revisão e um próximo passo, incluindo apoio quando necessário. Reconhecer o que já está seguro permite que sua atenção também fique disponível para presença, prazer e recuperação.',
  ],
  inquieto: [
    'Novidade e movimento podem renovar seu interesse rapidamente. Você percebe alternativas e encontra energia para começar. Quando mudar de foco vira a resposta habitual ao desconforto, continuar em algo menos estimulante fica mais difícil. Uma atividade nova oferece alívio e entusiasmo, mas muitas iniciativas abertas podem deixar pouco espaço para concluir e reconhecer o que foi construído.',
    'A regra interna pode se aproximar de “a próxima coisa vai me fazer sentir melhor”. Tédio, frustração ou uma emoção incômoda podem acelerar a procura por outro assunto. O entusiasmo com o começo convive com impaciência nas etapas repetitivas. Assim, a dificuldade pode estar menos em ter ideias e mais em permanecer quando uma escolha exige continuidade, espera ou contato com sentimentos menos agradáveis.',
    'Na rotina, alternar tarefas pode dispersar energia e multiplicar pendências. Nos vínculos, mudar de assunto ou buscar outra atividade pode interromper conversas importantes. A variedade continua sendo um recurso; o custo aparece quando ela substitui o tempo de elaborar, descansar ou completar. Você pode terminar muito ocupada e sentir pouco avanço no que mais importa.',
    'Buscar estímulos pode oferecer uma saída rápida de experiências desconfortáveis e devolver sensação de vitalidade. Essa proteção traz alívio imediato, mas pode reduzir o espaço para compreender o que estava pedindo atenção. O significado desse movimento em sua história será construído com Daiane.',
    'Curiosidade, criatividade e flexibilidade podem tornar seus objetivos mais interessantes. Use essas forças para variar a forma de executar uma prioridade, preservando a direção escolhida. No planejamento, combine períodos curtos de foco, pausas e um critério de conclusão. É possível criar movimento dentro de um percurso, sem precisar trocar de percurso a cada dificuldade.',
  ],
  comandante: [
    'Tomar a frente pode trazer direção quando uma situação parece incerta. Você decide, organiza e mobiliza pessoas. Quando assumir o controle se torna a principal forma de sentir segurança, esperar, negociar ou depender de alguém pode ficar desconfortável. Resolver rapidamente oferece alívio, mas também concentra em você decisões e responsabilidades que poderiam ser compartilhadas.',
    'A regra interna pode se aproximar de “se eu não conduzir, isso não vai funcionar”. Mudanças inesperadas ou ritmos diferentes podem despertar impaciência e irritação. A firmeza pode encobrir a dificuldade de mostrar dúvida, pedir apoio ou reconhecer que uma situação machucou. Quanto mais urgente parece recuperar o controle, menor pode ficar o espaço para escutar e ajustar a direção.',
    'Na rotina, centralizar pode aumentar seu esforço. Nos vínculos, orientar sem combinar pode ser vivido pelo outro como pressão e reduzir sua participação. Você pode sentir que precisa assumir ainda mais porque as pessoas se afastam ou esperam suas decisões. Liderança com cooperação distribui responsabilidade; controle constante pode criar dependência e alimentar o próprio ciclo de sobrecarga.',
    'Conduzir pode funcionar como proteção diante da incerteza e da vulnerabilidade de precisar dos outros. A ação devolve sensação de influência sobre a situação. A história desse movimento será compreendida com Daiane; firmeza e liderança também podem existir com abertura para apoio e negociação.',
    'Iniciativa, coragem e capacidade de organizar podem ajudar a enfrentar dificuldades. Use essas forças para definir prioridades junto com as pessoas envolvidas e combinar responsabilidades. No planejamento, escolha o que realmente depende de você e onde haverá autonomia para o outro. Sua firmeza também pode servir para comunicar necessidades e pedir ajuda com clareza.',
  ],
  evitativo: [
    'Afastar-se de algo difícil pode oferecer alívio e preservar uma sensação de tranquilidade. Você pode preferir adiar uma conversa, deixar uma decisão para depois ou concordar para não aumentar a tensão. Quando esse caminho se repete, a dificuldade continua presente e ocupa espaço por dentro, mesmo que o ambiente pareça calmo. O alívio do momento pode vir acompanhado de um problema maior mais adiante.',
    'A regra interna pode se aproximar de “se eu esperar, talvez isso se resolva sem conflito”. Ansiedade, desconforto ou receio de desagradar podem tornar uma ação pequena muito pesada. Sua vontade pode ficar pouco visível, e a frustração cresce quando os outros não percebem o que foi silenciado. Preservar a relação e comunicar um limite precisam encontrar espaço na mesma escolha.',
    'Na rotina, adiar pode acumular tarefas e reduzir opções. Nos vínculos, um sim pouco verdadeiro pode gerar expectativas que você não consegue sustentar. Evitar uma conversa também pode impedir reparação e acordos mais claros. Uma pausa oferece cuidado quando ajuda a recuperar condições de voltar; sem um retorno possível, pode prolongar o desconforto.',
    'Evitar pode funcionar como proteção contra uma intensidade que parece difícil de suportar ou contra o risco de ruptura. Criar distância torna o momento mais manejável. Com Daiane, será possível compreender quando essa proteção ajuda e quando começa a limitar suas alternativas, considerando sua história e as condições atuais.',
    'Sua percepção da necessidade de espaço pode apoiar decisões com mais cuidado. Use esse recurso para escolher um ritmo possível e combinar quando retomará o assunto. No planejamento, transforme uma pendência em um passo pequeno, com apoio se necessário. Comunicar um limite de forma clara permite preservar relações sem precisar esconder o que importa para você.',
  ],
  critico: [
    'Perceber falhas pode ajudar a aprender e ajustar uma escolha. Quando a atenção se concentra quase exclusivamente no que falta, acertos passam depressa e erros permanecem. Uma dificuldade deixa de ser um acontecimento específico e pode parecer uma avaliação de todo o seu valor. Mesmo com avanços reais, fica a sensação de que ainda não há motivo suficiente para reconhecer o que foi construído.',
    'A regra interna pode se aproximar de “preciso me cobrar para melhorar”. Comparação, vergonha, culpa ou irritação podem acompanhar esse esforço. A cobrança promete motivação, mas pode tornar começar mais difícil, porque qualquer tentativa parece sujeita a uma avaliação dura. Você gasta energia se defendendo internamente de uma falha, em vez de usá-la para aprender com ela.',
    'Na rotina, isso pode alimentar revisão excessiva, adiamento ou dificuldade de celebrar etapas. Nos vínculos, apontar o que falta antes de reconhecer o que funciona pode tornar a conversa defensiva. A intenção de melhorar perde força quando a crítica fica ampla e pouco concreta. Um problema específico pode ser ajustado; uma condenação de si ou do outro oferece pouca direção.',
    'Cobrar e corrigir podem funcionar como uma tentativa de evitar erros, rejeição ou perda de controle. Antecipar um julgamento parece preparar você para enfrentá-lo. Como essa proteção ganhou espaço será compreendido com Daiane; no presente, importa perceber se a cobrança está ajudando a agir ou apenas aumentando o peso da experiência.',
    'Discernimento, responsabilidade e atenção à qualidade podem apoiar seus objetivos. Use essas forças para identificar um ajuste concreto e reconhecer também o que já funciona. No planejamento, registre avanços junto das dificuldades e escolha uma próxima ação com medida. Aprender pode incluir firmeza e gentileza, sem esperar que todas as circunstâncias estejam perfeitas para viver algo bom agora.',
  ],
}

const titles = [
  'Como esse movimento organiza seu funcionamento',
  'Pensamentos e emoções que ele pode alimentar',
  'Como isso repercute na rotina e nos vínculos',
  'O que esse movimento procura proteger',
  'Como usar suas forças a favor dos seus objetivos',
]

export function buildProtectionPatternReading(
  key: string,
  active: boolean,
  existing?: CerMapElementReading,
): CerMapElementReading | undefined {
  const paragraphs = explanations[key]
  const profile = patternResources[key]
  if (!paragraphs || !profile) return existing
  return {
    summary: '',
    observations: [],
    interpretation: active
      ? ''
      : 'Esta é uma explicação do movimento para ajudar você a compreender o mapa. Ele não aparece como uma dificuldade frequente na leitura atual; conhecer esse funcionamento não o acrescenta à sua lista pessoal.',
    sections: paragraphs.map((text, index) => ({ title: titles[index], text })),
    resources: active ? [profile.strength.join(': ')] : [],
    costs: active ? [profile.difficulty.join(': ')] : [],
    connections: active ? [...(existing?.connections || [])] : [],
    questions: [],
    sourceResponseIds: existing?.sourceResponseIds,
  }
}
