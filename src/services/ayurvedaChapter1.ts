/**
 * AYURVEDA CANÔNICO — LOTE A: FUNDAÇÃO DA NOVA AVALIAÇÃO + CAPÍTULO 1
 * "Minha estrutura e minhas características"
 *
 * Princípios e Separação Epistêmica:
 * 1. Resposta vazia (unanswered), "Não sei identificar" (explicit_unsure) e "Prefiro não responder" (explicit_refusal)
 *    são TRÊS estados distintos e não pontuados como zero.
 * 2. Sexo, gênero, pronome ou estética do avatar NUNCA definem ou pré-selecionam resposta clínica.
 * 3. Nenhuma característica isolada define dosha, Prakriti ou Vikriti.
 * 4. Nenhum dosha, percentual, ranking, pontuação ou diagnóstico automático é gerado.
 * 5. IDs canônicos versionados NOVOS (prefixo `ayv_c1_`), preservando o questionário legado intacto.
 */

import { CerExperienceMomentRecord, CerExperienceRecord, CerPromptRecord } from '@/types/cer'

export const AYURVEDA_EXPERIENCE_VERSION = '2.0.0'
export const AYURVEDA_CORPO_EXPERIENCE_ID = 'exp-corpo-fisiologia-07b'
export const AYURVEDA_CHAPTER_1_ID = 'capitulo-1-estrutura-caracteristicas'

export type ClinicalTimeLayer = 'stable_history' | 'habitual'
export type ClinicalStability = 'lifelong' | 'long_term' | 'partial' | 'changed' | 'uncertain'
export type ClinicalHistoricalConfidence = 'high' | 'medium' | 'low' | 'unknown'
export type ClinicalSource = 'participant_self_report'

export interface AyurvedaCanonicalResponseMetadata {
  prompt_key: string
  domain: 'corpo_fisiologia' | 'ayurveda'
  option_ids: string[]
  raw_text?: string
  time_layer: ClinicalTimeLayer
  stability: ClinicalStability
  source: ClinicalSource
  historical_confidence: ClinicalHistoricalConfidence
  explicit_unsure: boolean
  explicit_refusal: boolean
  answered_at: string
  experience_version: string
  chapter_id: string
  contradiction_flag?: boolean
  notes_for_professional?: string
}

export interface AyurvedaChapter1State {
  // Tela 1: Estrutura Corporal Habitual
  structure_choice?: string // 'light_narrow' | 'intermediate' | 'broad_solid' | 'two_figures' | 'changed_lot' | 'dont_know' | 'refusal'
  secondary_structure_choice?: string // preenchido se 'two_figures'
  structure_duration?: string // 'lifelong' | 'most_adult' | 'some_phases' | 'changed_lot' | 'dont_know' | 'refusal'

  // Tela 2: Pele Habitual (máximo 2)
  skin_choices?: string[]

  // Tela 3: Cabelo Habitual (máximo 2)
  hair_choices?: string[]

  // Tela 4: Temperatura Corporal Habitual (seleção única)
  temperature_choice?: string

  // Tela 5: Sede, Bebida e Transpiração (3 blocos independentes)
  thirst_choice?: string
  drink_temperature_choice?: string
  sweat_choice?: string
}

// Prompt IDs e Keys canônicos do Capítulo 1
export const AYV_C1_PROMPTS = {
  P1_STRUCTURE: {
    id: 'ayv_c1_p1_estrutura_corporal',
    key: 'ayv_c1_estrutura_corporal',
    step_order: 1,
    title: 'Estrutura corporal habitual',
  },
  P1_DURATION: {
    id: 'ayv_c1_p1_estrutura_duracao',
    key: 'ayv_c1_estrutura_duracao',
    step_order: 1,
    title: 'Duração da estrutura habitual',
  },
  P2_SKIN: {
    id: 'ayv_c1_p2_pele_habitual',
    key: 'ayv_c1_pele_habitual',
    step_order: 2,
    title: 'Pele habitual',
  },
  P3_HAIR: {
    id: 'ayv_c1_p3_cabelo_habitual',
    key: 'ayv_c1_cabelo_habitual',
    step_order: 3,
    title: 'Cabelo habitual',
  },
  P4_TEMPERATURE: {
    id: 'ayv_c1_p4_temperatura_habitual',
    key: 'ayv_c1_temperatura_habitual',
    step_order: 4,
    title: 'Temperatura corporal habitual',
  },
  P5_THIRST: {
    id: 'ayv_c1_p5a_sede_habitual',
    key: 'ayv_c1_sede_habitual',
    step_order: 5,
    title: 'Sede habitual',
  },
  P5_DRINK_TEMP: {
    id: 'ayv_c1_p5b_temperatura_bebida',
    key: 'ayv_c1_temperatura_bebida',
    step_order: 5,
    title: 'Temperatura de bebida confortável',
  },
  P5_SWEAT: {
    id: 'ayv_c1_p5c_transpiracao_habitual',
    key: 'ayv_c1_transpiracao_habitual',
    step_order: 5,
    title: 'Transpiração habitual',
  },
} as const

