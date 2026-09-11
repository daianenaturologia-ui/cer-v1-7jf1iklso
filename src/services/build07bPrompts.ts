/**
 * Build 07B — Especificação Normativa e Definições de Schema dos Prompts e Momentos
 * Dimensão: Corpo & Fisiologia / Referencial: Ayurveda
 *
 * Microexperiências:
 * 1. Meu jeito de funcionar (E1, E2)
 * 2. A viagem da refeição (E3, E4 + adaptive branches A1..A6)
 * 3. Meu ritmo de descanso (E5 + adaptive branches)
 * 4. O que acontece ou costuma voltar no meu corpo (E6 + adaptive branches A7..A8 + BodyMap)
 * 5. Quando meu corpo funciona melhor (E8 + E7 condição de saúde)
 *
 * Princípios inquebráveis:
 * - Complexidade nos bastidores, leveza na experiência
 * - Zero termos sânscritos participant-facing (Vata/Pitta/Kapha/Agni/Ama são leitura profissional futura)
 * - Zero scores automáticos ou diagnósticos
 * - Reuso de componentes experiencial existentes (ChoiceCards, FreeReflection, SimpleScale, MultiSelectCards, BodyMap)
 * - Temporalidade rigorosa (longitudinal, recurring, current, context_dependent)
 */

import type {
  CerExperienceRecord,
  CerExperienceMomentRecord,
  CerPromptRecord,
  VisibilityClass,
} from '@/types/cer'

export const CORPO_FISIOLOGIA_EXPERIENCE_ID = 'exp-corpo-fisiologia-07b'
export const CORPO_FISIOLOGIA_DIMENSION_ID = 'p162o1xzewn186v'
export const AYURVEDA_FRAMEWORK_ID = 'w6ysm8phe1ze2wm'

export const CORPO_FISIOLOGIA_EXPERIENCE: CerExperienceRecord = {
  id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
  dimension_id: CORPO_FISIOLOGIA_DIMENSION_ID,
  code: 'corpo_fisiologia_ayurveda',
  title: 'Corpo & Fisiologia',
  subtitle:
    'Um olhar cuidadoso sobre seus ritmos biológicos, digestão, vitalidade e sinais do corpo.',
  order_index: 2,
  is_pilot: false,
  opening_text:
    'Cada corpo tem um ritmo e um jeito único de funcionar. Vamos percorrer com leveza como você percebe seu corpo no dia a dia, sem julgamentos ou certo e errado.',
  closing_text:
    'Seu retrato corporal e digestivo foi acolhido. Essas percepções nos ajudam a compreender seus ritmos de forma integrada.',
  version: 1,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
}

