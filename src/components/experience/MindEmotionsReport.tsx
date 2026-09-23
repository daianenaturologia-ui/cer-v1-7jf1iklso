import React, { useState } from 'react'
import { ProtectionPatternsChart } from './ProtectionPatternsChart'
import { patternLabel } from '../../services/cerProtectionPatterns'
import { getCerProtectionPatternContent } from '../../services/cerProtectionPatternContent'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  Sparkles,
  Heart,
  Brain,
  Activity,
  Compass,
  FileText,
  BookOpen,
  X,
} from 'lucide-react'

export interface MindEmotionsReportProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  responses: Record<string, any> | any[]
  treatmentVariant?: 'feminino' | 'masculino' | 'neutro' | 'outro'
  className?: string
  isProfessionalView?: boolean
}

// Fallback message constants
export const MSG_RECUSA = 'Você preferiu não responder a esta parte.'
export const MSG_INDISPONIVEL = 'Informação ainda não disponível.'

// Scientific references
export const SCIENTIFIC_REFERENCES = [
  {
    citation:
      'Gross, J. J. (2015). Emotion regulation: Current status and future prospects. Psychological Inquiry, 26(1), 1–26.',
    doiUrl: 'https://doi.org/10.1080/1047840X.2014.940781',
  },
  {
    citation:
      'Aldao, A., Nolen-Hoeksema, S., & Schweizer, S. (2010). Emotion-regulation strategies across psychopathology: A meta-analytic review. Clinical Psychology Review, 30(2), 217–237.',
    doiUrl: 'https://doi.org/10.1016/j.cpr.2009.11.004',
  },
  {
    citation:
      'Kashdan, T. B., & Rottenberg, J. (2010). Psychological flexibility as a fundamental aspect of health. Clinical Psychology Review, 30(7), 865–878.',
    doiUrl: 'https://doi.org/10.1016/j.cpr.2010.03.001',
  },
  {
    citation:
      'Neff, K. D. (2003). Self-compassion: An alternative conceptualization of a healthy attitude toward oneself. Self and Identity, 2(2), 85–101.',
    doiUrl: 'https://doi.org/10.1080/15298860309032',
  },
]

export const SCIENTIFIC_NOTE =
  'As referências apresentam bases científicas relacionadas à regulação emocional, flexibilidade psicológica e relação consigo. Os Padrões de Proteção CER constituem uma ferramenta autoral e exploratória de autopercepção, não um instrumento diagnóstico ou psicométrico validado.'

export const DEVELOPMENT_SECTION_TEXT = `Ao longo da vida, aprendemos diferentes maneiras de buscar segurança, pertencimento, reconhecimento, previsibilidade e proteção emocional.

Alguns padrões podem se fortalecer diante de experiências de crítica, rejeição, instabilidade, excesso de responsabilidades, dificuldade para receber cuidado ou situações nas quais a pessoa não possuía recursos suficientes para enfrentar o que estava acontecendo.

Um funcionamento que hoje limita suas escolhas pode ter sido, em outro momento, uma tentativa possível de adaptação e proteção. Com o tempo, essa resposta pode se tornar automática, mesmo quando o contexto já mudou.

Este relatório não revela sozinho a origem dos seus padrões. Por isso, depois de conhecermos as seis dimensões, também investigaremos acontecimentos importantes da sua história por meio da Linha da Vida. Essa experiência ajudará você e Daiane a compreenderem quais relações podem existir entre sua história, suas formas de proteção e seu funcionamento atual.`

export const CLOSING_SECTION_TEXT = `Este é um primeiro retrato do seu funcionamento em Mente & Emoções. Ele será aprofundado com Daiane e, mais adiante, integrado às demais dimensões do seu Mapa CER.

Reconhecer seus padrões não significa se reduzir a eles. Significa começar a enxergar com mais clareza o que acontece dentro de você, o preço que alguns movimentos cobram e as escolhas que podem ser construídas a partir dessa consciência.

Com carinho,
Daia`

export const PATTERNS_INTRO_TEXT =
  'Você reconheceu estes padrões como os que mais interferem em sua vida neste momento. Eles não definem quem você é. Cada um carrega potências reais, mas pode limitar suas escolhas quando passa a funcionar de maneira automática, intensa ou pouco flexível.'

/**
 * Standardized mapping for emotion labels from question 2
 */
export const EMOTIONS_LABELS_MAP: Record<string, string> = {
  alegria: 'Alegria',
  tristeza: 'Tristeza',
  raiva: 'Raiva',
  medo: 'Medo',
  ansiedade: 'Ansiedade',
  culpa: 'Culpa',
  vergonha: 'Vergonha',
  frustracao: 'Frustração',
  inseguranca: 'Insegurança',
  solidao: 'Solidão',
  sobrecarga: 'Sobrecarga',
  paz: 'Paz / Serenidade',
  esperanca: 'Esperança',
  gratidao: 'Gratidão',
  confusao: 'Confusão',
  apatia: 'Apatia / Desânimo',
}