// Definição dos 4 Capítulos
export interface AyurvedaChapterDefinition {
  id: string
  number: number
  title: string
  shortTitle: string
  subtitle: string
  active: boolean
  statusLabel?: string
}

export const AYURVEDA_FOUR_CHAPTERS: AyurvedaChapterDefinition[] = [
  {
    id: 'capitulo-1-estrutura-caracteristicas',
    number: 1,
    title: 'Capítulo 1 — Minha estrutura e minhas características',
    shortTitle: 'Estrutura e características',
    subtitle: 'Estrutura corporal, pele, cabelo, temperatura e sensações basais',
    active: true,
  },
  {
    id: 'capitulo-2-ritmo-corpo',
    number: 2,
    title: 'Capítulo 2 — O ritmo do meu corpo',
    shortTitle: 'O ritmo do meu corpo',
    subtitle: 'Digestão, fome, rotina, eliminação e sono',
    active: false,
    statusLabel: 'Será liberado na continuação desta experiência',
  },
  {
    id: 'capitulo-3-diferente-agora',
    number: 3,
    title: 'Capítulo 3 — O que está diferente agora',
    shortTitle: 'O que está diferente agora',
    subtitle: 'Sintomas recentes, variações sazonais e mudanças percebidas',
    active: false,
    statusLabel: 'Será liberado na continuação desta experiência',
  },
  {
    id: 'capitulo-4-corpo-sintese',
    number: 4,
    title: 'Capítulo 4 — Meu corpo em síntese',
    shortTitle: 'Meu corpo em síntese',
    subtitle: 'Visão integrativa preparada para a conversa com Daiane',
    active: false,
    statusLabel: 'Será liberado na continuação desta experiência',
  },
]

// Textos canônicos obrigatórios
export const AYV_TEXTS = {
  AVATAR_CONFIRMATION_TITLE: 'Sua representação está pronta',
  AVATAR_CONFIRMATION_BODY:
    'Agora vamos começar a observar algumas características que acompanham o seu corpo ao longo dos anos. Lembre-se de pensar especialmente nos períodos em que você se sentia relativamente bem.',
  START_CHAPTER_1_BTN: 'Começar o Capítulo 1',
  OPENING_TITLE: 'Minha estrutura e minhas características',
  OPENING_BODY:
    "Algumas características acompanham nosso corpo há muitos anos. Outras mudam conforme a rotina, o clima, os hormônios, a saúde e as diferentes fases da vida.\n\nNeste primeiro capítulo, procure lembrar como seu corpo costuma ser ao longo dos anos, especialmente nos períodos em que você se sentia relativamente bem. Mais adiante, haverá um espaço separado para registrar o que mudou no seu momento atual.\n\nNão existem respostas certas ou erradas. Se tiver dúvida, você poderá marcar 'Não sei identificar'.",
  OPENING_SIGNATURE: 'Com carinho, Daia',
  ESTIMATED_DURATION: 'Cerca de 3 a 4 minutos',
  CLOSING_FINAL_NOTE:
    'Estas informações são pistas sobre o funcionamento do seu corpo e serão reunidas aos seus ritmos de fome, digestão, eliminação, energia e sono. Nenhuma característica isolada define sua constituição.',
  COMPLETED_TITLE: 'Capítulo 1 concluído',
  COMPLETED_BODY:
    'Suas respostas foram registradas. Na continuação desta experiência, vamos observar os ritmos do seu corpo.',
  REVISION_BANNER: 'Revisão das suas respostas',
  REVISION_RETURN_CMD: 'Voltar ao encerramento',
  CORRECTION_CONFIRMATION_PROMPT:
    'Ao confirmar, você poderá corrigir suas respostas. A versão anterior será preservada no histórico profissional.',
}

