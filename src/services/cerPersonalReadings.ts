import type { CerPromptRecord, ExperienceResponseRecord } from '@/types/cer'
import type {
  CerPersonalSection,
  CerResourceInsight,
  CerMapElementReading,
} from '@/types/cerMapReadings'
import { CER_PROTECTION_PATTERNS } from './cerProtectionPatterns'
import { movementReportValues } from './movementFrequency'
import { formatPromptResponse } from '@/components/experience/formatPromptResponse'

// Interpret only authored choices. Free narratives remain attributed to their author.
export function selectedReadingChoices(
  prompt: CerPromptRecord,
  response: ExperienceResponseRecord,
): string[] {
  const source = response.structured_value as any
  if (source?.is_legitimate_skip) return []
  const value =
    source?.choice ??
    source?.value ??
    source?.selectedOptionId ??
    source?.selectedOptionIds ??
    source
  const ids = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  const schema = prompt.schema_config as any
  const options = [...(schema.options || []), ...(schema.option_set?.items || [])]
  const known = [...new Set(ids.filter((id) => options.some((o: any) => o.id === id)))] as string[]
  if (known.length > 1 && known.some((id) => schema.exclusive_options?.includes(id))) return []
  if (schema.max_selections && known.length > schema.max_selections) return []
  return known
}

