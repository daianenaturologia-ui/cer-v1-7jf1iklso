/**
 * Build 07C — Especificação Normativa e Definições de Schema dos Prompts e Momentos
 * Dimensões:
 * 1. Mente & Emoções (Dimension ID: i5s00tarmu3nhbu, Experience ID: exp-mente-emocoes-07c)
 * 2. Regulação & Padrões de Resposta (Dimension ID: 3bh0biuputz5oqh, Experience ID: exp-regulacao-respostas-07c)
 *
 * Princípios Normativos Constitucionais:
 * - Complexidade nos bastidores, leveza na experiência
 * - Zero score, zero diagnóstico, zero classificação automática (ruminação, TDAH, rigidez, sabotadores, etc.)
 * - Zero conversão de comportamento em rótulos ou tipos de personalidade
 * - Proteção como hipótese profissional POSTERIOR (nunca factual, nunca participant-facing)
 * - Recurso conhecido ≠ recurso acessível sob estresse (duas camadas/armazenamentos distintos)
 * - Anti-laundering estrito (participant_private nunca vira participant_shared em nenhuma derivação)
 * - Registro Único: o que já foi respondido em Mente (contexto, emoção) é REUSED em Regulação (sem recoleta)
 * - Open-first obrigatório com auxílio apenas em expander colapsado
 * - Temporalidade rigorosa (longitudinal, recurring, current_state, context_dependent)
 * - Linguagem inclusiva e neutra
 * - Componentes 100% existentes da família template/07B
 */

import type { CerExperienceRecord, CerExperienceMomentRecord, CerPromptRecord } from '@/types/cer'

// IDs Canônicos de Dimensões e Experiências
export const MENTE_EMOCOES_DIMENSION_ID = 'i5s00tarmu3nhbu'
export const MENTE_EMOCOES_EXPERIENCE_ID = 'exp-mente-emocoes-07c'

export const REGULACAO_RESPOSTAS_DIMENSION_ID = '3bh0biuputz5oqh'
export const REGULACAO_RESPOSTAS_EXPERIENCE_ID = 'exp-regulacao-respostas-07c'

export const CER_INTEGRATIVE_MODEL_ID = '10v9id9mqr3dmov'

// ==========================================
// EXPERIÊNCIAS (CER_EXPERIENCES)
// ==========================================

export const MENTE_EMOCOES_EXPERIENCE: CerExperienceRecord = {
  id: MENTE_EMOCOES_EXPERIENCE_ID,
  dimension_id: MENTE_EMOCOES_DIMENSION_ID,
  code: 'mente_emocoes_cer',
  title: 'Mente & Emoções — compreender o que acontece dentro de você',
  subtitle:
    'Como suas emoções se manifestam, quais movimentos acontecem em sua mente e como você se trata por dentro.',
  order_index: 3,
  is_pilot: false,
  opening_text:
    'A mente e as emoções não são a mesma coisa, mas estão profundamente interligadas.\n\nAs emoções envolvem sensações, movimentos internos e respostas do corpo diante do que vivemos. A mente participa desse processo por meio dos pensamentos, lembranças, interpretações e expectativas. O que pensamos pode intensificar ou suavizar uma emoção — e o que sentimos também pode influenciar nossa atenção, nossas escolhas e a maneira como interpretamos uma situação.\n\nNesta experiência, vamos conhecer um pouco melhor como você percebe suas emoções, quais movimentos costumam acontecer em sua mente e como você se trata por dentro em diferentes momentos.\n\nNão existem respostas certas ou erradas. Responda sem julgamento: apenas observe e descreva, com honestidade e gentileza, o que percebe sobre si.\n\nConsidere principalmente como você esteve nas últimas duas semanas, mas observe também se isso é parecido ou diferente da sua maneira habitual de funcionar.\n\nEste é um retrato do seu momento atual — não é um diagnóstico e não define quem você é. Você pode ter funcionado de formas diferentes no passado e poderá desenvolver novas maneiras de sentir, pensar e responder no futuro.\n\nSe precisar, faça uma pausa e continue depois. Suas respostas ficarão salvas.\n\nCom carinho,\nDaia',
  closing_text:
    'Seu retrato emocional e mental foi acolhido. Esse olhar sensível nos ajuda a compreender seus processos e recursos com profundidade e respeito ao seu momento.',
  version: 2,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
}

export const REGULACAO_RESPOSTAS_EXPERIENCE: CerExperienceRecord = {
  id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
  dimension_id: REGULACAO_RESPOSTAS_DIMENSION_ID,
  code: 'regulacao_respostas_cer',
  title: 'Regulação & Padrões de Resposta',
  subtitle:
    'Como você reage quando algo mexe com você, o que suas respostas tentam cuidar e seus caminhos de retorno.',
  order_index: 4,
  is_pilot: false,
  opening_text:
    'Quando somos mobilizados pela vida, nosso corpo e nossa mente agem de formas singulares para nos proteger e nos orientar. Vamos olhar para esses caminhos sem nenhum julgamento.',
  closing_text:
    'Sua sequência e seus recursos de retorno foram integrados. Reconhecer essas respostas é um passo fundamental para honrar sua história e seus ritmos.',
  version: 1,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
}

// ==========================================
// MOMENTOS DE MENTE & EMOÇÕES (5 momentos fixos)
// ==========================================

