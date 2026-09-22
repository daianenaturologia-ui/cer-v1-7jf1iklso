/**
 * cerProtectionPatternContent.ts
 *
 * Conteúdo autoral dos 10 Padrões de Proteção do Método CER (Camada 2B1).
 *
 * Princípios editoriais e epistêmicos do Método CER:
 * - Direto, firme, acolhedor e lúcido;
 * - Ausência de diagnósticos, transtornos, rótulos ontológicos ("você é assim") ou psicometria;
 * - Ausência de infância inventada ou causas presumidas; todas as funções protetivas
 *   são formuladas como possibilidades a serem investigadas conjuntamente com a
 *   Linha da Vida, a escuta de Daiane e o reconhecimento da própria interagente;
 * - Cuidados especiais:
 *   1. Vítima: nota expressa de que não invalida violências, abusos ou injustiças reais;
 *   2. Hipervigilante: diferenciação entre padrão cognitivo de antecipação e estado fisiológico;
 *   3. Comandante: diferenciação nítida entre liderança saudável e controle protetivo.
 */

export interface CerProtectionPatternContentItem {
  id: string
  canonicalKey: string
  baseName: string
  movementDescription: string
  shortDescription: string
  characteristics: string[]
  commonThoughts: string[]
  associatedFeelings: string[]
  patternLies: string[]
  costToSelf: string[]
  costToRelationships: string[]
  strengths: string[]
  possibleProtectiveFunctions: string
  wakeUpCalls: string[]
  clarificationNote?: string
}

