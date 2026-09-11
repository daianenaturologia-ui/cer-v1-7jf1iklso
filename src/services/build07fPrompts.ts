/**
 * Build 07F — Especificação Normativa e Definições de Schema dos Prompts e Momentos
 * Dimensão: Sentido & Conexão (Dimension ID: ysf4jje7q97f309, Experience ID: exp-sentido-conexao-07f)
 *
 * Princípios Normativos Constitucionais:
 * - A participante deve terminar sentindo:
 *   "Estou percebendo o que me conecta à vida, o que importa para mim e como vivo aquilo que parece maior do que eu."
 * - NÃO: teste de espiritualidade, questionário existencial, avaliação moral, inventário longo de valores,
 *   escores de evolução/despertar/vibração/alinhamento, prescrição de práticas, indução ontológica ou diagnóstica.
 * - Preservar: leveza, escolha, não normatividade, right to skip, open-first, Registro Único,
 *   Evidence Currency, derived privacy, zero score, zero diagnóstico.
 * - 4 Microexperiências estruturais (SC1, SC2, SC3, SC4) + SC5 branch adaptativo participant-led (conforme Errata P0):
 *   SC1: O que me conecta à vida (Open-first; prazer e conexão podem coexistir; não vira propósito automático)
 *   SC2: O que realmente importa (Open-first; valor ≠ meta ≠ objetivo ≠ obrigação; zero culpa; pouco espaço)
 *   SC3: Mais perto de mim / Mais longe de mim (Dual-state; desconexão relatada NÃO vira patologia/crise espiritual)
 *   SC4: Algo maior do que eu (Open-first; opções neutras e recusa plena; espiritualidade ≠ religião)
 *   SC5: Percepção ampliada ou incomum da realidade (BRANCH PARTICIPANT-LED; Errata P0: elegibilidade determinística estrita)
 * - ERRATA P0 OBRIGATÓRIA:
 *   Conexão com algo maior (SC4 = sim/talvez), espiritualidade ou meditação SOZINHAS NÃO tornam SC5 elegível.
 *   SC5 só abre se a participante tiver introduzido explicitamente termos/conteúdo indicando percepção ampliada/incomum/extraordinária.
 *   Zero inferência semântica de IA.
 * - Registro Único:
 *   07D pertencimento/comunidade já coletados NÃO recoletar.
 *   07C conexão/desconexão consigo reutilizar contextualmente; sobrecarga ≠ crise espiritual.
 *   07B natureza/movimento/recurso já conhecido → contextualizar, não recoletar.
 *   07E presença/prazer/intimidade podem ser reutilizados; prazer/intimidade ≠ espiritualidade.
 * - Privacidade:
 *   valores/conexão geral = participant_shared;
 *   espiritualidade pessoal = participant_private por default;
 *   narrativa expandida/incomum = participant_private;
 *   interpretação espiritual = participant_private;
 *   referência religiosa nunca compartilhada automaticamente. Anti-laundering estrito.
 */

import type { CerExperienceRecord, CerExperienceMomentRecord, CerPromptRecord } from '@/types/cer'

// IDs Canônicos de Dimensão e Experiência
export const SENTIDO_CONEXAO_DIMENSION_ID = 'ysf4jje7q97f309'
export const SENTIDO_CONEXAO_EXPERIENCE_ID = 'exp-sentido-conexao-07f'

// Concept Keys Canônicas Fechadas do 07F
export const BUILD_07F_CONCEPT_KEYS = [
  'life_connection_source',
  'personally_meaningful_value',
  'value_life_distance',
  'self_connection_context',
  'self_disconnection_context',
  'connection_to_something_larger',
  'spirituality_personal_meaning',
  'reported_expanded_awareness_experience',
  'reported_unusual_perceptual_experience',
  'reported_extrasensory_experience',
  'expanded_experience_impact',
  'expanded_experience_integration',
  'spiritual_experience_personal_interpretation',
  'meaning_direction',
  'existential_resource',
] as const

export type Build07FConceptKey =
  (typeof BUILD_07F_CONCEPT_KEYS)[keyof typeof BUILD_07F_CONCEPT_KEYS]

