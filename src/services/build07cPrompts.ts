/**
 * Build 07C — Especificação Normativa e Definições de Schema dos Prompts e Momentos
 * Dimensões:
 * 1. Mente & Emoções (Dimension ID: i5s00tarmu3nhbu, Experience ID: exp-mente-emocoes-07c)
 * 2. Regulação & Padrões de Resposta (Dimension ID: 3bh0biuputz5oqh, Experience ID: exp-regulacao-respostas-07c)
 *
 * Princípios Normativos Constitucionais:
 * - Complexidade nos bastidores, leveza na experiência
 * - Zero score, zero diagnóstico, zero classificação automática (ruminação, TDAH, rigidez, etc.)
 * - Zero conversão de comportamento em fight/flight/freeze/fawn
 * - Proteção como hipótese profissional POSTERIOR (nunca factual, nunca participant-facing)
 * - Recurso conhecido ≠ recurso acessível sob estresse (duas camadas/armazenamentos distintos)
 * - Anti-laundering estrito (participant_private nunca vira participant_shared em nenhuma derivação)
 * - Registro Único: o que já foi respondido em Mente (contexto, emoção) é REUSED em Regulação (sem recoleta)
 * - Pensamento associado permanece participant_private e NUNCA é espelhado ou inferido em Regulação
 * - Open-first obrigatório
 * - Temporalidade rigorosa (longitudinal, recurring, current, context_dependent)
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
  title: 'Mente & Emoções',
  subtitle:
    'Como suas emoções se manifestam, o movimento dos seus pensamentos e o diálogo com você mesma.',
  order_index: 3,
  is_pilot: false,
  opening_text:
    'Um convite para observar seu mundo interno com gentileza. Aqui não há sentimentos certos ou errados — apenas o retrato de como sua mente e suas emoções se expressam no dia a dia.',
  closing_text:
    'Seu retrato emocional e mental foi acolhido. Esse olhar sensível nos ajuda a compreender seus processos e recursos com profundidade.',
  version: 1,
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
// MOMENTOS DE MENTE & EMOÇÕES (PM1..PM5)
// ==========================================

export const MENTE_EMOCOES_MOMENTS: CerExperienceMomentRecord[] = [
  {
    id: 'mom-mente-1',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'meu_mundo_emocional',
    title: 'Meu Mundo Emocional',
    subtitle: 'Como você costuma viver e reconhecer suas emoções no cotidiano.',
    order_index: 1,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-2',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'olhar_mais_de_perto',
    title: 'Olhar Mais de Perto',
    subtitle: 'Às vezes uma emoção vem acompanhada de outras sensações e pensamentos.',
    order_index: 2,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-3',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'sua_mente_em_movimento',
    title: 'Sua Mente em Movimento',
    subtitle: 'Processos mentais que em alguns momentos ajudam e em outros cansam.',
    order_index: 3,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-4',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'voce_consigo_mesma',
    title: 'Você Consigo Mesma',
    subtitle: 'Seu diálogo interno diante de desencontros e conquistas.',
    order_index: 4,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-mente-5',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_key: 'dois_retratos_de_mim',
    title: 'Dois Retratos de Mim',
    subtitle: 'Como você funciona quando tem espaço por dentro e quando está sobrecarregada.',
    order_index: 5,
    is_active: true,
    version: 1,
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
// DEFINIÇÃO NORMATIVA DE PROMPTS — MENTE & EMOÇÕES (PM1..PM5)
// ==========================================

export const BUILD_07C_MENTE_PROMPTS: CerPromptRecord[] = [
  // ----------------------------------------------------
  // PM1 — MEU MUNDO EMOCIONAL (2 responses internas: mundo_emocional_geral longitudinal + emocoes_recorrentes recurring)
  // Interação percebida 1: Open-first ("como você costuma viver suas emoções?") com poucas opções (6-8)
  // ----------------------------------------------------
  {
    id: 'p-07c-pm1-geral',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'Como você vive suas emoções',
    step_subtitle: 'Seu jeito de reconhecer e sentir no dia a dia.',
    component_type: 'FreeReflection',
    prompt_text: 'De maneira geral, como você costuma viver suas emoções no dia a dia?',
    helper_text: 'Escreva espontaneamente com suas palavras ou, se preferir, use as ideias abaixo.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'mundo_emocional_geral',
      concept_key: 'emotion_recognition_style',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Precisa de apoio para começar? Veja algumas formas comuns',
        option_set_ref: 'opt_estilo_reconhecimento_emocional',
      },
      option_set: {
        id: 'opt_estilo_reconhecimento_emocional',
        items: [
          { id: 'sinto_nitido', label: 'Percebo com bastante clareza o que sinto na hora' },
          { id: 'mistura_intensa', label: 'Costuma vir como uma onda intensa e misturada' },
          {
            id: 'demoro_perceber',
            label: 'Às vezes demoro um tempo para entender o que estou sentindo',
          },
          { id: 'mais_mental', label: 'Tendo a racionalizar antes de sentir no corpo' },
          { id: 'nao_sei', label: 'Ainda acho difícil nomear ou definir' },
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
    step_title: 'Emoções que mais visitam você',
    step_subtitle: 'Um conjunto enxuto de estados frequentes.',
    component_type: 'MultiSelectCards',
    prompt_text: 'Quais dessas emoções ou estados mais costumam se fazer presentes na sua rotina?',
    helper_text: 'Escolha de 2 a 4 que mais aparecem (sem julgamento de certo ou errado).',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'emocoes_recorrentes',
      concept_key: 'recurrent_emotional_experience',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'ansiedade_apreensao',
          title: 'Ansiedade ou apreensão',
          description: 'Sensação de alerta contínuo ou urgência interna.',
        },
        {
          id: 'tristeza_desanimo',
          title: 'Tristeza ou recolhimento',
          description: 'Vontade de silêncio, baixa energia ou pesar.',
        },
        {
          id: 'irritacao_raiva',
          title: 'Irritação ou impaciência',
          description: 'Calor interno, limite ultrapassado, faísca rápida.',
        },
        {
          id: 'alegria_entusiasmo',
          title: 'Alegria ou entusiasmo',
          description: 'Expansão, vitalidade e vontade de realizar.',
        },
        {
          id: 'calma_serenidade',
          title: 'Calma ou serenidade',
          description: 'Espaço interno, clareza e ritmo tranquilo.',
        },
        {
          id: 'frustracao_cobranca',
          title: 'Frustração ou autocobrança',
          description: 'Inconformismo quando algo não sai como esperado.',
        },
        {
          id: 'medo_inseguranca',
          title: 'Insegurança ou receio',
          description: 'Hesitação diante do incerto ou de exposição.',
        },
        {
          id: 'outra_emocao',
          title: 'Outra experiência',
          description: 'Um estado singular que você prefere nomear do seu jeito.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_pm1_branch_profundidade',
            when: {
              // Branch abre só se selecionou 2 ou mais emoções
              any_of: [{ field: 'selected_count_gte', operator: 'equals', value: 2 }],
            },
            then: { action: 'open_branch', target_prompt_key: 'emocoes_espaco_expressao_branch' },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // Branch Adaptativo PM1: só se 2+ emoções marcadas
  // "quais ocupam muito espaço / quais são mais difíceis de mostrar"
  {
    id: 'p-07c-pm1-branch',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-1',
    step_order: 3,
    prompt_order: 3,
    step_title: 'O espaço dessas emoções',
    step_subtitle: 'Entre o que transborda e o que fica guardado.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Dentre as emoções que você vive, alguma costuma ocupar muito espaço ou ser mais difícil de mostrar?',
    helper_text: 'Apenas se fizer sentido para você.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'emocoes_espaco_expressao_branch',
      concept_key: 'recurrent_emotional_experience',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'ocupam_muito_espaco',
          title: 'Algumas tendem a ocupar muito espaço interno',
          description: 'Ficam ecoando ou tomam a atenção por bastante tempo.',
        },
        {
          id: 'dificeis_de_mostrar',
          title: 'Costumam ser bem mais difíceis de expressar para os outros',
          description: 'Vivo mais internamente sem deixar transparecer.',
        },
        {
          id: 'ambas_as_coisas',
          title: 'As duas coisas acontecem dependendo da emoção',
          description: 'Algumas transbordam, outras escondo.',
        },
        {
          id: 'flui_bem',
          title: 'Fluem sem tanta retenção nem excesso',
          description: 'Aparecem e passam com relativa naturalidade.',
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
  // PM2 — OLHAR MAIS DE PERTO: UMA cena narrativa integrada
  // Texto obrigatório preservado: "Às vezes uma emoção vem acompanhada de outras. Quando você olha mais de perto, o que encontra?"
  // Componente 1: experiencia_complexa (participant_shared)
  // Componente 2: pensamento_associado (participant_private — PRIVACIDADE PRÉ-EXPRESSÃO)
  // NUNCA "emoção verdadeira" ou causalidade
  // ----------------------------------------------------
  {
    id: 'p-07c-pm2-experiencia',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-2',
    step_order: 4,
    prompt_order: 1,
    step_title: 'Olhar mais de perto',
    step_subtitle: 'Uma cena ou experiência em camadas.',
    component_type: 'FreeReflection',
    prompt_text:
      'Às vezes uma emoção vem acompanhada de outras. Quando você olha mais de perto, o que encontra?',
    helper_text: 'Conte espontaneamente ou escolha uma das saídas abaixo se preferir.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'experiencia_complexa',
      concept_key: 'complex_emotional_experience',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Apoio para reconhecer camadas da emoção',
        option_set_ref: 'opt_experiencia_complexa_apoio',
      },
      option_set: {
        id: 'opt_experiencia_complexa_apoio',
        items: [
          { id: 'parece_mistura', label: 'Parece uma mistura de várias coisas ao mesmo tempo' },
          {
            id: 'irritacao_com_inseguranca',
            label: 'Uma irritação que vem acompanhada de cansaço ou receio',
          },
          {
            id: 'tristeza_com_cobranca',
            label: 'Uma tristeza misturada com vontade de resolver logo',
          },
          { id: 'nao_sei_identificar', label: 'Não sei identificar com clareza o que está junto' },
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
    id: 'p-07c-pm2-pensamento',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-2',
    step_order: 5,
    prompt_order: 2,
    step_title: 'O pensamento que costuma aparecer',
    step_subtitle: 'Seu espaço reservado e confidencial.',
    component_type: 'FreeReflection',
    prompt_text: 'Nesses momentos, que tipo de pensamento costuma passar pela sua mente?',
    helper_text:
      'Este registro é exclusivamente seu (privacidade privada). Responda com liberdade ou registre "não sei".',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'pensamento_associado',
      concept_key: 'associated_thought_pattern',
      temporality: 'recurring',
      // P0 CONSTITUCIONAL: participant_private pré-expressão
      access_destination: 'participant_private',
      open_first: {
        enabled: true,
        help_label: 'Ideias de pensamentos comuns nessa hora',
        option_set_ref: 'opt_pensamento_apoio',
      },
      option_set: {
        id: 'opt_pensamento_apoio',
        items: [
          { id: 'preciso_dar_conta', label: '“Eu preciso dar conta de tudo sozinha”' },
          { id: 'vai_dar_errado', label: '“E se der tudo errado ou eu for julgada?”' },
          { id: 'deveria_ter_feito_melhor', label: '“Eu deveria ter agido de outro jeito”' },
          {
            id: 'nao_tem_pensamento_claro',
            label: 'Não vem um pensamento claro, fico sem palavras',
          },
          { id: 'nao_sei', label: 'Não sei / Prefiro não responder' },
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
  // PM3 — SUA MENTE EM MOVIMENTO: Dual-state ("ÀS VEZES ISSO ME AJUDA" vs "ÀS VEZES ISSO ME CANSA")
  // Zero classificação automática (ruminação, controle, etc.)
  // Branch de profundidade só se marcada nos dois estados (ajuda + cansa)
  // ----------------------------------------------------
  {
    id: 'p-07c-pm3-ajuda',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 6,
    prompt_order: 1,
    step_title: 'Sua mente em movimento: quando ajuda',
    step_subtitle: 'Tendências do seu pensar que funcionam como recurso.',
    component_type: 'MultiSelectCards',
    prompt_text:
      'Pensando no ritmo dos seus pensamentos: quais dessas tendências mentais às vezes te AJUDAM?',
    helper_text: 'O mesmo processo mental pode te ajudar em alguns cenários e cansar em outros.',
    is_required: true,
    version: 1,
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
    step_order: 7,
    prompt_order: 2,
    step_title: 'Sua mente em movimento: quando cansa',
    step_subtitle: 'Quando a mesma tendência mental gera sobrecarga.',
    component_type: 'MultiSelectCards',
    prompt_text: 'E quais dessas tendências mentais às vezes te CANSAM ou pesam por dentro?',
    helper_text: 'Observe com gentileza onde há sobrecarga mental.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'mente_movimento_cansa',
      concept_key: 'mental_tendency_perceived_cost',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'antecipar_cenarios',
          title: 'Antecipar cenários e planejar detalhes',
          description: 'Ficar prevendo desfechos ruins sem conseguir desligar.',
        },
        {
          id: 'analisar_profundo',
          title: 'Analisar a fundo e buscar coerência',
          description: 'Ficar presa aos detalhes com excesso de reflexão.',
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

  // Branch Adaptativo PM3: só se houve sobreposição entre AJUDA e CANSA
  {
    id: 'p-07c-pm3-branch',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-3',
    step_order: 8,
    prompt_order: 3,
    step_title: 'Os dois lados do mesmo movimento',
    step_subtitle: 'Quando o mesmo recurso cobra um pedágio.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Você marcou a mesma característica como algo que te ajuda e que também te cansa. Como você percebe essa virada?',
    helper_text: 'A linha tênue onde a proteção vira cansaço.',
    is_required: false,
    version: 1,
    schema_config: {
      prompt_key: 'mente_movimento_profundidade_branch',
      concept_key: 'recurring_mental_tendency',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'virada_sob_pressao',
          title: 'Vira cansaço quando estou sob muita pressão ou sem tempo',
          description: 'O recurso passa da conta e vira urgência.',
        },
        {
          id: 'dificil_desligar',
          title: 'Ajuda a resolver, mas depois o corpo demora a desacelerar',
          description: 'Cumpre o papel na hora, mas deixa um rastro de exaustão.',
        },
        {
          id: 'depende_do_ambiente',
          title: 'Depende de quem está comigo ou da segurança do ambiente',
          description: 'Em certos contextos funciona leve, em outros pesa.',
        },
        {
          id: 'nao_sei_dizer',
          title: 'Não sei dizer exatamente como acontece essa virada',
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

  // ----------------------------------------------------
  // PM4 — VOCÊ CONSIGO MESMA: UMA microinteração de duas faces
  // Face Erro: "Quando algo importante não sai como eu esperava…" -> participant_private
  // Face Realização: "Quando algo dá certo e eu participei disso…" -> participant_shared
  // Privacy conhecida ANTES da expressão em cada face.
  // ZERO duas FreeReflections obrigatórias: ChoiceCards com reflexão opcional embutida.
  // ----------------------------------------------------
  {
    id: 'p-07c-pm4-erro',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-4',
    step_order: 9,
    prompt_order: 1,
    step_title: 'Diálogo interno: diante de um desencontro',
    step_subtitle: 'Quando algo importante não sai como o planejado.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Quando algo importante não sai como você esperava, como costuma soar a sua voz interna?',
    helper_text:
      'Privacidade pré-expressão: este registro é estritamente confidencial (só para você).',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'self_dialogue_erro',
      concept_key: 'self_dialogue_after_mistake',
      temporality: 'recurring',
      // P0 CONSTITUCIONAL: face de erro é participant_private
      access_destination: 'participant_private',
      options: [
        {
          id: 'cobranca_severa',
          title: 'Uma cobrança firme e exigente',
          description: '“Como pude errar isso? Eu deveria ter previsto.”',
        },
        {
          id: 'recolhimento_silencioso',
          title: 'Um recolhimento ou sensação de insuficiência',
          description: 'Vontade de sumir ou sensação de incapacidade.',
        },
        {
          id: 'compreensao_acolhimento',
          title: 'Compreensão e busca de acolhimento',
          description: '“Foi o melhor possível naquelas condições; acontece.”',
        },
        {
          id: 'diferente_comigo',
          title: 'É diferente comigo / Quero contar do meu jeito',
          description: 'Minha forma de falar comigo mesma tem outras nuances.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Difícil definir',
          description: 'Não consigo reparar na fala interna.',
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
    id: 'p-07c-pm4-realizacao',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-4',
    step_order: 10,
    prompt_order: 2,
    step_title: 'Diálogo interno: diante de uma conquista',
    step_subtitle: 'Quando algo dá certo e você fez parte disso.',
    component_type: 'ChoiceCards',
    prompt_text:
      'E quando algo dá muito certo e você participou disso, como você acolhe essa conquista por dentro?',
    helper_text: 'Compartilhado com sua profissional de referência para reconhecer seus recursos.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'self_dialogue_realizacao',
      concept_key: 'self_dialogue_after_success',
      temporality: 'recurring',
      // Face realização é participant_shared
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
          description: 'A sensação de “menos mal que acabou bem”.',
        },
        {
          id: 'celebracao_genuina',
          title: 'Alegria genuína e reconhecimento do próprio valor',
          description: 'Consigo sentir orgulho e me parabenizar com carinho.',
        },
        {
          id: 'diferente_comigo',
          title: 'É diferente comigo / Tenho outro jeito de viver',
          description: 'Outra dinâmica interna presente.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei dizer',
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
  // PM5 — DOIS RETRATOS DE MIM: Dual-state contextual
  // "Quando tenho espaço por dentro" vs "Quando estou sobrecarregada"
  // Não criar "eu saudável × eu ruim". Semântica context_dependent.
  // Signals proporcionais emergem naturalmente sem tela separada de forças.
  // ----------------------------------------------------
  {
    id: 'p-07c-pm5-espaco',
    experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
    moment_id: 'mom-mente-5',
    step_order: 11,
    prompt_order: 1,
    step_title: 'Quando tenho espaço por dentro',
    step_subtitle: 'Retrato em dias de respiro e presença.',
    component_type: 'MultiSelectCards',
    prompt_text:
      'Pensando nos dias em que você tem espaço por dentro e calma, como suas qualidades costumam aparecer?',
    helper_text: 'Escolha até 3 traços que florescem quando há espaço.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'dois_retratos_espaco',
      concept_key: 'contextual_self_trait',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'cuidado_atento',
          title: 'Cuidado atento e presença generosa',
          description: 'Consigo escutar e cuidar com calma e carinho.',
        },
        {
          id: 'clareza_decisao',
          title: 'Clareza e capacidade de resolver',
          description: 'Tomo decisões sem pressa nem ansiedade.',
        },
        {
          id: 'criatividade_leveza',
          title: 'Criatividade, curiosidade e leveza',
          description: 'Me abro para o novo e rio de mim mesma com facilidade.',
        },
        {
          id: 'firmeza_limites',
          title: 'Firmeza serena para dizer o que precisa',
          description: 'Coloco limites com tranquilidade sem precisar me defender.',
        },
        {
          id: 'silencio_nutritivo',
          title: 'Conexão profunda com o silêncio e o próprio ritmo',
          description: 'Fico bem comigo mesma sem precisar produzir o tempo todo.',
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
    step_order: 12,
    prompt_order: 2,
    step_title: 'Quando estou sobrecarregada',
    step_subtitle: 'Como as mesmas características se manifestam sob pressão.',
    component_type: 'MultiSelectCards',
    prompt_text:
      'E nos dias em que o limite foi ultrapassado ou a sobrecarga pesa, o que costuma acontecer?',
    helper_text: 'Sem julgamento: são adaptações contextuais do seu sistema.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'dois_retratos_sobrecarga',
      concept_key: 'contextual_self_trait_under_load',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'cuidado_atento',
          title: 'O cuidado vira hipervigilância ou controle',
          description: 'Fico alerta a tudo para nada sair do lugar.',
        },
        {
          id: 'clareza_decisao',
          title: 'A clareza vira pressa e urgência de fechar',
          description: 'Fico impaciente se as coisas não andam no meu ritmo.',
        },
        {
          id: 'criatividade_leveza',
          title: 'A leveza se perde e vem a dispersão mental',
          description: 'Muitas ideias ao mesmo tempo sem conseguir aterrar.',
        },
        {
          id: 'firmeza_limites',
          title: 'A firmeza vira rigidez ou distanciamento',
          description: 'Me fecho em silêncio ou me afasto para me proteger.',
        },
        {
          id: 'silencio_nutritivo',
          title: 'O silêncio vira isolamento ou exaustão',
          description: 'Me recolho por não ter energia para interagir.',
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
      'Você costuma perceber que foi mobilizada na hora em que acontece ou só algum tempo depois?',
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
  // PR2 — O QUE ACONTECE COMIGO: Sequência percebida:
  // RESPOSTA/TENDÊNCIA → VONTADE × COMPORTAMENTO (adaptativo R4) → FUNÇÃO PERCEBIDA
  // NUNCA converter em fight/flight/freeze/fawn.
  // Função open-first OBRIGATÓRIO: "Você percebe o que isso tenta resolver naquele momento?"
  // Prompts internos: resposta_tendencia [+ vontade_x_comportamento] + funcao_percebida
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
          description: 'Evitar o atrito a todo custo e buscar apaziguar o clima.',
        },
        {
          id: 'travar_congelar',
          title: 'Ficar em dúvida, paralisada ou sem saber o que falar',
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

  // Branch Adaptativo PR2 (R4): vontade × comportamento
  // Abre apenas quando urge ≠ enacted não estiver claro
  // Armazenamento separado: response_urge_reported vs enacted_behavior_reported
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
          description: 'Engulo a reação para manter a paz aparente.',
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

  // PR2: Função Percebida (open-first OBRIGATÓRIO)
  // "Você percebe o que isso tenta resolver naquele momento?"
  // "não sei" válido. Ajuda opcional só depois.
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
  // PR3 — E DEPOIS / MEU CAMINHO DE VOLTA:
  // Integrar: Repercussão/custo posterior ("E depois?") → Recurso conhecido → Acesso sob estresse.
  // Preservar DUAS CAMADAS: known_return_resource ≠ resource_access_under_stress.
  // Segunda camada somente quando um recurso for nomeado.
  // "Às vezes não sei como voltar" é resposta válida (sem transformar em trauma/risco).
  // Prompts internos: custo_posterior + known_return_resource + resource_access_under_stress
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
          title: 'Ficar em silêncio e um tempo sozinha',
          description: 'Estar no meu canto sem precisar responder a ninguém.',
        },
        {
          id: 'conversar_desabafar',
          title: 'Conversar com alguém de confiança que me escute',
          description: 'Pôr em palavras e me sentir compreendida.',
        },
        {
          id: 'movimento_ar_livre',
          title: 'Caminhar, movimentar o corpo ou sair ao ar livre',
          description: 'Mudar de ambiente e deixar o corpo descarregar.',
        },
        {
          id: 'pausa_sono_respiro',
          title: 'Dormir, deitar ou fazer pausas intencionais',
          description: 'Dar tempo para o sistema resetar no repouso.',
        },
        {
          id: 'as_vezes_nao_sei',
          title: 'Às vezes não sei como voltar ou me sinto sem rumo',
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
              // Abre a camada 2 sempre que um recurso for nomeado (não abre se marcou as_vezes_nao_sei)
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

  // Camada 2: Recurso conhecido ≠ recurso acessível sob estresse (duas camadas/armazenamentos distintos)
  // access_destination = shared_care com informação pré-expressão
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
      // Shared care informado pré-expressão
      access_destination: 'shared_care',
      options: [
        {
          id: 'consigo_recorrer',
          title: 'Consigo recorrer a ele na maioria das vezes',
          description: 'Lembro e tenho autonomia para colocar em prática.',
        },
        {
          id: 'as_vezes_consigo',
          title: 'Às vezes consigo, depende do nível da crise',
          description: 'Se o estresse for moderado ajuda; se for muito alto, esqueço.',
        },
        {
          id: 'sei_que_ajuda_mas_dificil',
          title: 'Sei que me ajuda, mas é muito difícil acessar no calor da hora',
          description: 'Fica uma distância enorme entre saber e conseguir fazer.',
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
  // PR4 — MINHA SEQUÊNCIA:
  // Espelho da sequência: QUANDO ALGO MEXE COMIGO → EU PERCEBO → EU TENHO TENDÊNCIA A → NA HORA ISSO... → ÀS VEZES DEPOIS... → O QUE ME AJUDA A VOLTAR.
  // Recognition: "isso se parece com o que acontece com você?" (sim, bastante / em parte / depende / não é bem assim -> sequence_recognition_response)
  // Variabilidade contextual opcional: "tem alguma situação em que acontece completamente diferente?" -> contextual_sequence_variation
  // Se a participante rejeitar a função percebida ("não é bem assim"), a evidence de função perde currency.
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
      // Flag especial para renderizar o espelho composto antes da pergunta
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
            label: 'Com quem tenho intimidade me permito expressar; com estranhos me fecho',
          },
          {
            id: 'quando_estou_descansada',
            label: 'Quando estou descansada consigo pausar; com sono viro reativa',
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

// Chaves canônicas de caminho essencial de Mente (PM1..PM5)
export const MENTE_ESSENTIAL_PATH_PROMPT_KEYS = [
  'mundo_emocional_geral', // PM1a
  'emocoes_recorrentes', // PM1b
  'experiencia_complexa', // PM2a
  'pensamento_associado', // PM2b (privado)
  'mente_movimento_ajuda', // PM3a
  'mente_movimento_cansa', // PM3b
  'self_dialogue_erro', // PM4a (privado)
  'self_dialogue_realizacao', // PM4b
  'dois_retratos_espaco', // PM5a
  'dois_retratos_sobrecarga', // PM5b
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