/**
 * Helper to check explicit refusal vs absent data
 */
export function evaluateFieldState(val: any): {
  isRefusal: boolean
  isEmpty: boolean
  text?: string
  data?: any
} {
  if (val === undefined || val === null) {
    return { isRefusal: false, isEmpty: true }
  }

  if (typeof val === 'object') {
    if (
      val.refusal === true ||
      val.refused === true ||
      val.optOut === true ||
      val.preferNotToAnswer === true
    ) {
      return { isRefusal: true, isEmpty: false }
    }
    if (val.value === '__REFUSED__' || val.value === 'prefer_not_to_answer') {
      return { isRefusal: true, isEmpty: false }
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return { isRefusal: false, isEmpty: true }
      if (val.includes('__REFUSED__') || val.includes('prefer_not_to_answer')) {
        return { isRefusal: true, isEmpty: false }
      }
      return { isRefusal: false, isEmpty: false, data: val }
    }
    if (typeof val.text === 'string') {
      const trimmed = val.text.trim()
      if (!trimmed) return { isRefusal: false, isEmpty: true }
      return { isRefusal: false, isEmpty: false, text: trimmed, data: val }
    }
    if (typeof val.value === 'string') {
      const trimmed = val.value.trim()
      if (!trimmed) return { isRefusal: false, isEmpty: true }
      return { isRefusal: false, isEmpty: false, text: trimmed, data: val }
    }
  }

  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return { isRefusal: false, isEmpty: true }
    if (
      trimmed.toLowerCase() === 'prefiro não responder' ||
      trimmed === '__REFUSED__' ||
      trimmed === 'prefer_not_to_answer'
    ) {
      return { isRefusal: true, isEmpty: false }
    }
    return { isRefusal: false, isEmpty: false, text: trimmed }
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return { isRefusal: false, isEmpty: true }
    if (val.includes('__REFUSED__') || val.includes('prefer_not_to_answer')) {
      return { isRefusal: true, isEmpty: false }
    }
    return { isRefusal: false, isEmpty: false, data: val }
  }

  return { isRefusal: false, isEmpty: false, data: val }
}

/**
 * Universal question response resolver.
 * 1. Direct key lookup if responses is an object and has possibleKeys.
 * 2. If not found or if responses is an array/map, iterates all entries/records
 *    and matches against possibleKeys checking:
 *    - key in responses (direct map key)
 *    - r.prompt_id
 *    - r.id
 *    - r.prompt_key
 *    - r.step_order (converted to e.g. "p" + step_order)
 *    - r.expand?.prompt_id?.schema_config?.prompt_key
 *    - r.expand?.prompt_id?.id
 *    - r.metadata?.prompt_key
 *    - r.schema_config?.prompt_key
 */
export function extractQuestionResponse(
  responses: Record<string, any> | any[] | undefined | null,
  possibleKeys: string[],
): any {
  if (!responses) return undefined

  const normalizedTargetKeys = new Set(possibleKeys.map((k) => String(k).trim().toLowerCase()))

  // 1. Direct object key match if responses is a Record
  if (typeof responses === 'object' && !Array.isArray(responses)) {
    for (const k of possibleKeys) {
      if (responses[k] !== undefined && responses[k] !== null) {
        return responses[k]
      }
    }
    // Also check case-insensitive match on object keys
    const entries = Object.entries(responses)
    for (const [key, val] of entries) {
      if (val !== undefined && val !== null && normalizedTargetKeys.has(key.trim().toLowerCase())) {
        return val
      }
    }
  }

  // 2. Iterate list of record values
  const records = Array.isArray(responses) ? responses : Object.values(responses)

  for (const r of records) {
    if (!r || typeof r !== 'object') continue

    // Collect all candidate keys associated with this record
    const candidateKeys: string[] = []

    if (r.prompt_id) candidateKeys.push(String(r.prompt_id))
    if (r.id) candidateKeys.push(String(r.id))
    if (r.prompt_key) candidateKeys.push(String(r.prompt_key))
    if (r.key) candidateKeys.push(String(r.key))
    if (r.step_order !== undefined && r.step_order !== null) {
      candidateKeys.push(`p${r.step_order}`)
      candidateKeys.push(`me_p${r.step_order}`)
    }
    if (r.prompt_order !== undefined && r.prompt_order !== null) {
      candidateKeys.push(`p${r.prompt_order}`)
      candidateKeys.push(`me_p${r.prompt_order}`)
    }

    // Expand properties
    const expandPrompt = r.expand?.prompt_id
    if (expandPrompt) {
      if (expandPrompt.id) candidateKeys.push(String(expandPrompt.id))
      if (expandPrompt.schema_config?.prompt_key) {
        candidateKeys.push(String(expandPrompt.schema_config.prompt_key))
      }
      if (expandPrompt.schema_config?.concept_key) {
        candidateKeys.push(String(expandPrompt.schema_config.concept_key))
      }
      if (expandPrompt.step_order !== undefined) {
        candidateKeys.push(`p${expandPrompt.step_order}`)
        candidateKeys.push(`me_p${expandPrompt.step_order}`)
      }
    }

    // Direct schema_config if present on r
    if (r.schema_config?.prompt_key) candidateKeys.push(String(r.schema_config.prompt_key))
    if (r.schema_config?.concept_key) candidateKeys.push(String(r.schema_config.concept_key))

    // Metadata properties
    if (r.metadata?.prompt_key) candidateKeys.push(String(r.metadata.prompt_key))
    if (r.metadata?.canonical_prompt_id) candidateKeys.push(String(r.metadata.canonical_prompt_id))
    if (r.metadata?.concept_key) candidateKeys.push(String(r.metadata.concept_key))

    // Structured value metadata
    if (r.structured_value && typeof r.structured_value === 'object') {
      const sMeta = r.structured_value.metadata
      if (sMeta?.prompt_key) candidateKeys.push(String(sMeta.prompt_key))
      if (sMeta?.canonical_prompt_id) candidateKeys.push(String(sMeta.canonical_prompt_id))
    }

    for (const cand of candidateKeys) {
      if (normalizedTargetKeys.has(cand.trim().toLowerCase())) {
        return r
      }
    }
  }

  return undefined
}