type Rule = { text: string; strength?: [string, string]; difficulty?: [string, string] }
const rules: Record<string, Record<string, Rule>> = {
  mundo_emocional_geral: {
    reconheco_rapidamente: {
      text: 'Você reconhece rapidamente o que sente. Essa percepção oferece um ponto de apoio para comunicar necessidades e escolher uma resposta antes de agir.',
      strength: [
        'Perceber minhas emoções',
        'Reconhecer o que sinto ajuda a escolher como responder.',
      ],
    },
    sinto_corpo_primeiro: {
      text: 'Para você, o corpo costuma avisar antes de a emoção ganhar nome. Sensações corporais podem funcionar como uma primeira pista; compreender o que aconteceu pode vir depois, com tempo e acolhimento.',
    },
    sinto_intensidade: {
      text: 'Você relata sentir com intensidade. Quando a emoção ocupa muito espaço, tempo e condições de recuperação podem ajudar a ampliar suas opções de resposta, sem exigir que deixe de sentir.',
    },
    preciso_tempo: {
      text: 'Você precisa de tempo para compreender o que sentiu. Respeitar esse intervalo permite que a experiência encontre palavras e evita transformar a pressa de responder em mais pressão.',
    },
    penso_analiso_antes: {
      text: 'Você costuma analisar antes de conseguir sentir. Pensar oferece organização; aproximar essa compreensão das sensações e necessidades ajuda a integrar razão e emoção.',
    },
    guardo_escondo: {
      text: 'Você costuma guardar o que sente. O que permanece por dentro pode não ficar visível para quem está perto; criar espaço para expressão gradual pode facilitar receber cuidado.',
      difficulty: [
        'Guardar o que sinto',
        'Pode ficar difícil tornar minhas necessidades visíveis.',
      ],
    },
    mudou_dificuldade_nomear: {
      text: 'Você percebe mudanças, mas ainda tem dificuldade para nomeá-las. Há uma percepção em curso; o registro preserva esse momento de descoberta sem preencher as lacunas por você.',
    },
  },
  pensamento_associado: {
    preciso_resolver: {
      text: 'O pensamento de que é preciso resolver orienta sua atenção para a ação. Essa direção pode ajudar diante de um problema concreto; quando tudo parece urgente, distinguir prioridades permite usar sua iniciativa com mais medida.',
    },
    vai_dar_errado: {
      text: 'Você reconhece a antecipação de que algo pode dar errado. A atenção ao futuro procura preparar uma resposta; se ficar ocupada apenas com ameaças possíveis, pode faltar espaço para perceber os apoios já presentes.',
      difficulty: [
        'Antecipar problemas',
        'A preocupação com o futuro pode ocupar o espaço do presente.',
      ],
    },
    nao_deveria_sentir_assim: {
      text: 'Você relata a cobrança de não sentir o que está sentindo. Além da emoção original, aparece uma exigência sobre como deveria estar. Acolher primeiro o sentimento pode reduzir essa segunda camada de esforço.',
      difficulty: [
        'Cobrar de mim outra emoção',
        'Julgar o que sinto pode aumentar o esforço emocional.',
      ],
    },
    nao_vou_conseguir: {
      text: 'O pensamento de que não conseguirá pode estreitar sua percepção de alternativas. Reconhecer recursos e um passo menor ajuda a tornar a dificuldade mais concreta, em vez de resumir sua capacidade ao momento.',
      difficulty: [
        'Duvidar da minha capacidade',
        'O pensamento de não conseguir pode dificultar começar.',
      ],
    },
    preciso_dar_conta: {
      text: 'Você reconhece a exigência de dar conta. Há uma orientação para sustentar responsabilidades; distribuir demandas e incluir apoio permite que compromisso e recuperação tenham lugar.',
      difficulty: [
        'Sentir que preciso dar conta',
        'A obrigação de sustentar tudo pode reduzir o espaço para apoio e descanso.',
      ],
    },
  },
  dois_retratos_sobrecarga: {
    alerta_preocupado: {
      text: 'Sob sobrecarga, aumenta seu estado de alerta e preocupação. Esse contraste mostra que as condições do dia influenciam o acesso aos seus recursos.',
      difficulty: [
        'Preocupação sob sobrecarga',
        'Quando as demandas aumentam, minha atenção se ocupa mais com o que pode acontecer.',
      ],
    },
    mais_exigente: {
      text: 'Sob sobrecarga, você se torna mais exigente. A busca de qualidade pode perder flexibilidade justamente quando há menos energia disponível.',
      difficulty: [
        'Exigência quando estou no limite',
        'A cobrança aumenta em momentos em que preciso de mais apoio.',
      ],
    },
    dificuldade_decidir_agir: {
      text: 'Quando a sobrecarga aumenta, decidir ou agir fica mais difícil. Reduzir o tamanho da escolha e organizar um primeiro passo pode tornar sua capacidade mais acessível.',
      difficulty: [
        'Decidir ou agir sob sobrecarga',
        'O excesso de demandas torna mais difícil escolher e começar.',
      ],
    },
    perco_contato_necessidades: {
      text: 'Você relata perder contato com suas necessidades sob sobrecarga. Tornar pausas e sinais de limite mais visíveis pode ajudar a incluir seu corpo nas decisões.',
      difficulty: [
        'Perder de vista minhas necessidades',
        'Sob sobrecarga, fica mais difícil perceber do que preciso.',
      ],
    },
    dificuldade_perceber_recursos: {
      text: 'Sob sobrecarga, fica difícil perceber seus recursos. A lista integrada pode funcionar como uma lembrança concreta do que está disponível ou pode ser desenvolvido.',
      difficulty: [
        'Não enxergar meus recursos sob pressão',
        'O desgaste dificulta reconhecer capacidades e apoios.',
      ],
    },
  },
  resource_access_under_stress_layer: {
    consigo_recorrer: {
      text: 'Você costuma conseguir usar o que ajuda quando precisa. Há uma ponte entre conhecer o recurso e colocá-lo em prática, que pode apoiar novos cuidados.',
      strength: ['Mobilizar meus recursos', 'Consigo recorrer ao que ajuda na maioria das vezes.'],
    },
    as_vezes_consigo: {
      text: 'O acesso aos seus recursos muda com a intensidade do estresse. Conhecer uma prática e conseguir usá-la em um momento difícil são etapas diferentes; a rotina pode oferecer lembretes e condições mais favoráveis.',
    },
    sei_que_ajuda_mas_dificil: {
      text: 'Você sabe o que ajuda, mas tem dificuldade de acessar no calor do momento. Isso indica a necessidade de facilitar o caminho até o recurso, com apoio e passos simples.',
      difficulty: [
        'Acessar meus recursos no calor do momento',
        'Conheço o que ajuda, mas usar sob estresse é difícil.',
      ],
    },
    depende_de_alguem: {
      text: 'Seus recursos dependem também de pessoas ou condições externas. Sua estratégia precisa considerar acesso a apoio, tempo e ambiente, além das capacidades internas.',
      difficulty: [
        'Ter condições para usar meus recursos',
        'Parte do que ajuda depende de apoio ou de condições externas.',
      ],
    },
  },
  custo_posterior: {
    continuo_pensando: {
      text: 'Você relata que a cena continua voltando à mente depois. O acontecimento termina, mas sua atenção permanece nele; recuperar espaço mental é uma necessidade dessa sequência.',
      difficulty: [
        'Continuar pensando depois',
        'A cena se repete na minha mente após o acontecimento.',
      ],
    },
    corpo_tenso_cansado: {
      text: 'Você relata tensão ou cansaço depois da situação. A recuperação precisa incluir o corpo e não apenas a resolução do problema externo.',
      difficulty: [
        'Tensão ou cansaço depois',
        'O impacto físico permanece depois que a situação passa.',
      ],
    },
    culpa_ou_arrependimento: {
      text: 'Depois da situação, aparecem culpa, autocobrança ou arrependimento. Aprender com o ocorrido e acolher os limites daquele momento pode ajudar a construir outra resposta.',
      difficulty: [
        'Cobrança depois de reagir',
        'A culpa ou o arrependimento prolongam o esforço do momento.',
      ],
    },
    distancia_demora_voltar: {
      text: 'Você relata precisar de mais tempo para se reaproximar. O intervalo de recuperação tem importância; quando possível, comunicar a pausa ajuda a manter o vínculo enquanto se recompõe.',
    },
    volto_rapido: {
      text: 'Você costuma se recuperar rapidamente depois. Essa percepção é um recurso para compreender em quais condições o retorno acontece com mais facilidade.',
      strength: ['Recuperar meu eixo', 'Costumo voltar rapidamente depois que a situação passa.'],
    },
  },
  signal_awareness_timing: {
    percebo_na_hora: {
      text: 'Você costuma perceber a mobilização na hora. Esse reconhecimento pode abrir um pequeno intervalo entre o impulso e a resposta.',
      strength: ['Perceber meus primeiros sinais', 'Reconheço a mobilização enquanto acontece.'],
    },
    percebo_logo_depois: {
      text: 'Você percebe logo depois, quando respira. A pausa já aparece como uma condição que favorece reconhecer o que aconteceu.',
    },
    percebo_so_ao_fim_do_dia: {
      text: 'Você percebe o impacto horas depois ou ao fim do dia. Seu cuidado pode começar nesse momento de reconhecimento e, aos poucos, incluir sinais mais precoces.',
      difficulty: [
        'Perceber o impacto só depois',
        'O cansaço se torna mais claro quando a situação já passou.',
      ],
    },
  },
  limites_cena_adaptativa: {
    percebo_e_falo: {
      text: 'Você percebe e consegue sinalizar seus limites. Essa capacidade protege seu espaço e oferece à outra pessoa uma informação concreta para ajustar a relação.',
      strength: [
        'Comunicar meus limites',
        'Consigo perceber e sinalizar quando algo passa do ponto.',
      ],
    },
    percebo_mas_demoro: {
      text: 'Você reconhece o incômodo, mas demora para falar. A percepção já existe; o ponto de cuidado está em dar voz ao limite enquanto ainda há espaço para ajustar.',
      difficulty: [
        'Demorar para comunicar limites',
        'Percebo o incômodo antes de conseguir expressá-lo.',
      ],
    },
    percebo_depois: {
      text: 'O limite fica claro depois, quando você já está cansada. Tornar os sinais de desgaste mais visíveis pode ajudar a proteger seu ritmo antes de chegar ao esgotamento.',
      difficulty: [
        'Perceber limites depois do desgaste',
        'O excesso se torna mais claro quando já estou cansada.',
      ],
    },
    tento_me_adaptar: {
      text: 'Você tende a esticar seu limite para acomodar a outra pessoa. Sua disponibilidade precisa encontrar espaço junto com suas necessidades, para que o cuidado seja recíproco.',
      difficulty: [
        'Esticar meus limites para acomodar',
        'Posso ultrapassar meu ritmo para atender a outra pessoa.',
      ],
    },
  },
  pedir_apoio_tendencia: {
    peco_diretamente: {
      text: 'Você costuma pedir apoio diretamente a quem confia. Essa capacidade torna suas necessidades visíveis e abre espaço para dividir o esforço.',
      strength: ['Pedir ajuda', 'Consigo pedir apoio diretamente a pessoas de confiança.'],
    },
    procuro_alguem_especifico: {
      text: 'Você procura pessoas específicas para pedir apoio. Reconhecer vínculos confiáveis oferece uma rede concreta, mesmo que pequena.',
      strength: [
        'Reconhecer pessoas de confiança',
        'Sei a quem recorrer para compartilhar uma necessidade.',
      ],
    },
    tento_resolver_sozinha: {
      text: 'Você tenta resolver sozinha até o limite antes de pedir. A autonomia é um recurso, mas o apoio chega tarde nessa sequência; compartilhá-lo antes pode preservar energia.',
      difficulty: ['Pedir ajuda só no limite', 'Tento resolver sozinha antes de recorrer a apoio.'],
    },
    espero_que_percebam: {
      text: 'Você tende a esperar que percebam sua necessidade. Nem sempre o que sente fica visível; expressar um pedido concreto pode aproximar o cuidado que deseja receber.',
      difficulty: [
        'Esperar que percebam minhas necessidades',
        'O apoio pode não chegar quando meu pedido fica implícito.',
      ],
    },
  },
  receber_cuidado_tendencia: {
    recebo_com_facilidade: {
      text: 'Você recebe cuidado com facilidade. Permitir que o outro participe do seu bem-estar é um recurso de reciprocidade.',
      strength: ['Receber cuidado', 'Consigo acolher o apoio oferecido.'],
    },
    recebo_mas_com_divida: {
      text: 'Você recebe cuidado, mas logo pensa em retribuir. O vínculo pode incluir reciprocidade ao longo do tempo, sem transformar cada ajuda em uma dívida imediata.',
      difficulty: [
        'Sentir dívida ao receber cuidado',
        'A preocupação de retribuir aparece logo após receber apoio.',
      ],
    },
    desconforto_ou_recusa: {
      text: 'Receber cuidado traz desconforto ou vontade de recusar. Há um ponto de atenção no espaço que consegue oferecer às próprias necessidades na relação.',
      difficulty: [
        'Deixar o cuidado chegar até mim',
        'Posso recusar apoio mesmo quando estou precisando.',
      ],
    },
  },
  desejo_camada_experiencia: {
    desejo_responsivo_contextual: {
      text: 'Seu desejo costuma surgir em resposta ao carinho, ao clima e à sintonia. O contexto participa da experiência; criar espaço para encontro e presença pode favorecer perceber o que deseja.',
    },
    desejo_espontaneo: {
      text: 'Você relata desejo espontâneo. Perceber que ele aparece por si ajuda a conhecer seu ritmo; sua disponibilidade e suas escolhas continuam fazendo parte de cada encontro.',
    },
    desejo_variavel_conforme_vida: {
      text: 'Seu desejo varia conforme descanso e momento de vida. A intimidade acompanha as condições em que você vive, por isso energia e tempo têm lugar nessa leitura.',
    },
    desejo_raro_ou_espacado: {
      text: 'Você relata desejo mais raro ou sutil neste momento. Essa é a experiência compartilhada; seu significado depende também de como se sente com ela e do que deseja para sua vida.',
    },
    desejo_dificil_de_perceber: {
      text: 'Você relata dificuldade para distinguir desejo e obrigação. Dar lugar ao que quer, ao que não quer e ao direito de mudar de ideia é central para sua autonomia.',
      difficulty: [
        'Distinguir desejo e obrigação',
        'Ainda é difícil perceber o que quero nessa experiência.',
      ],
    },
  },
  disponibilidade_camada_experiencia: {
    quero_mas_sem_espaco: {
      text: 'Pode haver desejo e, ao mesmo tempo, faltar tempo, energia ou espaço. Essa diferença mostra que a disponibilidade precisa de condições reais no cotidiano.',
      difficulty: [
        'Ter espaço para a intimidade',
        'Posso sentir desejo e ainda não ter tempo ou energia disponíveis.',
      ],
    },
    nao_estou_buscando_nem_disponivel: {
      text: 'Você não está disponível neste momento e relata estar em harmonia com isso. Essa escolha é parte da sua autonomia e merece espaço no mapa.',
    },
    disponibilidade_muito_contextual: {
      text: 'Sua disponibilidade depende de segurança e clima. Essas condições precisam estar presentes para que o encontro faça sentido para você.',
    },
  },
  comunicacao_desconforto_cena: {
    percebo_e_falo: {
      text: 'Você consegue perceber, falar, pausar ou redirecionar quando algo incomoda. Essa capacidade mantém sua escolha presente durante a intimidade.',
      strength: [
        'Comunicar meus limites',
        'Consigo sinalizar desconforto e pausar ou redirecionar o contato.',
      ],
    },
    percebo_mas_hesito: {
      text: 'Você percebe o desconforto, mas hesita em falar para preservar o clima ou a outra pessoa. Seu conforto também precisa participar do encontro; a comunicação pode proteger a intimidade.',
      difficulty: [
        'Expressar desconforto na intimidade',
        'Percebo o incômodo, mas hesito em comunicar.',
      ],
    },
    me_adapto: {
      text: 'Você tende a continuar ou se adaptar para acomodar a outra pessoa. Reconhecer seu próprio ritmo e sustentar a liberdade de pausa é uma direção de cuidado.',
      difficulty: [
        'Continuar para acomodar o outro',
        'Posso deixar meu conforto em segundo plano na intimidade.',
      ],
    },
  },
  expressao_escolhas_preferencias: {
    falo_com_liberdade: {
      text: 'Você consegue expressar preferências e mudar de ideia. Essa liberdade é uma força para construir encontros com reciprocidade.',
      strength: [
        'Expressar minhas escolhas',
        'Consigo falar do que gosto e mudar de ideia quando preciso.',
      ],
    },
    sinto_dificuldade_em_mudar_de_ideia: {
      text: 'Você relata dificuldade de pedir pausa depois que o contato começou. O direito de rever sua escolha continua presente em qualquer momento.',
      difficulty: [
        'Pedir pausa ou mudar de ideia',
        'Depois que começa, pode ser difícil expressar outra escolha.',
      ],
    },
    aprendendo_minha_voz: {
      text: 'Você está aprendendo a reconhecer e fortalecer sua voz. Há um processo de desenvolvimento em curso que pode ser apoiado com tempo e relações respeitosas.',
    },
  },
  percepcao_sensacoes_corpo: {
    percebo_com_facilidade: {
      text: 'Você percebe suas sensações com facilidade. Essa atenção oferece informações sobre conforto, ritmo e escolha.',
      strength: ['Perceber meu corpo', 'Consigo notar sensações e me conectar ao corpo.'],
    },
    preciso_de_tempo: {
      text: 'Você precisa de calma e tempo para desacelerar e sentir. Um ritmo sem pressa é uma condição importante para aproximar atenção e experiência corporal.',
    },
    atencao_vai_para_a_mente: {
      text: 'Sua atenção costuma ir para pensamentos e preocupações. O encontro com o corpo pode precisar de mais tempo e condições de presença.',
      difficulty: [
        'Estar presente nas sensações',
        'Pensamentos e preocupações frequentemente ocupam minha atenção.',
      ],
    },
  },
  espaco_para_o_que_importa_sc2: {
    sim_pouco_espaco: {
      text: 'Você percebe que algo importante está ficando de lado. O mapa aponta uma distância entre valores e espaço real na rotina; priorizar um pequeno gesto pode começar a aproximá-los.',
      difficulty: [
        'Dar espaço ao que importa',
        'Algo importante para mim está ficando de lado na rotina.',
      ],
    },
    um_pouco: {
      text: 'Em algumas fases, falta espaço para o que importa. Sua organização pode reconhecer essa oscilação e preservar uma presença possível para seus valores.',
    },
    nao_especialmente: {
      text: 'Você sente que o essencial tem seu lugar. Reconhecer o que já sustenta essa coerência ajuda a preservá-lo nas próximas escolhas.',
      strength: [
        'Dar lugar aos meus valores',
        'Sinto que o essencial encontra espaço na minha vida.',
      ],
    },
  },
}

