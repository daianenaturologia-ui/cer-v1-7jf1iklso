/**
 * Build 07G — Integração Final da Consciência
 * Especificação Normativa e Definições de Schema dos Prompts e Momentos
 * Dimensão Transversal / Integrative Experience ID: exp-integracao-consciencia-07g
 *
 * Princípio Metodológico Constitucional:
 * - "O ser humano não funciona em partes."
 * - UX: "SIMPLES POR FORA. COMPLEXO POR DENTRO".
 * - UI 100% em português (Brasil).
 * - Sensação-alvo da participante:
 *   "Estou começando a enxergar como eu funciono como um todo."
 * - NUNCA: "recebi um diagnóstico", "laudo", "a IA descobriu quem eu sou", "perfil", "resultado clínico".
 *
 * 5 Microexperiências Estruturais (I1–I5):
 * I1: "Algumas coisas se parecem comigo" (recorrências transversais determinísticas)
 * I2: "O que já está do meu lado" (recursos pessoais transversais, open-first antes da síntese)
 * I3: "O que está pedindo atenção" (desafios e barreiras reais, open-first, desafio ≠ defeito)
 * I4: "O que isso faz por mim — e o que às vezes custa" (CONDICIONAL: quarteto contexto+resposta+função+consequência)
 * I5: "Para onde eu quero ir" (direção de vida, ponte para Realização, direção ≠ meta SMART)
 */

import type { CerExperienceRecord, CerExperienceMomentRecord, CerPromptRecord } from '@/types/cer'

// IDs Canônicos de Dimensão e Experiência
// Dimensão de integração transversal da consciência: dim-integracao-07g
export const INTEGRACAO_CONSCIENCIA_DIMENSION_ID = 'dim-integracao-07g'
export const INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID = 'exp-integracao-consciencia-07g'

// Concept Keys Canônicas Fechadas do 07G (Aprovar APENAS estas 14 chaves)
export const BUILD_07G_CONCEPT_KEYS = [
  'cross_domain_recurring_pattern',
  'recognized_personal_resource',
  'resource_access_context',
  'recognized_current_challenge',
  'recognized_barrier',
  'reported_change_desire',
  'reported_habit_to_change',
  'possible_protective_pattern',
  'perceived_protective_benefit',
  'perceived_protective_cost',
  'desired_life_direction',
  'current_capacity_context',
  'participant_integration_correction',
  'participant_integration_addition',
] as const

export type Build07GConceptKey = (typeof BUILD_07G_CONCEPT_KEYS)[number]

// Conceitos e Rótulos ESTRITAMENTE PROIBIDOS no schema, opções participant-facing e Signals
export const FORBIDDEN_07G_CONCEPTS_OR_LABELS = [
  'core_wound',
  'root_cause',
  'self_sabotage_confirmed',
  'limiting_belief_confirmed',
  'main_trauma_pattern',
  'true_self',
  'life_purpose_confirmed',
  'primary_diagnosis',
  'autossabotagem',
  'mecanismo_de_defesa',
  'padrao_central',
  'ferida_primaria',
  'crenca_limitante',
  'laudo',
  'diagnostico',
  'meta_smart',
  'habitos_ruins',
  'vicio_confirmado',
  'defesa_psicologica',
  'nivel_de_evolucao',
  'perfil_psicologico',
] as const

// Templates neutros obrigatórios para formulações determinísticas participant-facing
export const NEUTRAL_TEMPLATE_PREFIXES = [
  'Aparece em mais de uma parte da sua experiência que',
  'Você já identificou que',
  'Em diferentes momentos, você percebeu que',
  'Parece comum para você quando',
] as const

// ==========================================
// EXPERIÊNCIA CANÔNICA DE INTEGRAÇÃO DA CONSCIÊNCIA
// ==========================================

