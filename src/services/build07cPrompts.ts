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
  title: 'Mente & Emoções — compreender como você funciona por dentro',
  subtitle:
    'Investigação do seu funcionamento habitual e repetido ao longo dos últimos anos.',
  order_index: 3,
  is_pilot: false,
  opening_text:
    'A mente e as emoções não são a mesma coisa, mas estão profundamente interligadas.\n\nAs emoções envolvem sensações, mudanças no corpo, impulsos e respostas diante do que vivemos. A mente participa desse processo por meio dos pensamentos, lembranças, interpretações, expectativas e histórias que contamos para nós mesmos.\n\nO que pensamos pode intensificar ou suavizar uma emoção. Ao mesmo tempo, aquilo que sentimos pode influenciar nossa atenção, nossas escolhas e a maneira como interpretamos uma situação.\n\nNesta experiência, vamos observar como o seu funcionamento mental e emocional costuma acontecer e quais movimentos tendem a se repetir em diferentes momentos da sua vida.\n\nNão existem respostas certas ou erradas. Responda sem julgamento. Apenas observe e descreva, com honestidade e gentileza, o que percebe sobre si.\n\nPense principalmente no que costuma se repetir ao longo dos últimos anos — e não apenas em uma situação isolada ou em como você está hoje. Se perceber que alguma coisa mudou recentemente, você também poderá contar.\n\nEste não é um teste diagnóstico e suas respostas não definem quem você é. Algumas formas de pensar, sentir e agir podem ter ajudado você a enfrentar momentos difíceis. Com consciência, elas também podem ser compreendidas, cuidadas e transformadas.\n\nAs respostas desta experiência serão compartilhadas com Daiane para ajudar na compreensão do seu processo e na construção do seu Mapa CER. Você poderá escolher \'Prefiro não responder\' sempre que precisar.\n\nFaça no seu ritmo. Você pode pausar e continuar depois.\n\nCom carinho,\nDaia',
  closing_text:
    'Obrigada por olhar para o seu funcionamento com atenção e honestidade.\n\nSuas respostas não definem quem você é. Elas ajudam a reconhecer movimentos que se repetem, recursos que já existem e aspectos que podem receber mais cuidado.\n\nDaiane poderá acessar as respostas compartilhadas e utilizá-las, junto com as demais dimensões e com aquilo que conhecerá sobre você nos encontros, para construir uma compreensão integrativa do seu momento.\n\nNada será transformado automaticamente em diagnóstico ou conclusão definitiva.',
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
    moment_key: 'meu_funcionamento_emocional',
    title: 'Meu funcionamento emocional',
    subtitle: 'Perguntas 1 a 3 — Investigação do seu funcionamento emocional habitual.',
    order_index: 1,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-2',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'o_que_penso_e_o_que_faco',
    title: 'O que penso e o que faço',
    subtitle: 'Perguntas 4 a 6 — Pensamentos, comportamentos e diálogo interno associados.',
    order_index: 2,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-3',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'meus_movimentos_automaticos',
    title: 'Meus movimentos automáticos',
    subtitle: 'Perguntas 7 a 9 — Dez movimentos automáticos CER e contextos de ativação.',
    order_index: 3,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-4',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'seguranca_e_sobrecarga',
    title: 'Segurança e sobrecarga',
    subtitle: 'Perguntas 10 e 11 — Funcionamento em segurança, bem-estar e sobrecarga.',
    order_index: 4,
    is_active: true,
    version: 2,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-5',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'meus_recursos',
    title: 'Meus recursos',
    subtitle: 'Perguntas 12 e 13 — Recursos de recuperação e campo final aberto.',
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
  // MOMENTO 1 — MEU FUNCIONAMENTO EMOCIONAL (Perguntas 1 a 3)
  // ----------------------------------------------------

  // PERGUNTA 1
  {
    id: 'p-07c-pm1-p1-funcionamento-emocional',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'Meu funcionamento emocional',
    step_subtitle: 'Pergunta 1 de 13',
    component_type: 'FreeReflection',
    prompt_text: 'Como você descreveria o seu funcionamento emocional?',
    helper_text:
      'Quando pensa na maneira como costuma sentir e viver suas emoções, o que percebe sobre si?\n\nVocê reconhece com facilidade o que está sentindo? Sente as emoções intensamente? Costuma guardá-las? Precisa de tempo para compreendê-las? Elas mudam rapidamente ou tendem a permanecer por bastante tempo?\n\nDescreva do seu jeito. Não é necessário escrever muito.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'mundo_emocional_geral',
      concept_key: 'emotion_recognition_style',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      placeholder: 'Descreva do seu jeito. Não é necessário escrever muito...',
      open_first: {
        enabled: true,
        help_label: 'Precisa de algumas ideias para começar?',
        option_set_ref: 'opt_ideias_funcionamento_emocional',
      },
      option_set: {
        id: 'opt_ideias_funcionamento_emocional',
        items: [
          { id: 'reconheco_rapidamente', label: 'Reconheço rapidamente o que estou sentindo.' },
          { id: 'sinto_corpo_primeiro', label: 'Sinto primeiro no corpo e compreendo depois.' },
          { id: 'sinto_intensidade', label: 'Sinto com intensidade.' },
          {
            id: 'mudou_dificuldade_nomear',
            label: 'Percebo que alguma coisa mudou, mas tenho dificuldade de nomear.',
          },
          { id: 'preciso_tempo', label: 'Preciso de tempo para entender o que senti.' },
          { id: 'penso_analiso_antes', label: 'Costumo pensar e analisar antes de conseguir sentir.' },
          { id: 'guardo_escondo', label: 'Costumo guardar ou esconder o que sinto.' },
          { id: 'mudam_rapidamente', label: 'Minhas emoções mudam rapidamente.' },
          { id: 'permanecem_bastante', label: 'Algumas emoções permanecem comigo por bastante tempo.' },
          { id: 'varia_conforme_situacao', label: 'Isso varia muito conforme a situação.' },
          { id: 'ainda_nao_sei', label: 'Ainda não sei descrever.' },
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

  // PERGUNTA 2
  {
    id: 'p-07c-pm1-p2-emocoes-presentes',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 2,
    prompt_order: 2,
    step_title: 'Emoções mais presentes',
    step_subtitle: 'Pergunta 2 de 13',
    component_type: 'MultiSelectCards',
    prompt_text: 'Quais emoções ou estados emocionais costumam estar mais presentes na sua vida?',
    helper_text: 'Escolha até quatro que você reconhece com maior frequência no seu funcionamento habitual.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'emocoes_recorrentes',
      concept_key: 'recurrent_emotional_experience',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      max_selections: 4,
      options: [
        {
          id: 'medo',
          title: 'MEDO',
          description:
            'Pode aparecer quando você percebe uma ameaça, um risco ou a possibilidade de algo difícil acontecer. Pode trazer vontade de evitar, fugir, proteger-se ou procurar segurança.',
        },
        {
          id: 'ansiedade_apreensao',
          title: 'ANSIEDADE OU APREENSÃO',
          description:
            'Pode aparecer como inquietação, antecipação do futuro, sensação de urgência, pensamentos acelerados ou dificuldade de relaxar — mesmo quando não existe um perigo claramente identificado.',
        },
        {
          id: 'tristeza',
          title: 'TRISTEZA',
          description:
            'Pode aparecer como sensação de perda, dor, saudade, vontade de chorar, necessidade de recolhimento ou diminuição momentânea da energia.',
        },
        {
          id: 'apatia_desanimo',
          title: 'APATIA OU DESÂNIMO',
          description:
            'Pode aparecer como falta de interesse, motivação ou vontade, dificuldade de se envolver com as coisas ou sensação de estar emocionalmente distante.',
        },
        {
          id: 'raiva',
          title: 'RAIVA',
          description:
            'Pode aparecer quando alguma coisa atravessa seus limites, frustra uma necessidade ou parece injusta. Pode ser sentida como irritação, impaciência, tensão ou vontade de reagir.',
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
            'Pode aparecer quando você sente que fez ou deixou de fazer alguma coisa importante e surge vontade de reparar.',
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
          description: 'Campo para a pessoa nomear do seu jeito.',
          allow_custom_text: true,
          custom_text_placeholder: 'Escreva outra emoção ou estado que costuma estar presente...',
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

  // PERGUNTA 3 (Adaptativa com placeholder dinâmico)
  {
    id: 'p-07c-pm1-p3-por-que-se-sente-assim',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 3,
    prompt_order: 3,
    step_title: 'O que costuma despertar essas emoções',
    step_subtitle: 'Pergunta 3 de 13',
    component_type: 'FreeReflection',
    prompt_text: 'Você consegue descrever por que você se sente assim?',
    helper_text:
      'Ao pensar nas emoções que escolheu — {{emocoes_selecionadas}} — o que percebe que costuma despertá-las ou intensificá-las?\n\nPode estar relacionado a situações, relações, pensamentos, lembranças, necessidades, frustrações ou mudanças no seu corpo e na sua rotina.\n\nVocê não precisa encontrar uma única causa ou ter certeza. Conte apenas o que consegue perceber.',
    is_required: false,
    version: 2,
    schema_config: {
      prompt_key: 'compreensao_despertar_emocoes',
      concept_key: 'emotional_triggers_awareness',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      adaptive_label: 'Uma pergunta a mais para compreender melhor sua experiência.',
      dynamic_text_template:
        'Ao pensar nas emoções que escolheu — {{emocoes_selecionadas}} — o que percebe que costuma despertá-las ou intensificá-las?\n\nPode estar relacionado a situações, relações, pensamentos, lembranças, necessidades, frustrações ou mudanças no seu corpo e na sua rotina.\n\nVocê não precisa encontrar uma única causa ou ter certeza. Conte apenas o que consegue perceber.',
      placeholder: 'Conte apenas o que consegue perceber...',
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // MOMENTO 2 — O QUE PENSO E O QUE FAÇO (Perguntas 4 a 6)
  // ----------------------------------------------------

  // PERGUNTA 4
  {
    id: 'p-07c-pm2-p4-pensamentos-associados',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-2',
    step_order: 4,
    prompt_order: 1,
    step_title: 'O que passa pela mente',
    step_subtitle: 'Pergunta 4 de 13',
    component_type: 'FreeReflection',
    prompt_text: 'O que costuma passar pela sua mente quando essas emoções aparecem?',
    helper_text:
      'Ao sentir {{emocoes_selecionadas}}, quais pensamentos, preocupações, lembranças ou cobranças costumam surgir?\n\nVocê pode escrever frases que aparecem em sua mente, mesmo que pareçam repetitivas, contraditórias ou difíceis de explicar.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'pensamento_associado',
      concept_key: 'associated_thought_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      dynamic_text_template:
        'Ao sentir {{emocoes_selecionadas}}, quais pensamentos, preocupações, lembranças ou cobranças costumam surgir?\n\nVocê pode escrever frases que aparecem em sua mente, mesmo que pareçam repetitivas, contraditórias ou difíceis de explicar.',
      placeholder: 'Escreva pensamentos ou frases que costumam surgir...',
      open_first: {
        enabled: true,
        help_label: 'Precisa de algumas ideias para começar?',
        option_set_ref: 'opt_ideias_pensamentos_associados',
      },
      option_set: {
        id: 'opt_ideias_pensamentos_associados',
        items: [
          { id: 'preciso_resolver', label: '“Preciso resolver isso.”' },
          { id: 'vai_dar_errado', label: '“Alguma coisa vai dar errado.”' },
          { id: 'nao_deveria_sentir_assim', label: '“Não deveria estar me sentindo assim.”' },
          { id: 'nao_vou_conseguir', label: '“Não vou conseguir.”' },
          { id: 'preciso_dar_conta', label: '“Preciso dar conta.”' },
          { id: 'quero_sair_dessa_situacao', label: '“Quero sair dessa situação.”' },
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

  // PERGUNTA 5
  {
    id: 'p-07c-pm2-p5-comportamento-associado',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-2',
    step_order: 5,
    prompt_order: 2,
    step_title: 'Como você costuma agir',
    step_subtitle: 'Pergunta 5 de 13',
    component_type: 'MultiSelectCards',
    prompt_text: 'Como você costuma agir quando sente essas emoções?',
    helper_text:
      'Quando essas emoções aparecem, o que você costuma fazer? Você pode descrever do seu jeito no campo opcional e selecionar quais desses movimentos também aparecem em você.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'comportamento_associado',
      concept_key: 'associated_behavior_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      allow_free_text_addition: true,
      free_text_addition_placeholder: 'Descreva do seu jeito (opcional)...',
      options: [
        {
          id: 'resolver_imediatamente',
          title: 'Tento resolver tudo imediatamente.',
        },
        {
          id: 'controlar_situacao',
          title: 'Procuro controlar a situação.',
        },
        {
          id: 'agir_impulsivamente',
          title: 'Falo ou reajo impulsivamente.',
        },
        {
          id: 'silencio_afastamento',
          title: 'Fico em silêncio ou me afasto.',
        },
        {
          id: 'evitar_adiar',
          title: 'Evito a situação ou adio o que preciso fazer.',
        },
        {
          id: 'sem_saber_como_agir',
          title: 'Fico sem saber como agir.',
        },
        {
          id: 'pedir_ajuda_conversar',
          title: 'Procuro alguém para conversar ou pedir ajuda.',
        },
        {
          id: 'agradar_cuidar_outros',
          title: 'Tento agradar ou cuidar de outras pessoas.',
        },
        {
          id: 'trabalhar_produzir_atividade',
          title: 'Trabalho, produzo ou me mantenho em atividade.',
        },
        {
          id: 'procurar_distracao',
          title: 'Procuro distração no celular, nas compras, na comida, em séries ou em outras atividades.',
        },
        {
          id: 'compreender_organizar_sentimento',
          title: 'Tento compreender e organizar o que estou sentindo.',
        },
        {
          id: 'acao_para_acalmar',
          title: 'Faço alguma coisa que me ajuda a me acalmar.',
        },
        {
          id: 'varia_conforme_emocao',
          title: 'Meu comportamento varia conforme a emoção.',
        },
        {
          id: 'outro_comportamento',
          title: 'Outro comportamento.',
          allow_custom_text: true,
          custom_text_placeholder: 'Escreva outro comportamento...',
        },
        {
          id: 'ainda_nao_identifico',
          title: 'Ainda não consigo identificar.',
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

  // PERGUNTA 6
  {
    id: 'p-07c-pm2-p6-dialogo-interno',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-2',
    step_order: 6,
    prompt_order: 3,
    step_title: 'Diálogo interno',
    step_subtitle: 'Pergunta 6 de 13',
    component_type: 'ChoiceCards',
    prompt_text: 'Como você costuma conversar consigo nesses momentos?',
    helper_text:
      'Quando está vivendo uma emoção difícil ou quando alguma coisa não acontece como gostaria, como costuma ser a sua voz interna?\n\nSe quiser, escreva no campo opcional uma frase que costuma dizer para si.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'self_dialogue_erro',
      concept_key: 'internal_dialogue_style',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      allow_free_text_addition: true,
      free_text_addition_placeholder: 'Se quiser, escreva uma frase que costuma dizer para si...',
      options: [
        {
          id: 'compreender_acolher',
          title: 'Tento me compreender e me acolher.',
        },
        {
          id: 'entender_e_agir',
          title: 'Procuro entender o que aconteceu e o que posso fazer.',
        },
        {
          id: 'cobro_solucao_rapida',
          title: 'Cobro de mim uma solução rápida.',
        },
        {
          id: 'deveria_ter_agido_diferente',
          title: 'Penso que deveria ter agido de outra maneira.',
        },
        {
          id: 'nunca_faco_suficiente',
          title: 'Sinto que nunca faço o suficiente.',
        },
        {
          id: 'comparo_outras_pessoas',
          title: 'Comparo-me com outras pessoas.',
        },
        {
          id: 'critico_outras_pessoas',
          title: 'Critico outras pessoas.',
        },
        {
          id: 'situacao_deveria_ser_diferente',
          title: 'Sinto que a situação ou a vida deveria ser diferente.',
        },
        {
          id: 'tento_nao_pensar',
          title: 'Tento não pensar sobre o assunto.',
        },
        {
          id: 'varia_muito',
          title: 'Isso varia muito.',
        },
        {
          id: 'ainda_nao_percebo',
          title: 'Ainda não consigo perceber.',
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
  // MOMENTO 3 — MEUS MOVIMENTOS AUTOMÁTICOS (Perguntas 7 a 9)
  // ----------------------------------------------------

  // PERGUNTA 7A: Cartões 1 a 5
  {
    id: 'p-07c-pm3-p7a-movimentos-1-5',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 7,
    prompt_order: 1,
    step_title: 'Meus movimentos automáticos (1 a 5)',
    step_subtitle: 'Pergunta 7 de 13 — Parte 1 de 2',
    component_type: 'MultiSelectCards',
    prompt_text: 'O quanto esses movimentos aparecem em você?',
    helper_text:
      'Todos nós desenvolvemos maneiras de enfrentar pressão, insegurança, frustração e dor emocional.\n\nMuitas dessas estratégias possuem um lado que ajuda: podem trazer organização, proteção, realização, cuidado, rapidez ou segurança. Porém, quando se tornam rígidas ou intensas demais, também podem consumir energia e dificultar nossas escolhas.\n\nAs próximas situações não definem sua personalidade. Queremos apenas observar quais movimentos costumam se repetir.\n\nSelecione a intensidade que melhor descreve seu funcionamento para estes cinco primeiros movimentos.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'movimentos_automaticos_frequencia_p1',
      concept_key: 'automatic_movement_frequency_set1',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      movement_scale_options: [
        'Quase nunca acontece comigo.',
        'Aparece em algumas situações.',
        'Repete-se com frequência.',
        'Aparece com muita força quando estou sob pressão.',
        'Ainda não sei dizer.',
      ],
      options: [
        {
          id: 'cartao_1_fazer_certo',
          title: 'CARTÃO 1 — BUSCAR FAZER TUDO DO JEITO CERTO',
          description:
            'Gosto de organizar, revisar e realizar bem o que faço. Em alguns momentos, posso me cobrar excessivamente, ter dificuldade com erros ou sentir irritação quando as coisas não acontecem como considero correto.',
        },
        {
          id: 'cartao_2_cuidar_pessoas',
          title: 'CARTÃO 2 — CUIDAR DAS PESSOAS E DEIXAR MINHAS NECESSIDADES PARA DEPOIS',
          description:
            'Percebo facilmente o que as outras pessoas precisam e gosto de ajudar. Algumas vezes, posso ter dificuldade de expressar minhas próprias necessidades, dizer não ou reconhecer quando estou oferecendo mais do que consigo sustentar.',
        },
        {
          id: 'cartao_3_produtividade_conquistas',
          title: 'CARTÃO 3 — BUSCAR VALOR POR MEIO DA PRODUTIVIDADE E DAS CONQUISTAS',
          description:
            'Realizar e alcançar objetivos pode me trazer energia e satisfação. Em alguns momentos, posso sentir que preciso produzir, demonstrar competência ou alcançar resultados para reconhecer meu próprio valor.',
        },
        {
          id: 'cartao_4_perder_sensacao_escolha',
          title: 'CARTÃO 4 — PERDER A SENSAÇÃO DE ESCOLHA DIANTE DAS DIFICULDADES',
          description:
            'Quando alguma coisa dói ou parece difícil demais, posso sentir que não tenho força, saída ou possibilidade de mudar a situação. Nesses momentos, posso precisar de tempo e apoio para recuperar o movimento.',
        },
        {
          id: 'cartao_5_compreender_pela_razao',
          title: 'CARTÃO 5 — TENTAR COMPREENDER TUDO PELA RAZÃO',
          description:
            'Pensar e analisar me ajuda a organizar as experiências. Em alguns momentos, posso me concentrar tanto em compreender racionalmente que me afasto do que sinto ou tenho dificuldade de demonstrar vulnerabilidade.',
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

  // PERGUNTA 7B: Cartões 6 a 10
  {
    id: 'p-07c-pm3-p7b-movimentos-6-10',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 8,
    prompt_order: 2,
    step_title: 'Meus movimentos automáticos (6 a 10)',
    step_subtitle: 'Pergunta 7 de 13 — Parte 2 de 2',
    component_type: 'MultiSelectCards',
    prompt_text: 'O quanto esses movimentos aparecem em você?',
    helper_text:
      'Estes são os outros cinco movimentos. Selecione a intensidade que melhor descreve seu funcionamento habitual.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'movimentos_automaticos_frequencia_p2',
      concept_key: 'automatic_movement_frequency_set2',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      movement_scale_options: [
        'Quase nunca acontece comigo.',
        'Aparece em algumas situações.',
        'Repete-se com frequência.',
        'Aparece com muita força quando estou sob pressão.',
        'Ainda não sei dizer.',
      ],
      options: [
        {
          id: 'cartao_6_antecipar_riscos',
          title: 'CARTÃO 6 — ANTECIPAR O QUE PODE DAR ERRADO',
          description:
            'Perceber riscos me ajuda a me preparar. Em alguns momentos, posso permanecer em alerta, imaginar problemas ou ter dificuldade de relaxar mesmo quando gostaria.',
        },
        {
          id: 'cartao_7_novos_estimulos',
          title: 'CARTÃO 7 — MANTER-ME EM ATIVIDADE OU BUSCAR NOVOS ESTÍMULOS',
          description:
            'Movimento, curiosidade e novas experiências podem trazer energia. Em alguns momentos, posso me ocupar, iniciar várias coisas ou buscar distrações para não permanecer em contato com algo difícil.',
        },
        {
          id: 'cartao_8_assumir_controle',
          title: 'CARTÃO 8 — ASSUMIR O CONTROLE',
          description:
            'Tomar a frente e assumir responsabilidades pode ajudar a organizar situações. Em alguns momentos, posso sentir tensão ou irritação quando dependo de outras pessoas ou quando as coisas não acontecem como espero.',
        },
        {
          id: 'cartao_9_evitar_desconfortos',
          title: 'CARTÃO 9 — EVITAR DESCONFORTOS, CONFLITOS OU DECISÕES DIFÍCEIS',
          description:
            'Preservar a harmonia e escolher o momento adequado pode ser cuidadoso. Em alguns momentos, posso adiar conversas, decisões ou tarefas importantes para não lidar com o desconforto.',
        },
        {
          id: 'cartao_10_cobrar_e_criticar',
          title: 'CARTÃO 10 — COBRAR E PERCEBER O QUE ESTÁ ERRADO',
          description:
            'Meu senso crítico pode me ajudar a perceber problemas e fazer ajustes. Em alguns momentos, posso concentrar minha atenção no que está errado comigo, com outras pessoas ou com as circunstâncias.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_pm3_adaptive_interferencia',
            when: {
              any_of: [{ field: 'selected_count_gte', operator: 'equals', value: 1 }],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'movimentos_interferencia_atual',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // PERGUNTA 8 (Adaptativa — condicional aos movimentos frequentes/sob pressão)
  {
    id: 'p-07c-pm3-p8-interferencia-movimentos',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 9,
    prompt_order: 3,
    step_title: 'Movimentos que mais interferem',
    step_subtitle: 'Pergunta 8 de 13',
    component_type: 'MultiSelectCards',
    prompt_text: 'Quais desses movimentos mais interferem na sua vida atualmente?',
    helper_text:
      'Escolha até três movimentos que você sente que mais consomem sua energia, dificultam suas escolhas ou afastam você da vida que deseja construir.',
    is_required: false,
    version: 2,
    schema_config: {
      prompt_key: 'movimentos_interferencia_atual',
      concept_key: 'burdensome_movement_selection',
      temporality: 'current_state',
      access_destination: 'participant_shared',
      adaptive_label: 'Uma pergunta a mais para compreender melhor sua experiência.',
      max_selections: 3,
      options: [
        {
          id: 'cartao_1_fazer_certo',
          title: 'Buscar fazer tudo do jeito certo',
        },
        {
          id: 'cartao_2_cuidar_pessoas',
          title: 'Cuidar das pessoas e deixar minhas necessidades para depois',
        },
        {
          id: 'cartao_3_produtividade_conquistas',
          title: 'Buscar valor por meio da produtividade e das conquistas',
        },
        {
          id: 'cartao_4_perder_sensacao_escolha',
          title: 'Perder a sensação de escolha diante das dificuldades',
        },
        {
          id: 'cartao_5_compreender_pela_razao',
          title: 'Tentar compreender tudo pela razão',
        },
        {
          id: 'cartao_6_antecipar_riscos',
          title: 'Antecipar o que pode dar errado',
        },
        {
          id: 'cartao_7_novos_estimulos',
          title: 'Manter-me em atividade ou buscar novos estímulos',
        },
        {
          id: 'cartao_8_assumir_controle',
          title: 'Assumir o controle',
        },
        {
          id: 'cartao_9_evitar_desconfortos',
          title: 'Evitar desconfortos, conflitos ou decisões difíceis',
        },
        {
          id: 'cartao_10_cobrar_e_criticar',
          title: 'Cobrar e perceber o que está errado',
        },
        {
          id: 'nenhum_dificuldade_importante',
          title: 'Não reconheço nenhum deles como uma dificuldade importante.',
        },
        {
          id: 'ainda_nao_sei',
          title: 'Ainda não sei dizer.',
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

  // PERGUNTA 9
  {
    id: 'p-07c-pm3-p9-situacoes-ativacao',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 10,
    prompt_order: 4,
    step_title: 'Situações em que esses movimentos aparecem',
    step_subtitle: 'Pergunta 9 de 13',
    component_type: 'MultiSelectCards',
    prompt_text: 'Em quais situações esses movimentos costumam aparecer?',
    helper_text:
      'Pense nos movimentos que você acabou de escolher. Em quais situações eles costumam aparecer com mais força?\n\nSe quiser, conte no campo opcional uma situação em que percebeu isso acontecer. Pode ser uma situação recente ou algo que costuma se repetir. Não é necessário explicar por que aconteceu.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'situacoes_ativacao_movimentos',
      concept_key: 'movement_activation_context',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      allow_free_text_addition: true,
      free_text_addition_placeholder:
        'Se quiser, conte uma situação em que percebeu isso acontecer (opcional)...',
      options: [
        {
          id: 'sob_pressao_responsabilidades',
          title: 'Quando estou sob pressão ou com muitas responsabilidades.',
        },
        {
          id: 'nao_acontece_planejado',
          title: 'Quando alguma coisa não acontece como planejei.',
        },
        {
          id: 'medo_errar_decepcionar',
          title: 'Quando tenho medo de errar ou decepcionar alguém.',
        },
        {
          id: 'criticado_ou_questionado',
          title: 'Quando sou criticado ou questionado.',
        },
        {
          id: 'depender_outras_pessoas',
          title: 'Quando preciso depender de outras pessoas.',
        },
        {
          id: 'sem_controle_situacao',
          title: 'Quando sinto que não tenho controle sobre uma situação.',
        },
        {
          id: 'conflito_ou_desagradar',
          title: 'Quando existe conflito ou risco de desagradar alguém.',
        },
        {
          id: 'rejeitado_ignorado_desvalorizado',
          title: 'Quando me sinto rejeitado, ignorado ou pouco valorizado.',
        },
        {
          id: 'cansado_sem_energia',
          title: 'Quando estou cansado ou sem energia.',
        },
        {
          id: 'decisao_importante',
          title: 'Quando preciso tomar uma decisão importante.',
        },
        {
          id: 'situacao_nova_incerta',
          title: 'Quando enfrento alguma situação nova ou incerta.',
        },
        {
          id: 'vulneravel_emocionalmente',
          title: 'Quando estou emocionalmente vulnerável.',
        },
        {
          id: 'muitas_situacoes_diferentes',
          title: 'Esses movimentos aparecem em muitas situações diferentes.',
        },
        {
          id: 'ainda_nao_identifico',
          title: 'Ainda não consigo identificar.',
        },
        {
          id: 'outra_situacao',
          title: 'Outra situação.',
          allow_custom_text: true,
          custom_text_placeholder: 'Descreva outra situação...',
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
  // MOMENTO 4 — SEGURANÇA E SOBRECARGA (Perguntas 10 e 11)
  // ----------------------------------------------------

  // PERGUNTA 10
  {
    id: 'p-07c-pm4-p10-seguranca-bem-estar',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-4',
    step_order: 11,
    prompt_order: 1,
    step_title: 'Segurança e bem-estar',
    step_subtitle: 'Pergunta 10 de 13',
    component_type: 'MultiSelectCards',
    prompt_text: 'Como você costuma se sentir e se comportar quando está em segurança e bem-estar?',
    helper_text:
      'Pense nos momentos em que você se sente com mais tranquilidade, energia e espaço interno.\n\nComo costuma se sentir? E o que consegue fazer com mais facilidade? Descreva do seu jeito se quiser e escolha o que reconhece em você nesses momentos.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'dois_retratos_espaco',
      concept_key: 'safety_and_wellbeing_functioning',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      allow_free_text_addition: true,
      free_text_addition_placeholder: 'Descreva do seu jeito (opcional)...',
      options: [
        {
          id: 'calma_tranquilidade',
          title: 'Sinto mais calma e tranquilidade.',
        },
        {
          id: 'clareza_sentimento',
          title: 'Consigo perceber com clareza o que estou sentindo.',
        },
        {
          id: 'clareza_pensamento',
          title: 'Penso com mais clareza.',
        },
        {
          id: 'energia_vitalidade',
          title: 'Sinto mais energia e vitalidade.',
        },
        {
          id: 'criatividade',
          title: 'Tenho mais criatividade.',
        },
        {
          id: 'decisoes_seguranca',
          title: 'Consigo tomar decisões com mais segurança.',
        },
        {
          id: 'flexibilidade_mudancas',
          title: 'Tenho mais flexibilidade diante de mudanças.',
        },
        {
          id: 'estabelecer_limites',
          title: 'Consigo estabelecer limites.',
        },
        {
          id: 'expressar_necessidades',
          title: 'Expresso melhor o que preciso.',
        },
        {
          id: 'pedir_receber_ajuda',
          title: 'Consigo pedir ou receber ajuda.',
        },
        {
          id: 'aproximar_confianca',
          title: 'Aproximo-me das pessoas com mais confiança.',
        },
        {
          id: 'paciencia_comigo_outros',
          title: 'Tenho mais paciência comigo e com os outros.',
        },
        {
          id: 'descansar_sem_culpa',
          title: 'Consigo descansar sem tanta culpa.',
        },
        {
          id: 'reconhecer_qualidades_conquistas',
          title: 'Reconheço melhor minhas qualidades e conquistas.',
        },
        {
          id: 'cuidar_de_mim',
          title: 'Tenho vontade de cuidar de mim.',
        },
        {
          id: 'alegria_leveza_interesse',
          title: 'Sinto mais alegria, leveza ou interesse pela vida.',
        },
        {
          id: 'organizar_sem_pressao',
          title: 'Consigo organizar e realizar o que é importante sem me pressionar excessivamente.',
        },
        {
          id: 'outra_experiencia',
          title: 'Outra experiência.',
          allow_custom_text: true,
          custom_text_placeholder: 'Descreva outra experiência...',
        },
        {
          id: 'ainda_nao_reconheco',
          title: 'Ainda não consigo reconhecer como fico nesses momentos.',
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

  // PERGUNTA 11
  {
    id: 'p-07c-pm4-p11-sobrecarga',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-4',
    step_order: 12,
    prompt_order: 2,
    step_title: 'Quando a sobrecarga aumenta',
    step_subtitle: 'Pergunta 11 de 13',
    component_type: 'FreeReflection',
    prompt_text: 'O que muda quando a sobrecarga aumenta?',
    helper_text:
      'Quando sente que chegou ao limite, o que costuma mudar em seus pensamentos, emoções ou comportamentos?\n\nCampo opcional. Abra as ideias abaixo se quiser apoios para pensar.',
    is_required: false,
    version: 2,
    schema_config: {
      prompt_key: 'dois_retratos_sobrecarga',
      concept_key: 'overload_state_functioning',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      placeholder: 'Descreva o que costuma mudar em seus pensamentos, emoções ou comportamentos...',
      open_first: {
        enabled: true,
        help_label: 'Precisa de algumas ideias para começar?',
        option_set_ref: 'opt_ideias_sobrecarga',
      },
      option_set: {
        id: 'opt_ideias_sobrecarga',
        items: [
          { id: 'alerta_preocupado', label: 'Fico mais alerta ou preocupado com o que pode acontecer.' },
          { id: 'mais_exigente', label: 'Fico mais exigente comigo ou com outras pessoas.' },
          { id: 'controlar_mais', label: 'Tento controlar mais as situações.' },
          { id: 'impaciente_reage', label: 'Fico impaciente ou reajo rapidamente.' },
          { id: 'dificuldade_decidir_agir', label: 'Tenho dificuldade de decidir ou agir.' },
          { id: 'afasto_silencio', label: 'Afasto-me ou fico em silêncio.' },
          { id: 'evito_tarefas', label: 'Evito tarefas, conversas ou decisões.' },
          { id: 'manter_atividade', label: 'Procuro me manter em atividade.' },
          { id: 'perco_contato_necessidades', label: 'Perco contato com minhas necessidades.' },
          { id: 'dificuldade_perceber_recursos', label: 'Sinto dificuldade de perceber meus recursos.' },
          { id: 'outro_movimento', label: 'Outro movimento.' },
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

  // ----------------------------------------------------
  // MOMENTO 5 — MEUS RECURSOS (Perguntas 12 e 13)
  // ----------------------------------------------------

  // PERGUNTA 12
  {
    id: 'p-07c-pm5-p12-recursos-espaco-interno',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-5',
    step_order: 13,
    prompt_order: 1,
    step_title: 'O que ajuda a recuperar espaço interno',
    step_subtitle: 'Pergunta 12 de 13',
    component_type: 'MultiSelectCards',
    prompt_text: 'O que ajuda você a recuperar espaço interno?',
    helper_text:
      'Quando está emocionalmente sobrecarregado ou com a mente muito agitada, o que costuma ajudar — mesmo que seja apenas um pouco?\n\nExiste alguma coisa que costuma trazer alívio no momento, mas depois faz você se sentir pior? Você pode registrar no campo opcional abaixo.',
    is_required: true,
    version: 2,
    schema_config: {
      prompt_key: 'recursos_recuperar_espaco',
      concept_key: 'recovery_resources_and_short_term_relief',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      allow_free_text_addition: true,
      free_text_addition_placeholder:
        'Existe alguma coisa que costuma trazer alívio no momento, mas depois faz você se sentir pior? (Opcional — ex: excesso de comida, álcool, compras, trabalho excessivo, celular, isolamento, adiamento)...',
      options: [
        {
          id: 'descansar_silencio',
          title: 'Descansar ou ficar em silêncio.',
        },
        {
          id: 'dormir',
          title: 'Dormir.',
        },
        {
          id: 'movimentar_corpo',
          title: 'Movimentar o corpo.',
        },
        {
          id: 'respirar_meditar',
          title: 'Respirar, meditar ou realizar alguma prática.',
        },
        {
          id: 'pequeno_proximo_passo',
          title: 'Organizar um pequeno próximo passo.',
        },
        {
          id: 'conversar_alguem_confianca',
          title: 'Conversar com alguém em quem confio.',
        },
        {
          id: 'pedir_ajuda',
          title: 'Pedir ajuda.',
        },
        {
          id: 'estar_natureza',
          title: 'Estar na natureza.',
        },
        {
          id: 'algo_criativo',
          title: 'Fazer algo criativo.',
        },
        {
          id: 'ouvir_musica',
          title: 'Ouvir música.',
        },
        {
          id: 'escrever',
          title: 'Escrever.',
        },
        {
          id: 'chorar',
          title: 'Chorar.',
        },
        {
          id: 'colocar_limites',
          title: 'Colocar limites.',
        },
        {
          id: 'resolver_pendencia',
          title: 'Resolver alguma pendência.',
        },
        {
          id: 'afastar_temporariamente',
          title: 'Afastar-me temporariamente da situação.',
        },
        {
          id: 'ainda_nao_descobri',
          title: 'Ainda não descobri o que me ajuda.',
        },
        {
          id: 'outra_coisa',
          title: 'Outra coisa.',
          allow_custom_text: true,
          custom_text_placeholder: 'Escreva outra coisa que costuma ajudar...',
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

  // PERGUNTA 13
  {
    id: 'p-07c-pm5-p13-campo-final-opcional',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-5',
    step_order: 14,
    prompt_order: 2,
    step_title: 'Espaço aberto',
    step_subtitle: 'Pergunta 13 de 13',
    component_type: 'FreeReflection',
    prompt_text: 'Existe alguma coisa importante que não perguntamos?',
    helper_text:
      'Se existe algum aspecto do seu funcionamento mental ou emocional que você considera importante e não encontrou espaço para contar, escreva aqui.\n\nCampo opcional.',
    is_required: false,
    version: 2,
    schema_config: {
      prompt_key: 'campo_final_opcional',
      concept_key: 'unprompted_experience_aspects',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      placeholder: 'Se desejar acrescentar algo sobre o seu funcionamento mental ou emocional...',
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

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

// Chaves canônicas de caminho essencial de Mente (Momento 1 ao 5 — V2 Aprovada)
export const MENTE_ESSENTIAL_PATH_PROMPT_KEYS = [
  'mundo_emocional_geral', // Momento 1 - P1
  'emocoes_recorrentes', // Momento 1 - P2
  'pensamento_associado', // Momento 2 - P4
  'comportamento_associado', // Momento 2 - P5
  'self_dialogue_erro', // Momento 2 - P6
  'movimentos_automaticos_frequencia_p1', // Momento 3 - P7a
  'movimentos_automaticos_frequencia_p2', // Momento 3 - P7b
  'situacoes_ativacao_movimentos', // Momento 3 - P9
  'dois_retratos_espaco', // Momento 4 - P10
  'recursos_recuperar_espaco', // Momento 5 - P12
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