// Concept Keys e Rótulos ESTRITAMENTE PROIBIDOS no schema, opções participant-facing e Signals
export const FORBIDDEN_07F_CONCEPTS_OR_LABELS = [
  'spiritual_level',
  'awakening_stage',
  'high_vibration',
  'low_vibration',
  'kundalini_activated',
  'psychic_ability_confirmed',
  'divine_contact_confirmed',
  'spiritual_deficit',
  'enlightenment',
  'dissociation_confirmed',
  'psychosis_confirmed',
  'nivel_espiritual',
  'estagio_espiritual',
  'grau_de_conexao',
  'vibra_alto',
  'baixa_vibracao',
  'despertar_score',
  'evolucao_espiritual',
  'value_alignment_score',
  'alinhamento_de_valores',
  'perfil_espiritual',
  'perfil_de_sentido',
  'vazio_existencial_patologico',
  'incoerencia_moral',
  'crise_espiritual',
  'descompensacao_espiritual',
] as const

// Termos determinísticos declarados pela participante para elegibilidade de SC5 (semântica participant-led, sem IA)
export const SC5_DETERMINISTIC_ELIGIBILITY_TERMS = [
  'experiencia_ampliada',
  'percepcao_incomum',
  'mudanca_percepcao',
  'extrassensorial',
  'experiencia_extraordinaria',
  'sensacao_unidade',
  'percepcao_energetica_vivida',
  'momento_expansao',
] as const

/**
 * Função pura determinística para validar elegibilidade de SC5.
 * Regra P0: SC4=sim/talvez SOZINHO NÃO autoriza SC5.
 * A participante deve ter selecionado ou introduzido explicitamente termo de ampliação/mudança incomum de percepção.
 */
export function isSc5EligibleDeterministic(params: {
  sc4ResponseValue?: any
  sc4FreeText?: string
  explicitlyReportedExperience?: boolean
}): boolean {
  if (params.explicitlyReportedExperience) return true

  const sVal = params.sc4ResponseValue
  if (!sVal) return false

  // Se tiver flag explícita declarada no structured_value
  if (sVal.participant_reported_expanded_experience === true) {
    return true
  }

  // Se selecionou categoria explícita de experiência ampliada em SC4 (nunca apenas sim/talvez genérico)
  const choices: string[] = Array.isArray(sVal)
    ? sVal
    : Array.isArray(sVal?.selected_forms)
      ? sVal.selected_forms
      : Array.isArray(sVal?.value)
        ? sVal.value
        : typeof sVal === 'string'
          ? [sVal]
          : sVal?.choice
            ? [sVal.choice]
            : []

  const hasExplicitCategory = choices.some((c) =>
    (SC5_DETERMINISTIC_ELIGIBILITY_TERMS as readonly string[]).includes(c),
  )
  if (hasExplicitCategory) return true

  // Verificação em texto livre do relato do participante se houver menção declarada explícita
  const freeText = (params.sc4FreeText || sVal.free_text || sVal.narrative || '').toLowerCase()
  if (freeText) {
    const textIndicators = [
      'percepção se ampliou',
      'percepcao se ampliou',
      'mudança importante de percepção',
      'mudanca importante de percepcao',
      'experiência incomum',
      'experiencia incomum',
      'experiência extraordinária',
      'experiencia extraordinaria',
      'sensação de unidade',
      'sensacao de unidade',
      'percepção extrassensorial',
      'percepcao extrassensorial',
      'saída do corpo',
      'saida do corpo',
      'experiência mística',
      'experiencia mistica',
    ]
    if (textIndicators.some((ind) => freeText.includes(ind))) {
      return true
    }
  }

  return false
}

// ==========================================
// EXPERIÊNCIA CANÔNICA DE SENTIDO & CONEXÃO
// ==========================================

export const SENTIDO_CONEXAO_EXPERIENCE: CerExperienceRecord = {
  id: SENTIDO_CONEXAO_EXPERIENCE_ID,
  dimension_id: SENTIDO_CONEXAO_DIMENSION_ID,
  code: 'sentido_conexao_cer',
  title: 'Sentido & Conexão',
  subtitle:
    'O que te conecta à vida, o que realmente importa para você e como você vive aquilo que parece maior do que você.',
  order_index: 7,
  is_pilot: false,
  opening_text:
    'Um momento para olhar para aquilo que sustenta seu sentido de viver, seus valores mais profundos e as formas particulares de conexão que fazem parte da sua história — com total respeito à sua liberdade e às suas escolhas.',
  closing_text:
    'Suas percepções sobre conexão, valores e aquilo que tem sentido para você foram acolhidas com cuidado e respeito. Este registro não avalia sua consciência nem rotula sua experiência: ele apenas reflete aquilo que você mesma reconhece.',
  version: 1,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
}

// ==========================================
// MOMENTOS DE SENTIDO & CONEXÃO (SC1..SC4 + SC5 branch)
// ==========================================