export const CORPO_FISIOLOGIA_MOMENTS: CerExperienceMomentRecord[] = [
  {
    id: 'mom-07b-1',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_key: 'meu_jeito_de_funcionar',
    title: 'Meu jeito de funcionar',
    subtitle: 'Tendências habituais e natureza do seu corpo ao longo do tempo.',
    order_index: 1,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-07b-2',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_key: 'viagem_da_refeicao',
    title: 'A viagem da refeição',
    subtitle: 'A relação com o apetite, a alimentação e a digestão no seu ritmo.',
    order_index: 2,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-07b-3',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_key: 'ritmo_de_descanso',
    title: 'Meu ritmo de descanso',
    subtitle: 'Como o repouso e a recuperação acontecem no seu dia a dia.',
    order_index: 3,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-07b-4',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_key: 'o_que_costuma_voltar',
    title: 'O que costuma voltar no corpo',
    subtitle: 'Sensações frequentes, padrões corporais ou pontos de atenção.',
    order_index: 4,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
  {
    id: 'mom-07b-5',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_key: 'quando_funciona_melhor',
    title: 'Quando meu corpo funciona melhor',
    subtitle: 'Reconhecendo seus recursos naturais e momentos de vitalidade.',
    order_index: 5,
    is_active: true,
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
]

/**
 * Definições Normativas de Prompts do Build 07B
 */
export const BUILD_07B_PROMPTS: CerPromptRecord[] = [
  // ==========================================
  // MOMENTO 1: MEU JEITO DE FUNCIONAR
  // ==========================================

  // E1: corpo_habito_geral (FreeReflection open-first) — Essencial 1
  {
    id: 'p-07b-e1',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-1',
    step_order: 1,
    prompt_order: 1,
    step_title: 'Meu corpo no dia a dia',
    step_subtitle: 'Uma primeira reflexão aberta sobre a sua relação com o corpo.',
    component_type: 'FreeReflection',
    prompt_text: 'De maneira geral, como você costuma perceber o funcionamento do seu corpo?',
    helper_text: 'Escreva espontaneamente com suas palavras o que vier à mente.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'corpo_habito_geral',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Precisa de apoio para começar? Veja algumas ideias',
        option_set_ref: 'opt_corpo_habito_apoio',
      },
      option_set: {
        id: 'opt_corpo_habito_apoio',
        items: [
          { id: 'estavel', label: 'Costuma ser bem estável e previsível' },
          { id: 'sensivel', label: 'Muito sensível a mudanças e imprevistos' },
          { id: 'variavel', label: 'Tem fases de muita vitalidade e fases de cansaço' },
          { id: 'forte', label: 'Forte e resistente, raramente reclama' },
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

  // E2: corpo_natureza_habitual (ChoiceCards 3 eixos + mudança) — Essencial 2
  // Prakriti: térmico, energia, estabilidade habitual (longitudinal) + mudança recente (current)
  {
    id: 'p-07b-e2',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-1',
    step_order: 2,
    prompt_order: 1,
    step_title: 'Como é o seu corpo, do jeito dele?',
    step_subtitle: 'Três características de base que costumam acompanhar você.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Em relação à sua temperatura corporal no dia a dia, qual é sua tendência habitual?',
    helper_text: 'Pense em como você sempre foi, ao longo da vida.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'corpo_natureza_habitual_termico',
      concept_key: 'habitual_thermal_tendency',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'mais_frio',
          title: 'Tendo a sentir mais frio que os outros',
          description: 'Pés/mãos gelados com frequência, busco aconchego e calor.',
        },
        {
          id: 'mais_calor',
          title: 'Tendo a sentir mais calor',
          description: 'Corpo aquece rápido, tolero mal ambientes muito quentes.',
        },
        {
          id: 'varia_dia',
          title: 'Varia conforme o dia ou a situação',
          description: 'Às vezes sinto mais frio, outras mais calor, sem um padrão fixo.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Nunca reparei com clareza',
          description: 'Não percebo uma tendência nítida.',
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

  // E2b: Energia Habitual (Prakriti eixo 2)
  {
    id: 'p-07b-e2b',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-1',
    step_order: 3,
    prompt_order: 2,
    step_title: 'Seu ritmo habitual de energia',
    step_subtitle: 'Como sua disposição costuma se distribuir ao longo dos dias.',
    component_type: 'ChoiceCards',
    prompt_text: 'Sobre o seu nível e ritmo de energia ao longo do tempo, como costuma ser?',
    helper_text: 'Referente ao seu padrão histórico de base.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'corpo_natureza_habitual_energia',
      concept_key: 'habitual_energy_pattern',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'energia_constante',
          title: 'Energia mais constante e resistente',
          description: 'Ritmo sustentado ao longo do dia, cansaço demora a aparecer.',
        },
        {
          id: 'alterna_bastante',
          title: 'Alterna bastante ou oscila com frequência',
          description: 'Picos de energia seguidos por quedas perceptíveis.',
        },
        {
          id: 'acelera_cai',
          title: 'Acelera rápido com entusiasmo e depois esgota',
          description: 'Intensidade pontual de arranque, necessita de recarga.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Difícil definir',
          description: 'Nunca observei esse ritmo com atenção.',
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

  // E2c: Estabilidade Habitual (Prakriti eixo 3)
  {
    id: 'p-07b-e2c',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-1',
    step_order: 4,
    prompt_order: 3,
    step_title: 'Estabilidade do seu funcionamento',
    step_subtitle: 'Constância corporal frente a rotinas e estações.',
    component_type: 'ChoiceCards',
    prompt_text: 'Em relação à estabilidade e peso/constituição do seu corpo, o que mais combina?',
    helper_text: 'Traço habitual de base, não o momento de hoje.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'corpo_natureza_habitual_estabilidade',
      concept_key: 'habitual_stability_pattern',
      temporality: 'longitudinal',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'bastante_estavel',
          title: 'Bastante estável',
          description: 'Peso, apetite e sono costumam mudar pouco.',
        },
        {
          id: 'tem_fases',
          title: 'Funciona por fases perceptíveis',
          description: 'Oscilações normais dependendo de ciclos ou fases da vida.',
        },
        {
          id: 'varia_estacao',
          title: 'Muda bastante conforme o clima ou a estação',
          description: 'Muito influenciado pelo ambiente e temperatura externa.',
        },
        { id: 'nao_sei', title: 'Não sei dizer', description: 'Sem clareza sobre estabilidade.' },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // E2d: Mudança recente versus habitual (Vikriti Gateway - Current)
  {
    id: 'p-07b-e2d',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-1',
    step_order: 5,
    prompt_order: 4,
    step_title: 'O momento atual e seu jeito de funcionar',
    step_subtitle: 'Observando se houve alteração recente em relação ao habitual.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Ultimamente, alguma dessas características de base mudou ou parece diferente do seu habitual?',
    helper_text: 'Pensando nas últimas semanas ou meses.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'corpo_natureza_mudanca_recente',
      concept_key: 'current_vs_habitual_nature_change',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'mudou_sim',
          title: 'Sim, percebo que algo está diferente do meu normal',
          description: 'Sinto mudanças de temperatura, ritmo ou estabilidade.',
        },
        {
          id: 'nao_assim_mesmo',
          title: 'Não, continua sendo assim mesmo',
          description: 'Meu corpo continua dentro do meu padrão conhecido.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Não tenho certeza',
          description: 'Não saberia precisar se mudou.',
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

  // ==========================================
  // MOMENTO 2: A VIAGEM DA REFEIÇÃO (E3, E4 + Branches)
  // ==========================================

  // E3: refeicao_padrao (Gateway ChoiceCards) — Essencial 3
  {
    id: 'p-07b-e3',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-2',
    step_order: 6,
    prompt_order: 1,
    step_title: 'Sua digestão no dia a dia',
    step_subtitle: 'Um ponto de partida sobre como a comida assenta no seu corpo.',
    component_type: 'ChoiceCards',
    prompt_text: 'No seu dia a dia, como costuma ser a sua digestão e a sensação após comer?',
    helper_text: 'Escolha a opção que melhor retrata a sua média habitual.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'refeicao_padrao',
      concept_key: 'meal_digestion_general_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'tranquila',
          title: 'Costuma ser tranquila',
          description: 'Como bem, digiro com facilidade e o corpo fica leve.',
        },
        {
          id: 'costuma_variar',
          title: 'Costuma variar',
          description: 'Tem dias em que vai bem, outros com fome irregular ou digestão instável.',
        },
        {
          id: 'costuma_incomodar',
          title: 'Costuma incomodar ou pesar',
          description: 'Com frequência sinto estufamento, lentidão, queimação ou desconforto.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei dizer / Não costumo prestar atenção',
          description: 'Não tenho percepção clara sobre isso.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_variar',
            when: { any_of: [{ field: 'choice', operator: 'equals', value: 'costuma_variar' }] },
            then: { action: 'open_branch', target_prompt_key: 'refeicao_regularidade_a2' },
          },
          {
            id: 'r_incomodar',
            when: { any_of: [{ field: 'choice', operator: 'equals', value: 'costuma_incomodar' }] },
            then: { action: 'open_branch', target_prompt_key: 'refeicao_pos_reacoes_a5' },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // E4: refeicao_viagem (Narrativa ANTES -> DURANTE -> DEPOIS) — Essencial 4
  {
    id: 'p-07b-e4',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-2',
    step_order: 7,
    prompt_order: 2,
    step_title: 'A viagem de uma refeição',
    step_subtitle: 'Observando os três momentos: chegada do apetite, o comer e a digestão.',
    component_type: 'FreeReflection',
    prompt_text:
      'Pensando na viagem de uma refeição comum (antes, durante e depois): como a fome chega, como você come e como o corpo se sente 1 a 2 horas depois?',
    helper_text: 'Conte com calma essa sequência no seu ritmo.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'refeicao_viagem',
      concept_key: 'meal_journey',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Ver marcadores de apoio para guiar a reflexão',
        option_set_ref: 'opt_refeicao_viagem_apoio',
      },
      option_set: {
        id: 'opt_refeicao_viagem_apoio',
        items: [
          { id: 'antes', label: 'Antes: Fome clara no horário certo vs fome imprevisível' },
          { id: 'durante', label: 'Durante: Como devagar apreciando vs como rápido ou distraída' },
          {
            id: 'depois',
            label: 'Depois: Disposição e leveza vs sensação de peso ou digestão incompleta',
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

  // A2: refeicao_regularidade (Adaptive Branch de Variação)
  {
    id: 'p-07b-a2',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-2',
    step_order: 8,
    prompt_order: 3,
    step_title: 'Regularidade e Apetite',
    step_subtitle: 'Compreendendo como a oscilação se apresenta.',
    component_type: 'ChoiceCards',
    prompt_text: 'Como costuma ser essa variação no seu apetite?',
    helper_text: 'Identifique o padrão mais comum quando oscila.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'refeicao_regularidade_a2',
      concept_key: 'hunger_regular_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'fome_imprevisivel',
          title: 'Fome em horários imprevisíveis',
          description: 'Dias com muita fome, dias sem vontade de comer.',
        },
        {
          id: 'fome_sensivel_emocao',
          title: 'Muito ligada ao estresse ou rotina',
          description: 'Se o dia aperta, o apetite fecha ou desregula.',
        },
        {
          id: 'tolera_pouco_atraso',
          title: 'Não tolero atraso na refeição',
          description: 'Se passar do horário sinto tontura, irritação ou dor de cabeça.',
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

  // A5: refeicao_pos_reacoes (Adaptive Branch de Desconforto)
  {
    id: 'p-07b-a5',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-2',
    step_order: 9,
    prompt_order: 4,
    step_title: 'Reações pós-refeição',
    step_subtitle: 'O que você costuma sentir com frequência após comer.',
    component_type: 'MultiSelectCards',
    prompt_text: 'Quais dessas sensações costumam voltar após as suas refeições?',
    helper_text: 'Selecione apenas as que acontecem com frequência.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'refeicao_pos_reacoes_a5',
      concept_key: 'post_meal_reactions',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      minSelect: 1,
      maxSelect: 4,
      options: [
        {
          id: 'peso_lentidao',
          title: 'Sensação de peso e lentidão intensa',
          description: 'Vontade imediata de deitar, digestão parece parada.',
        },
        {
          id: 'estufamento_gases',
          title: 'Estufamento abdominal e gases',
          description: 'Barriga distendida ou desconforto após pouco alimento.',
        },
        {
          id: 'queimacao_acidez',
          title: 'Sensação de calor, queimação ou azia',
          description: 'Calor subindo pelo peito ou desconforto ácido.',
        },
        {
          id: 'digestao_incompleta',
          title: 'Sensação de que o alimento não assentou',
          description: 'Gosto do alimento voltando horas depois.',
        },
        {
          id: 'sonolencia_excessiva',
          title: 'Sono excessivo e falta de clareza',
          description: 'Cabeça pesada logo após terminar de comer.',
        },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
        routes: [
          {
            id: 'r_to_eliminacao',
            when: {
              any_of: [
                { field: 'choice', operator: 'contains', value: 'peso_lentidao' },
                { field: 'choice', operator: 'contains', value: 'estufamento_gases' },
                { field: 'choice', operator: 'contains', value: 'digestao_incompleta' },
              ],
            },
            then: { action: 'open_branch', target_prompt_key: 'refeicao_eliminacao_a6' },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // A6: refeicao_eliminacao (Adaptive Branch de Eliminação)
  {
    id: 'p-07b-a6',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-2',
    step_order: 10,
    prompt_order: 5,
    step_title: 'Ritmo de eliminação',
    step_subtitle: 'A frequência e conforto do intestino.',
    component_type: 'ChoiceCards',
    prompt_text: 'Pensando na regularidade do seu intestino, o que melhor descreve seu ritmo?',
    helper_text: 'Padrão mais habitual nos últimos tempos.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'refeicao_eliminacao_a6',
      concept_key: 'elimination_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'regular_diario',
          title: 'Regular e diário sem esforço',
          description: 'Pela manhã, sensação de esvaziamento completo.',
        },
        {
          id: 'lento_pesado',
          title: 'Lento, irregular ou com dias de intervalo',
          description: 'Tende a ressecar ou demorar para funcionar.',
        },
        {
          id: 'acelerado_pastoso',
          title: 'Frequente, rápido ou amolecido',
          description: 'Várias vezes ao dia, sensível ao que come.',
        },
        {
          id: 'muito_oscilante',
          title: 'Muda constantemente',
          description: 'Dias preso, dias solto.',
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

  // ==========================================
  // MOMENTO 3: MEU RITMO DE DESCANSO (E5 + Registro Único)
  // ==========================================

  // E5: descanso_status (Reuso-confirm ou registro habitual) — Essencial 5
  {
    id: 'p-07b-e5',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-3',
    step_order: 11,
    prompt_order: 1,
    step_title: 'Seu sono e descanso',
    step_subtitle: 'Verificando como você acorda e descansa.',
    component_type: 'ChoiceCards',
    prompt_text: 'Como costuma ser a qualidade e reparação do seu sono?',
    helper_text: 'Avalie como você costuma se sentir ao despertar.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'descanso_status',
      concept_key: 'sleep_quality_pattern',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      context_reuse: {
        concept_key: 'habitual_sleep_pattern',
        temporality: 'longitudinal',
      },
      options: [
        {
          id: 'reparador',
          title: 'Sono reparador',
          description: 'Acordo com disposição e energia para o dia.',
        },
        {
          id: 'dificuldade_iniciar',
          title: 'Demoro a pegar no sono',
          description: 'Mente ativa à noite, custo a adormecer.',
        },
        {
          id: 'acorda_noite',
          title: 'Acordo no meio da noite com frequência',
          description: 'Sono fragmentado ou despertares de madrugada.',
        },
        {
          id: 'acorda_cansado',
          title: 'Durmo horas suficientes mas acordo cansada ou pesada',
          description: 'Sensação de não ter descansado de verdade.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_sleep_mudou',
            when: {
              any_of: [
                { field: 'choice', operator: 'equals', value: 'acorda_cansado' },
                { field: 'choice', operator: 'equals', value: 'mudou' },
              ],
            },
            then: { action: 'open_branch', target_prompt_key: 'descanso_recent_change' },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // descanso_recent_change: Adaptive Branch de Sono Mudou (Current)
  {
    id: 'p-07b-descanso-change',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-3',
    step_order: 12,
    prompt_order: 2,
    step_title: 'O que mudou no seu descanso?',
    step_subtitle: 'Contextualizando alterações recentes do sono.',
    component_type: 'ChoiceCards',
    prompt_text: 'Essa dificuldade ou cansaço no sono começou recentemente?',
    helper_text: 'Diferenciando o momento atual do histórico de vida.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'descanso_recent_change',
      concept_key: 'recent_sleep_change',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'recente_semanas',
          title: 'Começou nas últimas semanas ou meses',
          description: 'Antes meu descanso funcionava melhor.',
        },
        {
          id: 'antigo_habitual',
          title: 'É um padrão antigo de muitos anos',
          description: 'Sempre foi difícil para mim.',
        },
        {
          id: 'fase_estresse',
          title: 'Está ligado a uma sobrecarga ou fase pontual',
          description: 'Percebo relação direta com o momento atual.',
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

  // ==========================================
  // MOMENTO 4: O QUE COSTUMA VOLTAR (E6, BodyMap + AMA Branching)
  // ==========================================

  // E6: recorrente_pergunta_oficial — Essencial 6
  {
    id: 'p-07b-e6',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-4',
    step_order: 13,
    prompt_order: 1,
    step_title: 'Sensações recorrentes no corpo',
    step_subtitle: 'Identificando o que costuma se manifestar repetidamente.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Pensando nos últimos meses, existe alguma sensação ou alteração no seu corpo que acontece com frequência ou costuma voltar?',
    helper_text: 'Pense em sinais recorrentes, não apenas no que sente hoje.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'recorrente_pergunta_oficial',
      concept_key: 'recurring_body_sensation_presence',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'sim_recorrente',
          title: 'Sim, há sensações que costumam voltar',
          description: 'Existem sinais repetidos que eu já conheço.',
        },
        {
          id: 'nao_percebo_nada',
          title: 'Não percebo nada que costume voltar',
          description: 'Meu corpo geralmente não apresenta incômodos repetidos.',
        },
        {
          id: 'nao_sei',
          title: 'Não sei / Não tenho certeza',
          description: 'Nunca parei para observar.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_tem_recorrente',
            when: { any_of: [{ field: 'choice', operator: 'equals', value: 'sim_recorrente' }] },
            then: { action: 'open_branch', target_prompt_key: 'recorrente_familia' },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // recorrente_familia: Adaptive Branch
  // Atributo declarativo localization_relevant por opção
  {
    id: 'p-07b-rec-familia',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-4',
    step_order: 14,
    prompt_order: 2,
    step_title: 'Tipo de sensação que costuma voltar',
    step_subtitle: 'Escolha a família de sinais corporais mais presente.',
    component_type: 'ChoiceCards',
    prompt_text: 'Que tipo de sensação costuma voltar com mais frequência?',
    helper_text: 'Selecione a categoria principal.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'recorrente_familia',
      concept_key: 'recurring_sensation_family',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'dor_tensao',
          title: 'Dor muscular ou tensão',
          description: 'Contratura, aperto ou desconforto físico localizado.',
          localization_relevant: true,
        },
        {
          id: 'formigamento_dormencia',
          title: 'Formigamento ou dormência',
          description: 'Sensação neural em partes do corpo.',
          localization_relevant: true,
        },
        {
          id: 'inchaco_localizado',
          title: 'Inchaço ou retenção localizada',
          description: 'Pés, pernas, mãos ou área específica.',
          localization_relevant: true,
        },
        {
          id: 'sensacao_localizada',
          title: 'Outra sensação localizada',
          description: 'Pontadas, queimação pontual ou aperto.',
          localization_relevant: true,
        },
        {
          id: 'cansaco_geral',
          title: 'Cansaço ou falta de energia geral',
          description: 'Sensação difusa em todo o organismo.',
          localization_relevant: false,
        },
        {
          id: 'frio_calor_geral',
          title: 'Calafrios ou calorões pelo corpo todo',
          description: 'Sensação térmica sistêmica.',
          localization_relevant: false,
        },
        {
          id: 'digestao_geral',
          title: 'Desconforto digestivo geral',
          description: 'Sensação gástrica ou abdominal ampla.',
          localization_relevant: false,
        },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
        routes: [
          {
            id: 'r_open_bodymap',
            when: {
              any_of: [
                { field: 'choice', operator: 'equals', value: 'dor_tensao' },
                { field: 'choice', operator: 'equals', value: 'formigamento_dormencia' },
                { field: 'choice', operator: 'equals', value: 'inchaco_localizado' },
                { field: 'choice', operator: 'equals', value: 'sensacao_localizada' },
              ],
            },
            then: { action: 'open_branch', target_prompt_key: 'corpo_bodymap_recorrente' },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // BodyMap: Aberto SOMENTE quando localization_relevant = true
  {
    id: 'p-07b-bodymap',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-4',
    step_order: 15,
    prompt_order: 3,
    step_title: 'Onde costuma voltar no corpo',
    step_subtitle: 'Indique a região onde a sensação costuma se manifestar.',
    component_type: 'BodyMap',
    prompt_text: 'Em quais regiões do corpo essa sensação costuma voltar?',
    helper_text: 'Toque na silhueta ou use a lista acessível abaixo para selecionar.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'corpo_bodymap_recorrente',
      concept_key: 'recurring_sensation_location',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      maxSelect: 4,
      regions: [
        { id: 'head_jaw', label: 'Cabeça, Têmporas e Mandíbula' },
        { id: 'neck_shoulders', label: 'Pescoço e Ombros' },
        { id: 'upper_back', label: 'Costas Superior e Escápulas' },
        { id: 'lumbar', label: 'Região Lombar' },
        { id: 'chest', label: 'Peito e Tórax' },
        { id: 'abdomen', label: 'Abdômen e Ventre' },
        { id: 'arms_hands', label: 'Braços, Punhos e Mãos' },
        { id: 'legs_feet', label: 'Pernas, Joelhos e Pés' },
      ],
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // AMA OBSERVATIONAL BRANCH (A7 Língua & A8 Lentidão)
  // Aberto estritamente por convergência de 2+ categorias determinísticas
  {
    id: 'p-07b-a7-lingua',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-4',
    step_order: 16,
    prompt_order: 4,
    step_title: 'Sinais de processamento no corpo',
    step_subtitle: 'Uma observação simples matinal sobre como seu corpo acorda.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Ao acordar pela manhã, você costuma notar a língua com alguma camada branca ou pastosa?',
    helper_text: 'Apenas uma auto-observação rotineira, sem necessidade de foto ou análise médica.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'ama_observacao_lingua',
      concept_key: 'morning_tongue_coating_observation',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'nao',
          title: 'Não costumo notar',
          description: 'Língua limpa e rosada na maior parte dos dias.',
        },
        {
          id: 'as_vezes',
          title: 'Às vezes',
          description: 'Especialmente após noites mal dormidas ou refeições pesadas.',
        },
        {
          id: 'frequentemente',
          title: 'Frequentemente / Quase todo dia',
          description: 'Camada branca ou amarelada constante ao acordar.',
        },
        {
          id: 'nunca_reparei',
          title: 'Nunca reparei nisso',
          description: 'Não costumo olhar para a língua pela manhã.',
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
    id: 'p-07b-a8-lentidao',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-4',
    step_order: 17,
    prompt_order: 5,
    step_title: 'Sensação matinal de peso',
    step_subtitle: 'Como o corpo desperta para as atividades do dia.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Você costuma acordar com uma sensação de peso corporal ou lentidão para “engrenar”, mesmo após ter dormido?',
    helper_text: 'Sensação nas primeiras horas da manhã.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'ama_observacao_peso_matinal',
      concept_key: 'morning_heaviness_inertia',
      temporality: 'recurring',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'raro_ou_nao',
          title: 'Raramente ou não sinto isso',
          description: 'Desperto ativo ou acordo normalmente.',
        },
        {
          id: 'as_vezes',
          title: 'Às vezes acontece',
          description: 'Em dias específicos de cansaço acumulado.',
        },
        {
          id: 'frequente',
          title: 'Frequentemente sinto esse peso',
          description: 'O corpo demora horas para se sentir leve e disposto.',
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

  // ==========================================
  // MOMENTO 5: QUANDO MEU CORPO FUNCIONA MELHOR & CONDIÇÃO DE SAÚDE
  // ==========================================

  // E7: corpo_condicao_saude (Gateway Sim / Não / Prefiro conversar) — Essencial 7
  {
    id: 'p-07b-e7',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-5',
    step_order: 18,
    prompt_order: 1,
    step_title: 'Condição de saúde ou diagnóstico prévio',
    step_subtitle: 'Um espaço seguro para compartilhar o que é relevante para o seu cuidado.',
    component_type: 'ChoiceCards',
    prompt_text:
      'Existe alguma condição de saúde ou diagnóstico que seja importante considerarmos para compreender seu corpo?',
    helper_text: 'Você tem total liberdade para contar aqui ou guardar para a conversa ao vivo.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'corpo_condicao_saude',
      concept_key: 'health_condition_disclosure',
      temporality: 'current',
      access_destination: 'participant_shared',
      options: [
        {
          id: 'sim_desejo_contar',
          title: 'Sim, desejo registrar uma condição ou diagnóstico',
          description: 'Quero deixar anotado para a profissional.',
        },
        {
          id: 'nao_ha_condicao',
          title: 'Não, não tenho nenhuma condição ou diagnóstico relevante',
          description: 'Meu histórico não possui condições ativas.',
        },
        {
          id: 'prefiro_conversar',
          title: 'Prefiro conversar sobre isso no encontro',
          description: 'Prefiro trazer essa conversa pessoalmente.',
        },
      ],
      orchestration: {
        path_role: 'essential',
        requires_branch_open: false,
        routes: [
          {
            id: 'r_condicao_narrative',
            when: { any_of: [{ field: 'choice', operator: 'equals', value: 'sim_desejo_contar' }] },
            then: { action: 'open_branch', target_prompt_key: 'health_condition_narrative' },
          },
        ],
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // health_condition_narrative: Adaptive Branch (access_destination=shared_care com microcopy prévia)
  {
    id: 'p-07b-condicao-narrative',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-5',
    step_order: 19,
    prompt_order: 2,
    step_title: 'Compartilhando sua condição de saúde',
    step_subtitle: 'Isso ficará visível para a sua profissional de referência.',
    component_type: 'FreeReflection',
    prompt_text:
      'Conte brevemente sobre essa condição ou diagnóstico (ex.: uso contínuo de medicamentos, cirurgias ou diagnósticos clínicos):',
    helper_text:
      'Você pode escrever com tranquilidade. Se mudar de ideia, há a opção de conversar pessoalmente.',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'health_condition_narrative',
      concept_key: 'health_condition_narrative',
      temporality: 'current',
      access_destination: 'shared_care',
      open_first: {
        enabled: true,
        help_label: 'Prefere contar no encontro ao invés de escrever?',
        option_set_ref: 'opt_condicao_narrativa_apoio',
      },
      option_set: {
        id: 'opt_condicao_narrativa_apoio',
        items: [{ id: 'prefiro_encontro', label: 'Prefiro contar isso em detalhes no encontro' }],
      },
      orchestration: {
        path_role: 'adaptive',
        requires_branch_open: true,
      },
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },

  // E8: corpo_melhor_dias (FreeReflection open-first) — Essencial 8
  {
    id: 'p-07b-e8',
    experience_id: CORPO_FISIOLOGIA_EXPERIENCE_ID,
    moment_id: 'mom-07b-5',
    step_order: 20,
    prompt_order: 3,
    step_title: 'Quando meu corpo funciona melhor',
    step_subtitle: 'Reconhecendo recursos corporais e momentos de vitalidade.',
    component_type: 'FreeReflection',
    prompt_text:
      'Pensando nos dias em que seu corpo parece funcionar melhor, o que costuma estar presente?',
    helper_text:
      'Alimentação mais leve, noite boa de sono, ar livre, silêncio, movimento... o que faz diferença para você?',
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: 'corpo_melhor_dias',
      concept_key: 'body_functioning_better_conditions',
      temporality: 'context_dependent',
      access_destination: 'participant_shared',
      open_first: {
        enabled: true,
        help_label: 'Ver exemplos de recursos e condições favoráveis',
        option_set_ref: 'opt_corpo_melhor_apoio',
      },
      option_set: {
        id: 'opt_corpo_melhor_apoio',
        items: [
          { id: 'sono_bom', label: 'Ter acordado sem despertador e descansada' },
          { id: 'comida_quente', label: 'Refeições feitas com calma, quentes e frescas' },
          { id: 'movimento_suave', label: 'Uma caminhada, alongamento ou contato com a natureza' },
          { id: 'rotina_sem_pressa', label: 'Um dia com menos urgências e espaço para respirar' },
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

/**
 * Retorna lista canônica de chaves essenciais do caminho participant-facing
 */
export const ESSENTIAL_PATH_PROMPT_KEYS = [
  'corpo_habito_geral', // E1
  'corpo_natureza_habitual_termico', // E2a
  'refeicao_padrao', // E3
  'refeicao_viagem', // E4
  'descanso_status', // E5
  'recorrente_pergunta_oficial', // E6
  'corpo_condicao_saude', // E7
  'corpo_melhor_dias', // E8
]
