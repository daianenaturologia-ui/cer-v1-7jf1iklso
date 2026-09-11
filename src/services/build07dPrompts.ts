/**
 * Build 07D — Especificação Normativa e Definições de Schema dos Prompts e Momentos
 * Dimensão: Relações (Dimension ID: 8axg17hqfihj7ln, Experience ID: exp-relacoes-07d)
 *
 * Princípios Normativos Constitucionais:
 * - A participante deve terminar sentindo "Estou percebendo como eu me movimento nas minhas relações."
 * - NUNCA "fiz um teste de relacionamento" / "descobri meu estilo de apego"
 * - Leveza, cenas, visualidade, branching determinístico, Registro Único, open-first, Evidence Currency,
 *   derived privacy, zero causalidade automática, zero identidade fixa.
 * - ZERO menção participant-facing de: apego seguro/ansioso/evitativo/desorganizado, score de apego, estilo de apego.
 * - Terceiros: relatos sobre terceiros = participant_report_about_relationship/context (nunca fato clínico/diagnóstico verificado).
 * - Distância percebida no mapa ≠ qualidade / segurança / afeto / disfunção.
 * - Known repair resource ≠ repair resource availability (duas camadas distintas).
 * - "Às vezes a relação não volta" é resposta válida e digna — zero patologização.
 * - Registro Único: o que já existe em 07C é REUSED puro quando equivalente, ou CONTEXTUALIZED se vínculo traz dado novo,
 *   ou NEW para contexto verdadeiramente novo.
 * - Concept Keys estritamente fechadas.
 */

import type { CerExperienceRecord, CerExperienceMomentRecord, CerPromptRecord } from '@/types/cer'

// IDs Canônicos de Dimensão e Experiência
export const RELACOES_DIMENSION_ID = '8axg17hqfihj7ln'
export const RELACOES_EXPERIENCE_ID = 'exp-relacoes-07d'

// Concept Keys Canônicas Fechadas do 07D
export const BUILD_07D_CONCEPT_KEYS = [
  'current_relational_closeness',
  'desired_relational_closeness',
  'relational_comfort_with_closeness',
  'belonging_context',
  'vulnerability_context_pattern',
  'boundary_response_pattern',
  'support_seeking_pattern',
  'care_receiving_pattern',
  'response_to_perceived_distance',
  'perceived_distance_internal_experience',
  'what_is_at_stake_when_distance_hurts',
  'relational_response_tendency',
  'perceived_relational_response_function',
  'conflict_response_pattern',
  'known_repair_resource',
  'repair_resource_availability',
  'relationship_context_variability',
] as const

export type Build07DConceptKey =
  (typeof BUILD_07D_CONCEPT_KEYS)[keyof typeof BUILD_07D_CONCEPT_KEYS]

// Concept Keys PROIBIDAS no schema e opções participant-facing
export const FORBIDDEN_07D_CONCEPTS_OR_LABELS = [
  'anxious_attachment',
  'avoidant_attachment',
  'secure_attachment',
  'disorganized_attachment',
  'abandonment_wound',
  'rejection_sensitivity',
  'codependency',
  'people_pleasing_confirmed',
  'relational_trauma',
  'apego seguro',
  'apego ansioso',
  'apego evitativo',
  'apego desorganizado',
  'ferida de abandono',
  'sensibilidade a rejeicao',
  'codependencia',
] as const

// ==========================================
// EXPERIÊNCIA CANÔNICA DE RELAÇÕES
// ==========================================

export const RELACOES_EXPERIENCE: CerExperienceRecord = {
  id: RELACOES_EXPERIENCE_ID,
  dimension_id: RELACOES_DIMENSION_ID,
  code: 'relacoes_cer',
  title: 'Relações & Vínculos',
  subtitle:
    'Como você se movimenta com as pessoas ao redor, limites, proximidade e caminhos de encontro.',
  order_index: 5,
  is_pilot: false,
  opening_text:
    'Um espaço para olhar para o seu mundo de relações com gentileza e curiosidade. Não existe um jeito certo de se relacionar — estamos aqui para reconhecer como você se move nos vínculos que importam para você hoje.',
  closing_text:
    'Suas percepções sobre vínculos, proximidade e cuidado foram integradas com acolhimento e respeito. Este panorama nos ajuda a compreender seu jeito único de caminhar com o outro.',
  version: 1,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
}