export const CER_PROTECTION_PATTERN_CONTENT: Record<string, CerProtectionPatternContentItem> = {
  insistente: {
    id: 'insistente',
    canonicalKey: 'insistente',
    baseName: 'Insistente',
    movementDescription: 'Buscar fazer tudo do jeito certo',
    shortDescription:
      'Quando esse padrão assume o comando, a busca legítima por excelência, ordem e organização é empurrada para a exigência de perfeição inegociável. Há uma vigilância constante sobre procedimentos, prazos e padrões de conduta, transformando o senso de responsabilidade em sobrecarga e controle contínuo sobre tudo o que está ao redor.',
    characteristics: [
      'Preocupação constante com detalhes, regras, métodos e ordem.',
      'Dificuldade expressiva para delegar tarefas ou aceitar formas de execução diferentes da sua.',
      'Tendência a revisar repetidamente o que já foi concluído para garantir ausência total de falhas.',
      'Sensação de que o descanso só é merecido quando tudo estiver absolutamente terminado e impecável.',
      'Inflexibilidade com desvios de rota, improvisos ou pequenos descuidos próprios e alheios.',
    ],
    commonThoughts: [
      'Se eu não fizer ou conferir pessoalmente, não vai sair com a qualidade necessária.',
      'Existe uma maneira correta de conduzir isso e os outros parecem negligentes.',
      'Um único erro põe a perder todo o valor do trabalho que realizei.',
      'Não posso descansar enquanto houver qualquer ponta solta ou desordem.',
      'As pessoas deveriam ser mais comprometidas e atentas ao que fazem.',
    ],
    associatedFeelings: [
      'Tensão corporal constante e dificuldade de relaxamento físico.',
      'Irritação silenciosa ou explícita diante de desorganização e atrasos.',
      'Frustração persistente quando as coisas fogem do padrão esperado.',
      'Medo subjacente de crítica, repreensão ou julgamento negativo.',
      'Cansaço profundo decorrente de manter padrões intransigentes.',
    ],
    patternLies: [
      'Se eu relaxar ou abrir mão da vigilância, tudo ao meu redor vai desmoronar.',
      'Só posso descansar em paz quando absolutamente tudo estiver resolvido e sem falhas.',
      'Minha cobrança contínua é a única coisa que garante a qualidade e a segurança das coisas.',
      'Fazer diferente do meu método é sinal de desleixo ou incompetência.',
    ],
    costToSelf: [
      'Esgotamento físico e mental por assumir responsabilidades em excesso sem pausas.',
      'Dificuldade crônica de celebrar conquistas e reconhecer o que já está suficientemente bom.',
      'Rigidez postural, dores musculares e acúmulo de tensão na mandíbula, pescoço e ombros.',
      'Perda de espaço para a espontaneidade, o prazer despretensioso e o brincar.',
    ],
    costToRelationships: [
      'Pessoas próximas podem se sentir constantemente cobradas, julgadas ou incapazes de agradar.',
      'Dificuldade para construir parcerias reais, já que a autonomia dos outros é podada pela conferência contínua.',
      'Ambiente doméstico ou de trabalho carregado por uma atmosfera de exigência e vigilância.',
      'Distanciamento afetivo quando as interações passam a girar apenas em torno de deveres e correções.',
    ],
    strengths: [
      'Elevado senso de responsabilidade, integridade ética e compromisso com a palavra dada.',
      'Notável capacidade de organização, planejamento e estruturação de rotinas eficientes.',
      'Atenção refinada aos detalhes e dedicação genuína à qualidade do que entrega.',
      'Persistência e consistência para concluir processos complexos sem abandonar o percurso.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, manter tudo sob rigorosa ordem e padrão elevado pode funcionar como uma tentativa de buscar previsibilidade e conter o caos ao redor. Pode ter ajudado a pessoa a evitar críticas duras, repreensões, rejeição ou desorganização em ambientes em que falhar parecia perigoso demais. Uma possibilidade a ser investigada no processo é como a busca pelo correto tentou garantir segurança e aceitação.',
    wakeUpCalls: [
      'Excelência não exige perfeição: o suficientemente bom permite a vida fluir e o descanso acontecer.',
      'Responsabilidade não significa assumir tudo sobre as próprias costas.',
      'Fazer diferente não significa fazer errado; existem múltiplos caminhos válidos.',
      'Descanso não é negligência nem recompensa condicional: é uma necessidade biológica e humana.',
    ],
  },

  prestativo: {
    id: 'prestativo',
    canonicalKey: 'prestativo',
    baseName: 'Prestativo',
    movementDescription: 'Cuidar das pessoas e deixar as próprias necessidades para depois',
    shortDescription:
      'Quando esse padrão assume o comando, a empatia genuína e a generosidade são distorcidas em autoabandono sistemático. A pessoa antecipa os desejos e carências dos outros, oferecendo suporte contínuo mesmo exausta, enquanto silencia as próprias vontades na expectativa velada de garantir vínculo, afeto e valor.',
    characteristics: [
      'Dificuldade extrema em dizer "não" a pedidos alheios, mesmo sem tempo ou energia.',
      'Tendência a monitorar as necessidades emocionais e práticas dos outros antes de checar as suas.',
      'Desconforto profundo em expressar vontades próprias ou pedir ajuda quando está sobrecarregada.',
      'Sensação de que o próprio valor na relação depende da utilidade prática e do quanto se doa.',
      'Ressentimento silencioso que se acumula quando a dedicação constante não é notada ou retribuída.',
    ],
    commonThoughts: [
      'Se eu não ajudar agora, a pessoa vai sofrer ou se decepcionar comigo.',
      'Minhas necessidades podem esperar; os outros estão precisando mais neste momento.',
      'Se eu colocar limites ou recusar, posso ser vista como alguém egoísta ou fria.',
      'Eu cuido de todo mundo, mas quando eu preciso, quase ninguém percebe.',
      'Preciso ser indispensável para garantir que as pessoas queiram ficar perto de mim.',
    ],
    associatedFeelings: [
      'Sensação difusa de esvaziamento, cansaço e falta de energia própria.',
      'Culpa intensa ou ansiedade quando tenta descansar ou colocar um limite claro.',
      'Mágua e ressentimento reprimidos pela falta de reciprocidade percebida.',
      'Medo subjacente de rejeição, abandono ou de se tornar descartável.',
      'Orgulho sutil de ser a pessoa generosa e disponível que segura o mundo dos outros.',
    ],
    patternLies: [
      'Se eu não for útil e acolhedora o tempo todo, ninguém vai ter motivos para me amar.',
      'Colocar as minhas vontades em primeiro lugar é egoísmo imperdoável.',
      'Os outros deveriam adivinhar do que eu preciso da mesma forma que eu adivinho o que eles precisam.',
      'Eu dou conta de tudo e não preciso de cuidados.',
    ],
    costToSelf: [
      'Autoabandono físico e emocional crônico, com negligência de sono, saúde e desejos pessoais.',
      'Perda gradual da clareza sobre o que realmente deseja, pensa e sente de forma autônoma.',
      'Sobrecarga constante por assumir problemas, urgências e responsabilidades que não são suas.',
      'Sensação de solidão existencial, mesmo cercada por pessoas que dependem da sua ajuda.',
    ],
    costToRelationships: [
      'Relações que se desequilibram em dinâmicas de dependência e infantilização do outro.',
      'Explosões de mágoa acumulada que surpreendem quem convive, gerando ruído e culpa mútua.',
      'Dificuldade de intimidade real, pois o outro nunca conhece as vulnerabilidades e limites de quem só doa.',
      'Sensação velada de cobrança moral sobre as pessoas atendidas, que sentem uma dívida implícita.',
    ],
    strengths: [
      'Generosidade profunda, sensibilidade interpessoal e capacidade acolhedora refinada.',
      'Habilidade natural para criar ambientes calorosos, seguros e agregadores.',
      'Empatia aguçada e talento genuíno para perceber o que sustenta o bem-estar comunitário.',
      'Lealdade e disposição para apoiar pessoas queridas em momentos de dor concreta.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, colocar as carências alheias acima de si pode ter ajudado a manter laços indispensáveis e afastar o risco de abandono ou conflito. Pode funcionar como uma tentativa de conquistar segurança emocional sendo indispensável, em contextos em que expressar necessidades próprias trazia repreensão, frieza ou ruptura. Uma possibilidade a ser investigada no processo é a de que cuidar do outro tenha sido a rota encontrada para buscar conexão e proteção.',
    wakeUpCalls: [
      'Cuidar de si com firmeza não é egoísmo: é a única base que sustenta o cuidado sustentável.',
      'Limites claros protegem as relações em vez de afastá-las.',
      'Amar alguém não significa tentar adivinhar ou resolver todos os incômodos dessa pessoa.',
      'Você tem direito de existir, descansar e ser amada sem precisar pagar pedagio de utilidade contínua.',
    ],
  },

  hiper_realizador: {
    id: 'hiper_realizador',
    canonicalKey: 'hiper_realizador',
    baseName: 'Hiper-realizador',
    movementDescription: 'Buscar valor por meio da produtividade e das conquistas',
    shortDescription:
      'Quando esse padrão assume o comando, a realização saudável é substituída por uma necessidade ininterrupta de comprovar valor pessoal por meio de produtividade, metas alcançadas, status e imagem de competência. O descanso é sentido como ameaça ou perda de tempo, e o afeto parece estar sempre condicionado ao último sucesso registrado.',
    characteristics: [
      'Foco obsessivo em metas, desempenho, eficiência e visibilidade de resultados.',
      'Tendência a avaliar o valor de um dia apenas pelo volume de entregas e tarefas cumpridas.',
      'Dificuldade de desfrutar vitórias: a comemoração dura instantes antes de mirar a próxima conquista.',
      'Preocupação marcante com a imagem pública de pessoa bem-sucedida, ativa e competente.',
      'Tendência a suprimir sentimentos que possam interferir no ritmo produtivo ou parecer fraqueza.',
    ],
    commonThoughts: [
      'Eu sou o que eu entrego; se eu desacelerar, deixo de ter valor.',
      'Não posso perder tempo com pausas inúteis quando há tanta coisa a construir.',
      'Preciso manter o ritmo para que ninguém duvide da minha capacidade.',
      'Emoções e dilemas pessoais só atrapalham o foco nos objetivos concretos.',
      'O que passou já foi feito; o que realmente importa é o próximo resultado.',
    ],
    associatedFeelings: [
      'Ansiedade basal e inquietação quando não há um projeto ou meta em andamento.',
      'Vazio emocional logo após grandes realizações, com necessidade rápida de novos estímulos.',
      'Medo subjacente de mediocridade, invisibilidade, fracasso ou desaprovação social.',
      'Pressão interna incessante e intolerância à sensação de estagnação.',
      'Desconexão com a própria sensibilidade afetiva e com o cansaço do corpo.',
    ],
    patternLies: [
      'Seu valor como ser humano depende exclusivamente dos seus sucessos e da sua utilidade.',
      'Parar para descansar é abrir mão da sua relevância e do seu futuro.',
      'Demonstrar cansaço ou vulnerabilidade afasta o respeito e a admiração dos outros.',
      'A felicidade real virá assim que o próximo grande marco for finalmente atingido.',
    ],
    costToSelf: [
      'Risco elevado de esgotamento profissional (burnout) e perda de vitalidade orgânica.',
      'Sensação crônica de vazio interior que nenhum troféu ou elogio consegue preencher por muito tempo.',
      'Atrofia da vida interior, da imaginação lúdica e do prazer que não rende frutos mensuráveis.',
      'Desconhecimento de quem se é quando despojada de papéis profissionais ou títulos.',
    ],
    costToRelationships: [
      'Relações íntimas tratadas com a mesma lógica pragmática de agenda, prazos e eficiência.',
      'Pouca disponibilidade de presença afetiva e de escuta desinteressada com familiares e amizades.',
      'Pessoas próximas podem se sentir invisíveis ou comparadas com padrões rígidos de produtividade.',
      'Dificuldade de compartilhar fragilidades reais, mantendo uma fachada inabalável que bloqueia a intimidade.',
    ],
    strengths: [
      'Energia realizadora admirável, disciplina, foco em metas e capacidade de materialização.',
      'Habilidade para motivar grupos, destravar impasses práticos e gerar impacto tangível.',
      'Resiliência pragmática diante de obstáculos objetivos e orientação clara para soluções.',
      'Capacidade de aprender rapidamente novos repertórios quando orientada para o crescimento.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, destacar-se por realizações concretas pode ter ajudado a conquistar atenção, validação ou proteção em cenários onde o afeto parecia condicionado ao sucesso. Pode funcionar como uma tentativa de blindar o senso de segurança pessoal contra sentimentos de vulnerabilidade, desvalor ou invisibilidade. Uma possibilidade a ser investigada no processo é como a corrida produtiva tentou assegurar um chão firme onde pisar.',
    wakeUpCalls: [
      'Você é um ser humano com valor intrínseco, não um relatório trimestral de resultados.',
      'Realizar com saúde é diferente de precisar provar o próprio direito de existir a cada hora.',
      'O descanso profundo não subtrai valor ao seu percurso: ele renova a sua capacidade de criar.',
      'Quem ama você de verdade quer a sua presença viva, não apenas a sua performance.',
    ],
  },

  vitima: {
    id: 'vitima',
    canonicalKey: 'vitima',
    baseName: 'Vítima',
    movementDescription: 'Perder o senso de escolha ou potência diante das dificuldades',
    shortDescription:
      'Quando esse padrão assume o comando, a pessoa é tragada para uma sensação profunda de impotência, paralisia e isolamento na própria dor. As dificuldades reais da vida passam a ser percebidas como fatalidades imutáveis direcionadas contra si, drenando a clareza sobre recursos próprios, escolhas possíveis e caminhos de enfrentamento autônomo.',
    characteristics: [
      'Foco concentrado na injustiça das circunstâncias e na falta de apoio externo.',
      'Dificuldade para identificar ações práticas que estejam sob sua própria governança.',
      'Tendência a dramatizar ou remoer mágoas passadas como explicação definitiva do presente.',
      'Sensação de que o sofrimento pessoal é incompreensível ou desconsiderado pelas pessoas ao redor.',
      'Recusa sutil ou descarte rápido de sugestões de soluções, mantendo o apego à queixa.',
    ],
    commonThoughts: [
      'Por que essas coisas só acontecem comigo enquanto a vida dos outros é mais leve?',
      'Não adianta nem tentar intervir, porque no final nada vai mudar mesmo.',
      'Ninguém compreende a gravidade do que eu passo ou se importa de verdade.',
      'Eu fiz de tudo, mas as pessoas e as circunstâncias sempre me sabotam.',
      'Sou a pessoa que sempre perde ou que fica com a parte mais pesada.',
    ],
    associatedFeelings: [
      'Tristeza pesada, melancolia e sensação persistente de desamparo.',
      'Ressentimento com o mundo e amargura diante da aparente facilidade alheia.',
      'Solidão existencial profunda e sentimento de desvalia pessoal.',
      'Apatia, perda de tônus vital e desânimo para iniciar mudanças.',
      'Alívio fugaz ao receber acolhimento centrado unicamente na compaixão pela sua dor.',
    ],
    patternLies: [
      'Você não tem nenhuma escolha, força ou responsabilidade diante do que está acontecendo.',
      'A única forma de receber afeto e atenção das pessoas é através da exposição do seu sofrimento.',
      'Tentar agir só vai gerar mais frustração e provar que as coisas não funcionam para você.',
      'O mundo tem uma dívida impagável com a sua dor.',
    ],
    costToSelf: [
      'Paralisia do crescimento pessoal e renúncia tácita da própria capacidade de agir no mundo.',
      'Cronificação de estados de tristeza e perda contínua de autoconfiança e iniciativa.',
      'Desperdício de tempo e energia psíquica em lamentações que não movem a realidade.',
      'Sensação de ser refém perpétua do humor alheio ou do acaso desfavorável.',
    ],
    costToRelationships: [
      'Esgotamento emocional das pessoas próximas, que se sentem impotentes para ajudar ou alegrar.',
      'Relações marcadas por um desnível constante, onde o outro é colocado no papel de salvador.',
      'Afastamento gradativo de pessoas queridas que não toleram mais a atmosfera de queixa contínua.',
      'Dificuldade para construir parcerias baseadas em potência mútua, alegria e coautoria.',
    ],
    strengths: [
      'Sensibilidade emocional refinada e conexão profunda com as dores da condição humana.',
      'Capacidade de empatia sincera com quem atravessa sofrimentos reais e silenciados.',
      'Expressividade artística, poética ou reflexiva sobre as camadas mais sutis da experiência.',
      'Autenticidade para não maquiar o desconforto em ambientes superficiais.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, recolher-se em uma posição de desamparo pode ter funcionado como o único recurso disponível para sinalizar exaustão extrema e solicitar cuidado ou trégua. Pode ter ajudado a evitar cobranças desmedidas ou conflitos perigosos em contextos nos quais agir de forma afirmativa trazia punição ou retaliação. Uma possibilidade a ser investigada no processo é como a entrega da própria potência buscou proteger a pessoa de demandas insuportáveis.',
    wakeUpCalls: [
      'Reconhecer sua dor não significa abrir mão da sua capacidade de escolher o próximo passo.',
      'Você não precisa sofrer para merecer escuta, respeito, carinho e acolhimento.',
      'Mesmo em cenários difíceis, sempre existe uma faixa real de ação que pertence exclusivamente a você.',
      'Sair da paralisia não é negar o que doeu, mas honrar a sua própria vida agora.',
    ],
    clarificationNote:
      'O padrão Vítima não invalida situações reais de violência, abuso, abandono, desigualdade ou injustiça. Aqui, o nome descreve momentos em que a pessoa perde o acesso à própria potência e passa a perceber poucas possibilidades de escolha ou ação.',
  },

  hiper_racional: {
    id: 'hiper_racional',
    canonicalKey: 'hiper_racional',
    baseName: 'Hiper-racional',
    movementDescription: 'Compreender e resolver tudo principalmente pela razão',
    shortDescription:
      'Quando esse padrão assume o comando, a inteligência e a capacidade analítica são mobilizadas como uma armadura para se afastar da imprevisibilidade emocional. A pessoa busca dissecar sentimentos, relações e conflitos por meio da pura lógica e do distanciamento crítico, sentindo desconforto diante de manifestações afetivas espontâneas ou desordenadas.',
    characteristics: [
      'Tendência a intelectualizar emoções em vez de senti-las e acolhê-las no corpo.',
      'Impaciência velada com comportamentos alheios percebidos como irracionais, caóticos ou dramáticos.',
      'Preferência por debates conceituais, dados e lógica formal em detrimento de conversas sobre sentimentos.',
      'Comportamento contido, com fala calculada e aparente indiferença diante de comoções grupais.',
      'Necessidade de entender as razões por trás de tudo antes de se permitir qualquer envolvimento afetivo.',
    ],
    commonThoughts: [
      'Se analisarmos os fatos com precisão lógica, essa comoção toda se revela desnecessária.',
      'Expressões emocionais exageradas só servem para turvar a clareza das soluções.',
      'Não faz nenhum sentido lógico agir dessa maneira nem se abalar tanto.',
      'Preciso manter o controle intelectual da situação para não ser levada pelo caos.',
      'Minha mente lúcida é o único refúgio seguro quando o ambiente fica confuso.',
    ],
    associatedFeelings: [
      'Sensação de isolamento e frieza, com desconexão dos sinais do próprio corpo.',
      'Desconforto, estranhamento ou desdém velado diante da vulnerabilidade afetiva alheia.',
      'Ansiedade silenciosa quando colocada em situações em que a lógica não resolve a questão.',
      'Medo subjacente de ser dominada, desestruturada ou invadida pelas próprias emoções.',
      'Sensação de superioridade cognitiva que na verdade esconde uma fragilidade de contato.',
    ],
    patternLies: [
      'As emoções são perigosas, enganosas e uma perda lamentável de tempo e lucidez.',
      'Você só está verdadeiramente segura e no controle quando compreende tudo racionalmente.',
      'Mostrar afeto, carência ou dúvida sobre si mesma é expor um flanco desnecessário para o outro.',
      'A inteligência pura é suficiente para construir e sustentar a vida inteira.',
    ],
    costToSelf: [
      'Empobrecimento da experiência viva, que fica confinada ao reino dos conceitos abstratos.',
      'Dificuldade profunda de acolher o próprio luto, o medo, a ternura e a alegria descomplicada.',
      'Cansaço mental agudo decorrente de manter o cérebro operando ininterruptamente como sentinela.',
      'Desconexão crônica da intuição corporal, das sensações víscerais e do prazer sensorial.',
    ],
    costToRelationships: [
      'Pessoas próximas sentem-se tratadas como objetos de análise clínica ou laboratorial em vez de parceiras.',
      'Frieza percebida que desestimula a partilha sincera e esfria os laços conjugais e familiares.',
      'Conversas difíceis transformadas em tribunais conceituais, onde a razão ganha e a intimidade perde.',
      'Incapacidade de oferecer validação empática simples a quem só precisa de presença acolhedora.',
    ],
    strengths: [
      'Extraordinária capacidade analítica, clareza mental e pensamento estruturado.',
      'Habilidade para manter o discernimento e a calma em cenários de alta pressão e incerteza.',
      'Raciocínio lógico refinado para diagnosticar problemas complexos e propor rotas coerentes.',
      'Honestidade intelectual e interesse autêntico pela verdade factual e pela coerência.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, refugiar-se na razão e na análise pode ter funcionado como um escudo potente contra ambientes caóticos, desregulados ou invasivos. Pode ter ajudado a manter o domínio de si em contextos nos quais sentir abertamente provocava dor insuportável, humilhação ou desamparo emocional. Uma possibilidade a ser investigada no processo é como o raciocínio frio ofereceu um território ordenado para sobreviver ao turbilhão.',
    wakeUpCalls: [
      'A inteligência é uma potência admirável, mas a razão pura não abraça uma dor nem vive um amor.',
      'Emoções não são falhas lógicas do sistema: são sinais biológicos essenciais para a orientação na vida.',
      'Permitir-se sentir não anula a sua lucidez, apenas a torna humana e completa.',
      'Na intimidade das relações, quem precisa sempre ter razão costuma ficar sem conexão.',
    ],
  },

  hipervigilante: {
    id: 'hipervigilante',
    canonicalKey: 'hipervigilante',
    baseName: 'Hipervigilante',
    movementDescription: 'Antecipar constantemente o que pode dar errado',
    shortDescription:
      'Quando esse padrão assume o comando, a mente opera como um radar ininterrupto sintonizado na identificação prévia de perigos, erros, traições ou imprevistos. Trata-se de um padrão cognitivo de antecipação contínua de cenários adversos, que projeta planos de contingência exaustivos e mantém o foco fixado no que pode falhar, impedindo a pessoa de habitar a tranquilidade do momento presente.',
    characteristics: [
      'Mapeamento incessante de riscos potenciais em ambientes, planos de trabalho e relacionamentos.',
      'Criação mental sistemática de cenários catastróficos e das respectivas estratégias de defesa.',
      'Dificuldade marcante para confiar na espontaneidade dos outros ou no desenrolar natural dos fatos.',
      'Necessidade de revisar combinações, checar detalhes e verificar intenções subjacentes.',
      'Ceticismo diante de momentos de paz ou estabilidade, interpretados como a calma antes da tempestade.',
    ],
    commonThoughts: [
      'Se eu me descuidar por um instante sequer, o pior vai fatalmente acontecer.',
      'As pessoas são desatentas demais; preciso continuar atenta a cada sinal suspeito.',
      'Essa tranquilidade toda é ilusória; algo errado está prestes a se manifestar.',
      'Preciso antever todas as variáveis possíveis para não ser pega desprevenida.',
      'Confiar cegamente é a maneira mais rápida de se machucar ou ser prejudicada.',
    ],
    associatedFeelings: [
      'Apreensão difusa constante e estado de alarme mental ininterrupto.',
      'Dificuldade severa para desacelerar a cadeia de pensamentos e desfrutar do descanso.',
      'Medo subjacente de vulnerabilidade, desamparo, perigo iminente ou perda de sustentação.',
      'Sobrecarga psíquica por carregar a previsão de todas as catástrofes imagináveis.',
      'Cansaço profundo gerado pela vigília crônica do pensamento.',
    ],
    patternLies: [
      'A sua preocupação contínua e a sua ansiedade antecipatória são o que mantêm as pessoas a salvo.',
      'O perigo é iminente e constante em qualquer situação onde não haja controle pleno.',
      'Se você relaxar a guarda, a surpresa será devastadora e você não terá como reagir.',
      'A desconfiança preventiva é a forma mais sensata e madura de lidar com o mundo.',
    ],
    costToSelf: [
      'Esgotamento neuropsíquico agudo devido ao fluxo ininterrupto de alertas mentais de perigo.',
      'Incapacidade de usufruir de momentos de sossego, lazer genuíno e desfrute corporal.',
      'Piora na qualidade do sono por dificuldade em desligar os circuitos mentais de prontidão.',
      'Perda de oportunidades valiosas por aversão excessiva a riscos corriqueiros e necessários.',
    ],
    costToRelationships: [
      'Clima de desconfiança e tensão transferido para quem convive, gerando sensação de sufocamento.',
      'Pessoas próximas sentem-se permanentemente vigiadas, postas à prova ou duvidadas em sua boa-fé.',
      'Conflitos desgastantes motivados por previsões catastróficas que nunca chegam a se concretizar.',
      'Dificuldade para relaxar em parceria, transformando passeios e projetos conjuntos em exercícios de contenção.',
    ],
    strengths: [
      'Aguda percepção de contexto, perspicácia situacional e senso de responsabilidade preventiva.',
      'Excelente capacidade de identificar vulnerabilidades reais em projetos complexos e corrigi-las.',
      'Cuidado genuíno com a proteção de pessoas queridas e com a preservação de bens comuns.',
      'Prontidão e capacidade de resposta estruturada quando crises concretas de fato acontecem.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, antecipar incansavelmente o pior cenário pode ter funcionado como um mecanismo cognitivo crucial para evitar ser pega indefesa por acontecimentos dolorosos ou rupturas bruscas. Pode ter ajudado a pessoa a sentir alguma margem de manobra em ambientes imprevisíveis, hostis ou voláteis. Uma possibilidade a ser investigada no processo é como o hábito de vigiar os riscos tentou criar uma ilusão de segurança mental.',
    wakeUpCalls: [
      'Antecipar desastres em pensamento não evita que imprevistos ocorram, apenas rouba a sua paz hoje.',
      'Você desenvolveu recursos reais de maturidade e saberá lidar com os desafios se e quando eles vierem.',
      'A maior parte das catástrofes que sua mente ensaia nunca chega a acontecer.',
      'Viver em prontidão perpétua não é cautela sábia: é um preço pesado demais para pagar por uma falsa sensação de controle.',
    ],
    clarificationNote:
      'O padrão Hipervigilante abordado aqui diz respeito a uma estratégia cognitiva e mental de antecipação recorrente de riscos e desfechos desfavoráveis. Ele se diferencia do estado fisiológico de hipervigilância decorrente de ativação autonômica involuntária, cuja investigação pertence à dimensão de Regulação e Padrões de Resposta.',
  },

  inquieto: {
    id: 'inquieto',
    canonicalKey: 'inquieto',
    baseName: 'Inquieto',
    movementDescription: 'Manter-se ocupado, mudar de foco ou buscar estímulos',
    shortDescription:
      'Quando esse padrão assume o comando, a vitalidade, a criatividade e a curiosidade naturais são capturadas por uma urgência constante de novidade, movimento e múltiplos estímulos simultâneos. A mente pula de uma ideia ou atividade para outra para evitar o silêncio, a rotina, o tédio e o contato com sensações de desconforto emocional profundo.',
    characteristics: [
      'Iniciação constante de projetos, cursos, planos e viagens, com pouca persistência para sustentá-los até o fim.',
      'Intolerância marcante à monotonia, à repetição de rotinas e aos momentos de lentidão.',
      'Busca incessante por novidades, compras, planos futuros e experiências excitantes.',
      'Dificuldade expressiva para permanecer quieta em silêncio ou tolerar o vazio de uma agenda aberta.',
      'Hábito de preencher lacunas de tempo com telas, mensagens, conversas rápidas ou novas tarefas.',
    ],
    commonThoughts: [
      'A vida é curta demais para ficar presa a uma coisa só ou a processos lentos.',
      'Preciso de movimento, novidade e entusiasmo agora, senão sinto que estou murchando.',
      'Se eu me aprofundar demais nisso ou ficar parada, vou cair em uma angústia sem fim.',
      'Já entendi o conceito geral; agora quero partir logo para o próximo desafio interessante.',
      'Essa rotina está insuportável; preciso inventar algo novo imediatamente.',
    ],
    associatedFeelings: [
      'Agitação interna persistente e comichão por novas atividades estimulantes.',
      'Medo subjacente de privação, dor, tédio, perda de oportunidades ou vazio interior.',
      'Frustração rápida quando os processos exigem persistência, paciência ou tarefas mecânicas.',
      'Sensação de dispersão e cansaço difuso por estar sempre correndo atrás do próximo estímulo.',
      'Dificuldade em saborear o contentamento calmo e estável.',
    ],
    patternLies: [
      'Se você parar quieta ou desacelerar, uma dor ou vazio intolerável vai engolir você.',
      'A plenitude e a verdadeira felicidade estão sempre na próxima experiência, nunca no que já está aqui.',
      'Comprometer-se a fundo com algo ou alguém é uma armadilha que rouba a sua liberdade.',
      'Estar ocupada e eufórica é o único sinal genuíno de que você está viva.',
    ],
    costToSelf: [
      'Superficialidade forçada: talentos brilhantes que não amadurecem por falta de permanência e enraizamento.',
      'Esgotamento por sobrecarga de estímulos e dispersão contínua de foco e energia.',
      'Incapacidade de processar lutos, dores e frustrações inevitáveis da existência, acumulando sombras internas.',
      'Sensação tardia de ter vivido correndo sem construir bases sólidas ou desfrutar de nada em profundidade.',
    ],
    costToRelationships: [
      'Pessoas próximas sentem dificuldade de criar intimidade estável e sentem a pessoa sempre de partida.',
      'Relacionamentos desestabilizados pela exigência constante de empolgação e aversão à rotina compartilhada.',
      'Tendência a quebrar combinados práticos ou negligenciar compromissos quando perdem o encanto inicial.',
      'Impaciência com o ritmo mais calmo, reflexivo ou processual de companheiros e amigos.',
    ],
    strengths: [
      'Entusiasmo contagiante, mente inventiva, capacidade de inovação e vivacidade luminosa.',
      'Talento para enxergar conexões inusitadas, abrir caminhos e injetar otimismo em grupos.',
      'Espírito explorador, abertura para o aprendizado e versatilidade diante de mudanças.',
      'Habilidade para celebrar a vida e convidar as pessoas ao movimento e à descoberta.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, manter-se em perpétuo movimento e buscar estímulos atraentes pode ter funcionado como uma estratégia vital para escapar de climas emocionais sufocantes, dolorosos ou angustiantes. Pode ter ajudado a manter a esperança e o ânimo em contextos nos quais permanecer quieta significava confrontar o desamparo ou a tristeza desamparada. Uma possibilidade a ser investigada no processo é como a agitação tentou defender a pessoa da dor do recolhimento.',
    wakeUpCalls: [
      'Aprofundar não significa aprisionar: os tesouros mais preciosos da vida exigem permanência para florescer.',
      'O silêncio e o tédio não são abismos: são férteis intervalos de digestão e descanso da alma.',
      'Você não precisa fugir do desconforto passageiro para ter segurança e bem-estar.',
      'A verdadeira liberdade não é o consumo compulsivo de novidades, mas a escolha lúcida de onde fincar raízes.',
    ],
  },

  comandante: {
    id: 'comandante',
    canonicalKey: 'comandante',
    baseName: 'Comandante',
    movementDescription: 'Assumir o controle para reduzir incerteza ou vulnerabilidade',
    shortDescription:
      'Quando esse padrão assume o comando, a capacidade legítima de liderança, firmeza e iniciativa é sequestrada pela necessidade de controlar pessoas, cenários e decisões. O padrão impõe sua vontade de maneira peremptória, rejeitando qualquer traço de fraqueza própria ou alheia, numa tentativa imperiosa de reduzir a incerteza e afastar o risco de ser submetido, desrespeitado ou vulnerabilizado.',
    characteristics: [
      'Postura impositiva, assertividade que facilmente beira a intimidação ou o atropelo do outro.',
      'Tendência a assumir a liderança à força quando percebe hesitação ou lentidão nas decisões alheias.',
      'Dificuldade profunda em demonstrar dúvida, tristeza, insegurança ou fragilidade pessoal.',
      'Foco direto na autoridade prática e impaciência com rodeios, justificativas ou fraquezas.',
      'Reação imediata de confronto diante de qualquer percepção de desafio à sua autonomia ou controle.',
    ],
    commonThoughts: [
      'Se eu não tomar a frente com firmeza implacável, ninguém vai resolver nada.',
      'Neste mundo, ou você comanda ou é comandada; não vou deixar ninguém me dominar.',
      'Pessoas que hesitam demais precisam de alguém que decida por elas sem sentimentalismo.',
      'Mostrar fraqueza é entregar o jogo nas mãos dos outros.',
      'Minha dureza é necessária para proteger o que é importante e garantir que tudo funcione.',
    ],
    associatedFeelings: [
      'Irritação rápida e explosiva diante de passividade, incompetência ou insubordinação percebida.',
      'Sensação de que o mundo é um campo de forças em que só a força garante o respeito.',
      'Medo inconsciente e rejeitado de ser controlada, humilhada, ferida ou vulnerabilizada.',
      'Solidão defensiva decorrente da posição de comandante solitária que tudo sustenta.',
      'Adrenalina e satisfação combativa ao enfrentar impasses de frente.',
    ],
    patternLies: [
      'Apenas o controle rígido e a demonstração contínua de força protegem você contra a humilhação.',
      'Vulnerabilidade, ternura e dúvida são defeitos perigosos que devem ser extirpados.',
      'As pessoas só funcionam e respeitam limites sob pressão direta e comando enérgico.',
      'Se você baixar a guarda por um instante, vão se aproveitar de você e tomar o seu espaço.',
    ],
    costToSelf: [
      'Isolamento emocional severo: ninguém se aproxima verdadeiramente de quem nunca se desarma.',
      'Sobrecarga física decorrente de sustentar uma couraça de invulnerabilidade e confronto crônico.',
      'Bloqueio do acesso aos próprios sentimentos ternos, à delicadeza e à necessidade legítima de apoio.',
      'Constrição da respiração e endurecimento muscular acentuado nas costas, peito e mandíbula.',
    ],
    costToRelationships: [
      'Ambiente interpessoal intimidatório, em que as pessoas silenciam divergências por receio de retaliação.',
      'Relações que se polarizam em submissão ressentida ou em rebeliões desgastantes.',
      'Dificuldade para experimentar companheirismo simétrico, baseado em respeito mútuo e negociação fluida.',
      'Pessoas queridas sentem-se desconsideradas em seus sentimentos, como se suas vozes fossem atropeladas.',
    ],
    strengths: [
      'Coragem admirável para enfrentar crises, romper inércias e defender causas legítimas.',
      'Capacidade de liderança, poder de decisão sob pressão e proteção vigorosa dos seus.',
      'Franqueza límpida, ausência de falsidade e habilidade para colocar questões cruciais à mesa.',
      'Capacidade de abrir caminhos práticos onde outros recuam amedrontados.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, assumir uma postura forte, impositiva e controladora pode ter sido a única salvaguarda eficiente contra ambientes injustos, caóticos ou abusivos. Pode ter ajudado a pessoa a garantir sua sobrevivência emocional e integridade física em cenários nos quais mostrar fragilidade resultava em dano direto ou desrespeito. Uma possibilidade a ser investigada no processo é como a armadura do comando buscou proteger um núcleo vulnerável contra a invasão.',
    wakeUpCalls: [
      'Liderança autêntica não é dominação nem atropelo: ela inspira, escuta e inclui a força dos outros.',
      'A verdadeira força humana inclui a coragem de desarmar a couraça e acolher a própria vulnerabilidade.',
      'Você não precisa lutar ou controlar o tempo todo para ser respeitada e ouvida.',
      'Permitir que os outros cuidem de você e decidam juntos não diminui o seu valor nem a sua autoridade.',
    ],
    clarificationNote:
      'É indispensável diferenciar liderança saudável de controle defensivo. A liderança madura organiza processos, estimula a autonomia e considera genuinamente as pessoas ao redor; o padrão Comandante, por sua vez, atua como um escudo que tenta reduzir a vulnerabilidade e a incerteza impondo a sua vontade a qualquer custo.',
  },

  evitativo: {
    id: 'evitativo',
    canonicalKey: 'evitativo',
    baseName: 'Evitativo',
    movementDescription: 'Evitar desconfortos, conflitos, decisões ou emoções difíceis',
    shortDescription:
      'Quando esse padrão assume o comando, a busca compreensível por paz, harmonia e estabilidade é confundida com a esquiva ativa de conversas desconfortáveis, decisões necessárias e conflitos inevitáveis. A pessoa concorda externamente, adia posicionamentos cruciais e anestesia as próprias opiniões para não perturbar a calma aparente, sacrificando sua própria verdade no altar de uma tranquilidade ilusória.',
    characteristics: [
      'Procrastinação de decisões importantes ou de conversas delicadas que possam suscitar atritos.',
      'Tendência a minimizar problemas sérios dizendo que "não é nada demais" ou que "tudo se ajeita sozinho".',
      'Hábito de concordar verbalmente com os outros mesmo discordando por dentro, para encerrar o tema.',
      'Fuga de conversas tensas por meio de silêncios longos, mudança súbita de assunto ou afastamento físico.',
      'Uso de hábitos anestésicos (telas, comidas, sono excessivo ou rotinas banais) quando a tensão sobe.',
    ],
    commonThoughts: [
      'Não vale a pena comprar essa briga agora; é melhor deixar a poeira baixar.',
      'Se eu me posicionar com firmeza, vou estragar o clima ou causar uma ruptura desnecessária.',
      'Com o tempo as coisas se ajeitam sem que eu precise me desgastar nessa discussão.',
      'Tanto faz para mim, escolham vocês o que acharem melhor.',
      'A paz e o silêncio são mais importantes do que insistir na minha opinião.',
    ],
    associatedFeelings: [
      'Falsa sensação passageira de alívio logo após esquivar-se de uma situação tensa.',
      'Ansiedade subterrânea crescente por carregar decisões e conversas pendentes.',
      'Ressentimento silencioso por se anular e ceder continuamente às vontades dos outros.',
      'Medo agudo de conflito, de hostilidade aberta, de rejeição ou de perder a harmonia das relações.',
      'Letargia, perda de energia vital e apatia diante de projetos próprios.',
    ],
    patternLies: [
      'Evitar a conversa ou o problema faz com que ele deixe de existir com o tempo.',
      'Preservar a paz superficial a qualquer preço é sempre a atitude mais sábia e virtuosa.',
      'Seus incômodos e posicionamentos não são importantes o bastante para incomodar os outros.',
      'Qualquer divergência ou atrito vai resultar inevitavelmente no colapso definitivo da relação.',
    ],
    costToSelf: [
      'Perda progressiva da própria voz, dos próprios limites e da capacidade de autodeterminação.',
      'Acúmulo crônico de problemas não enfrentados, que crescem no escuro até se tornarem crises graves.',
      'Sensação de viver como expectadora passiva da própria existência enquanto outros decidem os rumos.',
      'Somatização da tensão retida em forma de dores difusas, cansaço crônico e indisposição.',
    ],
    costToRelationships: [
      'Frustração de parceiros e colegas, que sentem a pessoa inalcançável, passiva ou evasiva diante de impasses.',
      'Construção de uma intimidade frágil e artificial, já que os sentimentos autênticos nunca são colocados à mesa.',
      'Ressentimento mútuo: o outro cansa de decidir sozinho e a pessoa se ressente de ser apagada.',
      'Comportamentos passivo-agressivos sutis (esquecimentos, atrasos ou desinteresse) no lugar da conversa franca.',
    ],
    strengths: [
      'Habilidade natural para apaziguar ânimos inflamados, promover conciliação e cultivar serenidade.',
      'Paciência, capacidade de convívio harmonioso e tolerância para com as diferenças cotidianas.',
      'Flexibilidade adaptativa e ausência de rigidez diante de pequenas mudanças do dia a dia.',
      'Disposição para sustentar atmosferas acolhedoras, gentis e sem cobranças sufocantes.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, esquivar-se de atritos e engolir posicionamentos pode ter sido a estratégia mais segura para sobreviver a ambientes familiares violentos, caóticos ou punitivos. Pode ter ajudado a pessoa a se manter invisível onde aparecer e contrariar significava sofrer ataques ou desamparo grave. Uma possibilidade a ser investigada no processo é como a busca pela paz protegeu a integridade contra confrontos insuportáveis.',
    wakeUpCalls: [
      'Preservar a paz aparente não é o mesmo que construir paz real: adiar o conflito só encarece a conta.',
      'Dizer o que pensa e colocar limites firmes é um ato de respeito por você e pela relação.',
      'Conversas difíceis não destroem conexões verdadeiras; elas constroem intimidade sólida e adulta.',
      'A sua presença, sua voz e suas necessidades têm o direito legítimo de ocupar espaço no mundo.',
    ],
  },

  critico: {
    id: 'critico',
    canonicalKey: 'critico',
    baseName: 'Crítico',
    movementDescription: 'Perceber falhas e cobrar correções de si, dos outros ou das situações',
    shortDescription:
      'Quando esse padrão assume o comando, o dom legítimo do discernimento, da lucidez e da clareza crítica degenera em um julgamento contínuo e depreciativo. O foco mental recai compulsivamente sobre as imperfeições, defeitos e limitações — seja cobrando de si padrões inatingíveis, desvalorizando os outros ou se amargurando com a realidade tal como ela se apresenta.',
    characteristics: [
      'Voz mental interna acusatória, mordaz e pronta para desqualificar erros próprios e alheios.',
      'Hábito de identificar imediatamente a falha em um projeto, numa pessoa ou num ambiente, antes de ver os méritos.',
      'Sensação recorrente de superioridade moral ou técnica que mascara uma autoexigência impiedosa.',
      'Dificuldade para elogiar de coração aberto, frequentemente emendando um "mas poderia ser melhor".',
      'Tendência a remoer erros do passado como provas irrefutáveis de incapacidade ou indignidade.',
    ],
    commonThoughts: [
      'Como eu pude ser tão descuidada a ponto de cometer uma falha tão grosseira?',
      'As pessoas são incrivelmente medíocres e cheias de desculpas para a própria incompetência.',
      'Se eu não apontar a falha com crueza, ninguém vai aprender a fazer direito.',
      'Está bom, mas ainda faltou muito para alcançar o padrão aceitável.',
      'Nada nunca funciona como deveria neste lugar.',
    ],
    associatedFeelings: [
      'Amargura constante e acidez no humor em relação ao desenrolar do cotidiano.',
      'Sentimento crônico de culpa, inadequação e descontentamento consigo mesma.',
      'Irritação e desapontamento contínuos com as imperfeições naturais das pessoas que convivem.',
      'Medo subjacente de ser exposta em sua própria falibilidade e humilhada por julgamento alheio.',
      'Incapacidade de relaxar na gratidão simples e no contentamento com a vida presente.',
    ],
    patternLies: [
      'Julgar e castigar a si mesma sem piedade é a única maneira de não se acomodar nem fracassar.',
      'Apontar impiedosamente os defeitos alheios é um favor de lucidez que você presta ao mundo.',
      'Aceitar o que é imperfeito é ser cúmplice da mediocridade e da decadência.',
      'Se você parar de vigiar e julgar, seus piores defeitos vão assumir o controle e arruinar tudo.',
    ],
    costToSelf: [
      'Destruição sistemática da autoestima e da autocompaixão por meio de um bombardeio interno de reprovação.',
      'Ansiedade crônica e medo paralisante de tentar coisas novas pelo pavor do próprio julgamento.',
      'Amargura existencial que drena o prazer de viver, envenenando vitórias e momentos de deleite.',
      'Tensão neuromuscular profunda, com aperto constante na mandíbula e dores de cabeça tensionais.',
    ],
    costToRelationships: [
      'Relações corroídas por uma sensação constante de que o outro nunca é bom o bastante para merecer aprovação.',
      'Afastamento afetivo de filhos, parceiros e amigos, que se fecham na defensiva para não serem criticados.',
      'Criação de um ambiente doméstico ou profissional tóxico, tenso e desprovido de segurança psicológica.',
      'Comunicação áspera que foca apenas no que falta, anulando o reconhecimento do que foi construído.',
    ],
    strengths: [
      'Discernimento refinado, perspicácia analítica e lucidez para enxergar inconsistências.',
      'Apreço pela verdade, clareza conceitual e busca sincera por aprimoramento constante.',
      'Capacidade de estabelecer critérios claros e ajudar processos a atingirem maturidade.',
      'Coragem de não se iludir com aparências fáceis e de nomear o que precisa de evolução.',
    ],
    possibleProtectiveFunctions:
      'Em algumas histórias de vida, desenvolver um juiz interno implacável pode ter funcionado como uma tentativa desesperada de se autocriticar antes que os outros o fizessem de forma mais cruel. Pode ter ajudado a pessoa a se policiar para evitar o risco de rejeição, zombaria ou punição em ambientes nos quais errar não era perdoado. Uma possibilidade a ser investigada no processo é como a severidade crítica tentou protegê-la da dor da humilhação pública.',
    wakeUpCalls: [
      'Discernimento lúcido ilumina o caminho; crítica destrutiva apenas paralisa e machuca.',
      'A autocompaixão e o acolhimento da falha humana são os verdadeiros motores do aprendizado maduro.',
      'Você tem o direito de ser humana, incompleta e em construção, sem precisar se punir por isso.',
      'O mundo e as pessoas ao seu redor não precisam ser perfeitos para merecerem o seu amor e o seu respeito.',
    ],
  },
}

/**
 * Retorna o conteúdo de um padrão a partir do seu id ou do seu canonicalKey.
 * Mapeia também aliases se necessários.
 */
export function getCerProtectionPatternContent(
  patternId: string,
): CerProtectionPatternContentItem | undefined {
  if (!patternId) return undefined

  // Consulta direta
  if (CER_PROTECTION_PATTERN_CONTENT[patternId]) {
    return CER_PROTECTION_PATTERN_CONTENT[patternId]
  }

  // Tenta mapear cartao_* para canonicalKey
  const canonicalMap: Record<string, string> = {
    cartao_1_fazer_certo: 'insistente',
    cartao_2_cuidar_pessoas: 'prestativo',
    cartao_3_produtividade_conquistas: 'hiper_realizador',
    cartao_4_perder_sensacao_escolha: 'vitima',
    cartao_5_compreender_pela_razao: 'hiper_racional',
    cartao_6_antecipar_riscos: 'hipervigilante',
    cartao_7_novos_estimulos: 'inquieto',
    cartao_8_assumir_controle: 'comandante',
    cartao_9_evitar_desconfortos: 'evitativo',
    cartao_10_cobrar_e_criticar: 'critico',
  }

  const mapped = canonicalMap[patternId]
  if (mapped && CER_PROTECTION_PATTERN_CONTENT[mapped]) {
    return CER_PROTECTION_PATTERN_CONTENT[mapped]
  }

  return undefined
}