export const INTEGRACAO_CONSCIENCIA_EXPERIENCE: CerExperienceRecord = {
  id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
  dimension_id: INTEGRACAO_CONSCIENCIA_DIMENSION_ID,
  code: 'integracao_consciencia_cer',
  title: 'Integração da Consciência',
  subtitle:
    'Olhando para como diferentes partes da sua experiência se conectam e conversam entre si.',
  order_index: 8,
  is_pilot: false,
  opening_text:
    'Um momento para pausar e observar o desenho que se forma quando olhamos para suas experiências em conjunto. Aqui não há diagnósticos nem rótulos: apenas o reconhecimento de como você percebe seu funcionamento como um todo.',
  closing_text:
    'Suas percepções integradas foram acolhidas. Cada reconhecimento e direcionamento seu serve como ponto de partida para a realização do que você deseja viver, respeitando o seu ritmo e suas condições reais.',
  version: 1,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
}

// ==========================================
// MOMENTOS DE INTEGRAÇÃO (I1–I5)
// ==========================================

export const INTEGRACAO_CONSCIENCIA_MOMENTS: CerExperienceMomentRecord[] = [
  {
    id: 'mom-int-1',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_key: 'algumas_coisas_se_parecem_comigo',
    title: 'I1 — Algumas coisas se parecem comigo',
    subtitle: 'Recorrências transversais identificadas em diferentes partes da sua vida.',
    order_index: 1,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-int-2',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_key: 'o_que_ja_esta_do_meu_lado',
    title: 'I2 — O que já está do meu lado',
    subtitle: 'Recursos espontâneos e apoios que você já reconhece na sua experiência.',
    order_index: 2,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-int-3',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_key: 'o_que_esta_pedindo_atencao',
    title: 'I3 — O que está pedindo atenção',
    subtitle: 'Desafios e barreiras reais no fluxo do que você deseja viver.',
    order_index: 3,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-int-4',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_key: 'o_que_isso_faz_por_mim_e_o_que_as_vezes_custa',
    title: 'I4 — O que isso faz por mim — e o que às vezes custa',
    subtitle: 'Compreensão funcional sobre como certas respostas te ajudaram e seus custos.',
    order_index: 4,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-int-5',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_key: 'para_onde_eu_quero_ir',
    title: 'I5 — Para onde eu quero ir',
    subtitle: 'Direções genuínas de vida e ponte para o que você quer realizar.',
    order_index: 5,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// ==========================================
// OPÇÕES CANÔNICAS DE RECOGNITION PARTICIPANT-FACING
// 4 Estados Canônicos + wants_to_add + "quero contar mais"
// ==========================================
export const INTEGRATION_RECOGNITION_OPTIONS = [
  {
    id: 'makes_sense',
    title: 'Faz sentido para mim',
    description: 'Reconheço essa percepção como parte de como funciono hoje.',
  },
  {
    id: 'partially_makes_sense',
    title: 'Faz sentido em parte',
    description: 'Tem algo verdadeiro aqui, mas precisa de ajuste ou qualificação.',
  },
  {
    id: 'depends_on_context',
    title: 'Depende muito do contexto',
    description: 'Isso acontece em certas situações específicas, mas não em todas.',
  },
  {
    id: 'does_not_recognize',
    title: 'Não me reconheço nisso',
    description: 'Não sinto que isso se pareça comigo ou faça parte de quem sou.',
  },
  {
    id: 'wants_to_add',
    title: 'Quero acrescentar algo',
    description: 'Gostaria de adicionar outro aspecto importante que não apareceu aqui.',
  },
  {
    id: 'quero_contar_mais',
    title: 'Quero contar mais sobre isso',
    description: 'Gostaria de trazer detalhes do meu jeito para contextualizar.',
  },
]

// ==========================================
// PROMPTS CANÔNICOS DE INTEGRAÇÃO (I1–I5)
// ==========================================

export const BUILD_07G_INTEGRACAO_PROMPTS: CerPromptRecord[] = [
  // ----------------------------------------------------
  // I1 — ALGUMAS COISAS SE PARECEM COMIGO (RECORRÊNCIAS DETERMINÍSTICAS)
  // Abertura: "Algumas coisas parecem aparecer em diferentes partes da sua vida."
  // Cartões de formulações curtas DETERMINÍSTICAS (Via A ou Via B).
  // Limite 2-3 formulações por vez. Se não houver: "Algumas coisas podem ficar mais claras com o tempo."
  // ----------------------------------------------------
  {
    id: 'p-07g-i1-recorrencias-abertura',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'Algumas coisas se parecem comigo',
    step_subtitle: 'Observando padrões que surgiram em diferentes dimensões da sua jornada.',
    component_type: 'ChoiceCards',
    prompt_text: 'Algumas coisas parecem aparecer em diferentes partes da sua vida.',
    helper_text:
      'Veja como essas percepções ressoam em você. Isso não é um laudo nem define quem você é: reflete apenas o que você mesma já compartilhou.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'recorrencias_transversais_i1',
      concept_key: 'cross_domain_recurring_pattern',
      temporality: 'current',
      access_destination: 'participant_shared',
      synthesis_mode: 'deterministic_recurrence',
      options: [
        {
          id: 'reconheco_essas_recorrencias',
          title: 'Reconheço que isso faz parte do meu jeito de funcionar',
          description: 'Faz sentido olhar para como esses aspectos se repetem.',
        },
        {
          id: 'reconheco_em_partes',
          title: 'Reconheço algumas, mas outras não parecem tão presentes',
          description: 'Alguns pontos ressoam, enquanto outros pedem ajuste.',
        },
        {
          id: 'depende_do_contexto',
          title: 'Depende muito da fase ou da situação em que me encontro',
          description: 'Não é um padrão fixo: varia conforme o que estou vivendo.',
        },
        {
          id: 'nao_me_reconheco',
          title: 'Não me reconheço nessas descrições',
          description: 'Sinto que meu funcionamento tem outras características.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Algumas coisas podem ficar mais claras com o tempo',
          description: 'Ainda estou observando e entendendo como essas partes conversam.',
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
  // I2 — O QUE JÁ ESTÁ DO MEU LADO (RECURSOS PESSOAIS)
  // Open-first ANTES da síntese: "O que você percebe que já te ajuda?"
  // Segunda etapa: reconhecimento dos recursos transversais identificados.
  // Distinção: recurso conhecido ≠ acessível ≠ efetivo em todo contexto.
  // Proibido: "você tem boa autorregulação" ou scores de capacidade.
  // Categorias internas NUNCA exibidas como taxonomia.
  // ----------------------------------------------------
  {
    id: 'p-07g-i2-recursos-open-first',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-2',
    step_order: 2,
    prompt_order: 1,
    step_title: 'O que já está do seu lado',
    step_subtitle: 'Seus recursos espontâneos e formas conhecidas de se apoiar.',
    component_type: 'FreeReflection',
    prompt_text: 'O que você percebe que já te ajuda no seu dia a dia?',
    helper_text:
      'Pense no que costuma trazer respiro, clareza ou sustentação. Conte com suas próprias palavras antes de ver o que já identificamos.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'recursos_espontaneos_open_first_i2',
      concept_key: 'recognized_personal_resource',
      temporality: 'current',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Ver alguns exemplos de apoios que costumam aparecer',
        option_set_ref: 'opt_recursos_apoio',
      },
      option_set: {
        id: 'opt_recursos_apoio',
        items: [
          { id: 'movimento_pausa', label: 'Movimentar o corpo ou fazer uma pausa de silêncio' },
          { id: 'conversa_acolhedora', label: 'Conversar com alguém de confiança e ser ouvida' },
          {
            id: 'contato_natureza',
            label: 'Estar ao ar livre, respirar ou contato com a natureza',
          },
          { id: 'tempo_solitude', label: 'Momentos sozinha para reorganizar os pensamentos' },
          { id: 'escrita_expressao', label: 'Escrever, criar ou colocar para fora em palavras' },
          { id: 'outro_recurso', label: 'Outro apoio que funciona para mim' },
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
    id: 'p-07g-i2-recursos-reconhecimento',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-2',
    step_order: 3,
    prompt_order: 2,
    step_title: 'Reconhecendo seus recursos',
    step_subtitle: 'Apoios que você já identificou em diferentes partes da sua experiência.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Você já identificou que alguns apoios costumam ajudar em diferentes momentos. Como isso se parece com você?',
    helper_text:
      'Lembrando: saber que algo ajuda não significa que seja fácil de acessar o tempo todo.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'recursos_reconhecimento_sintese_i2',
      concept_key: 'resource_access_context',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'faz_sentido_e_acessivel',
          title: 'Faz sentido — e costumo conseguir recorrer a isso quando preciso',
          description: 'São apoios reais que fazem parte da minha prática cotidiana.',
        },
        {
          id: 'conheco_mas_dificil_acessar',
          title: 'Eu sei que ajuda, mas em certas situações é difícil conseguir acessar',
          description: 'Quando a sobrecarga ou o estresse apertam, fica mais distante.',
        },
        {
          id: 'funciona_em_alguns_contextos',
          title: 'Funciona muito bem em alguns contextos, mas não em todos',
          description: 'Depende de onde estou e das condições do momento.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Ainda estou descobrindo o que realmente me apoia',
          description: 'Estou em fase de experimentar e observar novas formas de sustentação.',
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
  // I3 — O QUE ESTÁ PEDINDO ATENÇÃO (DESAFIOS E BARREIRAS)
  // Open-first: "Tem algo que percebe que costuma dificultar o que você quer viver?"
  // Regra estrutural: DESAFIO ≠ DEFEITO; BARREIRA ≠ IDENTIDADE.
  // Zero autossabotagem, zero lista de "hábitos ruins".
  // ----------------------------------------------------
  {
    id: 'p-07g-i3-desafios-open-first',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-3',
    step_order: 4,
    prompt_order: 1,
    step_title: 'O que está pedindo atenção',
    step_subtitle: 'Reconhecendo dificuldades sem julgamento, autoculpa ou patologização.',
    component_type: 'FreeReflection',
    prompt_text: 'Tem algo que você percebe que costuma dificultar aquilo que você quer viver?',
    helper_text:
      'Sem autojulgamento: olhar para as dificuldades não é apontar defeitos, mas reconhecer onde a vida pede cuidado.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'desafios_barreiras_open_first_i3',
      concept_key: 'recognized_current_challenge',
      temporality: 'current',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Ver algumas dificuldades que costumam aparecer',
        option_set_ref: 'opt_desafios_frequentes',
      },
      option_set: {
        id: 'opt_desafios_frequentes',
        items: [
          {
            id: 'sobrecarga_falta_tempo',
            label: 'Sobrecarga de tarefas e falta de espaço na rotina',
          },
          { id: 'dificuldade_dizer_nao', label: 'Dificuldade de colocar limites ou dizer não' },
          { id: 'autocobranca_excessiva', label: 'Cobrança interna alta e pressa constante' },
          { id: 'cansaco_acumulado', label: 'Cansaço físico e pouca energia de recuperação' },
          { id: 'outro_desafio', label: 'Outra dificuldade particular minha' },
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
    id: 'p-07g-i3-desafios-reconhecimento',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-3',
    step_order: 5,
    prompt_order: 2,
    step_title: 'Como essas dificuldades se manifestam',
    step_subtitle: 'Contextualizando onde e quando elas costumam ter mais peso.',
    component_type: 'ChoiceCards',
    prompt_text: 'Quando você olha para essas dificuldades, o que parece torná-las mais presentes?',
    helper_text:
      'Compreender o contexto ajuda a não transformar um desafio situacional em um traço fixo.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'desafios_contexto_manifestacao_i3',
      concept_key: 'recognized_barrier',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'aparece_sob_pressao_ou_cansaco',
          title: 'Aparece principalmente em períodos de muita pressão ou cansaço',
          description: 'Quando as exigências aumentam, a dificuldade fica mais evidente.',
        },
        {
          id: 'ligada_a_certas_relacoes',
          title: 'Costuma acontecer em determinadas relações ou ambientes específicos',
          description: 'Tem mais a ver com o contexto relacional do que com meu estado geral.',
        },
        {
          id: 'tem_sido_recorrente_na_rotina',
          title: 'Tem sido algo recorrente no dia a dia, mesmo sem grande crise',
          description: 'Uma sensação constante de atrito que pede reorganização.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Ainda estou descobrindo o que está por trás disso',
          description: 'É uma percepção nova que estou começando a registrar.',
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
  // I4 — O QUE ISSO FAZ POR MIM — E O QUE ÀS VEZES CUSTA (CONDICIONAL)
  // Título participant-facing OBRIGATÓRIO: "O que isso faz por mim — e o que às vezes custa"
  // PROIBIDO como título: "O que eu faço para me proteger".
  // PROIBIDO: "Seu padrão de proteção é…", "mecanismo de defesa", adaptativo/disfuncional.
  // Gate obrigatório para abrir: contexto + resposta + função percebida + consequência (quarteto 07C/07D).
  // Sem o quarteto: I4 NÃO abre (ausência silenciosa, requires_branch_open = true).
  // Benefício e custo exibidos como dados distintos.
  // ----------------------------------------------------
  {
    id: 'p-07g-i4-protecao-funcional',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-4',
    step_order: 6,
    prompt_order: 1,
    step_title: 'O que isso faz por mim — e o que às vezes custa',
    step_subtitle:
      'Compreensão funcional sobre formas de agir que ajudam em certas situações e cobram preço em outras.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Algumas respostas parecem ajudar você a atravessar certas situações. E às vezes elas também podem ter algum custo. Como você percebe isso?',
    helper_text:
      'Não se trata de autossabotagem nem de erro pessoal: muitas reações funcionam para dar segurança no curto prazo, mesmo que cobrem um preço depois.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'compreensao_funcional_respostas_i4',
      concept_key: 'possible_protective_pattern',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'faz_muito_sentido_ajuda_e_custa',
          title: 'Faz muito sentido: me ajuda no momento imediato, mas depois percebo o custo',
          description: 'Reconheço essa dupla face na forma como reajo.',
        },
        {
          id: 'percebo_mais_o_custo_hoje',
          title: 'Hoje percebo mais o custo do que a ajuda',
          description: 'Sinto que essa resposta já não me serve tão bem quanto servia antes.',
        },
        {
          id: 'funciona_bem_onde_preciso',
          title: 'Ainda é algo que me protege e que sinto necessidade de manter',
          description: 'Em certos contextos, continua sendo uma forma importante de cuidado.',
        },
        {
          id: 'nao_e_bem_assim',
          title: 'Não é bem assim / Não me reconheço nessa leitura',
          description: 'Não vejo essa reação com essa função ou custo.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Ainda estou descobrindo o que essa resposta faz por mim',
          description: 'É algo sutil que estou começando a notar.',
        },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true, // Gate condicional: quarteto de proteção exigido
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // ----------------------------------------------------
  // I5 — PARA ONDE EU QUERO IR (DIREÇÃO) — OBRIGATÓRIA
  // Ponte para Realização.
  // Open-first: "Olhando para tudo isso, o que você sente que gostaria de viver de um jeito diferente?"
  // Múltiplas direções permitidas (MultiSelectCards).
  // "Ainda estou descobrindo" é resposta plena.
  // DIREÇÃO ≠ META ≠ PLANO ≠ COMPROMISSO (zero SMART, zero prazo).
  // Capacidade atual = campo qualitativo de espaço/condições reais.
  // ----------------------------------------------------
  {
    id: 'p-07g-i5-direcao-open-first',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-5',
    step_order: 7,
    prompt_order: 1,
    step_title: 'Para onde eu quero ir',
    step_subtitle: 'Direções genuínas de vida que você sente vontade de cultivar.',
    component_type: 'FreeReflection',
    prompt_text:
      'Olhando para tudo isso, o que você sente que gostaria de viver de um jeito diferente?',
    helper_text:
      'Isso não é um plano de metas nem um compromisso rígido. Apenas um desejo sincero de direção para a sua vida.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'direcao_vida_open_first_i5',
      concept_key: 'reported_change_desire',
      temporality: 'current',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Ver algumas direções que costumam inspirar',
        option_set_ref: 'opt_direcoes_inspiracao',
      },
      option_set: {
        id: 'opt_direcoes_inspiracao',
        items: [
          {
            id: 'mais_respiro_rotina',
            label: 'Viver com mais respiro, presença e calma no cotidiano',
          },
          {
            id: 'relacoes_mais_leves',
            label: 'Construir relações mais autênticas, francas e leves',
          },
          {
            id: 'cuidar_do_corpo',
            label: 'Dar mais atenção aos ritmos, descanso e cuidado do corpo',
          },
          {
            id: 'espaco_projetos_pessoais',
            label: 'Abrir espaço para o que realmente tem significado para mim',
          },
          { id: 'autonomia_decisoes', label: 'Ter mais segurança e autonomia nas minhas escolhas' },
          { id: 'outra_direcao', label: 'Outro rumo que tem sentido para mim' },
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
    id: 'p-07g-i5-direcoes-multiplas',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-5',
    step_order: 8,
    prompt_order: 2,
    step_title: 'Seus horizontes de sentido',
    step_subtitle: 'Você pode selecionar uma ou mais direções que convergem com seu momento.',
    component_type: 'MultiSelectCards',
    prompt_text: 'Quais destas direções ressoam com aquilo que você quer cultivar agora?',
    helper_text:
      'Você pode escolher mais de uma ou marcar que ainda está descobrindo. Não há certo ou errado.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'direcoes_multiplas_selecao_i5',
      concept_key: 'desired_life_direction',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'mais_calma_e_ritmo',
          title: 'Mais calma e respeito ao meu ritmo',
          description: 'Desacelerar e não viver correndo atrás das urgências.',
        },
        {
          id: 'clareza_nas_escolhas',
          title: 'Mais clareza e firmeza nas minhas escolhas',
          description: 'Saber dizer o que quero e o que não cabe mais.',
        },
        {
          id: 'aprofundar_vinculos_nutritivos',
          title: 'Aprofundar vínculos verdadeiros e nutritivos',
          description: 'Cuidar de relações onde posso ser eu mesma.',
        },
        {
          id: 'espaco_para_o_que_tem_sentido',
          title: 'Abrir espaço real para o que tem sentido',
          description: 'Dar lugar ao que alimenta meu ânimo de viver.',
        },
        {
          id: 'cuidado_da_saude_e_vitalidade',
          title: 'Cuidado integrado da minha vitalidade',
          description: 'Sono, alimentação e movimento que me sustentem.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Ainda estou descobrindo para onde quero caminhar',
          description: 'Estou em um momento de transição e escuta.',
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
    id: 'p-07g-i5-capacidade-contexto-real',
    experience_id: INTEGRACAO_CONSCIENCIA_EXPERIENCE_ID,
    moment_id: 'mom-int-5',
    step_order: 9,
    prompt_order: 3,
    step_title: 'Condições e espaço na vida real',
    step_subtitle: 'Reconhecendo com honestidade o espaço disponível hoje — sem cobranças.',
    component_type: 'ChoiceCards',
    prompt_text: 'Quanto espaço você sente que essas direções têm na sua vida hoje?',
    helper_text:
      'Uma leitura qualitativa das suas condições reais de tempo, energia e contexto — nunca uma nota de desempenho.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'capacidade_contexto_real_i5',
      concept_key: 'current_capacity_context',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'sinto_que_ha_bom_espaco',
          title: 'Sinto que há um espaço favorável para começar a mover isso',
          description:
            'Tenho certa disponibilidade de energia e tempo para dar os primeiros passos.',
        },
        {
          id: 'espaco_pequeno_mas_possivel',
          title: 'O espaço é pequeno, mas sinto que é possível abrir pequenas brechas',
          description: 'A rotina é cheia, mas pequenos movimentos já fazem diferença.',
        },
        {
          id: 'rotina_muito_apertada_agora',
          title: 'A rotina e as demandas estão muito pesadas no momento',
          description:
            'Preciso primeiro de respiro e suporte antes de movimentar grandes mudanças.',
        },
        {
          id: 'ainda_estou_entendendo_o_espaco',
          title: 'Ainda estou entendendo como isso cabe na minha realidade',
          description: 'Observando minhas condições sem me precipitar.',
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

// Prompts do Caminho Essencial (Persona A: I1 1 ato · I2 2 · I3 2 · I4 0 (condicional fechado) · I5 3 = 8 prompts estruturais, 5–6 interações percebidas, ~6–10 min)
export const INTEGRACAO_ESSENTIAL_PATH_PROMPT_KEYS = [
  'recorrencias_transversais_i1',
  'recursos_espontaneos_open_first_i2',
  'recursos_reconhecimento_sintese_i2',
  'desafios_barreiras_open_first_i3',
  'desafios_contexto_manifestacao_i3',
  'direcao_vida_open_first_i5',
  'direcoes_multiplas_selecao_i5',
  'capacidade_contexto_real_i5',
]