export const patternResources: Record<
  string,
  { strength: [string, string]; difficulty: [string, string]; text: string }
> = {
  insistente: {
    strength: [
      'Organização e atenção aos detalhes',
      'A busca de qualidade pode apoiar planejamento e continuidade.',
    ],
    difficulty: [
      'Cobrança por fazer tudo certo',
      'Quando a busca de qualidade perde medida, pode dificultar concluir e descansar.',
    ],
    text: 'A busca de fazer bem reúne organização, cuidado e compromisso. Quando fica automática, pode exigir mais conferência e reduzir o espaço para o suficiente. Sua organização pode ajudar a escolher um critério de conclusão e incluir descanso no planejamento.',
  },
  prestativo: {
    strength: [
      'Sensibilidade e cuidado',
      'A atenção às pessoas pode apoiar escuta, vínculo e cooperação.',
    ],
    difficulty: [
      'Colocar minhas necessidades depois',
      'Cuidar do outro pode ocupar o espaço de reconhecer meus próprios limites.',
    ],
    text: 'A disposição de cuidar reúne sensibilidade e capacidade de vínculo. Quando suas necessidades ficam sempre depois, esse recurso pode virar sobrecarga. O cuidado pode incluir você, com pedidos claros, limites e reciprocidade.',
  },
  hiper_realizador: {
    strength: [
      'Iniciativa e realização',
      'A capacidade de orientar esforços pode transformar intenção em ação.',
    ],
    difficulty: [
      'Medir meu valor pelas entregas',
      'A busca constante por resultado pode reduzir o espaço para descanso e presença.',
    ],
    text: 'Sua orientação para realizar pode ajudar a tirar ideias do papel. Quando cada resultado vira uma exigência de provar valor, a realização perde espaço para prazer e recuperação. Metas com medida podem colocar essa energia a serviço do que importa.',
  },
  vitima: {
    strength: [
      'Sensibilidade ao que precisa de cuidado',
      'Reconhecer sofrimento pode ajudar a buscar acolhimento e apoio.',
    ],
    difficulty: [
      'Perder de vista escolhas possíveis',
      'O desencorajamento pode dificultar perceber pequenos espaços de ação.',
    ],
    text: 'O desencorajamento aponta para uma experiência de dificuldade. Reconhecer a dor merece acolhimento; apoio e pequenos espaços reais de escolha podem ajudar a reencontrar ação. Circunstâncias externas também precisam ser consideradas.',
  },
  hiper_racional: {
    strength: [
      'Análise e discernimento',
      'Compreender detalhes e relações pode apoiar escolhas claras.',
    ],
    difficulty: [
      'Ficar apenas na análise',
      'Buscar explicações pode deixar sentimentos e necessidades com menos espaço.',
    ],
    text: 'Analisar oferece clareza e organização. Essa capacidade pode trabalhar junto com a percepção do corpo e das emoções, para que compreender também ajude a escolher e agir.',
  },
  hipervigilante: {
    strength: [
      'Atenção e preparação',
      'Perceber detalhes pode apoiar decisões e preparação cuidadosa.',
    ],
    difficulty: [
      'Antecipação constante',
      'A busca contínua pelo que pode dar errado pode tornar difícil descansar.',
    ],
    text: 'A atenção aos riscos procura preparar você para o que vem. Usada com medida, ajuda a organizar apoios; quando fica constante, pode ocupar o presente. Preparação pode incluir reconhecer segurança e condições já disponíveis.',
  },
  inquieto: {
    strength: [
      'Curiosidade e flexibilidade',
      'O interesse por caminhos diferentes pode ampliar alternativas.',
    ],
    difficulty: [
      'Mudar de foco continuamente',
      'Buscar novos estímulos pode dificultar continuidade e repouso.',
    ],
    text: 'A abertura ao novo favorece curiosidade e alternativas. Quando mudar de foco fica automático, continuar pode exigir mais esforço. Escolher onde manter atenção ajuda a transformar interesse em um percurso possível.',
  },
  comandante: {
    strength: [
      'Iniciativa e direção',
      'Assumir uma direção pode ajudar a organizar decisões e ações.',
    ],
    difficulty: [
      'Precisar controlar tudo',
      'A centralização pode aumentar o esforço e diminuir o espaço para cooperação.',
    ],
    text: 'Tomar a frente pode trazer direção em situações difíceis. Compartilhar decisões e responsabilidades permite que essa iniciativa encontre cooperação, preservando sua energia e a autonomia das outras pessoas.',
  },
  evitativo: {
    strength: [
      'Perceber a necessidade de espaço',
      'Reconhecer limites de exposição pode ajudar a escolher ritmo e apoio.',
    ],
    difficulty: [
      'Adiar o que precisa de cuidado',
      'O afastamento pode prolongar tarefas ou conversas importantes.',
    ],
    text: 'Afastar-se do desconforto pode oferecer alívio imediato. Uma pausa acompanhada de um próximo passo e apoio pode ajudar a preservar espaço sem deixar indefinidamente de lado o que precisa de cuidado.',
  },
  critico: {
    strength: [
      'Discernimento e atenção à qualidade',
      'Perceber o que pode melhorar ajuda a ajustar caminhos.',
    ],
    difficulty: [
      'Cobrança que ocupa todo o espaço',
      'Focar apenas em falhas pode dificultar reconhecer avanços e recursos.',
    ],
    text: 'Perceber o que pode melhorar é um recurso. Quando a atenção fica presa apenas às falhas, conquistas e capacidades podem perder visibilidade. Seu discernimento também pode ajudar a reconhecer o que já funciona.',
  },
}
export const regulationReadings: Record<
  string,
  {
    id: string
    name: string
    text: string
    strength: [string, string]
    difficulty: [string, string]
  }