export const MENTE_EMOCOES_MOMENTS: CerExperienceMomentRecord[] = [
  {
    id: 'mom-mente-1',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'meu_mundo_emocional',
    title: 'Meu Mundo Emocional',
    subtitle: 'Como você percebe suas emoções e o que tem estado mais presente.',
    order_index: 1,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-2',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'olhar_mais_de_perto',
    title: 'Olhar Mais de Perto',
    subtitle: 'As camadas que acompanham o que você sente.',
    order_index: 2,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-3',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'minha_mente_em_movimento',
    title: 'Minha Mente em Movimento',
    subtitle: 'Movimentos mentais que ajudam, pesam e aparecem sob pressão.',
    order_index: 3,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-4',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'como_eu_me_trato_por_dentro',
    title: 'Como Eu Me Trato por Dentro',
    subtitle: 'Para onde vai a cobrança, como ela afeta você e como acolhe suas conquistas.',
    order_index: 4,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-5',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'dois_retratos_de_mim',
    title: 'Dois Retratos de Mim',
    subtitle:
      'Quando há espaço interno, quando a sobrecarga pesa e o que ajuda a recuperar o respiro.',
    order_index: 5,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// ==========================================
// MOMENTOS DE REGULAÇÃO & RESPOSTAS (PR1..PR4)
// ==========================================

export const REGULACAO_RESPOSTAS_MOMENTS: CerExperienceMomentRecord[] = [
  {
    id: 'mom-reg-1',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_key: 'quando_comeca',
    title: 'Quando Começa',
    subtitle: 'Contextos de mobilização e primeiros sinais percebidos.',
    order_index: 1,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-reg-2',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_key: 'o_que_acontece_comigo',
    title: 'O Que Acontece Comigo',
    subtitle: 'Sua tendência de resposta e o que ela tenta cuidar naquele momento.',
    order_index: 2,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-reg-3',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_key: 'e_depois_meu_caminho_de_volta',
    title: 'E Depois / Meu Caminho de Volta',
    subtitle: 'O custo posterior e os recursos conhecidos para recuperar o eixo.',
    order_index: 3,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-reg-4',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_key: 'minha_sequencia',
    title: 'Minha Sequência',
    subtitle: 'O espelho da sua dinâmica integrada e variações de contexto.',
    order_index: 4,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// ==========================================
// DEFINIÇÃO NORMATIVA DE PROMPTS — MENTE & EMOÇÕES (Momento 1 ao 5)
// ==========================================

export const BUILD_07C_MENTE_PROMPTS: CerPromptRecord[] = [
  // ----------------------------------------------------
  // MOMENTO 1 — MEU MUNDO EMOCIONAL
  // P1: Como você percebe que uma emoção chegou? (Free text FIRST + expander colapsado com 7 ideias)
  // P2: Quais emoções estiveram mais presentes nas últimas duas semanas? (Multi-select até 4, 8 cards)
  // P3 (Adaptativo): Você consegue compreender o que parece despertar essas emoções?
  // P4: Pensando nas últimas duas semanas, a maneira como você viveu suas emoções está...
  // ----------------------------------------------------
  {
    id: 'p-07c-pm1-geral',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'Como você percebe que uma emoção chegou',
    step_subtitle: 'Seu jeito de reconhecer e sentir no dia a dia.',
    component_type: 'FreeReflection',
    prompt_text: 'Como você percebe que uma emoção chegou?',
    helper_text: 'Conte espontaneamente como você percebe.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'mundo_emocional_geral',
      concept_key: 'emotion_recognition_style',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Precisa de algumas ideias para começar?',
        option_set_ref: 'opt_estilo_reconhecimento_emocional',
      },
      option_set: {
        id: 'opt_estilo_reconhecimento_emocional',
        items: [
          { id: 'reconheco_rapidamente', label: 'Reconheço rapidamente o que estou sentindo.' },
          { id: 'sinto_corpo_primeiro', label: 'Sinto primeiro no corpo e compreendo depois.' },
          {
            id: 'mudou_sem_nome',
            label: 'Percebo que alguma coisa mudou, mas tenho dificuldade de dar um nome.',
          },
          { id: 'penso_antes', label: 'Começo a pensar ou analisar antes de perceber a emoção.' },
          { id: 'preciso_tempo', label: 'Geralmente preciso de tempo para entender o que senti.' },
          { id: 'varia_situacao', label: 'Isso varia muito conforme a situação.' },
          { id: 'ainda_nao_sei', label: 'Ainda não sei dizer.' },
        ],
      },
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pm1-recorrentes',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 2,
    prompt_order: 2,
    step_title: 'Emoções mais presentes',
    step_subtitle: 'Nas últimas duas semanas.',
    component_type: 'MultiSelectCards',
    prompt_text: 'Quais emoções estiveram mais presentes nas últimas duas semanas?',
    helper_text:
      'Escolha até quatro. Não é necessário escolher apenas emoções difíceis: queremos compreender o seu momento de forma inteira.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'emocoes_recorrentes',
      concept_key: 'recurrent_emotional_experience',
      temporality: 'current_state',
      access_destination: 'participant_shared',
      max_selections: 4,
      options: [
        {
          id: 'medo',
          title: 'MEDO',
          description:
            'Pode aparecer como sensação de ameaça ou insegurança, preocupação, alerta, apreensão, ansiedade ou vontade de evitar alguma situação.',
        },
        {
          id: 'tristeza',
          title: 'TRISTEZA',
          description:
            'Pode aparecer como sensação de perda, desânimo, peso, vontade de chorar, diminuição de energia ou necessidade de recolhimento.',
        },
        {
          id: 'raiva',
          title: 'RAIVA',
          description:
            'Pode aparecer quando algo atravessa seus limites, frustra uma necessidade ou parece injusto. Pode ser sentida como irritação, impaciência, tensão ou vontade de reagir.',
        },
        {
          id: 'alegria',
          title: 'ALEGRIA',
          description:
            'Pode aparecer como contentamento, entusiasmo, vitalidade, prazer ou vontade de se aproximar da vida.',
        },
        {
          id: 'calma',
          title: 'CALMA',
          description:
            'Pode aparecer como sensação de segurança, espaço interno, estabilidade ou tranquilidade.',
        },
        {
          id: 'culpa',
          title: 'CULPA',
          description:
            'Pode aparecer quando você sente que fez ou deixou de fazer alguma coisa importante e deseja reparar.',
        },
        {
          id: 'vergonha',
          title: 'VERGONHA',
          description:
            'Pode aparecer como sensação de exposição, inadequação ou vontade de se esconder.',
        },
        {
          id: 'outra_emocao',
          title: 'OUTRA EMOÇÃO OU ESTADO',
          description:
            'Outro estado ou emoção que esteve presente e que você prefere nomear com suas palavras.',
          allow_custom_text: true,
          custom_text_placeholder: 'Escreva qual emoção ou estado esteve presente',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_pm1_adaptive_despertar',
            when: {
              any_of: [{ field: 'selected_count_gte', operator: 'equals', value: 1 }],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'compreensao_despertar_emocoes',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P3 Adaptativo (apenas a partir das emoções selecionadas em P2)
    id: 'p-07c-pm1-despertar',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 3,
    prompt_order: 3,
    step_title: 'O que parece despertar essas emoções',
    step_subtitle: 'Compreensão das situações, pensamentos ou necessidades.',
    component_type: 'ChoiceCards',
    prompt_text: 'Você consegue compreender o que parece despertar essas emoções?',
    helper_text:
      'Ao pensar nas emoções que você escolheu, você costuma perceber as situações, pensamentos, lembranças ou necessidades que parecem estar relacionados ao que sente?',
    is_required: false,
    version: 2,
    schema_config: {
      prompt_key: 'compreensao_despertar_emocoes',
      concept_key: 'emotional_triggers_awareness',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      adaptive_label: 'Uma pergunta a mais para compreender melhor sua experiência',
      dynamic_text_template:
        'Ao pensar em {{emocoes_selecionadas}}, você costuma perceber as situações, pensamentos, lembranças ou necessidades que parecem estar relacionados ao que sente?',
      per_emotion_expander: {
        enabled: true,
        prompt_label_template: 'O que parece estar relacionado à sua {{emocao}}?',
        helper_text: 'Espaço opcional para você descrever do seu jeito.',
      },
      options: [
        {
          id: 'geralmente_compreendo',
          title: 'Geralmente consigo compreender.',
          description: 'Costumo notar o que mobilizou a emoção.',
        },
        {
          id: 'as_vezes_preciso_tempo',
          title: 'Às vezes compreendo, mas preciso de algum tempo.',
          description: 'A compreensão chega depois de digerir o momento.',
        },
        {
          id: 'reconheco_mas_nao_entendo_por_que_afeta',
          title: 'Reconheço a situação, mas nem sempre entendo por que ela me afeta.',
          description: 'Vejo o acontecimento, mas a intensidade ou o efeito intrigam.',
        },
        {
          id: 'dificuldade_identificar',
          title: 'Tenho dificuldade de identificar o que despertou a emoção.',
          description: 'Fica difícil apontar o que deu início ao estado.',
        },
        {
          id: 'surge_sem_motivo_claro',
          title: 'Algumas vezes parece surgir sem um motivo claro.',
          description: 'A emoção chega de forma espontânea ou súbita.',
        },
        {
          id: 'varia_conforme_emocao',
          title: 'Isso varia conforme a emoção.',
          description: 'Com algumas é evidente, com outras é mais opaco.',
        },
        {
          id: 'ainda_nao_sei',
          title: 'Ainda não sei dizer.',
          description: 'Prefiro observar com o tempo.',
        },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P4: Comparação habitual (metadata current_state, sem classificação)
    id: 'p-07c-pm1-modo-habitual',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 4,
    prompt_order: 4,
    step_title: 'A forma como viveu suas emoções',
    step_subtitle: 'Nas últimas duas semanas.',
    component_type: 'ChoiceCards',
    prompt_text: 'Pensando nas últimas duas semanas, a maneira como você viveu suas emoções está:',
    helper_text:
      'Observe como seu momento atual se relaciona com o seu jeito habitual de funcionar.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'emocoes_comparacao_habitual',
      concept_key: 'emotional_current_state_comparison',
      temporality: 'current_state',
      access_destination: 'participant_shared',
      metadata_classification: 'current_state_only',
      options: [
        {
          id: 'parecida_habitual',
          title: 'Parecida com o meu jeito habitual',
          description: 'Dentro do ritmo e da intensidade costumeiros.',
        },
        {
          id: 'mais_intensa',
          title: 'Mais intensa do que costuma ser',
          description: 'Com mobilizações mais fortes ou frequentes.',
        },
        {
          id: 'mais_dificil_compreender_expressar',
          title: 'Mais difícil de compreender ou expressar',
          description: 'Mais confusa, retida ou com menor clareza.',
        },
        {
          id: 'mais_tranquila',
          title: 'Mais tranquila do que costuma ser',
          description: 'Com maior serenidade e menos oscilação.',
        },
        {
          id: 'diferente_outro_modo',
          title: 'Diferente de outro modo',
          description: 'Com nuances singulares deste período.',
        },
        {
          id: 'ainda_nao_sei',
          title: 'Ainda não sei dizer',
          description: 'Difícil comparar neste instante.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // MOMENTO 2 — OLHAR MAIS DE PERTO
  // P1: Quando você olha mais de perto, o que encontra? (Free text first + expander com ideias revisadas)
  // P2: Pensamento que acompanha a emoção (sensível: categoria compartilhada + texto privado por padrão)
  // ----------------------------------------------------
  {
    id: 'p-07c-pm2-experiencia',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-2',
    step_order: 5,
    prompt_order: 1,
    step_title: 'Olhar mais de perto',
    step_subtitle: 'O que você costuma encontrar ao olhar com atenção.',
    component_type: 'FreeReflection',
    prompt_text: 'Quando você olha mais de perto, o que encontra?',
    helper_text:
      'Às vezes, uma emoção vem acompanhada de outras emoções, sensações ou pensamentos.\n\nQuando você olha com um pouco mais de atenção para o que sente, o que costuma encontrar?\n\nConte espontaneamente ou abra algumas ideias para ajudar a observar.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'experiencia_complexa',
      concept_key: 'complex_emotional_experience',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Precisa de algumas ideias para começar?',
        option_set_ref: 'opt_experiencia_complexa_apoio',
      },
      option_set: {
        id: 'opt_experiencia_complexa_apoio',
        items: [
          {
            id: 'emocoes_juntas',
            label:
              'Às vezes percebo que uma emoção vem acompanhada de outra, como tristeza com raiva ou alívio com receio.',
          },
          {
            id: 'sensacoes_corpo',
            label:
              'Às vezes sinto sensações físicas nítidas, como aperto no peito, nó na garganta ou tensão.',
          },
          {
            id: 'emocao_sozinha',
            label: 'Às vezes a emoção aparece sozinha, bem definida e clara.',
          },
          {
            id: 'pensamentos_lembrancas',
            label: 'Às vezes me dou conta de lembranças ou pensamentos rápidos que vieram junto.',
          },
          {
            id: 'dificil_observar',
            label: 'Tenho dificuldade de observar o que mais está presente.',
          },
          { id: 'ainda_nao_sei', label: 'Ainda não sei dizer.' },
        ],
      },
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // Tela sensível 1: Pensamento associado à emoção
    // Categoria compartilhada com Daiane, texto livre privado por padrão
    id: 'p-07c-pm2-pensamento',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-2',
    step_order: 6,
    prompt_order: 2,
    step_title: 'O pensamento que costuma acompanhar a emoção',
    step_subtitle: 'A fala mental nesses momentos.',
    component_type: 'ChoiceCards',
    prompt_text: 'Nesses momentos, que tipo de pensamento costuma passar pela sua mente?',
    helper_text:
      'A opção que você escolher será compartilhada com Daiane para apoiar a compreensão do seu momento. O texto livre a seguir é opcional e só seu.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'pensamento_associado',
      concept_key: 'associated_thought_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      // Divisão de privacidade sensível: categoria compartilhada, texto privado por padrão
      privacy_split: {
        enabled: true,
        shared_category_label: 'Sua escolha acima é compartilhada com Daiane.',
        private_text_note: 'Este texto é só seu e não será compartilhado com Daiane.',
        share_checkbox_label: 'Quero compartilhar também este texto com Daiane.',
        default_shared: false,
      },
      options: [
        {
          id: 'preciso_dar_conta',
          title: '“Eu preciso dar conta de tudo”',
          description:
            'Sensação de urgência, responsabilidade solitária ou necessidade de resolver.',
        },
        {
          id: 'vai_dar_errado',
          title: '“E se der tudo errado ou algo ruim acontecer?”',
          description: 'Preocupação com desfechos difíceis ou consequências.',
        },
        {
          id: 'deveria_ter_feito_melhor',
          title: '“Eu deveria ter agido de outro jeito”',
          description: 'Revisão mental do que aconteceu ou autocrítica.',
        },
        {
          id: 'nao_tem_pensamento_claro',
          title: 'Não vem um pensamento claro, fico sem palavras',
          description: 'Sinto mais o impacto no corpo sem frases articuladas.',
        },
        {
          id: 'outro_tipo_pensamento',
          title: 'Passa outro tipo de pensamento pela minha mente',
          description: 'Uma fala interna com outras nuances.',
        },
        {
          id: 'ainda_nao_sei',
          title: 'Ainda não sei dizer',
          description: 'Prefiro observar antes de nomear.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // MOMENTO 3 — MINHA MENTE EM MOVIMENTO
  // P1: Tendências que AJUDAM (preservado)
  // P2: Tendências que CANSAM (preservado)
  // P3 (Adaptativo): Quando o mesmo movimento muda de efeito (frase reformulada)
  // P4 (NOVA TELA): Quando a pressão aumenta, quais movimentos aparecem em você? (até 3, 9 cards)
  // P5 (NOVO ADAPTATIVO): Quando esses movimentos ajudam — e quando começam a pesar?
  // ----------------------------------------------------
  {
    id: 'p-07c-pm3-ajuda',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 7,
    prompt_order: 1,
    step_title: 'Minha mente em movimento: quando ajuda',
    step_subtitle: 'Processos mentais que funcionam como recurso.',
    component_type: 'MultiSelectCards',
    prompt_text:
      'Pensando no ritmo dos seus pensamentos: quais dessas tendências mentais às vezes te AJUDAM?',
    helper_text: 'O mesmo processo mental pode ajudar em algumas situações e cansar em outras.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'mente_movimento_ajuda',
      concept_key: 'mental_tendency_perceived_help',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'antecipar_cenarios',
          title: 'Antecipar cenários e planejar detalhes',
          description: 'Pensar antes no que pode acontecer e como resolver.',
        },
        {
          id: 'analisar_profundo',
          title: 'Analisar a fundo e buscar coerência',
          description: 'Investigar detalhes e refletir até fazer sentido.',
        },
        {
          id: 'rever_passos',
          title: 'Rever o que aconteceu para aprender',
          description: 'Voltar à situação mentalmente para não repetir equívocos.',
        },
        {
          id: 'foco_resolucao',
          title: 'Focar rapidamente em achar uma saída prática',
          description: 'Não perder tempo e agir para desatar o nó.',
        },
        {
          id: 'nenhuma_especial',
          title: 'Nenhuma dessas em especial',
          description: 'Minha mente opera de outra maneira.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pm3-cansa',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 8,
    prompt_order: 2,
    step_title: 'Minha mente em movimento: quando cansa',
    step_subtitle: 'Quando a mesma tendência mental gera sobrecarga.',
    component_type: 'MultiSelectCards',
    prompt_text: 'E quais dessas tendências mentais às vezes te CANSAM ou pesam por dentro?',
    helper_text: 'Observe com gentileza onde pode haver desgaste mental.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'mente_movimento_cansa',
      concept_key: 'mental_tendency_perceived_cost',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'antecipar_cenarios',
          title: 'Antecipar cenários e planejar detalhes',
          description: 'Ficar prevendo desfechos difíceis sem conseguir desacelerar.',
        },
        {
          id: 'analisar_profundo',
          title: 'Analisar a fundo e buscar coerência',
          description: 'Ficar presa ou preso aos detalhes com excesso de reflexão.',
        },
        {
          id: 'rever_passos',
          title: 'Rever o que aconteceu para aprender',
          description: 'Ficar repassando a cena mentalmente com autocobrança.',
        },
        {
          id: 'foco_resolucao',
          title: 'Focar rapidamente em achar uma saída prática',
          description: 'Pressa de resolver sem dar espaço para respirar.',
        },
        {
          id: 'nenhuma_especial',
          title: 'Nenhuma dessas em especial',
          description: 'Não sinto peso dessas tendências.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_pm3_dual_overlap_branch',
            when: {
              any_of: [{ field: 'has_dual_overlap', operator: 'equals', value: true }],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'mente_movimento_profundidade_branch',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P3 Adaptativo (quando marcou a mesma nos dois): reformulação aprovada
    id: 'p-07c-pm3-branch',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 9,
    prompt_order: 3,
    step_title: 'Os dois lados do mesmo movimento',
    step_subtitle: 'Quando a mesma característica muda de efeito.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Você percebeu que o mesmo movimento pode ajudar em algumas situações e cansar em outras. Em que momento essa mudança costuma acontecer?',
    helper_text: 'Observe o que costuma marcar essa transição.',
    is_required: false,
    version: 2,
    schema_config: {
      prompt_key: 'mente_movimento_profundidade_branch',
      concept_key: 'recurring_mental_tendency',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      adaptive_label: 'Uma pergunta a mais para compreender melhor sua experiência',
      options: [
        {
          id: 'virada_sob_pressao',
          title: 'Muda de efeito quando estou sob muita pressão ou sem tempo',
          description: 'O recurso passa do ponto e se transforma em urgência.',
        },
        {
          id: 'dificil_desligar',
          title: 'Ajuda a resolver, mas depois o corpo demora a desacelerar',
          description: 'Cumpre o papel na hora, mas deixa um rastro de cansaço.',
        },
        {
          id: 'depende_do_ambiente',
          title: 'Depende de quem está comigo ou da segurança do ambiente',
          description: 'Em certos contextos funciona de forma leve; em outros, pesa.',
        },
        {
          id: 'nao_sei_dizer',
          title: 'Não sei dizer exatamente como acontece essa mudança',
          description: 'Percebo os dois efeitos sem uma regra clara.',
        },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P4 NOVA TELA: Quando a pressão aumenta, quais movimentos aparecem em você?
    // Escolha até três. 9 cards normativos aprovados.
    id: 'p-07c-pm3-movimentos-pressao',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 10,
    prompt_order: 4,
    step_title: 'Quando a pressão aumenta',
    step_subtitle: 'Movimentos que se manifestam sob estresse ou sobrecarga.',
    component_type: 'MultiSelectCards',
    prompt_text: 'Quando a pressão aumenta, quais movimentos aparecem em você?',
    helper_text:
      'Todos esses movimentos podem ter uma função e também um custo. Escolha até três que mais se aproximam da sua experiência. Isso não define quem você é.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'movimentos_sob_pressao',
      concept_key: 'mental_movements_under_pressure',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      max_selections: 3,
      options: [
        {
          id: 'buscar_fazer_jeito_certo',
          title: 'BUSCAR FAZER DO JEITO CERTO',
          description:
            'Organizo, reviso e procuro fazer bem. Quando pesa, podem surgir rigidez, insatisfação e exigência excessiva.',
        },
        {
          id: 'cuidar_e_ajudar',
          title: 'CUIDAR E AJUDAR',
          description:
            'Percebo as necessidades das pessoas e gosto de contribuir. Quando pesa, posso deixar minhas necessidades para depois e sentir desgaste ou ressentimento.',
        },
        {
          id: 'produzir_e_alcancar',
          title: 'PRODUZIR E ALCANÇAR',
          description:
            'Tenho energia para realizar e buscar resultados. Quando pesa, meu valor pode parecer depender do quanto produzo ou conquisto.',
        },
        {
          id: 'perder_sensacao_escolha',
          title: 'PERDER A SENSAÇÃO DE ESCOLHA',
          description:
            'Em alguns momentos difíceis, posso sentir que não tenho força, saída ou possibilidade de agir. Posso precisar de tempo e apoio para recuperar meu movimento.',
        },
        {
          id: 'entender_tudo_pela_razao',
          title: 'ENTENDER TUDO PELA RAZÃO',
          description:
            'A análise me ajuda a compreender e organizar. Quando pesa, posso me afastar do que sinto ou ter dificuldade de compartilhar vulnerabilidades.',
        },
        {
          id: 'antecipar_riscos',
          title: 'ANTECIPAR RISCOS',
          description:
            'Perceber riscos pode me ajudar a me preparar. Quando pesa, posso permanecer em alerta mesmo quando gostaria de descansar.',
        },
        {
          id: 'manter_me_em_movimento',
          title: 'MANTER-ME EM MOVIMENTO',
          description:
            'A curiosidade e o movimento trazem energia e novas possibilidades. Quando pesa, posso me ocupar ou buscar estímulos para não permanecer com algo difícil.',
        },
        {
          id: 'assumir_o_controle',
          title: 'ASSUMIR O CONTROLE',
          description:
            'Assumir responsabilidades pode ajudar a organizar e conduzir situações. Quando pesa, posso sentir tensão quando as coisas não acontecem como espero ou quando dependo de outras pessoas.',
        },
        {
          id: 'evitar_desconfortos_conflitos',
          title: 'EVITAR DESCONFORTOS E CONFLITOS',
          description:
            'Preservar a harmonia e escolher o momento certo pode ser cuidadoso. Quando pesa, posso adiar conversas, decisões ou tarefas importantes.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_pm3_movimentos_reflexao',
            when: {
              any_of: [{ field: 'selected_count_gte', operator: 'equals', value: 1 }],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'movimentos_pressao_reflexao',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P5 NOVO ADAPTATIVO: Quando esses movimentos ajudam — e quando começam a pesar?
    id: 'p-07c-pm3-movimentos-reflexao',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 11,
    prompt_order: 5,
    step_title: 'Quando ajudam e quando começam a pesar',
    step_subtitle: 'Reflexão sobre os movimentos que você escolheu.',
    component_type: 'FreeReflection',
    prompt_text: 'Quando esses movimentos ajudam — e quando começam a pesar?',
    helper_text:
      'Ao pensar nos movimentos que você escolheu, em quais situações eles costumam ajudar? E como percebe que começaram a consumir mais energia do que oferecer?',
    is_required: false,
    version: 2,
    schema_config: {
      prompt_key: 'movimentos_pressao_reflexao',
      concept_key: 'movements_resource_cost_reflection',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      adaptive_label: 'Uma pergunta a mais para compreender melhor sua experiência',
      open_first: {
        enabled: true,
        help_label: 'Precisa de algumas ideias para começar?',
        option_set_ref: 'opt_movimentos_pressao_apoio',
      },
      option_set: {
        id: 'opt_movimentos_pressao_apoio',
        items: [
          {
            id: 'ajuda_comeco_pesa_depois',
            label:
              'Costuma ajudar no começo a organizar, mas se estendo por muito tempo começa a esgotar.',
          },
          {
            id: 'pesa_em_relacoes',
            label:
              'Ajuda nas minhas tarefas práticas, mas pesa nas minhas relações com outras pessoas.',
          },
          {
            id: 'noto_no_corpo',
            label:
              'Percebo que começou a pesar quando sinto tensão muscular, respiração curta ou insônia.',
          },
          { id: 'ainda_nao_sei', label: 'Ainda estou aprendendo a notar essa virada.' },
        ],
      },
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // MOMENTO 4 — COMO EU ME TRATO POR DENTRO
  // P1: Diálogo interno diante de um desencontro (sensível: categoria compartilhada + texto privado)
  // P2 (NOVA PERGUNTA): Para onde sua cobrança costuma se dirigir? (Single-choice)
  // P3 (NOVA PERGUNTA): Efeito da cobrança (Multi-select, zero termo "Crítico")
  // P4: Diálogo interno diante de uma conquista (preservado)
  // ----------------------------------------------------
  {
    // Tela sensível 2: Diálogo diante de desencontro / erro
    // Categoria compartilhada com Daiane, texto livre privado por padrão
    id: 'p-07c-pm4-erro',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-4',
    step_order: 12,
    prompt_order: 1,
    step_title: 'Diálogo interno: diante de um desencontro',
    step_subtitle: 'Quando algo não acontece como você esperava.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Quando algo não acontece como você esperava, como costuma soar a sua voz interna?',
    helper_text:
      'A opção que você escolher será compartilhada com Daiane para compreender seus caminhos internos. O texto livre a seguir é opcional e só seu.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'self_dialogue_erro',
      concept_key: 'self_dialogue_after_mistake',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      // Divisão de privacidade sensível
      privacy_split: {
        enabled: true,
        shared_category_label: 'Sua escolha acima é compartilhada com Daiane.',
        private_text_note: 'Este texto é só seu e não será compartilhado com Daiane.',
        share_checkbox_label: 'Quero compartilhar também este texto com Daiane.',
        default_shared: false,
      },
      options: [
        {
          id: 'cobranca_firme',
          title: 'Uma cobrança firme e exigente',
          description: '“Como pude deixar isso acontecer? Eu deveria ter previsto.”',
        },
        {
          id: 'recolhimento_insuficiencia',
          title: 'Um recolhimento ou sensação de insuficiência',
          description: 'Vontade de me afastar ou sensação de não ser capaz.',
        },
        {
          id: 'compreensao_acolhimento',
          title: 'Compreensão e busca de acolhimento',
          description: '“Fiz o que foi possível naquelas condições; isso acontece.”',
        },
        {
          id: 'diferente_comigo',
          title: 'É diferente comigo / Tenho outro jeito de viver esse momento',
          description: 'Minha forma de falar comigo tem outras nuances.',
        },
        {
          id: 'nao_sei',
          title: 'Ainda não sei dizer',
          description: 'Difícil reparar com clareza na fala interna.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P2 NOVA PERGUNTA: Direção da cobrança
    id: 'p-07c-pm4-direcao-cobranca',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-4',
    step_order: 13,
    prompt_order: 2,
    step_title: 'Para onde a cobrança costuma se dirigir',
    step_subtitle: 'O foco da exigência diante de desfechos inesperados.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Quando algo não acontece como você gostaria, para onde sua cobrança costuma se dirigir?',
    helper_text: 'Observe para onde sua atenção e exigência se voltam com mais frequência.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'direcao_da_cobranca',
      concept_key: 'inner_demand_direction',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'para_mim',
          title: 'Principalmente para mim.',
          description: 'Sinto que o erro, a falha ou a responsabilidade foram meus.',
        },
        {
          id: 'para_outras_pessoas',
          title: 'Principalmente para outras pessoas.',
          description: 'Sinto incômodo com o que os outros fizeram ou deixaram de fazer.',
        },
        {
          id: 'para_situacao_circunstancias',
          title: 'Principalmente para a situação ou as circunstâncias.',
          description: 'A irritação se volta para o contexto, os imprevistos ou o acaso.',
        },
        {
          id: 'se_divide_direcoes',
          title: 'Costuma se dividir entre essas direções.',
          description: 'A cobrança oscila entre mim, os outros e o ambiente.',
        },
        {
          id: 'nao_percebo_cobranca',
          title: 'Não percebo muita cobrança.',
          description: 'Costumo encarar os acontecimentos com naturalidade.',
        },
        {
          id: 'ainda_nao_sei',
          title: 'Ainda não sei dizer.',
          description: 'Prefiro observar melhor antes de concluir.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P3 NOVA PERGUNTA: Efeito da cobrança (zero termo "Crítico")
    id: 'p-07c-pm4-efeito-cobranca',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-4',
    step_order: 14,
    prompt_order: 3,
    step_title: 'O efeito dessa cobrança',
    step_subtitle: 'Se ajuda a ajustar ou se produz sobrecarga interna.',
    component_type: 'MultiSelectCards',
    prompt_text:
      'Quando essa cobrança aparece, ela ajuda você a compreender e ajustar alguma coisa ou acaba produzindo culpa, vergonha, irritação ou sensação de nunca ser suficiente?',
    helper_text: 'Escolha o que mais se aproxima do que você costuma experimentar.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'efeito_da_cobranca',
      concept_key: 'inner_demand_perceived_effect',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'ajuda_perceber_corrigir',
          title: 'Ajuda a perceber e corrigir.',
          description: 'Traz clareza prática para fazer ajustes no que for preciso.',
        },
        {
          id: 'ajuda_comeco_depois_pesa',
          title: 'Ajuda no começo, mas depois pesa.',
          description: 'Mobiliza para a ação inicial, mas deixa um rastro de cansaço.',
        },
        {
          id: 'faz_cobrar_mais',
          title: 'Faz com que eu me cobre ainda mais.',
          description: 'Gera uma espiral de exigência e autocobrança.',
        },
        {
          id: 'aumenta_irritacao_outros',
          title: 'Aumenta minha irritação com outras pessoas.',
          description: 'Aumenta a impaciência ou o distanciamento com quem está ao redor.',
        },
        {
          id: 'nenhuma_circunstancia_boa',
          title: 'Faz parecer que nenhuma circunstância está boa o bastante.',
          description: 'Fica uma sensação persistente de insatisfação.',
        },
        {
          id: 'isso_varia',
          title: 'Isso varia.',
          description: 'Em algumas ocasiões ajuda, em outras produz mal-estar.',
        },
        {
          id: 'ainda_nao_sei',
          title: 'Ainda não sei dizer.',
          description: 'Não tenho clareza sobre o impacto dessa cobrança.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P4: Diálogo interno diante de conquista (preservado)
    id: 'p-07c-pm4-realizacao',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-4',
    step_order: 15,
    prompt_order: 4,
    step_title: 'Diálogo interno: diante de uma conquista',
    step_subtitle: 'Quando algo dá certo e você fez parte disso.',
    component_type: 'ChoiceCards',
    prompt_text:
      'E quando algo dá muito certo e você participou disso, como você acolhe essa conquista por dentro?',
    helper_text: 'Compartilhado com Daiane para reconhecer seus recursos e formas de celebrar.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'self_dialogue_realizacao',
      concept_key: 'self_dialogue_after_success',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'apenas_obrigacao',
          title: '“Não fiz mais que a minha obrigação”',
          description: 'Passo rápido para a próxima tarefa sem celebrar.',
        },
        {
          id: 'alivio_que_passou',
          title: 'Mais um alívio de que passou do que celebração',
          description: 'A sensação de “menos mal que terminou bem”.',
        },
        {
          id: 'celebracao_genuina',
          title: 'Alegria genuína e reconhecimento do próprio valor',
          description: 'Consigo sentir satisfação e reconhecer meu empenho com carinho.',
        },
        {
          id: 'diferente_comigo',
          title: 'É diferente comigo / Tenho outro jeito de viver',
          description: 'Outra dinâmica interna presente.',
        },
        {
          id: 'nao_sei',
          title: 'Ainda não sei dizer',
          description: 'Não tenho percepção clara sobre isso.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // MOMENTO 5 — DOIS RETRATOS DE MIM
  // P1: Quando tenho espaço por dentro (linguagem neutra)
  // P2: Quando a sobrecarga pesa (linguagem neutra, título sem marcação de gênero)
  // P3 (NOVA PERGUNTA FINAL): O que costuma ajudar você a recuperar espaço interno?
  // ----------------------------------------------------
  {
    id: 'p-07c-pm5-espaco',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-5',
    step_order: 16,
    prompt_order: 1,
    step_title: 'Quando tenho espaço por dentro',
    step_subtitle: 'Retrato em momentos de respiro e presença.',
    component_type: 'MultiSelectCards',
    prompt_text:
      'Pensando nos dias em que você tem espaço por dentro e calma, como suas qualidades costumam aparecer?',
    helper_text: 'Escolha até 3 traços que florescem quando há espaço.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'dois_retratos_espaco',
      concept_key: 'contextual_self_trait',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      max_selections: 3,
      options: [
        {
          id: 'cuidado_atento',
          title: 'Cuidado atento e presença generosa',
          description: 'Capacidade de escutar e cuidar com calma e atenção.',
        },
        {
          id: 'clareza_decisao',
          title: 'Clareza e capacidade de resolver',
          description: 'Tomada de decisões sem pressa nem ansiedade.',
        },
        {
          id: 'criatividade_leveza',
          title: 'Criatividade, curiosidade e leveza',
          description: 'Abertura para o novo e flexibilidade diante do inesperado.',
        },
        {
          id: 'firmeza_limites',
          title: 'Firmeza serena para dizer o que precisa',
          description: 'Capacidade de colocar limites com tranquilidade sem precisar se defender.',
        },
        {
          id: 'silencio_nutritivo',
          title: 'Conexão profunda com o silêncio e o próprio ritmo',
          description: 'Estar bem em silêncio sem precisar produzir o tempo todo.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pm5-sobrecarga',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-5',
    step_order: 17,
    prompt_order: 2,
    step_title: 'Quando a sobrecarga pesa',
    step_subtitle: 'Como as mesmas características se manifestam sob pressão.',
    component_type: 'MultiSelectCards',
    prompt_text:
      'E nos dias em que o limite foi ultrapassado ou a sobrecarga pesa, o que costuma acontecer?',
    helper_text: 'Sem julgamento: são adaptações contextuais do seu sistema.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'dois_retratos_sobrecarga',
      concept_key: 'contextual_self_trait_under_load',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      max_selections: 3,
      options: [
        {
          id: 'cuidado_atento',
          title: 'O cuidado vira hipervigilância ou controle',
          description: 'Alerta contínuo a tudo para nada sair do lugar.',
        },
        {
          id: 'clareza_decisao',
          title: 'A clareza vira pressa e urgência de fechar',
          description: 'Impaciência se as coisas não andam no ritmo esperado.',
        },
        {
          id: 'criatividade_leveza',
          title: 'A leveza se perde e vem a dispersão mental',
          description: 'Muitas ideias ao mesmo tempo sem conseguir aterrar.',
        },
        {
          id: 'firmeza_limites',
          title: 'A firmeza vira rigidez ou distanciamento',
          description: 'Fechamento em silêncio ou afastamento para autoproteção.',
        },
        {
          id: 'silencio_nutritivo',
          title: 'O silêncio vira isolamento ou exaustão',
          description: 'Recolhimento por falta de energia para interagir.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    // P3 NOVA PERGUNTA FINAL: O que costuma ajudar você a recuperar espaço interno?
    // Multi-select + texto livre opcional, compartilhado com Daiane, nunca prescrição automática
    id: 'p-07c-pm5-recuperar-espaco',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-5',
    step_order: 18,
    prompt_order: 3,
    step_title: 'Recuperar espaço interno',
    step_subtitle: 'O que costuma ajudar a reencontrar o respiro.',
    component_type: 'MultiSelectCards',
    prompt_text: 'O que costuma ajudar você a recuperar espaço interno?',
    helper_text:
      'Escolha o que realmente costuma ajudar — mesmo que seja pouco — ou escreva do seu jeito. Essas informações serão compartilhadas com Daiane para orientar o cuidado conjunto, sem virar uma prescrição automática.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'recursos_recuperar_espaco',
      concept_key: 'inner_space_recovery_resources',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      allow_free_text_addition: true,
      free_text_addition_placeholder: 'Escreva do seu jeito o que também costuma ajudar...',
      options: [
        {
          id: 'descansar_silencio',
          title: 'Descansar ou ficar em silêncio',
          description: 'Pausar compromissos e permitir repouso.',
        },
        {
          id: 'movimentar_corpo',
          title: 'Movimentar o corpo',
          description: 'Caminhar, alongar ou praticar alguma atividade física.',
        },
        {
          id: 'respirar_meditar',
          title: 'Respirar, meditar ou realizar alguma prática',
          description: 'Práticas de respiração, presença ou desaceleração.',
        },
        {
          id: 'organizar_pequeno_passo',
          title: 'Organizar um pequeno próximo passo',
          description: 'Dar foco prático para desatar uma tarefa simples.',
        },
        {
          id: 'conversar_alguem_confianca',
          title: 'Conversar com alguém em quem confio',
          description: 'Compartilhar o momento com quem me escuta.',
        },
        {
          id: 'estar_na_natureza',
          title: 'Estar na natureza',
          description: 'Contato com ar livre, plantas, luz natural ou espaços abertos.',
        },
        {
          id: 'fazer_algo_criativo',
          title: 'Fazer algo criativo',
          description: 'Música, escrita, desenho, cozinhar ou expressão artística.',
        },
        {
          id: 'ainda_nao_sei',
          title: 'Ainda não sei',
          description: 'Ainda estou descobrindo o que me ajuda a retornar.',
        },
        {
          id: 'outra_coisa',
          title: 'Outra coisa',
          description: 'Um recurso particular que você prefere descrever com suas palavras.',
          allow_custom_text: true,
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// ==========================================
// DEFINIÇÃO NORMATIVA DE PROMPTS — REGULAÇÃO & PADRÕES DE RESPOSTA (PR1..PR4)
// ==========================================

export const BUILD_07C_REGULACAO_PROMPTS: CerPromptRecord[] = [
  // ----------------------------------------------------
  // PR1 — QUANDO COMEÇA: Condensar contexto de mobilização + primeiros sinais em UMA experiência coerente.
  // Reutiliza contexto e emoção via Registro Único quando disponíveis (REUSED).
  // Sinais de timing: signal_awareness_timing ("Você costuma perceber na hora ou só depois?")
  // Prompts internos: contexto_mobilizacao + primeiros_sinais
  // ----------------------------------------------------
  {
    id: 'p-07c-pr1-contexto',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'Quando algo mexe com você',
    step_subtitle: 'Cenários e gatilhos que mais costumam mobilizar seu corpo e mente.',
    component_type: 'ChoiceCards',
    prompt_text: 'De forma geral, que tipo de situação mais costuma tirar você do seu eixo?',
    helper_text: 'Escolha a cena que mais ressoa com a sua experiência recente.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'contexto_mobilizacao',
      concept_key: 'mobilization_context',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'excesso_demandas',
          title: 'Excesso de demandas e sensação de urgência',
          description: 'Muitas tarefas ao mesmo tempo com pouco tempo para respirar.',
        },
        {
          id: 'conflito_critica',
          title: 'Conflito interpessoal, crítica ou desencontro',
          description: 'Tensão com alguém importante ou sensação de julgamento.',
        },
        {
          id: 'imprevisto_perda_controle',
          title: 'Imprevistos e perda de controle do planejado',
          description: 'Mudanças bruscas de rumo ou incerteza no ambiente.',
        },
        {
          id: 'injustica_falta_espaco',
          title: 'Sensação de injustiça ou de não ter voz',
          description: 'Sentir que seu espaço ou seus limites foram desrespeitados.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Depende muito do dia',
          description: 'Não identifico um gatilho único habitual.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pr1-primeiros-sinais',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-1',
    step_order: 2,
    prompt_order: 2,
    step_title: 'Os primeiros sinais percebidos',
    step_subtitle: 'O corpo e a mente avisando que algo mudou.',
    component_type: 'ChoiceCards',
    prompt_text: 'Quando isso começa a acontecer, onde o aviso costuma chegar primeiro?',
    helper_text: 'Seus sinais precoces de mobilização.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'primeiros_sinais_mobilizacao',
      concept_key: 'early_body_signal',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'tensao_corporal',
          title: 'No corpo físico: respiração, ombros, estômago ou aperto',
          description: 'O corpo fecha ou acelera quase que de imediato.',
        },
        {
          id: 'aceleracao_mental',
          title: 'Na mente: pensamentos em disparada ou urgência de agir',
          description: 'A mente busca saídas rápidas antes de o corpo reagir.',
        },
        {
          id: 'bloqueio_embotamento',
          title: 'Sensação de paralisia, nó na garganta ou confusão',
          description: 'Fico sem palavras ou sinto um desligamento breve.',
        },
        {
          id: 'nao_percebo_na_hora',
          title: 'Só percebo muito depois que tudo já passou',
          description: 'Na hora continuo agindo sem notar o sinal.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pr1-timing',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-1',
    step_order: 3,
    prompt_order: 3,
    step_title: 'O tempo da sua percepção',
    step_subtitle: 'Como a consciência do momento se dá para você.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Você costuma perceber que foi mobilizada ou mobilizado na hora em que acontece ou só algum tempo depois?',
    helper_text: 'Sem nenhuma cobrança: cada história molda uma velocidade diferente de percepção.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'signal_awareness_timing',
      concept_key: 'signal_awareness_timing',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'percebo_na_hora',
          title: 'Costumo perceber na hora',
          description: 'Sinto o impacto logo no instante em que o fato ocorre.',
        },
        {
          id: 'percebo_logo_depois',
          title: 'Percebo logo depois, quando respiro',
          description: 'Passam alguns minutos e noto o que aconteceu comigo.',
        },
        {
          id: 'percebo_so_ao_fim_do_dia',
          title: 'Só percebo horas depois ou no fim do dia',
          description: 'Quando o corpo deita ou relaxa é que sinto o cansaço do impacto.',
        },
        {
          id: 'demoro_dias_ou_nao_sei',
          title: 'Às vezes demoro dias ou tenho dificuldade de notar',
          description: 'O padrão roda no piloto automático sem que eu veja.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // PR2 — O QUE ACONTECE COMIGO
  // ----------------------------------------------------
  {
    id: 'p-07c-pr2-resposta',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-2',
    step_order: 4,
    prompt_order: 1,
    step_title: 'O que você tende a fazer',
    step_subtitle: 'Sua resposta mais espontânea sob estresse.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Quando isso acontece, o que você percebe vontade de fazer — ou acaba fazendo quase sem perceber?',
    helper_text: 'Tendência descritiva observada no seu comportamento.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'resposta_tendencia',
      concept_key: 'regulation_response_tendency',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'resolver_imediatamente',
          title: 'Tentar resolver e controlar imediatamente',
          description: 'Tomar a frente, falar firme, agir rápido para tirar a tensão da frente.',
        },
        {
          id: 'afastar_recolher',
          title: 'Me afastar, calar ou buscar distância física',
          description: 'Dar um passo atrás, ficar em silêncio ou me isolar para respirar.',
        },
        {
          id: 'ceder_agradar',
          title: 'Ceder, concordar ou tentar acalmar os outros',
          description: 'Evitar o atrito e buscar apaziguar o clima.',
        },
        {
          id: 'travar_congelar',
          title: 'Ficar em dúvida, paralisada ou paralisado sem saber o que falar',
          description: 'A resposta não sai e o corpo fica em compasso de espera.',
        },
        {
          id: 'outro_jeito',
          title: 'Tenho outro jeito específico de reagir',
          description: 'Minha reação tem outra forma de se apresentar.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_pr2_vontade_x_comportamento',
            when: {
              any_of: [{ field: 'urge_different_from_enacted', operator: 'equals', value: true }],
            },
            then: { action: 'open_branch', target_prompt_key: 'vontade_x_comportamento_r4' },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pr2-branch-r4',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-2',
    step_order: 5,
    prompt_order: 2,
    step_title: 'Vontade interna vs O que você realmente faz',
    step_subtitle: 'Entre o impulso e a contenção no mundo externo.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Essa resposta é mais o que você SENTE VONTADE de fazer ou o que você REALMENTE costuma fazer?',
    helper_text: 'Diferenciando o impulso sentido do comportamento visível.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'vontade_x_comportamento_r4',
      concept_key: 'enacted_behavior_reported',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'sinto_e_faco',
          title: 'Costuma ser exatamente o que eu sinto e acabo fazendo',
          description: 'O impulso vai direto para a ação sem tanta filtragem.',
        },
        {
          id: 'vontade_de_afastar_mas_resolvo',
          title: 'Sinto vontade de sumir/afastar, mas acabo assumindo e resolvendo',
          description: 'A contenção externa esconde o impulso interno de fuga.',
        },
        {
          id: 'vontade_de_falar_mas_calo',
          title: 'Sinto vontade de confrontar/falar, mas acabo calando ou cedendo',
          description: 'Contenho a reação para manter a paz.',
        },
        {
          id: 'varia_pela_situacao',
          title: 'Varia completamente conforme a situação ou as pessoas envolvidas',
          description: 'Em certos contextos ajo, em outros contenho.',
        },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pr2-funcao',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-2',
    step_order: 6,
    prompt_order: 3,
    step_title: 'O que essa resposta tenta cuidar',
    step_subtitle: 'A intenção protetiva percebida no calor da hora.',
    component_type: 'FreeReflection',
    prompt_text:
      'No instante em que essa resposta acontece, você percebe o que ela tenta resolver ou proteger?',
    helper_text: 'Não existe certo ou errado. Pode ser "não sei" ou uma percepção espontânea.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'funcao_percebida',
      concept_key: 'perceived_response_function',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Quer algumas ideias para pensar?',
        option_set_ref: 'opt_funcao_percebida_apoio',
      },
      option_set: {
        id: 'opt_funcao_percebida_apoio',
        items: [
          { id: 'evitar_conflito_maior', label: 'Tenta evitar um conflito ainda mais desgastante' },
          {
            id: 'garantir_seguranca_controle',
            label: 'Tenta garantir segurança e recuperar o controle rápido',
          },
          {
            id: 'diminuir_exposicao',
            label: 'Tenta reduzir minha exposição ou me proteger de julgamentos',
          },
          { id: 'manter_vinculo', label: 'Tenta manter a harmonia e o vínculo com a outra pessoa' },
          { id: 'nao_sei', label: 'Não sei / Nunca tinha pensado nisso sob essa perspectiva' },
        ],
      },
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // PR3 — E DEPOIS / MEU CAMINHO DE VOLTA
  // ----------------------------------------------------
  {
    id: 'p-07c-pr3-custo',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-3',
    step_order: 7,
    prompt_order: 1,
    step_title: 'E depois que o momento passa?',
    step_subtitle: 'A repercussão e o estado que fica no corpo e na mente.',
    component_type: 'ChoiceCards',
    prompt_text: 'Passada a situação, o que costuma ficar com você?',
    helper_text: 'O custo posterior ou a facilidade de restabelecimento.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'custo_posterior',
      concept_key: 'perceived_later_cost',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'volto_rapido',
          title: 'Volto rápido ao normal',
          description: 'Passou a situação, o corpo desestressa e sigo em frente.',
        },
        {
          id: 'continuo_pensando',
          title: 'Continuo pensando naquilo em looping',
          description: 'A cena fica repassando na mente várias vezes.',
        },
        {
          id: 'corpo_tenso_cansado',
          title: 'Fico com o corpo tenso ou uma onda de cansaço pesado',
          description: 'O impacto físico demora para dissolver.',
        },
        {
          id: 'culpa_ou_arrependimento',
          title: 'Sensação de culpa, autocobrança ou arrependimento',
          description: 'Penso que deveria ter reagido de outra forma.',
        },
        {
          id: 'distancia_demora_voltar',
          title: 'Fico distante e demoro bastante tempo para me reaproximar',
          description: 'Leva um tempo para o espaço interno reabrir.',
        },
        {
          id: 'depende_nada_especial',
          title: 'Depende da gravidade / Nada em especial',
          description: 'Não tenho um padrão fixo de custo.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pr3-recurso',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-3',
    step_order: 8,
    prompt_order: 2,
    step_title: 'O que ajuda você a voltar ao eixo',
    step_subtitle: 'Seus recursos conhecidos de retorno.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Quando você precisa se restabelecer e reencontrar o seu eixo, o que costuma ajudar?',
    helper_text: 'Camada 1: Recurso conhecido.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'known_return_resource',
      concept_key: 'known_return_resource',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'silencio_solitude',
          title: 'Ficar em silêncio e um tempo com tranquilidade',
          description: 'Estar no meu canto sem precisar responder a ninguém.',
        },
        {
          id: 'conversar_desabafar',
          title: 'Conversar com alguém de confiança que me escute',
          description: 'Pôr em palavras e me sentir acolhida ou acolhido.',
        },
        {
          id: 'movimento_ar_livre',
          title: 'Caminhar, movimentar o corpo ou sair ao ar livre',
          description: 'Mudar de ambiente e deixar o corpo descarregar.',
        },
        {
          id: 'pausa_sono_respiro',
          title: 'Dormir, deitar ou fazer pausas intencionais',
          description: 'Dar tempo para o sistema se recompor no repouso.',
        },
        {
          id: 'as_vezes_nao_sei',
          title: 'Às vezes não sei como voltar ou sinto dificuldade de reencontrar o caminho',
          description: 'Fico esperando o tempo passar sem um recurso claro.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_pr3_acesso_sob_estresse',
            when: {
              any_of: [
                { field: 'choice', operator: 'equals', value: 'silencio_solitude' },
                { field: 'choice', operator: 'equals', value: 'conversar_desabafar' },
                { field: 'choice', operator: 'equals', value: 'movimento_ar_livre' },
                { field: 'choice', operator: 'equals', value: 'pausa_sono_respiro' },
              ],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'resource_access_under_stress_layer',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pr3-acesso',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-3',
    step_order: 9,
    prompt_order: 3,
    step_title: 'O acesso ao recurso sob estresse real',
    step_subtitle: 'Saber que ajuda vs Conseguir usar na hora em que precisa.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Quando você realmente precisa, esse recurso costuma estar disponível e acessível para você?',
    helper_text: 'Informação compartilhada para orientar os combinados do seu cuidado.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'resource_access_under_stress_layer',
      concept_key: 'resource_access_under_stress',
      temporality: 'context_dependent',
      access_destination: 'shared_care',
      options: [
        {
          id: 'consigo_recorrer',
          title: 'Consigo recorrer a ele na maioria das vezes',
          description: 'Lembro e tenho autonomia para colocar em prática.',
        },
        {
          id: 'as_vezes_consigo',
          title: 'Às vezes consigo, depende do nível de estresse',
          description: 'Se o estresse for moderado ajuda; se for muito alto, esqueço.',
        },
        {
          id: 'sei_que_ajuda_mas_dificil',
          title: 'Sei que me ajuda, mas é muito difícil acessar no calor da hora',
          description: 'Fica uma distância grande entre saber e conseguir fazer.',
        },
        {
          id: 'depende_de_alguem',
          title: 'Depende de outra pessoa ou de condições externas favoráveis',
          description: 'Não depende só de mim para estar disponível.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Ainda estou descobrindo',
          description: 'Não tenho certeza de como isso funciona na prática.',
        },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // PR4 — MINHA SEQUÊNCIA
  // ----------------------------------------------------
  {
    id: 'p-07c-pr4-espelho-recognition',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-4',
    step_order: 10,
    prompt_order: 1,
    step_title: 'Minha Sequência: o espelho da sua dinâmica',
    step_subtitle: 'Um retrato integrado do caminho que você percorreu.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Olhando para este espelho da sua sequência: isso se parece com o que costuma acontecer com você?',
    helper_text: 'Sua percepção autoral é soberana. Não há obrigação de confirmar.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'sequence_recognition',
      concept_key: 'sequence_recognition_response',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      composite_mirror: {
        enabled: true,
        steps: [
          { label: 'QUANDO ALGO MEXE COMIGO', prompt_ref: 'contexto_mobilizacao' },
          { label: 'EU PERCEBO', prompt_ref: 'primeiros_sinais_mobilizacao' },
          { label: 'EU TENHO TENDÊNCIA A', prompt_ref: 'resposta_tendencia' },
          { label: 'NA HORA ISSO...', prompt_ref: 'funcao_percebida' },
          { label: 'ÀS VEZES DEPOIS...', prompt_ref: 'custo_posterior' },
          { label: 'O QUE ME AJUDA A VOLTAR', prompt_ref: 'known_return_resource' },
        ],
      },
      options: [
        {
          id: 'sim_bastante',
          title: 'Sim, bastante',
          description: 'Retrata com muita fidelidade a minha dinâmica habitual.',
        },
        {
          id: 'em_parte',
          title: 'Em parte',
          description: 'Alguns trechos combinam muito, outros acontecem diferente.',
        },
        {
          id: 'depende_do_contexto',
          title: 'Depende muito do contexto',
          description: 'Com certas pessoas ou situações a sequência muda.',
        },
        {
          id: 'nao_e_bem_assim',
          title: 'Não é bem assim',
          description: 'Não me reconheço nesse retrato consolidado.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07c-pr4-variabilidade',
    experience_id: REGULACAO_RESPOSTAS_EXPERIENCE_ID,
    moment_id: 'mom-reg-4',
    step_order: 11,
    prompt_order: 2,
    step_title: 'Variações de contexto',
    step_subtitle: 'Situações em que o caminho é completamente diferente.',
    component_type: 'FreeReflection',
    prompt_text:
      'Tem alguma situação, ambiente ou relação em que sua sequência acontece de forma completamente diferente?',
    helper_text: 'Espaço opcional para você registrar exceções e nuances da sua vida.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'contextual_sequence_variation',
      concept_key: 'contextual_sequence_variation',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Exemplos comuns de variação de contexto',
        option_set_ref: 'opt_variacao_contexto_apoio',
      },
      option_set: {
        id: 'opt_variacao_contexto_apoio',
        items: [
          {
            id: 'em_casa_x_trabalho',
            label: 'No trabalho tendo a agir de uma forma e em casa de outra',
          },
          {
            id: 'com_quem_tenho_intimidade',
            label: 'Com quem tenho intimidade me permito expressar; em outros ambientes me fecho',
          },
          {
            id: 'quando_estou_com_descanso',
            label:
              'Quando estou descansada ou descansado consigo pausar; com exaustão viro reativa ou reativo',
          },
          { id: 'nao_tem_variacao', label: 'Costuma ser bem parecido em qualquer cenário' },
        ],
      },
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// Prompts consolidados do Build 07C
export const BUILD_07C_ALL_PROMPTS: CerPromptRecord[] = [
  ...BUILD_07C_MENTE_PROMPTS,
  ...BUILD_07C_REGULACAO_PROMPTS,
]

// Chaves canônicas de caminho essencial de Mente (Momento 1 ao 5)
export const MENTE_ESSENTIAL_PATH_PROMPT_KEYS = [
  'mundo_emocional_geral', // Momento 1 - P1
  'emocoes_recorrentes', // Momento 1 - P2
  'emocoes_comparacao_habitual', // Momento 1 - P4
  'experiencia_complexa', // Momento 2 - P1
  'pensamento_associado', // Momento 2 - P2 (categoria compartilhada / texto privado)
  'mente_movimento_ajuda', // Momento 3 - P1
  'mente_movimento_cansa', // Momento 3 - P2
  'movimentos_sob_pressao', // Momento 3 - P4
  'self_dialogue_erro', // Momento 4 - P1 (categoria compartilhada / texto privado)
  'direcao_da_cobranca', // Momento 4 - P2
  'efeito_da_cobranca', // Momento 4 - P3
  'self_dialogue_realizacao', // Momento 4 - P4
  'dois_retratos_espaco', // Momento 5 - P1
  'dois_retratos_sobrecarga', // Momento 5 - P2
  'recursos_recuperar_espaco', // Momento 5 - P3
]

// Chaves canônicas de caminho essencial de Regulação (PR1..PR4)
export const REGULACAO_ESSENTIAL_PATH_PROMPT_KEYS = [
  'contexto_mobilizacao', // PR1a
  'primeiros_sinais_mobilizacao', // PR1b
  'signal_awareness_timing', // PR1c
  'resposta_tendencia', // PR2a
  'funcao_percebida', // PR2b
  'custo_posterior', // PR3a
  'known_return_resource', // PR3b
  'sequence_recognition', // PR4a
  'contextual_sequence_variation', // PR4b
]
