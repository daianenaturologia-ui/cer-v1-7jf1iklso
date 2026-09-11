/**
 * Build 07E — Especificação Normativa e Definições de Schema dos Prompts e Momentos
 * Dimensão: Sexualidade (Dimension ID: 6p0ltjzfs7ewv6o, Experience ID: exp-sexualidade-07e)
 *
 * Princípios Normativos Constitucionais:
 * - A participante deve terminar sentindo "Estou percebendo como minha sexualidade aparece na minha vida."
 * - NÃO: teste de sexualidade, teste de libido, avaliação de normalidade, screening diagnóstico, questionário invasivo,
 *   obrigação de contar detalhes íntimos.
 * - Preservar: leveza, privacidade, escolha, não normatividade, right to skip, open-first, Registro Único,
 *   Evidence Currency, derived privacy, zero score, zero diagnóstico.
 * - 4 Microexperiências exatamente (S1, S2, S3, S4) — não 5:
 *   S1: Meu corpo nessa parte da vida
 *   S2: Quando o desejo aparece
 *   S3: Eu na intimidade
 *   S4: Minha voz e meus limites
 * - S2: Preservar estruturalmente: DESEJO ≠ RESPOSTA CORPORAL ≠ DISPONIBILIDADE. NUNCA colapsar em libido, função sexual ou score.
 * - S3: Intimidade NÃO é sinônimo de sexo. Registro Único 07D→07E: se já tem proximidade/confiança/limites em 07D, NÃO recoletar.
 * - S4: Autonomia = possibilidade de escolha percebida; não criar score de assertividade.
 * - Privacidade mais conservadora do projeto: participant_private por default para experiências íntimas e narrativas livres.
 *   Anti-laundering estrito.
 * - Terceiros: relato sobre terceiro = percepção sobre relação/contexto; nunca fato clínico nem diagnóstico do outro.
 * - Temporalidade: enum existente (longitudinal, recurring, current, context_dependent).
 */

import type { CerExperienceRecord, CerExperienceMomentRecord, CerPromptRecord } from '@/types/cer'

// IDs Canônicos de Dimensão e Experiência
export const SEXUALIDADE_DIMENSION_ID = '6p0ltjzfs7ewv6o'
export const SEXUALIDADE_EXPERIENCE_ID = 'exp-sexualidade-07e'

// Concept Keys Canônicas Fechadas do 07E
export const BUILD_07E_CONCEPT_KEYS = [
  'body_comfort_in_sexuality',
  'body_sensation_awareness',
  'body_sexuality_recent_change',
  'desire_pattern_experience',
  'body_response_pattern',
  'availability_experience',
  'pleasure_landscape',
  'intimacy_quality_in_closeness',
  'intimacy_relational_to_sexual_context',
  'boundary_communication_pattern',
  'boundary_expression_tendency',
  'choice_autonomy_experience',
  'health_interference_context',
  'sexuality_reflection_mirror',
] as const

export type Build07EConceptKey =
  (typeof BUILD_07E_CONCEPT_KEYS)[keyof typeof BUILD_07E_CONCEPT_KEYS]

// Concept Keys e Rótulos ESTRITAMENTE PROIBIDOS no schema e opções participant-facing
export const FORBIDDEN_07E_CONCEPTS_OR_LABELS = [
  'baixa_libido',
  'libido_baixa',
  'disfuncao_sexual',
  'disfuncao_eretil',
  'vaginismo',
  'vulvodinia',
  'dispareunia',
  'bloqueio_sexual',
  'frigidez',
  'anorgasmia',
  'hipersexualidade',
  'compulsao_sexual',
  'trauma_sexual',
  'assertividade_sexual_score',
  'funcao_sexual_score',
  'score_libido',
  'normal_sexual',
  'anormal_sexual',
  'baixa libido',
  'disfunção sexual',
  'bloqueio sexual',
  'normal',
  'anormal',
  'perfil sexual',
] as const

// ==========================================
// EXPERIÊNCIA CANÔNICA DE SEXUALIDADE
// ==========================================