> = {
  resolver_imediatamente: {
    id: 'luta',
    name: 'Luta',
    text: 'Você reconhece o movimento de resolver e intervir. Ele mobiliza iniciativa e capacidade de defender seu espaço. Sob muita pressão, a ação rápida pode deixar menos tempo para escuta e escolha; uma pausa pode ajudar a usar sua firmeza com medida.',
    strength: [
      'Iniciativa e firmeza',
      'Posso mobilizar ação para defender meu espaço e enfrentar um problema.',
    ],
    difficulty: [
      'Agir antes de recuperar espaço',
      'A urgência de resolver pode reduzir o tempo para escolher uma resposta.',
    ],
  },
  afastar_recolher: {
    id: 'fuga',
    name: 'Fuga',
    text: 'Você reconhece o movimento de se afastar e buscar espaço. A distância pode favorecer recuperação. Uma pausa com possibilidade de retorno ajuda a preservar esse recurso sem deixar conversas e necessidades indefinidamente suspensas.',
    strength: [
      'Buscar espaço para me recompor',
      'O afastamento pode oferecer uma pausa diante da sobrecarga.',
    ],
    difficulty: [
      'Ter dificuldade para retomar',
      'Quando o afastamento se prolonga, pode faltar espaço para resolver o que importa.',
    ],
  },
  travar_congelar: {
    id: 'paralisacao',
    name: 'Paralisação',
    text: 'Você reconhece momentos em que a resposta não sai. Esse intervalo pode sinalizar necessidade de tempo e apoio. Um primeiro passo pequeno e condições de segurança podem ajudar a recuperar escolha sem acrescentar cobrança.',
    strength: [
      'Respeitar o tempo de resposta',
      'Reconhecer o intervalo pode ajudar a buscar apoio e recuperar espaço.',
    ],
    difficulty: [
      'Ficar sem conseguir responder',
      'A dificuldade de falar ou agir pode limitar a expressão das minhas necessidades.',
    ],
  },
  ceder_agradar: {
    id: 'submissao',
    name: 'Submissão',
    text: 'Você reconhece o movimento de apaziguar e ceder. Ele procura reduzir o atrito e preservar a relação. Sensibilidade ao outro pode trabalhar junto com sua própria voz, para que a conexão também inclua suas necessidades.',
    strength: ['Sensibilidade ao vínculo', 'A atenção ao outro pode apoiar cooperação e diálogo.'],
    difficulty: [
      'Ceder além do meu limite',
      'Preservar a relação pode ocupar o espaço de expressar minhas necessidades.',
    ],
  },
}