// Opções da Tela 1 — Estrutura corporal
export const AYV_TELA1_STRUCTURE_OPTIONS = [
  { id: 'light_narrow', label: 'Estrutura leve ou estreita' },
  { id: 'intermediate', label: 'Estrutura intermediária' },
  { id: 'broad_solid', label: 'Estrutura ampla ou sólida' },
  { id: 'two_figures', label: 'Reconheço características de duas figuras' },
  {
    id: 'changed_lot',
    label: 'Meu corpo mudou bastante e tenho dificuldade de comparar',
    low_confidence: true,
  },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

export const AYV_TELA1_DURATION_OPTIONS = [
  { id: 'lifelong', label: 'Desde a juventude ou o início da vida adulta' },
  { id: 'most_adult', label: 'Durante a maior parte da minha vida adulta' },
  { id: 'some_phases', label: 'Apenas em algumas fases' },
  { id: 'changed_lot', label: 'Meu corpo mudou muito ao longo dos anos', low_confidence: true },
  { id: 'dont_know', label: 'Não sei dizer', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

// Opções da Tela 2 — Pele habitual (até 2 escolhas)
export const AYV_TELA2_SKIN_OPTIONS = [
  { id: 'dry_rough', label: 'Tende a ficar seca, áspera ou repuxando com facilidade' },
  { id: 'thin_reactive', label: 'Parece fina ou delicada e reage facilmente ao ambiente' },
  { id: 'warm_sensitive', label: 'Costuma ser quente, sensível ou avermelhar com facilidade' },
  { id: 'balanced', label: 'Geralmente mantém textura e hidratação relativamente equilibradas' },
  { id: 'soft_oily', label: 'Tende a ser macia, úmida ou naturalmente oleosa' },
  {
    id: 'varies_region',
    label: 'Comporta-se de maneiras diferentes conforme a região ou a estação',
  },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true, exclusive: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true, exclusive: true },
]

// Opções da Tela 3 — Cabelo habitual (até 2 escolhas)
export const AYV_TELA3_HAIR_OPTIONS = [
  { id: 'fine_delicate', label: 'Fios finos ou delicados' },
  { id: 'dry_tangled', label: 'Tendem a ressecar, embaraçar ou quebrar com facilidade' },
  { id: 'balanced', label: 'Fios intermediários, com comportamento relativamente equilibrado' },
  { id: 'thick_dense', label: 'Fios grossos, densos ou pesados' },
  { id: 'oily_roots', label: 'Raiz naturalmente oleosa ou cabelo que pesa com facilidade' },
  { id: 'mixed_varies', label: 'Misturam características ou variam bastante' },
  {
    id: 'no_reference',
    label: 'Não tenho referência suficiente sobre meu cabelo natural',
    is_unsure: true,
    exclusive: true,
  },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true, exclusive: true },
]

// Opções da Tela 4 — Temperatura habitual (seleção única)
export const AYV_TELA4_TEMPERATURE_OPTIONS = [
  {
    id: 'cold_easily',
    label: 'Sinto frio com facilidade, especialmente nas mãos e nos pés',
  },
  { id: 'heat_easily', label: 'Sinto calor com facilidade e sofro em ambientes quentes' },
  { id: 'stable', label: 'Minha temperatura costuma ser relativamente estável' },
  { id: 'alternates', label: 'Alterno bastante entre frio e calor' },
  { id: 'varies_climate', label: 'Depende muito do clima, do ciclo ou da fase que estou vivendo' },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

// Opções da Tela 5 — Sede, Bebida e Transpiração (3 blocos)
export const AYV_TELA5_THIRST_OPTIONS = [
  { id: 'varies_late', label: 'Varia bastante ou percebo tarde que preciso beber água' },
  { id: 'frequent', label: 'É frequente e claramente percebida' },
  { id: 'discreet', label: 'É discreta e posso passar bastante tempo sem sentir sede' },
  { id: 'moderate_constant', label: 'É moderada e relativamente constante' },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

export const AYV_TELA5_DRINK_TEMP_OPTIONS = [
  { id: 'warm_hot', label: 'Morna ou quente' },
  { id: 'room_temp', label: 'Em temperatura ambiente' },
  { id: 'cool_cold', label: 'Fresca ou gelada' },
  { id: 'varies_climate', label: 'Varia conforme o clima e o momento' },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

export const AYV_TELA5_SWEAT_OPTIONS = [
  { id: 'sweats_little', label: 'Transpiro pouco, mesmo com calor ou esforço moderado' },
  { id: 'moderate_predictable', label: 'Transpiro de forma moderada e previsível' },
  { id: 'sweats_easily', label: 'Transpiro com facilidade ou em quantidade significativa' },
  {
    id: 'varies_stress',
    label: 'Varia bastante conforme estresse, clima, ciclo ou atividade',
  },
  { id: 'dont_know', label: 'Não sei identificar', is_unsure: true },
  { id: 'refusal', label: 'Prefiro não responder', is_refusal: true },
]

/**
 * Mapeador determinístico para organização literal do encerramento (Seção 4 da spec):
 * 1. "Características que você reconhece há mais tempo"
 * 2. "Características que parecem variar conforme o contexto"
 * 3. "Pontos que ainda precisam ser compreendidos" (dúvidas, recusas, mudanças acentuadas ou ausência de referência)
 */
export interface CategorizedSummaryItem {
  promptLabel: string
  optionLabel: string
  rawOptionId: string
  category: 'longer_term' | 'context_variable' | 'points_to_clarify'
}

export function categorizeChapter1Responses(state: AyurvedaChapter1State): {
  longerTerm: CategorizedSummaryItem[]
  contextVariable: CategorizedSummaryItem[]
  pointsToClarify: CategorizedSummaryItem[]
} {
  const longerTerm: CategorizedSummaryItem[] = []
  const contextVariable: CategorizedSummaryItem[] = []
  const pointsToClarify: CategorizedSummaryItem[] = []

  const pushItem = (
    promptLabel: string,
    optionId: string | undefined,
    optionsList: {
      id: string
      label: string
      is_unsure?: boolean
      is_refusal?: boolean
      low_confidence?: boolean
    }[],
  ) => {
    if (!optionId) return
    const opt = optionsList.find((o) => o.id === optionId)
    const label = opt ? opt.label : optionId

    if (opt?.is_unsure || opt?.is_refusal || opt?.low_confidence || optionId === 'no_reference') {
      pointsToClarify.push({
        promptLabel,
        optionLabel: label,
        rawOptionId: optionId,
        category: 'points_to_clarify',
      })
    } else if (
      optionId === 'two_figures' ||
      optionId === 'varies_region' ||
      optionId === 'mixed_varies' ||
      optionId === 'alternates' ||
      optionId === 'varies_climate' ||
      optionId === 'varies_late' ||
      optionId === 'varies_stress' ||
      optionId === 'some_phases'
    ) {
      contextVariable.push({
        promptLabel,
        optionLabel: label,
        rawOptionId: optionId,
        category: 'context_variable',
      })
    } else {
      longerTerm.push({
        promptLabel,
        optionLabel: label,
        rawOptionId: optionId,
        category: 'longer_term',
      })
    }
  }

  // 1. Estrutura corporal
  if (state.structure_choice === 'two_figures') {
    const opt = AYV_TELA1_STRUCTURE_OPTIONS.find((o) => o.id === 'two_figures')
    const opt1 = AYV_TELA1_STRUCTURE_OPTIONS.find((o) => o.id === state.structure_choice)
    const opt2 = AYV_TELA1_STRUCTURE_OPTIONS.find((o) => o.id === state.secondary_structure_choice)
    const combinedLabel = `Reconheço características de duas figuras: ${opt1?.label || ''}${opt2 ? ` e ${opt2.label}` : ''}`
    contextVariable.push({
      promptLabel: 'Estrutura corporal habitual',
      optionLabel: combinedLabel,
      rawOptionId: 'two_figures',
      category: 'context_variable',
    })
  } else {
    pushItem('Estrutura corporal habitual', state.structure_choice, AYV_TELA1_STRUCTURE_OPTIONS)
  }

  if (state.structure_duration) {
    pushItem('Duração da estrutura habitual', state.structure_duration, AYV_TELA1_DURATION_OPTIONS)
  }

  // 2. Pele
  if (state.skin_choices && state.skin_choices.length > 0) {
    for (const s of state.skin_choices) {
      pushItem('Pele habitual', s, AYV_TELA2_SKIN_OPTIONS)
    }
  }

  // 3. Cabelo
  if (state.hair_choices && state.hair_choices.length > 0) {
    for (const h of state.hair_choices) {
      pushItem('Cabelo habitual', h, AYV_TELA3_HAIR_OPTIONS)
    }
  }

  // 4. Temperatura
  pushItem('Temperatura corporal habitual', state.temperature_choice, AYV_TELA4_TEMPERATURE_OPTIONS)

  // 5. Sede, bebida e transpiração
  pushItem('Sede habitual', state.thirst_choice, AYV_TELA5_THIRST_OPTIONS)
  pushItem('Temperatura de bebida', state.drink_temperature_choice, AYV_TELA5_DRINK_TEMP_OPTIONS)
  pushItem('Transpiração habitual', state.sweat_choice, AYV_TELA5_SWEAT_OPTIONS)

  return { longerTerm, contextVariable, pointsToClarify }
}