export const SEXUALIDADE_EXPERIENCE: CerExperienceRecord = {
  id: SEXUALIDADE_EXPERIENCE_ID,
  dimension_id: SEXUALIDADE_DIMENSION_ID,
  code: 'sexualidade_cer',
  title: 'Sexualidade & Intimidade',
  subtitle: 'Como sua sexualidade, presença corporal, desejo e limites aparecem na sua vida hoje.',
  order_index: 6,
  is_pilot: false,
  opening_text:
    'Um espaço de escuta gentil e sem julgamentos sobre como sua sexualidade se manifesta na sua vida. Aqui não existe resposta certa, padrão ou expectativa de desempenho — cada pessoa e cada corpo têm o seu próprio jeito e ritmo.',
  closing_text:
    'Suas percepções sobre corpo, desejo, intimidade e limites foram acolhidas com cuidado e privacidade rigorosa. Este registro respeita seu espaço e permanece sob sua inteira escolha.',
  version: 1,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
}

// ==========================================
// MOMENTOS DE SEXUALIDADE (S1..S4 — exatamente 4)
// ==========================================

export const SEXUALIDADE_MOMENTS: CerExperienceMomentRecord[] = [
  {
    id: 'mom-sex-1',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_key: 'meu_corpo_nessa_parte_da_vida',
    title: 'S1 — Meu corpo nessa parte da vida',
    subtitle: 'Conforto percebido no próprio corpo, presença e sensações somáticas.',
    order_index: 1,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-sex-2',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_key: 'quando_o_desejo_aparece',
    title: 'S2 — Quando o desejo aparece',
    subtitle: 'O que aparece, o que o corpo faz e a disponibilidade — três dimensões distintas.',
    order_index: 2,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-sex-3',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_key: 'eu_na_intimidade',
    title: 'S3 — Eu na intimidade',
    subtitle: 'Proximidade, confiança, vulnerabilidade e como isso se conecta à intimidade.',
    order_index: 3,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-sex-4',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_key: 'minha_voz_e_meus_limites',
    title: 'S4 — Minha voz e meus limites',
    subtitle: 'Expressar escolhas, sinalizar pausas, dizer não e reconhecer seu espaço.',
    order_index: 4,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

// ==========================================
// PROMPTS CANÔNICOS DE SEXUALIDADE (S1..S4)
// ==========================================

export const BUILD_07E_SEXUALIDADE_PROMPTS: CerPromptRecord[] = [
  // ----------------------------------------------------
  // S1 — MEU CORPO NESSA PARTE DA VIDA
  // 1. Conforto somático experiencial (open-first)
  //    Microcopy obrigatória: "Aqui não existe resposta certa. Cada corpo funciona do seu jeito."
  // 2. Presença e percepção de sensações somáticas no próprio corpo
  // 3. Mudança recente na relação com o corpo (branch adaptativo se houver mudança)
  // ----------------------------------------------------
  {
    id: 'p-07e-s1-conforto-corpo',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'Seu corpo nessa parte da vida',
    step_subtitle: 'Uma investigação experiencial sobre como você habita seu corpo hoje.',
    component_type: 'FreeReflection',
    prompt_text:
      'Quando você pensa no seu corpo nesse campo da vida e da intimidade, como costuma ser a sensação de estar nele?',
    helper_text:
      'Aqui não existe resposta certa. Cada corpo funciona do seu jeito. Conte espontaneamente ou use os apoios.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'conforto_percebido_corpo',
      concept_key: 'body_comfort_in_sexuality',
      temporality: 'current',
      access_destination: 'participant_private',
      open_first: {
        enabled: true,
        help_label: 'Veja algumas sensações que costumam aparecer',
        option_set_ref: 'opt_conforto_corpo',
      },
      option_set: {
        id: 'opt_conforto_corpo',
        items: [
          {
            id: 'confortavel_habitado',
            label: 'Sinto-me geralmente confortável e presente no meu corpo',
          },
          {
            id: 'em_descoberta',
            label: 'Estou em um momento de redescobrir ou me reaproximar do meu corpo',
          },
          {
            id: 'com_cautela_ou_tensao',
            label: 'Às vezes sinto certa cautela, estranhamento ou tensão corporal',
          },
          {
            id: 'varia_pelo_momento',
            label: 'Varia muito conforme meu cansaço, ciclo ou fase de vida',
          },
          {
            id: 'distanciada',
            label: 'Costumo prestar pouca atenção ou me sinto mais distante do corpo',
          },
          { id: 'outra_percepcao', label: 'Outra percepção particular' },
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
    id: 'p-07e-s1-percepcao-sensacoes',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-1',
    step_order: 2,
    prompt_order: 2,
    step_title: 'Percepção de sensações corporais',
    step_subtitle: 'Presença e facilidade ou pausa na percepção somática.',
    component_type: 'ChoiceCards',
    prompt_text:
      'No seu dia a dia ou em momentos de contato, como é para você perceber sensações agradáveis no corpo?',
    helper_text: 'Sem nenhuma cobrança de intensidade — apenas como sua atenção costuma se mover.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'percepcao_sensacoes_corpo',
      concept_key: 'body_sensation_awareness',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'percebo_com_facilidade',
          title: 'Percebo com facilidade e consigo me conectar',
          description: 'A atenção às sensações corporais surge com relativa fluidez.',
        },
        {
          id: 'preciso_de_tempo',
          title: 'Preciso de calma e tempo para desacelerar e sentir',
          description: 'Quando a mente está acelerada, o corpo precisa de respiro prévio.',
        },
        {
          id: 'atencao_vai_para_a_mente',
          title: 'Minha atenção costuma ir com frequência para pensamentos ou preocupações',
          description: 'Fico mais na cabeça do que nas sensações físicas.',
        },
        {
          id: 'varia_bastante',
          title: 'Muda bastante dependendo do descanso e do contexto',
          description: 'Em dias leves sinto mais; com sobrecarga o corpo fica em segundo plano.',
        },
        {
          id: 'outra_experiencia_somatica',
          title: 'Outro jeito próprio de perceber',
          description: 'Uma experiência particular com as sensações.',
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
    id: 'p-07e-s1-mudanca-recente',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-1',
    step_order: 3,
    prompt_order: 3,
    step_title: 'Mudança recente na relação com o corpo',
    step_subtitle: 'Reconhecendo transições corporais, hormonais ou fases de vida.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Você tem sentido alguma mudança recente na forma como seu corpo responde ou se sente nessa parte da vida?',
    helper_text: 'Fases, ciclos, transições corporais, rotina ou momento atual.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'mudanca_recente_corpo',
      concept_key: 'body_sexuality_recent_change',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'sem_mudanca_recente',
          title: 'Está relativamente estável como sempre foi',
          description: 'Não percebo grandes alterações recentes.',
        },
        {
          id: 'mudanca_percebida_em_curso',
          title: 'Sim, percebo uma mudança recente no ritmo ou nas sensações',
          description: 'Mudanças ligadas a fase de vida, corpo, estresse ou novos momentos.',
        },
        {
          id: 'em_transicao_gradual',
          title: 'Uma transição gradual que venho acompanhando',
          description: 'Sensação de que o corpo está pedindo outros cuidados e outro ritmo.',
        },
        {
          id: 'depende_do_momento',
          title: 'Oscila conforme os períodos do mês ou da rotina',
          description: 'Mais ligado a flutuações contextuais do que a uma mudança fixa.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_s1_mudanca_saude_branch',
            when: {
              any_of: [
                { field: 'choice', operator: 'equals', value: 'mudanca_percebida_em_curso' },
                { field: 'choice', operator: 'equals', value: 'em_transicao_gradual' },
              ],
            },
            then: {
              action: 'open_branch',
              target_prompt_key: 'interferencia_saude_dor_branch',
            },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'p-07e-s1-saude-dor-branch',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-1',
    step_order: 4,
    prompt_order: 4,
    step_title: 'Condições de saúde ou desconforto físico',
    step_subtitle: 'Branch adaptativo somente quando há mudança ou relato relevante.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Alguma questão de saúde, uso de medicação, dor ou desconforto físico tem interferido nessa experiência?',
    helper_text:
      'Relato somático descritivo para apoiar sua equipe de cuidado — sem qualquer diagnóstico automático.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'interferencia_saude_dor_branch',
      concept_key: 'health_interference_context',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'sem_interferencia_fisica',
          title: 'Não sinto interferência física significativa',
          description: 'As mudanças parecem ser mais de ritmo, cansaço ou contexto.',
        },
        {
          id: 'desconforto_ou_dor_eventual',
          title: 'Às vezes sinto algum incômodo, dor ou desconforto físico',
          description: 'Desconforto que merece acolhimento e escuta cuidadosa.',
        },
        {
          id: 'medicacao_ou_fase_hormonal',
          title: 'Percebo impacto de medicação, ciclo ou fase hormonal',
          description: 'O corpo responde às alterações químicas ou fases biológicas.',
        },
        {
          id: 'cansaco_extremo_sono',
          title: 'Sobretudo sobrecarga física, cansaço acumulado ou sono',
          description: 'A energia geral do corpo tem sido o principal fator.',
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
  // S2 — QUANDO O DESEJO APARECE
  // Cena em camadas: "Num dia em que existe carinho ou desejo…"
  // Microcopy obrigatória: "Isso é sobre o que aparece, o que o corpo faz e o que você se sente disponível a viver — três coisas diferentes."
  // PRESERVAR ESTRUTURALMENTE: DESEJO ≠ RESPOSTA CORPORAL ≠ DISPONIBILIDADE
  // NUNCA colapsar em libido, função sexual ou score.
  // 5. Camada A: Desejo (desire_pattern_experience)
  // 6. Camada B: Resposta Corporal (body_response_pattern)
  // 7. Camada C: Disponibilidade (availability_experience)
  // 8. Prazer amplo e não performático (pleasure_landscape, open-first)
  // ----------------------------------------------------
  {
    id: 'p-07e-s2-camada-desejo',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-2',
    step_order: 5,
    prompt_order: 1,
    step_title: 'Quando o desejo aparece — Camada A: O que surge',
    step_subtitle:
      'Isso é sobre o que aparece, o que o corpo faz e o que você se sente disponível a viver — três coisas diferentes.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Num dia em que existe carinho, atração ou intimidade, como o desejo costuma aparecer para você?',
    helper_text:
      'Aqui olhamos apenas para o impulso ou vontade interna — sem julgamento de como ele deveria ser.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'desejo_camada_experiencia',
      concept_key: 'desire_pattern_experience',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'desejo_espontaneo',
          title: 'Costuma surgir espontaneamente do nada',
          description: 'Uma vontade que nasce de dentro sem precisar de estímulo prévio.',
        },
        {
          id: 'desejo_responsivo_contextual',
          title: 'Surge em resposta ao contexto, carinho, clima e sintonia',
          description: 'Aparece e esquenta depois que o contato ou o carinho já começaram.',
        },
        {
          id: 'desejo_variavel_conforme_vida',
          title: 'Varia profundamente conforme meu nível de descanso e momento de vida',
          description: 'Tem épocas em que está muito presente e épocas em que mal aparece.',
        },
        {
          id: 'desejo_raro_ou_espacado',
          title: 'Tem sido raro, sutil ou quase não aparece na minha rotina',
          description: 'Um impulso pouco frequente ou que ocupa pouco espaço hoje.',
        },
        {
          id: 'desejo_dificil_de_perceber',
          title: 'Às vezes é difícil para mim decifrar o que é desejo ou obrigação',
          description: 'Ainda estou compreendendo como meu desejo próprio se manifesta.',
        },
        {
          id: 'desejo_depende_do_vinculo',
          title: 'Depende inteiramente de quem está comigo e da conexão afetiva',
          description: 'Vinculado à segurança e à cumplicidade da relação.',
        },
        {
          id: 'desejo_outro_movimento',
          title: 'Outro movimento próprio',
          description: 'Um jeito pessoal que não se define por essas alternativas.',
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
    id: 'p-07e-s2-camada-corpo',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-2',
    step_order: 6,
    prompt_order: 2,
    step_title: 'Quando o desejo aparece — Camada B: O que o corpo faz',
    step_subtitle:
      'A resposta física do corpo é descritiva e não define consentimento nem desejo automático.',
    component_type: 'ChoiceCards',
    prompt_text: 'E o que o seu corpo costuma fazer ou sinalizar fisicamente nessas situações?',
    helper_text:
      'Resposta corporal é puramente física. O corpo pode relaxar ou tensionar independentemente da vontade da mente.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'resposta_corporal_camada',
      concept_key: 'body_response_pattern',
      temporality: 'recurring',
      access_destination: 'participant_private',
      options: [
        {
          id: 'corpo_responde_com_fluidez',
          title: 'O corpo costuma responder com facilidade, calor e relaxamento',
          description: 'A resposta física acompanha naturalmente os estímulos.',
        },
        {
          id: 'corpo_precisa_de_tempo_proprio',
          title: 'O corpo precisa de bastante tempo e delicadeza para responder',
          description: 'Tem um tempo próprio de aquecimento mais lento que a cabeça.',
        },
        {
          id: 'corpo_nem_sempre_acompanha',
          title: 'Às vezes quero estar ali, mas o corpo não acompanha com a mesma facilidade',
          description: 'Mente e corpo operam em compassos diferentes.',
        },
        {
          id: 'corpo_responde_mas_mente_distante',
          title: 'O corpo pode responder fisicamente mesmo quando por dentro estou dispersa',
          description: 'Resposta física descolada da presença mental ou emocional.',
        },
        {
          id: 'corpo_tende_a_tencionar',
          title: 'O corpo tende a ficar tenso, retraído ou em guarda',
          description: 'Sinais de cautela física ou contração espontânea.',
        },
        {
          id: 'resposta_corporal_depende_muito',
          title: 'Depende radicalmente do ambiente, descanso e intimidade',
          description: 'A resposta física varia fortemente com o contexto.',
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
    id: 'p-07e-s2-camada-disponibilidade',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-2',
    step_order: 7,
    prompt_order: 3,
    step_title: 'Quando o desejo aparece — Camada C: Sua disponibilidade real',
    step_subtitle:
      'Estar disponível física, emocional e contextualmente é diferente de ter desejo ou resposta física.',
    component_type: 'ChoiceCards',
    prompt_text: 'E quanto à sua disponibilidade para viver isso — como você costuma se sentir?',
    helper_text:
      'Indisponibilidade nunca é defeito ou bloqueio: muitas vezes é respeito aos limites do próprio momento.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'disponibilidade_camada_experiencia',
      concept_key: 'availability_experience',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'geralmente_disponivel',
          title: 'Costumo me sentir aberta e com espaço interno e de vida para isso',
          description: 'Há disponibilidade física, emocional e de tempo.',
        },
        {
          id: 'quero_mas_sem_espaco',
          title: 'Posso sentir desejo, mas na prática não tenho espaço, tempo ou energia',
          description: 'A vida cotidiana consome a energia que sustentaria o encontro.',
        },
        {
          id: 'emocionalmente_indisponivel',
          title: 'Emocionalmente não me sinto disponível no momento',
          description:
            'Necessidade de recolhimento, cuidado pessoal ou outras prioridades internas.',
        },
        {
          id: 'disponibilidade_muito_contextual',
          title: 'Minha disponibilidade depende inteiramente da segurança e do clima',
          description: 'Com condições ideais existe espaço; com pressão me fecho.',
        },
        {
          id: 'nao_estou_buscando_nem_disponivel',
          title: 'Neste momento não estou disponível e isso está em harmonia comigo',
          description: 'A ausência de busca vivida como escolha tranquila e legítima.',
        },
        {
          id: 'outra_forma_de_disponibilidade',
          title: 'Outro estado de disponibilidade',
          description: 'Uma percepção particular do meu momento.',
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
    id: 'p-07e-s2-prazer-amplo',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-2',
    step_order: 8,
    prompt_order: 4,
    step_title: 'O panorama do seu prazer',
    step_subtitle: 'Prazer amplo, não focado em metas ou desempenho.',
    component_type: 'FreeReflection',
    prompt_text:
      'O que costuma trazer sensação de prazer, conexão, carinho ou bem-estar para você?',
    helper_text:
      'Prazer pode ser carinho, presença, relaxamento, contato suave, excitação ou sossego. Escreva com suas palavras ou veja apoios.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'prazer_panorama_amplo',
      concept_key: 'pleasure_landscape',
      temporality: 'recurring',
      access_destination: 'participant_private',
      open_first: {
        enabled: true,
        help_label: 'Veja algumas expressões amplas de prazer',
        option_set_ref: 'opt_prazer_amplo',
      },
      option_set: {
        id: 'opt_prazer_amplo',
        items: [
          {
            id: 'presenca_e_tempo_sem_pressa',
            label: 'Estar presente com calma, sem roteiro nem pressa',
          },
          {
            id: 'carinho_pele_abracos',
            label: 'Carinho suave, toque na pele, abraço demorado e acolhimento',
          },
          {
            id: 'conexao_emocional_conversa',
            label: 'Sentir conexão emocional profunda e intimidade na conversa',
          },
          {
            id: 'relaxamento_e_despressurizacao',
            label: 'Sensação física de relaxar, soltar o corpo e desarmar tensões',
          },
          {
            id: 'excitacao_e_brincadeira',
            label: 'Excitação, curiosidade, novidade ou cumplicidade bem-humorada',
          },
          {
            id: 'meu_proprio_ritmo_sem_meta',
            label: 'Viver as sensações no meu ritmo, sem ter meta de chegar a lugar nenhum',
          },
          {
            id: 'prazer_em_momentos_comigo',
            label: 'Prazer e bem-estar em momentos comigo mesma no meu espaço',
          },
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
  // S3 — EU NA INTIMIDADE
  // Intimidade NÃO é sinônimo de sexo.
  // 9. Qualidades que facilitam intimidade (open-first)
  // 10. Registro Único 07D→07E:
  //     "Isso também aparece na intimidade sexual?" (SIM = CONTEXTUALIZED, NÃO = nova informação, DEPENDE = context_dependent)
  // ----------------------------------------------------
  {
    id: 'p-07e-s3-qualidade-intimidade',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-3',
    step_order: 9,
    prompt_order: 1,
    step_title: 'O que constrói intimidade para você',
    step_subtitle: 'Intimidade envolve presença, escuta, carinho e confiança mútua.',
    component_type: 'FreeReflection',
    prompt_text:
      'Quando você se sente verdadeiramente íntima de alguém, o que torna esse espaço seguro?',
    helper_text:
      'Intimidade não é apenas sobre sexo. É sobre poder ser você mesma. Conte com suas palavras ou veja apoios.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'qualidades_intimidade_segura',
      concept_key: 'intimacy_quality_in_closeness',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Veja alguns elementos comuns de intimidade',
        option_set_ref: 'opt_intimidade_qualidades',
      },
      option_set: {
        id: 'opt_intimidade_qualidades',
        items: [
          {
            id: 'confianca_e_nao_julgamento',
            label: 'Saber que não serei julgada, exposta ou criticada',
          },
          {
            id: 'respeito_ao_meu_ritmo',
            label: 'Sentir que a pessoa respeita meus limites e não me pressiona',
          },
          {
            id: 'vulnerabilidade_compartilhada',
            label: 'Quando o outro também se abre e divide suas fragilidades',
          },
          {
            id: 'carinho_e_afeto_sem_cobranca',
            label: 'Carinho gratuito, sem expectativa automática de levar a algo mais',
          },
          {
            id: 'permanecer_presente',
            label: 'A sensação de conseguir ficar inteira e presente no momento',
          },
          {
            id: 'espaco_para_dizer_o_que_sinto',
            label: 'Poder falar o que sinto sem medo de magoar ou romper',
          },
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
    id: 'p-07e-s3-conexao-relacional-sexual',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-3',
    step_order: 10,
    prompt_order: 2,
    step_title: 'Da intimidade relacional à intimidade sexual',
    step_subtitle: 'Registro Único 07D→07E: contextualização precisa sem suposição automática.',
    component_type: 'ChoiceCards',
    prompt_text:
      'A forma como você constrói confiança e proximidade nas suas relações importantes costuma se repetir na intimidade sexual?',
    helper_text:
      'Padrão relacional geral ≠ padrão erótico. O que vale para amizades ou parcerias nem sempre se repete no sexo.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'contextualizacao_relacional_sexual',
      concept_key: 'intimacy_relational_to_sexual_context',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      context_reuse: {
        dimension_ref: 'relacoes',
        concept_key: 'vulnerability_context_pattern',
        prompt_ref: 'confianca_vulnerabilidade',
        mode: 'conditional_contextualize',
      },
      options: [
        {
          id: 'sim_contextualized',
          title: 'Sim, funciona de maneira muito parecida',
          description: 'O que me dá segurança nas relações é o mesmo que me abre na intimidade.',
        },
        {
          id: 'nao_novo_contexto',
          title: 'Não, são espaços com dinâmicas e necessidades bem diferentes',
          description: 'Na intimidade sexual sinto outras facilidades, receios ou ritmos.',
        },
        {
          id: 'depende_do_vinculo',
          title: 'Depende muito de quem é a pessoa e do momento',
          description: 'Em algumas parcerias converge; em outras há descompasso.',
        },
        {
          id: 'ainda_estou_percebendo',
          title: 'Ainda estou percebendo como essas duas partes se relacionam em mim',
          description: 'Uma reflexão em aberto na minha vida.',
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
  // S4 — MINHA VOZ E MEUS LIMITES
  // Cenas sobre expressar escolhas, preferências, dizer não, pausar, mudar de ideia.
  // Pergunta central: "Quando alguma coisa não está confortável para você, o que costuma acontecer?"
  // Autonomia = possibilidade de escolha percebida; NÃO criar score de assertividade.
  // 11. Pergunta central de limites em cena adaptativa (boundary_communication_pattern)
  // 12. Comunicação de desejos e preferências (boundary_expression_tendency)
  // 13. Fechamento com espelho simples e acolhedor (sexuality_reflection_mirror)
  // ----------------------------------------------------
  {
    id: 'p-07e-s4-desconforto-cena',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-4',
    step_order: 11,
    prompt_order: 1,
    step_title: 'Quando algo não está confortável',
    step_subtitle: 'Expressão de limites sem julgamento moral ou cobrança de firmeza idealizada.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Em momentos de intimidade ou contato, quando alguma coisa não está confortável para você, o que costuma acontecer?',
    helper_text:
      'Sem certo ou errado. Cada pessoa aprendeu a proteger seus limites de um jeito ao longo da história.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'comunicacao_desconforto_cena',
      concept_key: 'boundary_communication_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'percebo_e_falo',
          title: 'Percebo logo e consigo falar, pausar ou redirecionar na hora',
          description: 'Sinalizo o incômodo com relativa prontidão.',
        },
        {
          id: 'percebo_mas_hesito',
          title: 'Percebo na hora, mas hesito em falar por receio de quebrar o clima ou magoar',
          description: 'O limite é sentido por dentro, mas a fala exige esforço ou coragem.',
        },
        {
          id: 'percebo_depois',
          title: 'Só percebo claramente depois que o momento já passou',
          description: 'A sensação de desconforto ou cansaço se torna nítida mais tarde.',
        },
        {
          id: 'me_adapto',
          title: 'Tento me adaptar ou continuar para acomodar a outra pessoa',
          description: 'Priorizo o conforto do outro ou sinto dificuldade em interromper.',
        },
        {
          id: 'paro_ou_me_afasto',
          title: 'Costumo parar o contato ou colocar distância física',
          description: 'Uso a retirada corporal como forma de proteger o meu espaço.',
        },
        {
          id: 'muda_por_situacao',
          title: 'Muda radicalmente dependendo de quem está comigo',
          description: 'Com algumas pessoas tenho voz imediata; com outras fico contida.',
        },
        {
          id: 'outra_reacao_limite',
          title: 'Outro movimento próprio',
          description: 'Uma reação particular que costuma ocorrer comigo.',
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
    id: 'p-07e-s4-expressao-preferencias',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-4',
    step_order: 12,
    prompt_order: 2,
    step_title: 'Sua voz sobre desejos e preferências',
    step_subtitle: 'Autonomia percebida: dizer sim, dizer ainda não, mudar de ideia ou sugerir.',
    component_type: 'ChoiceCards',
    prompt_text:
      'E quanto a expressar suas preferências, mudar de ideia ou pedir uma pausa — como costuma ser essa experiência?',
    helper_text:
      'Dizer sim uma vez não obriga sim depois. Mudar de ideia é parte legítima de qualquer escolha.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'expressao_escolhas_preferencias',
      concept_key: 'boundary_expression_tendency',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'falo_com_liberdade',
          title: 'Consigo falar com tranquilidade sobre o que gosto e mudar de ideia quando sinto',
          description: 'Sinto liberdade para orientar o ritmo e expressar vontades.',
        },
        {
          id: 'prefiro_mostrar_com_gestos',
          title: 'Prefiro guiar com gestos e movimentos do que falar em palavras',
          description: 'A comunicação se dá melhor pelo corpo do que pela fala direta.',
        },
        {
          id: 'sinto_dificuldade_em_mudar_de_ideia',
          title: 'Depois que começou, acho difícil pedir pausa ou dizer que mudei de ideia',
          description: 'A sensação de compromisso com o fluxo dificulta interromper.',
        },
        {
          id: 'espero_a_outra_pessoa_perguntar',
          title: 'Fica muito mais fácil quando a outra pessoa pergunta e abre espaço explícito',
          description: 'A escuta atenta do outro facilita muito a minha expressão.',
        },
        {
          id: 'aprendendo_minha_voz',
          title: 'É algo que estou aprendendo a reconhecer e fortalecer aos poucos',
          description: 'Um movimento recente de autopercepção e limites.',
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
    id: 'p-07e-s4-espelho-fechamento',
    experience_id: SEXUALIDADE_EXPERIENCE_ID,
    moment_id: 'mom-sex-4',
    step_order: 13,
    prompt_order: 3,
    step_title: 'O espelho da sua sexualidade hoje',
    step_subtitle: 'Algumas coisas começaram a aparecer… sem notas, rótulos ou perfis prontos.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Olhando para este panorama sobre seu corpo, desejo, intimidade e voz, como isso soa para você?',
    helper_text:
      'Aqui não há perfil nem diagnóstico. Apenas um reconhecimento gentil de como você se percebe.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'espelho_sexualidade_recognition',
      concept_key: 'sexuality_reflection_mirror',
      temporality: 'current',
      access_destination: 'participant_shared',
      composite_mirror: {
        enabled: true,
        steps: [
          { label: 'Seu corpo nessa parte da vida', prompt_ref: 'conforto_percebido_corpo' },
          { label: 'Quando o desejo aparece', prompt_ref: 'desejo_camada_experiencia' },
          { label: 'Resposta corporal física', prompt_ref: 'resposta_corporal_camada' },
          { label: 'Disponibilidade real', prompt_ref: 'disponibilidade_camada_experiencia' },
          { label: 'O que traz prazer amplo', prompt_ref: 'prazer_panorama_amplo' },
          { label: 'O que gera intimidade', prompt_ref: 'qualidades_intimidade_segura' },
          {
            label: 'Seu movimento diante de desconforto',
            prompt_ref: 'comunicacao_desconforto_cena',
          },
          { label: 'Sua voz e escolhas', prompt_ref: 'expressao_escolhas_preferencias' },
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
          id: 'muda_demais_por_contexto',
          title: 'Muda demais dependendo do contexto e da fase',
          description: 'A variabilidade contextual é o traço mais evidente.',
        },
        {
          id: 'ainda_estou_descobrindo',
          title: 'Ainda estou descobrindo como minha sexualidade se move',
          description: 'Olhar para isso abriu espaço para novas percepções pessoais.',
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

// Lista canônica de prompts essenciais do Build 07E (caminho essencial enxuto = 4-6 interações percebidas, 5-8 min)
export const SEXUALIDADE_ESSENTIAL_PATH_PROMPT_KEYS = [
  'conforto_percebido_corpo',
  'percepcao_sensacoes_corpo',
  'mudanca_recente_corpo',
  'desejo_camada_experiencia',
  'resposta_corporal_camada',
  'disponibilidade_camada_experiencia',
  'prazer_panorama_amplo',
  'qualidades_intimidade_segura',
  'contextualizacao_relacional_sexual',
  'comunicacao_desconforto_cena',
  'expressao_escolhas_preferencias',
  'espelho_sexualidade_recognition',
]