export function buildPersonalDimensionReading(
  dimensionId: string,
  prompts: CerPromptRecord[],
  responses: ExperienceResponseRecord[],
) {
  const sections: CerPersonalSection[] = []
  const insights: CerResourceInsight[] = []
  const elements: Record<string, CerMapElementReading> = {}
  const latest = new Map<string, { prompt: CerPromptRecord; response: ExperienceResponseRecord }>()
  for (const response of [...responses].sort((a, b) =>
    (a.updated || a.created || '').localeCompare(b.updated || b.created || ''),
  )) {
    const source = response.structured_value as any
    const key =
      (response.expand?.prompt_id?.schema_config as any)?.prompt_key ||
      (response as any).prompt_key ||
      source?.prompt_key ||
      source?.metadata?.prompt_key
    const prompt = prompts.find(
      (p) =>
        p.id === response.prompt_id ||
        p.id === (response as any).canonical_prompt_id ||
        (p.schema_config as any).prompt_key === key,
    )
    if (!prompt) continue
    const schema = prompt.schema_config as any
    if (
      schema.access_destination === 'participant_private' ||
      schema.privacy_split?.enabled ||
      schema.composite_mirror?.enabled
    )
      continue
    latest.set(schema.prompt_key, { prompt, response })
  }
  const addInsight = (
    kind: 'strength' | 'difficulty',
    value: [string, string],
    response: ExperienceResponseRecord,
    label: string,
    basis: 'response' | 'reference' = 'response',
  ) => {
    const id = `${kind}:${value[0]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`
    const existing = insights.find((i) => i.id === id)
    const origin = { dimensionId, label, basis, sourceResponseIds: [response.id] }
    if (existing) existing.origins.push(origin)
    else insights.push({ id, kind, label: value[0], description: value[1], origins: [origin] })
  }
  for (const [key, { prompt, response }] of latest) {
    const schema = prompt.schema_config as any
    const ids = selectedReadingChoices(prompt, response)
    const textParts: string[] = []
    const title = prompt.step_title || prompt.prompt_text
    for (const id of ids) {
      const rule = rules[key]?.[id]
      if (rule) {
        textParts.push(rule.text)
        if (rule.strength) addInsight('strength', rule.strength, response, title)
        if (rule.difficulty) addInsight('difficulty', rule.difficulty, response, title)
      }
      if (key === 'resposta_tendencia' && regulationReadings[id]) {
        const r = regulationReadings[id]
        textParts.push(r.text)
        addInsight('strength', r.strength, response, r.name, 'reference')
        addInsight('difficulty', r.difficulty, response, r.name, 'reference')
        elements[r.id] = {
          summary: r.text,
          observations: [formatPromptResponse(prompt, response)],
          interpretation: '',
          resources: [r.strength.join(': ')],
          costs: [r.difficulty.join(': ')],
          connections: [],
          questions: [],
          sourceResponseIds: [response.id],
        }
      }
    }
    if (schema.movement_scale_options && !(response.structured_value as any)?.is_legitimate_skip) {
      for (const [key, frequency] of Object.entries(movementReportValues(response))) {
        const canonical = CER_PROTECTION_PATTERNS[key]?.canonicalKey
        const profile = patternResources[canonical]
        if (!profile) continue
        const active =
          /algumas situações|frequência|frequencia|com frequência|sob pressão|muita força/i.test(
            frequency,
          )
        elements[canonical] = {
          summary: `Você marcou: ${frequency}.`,
          observations: [],
          interpretation: active
            ? profile.text
            : 'Sua resposta registra este movimento sem destacá-lo como uma dificuldade frequente. O catálogo permanece disponível para conhecer o conceito.',
          resources: active ? [profile.strength.join(': ')] : [],
          costs: active ? [profile.difficulty.join(': ')] : [],
          connections: [],
          questions: [],
          sourceResponseIds: [response.id],
        }
        if (active) {
          textParts.push(
            `${CER_PROTECTION_PATTERNS[key].movementDescription}: ${frequency}. ${profile.text}`,
          )
          addInsight(
            'strength',
            profile.strength,
            response,
            CER_PROTECTION_PATTERNS[key].movementDescription,
            'reference',
          )
          addInsight(
            'difficulty',
            profile.difficulty,
            response,
            CER_PROTECTION_PATTERNS[key].movementDescription,
            'reference',
          )
        }
      }
    }
    const resourceKeys = [
      'recursos_recuperar_espaco',
      'known_return_resource',
      'dois_retratos_espaco',
      'reparacao_recurso_conhecido',
      'o_que_me_conecta_a_vida_sc1',
      'mais_perto_de_mim_sc3',
    ]
    if (resourceKeys.includes(key)) {
      const options = [...(schema.options || []), ...(schema.option_set?.items || [])]
      for (const id of ids.filter(
        (id) => !/^(?:ainda_|nao_|as_vezes_nao|outro|outra|diferente|depende_)/.test(id),
      )) {
        const label =
          options.find((o: any) => o.id === id)?.title ||
          options.find((o: any) => o.id === id)?.label
        if (label)
          addInsight(
            'strength',
            [
              label.replace(/\.$/, ''),
              'Um recurso ou uma condição de bem-estar que você reconheceu nas suas respostas.',
            ],
            response,
            title,
          )
      }
      if (ids.length)
        textParts.push(
          key === 'reparacao_recurso_conhecido'
            ? 'Você reconhece caminhos de reparação. Eles oferecem referências para retomar diálogo e construir combinados; a disponibilidade da outra pessoa e as condições do vínculo também participam.'
            : 'O que você reconhece como fonte de bem-estar oferece recursos concretos para sua rotina. Ter esse repertório visível ajuda a escolher cuidados possíveis, considerando tempo, acesso e intensidade do momento.',
        )
    }
    if (key === 'mais_longe_de_mim_sc3')
      for (const id of ids) {
        const option = schema.options?.find((o: any) => o.id === id)
        if (option && !['diferente_comigo', 'nao_sei'].includes(id))
          addInsight(
            'difficulty',
            [option.title, 'Uma condição em que você relata se sentir mais distante de si.'],
            response,
            title,
          )
      }
    if (key === 'valores_que_importam_sc2' && ids.length)
      textParts.push(
        'Os valores que você escolheu oferecem direção para seus objetivos. Eles podem orientar prioridades e ajudar a avaliar se a rotina reserva espaço para o que dá sentido à sua vida. Valorizar algo e conseguir vivê-lo dependem também de condições reais.',
      )
    const literal = formatPromptResponse(prompt, response)
    // Unknown choices and a refusal are preserved as information, never classified as a weakness.
    if (!textParts.length && /Prefiro não responder|Não sei dizer agora/.test(literal)) continue
    if (!textParts.length && !/reconhecimento|recognition|campo_final/.test(key)) {
      if (response.free_text?.trim() || ids.length)
        textParts.push(
          dimensionId === 'regulacao'
            ? 'Este registro acrescenta uma parte da sua sequência: o contexto, os sinais ou o retorno. Lê-lo junto das outras respostas ajuda a escolher em que momento oferecer apoio.'
            : dimensionId === 'relacoes'
              ? 'Essa experiência mostra condições importantes do vínculo. Confiança, proximidade e apoio precisam considerar o que acontece nessa relação e o seu momento.'
              : dimensionId === 'sexualidade'
                ? 'Essa percepção acrescenta condições para compreender sua intimidade. Corpo, desejo, disponibilidade e comunicação participam juntos das escolhas que fazem sentido para você.'
                : dimensionId === 'sentido'
                  ? 'Esse registro ajuda a reconhecer o que aproxima você da vida que deseja construir. Ele pode orientar prioridades e pequenos passos no cotidiano.'
                  : 'Essa experiência acrescenta uma parte do seu funcionamento mental e emocional. Conhecê-la ajuda a reconhecer o que acontece e o apoio que pode tornar suas escolhas mais acessíveis.',
        )
    }
    if (textParts.length)
      sections.push({
        title,
        text: `Você registrou: “${literal}”.\n\n${textParts.join('\n\n')}`,
        sourceResponseIds: [response.id],
      })
  }
  return { sections, insights, elements }
}