export const SENTIDO_CONEXAO_MOMENTS: CerExperienceMomentRecord[] = [
  {
    id: 'mom-sc-1',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_key: 'o_que_me_conecta_a_vida',
    title: 'SC1 — O que me conecta à vida',
    subtitle: 'Fontes espontâneas de vitalidade, presença e vínculo com a existência.',
    order_index: 1,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-sc-2',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_key: 'o_que_realmente_importa',
    title: 'SC2 — O que realmente importa',
    subtitle: 'Valores sentidos e espaço de vida — sem cobranças, metas ou julgamento.',
    order_index: 2,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-sc-3',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_key: 'mais_perto_mais_longe_de_mim',
    title: 'SC3 — Mais perto de mim / Mais longe de mim',
    subtitle: 'Duas faces do contato consigo mesma no fluxo dos dias.',
    order_index: 3,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-sc-4',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_key: 'algo_maior_do_que_eu',
    title: 'SC4 — Algo maior do que eu',
    subtitle: 'Formas particulares de viver a transcendência, o mistério ou a conexão ampla.',
    order_index: 4,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-sc-5',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_key: 'percepcao_ampliada_da_realidade',
    title: 'SC5 — Experiência ampliada ou incomum da realidade',
    subtitle: 'Branch adaptativo participant-led para aprofundar relatos de percepção incomum.',
    order_index: 5,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// ==========================================
// PROMPTS CANÔNICOS DE SENTIDO & CONEXÃO (SC1..SC5)
// ==========================================

export const BUILD_07F_SENTIDO_PROMPTS: CerPromptRecord[] = [
  // ----------------------------------------------------
  // SC1 — O QUE ME CONECTA À VIDA
  // Open-first: resposta espontânea primeiro; ajuda opcional com poucas sugestões.
  // Prazer ≠ conexão, mas podem coexistir. Não vira propósito automático.
  // ----------------------------------------------------
  {
    id: 'p-07f-sc1-conecta-vida',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'O que te conecta à vida',
    step_subtitle:
      'Uma investigação espontânea sobre suas fontes cotidianas de vitalidade e presença.',
    component_type: 'FreeReflection',
    prompt_text: 'O que costuma fazer você se sentir mais conectada à vida?',
    helper_text:
      'Pense no que desperta sensação de vitalidade, presença ou calor no peito. Conte livremente ou veja algumas ideias se desejar.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'o_que_me_conecta_a_vida_sc1',
      concept_key: 'life_connection_source',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Ver algumas fontes que costumam aparecer',
        option_set_ref: 'opt_fontes_conexao_vida',
      },
      option_set: {
        id: 'opt_fontes_conexao_vida',
        items: [
          { id: 'pessoas', label: 'Estar com pessoas queridas e momentos de partilha' },
          { id: 'natureza', label: 'Contato com a natureza, ar livre e terra' },
          { id: 'criacao_arte', label: 'Criar, expressar, arte ou música' },
          { id: 'trabalho_significativo', label: 'Trabalho com propósito e realização' },
          { id: 'cuidado', label: 'Cuidar de alguém, de plantas ou de animais' },
          { id: 'movimento', label: 'Movimento do corpo e atividade física' },
          { id: 'silencio', label: 'Silêncio, pausa e momentos de solitude' },
          { id: 'espiritualidade', label: 'Práticas de fé, meditação ou oração' },
          { id: 'aprendizado', label: 'Aprender algo novo e expandir horizontes' },
          { id: 'contribuicao', label: 'Contribuir e fazer a diferença no mundo' },
          { id: 'comunidade', label: 'Sentir-se parte de um grupo ou comunidade' },
          { id: 'outro', label: 'Outro jeito particular meu' },
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
  // SC2 — O QUE REALMENTE IMPORTA
  // 1. Open-first: valores sentidos. Taxonomia ampla nos bastidores, poucas na superfície.
  //    Regra estrutural: VALOR ≠ META ≠ OBJETIVO ≠ OBRIGAÇÃO. Zero score, zero culpa.
  // 2. Segunda face: espaço na vida (sim / um pouco / não especialmente / ainda estou descobrindo).
  // ----------------------------------------------------
  {
    id: 'p-07f-sc2-valores-importam',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-2',
    step_order: 2,
    prompt_order: 1,
    step_title: 'O que realmente importa',
    step_subtitle: 'Direções de significado que você sente que dão rumo à sua existência.',
    component_type: 'FreeReflection',
    prompt_text:
      'Quando você pensa na vida que gostaria de estar vivendo, o que sente que realmente importa?',
    helper_text:
      'Isso não é uma lista de metas nem obrigações. Apenas aquilo que tem valor genuíno para você. Conte do seu jeito.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'valores_que_importam_sc2',
      concept_key: 'personally_meaningful_value',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Ver algumas direções de valor frequentes',
        option_set_ref: 'opt_valores_vida',
      },
      option_set: {
        id: 'opt_valores_vida',
        items: [
          { id: 'cuidado', label: 'Cuidado e afeto mútuo' },
          { id: 'liberdade', label: 'Liberdade e autonomia de escolhas' },
          { id: 'presenca', label: 'Presença, desacelerar e viver o agora' },
          { id: 'familia', label: 'Família e laços afetivos profundos' },
          { id: 'verdade', label: 'Verdade, coerência e autenticidade' },
          { id: 'criatividade', label: 'Criatividade e expressão autoral' },
          { id: 'contribuicao', label: 'Contribuição social e impacto positivo' },
          { id: 'espiritualidade', label: 'Conexão espiritual e busca de sentido' },
          { id: 'simplicidade', label: 'Simplicidade e paz no dia a dia' },
          { id: 'aprendizado', label: 'Aprendizado e crescimento pessoal' },
          { id: 'pertencimento', label: 'Pertencimento e acolhimento' },
          { id: 'outro', label: 'Outro valor essencial' },
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
    id: 'p-07f-sc2-espaco-na-vida',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-2',
    step_order: 3,
    prompt_order: 2,
    step_title: 'Espaço para o que importa',
    step_subtitle: 'Reconhecendo se a rotina atual dá lugar para aquilo que tem valor.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Tem alguma coisa importante para você que parece estar ficando com pouco espaço na sua vida?',
    helper_text:
      'Sem cobrança ou autoculpa — apenas para reconhecer como o tempo e a rotina estão distribuídos.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'espaco_para_o_que_importa_sc2',
      concept_key: 'value_life_distance',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'sim_pouco_espaco',
          title: 'Sim, sinto que algo importante está ficando de lado',
          description: 'A rotina ou as demandas têm ocupado quase todo o espaço disponível.',
        },
        {
          id: 'um_pouco',
          title: 'Um pouco — em algumas fases sinto esse aperto',
          description: 'Consigo manter em parte, mas gostaria de mais respiro para isso.',
        },
        {
          id: 'nao_especialmente',
          title: 'Não especialmente — sinto que o essencial tem seu lugar',
          description: 'No geral, o que mais importa está contemplado no meu dia a dia.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Ainda estou descobrindo o que realmente precisa de mais espaço',
          description: 'Estou em um momento de rever prioridades e reorganizar a vida.',
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
  // SC3 — MAIS PERTO DE MIM / MAIS LONGE DE MIM
  // Dual-state: duas faces de uma mesma microexperiência.
  // Face A: Em quais momentos você sente que está mais perto de si?
  // Face B: E quando percebe que está se afastando de si?
  // Não definir ontologicamente "verdadeiro eu".
  // Desconexão NÃO vira automaticamente patologia/crise espiritual/trauma/burnout.
  // ----------------------------------------------------
  {
    id: 'p-07f-sc3-perto-de-mim',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-3',
    step_order: 4,
    prompt_order: 1,
    step_title: 'Mais perto de mim',
    step_subtitle: 'Quando você se sente em contato com seu próprio eixo e essência.',
    component_type: 'ChoiceCards',
    prompt_text: 'Em quais momentos você sente que está mais perto de si?',
    helper_text: 'Momentos em que você se reconhece com facilidade e sente presença.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'mais_perto_de_mim_sc3',
      concept_key: 'self_connection_context',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'momentos_quietude_solitude',
          title: 'Quando tenho silêncio, quietude ou solitude',
          description: 'Pausas sem demandas onde posso me escutar.',
        },
        {
          id: 'contato_natureza_movimento',
          title: 'Em contato com a natureza ou movimentando o corpo',
          description: 'A sensação física me traz direto para o presente.',
        },
        {
          id: 'conexoes_autenticas',
          title: 'Em conversas verdadeiras e vínculos acolhedores',
          description: 'Onde posso ser exatamente quem sou sem máscaras.',
        },
        {
          id: 'criando_ou_realizando',
          title: 'Quando estou criando, expressando ou no fluxo de um projeto',
          description: 'Imersão no que tem significado para mim.',
        },
        {
          id: 'cuidando_do_meu_ritmo',
          title: 'Quando respeito meus limites e meu próprio tempo',
          description: 'Sem correr atrás de expectativas externas.',
        },
        {
          id: 'diferente_comigo',
          title: 'É diferente comigo / Tenho outro jeito de sentir',
          description: 'Uma experiência particular de me aproximar de mim.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Ainda estou aprendendo a perceber',
          description: 'Não tenho uma percepção clara disso ainda.',
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
    id: 'p-07f-sc3-longe-de-mim',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-3',
    step_order: 5,
    prompt_order: 2,
    step_title: 'Mais longe de mim',
    step_subtitle: 'Quando a rotina, o cansaço ou as demandas te distanciam de você.',
    component_type: 'ChoiceCards',
    prompt_text: 'E quando percebe que está se afastando de si?',
    helper_text:
      'Sem julgamento nem patologização: apenas um retrato de quando o piloto automático assume.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'mais_longe_de_mim_sc3',
      concept_key: 'self_disconnection_context',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'sobrecarga_piloto_automatico',
          title: 'Na pressa contínua e no piloto automático',
          description: 'Fazendo tudo rápido sem tempo para registrar o que estou sentindo.',
        },
        {
          id: 'tentando_agradar_ceder',
          title: 'Quando cedo demais para agradar ou evitar conflito',
          description: 'Focando na expectativa dos outros e esquecendo a minha.',
        },
        {
          id: 'excesso_telas_dispersao',
          title: 'Com excesso de estímulos, telas e dispersão mental',
          description: 'A mente fica cheia de ruído e distante do corpo.',
        },
        {
          id: 'cansaco_extremo_sem_pausa',
          title: 'No cansaço acumulado sem espaço para descanso real',
          description: 'A exaustão faz a sensibilidade pessoal ficar amortecida.',
        },
        {
          id: 'ambiente_hostil_pressao',
          title: 'Em ambientes frios, competitivos ou com muita cobrança',
          description: 'Onde sinto que preciso me defender o tempo todo.',
        },
        {
          id: 'diferente_comigo',
          title: 'É diferente comigo / Tenho outro jeito de viver',
          description: 'Outras circunstâncias me afastam de mim.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Difícil identificar quando isso acontece',
          description: 'Ainda não distingo com clareza essa virada.',
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
  // SC4 — ALGO MAIOR DO QUE EU
  // 1. Pergunta aberta inicial: "Existe alguma forma de conexão com algo maior do que você que faça sentido na sua experiência?"
  //    Opções: sim / talvez, difícil colocar em palavras / não / não sei / isso não é importante para mim / prefiro não responder.
  //    Se NÃO / NÃO É IMPORTANTE: segue sem insistência, resposta plena, zero déficit.
  // 2. Se SIM / TALVEZ: narrativa PRIMEIRO (open-first); apoios opcionais somente após.
  //    Privacidade por default: participant_private.
  // ----------------------------------------------------
  {
    id: 'p-07f-sc4-conexao-algo-maior',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-4',
    step_order: 6,
    prompt_order: 1,
    step_title: 'Conexão com algo maior',
    step_subtitle: 'Transcendência, mistério, espiritualidade ou senso amplo de pertencimento.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Existe alguma forma de conexão com algo maior do que você que faça sentido na sua experiência?',
    helper_text:
      'Todas as respostas são igualmente legítimas. Aqui não há teste nem expectativa de crença.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'conexao_algo_maior_sc4',
      concept_key: 'connection_to_something_larger',
      temporality: 'current',
      access_destination: 'participant_private',
      options: [
        {
          id: 'sim_existe_conexao',
          title: 'Sim, sinto essa conexão de alguma forma',
          description: 'Há uma dimensão de sentido ou transcendência que faz parte da minha vida.',
        },
        {
          id: 'talvez_dificil_colocar_em_palavras',
          title: 'Talvez / É difícil colocar em palavras',
          description: 'Tenho sensações ou intuições que não cabem em fórmulas fechadas.',
        },
        {
          id: 'nao_sinto_essa_conexao',
          title: 'Não sinto essa conexão',
          description: 'Minha experiência de vida se dá no plano humano, concreto e relacional.',
        },
        {
          id: 'nao_sei_dizer',
          title: 'Não sei / Não tenho clareza sobre isso',
          description: 'É uma pergunta que permanece aberta para mim.',
        },
        {
          id: 'isso_nao_e_importante_para_mim',
          title: 'Isso não é importante para mim',
          description: 'Não é um tema ou dimensão que ocupe relevância no meu dia a dia.',
        },
        {
          id: 'prefiro_nao_responder',
          title: 'Prefiro não responder',
          description: 'Uma escolha legítima de manter essa reflexão reservada.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_sc4_descrever_conexao',
            when: {
              any_of: [
                { field: 'choice', operator: 'equals', value: 'sim_existe_conexao' },
                {
                  field: 'choice',
                  operator: 'equals',
                  value: 'talvez_dificil_colocar_em_palavras',
                },
              ],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'como_vive_essa_conexao_sc4_desc',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07f-sc4-descrever-conexao',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-4',
    step_order: 7,
    prompt_order: 2,
    step_title: 'Como você vive essa conexão',
    step_subtitle: 'Descreva em suas próprias palavras antes de qualquer lista de termos.',
    component_type: 'FreeReflection',
    prompt_text: 'Como essa conexão costuma aparecer ou se manifestar na sua vida?',
    helper_text:
      'Privacidade pré-expressão: este relato é guardado como estritamente confidencial (só para você). Descreva com calma.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'como_vive_essa_conexao_sc4_desc',
      concept_key: 'spirituality_personal_meaning',
      temporality: 'recurring',
      access_destination: 'participant_private',
      open_first: {
        enabled: true,
        help_label: 'Quer algumas ideias para ajudar a colocar em palavras?',
        option_set_ref: 'opt_formas_conexao_maior',
      },
      option_set: {
        id: 'opt_formas_conexao_maior',
        items: [
          { id: 'deus_divino', label: 'Deus, divino ou sagrado' },
          { id: 'natureza', label: 'Natureza, cosmos e forças da terra' },
          { id: 'universo', label: 'Universo e ordem cósmica' },
          { id: 'consciencia', label: 'Consciência ampla ou presença' },
          { id: 'vida_humanidade', label: 'A própria vida e a teia da humanidade' },
          { id: 'ancestralidade', label: 'Ancestralidade e linhagem' },
          { id: 'comunidade', label: 'Comunidade e amor ao próximo' },
          { id: 'misterio', label: 'O mistério de existir' },
          { id: 'energia', label: 'Sensação energética geral' },
          { id: 'algo_sem_nome', label: 'Algo profundo sem nome específico' },
          {
            id: 'experiencia_ampliada',
            label: 'Momentos em que a percepção parece se ampliar de forma incomum',
          },
          { id: 'outra', label: 'Outra forma particular' },
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
  // SC5 — PERCEPÇÃO AMPLIADA OU INCOMUM DA REALIDADE (ERRATA P0)
  // Branch PARTICIPANT-LED.
  // Pergunta do branch: "Você já viveu algum momento em que sua percepção de si, da vida ou da realidade pareceu se ampliar ou mudar de um jeito importante?"
  // Termos técnicos evitados na face participante.
  // Preservação de dados distintos:
  // 1. Descrição fenomenológica (EXPERIENCE_DESCRIPTION)
  // 2. Interpretação da participante (INTERPRETATION_BY_PARTICIPANT)
  // 3. Impacto posterior (IMPACT)
  // 4. Integração no cotidiano (INTEGRATION)
  // ----------------------------------------------------
  {
    id: 'p-07f-sc5-pergunta-abertura-branch',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-5',
    step_order: 8,
    prompt_order: 1,
    step_title: 'Experiência de ampliação ou mudança de percepção',
    step_subtitle: 'Branch participant-led: momentos em que a percepção habitual se transformou.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Você já viveu algum momento em que sua percepção de si, da vida ou da realidade pareceu se ampliar ou mudar de um jeito importante?',
    helper_text:
      'Um espaço respeitoso e neutro para acolher o seu relato — sem confirmação ontológica nem patologização.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'sc5_abertura_experiencia_ampliada',
      concept_key: 'reported_expanded_awareness_experience',
      temporality: 'longitudinal',
      access_destination: 'participant_private',
      options: [
        {
          id: 'sim_vivi_experiencia',
          title: 'Sim, já vivi um ou mais momentos assim',
          description: 'Experiências marcantes em que a percepção habitual se transformou.',
        },
        {
          id: 'nao_lembro_ou_nao_vivi',
          title: 'Não me lembro de ter vivido algo parecido / Não',
          description: 'Minha experiência se mantém no registro habitual.',
        },
        {
          id: 'talvez_dificil_definir',
          title: 'Talvez, mas não tenho certeza se foi isso',
          description: 'Uma sensação sutil que não sei se cabe aqui.',
        },
        {
          id: 'prefiro_nao_falar_sobre_isso',
          title: 'Prefiro não falar sobre isso',
          description: 'Escolha de manter esse relato reservado.',
        },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
        routes: [
          {
            id: 'r_sc5_narrativa_profunda',
            when: {
              any_of: [
                { field: 'choice', operator: 'equals', value: 'sim_vivi_experiencia' },
                { field: 'choice', operator: 'equals', value: 'talvez_dificil_definir' },
              ],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'sc5_descricao_fenomenologica',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07f-sc5-descricao-fenomenologica',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-5',
    step_order: 9,
    prompt_order: 2,
    step_title: 'Como foi essa experiência',
    step_subtitle: 'EXPERIENCE_DESCRIPTION: relato livre e descritivo do que você percebeu.',
    component_type: 'FreeReflection',
    prompt_text: 'Como você descreveria o que aconteceu ou o que você sentiu nesse momento?',
    helper_text:
      'Privacidade total (só para você). Descreva espontaneamente o que seus sentidos e sua consciência captaram.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'sc5_descricao_fenomenologica',
      concept_key: 'reported_expanded_awareness_experience',
      temporality: 'longitudinal',
      access_destination: 'participant_private',
      open_first: {
        enabled: true,
        help_label: 'Quer algumas ideias para ajudar a nomear?',
        option_set_ref: 'opt_nomeacao_experiencia_incomum',
      },
      option_set: {
        id: 'opt_nomeacao_experiencia_incomum',
        items: [
          {
            id: 'sensacao_profunda_unidade',
            label: 'Sensação profunda de unidade com tudo ao redor',
          },
          {
            id: 'percepcao_presenca',
            label: 'Sensação viva de uma presença, luz ou contato sutil',
          },
          {
            id: 'dilatacao_tempo_espaco',
            label: 'Sensação de que o tempo ou o espaço mudaram de escala',
          },
          { id: 'clareza_subita', label: 'Clareza súbita ou intuição imediata sobre a vida' },
          { id: 'percepcao_energetica', label: 'Sensação física de energia pelo corpo' },
          {
            id: 'contato_ancestral_espiritual',
            label: 'Percepção de vínculo com ancestrais ou guias',
          },
          { id: 'outra_percepcao_incomum', label: 'Outro tipo de percepção particular' },
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
  {
    id: 'p-07f-sc5-impacto-experiencia',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-5',
    step_order: 10,
    prompt_order: 3,
    step_title: 'Como essa experiência ficou em você',
    step_subtitle: 'IMPACT: o rastro afetivo, somático e emocional deixado pela vivência.',
    component_type: 'ChoiceCards',
    prompt_text: 'Como essa experiência ficou em você depois que ela passou?',
    helper_text:
      'Reconhecendo o impacto: serenidade, confusão, expansão ou necessidade de acolhimento.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'sc5_impacto_experiencia',
      concept_key: 'expanded_experience_impact',
      temporality: 'longitudinal',
      access_destination: 'participant_private',
      options: [
        {
          id: 'paz_clareza_duradoura',
          title: 'Trouxe paz profunda, serenidade ou clareza duradoura',
          description: 'Ficou como um ponto de luz e referência na minha vida.',
        },
        {
          id: 'marcou_mas_vida_seguiu',
          title: 'Foi marcante, mas logo retomei minha rotina habitual',
          description: 'Uma lembrança bonita que faz parte da minha história.',
        },
        {
          id: 'confusao_ou_dificuldade',
          title: 'Gerou certa confusão, estranhamento ou inquietação',
          description: 'Foi tão intensa que demorei para entender ou me situar.',
        },
        {
          id: 'ainda_estou_processando',
          title: 'Ainda estou processando o que aquilo representou',
          description: 'É algo que continua vivo e ressoando em mim.',
        },
        {
          id: 'outro_impacto',
          title: 'Outro impacto particular',
          description: 'Uma reação própria minha.',
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
    id: 'p-07f-sc5-significado-e-integracao',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-5',
    step_order: 11,
    prompt_order: 4,
    step_title: 'O que essa experiência significa hoje',
    step_subtitle: 'INTERPRETATION & INTEGRATION: o sentido pessoal e como ela vive no cotidiano.',
    component_type: 'ChoiceCards',
    prompt_text:
      'O que essa experiência significa para você hoje e como ela conversa com sua vida comum?',
    helper_text: 'Sua interpretação é soberana. O significado pertence inteiramente a você.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'sc5_significado_e_integracao',
      concept_key: 'expanded_experience_integration',
      temporality: 'current',
      access_destination: 'participant_private',
      options: [
        {
          id: 'significado_espiritual_sagrado',
          title: 'Para mim teve um sentido espiritual ou sagrado importante',
          description: 'Fortaleceu minha confiança na vida ou em algo maior.',
        },
        {
          id: 'abertura_da_mente_compreensao',
          title: 'Uma abertura da percepção e da sensibilidade humana',
          description: 'Mostrou facetas da consciência que antes eu desconhecia.',
        },
        {
          id: 'lembranca_curiosa_sem_dogma',
          title: 'Uma vivência curiosa e bonita, sem necessidade de explicação fechada',
          description: 'Acolho o mistério sem apego a uma crença rígida.',
        },
        {
          id: 'busco_integrar_ao_cotidiano',
          title: 'Busco compreender como viver isso no dia a dia concreto',
          description: 'O valor da vivência está em como ela me ajuda a caminhar.',
        },
        {
          id: 'ainda_sem_resposta_definitiva',
          title: 'Ainda não tenho uma resposta definitiva sobre o que significou',
          description: 'Permanece como uma pergunta aberta e respeitada.',
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
  // FECHAMENTO PARTICIPANT-FACING (RECOGNITION COMPÓSITO)
  // Zero escore de evolução, zero nível espiritual, zero perfil de despertar.
  // Espelho acolhedor e simples:
  // "Algumas coisas parecem conectar você à vida."
  // "Alguns valores parecem pedir mais espaço."
  // "Você descreveu uma forma particular de se conectar com algo maior."
  // "Há experiências que ainda está tentando compreender."
  // + "Isso se parece com você?"
  // ----------------------------------------------------
  {
    id: 'p-07f-espelho-fechamento',
    experience_id: SENTIDO_CONEXAO_EXPERIENCE_ID,
    moment_id: 'mom-sc-4',
    step_order: 12,
    prompt_order: 3,
    step_title: 'O espelho do que tem sentido para você',
    step_subtitle: 'Um reconhecimento gentil das suas fontes de conexão e valores.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Olhando para este panorama sobre suas conexões, valores e aquilo que tem sentido para você: isso se parece com você?',
    helper_text:
      'Aqui não há perfil nem diagnóstico. Apenas um reconhecimento gentil de como você se percebe.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'espelho_sentido_conexao_recognition',
      concept_key: 'meaning_direction',
      temporality: 'current',
      access_destination: 'participant_shared',
      composite_mirror: {
        enabled: true,
        steps: [
          { label: 'O que te conecta à vida', prompt_ref: 'o_que_me_conecta_a_vida_sc1' },
          { label: 'O que realmente importa', prompt_ref: 'valores_que_importam_sc2' },
          { label: 'Espaço na sua rotina', prompt_ref: 'espaco_para_o_que_importa_sc2' },
          { label: 'Mais perto de si', prompt_ref: 'mais_perto_de_mim_sc3' },
          { label: 'Mais longe de si', prompt_ref: 'mais_longe_de_mim_sc3' },
          { label: 'Conexão com algo maior', prompt_ref: 'conexao_algo_maior_sc4' },
        ],
      },
      options: [
        {
          id: 'faz_muito_sentido',
          title: 'Faz muito sentido para o que vivo hoje',
          description: 'Reconheço esse retrato como fiel ao meu momento.',
        },
        {
          id: 'faz_sentido_em_partes',
          title: 'Faz sentido em partes; algumas coisas estão em transformação',
          description: 'Algumas percepções ressoam, outras estão mudando com o tempo.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Ainda estou descobrindo como meu sentido de vida se move',
          description: 'Olhar para isso abriu espaço para novas reflexões pessoais.',
        },
        {
          id: 'e_diferente_comigo',
          title: 'É diferente comigo / Tenho outro jeito de viver o sentido',
          description: 'Minha forma de me conectar à vida tem outras nuances.',
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

// Lista canônica de prompts essenciais do Build 07F (caminho essencial enxuto = 4-6 interações percebidas, 5-8 min)
export const SENTIDO_ESSENTIAL_PATH_PROMPT_KEYS = [
  'o_que_me_conecta_a_vida_sc1',
  'valores_que_importam_sc2',
  'espaco_para_o_que_importa_sc2',
  'mais_perto_de_mim_sc3',
  'mais_longe_de_mim_sc3',
  'conexao_algo_maior_sc4',
  'espelho_sentido_conexao_recognition',
]