export const MindEmotionsReport: React.FC<MindEmotionsReportProps> = ({
  isOpen,
  open,
  onClose,
  responses = {},
  treatmentVariant = 'neutro',
  className = '',
  isProfessionalView = false,
}) => {
  const isVisible = isOpen !== undefined ? isOpen : open !== undefined ? open : true
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({})
  const [isReferencesOpen, setIsReferencesOpen] = useState(false)

  if (!isVisible) {
    return null
  }

  // --- 1. EMOÇÕES ---
  // P1: Funcionamento emocional geral
  const p1Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm1-p1-funcionamento-emocional'] || responses['mundo_emocional_geral']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm1-p1-funcionamento-emocional',
      'mundo_emocional_geral',
      'me_p1',
      'p1',
      'q1',
      'funcionamento_emocional',
      'pergunta_1',
    ])
  const p1State = evaluateFieldState(p1Raw)

  // P2: Emoções mais presentes
  const p2Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm1-p2-emocoes-presentes'] || responses['emocoes_recorrentes']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm1-p2-emocoes-presentes',
      'emocoes_recorrentes',
      'me_p2',
      'p2',
      'q2',
      'emotions',
      'pergunta_2',
    ])
  const p2State = evaluateFieldState(p2Raw)

  let selectedEmotionsList: string[] = []
  let otherEmotionText: string | null = null

  if (!p2State.isEmpty && !p2State.isRefusal) {
    const rawData = p2State.data || p2Raw
    const sVal = rawData?.structured_value !== undefined ? rawData.structured_value : rawData
    let items: any[] = []
    if (Array.isArray(sVal)) {
      items = sVal
    } else if (sVal && typeof sVal === 'object') {
      if (Array.isArray(sVal.selected)) items = sVal.selected
      else if (Array.isArray(sVal.options)) items = sVal.options
      else if (Array.isArray(sVal.value)) items = sVal.value
      else if (Array.isArray(sVal.choice)) items = sVal.choice
      else if (Array.isArray(sVal.selectedOptionIds)) items = sVal.selectedOptionIds
      if (
        sVal.otherText ||
        sVal.outra ||
        sVal.other ||
        sVal.custom_text ||
        sVal.outra_emocao_text
      ) {
        otherEmotionText = String(
          sVal.otherText || sVal.outra || sVal.other || sVal.custom_text || sVal.outra_emocao_text,
        ).trim()
      }
    } else if (typeof sVal === 'string') {
      items = [sVal]
    }

    if (rawData?.free_text && !otherEmotionText) {
      otherEmotionText = rawData.free_text.trim()
    }

    selectedEmotionsList = items
      .map((item) => {
        if (typeof item === 'string') {
          if (item === 'prefiro_nao_responder' || item === '__REFUSED__') return null
          if (item.startsWith('outra:') || item.startsWith('outro:')) {
            const splitted = item.substring(item.indexOf(':') + 1).trim()
            if (splitted) otherEmotionText = splitted
            return null
          }
          if (item === 'outra' || item === 'outro' || item === 'outra_emocao') {
            return null
          }
          return EMOTIONS_LABELS_MAP[item] || item
        }
        if (item && typeof item === 'object') {
          const id = item.id || item.value || item.label
          if (id === 'prefiro_nao_responder' || id === '__REFUSED__') return null
          const label = item.label || item.title || EMOTIONS_LABELS_MAP[id] || id
          if (id === 'outra' || id === 'outro' || id === 'outra_emocao') {
            if (item.text || item.customText || item.custom_text) {
              otherEmotionText = item.text || item.customText || item.custom_text
            }
            return null
          }
          return label
        }
        return null
      })
      .filter((x): x is string => Boolean(x))
  }

  // P3: Resposta livre sobre emoções (compreensao_despertar_emocoes)
  const p3Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm1-p3-por-que-se-sente-assim'] ||
        responses['compreensao_despertar_emocoes']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm1-p3-por-que-se-sente-assim',
      'compreensao_despertar_emocoes',
      'me_p3',
      'p3',
      'q3',
      'emotions_free',
      'pergunta_3',
    ])
  const p3State = evaluateFieldState(p3Raw)

  // P9: Situações de ativação (situacoes_ativacao_movimentos)
  const p9Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm3-p9-situacoes-ativacao'] || responses['situacoes_ativacao_movimentos']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm3-p9-situacoes-ativacao',
      'situacoes_ativacao_movimentos',
      'me_p9',
      'p9',
      'q9',
      'activation_contexts',
      'pergunta_9',
    ])
  const p9State = evaluateFieldState(p9Raw)

  // --- 2. PENSAMENTOS ---
  // P4: Pensamento associado livre (pensamento_associado)
  const p4Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm2-p4-pensamentos-associados'] || responses['pensamento_associado']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm2-p4-pensamentos-associados',
      'pensamento_associado',
      'me_p4',
      'p4',
      'q4',
      'thoughts_free',
      'pergunta_4',
    ])
  const p4State = evaluateFieldState(p4Raw)

  // Pensamentos estruturados/opções selecionadas opcionais se existirem
  const pPensamentosEstruturadosRaw = extractQuestionResponse(responses, [
    'me_thoughts_structured',
    'thoughts_structured',
    'pensamentos_estruturados',
  ])
  const pPensamentosEstruturadosState = evaluateFieldState(pPensamentosEstruturadosRaw)

  // P6: Diálogo interno (self_dialogue_erro)
  const p6Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm2-p6-dialogo-interno'] || responses['self_dialogue_erro']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm2-p6-dialogo-interno',
      'self_dialogue_erro',
      'me_p6',
      'p6',
      'q6',
      'internal_dialogue',
      'pergunta_6',
    ])
  const p6State = evaluateFieldState(p6Raw)

  // --- 3. COMPORTAMENTOS (Pergunta 5: comportamento_associado) ---
  const p5Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm2-p5-comportamento-associado'] || responses['comportamento_associado']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm2-p5-comportamento-associado',
      'comportamento_associado',
      'me_p5',
      'p5',
      'q5',
      'behaviors',
      'comportamentos',
      'me_behaviors',
      'pergunta_5',
    ])
  const p5State = evaluateFieldState(p5Raw)

  // Alívio imediato (perguntado no campo opcional da P12 - recursos_recuperar_espaco)
  const p12PromptRaw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm5-p12-recursos-espaco-interno'] || responses['recursos_recuperar_espaco']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm5-p12-recursos-espaco-interno',
      'recursos_recuperar_espaco',
      'me_p12',
      'p12',
      'q12',
      'recovery_resources',
      'pergunta_12',
    ])
  const p12PromptVal =
    p12PromptRaw?.structured_value !== undefined ? p12PromptRaw.structured_value : p12PromptRaw
  const reliefFromP12 =
    p12PromptRaw?.free_text ||
    p12PromptVal?.free_text ||
    p12PromptVal?.relief_text ||
    p12PromptVal?.estrategias_alivio ||
    undefined

  const explicitAlivioRaw = extractQuestionResponse(responses, [
    'me_relief_strategies',
    'relief_strategies',
    'estrategias_alivio',
    'alivio_imediato',
    'me_alivio',
  ])
  const pAlivioRaw = explicitAlivioRaw !== undefined ? explicitAlivioRaw : reliefFromP12
  const pAlivioState = evaluateFieldState(pAlivioRaw)

  // --- EXTRAÇÃO DAS RESPOSTAS DE P7A, P7B E P8 PARA O GRÁFICO E PADRÕES INTERFERENTES ---
  const p7aResp =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm3-p7a-movimentos-1-5'] ||
        responses['movimentos_automaticos_frequencia_p1']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm3-p7a-movimentos-1-5',
      'movimentos_automaticos_frequencia_p1',
      'p7a',
      'me_p7a',
      'q7a',
      'pergunta_7a',
    ])
  const p7bResp =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm3-p7b-movimentos-6-10'] ||
        responses['movimentos_automaticos_frequencia_p2']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm3-p7b-movimentos-6-10',
      'movimentos_automaticos_frequencia_p2',
      'p7b',
      'me_p7b',
      'q7b',
      'pergunta_7b',
    ])
  const p8Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm3-p8-interferencia-movimentos'] ||
        responses['movimentos_interferencia_atual']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm3-p8-interferencia-movimentos',
      'movimentos_interferencia_atual',
      'me_p8',
      'p8',
      'q8',
      'interfering_patterns',
      'protection_patterns_priority',
      'pergunta_8',
    ])

  const consolidatedP7Responses: Record<string, string> = {}
  const extractP7Values = (resp: any) => {
    if (!resp) return
    const sVal = resp.structured_value !== undefined ? resp.structured_value : resp
    if (!sVal) return
    if (typeof sVal === 'object' && !Array.isArray(sVal)) {
      for (const [k, v] of Object.entries(sVal)) {
        if (k === 'metadata' || k === 'collection_origin' || k === 'naming_origin') continue
        if (typeof v === 'string') {
          consolidatedP7Responses[k] = v
        } else if (v && typeof v === 'object' && (v as any).value) {
          consolidatedP7Responses[k] = String((v as any).value)
        }
      }
    } else if (Array.isArray(sVal)) {
      for (const item of sVal) {
        if (typeof item === 'string') {
          consolidatedP7Responses[item] = 'Frequentemente'
        } else if (item && typeof item === 'object') {
          const key = item.id || item.pattern_id || item.card_id
          const val = item.intensity || item.value || item.choice || 'Frequentemente'
          if (key) consolidatedP7Responses[key] = String(val)
        }
      }
    }
  }

  extractP7Values(p7aResp)
  extractP7Values(p7bResp)

  const consolidatedP8InterferingIds: string[] = (() => {
    if (!p8Raw) return []
    const sVal = p8Raw.structured_value !== undefined ? p8Raw.structured_value : p8Raw
    if (!sVal) return []
    if (Array.isArray(sVal)) {
      return sVal.map((x) => (typeof x === 'string' ? x : x?.id || String(x))).filter(Boolean)
    }
    if (Array.isArray(sVal.choice)) {
      return sVal.choice
        .map((x: any) => (typeof x === 'string' ? x : x?.id || String(x)))
        .filter(Boolean)
    }
    if (Array.isArray(sVal.value)) {
      return sVal.value
        .map((x: any) => (typeof x === 'string' ? x : x?.id || String(x)))
        .filter(Boolean)
    }
    if (Array.isArray(sVal.selectedOptionIds)) {
      return sVal.selectedOptionIds
        .map((x: any) => (typeof x === 'string' ? x : x?.id || String(x)))
        .filter(Boolean)
    }
    if (Array.isArray(sVal.selected)) {
      return sVal.selected
        .map((x: any) => (typeof x === 'string' ? x : x?.id || String(x)))
        .filter(Boolean)
    }
    if (Array.isArray(sVal.patterns)) {
      return sVal.patterns
        .map((x: any) => (typeof x === 'string' ? x : x?.id || String(x)))
        .filter(Boolean)
    }
    if (typeof sVal === 'string') {
      return [sVal]
    }
    if (typeof sVal === 'object') {
      return Object.keys(sVal).filter(
        (k) =>
          k !== 'metadata' &&
          k !== 'collection_origin' &&
          k !== 'naming_origin' &&
          Boolean(sVal[k]),
      )
    }
    return []
  })()

  const p8State = evaluateFieldState(p8Raw)

  // Normalização de exclusões como "nenhum_dificuldade_importante" e "ainda_nao_sei"
  const filteredInterferingIds = consolidatedP8InterferingIds.filter(
    (id) =>
      id !== 'nenhum_dificuldade_importante' &&
      id !== 'ainda_nao_sei' &&
      id !== '__REFUSED__' &&
      id !== 'prefiro_nao_responder',
  )

  // Max 3 patterns as specified
  const topPatterns = filteredInterferingIds.slice(0, 3).map((id) => {
    const content = getCerProtectionPatternContent(id)
    const label = patternLabel(id, treatmentVariant)
    return {
      id,
      label,
      content,
    }
  })

  const togglePattern = (id: string) => {
    setExpandedPatterns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // --- 5. TRÊS BLOCOS DE ESTADO (P10, P11, P12) ---
  const p10Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm4-p10-seguranca-bem-estar'] || responses['dois_retratos_espaco']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm4-p10-seguranca-bem-estar',
      'dois_retratos_espaco',
      'me_p10',
      'p10',
      'q10',
      'safety_wellbeing',
      'pergunta_10',
    ])
  const p10State = evaluateFieldState(p10Raw)

  const p11Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm4-p11-sobrecarga'] || responses['dois_retratos_sobrecarga']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm4-p11-sobrecarga',
      'dois_retratos_sobrecarga',
      'me_p11',
      'p11',
      'q11',
      'overload_state',
      'pergunta_11',
    ])
  const p11State = evaluateFieldState(p11Raw)

  const p12Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm5-p12-recursos-espaco-interno'] || responses['recursos_recuperar_espaco']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm5-p12-recursos-espaco-interno',
      'recursos_recuperar_espaco',
      'me_p12',
      'p12',
      'q12',
      'recovery_resources',
      'pergunta_12',
    ])
  const p12State = evaluateFieldState(p12Raw)

  // --- 6. PERGUNTA 13 (Livre / Opcional) ---
  const p13Raw =
    (typeof responses === 'object' && !Array.isArray(responses)
      ? responses['p-07c-pm5-p13-campo-final-opcional'] || responses['campo_final_opcional']
      : undefined) ||
    extractQuestionResponse(responses, [
      'p-07c-pm5-p13-campo-final-opcional',
      'campo_final_opcional',
      'me_p13',
      'p13',
      'q13',
      'additional_notes',
      'pergunta_13',
    ])
  const p13State = evaluateFieldState(p13Raw)
  const hasP13Content =
    !p13State.isEmpty &&
    (p13State.isRefusal ||
      (typeof p13State.text === 'string' && p13State.text.trim().length > 0) ||
      (typeof p13Raw === 'string' && p13Raw.trim().length > 0))

  // Render text helper for state
  const renderStateText = (state: ReturnType<typeof evaluateFieldState>, rawFallback?: any) => {
    if (state.isRefusal) {
      return <p className="text-sm italic text-muted-foreground">{MSG_RECUSA}</p>
    }
    if (state.isEmpty) {
      return <p className="text-sm italic text-muted-foreground">{MSG_INDISPONIVEL}</p>
    }
    if (state.text) {
      return (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{state.text}</p>
      )
    }
    if (Array.isArray(state.data)) {
      return (
        <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
          {state.data.map((item, idx) => (
            <li key={idx}>
              {typeof item === 'string' ? item : item.label || item.text || JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )
    }
    if (typeof rawFallback === 'string' && rawFallback.trim()) {
      return (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{rawFallback}</p>
      )
    }
    return <p className="text-sm italic text-muted-foreground">{MSG_INDISPONIVEL}</p>
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto flex justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-200 ${className}`}
      data-testid="mind-emotions-report"
      role="dialog"
      aria-modal="true"
      aria-label="Seu retrato de Mente & Emoções"
    >
      <div className="bg-card text-card-foreground border rounded-2xl shadow-xl w-full max-w-4xl p-6 sm:p-8 md:p-10 my-auto space-y-10 relative">
        {/* Top Close Button */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase">
            <Heart className="w-4 h-4 text-primary" />
            Dimensão Mente & Emoções • Retrato da Interagente
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full w-9 h-9 p-0 hover:bg-muted"
            aria-label="Fechar retrato"
            data-testid="report-close-button-top"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>

        {/* CABEÇALHO */}
        <header className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
              Seu retrato de Mente & Emoções
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Um primeiro olhar sobre como você percebe suas emoções, seus pensamentos, seus
              comportamentos e seus padrões de proteção.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-primary/5 border border-primary/15 text-sm sm:text-base text-foreground/90 leading-relaxed">
            <p className="font-medium text-primary mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Sobre este retrato
            </p>
            <p>
              Este retrato foi organizado a partir das respostas que você compartilhou. Ele mostra
              como você percebe seu funcionamento neste momento e não define quem você é. Padrões
              emocionais, mentais e comportamentais podem mudar conforme o contexto, a fase da vida
              e os recursos que desenvolvemos.
            </p>
          </div>
        </header>

        {/* SEÇÃO 1: EMOÇÕES */}
        <section className="space-y-5 border-t pt-6" data-testid="section-emocoes">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
              Emoções mais presentes
            </h2>
          </div>

          {/* Pergunta 1: Funcionamento emocional geral */}
          <div className="space-y-2 bg-muted/20 p-4 sm:p-5 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Como você descreveu seu funcionamento emocional
            </h3>
            {renderStateText(p1State, p1Raw)}
          </div>

          {/* Emoções selecionadas */}
          <div className="space-y-3 bg-muted/30 p-4 sm:p-5 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Emoções que você reconheceu
            </h3>
            {p2State.isRefusal ? (
              <p className="text-sm italic text-muted-foreground">{MSG_RECUSA}</p>
            ) : p2State.isEmpty && selectedEmotionsList.length === 0 && !otherEmotionText ? (
              <p className="text-sm italic text-muted-foreground">{MSG_INDISPONIVEL}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedEmotionsList.map((emotion, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="px-3 py-1 text-sm bg-rose-50 text-rose-800 border-rose-200"
                  >
                    {emotion}
                  </Badge>
                ))}
                {otherEmotionText && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-sm border-dashed border-rose-300 text-rose-900 bg-rose-50/50"
                  >
                    Outra emoção: {otherEmotionText}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Pergunta 3: Resposta livre sobre emoções */}
          <div className="space-y-2 bg-muted/20 p-4 sm:p-5 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Como você descreveu a presença dessas emoções
            </h3>
            {renderStateText(p3State, p3Raw)}
          </div>

          {/* Pergunta 9: Situações de ativação */}
          <div className="space-y-2 bg-muted/20 p-4 sm:p-5 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Situações em que esses movimentos costumam aparecer
            </h3>
            {renderStateText(p9State, p9Raw)}
          </div>
        </section>

        {/* SEÇÃO 2: PENSAMENTOS */}
        <section className="space-y-5 border-t pt-6" data-testid="section-pensamentos">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
              O que costuma acontecer em sua mente
            </h2>
          </div>

          {/* Sub-bloco A: Pensamentos que você reconheceu */}
          <div className="space-y-3 bg-muted/20 p-4 sm:p-5 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Pensamentos que você reconheceu
            </h3>
            {p4State.isRefusal ? (
              <p className="text-sm italic text-muted-foreground">{MSG_RECUSA}</p>
            ) : p4State.isEmpty && pPensamentosEstruturadosState.isEmpty ? (
              <p className="text-sm italic text-muted-foreground">{MSG_INDISPONIVEL}</p>
            ) : (
              <div className="space-y-2">
                {!pPensamentosEstruturadosState.isEmpty &&
                  renderStateText(pPensamentosEstruturadosState, pPensamentosEstruturadosRaw)}
                {!p4State.isEmpty && renderStateText(p4State, p4Raw)}
              </div>
            )}
          </div>

          {/* Sub-bloco B: Como você costuma conversar consigo */}
          <div className="space-y-3 bg-muted/20 p-4 sm:p-5 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Como você costuma conversar consigo
            </h3>
            {renderStateText(p6State, p6Raw)}
          </div>
        </section>

        {/* SEÇÃO 3: COMPORTAMENTOS */}
        <section className="space-y-5 border-t pt-6" data-testid="section-comportamentos">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
              Como você costuma agir
            </h2>
          </div>

          {/* Comportamentos habituais */}
          <div className="space-y-3 bg-muted/20 p-4 sm:p-5 rounded-xl border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Movimentos e comportamentos reconhecidos
            </h3>
            {renderStateText(p5State, p5Raw)}
          </div>

          {/* Estratégias de alívio imediato (somente quando informadas) */}
          {(!pAlivioState.isEmpty || pAlivioState.isRefusal) && (
            <div className="space-y-2 bg-amber-50/50 border border-amber-200/70 p-4 sm:p-5 rounded-xl text-amber-950">
              <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wider">
                Estratégias que aliviam agora, mas podem cobrar um preço depois
              </h3>
              {renderStateText(pAlivioState, pAlivioRaw)}
            </div>
          )}
        </section>

        {/* SEÇÃO 4: GRÁFICO DE PADRÕES */}
        <section className="space-y-5 border-t pt-6" data-testid="section-grafico">
          <ProtectionPatternsChart
            p7Responses={consolidatedP7Responses}
            p8InterferingIds={consolidatedP8InterferingIds}
            treatmentVariant={treatmentVariant}
          />
        </section>

        {/* SEÇÃO 5: PADRÕES MAIS INTERFERENTES */}
        <section className="space-y-6 border-t pt-6" data-testid="section-padroes-interferentes">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
              Os padrões que mais interferem atualmente
            </h2>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {PATTERNS_INTRO_TEXT}
          </p>

          {p8State.isRefusal ? (
            <div className="p-4 rounded-xl bg-muted/30 border text-sm italic text-muted-foreground">
              {MSG_RECUSA}
            </div>
          ) : topPatterns.length === 0 ? (
            <div className="p-4 rounded-xl bg-muted/30 border text-sm italic text-muted-foreground">
              {MSG_INDISPONIVEL}
            </div>
          ) : (
            <div className="space-y-4">
              {topPatterns.map(({ id, label, content }) => {
                const isExpanded = expandedPatterns[id] || false
                if (!content) return null

                return (
                  <div
                    key={id}
                    className="border rounded-xl p-5 bg-card hover:border-primary/40 transition-colors space-y-4"
                    data-testid={`pattern-card-${id}`}
                  >
                    {/* Header visível */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-serif font-bold text-foreground">{label}</h3>
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-900 border-amber-300 text-xs"
                          >
                            Percebido como mais interferente
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{content.shortDescription}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePattern(id)}
                        className="self-start sm:self-center gap-1.5 text-xs text-primary"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <>
                            Menos detalhes <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Mais detalhes <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Painel expansível com a ordem exata de 1 a 10 */}
                    {isExpanded && (
                      <div className="border-t pt-4 space-y-5 text-sm leading-relaxed animate-in fade-in duration-200">
                        {/* 1. Como esse padrão costuma aparecer */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            Como esse padrão costuma aparecer
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {content.characteristics.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 2. O que ele costuma dizer em sua mente */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            O que ele costuma dizer em sua mente
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {content.commonThoughts.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 3. Sentimentos que podem acompanhá-lo */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            Sentimentos que podem acompanhá-lo
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {content.associatedFeelings.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 4. As mentiras que esse padrão conta */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            As mentiras que esse padrão conta
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {content.patternLies.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 5. O preço que você pode pagar */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            O preço que você pode pagar
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {content.costToSelf.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 6. O impacto possível nas relações */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            O impacto possível nas relações
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {content.costToRelationships.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 7. A potência que existe nesse padrão */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            A potência que existe nesse padrão
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {content.strengths.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 8. Possível função de proteção */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            Possível função de proteção
                          </h4>
                          {Array.isArray(content.possibleProtectiveFunctions) ? (
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {content.possibleProtectiveFunctions.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground leading-relaxed">
                              {content.possibleProtectiveFunctions}
                            </p>
                          )}
                        </div>

                        {/* 9. O que você precisa começar a perceber */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                            O que você precisa começar a perceber
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {content.wakeUpCalls.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 10. clarificationNote quando existir */}
                        {content.clarificationNote && (
                          <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-950 text-xs sm:text-sm leading-relaxed">
                            <span className="font-semibold">Nota de esclarecimento: </span>
                            {content.clarificationNote}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* SEÇÃO 6: DESENVOLVIMENTO DOS PADRÕES */}
        <section className="space-y-4 border-t pt-6" data-testid="section-desenvolvimento">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
              Como esses padrões podem se desenvolver
            </h2>
          </div>
          <div className="text-sm sm:text-base text-foreground/90 space-y-4 leading-relaxed bg-muted/20 p-5 rounded-xl border">
            {DEVELOPMENT_SECTION_TEXT.split('\n\n').map((paragrafo, idx) => (
              <p key={idx}>{paragrafo}</p>
            ))}
          </div>
        </section>

        {/* SEÇÃO 7: TRÊS BLOCOS DE ESTADO */}
        <section className="space-y-5 border-t pt-6" data-testid="section-estados">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
              Seus estados e recursos reconhecidos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bloco A: Como você se percebe em segurança e bem-estar (P10) */}
            <div className="p-5 rounded-xl bg-card border space-y-2">
              <h3 className="font-serif font-semibold text-foreground text-sm sm:text-base">
                Como você se percebe em segurança e bem-estar
              </h3>
              {renderStateText(p10State, p10Raw)}
            </div>

            {/* Bloco B: O que muda quando a sobrecarga aumenta (P11) */}
            <div className="p-5 rounded-xl bg-card border space-y-2">
              <h3 className="font-serif font-semibold text-foreground text-sm sm:text-base">
                O que muda quando a sobrecarga aumenta
              </h3>
              {renderStateText(p11State, p11Raw)}
            </div>

            {/* Bloco C: Recursos que ajudam você a recuperar espaço interno (P12) */}
            <div className="p-5 rounded-xl bg-card border space-y-2">
              <h3 className="font-serif font-semibold text-foreground text-sm sm:text-base">
                Recursos que ajudam você a recuperar espaço interno
              </h3>
              {renderStateText(p12State, p12Raw)}
            </div>
          </div>
        </section>

        {/* SEÇÃO 8: PERGUNTA 13 (Apenas se tiver conteúdo) */}
        {hasP13Content && (
          <section className="space-y-4 border-t pt-6" data-testid="section-p13">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
                Algo importante que você quis acrescentar
              </h2>
            </div>
            <div className="p-5 rounded-xl bg-card border text-sm sm:text-base leading-relaxed">
              {renderStateText(p13State, p13Raw)}
            </div>
          </section>
        )}

        {/* SEÇÃO 9: FECHAMENTO */}
        <section className="space-y-4 border-t pt-6" data-testid="section-fechamento">
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 text-foreground/90 leading-relaxed">
            {CLOSING_SECTION_TEXT.split('\n\n').map((paragrafo, idx) => (
              <p
                key={idx}
                className={
                  idx === CLOSING_SECTION_TEXT.split('\n\n').length - 1
                    ? 'font-serif font-semibold text-primary pt-2'
                    : ''
                }
              >
                {paragrafo}
              </p>
            ))}
          </div>
        </section>

        {/* SEÇÃO 10: REFERÊNCIAS CIENTÍFICAS */}
        <section className="border-t pt-6 space-y-3" data-testid="section-referencias">
          <Button
            variant="ghost"
            onClick={() => setIsReferencesOpen((prev) => !prev)}
            className="flex items-center justify-between w-full p-3 rounded-xl border hover:bg-muted text-sm font-medium text-muted-foreground"
            aria-expanded={isReferencesOpen}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Bases científicas desta experiência
            </span>
            {isReferencesOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {isReferencesOpen && (
            <div className="p-5 rounded-xl bg-muted/20 border space-y-4 text-xs sm:text-sm animate-in fade-in duration-200">
              <ul className="space-y-3 text-muted-foreground">
                {SCIENTIFIC_REFERENCES.map((ref, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span>{ref.citation} </span>
                    <a
                      href={ref.doiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs break-all"
                    >
                      {ref.doiUrl}
                      <ExternalLink className="w-3 h-3 inline shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="border-t pt-3 text-xs text-muted-foreground leading-relaxed italic">
                {SCIENTIFIC_NOTE}
              </div>
            </div>
          )}
        </section>

        {/* Bottom Close Button */}
        <div className="border-t pt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm"
            data-testid="report-close-button-bottom"
          >
            Fechar retrato
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MindEmotionsReport