// ==========================================
// MOMENTOS DE RELAÇÕES (RM1..RM5)
// ==========================================

export const RELACOES_MOMENTS: CerExperienceMomentRecord[] = [
  {
    id: 'mom-rel-1',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_key: 'meu_mundo_de_relacoes',
    title: 'Meu Mundo de Relações',
    subtitle: 'As órbitas de proximidade dos vínculos significativos na sua vida hoje.',
    order_index: 1,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-rel-2',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_key: 'perto_longe_e_do_meu_jeito',
    title: 'Perto, Longe e do Meu Jeito',
    subtitle: 'Pequenas cenas sobre intimidade, limites, espaço e afastamento percebido.',
    order_index: 2,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-rel-3',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_key: 'quando_preciso_de_alguem',
    title: 'Quando Preciso de Alguém',
    subtitle: 'Como costuma ser para você pedir apoio e como é receber cuidado.',
    order_index: 3,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-rel-4',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_key: 'quando_algo_acontece_entre_nos',
    title: 'Quando Algo Acontece Entre Nós',
    subtitle: 'O movimento que costuma surgir primeiro diante de tensões ou conflitos.',
    order_index: 4,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-rel-5',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_key: 'como_voltamos_a_nos_encontrar',
    title: 'Como Voltamos a nos Encontrar',
    subtitle: 'Recursos conhecidos de reparação, disponibilidade e o espelho integrado.',
    order_index: 5,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// ==========================================
// PROMPTS CANÔNICOS DE RELAÇÕES (RM1..RM5)
// ==========================================

export const BUILD_07D_RELACOES_PROMPTS: CerPromptRecord[] = [
  // ----------------------------------------------------
  // RM1 — MEU MUNDO DE RELAÇÕES
  // 1. RelationalOrbitMap: current_relational_closeness (temporality: current, participant_shared)
  // 2. Conforto com proximidade: relational_comfort_with_closeness (NÃO colapsar com proximidade atual nem desejada)
  // 3. Pertencimento como camada adjacente ao mapa (open-first): belonging_context
  // ----------------------------------------------------
  {
    id: 'p-07d-rm1-orbit-map',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'Seu mapa de vínculos hoje',
    step_subtitle: 'Posicione as pessoas, categorias ou grupos significativos nas órbitas.',
    component_type: 'RelationalOrbitMap',
    prompt_text:
      'Como as relações e vínculos mais presentes parecem estar orbitando na sua vida hoje?',
    helper_text:
      'Você no centro. Adicione vínculos usando apelidos ou categorias. Não existe distância certa — estamos olhando apenas para a proximidade percebida hoje.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'mapa_orbitas_relacionais',
      concept_key: 'current_relational_closeness',
      temporality: 'current',
      access_destination: 'participant_shared',
      maxItems: 8,
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07d-rm1-conforto-proximidade',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-1',
    step_order: 2,
    prompt_order: 2,
    step_title: 'Conforto com a proximidade',
    step_subtitle: 'Separando a proximidade atual da sensação interna de conforto.',
    component_type: 'ChoiceCards',
    prompt_text: 'Estar perto dessas pessoas costuma parecer confortável para você?',
    helper_text: 'Olhando para a sua sensação interna mais comum diante dessa proximidade.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'conforto_com_proximidade',
      concept_key: 'relational_comfort_with_closeness',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'confortavel_natural',
          title: 'Geralmente muito confortável',
          description: 'Sinto segurança e bem-estar na proximidade.',
        },
        {
          id: 'confortavel_com_limites',
          title: 'Confortável, desde que eu preserve meu ritmo e limites',
          description: 'A proximidade é boa quando há respiro.',
        },
        {
          id: 'muda_bastante_por_vinculo',
          title: 'Muda bastante dependendo da pessoa ou do momento',
          description: 'Com algumas é muito leve, com outras exige cautela.',
        },
        {
          id: 'desconforto_ou_cautela',
          title: 'Às vezes traz certa tensão ou cautela interna',
          description: 'Fico mais alerta ou sinto sobrecarga com a proximidade.',
        },
        {
          id: 'depende_do_meu_momento',
          title: 'Depende mais de como eu estou por dentro',
          description: 'Quando estou descansada é bom; sob estresse prefiro recolhimento.',
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
    id: 'p-07d-rm1-pertencimento',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-1',
    step_order: 3,
    prompt_order: 3,
    step_title: 'Espaços de pertencimento',
    step_subtitle: 'Onde você sente que pode ser você mesma.',
    component_type: 'FreeReflection',
    prompt_text: 'E onde, com quem ou em quais espaços você sente que pode ser mais você?',
    helper_text:
      'Pode ser uma pessoa específica, um grupo, uma comunidade, um lugar/espaço ou outro. Escreva espontaneamente ou consulte os apoios.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'espacos_pertencimento',
      concept_key: 'belonging_context',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Precisa de apoio para começar? Veja alguns contextos comuns',
        option_set_ref: 'opt_contextos_pertencimento',
      },
      option_set: {
        id: 'opt_contextos_pertencimento',
        items: [
          { id: 'amizade_especifica', label: 'Com uma ou duas amizades muito íntimas' },
          { id: 'parceria_afetiva', label: 'Na minha relação afetiva / parceria' },
          { id: 'comunidade_ou_grupo', label: 'Em um grupo de interesse, estudo ou prática' },
          { id: 'momentos_sozinha', label: 'Principalmente quando estou no meu próprio espaço' },
          { id: 'familia_escolhida', label: 'Na família ou pessoas de acolhimento' },
          {
            id: 'ainda_procurando',
            label: 'Ainda estou procurando espaços onde possa ser totalmente eu',
          },
          { id: 'depende_do_ambiente', label: 'Varia muito dependendo do ambiente' },
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
  // RM2 — PERTO, LONGE E DO MEU JEITO (Cenas relacionais)
  // 1. Intimidade / vulnerabilidade: o que gera confiança (open-first, vulnerability_context_pattern)
  // 2. Limites em cena única adaptativa: boundary_response_pattern
  // 3. Afastamento percebido (CENA OBRIGATÓRIA):
  //    A. Experiência interna: perceived_distance_internal_experience
  //    B. Movimento relacional: response_to_perceived_distance
  //    C. Branch determinístico: what_is_at_stake_when_distance_hurts (SOMENTE se intenso)
  // ----------------------------------------------------
  {
    id: 'p-07d-rm2-confianca-vulnerabilidade',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-2',
    step_order: 4,
    prompt_order: 1,
    step_title: 'Quando alguém quer chegar mais perto',
    step_subtitle: 'Intimidade, confiança e ritmo pessoal.',
    component_type: 'FreeReflection',
    prompt_text:
      'Quando alguém importante quer chegar mais perto de uma parte sua que você costuma proteger, o que costuma ajudar você a sentir confiança?',
    helper_text: 'Conte espontaneamente ou use os pontos de apoio.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'confianca_vulnerabilidade',
      concept_key: 'vulnerability_context_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Veja algumas coisas que costumam fazer diferença',
        option_set_ref: 'opt_confianca_vulnerabilidade',
      },
      option_set: {
        id: 'opt_confianca_vulnerabilidade',
        items: [
          { id: 'tempo_e_ritmo', label: 'Sentir que a pessoa não tem pressa e respeita meu ritmo' },
          {
            id: 'consistencia_atitudes',
            label: 'Ver coerência e constância nas atitudes ao longo do tempo',
          },
          {
            id: 'reciprocidade',
            label: 'Quando a outra pessoa também se mostra e divide algo dela',
          },
          { id: 'escuta_sem_julgamento', label: 'Perceber que não serei corrigida nem julgada' },
          { id: 'clareza_intencoes', label: 'Clareza direta sobre o que a pessoa sente ou espera' },
          { id: 'depende_do_vinculo', label: 'Muda radicalmente dependendo de quem é a pessoa' },
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
    id: 'p-07d-rm2-limites-cena',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-2',
    step_order: 5,
    prompt_order: 2,
    step_title: 'Quando algo passa do confortável',
    step_subtitle: 'Cena adaptativa sobre limites sem julgamento moral.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Quando algo começa a passar do que é confortável para você, o que costuma acontecer?',
    helper_text: 'Sem certo ou errado — apenas a forma como sua resposta costuma se dar.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'limites_cena_adaptativa',
      concept_key: 'boundary_response_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'percebo_e_falo',
          title: 'Percebo logo e consigo sinalizar ou falar',
          description: 'Consigo comunicar meu limite com relativa clareza.',
        },
        {
          id: 'percebo_mas_demoro',
          title: 'Percebo o incômodo na hora, mas demoro a conseguir falar',
          description: 'Fico pensando em como colocar ou espero para ver se melhora.',
        },
        {
          id: 'percebo_depois',
          title: 'Só percebo que passou do ponto depois, quando já estou cansada',
          description: 'O cansaço ou a irritação aparecem mais tarde.',
        },
        {
          id: 'tento_me_adaptar',
          title: 'Tento me adaptar ou esticar um pouco para acomodar a outra pessoa',
          description: 'Priorizo manter o fluxo ou o bem-estar do momento.',
        },
        {
          id: 'me_afasto',
          title: 'Costumo me afastar em silêncio ou colocar distância física',
          description: 'Prefiro sair da situação a entrar em confronto.',
        },
        {
          id: 'depende_da_pessoa',
          title: 'Muda bastante dependendo de quem é a pessoa ou do contexto',
          description: 'Com algumas falo na hora, com outras recuo.',
        },
        {
          id: 'outra_resposta_limite',
          title: 'Outro movimento próprio',
          description: 'Uma resposta particular que não se encaixa nessas.',
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
    id: 'p-07d-rm2-afastamento-interna',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-2',
    step_order: 6,
    prompt_order: 3,
    step_title: 'Quando alguém importante parece distante: o que você sente',
    step_subtitle: 'A experiência interna diante do afastamento percebido.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Imagine que alguém importante parece mais distante do que de costume e você ainda não sabe por quê. O que costuma acontecer por dentro de você primeiro?',
    helper_text: 'Sua sensação interna inicial.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'afastamento_experiencia_interna',
      concept_key: 'perceived_distance_internal_experience',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'preocupada_ou_ansiosa',
          title: 'Fico preocupada, com sensação de aperto ou alerta interno',
          description: 'Minha cabeça começa a buscar entender o que aconteceu.',
        },
        {
          id: 'triste_ou_recolhida',
          title: 'Sinto tristeza, pesar ou vontade de me recolher',
          description: 'A energia baixa e sinto um peso no peito.',
        },
        {
          id: 'irritada_ou_impaciente',
          title: 'Sinto irritação ou impaciência com a incerteza',
          description: 'Incomoda ficar sem saber o que está acontecendo.',
        },
        {
          id: 'alivio_ou_espaco',
          title: 'Às vezes sinto até certo alívio ou aproveito o espaço',
          description: 'Tenho mais tempo para mim e não vejo problema imediato.',
        },
        {
          id: 'quase_nao_mexe',
          title: 'Quase não mexe comigo; imagino que seja algo da própria pessoa',
          description: 'Mantenho meu ritmo tranquilo sem presumir nada grave.',
        },
        {
          id: 'confusa_ou_depende',
          title: 'Fico confusa ou varia muito conforme o vínculo',
          description: 'Depende de quem é e de quanto esse vínculo é central.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_rm2_afastamento_intenso',
            when: {
              any_of: [
                { field: 'choice', operator: 'equals', value: 'preocupada_ou_ansiosa' },
                { field: 'choice', operator: 'equals', value: 'triste_ou_recolhida' },
                { field: 'choice', operator: 'equals', value: 'irritada_ou_impaciente' },
              ],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'o_que_esta_em_jogo_branch',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07d-rm2-afastamento-movimento',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-2',
    step_order: 7,
    prompt_order: 4,
    step_title: 'O que você costuma fazer diante do afastamento',
    step_subtitle: 'O movimento relacional concreto.',
    component_type: 'ChoiceCards',
    prompt_text: 'E o que você costuma fazer concretamente diante desse afastamento?',
    helper_text: 'Sua tendência de ação relacional.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'afastamento_movimento_relacional',
      concept_key: 'response_to_perceived_distance',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'procuro_ou_pergunto',
          title: 'Procuro a pessoa e pergunto diretamente se aconteceu algo',
          description: 'Prefiro esclarecer logo para não ficar na dúvida.',
        },
        {
          id: 'busco_confirmacao',
          title: 'Busco contato sutil ou sinais de que está tudo bem entre nós',
          description: 'Mando mensagem casual ou fico monitorando as respostas.',
        },
        {
          id: 'espero_e_dou_espaco',
          title: 'Espero um tempo e dou espaço para a pessoa no tempo dela',
          description: 'Imagino que ela precise de momento próprio.',
        },
        {
          id: 'me_afasto_tambem',
          title: 'Tendo a me afastar também ou fechar o contato',
          description: 'Se a pessoa não vem, eu também não vou atrás.',
        },
        {
          id: 'tento_resolver_ou_agradar',
          title: 'Tento cuidar ou resolver algo para reaproximar',
          description: 'Procuro ser útil ou facilitar a convivência.',
        },
        {
          id: 'fico_observando',
          title: 'Fico observando de longe sem tomar iniciativa imediata',
          description: 'Acompanho como as coisas se desenrolam.',
        },
        {
          id: 'depende_do_vinculo',
          title: 'Depende muito de quem é a pessoa',
          description: 'Com algumas procuro na hora; com outras espero semanas.',
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

  // Branch Adaptativo RM2: O que parece estar em jogo (SOMENTE se afastamento for intenso)
  // Open-first com ajuda opcional (what_is_at_stake_when_distance_hurts)
  // PROIBIDO: "ferida de abandono", "rejection sensitivity", etc.
  {
    id: 'p-07d-rm2-branch-em-jogo',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-2',
    step_order: 8,
    prompt_order: 5,
    step_title: 'O que parece estar em jogo',
    step_subtitle: 'Apenas quando o afastamento mobiliza uma resposta mais intensa.',
    component_type: 'FreeReflection',
    prompt_text: 'Quando esse afastamento mexe mais fundo com você, o que parece estar em jogo?',
    helper_text: 'Escreva espontaneamente ou consulte os pontos de apoio.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'o_que_esta_em_jogo_branch',
      concept_key: 'what_is_at_stake_when_distance_hurts',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Veja algumas sensações que costumam aparecer nesses momentos',
        option_set_ref: 'opt_o_que_esta_em_jogo',
      },
      option_set: {
        id: 'opt_o_que_esta_em_jogo',
        items: [
          { id: 'medo_de_perder_relacao', label: 'Medo de perder a proximidade ou o vínculo' },
          { id: 'medo_de_ter_errado', label: 'Sensação de ter feito algo errado sem perceber' },
          {
            id: 'sensacao_nao_importar',
            label: 'Sensação de que o vínculo importa mais para mim do que para o outro',
          },
          { id: 'medo_ficar_sozinha', label: 'Receio de ficar desamparada ou sozinha' },
          { id: 'sensacao_rejeicao', label: 'Uma sensação incômoda de rejeição ou exclusão' },
          {
            id: 'raiva_da_indiferenca',
            label: 'Irritação com a falta de consideração ou silêncio',
          },
          { id: 'nao_sei_nomear', label: 'Ainda acho difícil nomear o que pega com clareza' },
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
  // RM3 — QUANDO PRECISO DE ALGUÉM
  // 1. Pedir apoio: support_seeking_pattern
  // 2. Camada condicional: care_receiving_pattern (receber cuidado ≠ pedir apoio)
  // ----------------------------------------------------
  {
    id: 'p-07d-rm3-pedir-apoio',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-3',
    step_order: 9,
    prompt_order: 1,
    step_title: 'Quando você precisa de alguém',
    step_subtitle: 'Como costuma ser o movimento de pedir apoio.',
    component_type: 'ChoiceCards',
    prompt_text: 'Quando você realmente precisa de alguém, o que costuma acontecer?',
    helper_text: 'Apenas a sua tendência mais recorrente.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'pedir_apoio_tendencia',
      concept_key: 'support_seeking_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'peco_diretamente',
          title: 'Costumo pedir diretamente para quem confio',
          description: 'Falo o que estou precisando com clareza.',
        },
        {
          id: 'espero_que_percebam',
          title: 'Tendo a esperar que a outra pessoa perceba',
          description: 'Fico com esperança de que notem que estou sobrecarregada.',
        },
        {
          id: 'tento_resolver_sozinha',
          title: 'Tento resolver sozinha até o limite antes de pedir',
          description: 'Recorro aos outros apenas quando não tenho outra saída.',
        },
        {
          id: 'procuro_alguem_especifico',
          title: 'Procuro apenas uma ou duas pessoas muito específicas',
          description: 'Tenho círculos bem delimitados para abrir necessidades.',
        },
        {
          id: 'demoro_a_perceber',
          title: 'Demoro para perceber que estou precisando de ajuda',
          description: 'Vou no automático e só noto quando já passei da conta.',
        },
        {
          id: 'depende_do_tipo_apoio',
          title: 'Muda bastante conforme o tipo de necessidade',
          description: 'Apoio prático peço fácil; emocional guardo mais.',
        },
        {
          id: 'outra_resposta_apoio',
          title: 'Outra forma própria',
          description: 'Um jeito que não está descrito aqui.',
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
    id: 'p-07d-rm3-receber-cuidado',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-3',
    step_order: 10,
    prompt_order: 2,
    step_title: 'Receber cuidado oferecido',
    step_subtitle: 'Diferenciando pedir apoio de como é receber quando oferecido.',
    component_type: 'ChoiceCards',
    prompt_text:
      'E quando alguém oferece cuidado ou ajuda sem você ter pedido, como costuma ser receber?',
    helper_text: 'A sensação interna diante do cuidado que chega.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'receber_cuidado_tendencia',
      concept_key: 'care_receiving_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'recebo_com_facilidade',
          title: 'Recebo com facilidade, alívio e gratidão',
          description: 'Sinto que é bem-vindo e me aconchega.',
        },
        {
          id: 'recebo_mas_com_divida',
          title: 'Recebo, mas fico logo pensando em como retribuir',
          description: 'Dá certa sensação de dívida ou urgência de compensar.',
        },
        {
          id: 'desconforto_ou_recusa',
          title: 'Sinto desconforto ou vontade de recusar dizendo que está tudo bem',
          description: 'Custa aceitar ser cuidada.',
        },
        {
          id: 'depende_muito_de_quem_oferece',
          title: 'Muda completamente dependendo de quem oferece',
          description: 'Com algumas pessoas recebo em paz; com outras fico ressabiada.',
        },
        {
          id: 'recebo_apoio_pratico_nao_emocional',
          title: 'Apoio prático é mais fácil; cuidado íntimo ou emocional me mobiliza mais',
          description: 'A proximidade afetiva é mais delicada.',
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
  // RM4 — QUANDO ALGO ACONTECE ENTRE NÓS (Tensão e Conflito)
  // Conflito / tensão relacional: conflict_response_pattern
  // Reúso epistêmico com Regulação 07C:
  // Se 07C já tem response de regulação, é contextualizado pelo vínculo;
  // Regra dura: "afasta-se sob pressão geral" ≠ "afasta-se quando parceiro se aproxima".
  // Conflito não vira disfunção.
  // ----------------------------------------------------
  {
    id: 'p-07d-rm4-conflito-movimento',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-4',
    step_order: 11,
    prompt_order: 1,
    step_title: 'O primeiro movimento no conflito',
    step_subtitle: 'Quando há tensão ou divergência em relações importantes.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Quando existe uma tensão ou conflito com alguém importante, qual movimento costuma aparecer primeiro em você?',
    helper_text: 'Aquele impulso imediato inicial diante da tensão.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'conflito_movimento_inicial',
      concept_key: 'conflict_response_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      context_reuse: {
        source_concept_key: 'tendencia_resposta_mobilizacao',
        reused_label: 'Padrão geral observado na regulação',
      },
      options: [
        {
          id: 'confronto_ou_resolver_ja',
          title: 'Vontade de falar e tentar resolver ou esclarecer já',
          description: 'Incomoda sustentar a tensão no ar.',
        },
        {
          id: 'recuo_para_processar',
          title: 'Preciso de tempo e silêncio antes de conseguir conversar',
          description: 'Se for forçada a falar na hora, me fecho ou me irrito.',
        },
        {
          id: 'apaziguar_ou_ceder',
          title: 'Tendo a amenizar o clima, pedir desculpas ou ceder',
          description: 'Priorizo diminuir o atrito o mais rápido possível.',
        },
        {
          id: 'defesa_ou_justificativa',
          title: 'Fico armada para me defender ou justificar meu ponto',
          description: 'Sinto o perigo de ser mal interpretada ou injustiçada.',
        },
        {
          id: 'paralisia_ou_bloqueio',
          title: 'Fico em choque ou bloqueio temporariamente sem saber como agir',
          description: 'Custa encontrar as palavras no momento.',
        },
        {
          id: 'muda_completamente_por_relacao',
          title: 'Muda completamente dependendo da relação',
          description: 'Com algumas enfrento; com outras recuo totalmente.',
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
  // RM5 — COMO VOLTAMOS A NOS ENCONTRAR (Reparação e Síntese)
  // 1. Reparação open-first: known_repair_resource
  //    "Às vezes a relação não volta" = resposta plena e válida (limite/escolha/término — zero patologia)
  // 2. Disponibilidade do recurso: repair_resource_availability (duas camadas distintas)
  // 3. Variabilidade por vínculo: relationship_context_variability (context_dependent, variação ≠ inconsistência)
  // 4. Espelho composto da dimensão Relações (Recognition sem pontuação nem identidade fixa)
  // ----------------------------------------------------
  {
    id: 'p-07d-rm5-reparacao-recurso',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-5',
    step_order: 12,
    prompt_order: 1,
    step_title: 'O caminho de volta',
    step_subtitle: 'O que costuma ajudar a reparar depois do difícil.',
    component_type: 'FreeReflection',
    prompt_text:
      'Depois que alguma coisa fica difícil entre você e alguém importante, o que costuma ajudar a relação a encontrar um caminho de volta?',
    helper_text:
      'Escreva com suas palavras ou consulte as possibilidades. "Às vezes a relação não volta" também é uma resposta plenamente válida.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'reparacao_recurso_conhecido',
      concept_key: 'known_repair_resource',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Veja alguns caminhos comuns de reparação',
        option_set_ref: 'opt_reparacao_recurso',
      },
      option_set: {
        id: 'opt_reparacao_recurso',
        items: [
          {
            id: 'conversa_calma_depois',
            label: 'Uma conversa sincera e com calma depois que a poeira baixa',
          },
          {
            id: 'gesto_de_carinho_ou_humor',
            label: 'Um gesto simples de afeto, um café ou quebrar o gelo com humor',
          },
          {
            id: 'pedido_desculpas_genuino',
            label: 'Um reconhecimento explícito do que cada um sentiu e errou',
          },
          {
            id: 'tempo_e_espaco',
            label: 'Deixar o tempo passar naturalmente sem forçar reencontro rápido',
          },
          {
            id: 'redefinir_combinados',
            label: 'Alinhar novos limites ou combinados para o futuro',
          },
          {
            id: 'as_vezes_nao_volta',
            label:
              'Às vezes a relação não volta — e reconhecer isso como limite ou término também é um caminho',
          },
          {
            id: 'depende_da_abertura_do_outro',
            label: 'Depende inteiramente de a outra pessoa estar aberta e disponível',
          },
        ],
      },
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_rm5_recurso_nomeado',
            when: {
              // Se nomeou recurso que não seja 'as_vezes_nao_volta', abre pergunta sobre disponibilidade
              any_of: [
                { field: 'choice', operator: 'equals', value: 'conversa_calma_depois' },
                { field: 'choice', operator: 'equals', value: 'gesto_de_carinho_ou_humor' },
                { field: 'choice', operator: 'equals', value: 'pedido_desculpas_genuino' },
                { field: 'choice', operator: 'equals', value: 'tempo_e_espaco' },
                { field: 'choice', operator: 'equals', value: 'redefinir_combinados' },
                { field: 'choice', operator: 'equals', value: 'depende_da_abertura_do_outro' },
              ],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'reparacao_disponibilidade_branch',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07d-rm5-disponibilidade-branch',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-5',
    step_order: 13,
    prompt_order: 2,
    step_title: 'A disponibilidade desse caminho',
    step_subtitle: 'Distinguindo o recurso conhecido de sua presença real no dia a dia.',
    component_type: 'ChoiceCards',
    prompt_text: 'E esse caminho costuma estar disponível nas suas relações atuais?',
    helper_text: 'Recurso conhecido ≠ recurso disponível no cotidiano.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'reparacao_disponibilidade_branch',
      concept_key: 'repair_resource_availability',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'geralmente_disponivel',
          title: 'Geralmente está disponível na maioria das relações importantes',
          description: 'Costumamos encontrar esse caminho quando necessário.',
        },
        {
          id: 'disponivel_apenas_em_algumas',
          title: 'Está disponível apenas em vínculos muito específicos',
          description: 'Em algumas relações funciona; em outras não há abertura.',
        },
        {
          id: 'raramente_disponivel_hoje',
          title: 'Hoje tem sido raro ou difícil de encontrar nas minhas relações',
          description: 'Sei do que ajudaria, mas nem sempre o outro ou o contexto permitem.',
        },
        {
          id: 'em_construcao',
          title: 'É algo que estou aprendendo a construir ou praticar agora',
          description: 'Um recurso em desenvolvimento na minha vida.',
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
    id: 'p-07d-rm5-variabilidade-contexto',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-5',
    step_order: 14,
    prompt_order: 3,
    step_title: 'Como esses movimentos variam',
    step_subtitle: 'Variação por vínculo ≠ inconsistência.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Isso acontece parecido na maior parte das suas relações ou muda bastante dependendo de quem está com você?',
    helper_text: 'Reconhecendo a singularidade de cada vínculo.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'variabilidade_por_vinculo',
      concept_key: 'relationship_context_variability',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'bastante_parecido',
          title: 'Costuma ser bem parecido na maioria dos meus vínculos',
          description: 'Tenho um movimento relativamente estável entre as pessoas.',
        },
        {
          id: 'muda_conforme_seguranca',
          title: 'Muda bastante dependendo do quanto me sinto segura com a pessoa',
          description: 'Em vínculos mais seguros me abro; em outros fico mais cautelosa.',
        },
        {
          id: 'muda_por_papel',
          title: 'Muda conforme o papel (família, parceria afetiva, amigos, trabalho)',
          description: 'Cada contexto convoca uma parte diferente de mim.',
        },
        {
          id: 'muda_conforme_meu_momento',
          title: 'Muda mais conforme o meu momento interno do que por causa do outro',
          description: 'Meu nível de energia e estresse dita a dinâmica.',
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
    id: 'p-07d-rm5-espelho-relacoes',
    experience_id: RELACOES_EXPERIENCE_ID,
    moment_id: 'mom-rel-5',
    step_order: 15,
    prompt_order: 4,
    step_title: 'O espelho do seu movimento relacional',
    step_subtitle:
      'Uma síntese acolhedora das suas percepções — sem notas, estilos ou diagnósticos.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Olhando para este panorama das suas relações, isso faz sentido para você neste momento da sua vida?',
    helper_text: 'Você pode reconhecer, ajustar ou dizer que muda dependendo do contexto.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'espelho_relacoes_recognition',
      concept_key: 'relational_response_tendency',
      temporality: 'current',
      access_destination: 'participant_shared',
      composite_mirror: {
        enabled: true,
        steps: [
          { label: 'Seu mundo de vínculos hoje', prompt_ref: 'mapa_orbitas_relacionais' },
          { label: 'O que gera confiança', prompt_ref: 'confianca_vulnerabilidade' },
          { label: 'Seu movimento diante de limites', prompt_ref: 'limites_cena_adaptativa' },
          {
            label: 'Sensação diante de afastamento',
            prompt_ref: 'afastamento_experiencia_interna',
          },
          { label: 'Ação diante de afastamento', prompt_ref: 'afastamento_movimento_relacional' },
          { label: 'Quando precisa de apoio', prompt_ref: 'pedir_apoio_tendencia' },
          { label: 'Quando recebe cuidado', prompt_ref: 'receber_cuidado_tendencia' },
          { label: 'Movimento em tensões', prompt_ref: 'conflito_movimento_inicial' },
          { label: 'Caminho de reparação', prompt_ref: 'reparacao_recurso_conhecido' },
        ],
      },
      options: [
        {
          id: 'faz_muito_sentido',
          title: 'Faz muito sentido para o que vivo hoje',
          description: 'Reconheço esse movimento com nitidez nas minhas relações.',
        },
        {
          id: 'faz_sentido_em_partes',
          title: 'Faz sentido em partes; algumas coisas estão mudando',
          description: 'Alguns pontos ressoam forte, outros são contextuais.',
        },
        {
          id: 'muda_muito_por_contexto',
          title: 'Muda demais dependendo de quem está comigo',
          description: 'A variabilidade contextual é o traço mais forte.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Ainda estou descobrindo como funciono nas relações',
          description: 'Olhar para isso me trouxe novas percepções.',
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

// Lista canônica de prompts essenciais do Build 07D (caminho essencial = 6-7 interações percebidas)
export const RELACOES_ESSENTIAL_PATH_PROMPT_KEYS = [
  'mapa_orbitas_relacionais',
  'conforto_com_proximidade',
  'espacos_pertencimento',
  'confianca_vulnerabilidade',
  'limites_cena_adaptativa',
  'afastamento_experiencia_interna',
  'afastamento_movimento_relacional',
  'pedir_apoio_tendencia',
  'receber_cuidado_tendencia',
  'conflito_movimento_inicial',
  'reparacao_recurso_conhecido',
  'variabilidade_por_vinculo',
  'espelho_relacoes_recognition',
]
