import React, { useState, useMemo } from 'react'
import { ProfessionalAyurvedaCareReasoning } from '../AyurvedaCareReasoning'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  Activity,
  Calendar,
  Clock,
  History,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
  FileText,
  User,
  ChevronRight,
  Info,
} from 'lucide-react'
import type { ExperienceResponseRecord, ExperienceResponseVersionRecord } from '@/types/cer'
import {
  AYV_C1_PROMPTS,
  AYV_C1_QUESTION_PROMPT_KEYS,
  AYV_C1_QUESTION_PROMPT_IDS,
  AYV_TELA1_STRUCTURE_OPTIONS,
  AYV_TELA1_DURATION_OPTIONS,
  AYV_TELA2_SKIN_OPTIONS,
  AYV_TELA3_HAIR_OPTIONS,
  AYV_TELA4_TEMPERATURE_OPTIONS,
  AYV_TELA5_THIRST_OPTIONS,
  AYV_TELA5_DRINK_TEMP_OPTIONS,
  AYV_TELA5_SWEAT_OPTIONS,
  migrateLegacyChapter1Responses,
  getChapter1BasePromptId,
  getChapter1ResponseRevisionNumber,
  deriveChapter1Status,
} from '@/services/ayurvedaChapter1'
import {
  AYV_C2_PROMPTS,
  AYV_C2_QUESTION_PROMPT_KEYS,
  AYV_C2_QUESTION_PROMPT_IDS,
  AYV_C2_P1_HUNGER_OPTIONS,
  getAyvC2P2Options,
  getAyvC2P3Options,
  AYV_C2_P4_HUNGER_RETURN_OPTIONS,
  AYV_C2_P5_FOOD_DEMANDS_OPTIONS,
  AYV_C2_P6_BOWEL_RHYTHM_OPTIONS,
  AYV_C2_P7_STOOL_OPTIONS,
  AYV_C2_P8_SLEEP_OPTIONS,
  AYV_C2_P9_WAKING_OPTIONS,
  AYV_C2_P10_ENERGY_OPTIONS,
  AYV_C2_P11_BODY_PACE_OPTIONS,
  AYV_C2_P12_CONFIDENCE_OPTIONS,
  migrateLegacyChapter2Responses,
  getChapter2BasePromptId,
  getResponseRevisionNumber as getChapter2ResponseRevisionNumber,
  deriveChapter2Status,
  Chapter2TreatmentVariant,
} from '@/services/ayurvedaChapter2'
import {
  AYV_C3_CONTEXT_OPTIONS,
  chapter3DirectionOptions,
  AYV_C3_DOMAIN_OPTIONS,
  AYV_C3_MEDICATION_STATUS_OPTIONS,
  AYV_C3_MEDICATION_TIMING_OPTIONS,
  AYV_C3_STARTED_OPTIONS,
  chapter3Label,
  deriveChapter3Status,
} from '@/services/ayurvedaChapter3'
import { buildAyurvedaCurrentBodyFactualBlock } from '@/services/ayurvedaCurrentBodyFactual'
import { isChapter4Completed } from '@/services/ayurvedaChapter4'

export interface ProfessionalAyurvedaCorpoFisiologiaViewProps {
  responses: ExperienceResponseRecord[]
  responseVersions?: ExperienceResponseVersionRecord[]
  participantName: string
  treatmentPreference?: string
  treatmentPreferenceCustom?: string
  loadError?: boolean
  onRetryLoad?: () => void
}

interface ChapterRevisionInfo {
  revisionNumber: number
  isCompleted: boolean
  createdAt?: string
  completedAt?: string
  authorName?: string
  isDraft: boolean
  responsesCount: number
}

interface LiteralQuestionItem {
  key: string
  title: string
  group: string
  valueDisplay: string
  epistemicStatus: 'answered' | 'unsure' | 'refusal' | 'unanswered'
  hasLowConfidence: boolean
  lowConfidenceDetail?: string
  rawResponses?: ExperienceResponseRecord[]
}

export const ProfessionalAyurvedaCorpoFisiologiaView: React.FC<
  ProfessionalAyurvedaCorpoFisiologiaViewProps
> = ({
  responses,
  responseVersions = [],
  participantName,
  treatmentPreference,
  treatmentPreferenceCustom,
  loadError,
  onRetryLoad,
}) => {
  // 1. Migração não-destrutiva em memória de C1 e C2
  const migratedC1 = useMemo(() => {
    return migrateLegacyChapter1Responses(responses || []).migratedResponses
  }, [responses])

  const migratedC2 = useMemo(() => {
    return migrateLegacyChapter2Responses(responses || []).migratedResponses
  }, [responses])

  // Tratamento da linguagem para C2 (feminino, masculino, neutro)
  const treatmentVariant: Chapter2TreatmentVariant = useMemo(() => {
    if (treatmentPreference === 'feminino') return 'feminino'
    if (treatmentPreference === 'masculino') return 'masculino'
    return 'neutro'
  }, [treatmentPreference])

  // 2. Análise de Revisões e Conclusão do Capítulo 1
  const c1RevisionsMap = useMemo(() => {
    const revs = new Map<number, ExperienceResponseRecord[]>()
    for (const r of migratedC1) {
      const pId = (r as any).prompt_id || (r as any).canonical_prompt_id
      const pKey = (r as any).prompt_key || (r as any).structured_value?.prompt_key
      const matches =
        (typeof pId === 'string' && pId.startsWith('ayv_c1_')) ||
        (typeof pKey === 'string' && pKey.startsWith('ayv_c1_'))
      if (!matches) continue

      const rev = getChapter1ResponseRevisionNumber(r)
      if (!revs.has(rev)) revs.set(rev, [])
      revs.get(rev)!.push(r)
    }
    return revs
  }, [migratedC1])

  const c1RevisionsInfo = useMemo<ChapterRevisionInfo[]>(() => {
    const list: ChapterRevisionInfo[] = []
    const allRevNums = Array.from(c1RevisionsMap.keys()).sort((a, b) => a - b)

    for (const revNum of allRevNums) {
      const revResps = c1RevisionsMap.get(revNum) || []
      const completionResp = revResps.find((r) => {
        const bId = getChapter1BasePromptId((r as any).prompt_id || '')
        const bKey = getChapter1BasePromptId((r as any).prompt_key || '')
        return (
          bId === AYV_C1_PROMPTS.CHAPTER_COMPLETION.id ||
          bKey === AYV_C1_PROMPTS.CHAPTER_COMPLETION.key
        )
      })

      const isCompleted = Boolean(
        completionResp &&
        ((completionResp.structured_value as any)?.completed === true ||
          (completionResp.structured_value as any)?.value?.completed === true ||
          (completionResp.structured_value as any)?.status === 'completed'),
      )

      let firstCreated: string | undefined = undefined
      let completionDate: string | undefined = undefined
      let author = participantName

      for (const r of revResps) {
        if (!firstCreated && r.created) firstCreated = r.created
        if (r.created && firstCreated && new Date(r.created) < new Date(firstCreated)) {
          firstCreated = r.created
        }
      }

      if (completionResp) {
        const sVal = completionResp.structured_value as any
        completionDate = sVal?.completed_at || sVal?.value?.completed_at || completionResp.created
      }

      // Questões clínicas válidas
      const questionResps = revResps.filter((r) => {
        const bId = getChapter1BasePromptId((r as any).prompt_id || '')
        const bKey = getChapter1BasePromptId((r as any).prompt_key || '')
        return (
          bId !== AYV_C1_PROMPTS.CHAPTER_COMPLETION.id &&
          bKey !== AYV_C1_PROMPTS.CHAPTER_COMPLETION.key
        )
      })

      list.push({
        revisionNumber: revNum,
        isCompleted,
        createdAt: firstCreated,
        completedAt: completionDate,
        authorName: author,
        isDraft: !isCompleted && revNum > 1,
        responsesCount: questionResps.length,
      })
    }

    return list
  }, [c1RevisionsMap, participantName])

  // Última revisão concluída de C1
  const c1LatestCompletedRev = useMemo(() => {
    const completed = c1RevisionsInfo.filter((r) => r.isCompleted)
    if (completed.length === 0) return null
    return Math.max(...completed.map((r) => r.revisionNumber))
  }, [c1RevisionsInfo])

  // Rascunho ativo / em andamento de C1
  const c1DraftRev = useMemo(() => {
    return c1RevisionsInfo.find((r) => !r.isCompleted && r.revisionNumber > 1) || null
  }, [c1RevisionsInfo])

  // Revisão padrão de C1: última concluída; senão a maior revisão disponível; senão 1
  const c1DefaultRev = useMemo(() => {
    if (c1LatestCompletedRev !== null) return c1LatestCompletedRev
    if (c1RevisionsInfo.length > 0) {
      return Math.max(...c1RevisionsInfo.map((r) => r.revisionNumber))
    }
    return 1
  }, [c1LatestCompletedRev, c1RevisionsInfo])

  const [c1SelectedRev, setC1SelectedRev] = useState<number>(c1DefaultRev)

  // 3. Análise de Revisões e Conclusão do Capítulo 2
  const c2RevisionsMap = useMemo(() => {
    const revs = new Map<number, ExperienceResponseRecord[]>()
    for (const r of migratedC2) {
      const pId = (r as any).prompt_id || (r as any).canonical_prompt_id
      const pKey = (r as any).prompt_key || (r as any).structured_value?.prompt_key
      const matches =
        (typeof pId === 'string' && pId.startsWith('ayv_c2_')) ||
        (typeof pKey === 'string' && pKey.startsWith('ayv_c2_'))
      if (!matches) continue

      const rev = getChapter2ResponseRevisionNumber(r)
      if (!revs.has(rev)) revs.set(rev, [])
      revs.get(rev)!.push(r)
    }
    return revs
  }, [migratedC2])

  const c2RevisionsInfo = useMemo<ChapterRevisionInfo[]>(() => {
    const list: ChapterRevisionInfo[] = []
    const allRevNums = Array.from(c2RevisionsMap.keys()).sort((a, b) => a - b)

    for (const revNum of allRevNums) {
      const revResps = c2RevisionsMap.get(revNum) || []
      const completionResp = revResps.find((r) => {
        const bId = getChapter2BasePromptId((r as any).prompt_id || '')
        const bKey = getChapter2BasePromptId((r as any).prompt_key || '')
        return (
          bId === AYV_C2_PROMPTS.CHAPTER_COMPLETION.id ||
          bKey === AYV_C2_PROMPTS.CHAPTER_COMPLETION.key
        )
      })

      const isCompleted = Boolean(
        completionResp &&
        ((completionResp.structured_value as any)?.completed === true ||
          (completionResp.structured_value as any)?.value?.completed === true ||
          (completionResp.structured_value as any)?.status === 'completed'),
      )

      let firstCreated: string | undefined = undefined
      let completionDate: string | undefined = undefined
      let author = participantName

      for (const r of revResps) {
        if (!firstCreated && r.created) firstCreated = r.created
        if (r.created && firstCreated && new Date(r.created) < new Date(firstCreated)) {
          firstCreated = r.created
        }
      }

      if (completionResp) {
        const sVal = completionResp.structured_value as any
        completionDate = sVal?.completed_at || sVal?.value?.completed_at || completionResp.created
      }

      const questionResps = revResps.filter((r) => {
        const bId = getChapter2BasePromptId((r as any).prompt_id || '')
        const bKey = getChapter2BasePromptId((r as any).prompt_key || '')
        return (
          bId !== AYV_C2_PROMPTS.CHAPTER_COMPLETION.id &&
          bKey !== AYV_C2_PROMPTS.CHAPTER_COMPLETION.key
        )
      })

      list.push({
        revisionNumber: revNum,
        isCompleted,
        createdAt: firstCreated,
        completedAt: completionDate,
        authorName: author,
        isDraft: !isCompleted && revNum > 1,
        responsesCount: questionResps.length,
      })
    }

    return list
  }, [c2RevisionsMap, participantName])

  const c2LatestCompletedRev = useMemo(() => {
    const completed = c2RevisionsInfo.filter((r) => r.isCompleted)
    if (completed.length === 0) return null
    return Math.max(...completed.map((r) => r.revisionNumber))
  }, [c2RevisionsInfo])

  const c2DraftRev = useMemo(() => {
    return c2RevisionsInfo.find((r) => !r.isCompleted && r.revisionNumber > 1) || null
  }, [c2RevisionsInfo])

  const c2DefaultRev = useMemo(() => {
    if (c2LatestCompletedRev !== null) return c2LatestCompletedRev
    if (c2RevisionsInfo.length > 0) {
      return Math.max(...c2RevisionsInfo.map((r) => r.revisionNumber))
    }
    return 1
  }, [c2LatestCompletedRev, c2RevisionsInfo])

  const [c2SelectedRev, setC2SelectedRev] = useState<number>(c2DefaultRev)

  // 4. Derivação de status canônico geral dos capítulos
  const c1DerivedStatus = useMemo(() => {
    return deriveChapter1Status(migratedC1)
  }, [migratedC1])

  const c2DerivedStatus = useMemo(() => {
    return deriveChapter2Status(migratedC2)
  }, [migratedC2])

  const c3CurrentResponses = useMemo(
    () =>
      (responses || []).filter((response) =>
        String(response.prompt_id || '').startsWith('ayv_c3_'),
      ),
    [responses],
  )

  const c3CurrentRevision = useMemo(() => {
    const completion = c3CurrentResponses.find((response) => {
      const key =
        (response as any).prompt_key ||
        (response.structured_value as any)?.metadata?.prompt_key ||
        response.prompt_id
      return key === 'ayv_c3_chapter_completion'
    })
    return (completion?.structured_value as any)?.metadata?.chapter_revision_number || 1
  }, [c3CurrentResponses])

  const c3AvailableRevisionNumbers = useMemo(() => {
    const revisions = new Set<number>()
    if (c3CurrentResponses.length > 0) revisions.add(c3CurrentRevision)
    for (const version of responseVersions) {
      if (!String(version.prompt_id || '').startsWith('ayv_c3_')) continue
      const chapterRevision = (version.structured_value as any)?.metadata?.chapter_revision_number
      if (chapterRevision) revisions.add(chapterRevision)
    }
    return Array.from(revisions).sort((a, b) => a - b)
  }, [c3CurrentResponses.length, c3CurrentRevision, responseVersions])

  const c3DefaultRevision = c3AvailableRevisionNumbers.at(-1) || 1
  const [c3SelectedRevision, setC3SelectedRevision] = useState(c3DefaultRevision)

  const c3SelectedResponses = useMemo(() => {
    const selected: ExperienceResponseRecord[] = []
    for (const current of c3CurrentResponses) {
      if (c3CurrentRevision === c3SelectedRevision) {
        selected.push(current)
        continue
      }
      const snapshot = responseVersions
        .filter(
          (version) =>
            version.response_id === current.id &&
            (version.structured_value as any)?.metadata?.chapter_revision_number ===
              c3SelectedRevision,
        )
        .sort((a, b) => b.version_number - a.version_number)[0]
      if (snapshot) {
        selected.push({
          ...current,
          structured_value: snapshot.structured_value,
          free_text: snapshot.free_text,
          version: snapshot.version_number,
          created: snapshot.created,
          updated: snapshot.updated,
        })
      }
    }
    return selected
  }, [c3CurrentResponses, c3CurrentRevision, c3SelectedRevision, responseVersions])

  const c3DerivedStatus = useMemo(
    () => deriveChapter3Status(c3SelectedResponses),
    [c3SelectedResponses],
  )
  const c3CurrentDerivedStatus = useMemo(
    () => deriveChapter3Status(c3CurrentResponses),
    [c3CurrentResponses],
  )
  const c4Completed = useMemo(() => isChapter4Completed(responses || []), [responses])

  // Data da última atualização factual (geral de Corpo & Fisiologia)
  const lastFactualDate = useMemo(() => {
    const all = responses || []
    if (all.length === 0) return null
    const timestamps = all
      .map((r) => new Date(r.updated || r.created).getTime())
      .filter((t) => !Number.isNaN(t))
    if (timestamps.length === 0) return null
    const maxT = Math.max(...timestamps)
    return new Date(maxT).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }, [responses])

  // Rótulo textual humano dos estados dos capítulos
  const getChapterStateLabel = (
    status: string,
    hasRevisions: boolean,
    draftRev: ChapterRevisionInfo | null,
  ) => {
    if (status === 'completed') {
      return draftRev ? 'Concluído (com correção em andamento)' : 'Concluído'
    }
    if (status === 'ready_to_complete' || status === 'in_progress') {
      return 'Em andamento'
    }
    return hasRevisions ? 'Em andamento' : 'Não iniciado'
  }

  // 5. Extração e mapeamento de respostas para o Capítulo 1 na revisão selecionada
  const c1ActiveResponses = useMemo(() => {
    return c1RevisionsMap.get(c1SelectedRev) || []
  }, [c1RevisionsMap, c1SelectedRev])

  const c1QuestionsData = useMemo<LiteralQuestionItem[]>(() => {
    const findResp = (baseIdOrKey: string) => {
      return c1ActiveResponses.find((r) => {
        const bId = getChapter1BasePromptId((r as any).prompt_id || '')
        const bKey = getChapter1BasePromptId(
          (r as any).prompt_key || (r as any).structured_value?.prompt_key || '',
        )
        return bId === baseIdOrKey || bKey === baseIdOrKey
      })
    }

    const mapQuestion = (
      key: string,
      title: string,
      group: string,
      baseId: string,
      options: Array<{
        id: string
        label: string
        is_unsure?: boolean
        is_refusal?: boolean
        low_confidence?: boolean
      }>,
    ): LiteralQuestionItem => {
      const resp = findResp(baseId)
      if (!resp) {
        return {
          key,
          title,
          group,
          valueDisplay: 'Ainda não respondido.',
          epistemicStatus: 'unanswered',
          hasLowConfidence: false,
        }
      }

      const sVal = resp.structured_value as any
      const meta = sVal?.metadata || {}
      const rawVal = sVal?.value ?? sVal?.choice ?? sVal?.selectedOptionIds
      const secVal = sVal?.secondary_choice

      const isExplicitUnsure =
        Boolean(meta.explicit_unsure) ||
        rawVal === 'dont_know' ||
        rawVal === 'no_reference' ||
        (Array.isArray(rawVal) && (rawVal.includes('dont_know') || rawVal.includes('no_reference')))
      const isExplicitRefusal =
        Boolean(meta.explicit_refusal) ||
        rawVal === 'refusal' ||
        (Array.isArray(rawVal) && rawVal.includes('refusal'))

      let labels: string[] = []
      if (Array.isArray(rawVal)) {
        for (const v of rawVal) {
          const match = options.find((o) => o.id === v)
          if (match) labels.push(match.label)
          else if (v) labels.push(String(v))
        }
      } else if (rawVal !== undefined && rawVal !== null) {
        const match = options.find((o) => o.id === rawVal)
        if (match) labels.push(match.label)
        else labels.push(String(rawVal))
      }

      if (secVal) {
        const secMatch = options.find((o) => o.id === secVal)
        labels.push(secMatch ? secMatch.label : String(secVal))
      }

      const hasLowConfidence =
        (meta.historical_confidence === 'low' && !isExplicitUnsure && !isExplicitRefusal) ||
        Boolean(meta.contradiction_flag) ||
        rawVal === 'changed_lot' ||
        (Array.isArray(rawVal) && rawVal.includes('changed_lot'))

      let lowConfidenceDetail: string | undefined = undefined
      if (hasLowConfidence) {
        lowConfidenceDetail =
          meta.historical_confidence === 'low'
            ? 'Relatou variação acentuada ou ausência de marco estável ao longo da vida.'
            : 'Registrou alteração acentuada das características com o tempo.'
      }

      if (isExplicitRefusal) {
        return {
          key,
          title,
          group,
          valueDisplay: 'Prefiro não responder.',
          epistemicStatus: 'refusal',
          hasLowConfidence,
          lowConfidenceDetail,
          rawResponses: [resp],
        }
      }

      if (isExplicitUnsure) {
        return {
          key,
          title,
          group,
          valueDisplay: 'Não sei identificar.',
          epistemicStatus: 'unsure',
          hasLowConfidence,
          lowConfidenceDetail,
          rawResponses: [resp],
        }
      }

      if (labels.length === 0) {
        return {
          key,
          title,
          group,
          valueDisplay: 'Ainda não respondido.',
          epistemicStatus: 'unanswered',
          hasLowConfidence,
          lowConfidenceDetail,
          rawResponses: [resp],
        }
      }

      return {
        key,
        title,
        group,
        valueDisplay: labels.join('; '),
        epistemicStatus: 'answered',
        hasLowConfidence,
        lowConfidenceDetail,
        rawResponses: [resp],
      }
    }

    return [
      mapQuestion(
        'c1_structure',
        'Estrutura corporal habitual',
        'Estrutura corporal',
        AYV_C1_PROMPTS.P1_STRUCTURE.id,
        AYV_TELA1_STRUCTURE_OPTIONS,
      ),
      mapQuestion(
        'c1_duration',
        'Estabilidade e mudanças ao longo do tempo',
        'Estabilidade e mudanças ao longo do tempo',
        AYV_C1_PROMPTS.P1_DURATION.id,
        AYV_TELA1_DURATION_OPTIONS,
      ),
      mapQuestion(
        'c1_skin',
        'Pele habitual',
        'Pele',
        AYV_C1_PROMPTS.P2_SKIN.id,
        AYV_TELA2_SKIN_OPTIONS,
      ),
      mapQuestion(
        'c1_hair',
        'Cabelo habitual',
        'Cabelo',
        AYV_C1_PROMPTS.P3_HAIR.id,
        AYV_TELA3_HAIR_OPTIONS,
      ),
      mapQuestion(
        'c1_temp',
        'Temperatura corporal habitual',
        'Temperatura corporal',
        AYV_C1_PROMPTS.P4_TEMPERATURE.id,
        AYV_TELA4_TEMPERATURE_OPTIONS,
      ),
      mapQuestion(
        'c1_thirst',
        'Sede habitual',
        'Sede',
        AYV_C1_PROMPTS.P5_THIRST.id,
        AYV_TELA5_THIRST_OPTIONS,
      ),
      mapQuestion(
        'c1_drink',
        'Preferência de bebidas e temperatura',
        'Preferência de bebidas',
        AYV_C1_PROMPTS.P5_DRINK_TEMP.id,
        AYV_TELA5_DRINK_TEMP_OPTIONS,
      ),
      mapQuestion(
        'c1_sweat',
        'Transpiração habitual',
        'Transpiração',
        AYV_C1_PROMPTS.P5_SWEAT.id,
        AYV_TELA5_SWEAT_OPTIONS,
      ),
    ]
  }, [c1ActiveResponses])

  // 6. Extração e mapeamento de respostas para o Capítulo 2 na revisão selecionada
  const c2ActiveResponses = useMemo(() => {
    return c2RevisionsMap.get(c2SelectedRev) || []
  }, [c2RevisionsMap, c2SelectedRev])

  const c2QuestionsData = useMemo<LiteralQuestionItem[]>(() => {
    const findResp = (baseIdOrKey: string) => {
      return c2ActiveResponses.find((r) => {
        const bId = getChapter2BasePromptId((r as any).prompt_id || '')
        const bKey = getChapter2BasePromptId(
          (r as any).prompt_key || (r as any).structured_value?.prompt_key || '',
        )
        return bId === baseIdOrKey || bKey === baseIdOrKey
      })
    }

    const mapQuestion = (
      key: string,
      title: string,
      group: string,
      baseId: string,
      options: Array<{
        id: string
        label: string
        is_unsure?: boolean
        is_refusal?: boolean
      }>,
    ): LiteralQuestionItem => {
      const resp = findResp(baseId)
      if (!resp) {
        return {
          key,
          title,
          group,
          valueDisplay: 'Ainda não respondido.',
          epistemicStatus: 'unanswered',
          hasLowConfidence: false,
        }
      }

      const sVal = resp.structured_value as any
      const meta = sVal?.metadata || {}
      const rawVal = sVal?.value ?? sVal?.choice ?? sVal?.selectedOptionIds

      const isExplicitUnsure =
        Boolean(meta.explicit_unsure) ||
        rawVal === 'dont_know' ||
        rawVal === 'no_pattern' ||
        rawVal === 'hard_to_remember' ||
        (Array.isArray(rawVal) &&
          (rawVal.includes('dont_know') ||
            rawVal.includes('no_pattern') ||
            rawVal.includes('hard_to_remember')))
      const isExplicitRefusal =
        Boolean(meta.explicit_refusal) ||
        rawVal === 'refusal' ||
        (Array.isArray(rawVal) && rawVal.includes('refusal'))

      let labels: string[] = []
      if (Array.isArray(rawVal)) {
        for (const v of rawVal) {
          const match = options.find((o) => o.id === v)
          if (match) labels.push(match.label)
          else if (v) labels.push(String(v))
        }
      } else if (rawVal !== undefined && rawVal !== null) {
        const match = options.find((o) => o.id === rawVal)
        if (match) labels.push(match.label)
        else labels.push(String(rawVal))
      }

      // Baixa confiança histórica: se registrado no metadado ou se marcou explicitamente hard_to_remember na P12
      const hasLowConfidence =
        (meta.historical_confidence === 'low' && !isExplicitUnsure && !isExplicitRefusal) ||
        (key === 'c2_p12_confidence' && rawVal === 'hard_to_remember')

      let lowConfidenceDetail: string | undefined = undefined
      if (hasLowConfidence) {
        lowConfidenceDetail =
          'Interagente relatou dificuldade para lembrar o funcionamento estável antes do momento atual.'
      }

      if (isExplicitRefusal) {
        return {
          key,
          title,
          group,
          valueDisplay: 'Prefiro não responder.',
          epistemicStatus: 'refusal',
          hasLowConfidence,
          lowConfidenceDetail,
          rawResponses: [resp],
        }
      }

      if (isExplicitUnsure) {
        return {
          key,
          title,
          group,
          valueDisplay: 'Não sei identificar.',
          epistemicStatus: 'unsure',
          hasLowConfidence,
          lowConfidenceDetail,
          rawResponses: [resp],
        }
      }

      if (labels.length === 0) {
        return {
          key,
          title,
          group,
          valueDisplay: 'Ainda não respondido.',
          epistemicStatus: 'unanswered',
          hasLowConfidence,
          lowConfidenceDetail,
          rawResponses: [resp],
        }
      }

      return {
        key,
        title,
        group,
        valueDisplay: labels.join('; '),
        epistemicStatus: 'answered',
        hasLowConfidence,
        lowConfidenceDetail,
        rawResponses: [resp],
      }
    }

    const p2Opts = getAyvC2P2Options(treatmentVariant)
    const p3Opts = getAyvC2P3Options(treatmentVariant)

    return [
      // Grupo Fome
      mapQuestion(
        'c2_p1_hunger',
        'Como a fome costuma funcionar',
        'Fome',
        AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        AYV_C2_P1_HUNGER_OPTIONS,
      ),
      mapQuestion(
        'c2_p2_delayed',
        'Reação ao atraso da refeição',
        'Fome',
        AYV_C2_PROMPTS.P2_DELAYED_MEAL.id,
        p2Opts,
      ),
      // Grupo Digestão
      mapQuestion(
        'c2_p3_post',
        'Sensação após a refeição habitual',
        'Digestão',
        AYV_C2_PROMPTS.P3_POST_MEAL.id,
        p3Opts,
      ),
      mapQuestion(
        'c2_p4_return',
        'Tempo de retorno da fome',
        'Digestão',
        AYV_C2_PROMPTS.P4_HUNGER_RETURN.id,
        AYV_C2_P4_HUNGER_RETURN_OPTIONS,
      ),
      mapQuestion(
        'c2_p5_demands',
        'Alimentos de digestão exigente',
        'Digestão',
        AYV_C2_PROMPTS.P5_FOOD_DEMANDS.id,
        AYV_C2_P5_FOOD_DEMANDS_OPTIONS,
      ),
      // Grupo Eliminação
      mapQuestion(
        'c2_p6_bowel',
        'Ritmo e regularidade intestinal',
        'Eliminação',
        AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.id,
        AYV_C2_P6_BOWEL_RHYTHM_OPTIONS,
      ),
      mapQuestion(
        'c2_p7_stool',
        'Apresentação habitual das fezes',
        'Eliminação',
        AYV_C2_PROMPTS.P7_STOOL_PATTERN.id,
        AYV_C2_P7_STOOL_OPTIONS,
      ),
      // Grupo Sono
      mapQuestion(
        'c2_p8_sleep',
        'Padrão habitual do sono',
        'Sono',
        AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id,
        AYV_C2_P8_SLEEP_OPTIONS,
      ),
      mapQuestion(
        'c2_p9_waking',
        'Disposição ao despertar',
        'Sono',
        AYV_C2_PROMPTS.P9_WAKING.id,
        AYV_C2_P9_WAKING_OPTIONS,
      ),
      // Grupo Energia
      mapQuestion(
        'c2_p10_energy',
        'Distribuição da energia ao longo do dia',
        'Energia',
        AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.id,
        AYV_C2_P10_ENERGY_OPTIONS,
      ),
      mapQuestion(
        'c2_p11_pace',
        'Ritmo corporal aproximado',
        'Energia',
        AYV_C2_PROMPTS.P11_BODY_PACE.id,
        AYV_C2_P11_BODY_PACE_OPTIONS,
      ),
      // Grupo Percepção do padrão habitual e confiança histórica
      mapQuestion(
        'c2_p12_confidence',
        'Representatividade temporal do padrão relatado',
        'Percepção do padrão habitual e confiança histórica',
        AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.id,
        AYV_C2_P12_CONFIDENCE_OPTIONS,
      ),
    ]
  }, [c2ActiveResponses, treatmentVariant])

  // Se houver falha de carregamento
  if (loadError) {
    return (
      <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
        <h4 className="text-sm font-semibold text-foreground">
          Não foi possível carregar as respostas agora.
        </h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Ocorreu uma instabilidade ao acessar os registros factuais. Seus dados permanecem
          intactos.
        </p>
        {onRetryLoad && (
          <Button variant="outline" size="sm" onClick={onRetryLoad} className="text-xs">
            Tentar novamente
          </Button>
        )}
      </div>
    )
  }

  // Renderizador de um cartão de pergunta com rigor epistêmico
  const renderQuestionCard = (item: LiteralQuestionItem) => {
    return (
      <div
        key={item.key}
        className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2 flex flex-col justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
              {item.group}
            </span>
            {item.epistemicStatus === 'unsure' && (
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-500/10"
              >
                Dúvida registrada
              </Badge>
            )}
            {item.epistemicStatus === 'refusal' && (
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-muted-foreground/40 text-muted-foreground bg-muted/30"
              >
                Recusa explícita
              </Badge>
            )}
            {item.epistemicStatus === 'unanswered' && (
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-muted-foreground/30 text-muted-foreground"
              >
                Pendente
              </Badge>
            )}
          </div>
          <h4 className="text-xs font-semibold text-foreground font-serif leading-snug">
            {item.title}
          </h4>
        </div>

        <div className="space-y-1.5 pt-1">
          <div
            className={`p-2 rounded-lg text-xs leading-relaxed border ${
              item.epistemicStatus === 'answered'
                ? 'bg-muted/20 border-border/50 text-foreground font-medium'
                : item.epistemicStatus === 'unsure'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 italic'
                  : item.epistemicStatus === 'refusal'
                    ? 'bg-muted/30 border-border/50 text-muted-foreground italic'
                    : 'bg-muted/10 border-dashed border-border/60 text-muted-foreground/80 italic'
            }`}
          >
            {item.valueDisplay}
          </div>

          {item.hasLowConfidence && (
            <div className="flex items-start gap-1.5 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Atenção clínica (Baixa confiança histórica):</strong>{' '}
                {item.lowConfidenceDetail || 'Variação relatada ao longo do tempo.'}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Renderizador do seletor e histórico de revisões de um capítulo
  const renderRevisionToolbar = (
    chapterTitle: string,
    revisions: ChapterRevisionInfo[],
    selectedRev: number,
    onSelectRev: (rev: number) => void,
    latestCompleted: number | null,
    draftRev: ChapterRevisionInfo | null,
    totalAnswered: number,
  ) => {
    const activeInfo = revisions.find((r) => r.revisionNumber === selectedRev)

    return (
      <div className="space-y-3 bg-muted/15 p-3.5 rounded-xl border border-border/60">
        {/* Aviso discreto se houver correção em andamento */}
        {draftRev && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium">Há uma correção em andamento.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                Referência principal ativa: <strong>Revisão {latestCompleted || 1}</strong>
              </span>
              <Button
                size="sm"
                variant={selectedRev === draftRev.revisionNumber ? 'default' : 'outline'}
                onClick={() => onSelectRev(draftRev.revisionNumber)}
                className="h-7 text-xs px-2.5"
              >
                Ver rascunho da correção
              </Button>
            </div>
          </div>
        )}

        {/* Barra de controle de revisão */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">Histórico de Versões:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {revisions.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  Nenhuma revisão registrada.
                </span>
              ) : (
                revisions.map((rev) => {
                  const isSelected = rev.revisionNumber === selectedRev
                  const isCompleted = rev.isCompleted
                  const isDraft = rev.isDraft

                  return (
                    <Button
                      key={rev.revisionNumber}
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => onSelectRev(rev.revisionNumber)}
                      className={`h-7 text-xs px-2.5 gap-1.5 transition-colors ${
                        isSelected ? '' : 'bg-background hover:bg-muted/50'
                      }`}
                    >
                      <span>Revisão {rev.revisionNumber}</span>
                      {isDraft && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 h-3.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-normal"
                        >
                          Rascunho
                        </Badge>
                      )}
                      {isCompleted && rev.revisionNumber === latestCompleted && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-normal"
                        >
                          Mais recente
                        </Badge>
                      )}
                    </Button>
                  )
                })
              )}
            </div>
          </div>

          {/* Metadados da revisão selecionada */}
          {activeInfo && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-3 flex-wrap">
              <span>
                Autoria: <strong>{activeInfo.authorName || participantName}</strong>
              </span>
              {activeInfo.createdAt && (
                <span>
                  Início:{' '}
                  {new Date(activeInfo.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              )}
              {activeInfo.completedAt ? (
                <span>
                  Conclusão:{' '}
                  {new Date(activeInfo.completedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              ) : (
                <span className="italic text-amber-700 dark:text-amber-300">
                  Rascunho da correção — ainda não concluído
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProfessionalAyurvedaCareReasoning
        responses={responses || []}
        participantName={participantName}
      />
      {/* ═══════════════════════════════════════════════════════════════════
          1. CABEÇALHO FACTUAL
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-serif text-foreground">Corpo & Fisiologia</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Acompanhamento factual das respostas declaradas por{' '}
              <strong className="text-foreground">{participantName}</strong> nos quatro capítulos
              desta dimensão.
            </p>
          </div>

          {/* Preferência de tratamento (se houver na área profissional) */}
          {treatmentPreference && (
            <div className="text-xs bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50 text-foreground/90 shrink-0">
              <span className="text-muted-foreground font-medium">Tratamento: </span>
              <span>
                {treatmentPreference === 'feminino' && 'Prefere linguagem no feminino'}
                {treatmentPreference === 'masculino' && 'Prefere linguagem no masculino'}
                {treatmentPreference === 'neutro' && 'Prefere linguagem neutra'}
                {treatmentPreference === 'outro' && (treatmentPreferenceCustom || 'De outra forma')}
              </span>
            </div>
          )}
        </div>

        {/* Estados dos Capítulos e Última Atualização (Sem porcentagens clínicas, notas ou doshas) */}
        <div className="grid grid-cols-1 gap-2.5 border-t border-border/40 pt-2 text-xs sm:grid-cols-2 lg:grid-cols-5">
          <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">
              Capítulo 1
            </span>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Badge
                variant={
                  c1DerivedStatus.status === 'completed'
                    ? 'secondary'
                    : c1DerivedStatus.status === 'not_started'
                      ? 'outline'
                      : 'default'
                }
                className="text-[10px]"
              >
                {getChapterStateLabel(
                  c1DerivedStatus.status,
                  c1RevisionsInfo.length > 0,
                  c1DraftRev,
                )}
              </Badge>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">
              Capítulo 2
            </span>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Badge
                variant={
                  c2DerivedStatus.status === 'completed'
                    ? 'secondary'
                    : c2DerivedStatus.status === 'not_started'
                      ? 'outline'
                      : 'default'
                }
                className="text-[10px]"
              >
                {getChapterStateLabel(
                  c2DerivedStatus.status,
                  c2RevisionsInfo.length > 0,
                  c2DraftRev,
                )}
              </Badge>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">
              Capítulo 3
            </span>
            <Badge
              variant={c3CurrentDerivedStatus.status === 'completed' ? 'secondary' : 'outline'}
              className="text-[10px]"
            >
              {getChapterStateLabel(c3CurrentDerivedStatus.status, false, null)}
            </Badge>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">
              Capítulo 4
            </span>
            <Badge variant={c4Completed ? 'secondary' : 'outline'} className="text-[10px]">
              {c4Completed
                ? 'Concluído'
                : c3CurrentDerivedStatus.status === 'completed'
                  ? 'Disponível'
                  : 'Bloqueado'}
            </Badge>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-mono block">
              Última atualização factual
            </span>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{lastFactualDate || 'Sem registros ainda'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEPARAÇÃO EPISTÊMICA E LIMITES PROFISSIONAIS OBRIGATÓRIOS
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5 text-xs">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Visualização Profissional Somente-Leitura (CER M4A)
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Esta área apresenta as respostas registradas pela interagente. A interpretação
            profissional será construída separadamente.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. PAINEL DO CAPÍTULO 1
         ═══════════════════════════════════════════════════════════════════ */}
      <Card className="border-border/70 shadow-none overflow-hidden">
        <CardHeader className="p-4 bg-muted/20 border-b border-border/40 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold font-serif text-foreground">
              Capítulo 1 — Minha estrutura e minhas características
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              8 tópicos canônicos
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Respostas literais distribuídas nos grupos: Estrutura corporal; Estabilidade e mudanças
            ao longo do tempo; Pele; Cabelo; Temperatura corporal; Sede; Preferência de bebidas;
            Transpiração.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {c1RevisionsInfo.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground italic text-xs">
              Esta interagente ainda não iniciou este capítulo.
            </div>
          ) : (
            <>
              {/* Barra de Revisões */}
              {renderRevisionToolbar(
                'Capítulo 1',
                c1RevisionsInfo,
                c1SelectedRev,
                (r) => setC1SelectedRev(r),
                c1LatestCompletedRev,
                c1DraftRev,
                c1QuestionsData.filter((q) => q.epistemicStatus !== 'unanswered').length,
              )}

              {/* Aviso se o capítulo estiver em andamento sem revisão concluída */}
              {c1RevisionsInfo.some(
                (revision) => revision.revisionNumber === c1SelectedRev && !revision.isCompleted,
              ) && (
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-950 dark:text-blue-200 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    Este capítulo está em andamento. As respostas abaixo ainda podem ser alteradas
                    pela interagente.
                  </span>
                </div>
              )}

              {/* Grid das respostas literais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {c1QuestionsData.map(renderQuestionCard)}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
          3. PAINEL DO CAPÍTULO 2
         ═══════════════════════════════════════════════════════════════════ */}
      <Card className="border-border/70 shadow-none overflow-hidden">
        <CardHeader className="p-4 bg-muted/20 border-b border-border/40 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold font-serif text-foreground">
              Capítulo 2 — O ritmo do meu corpo
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              12 perguntas canônicas
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Respostas literais distribuídas nos grupos: Fome; Digestão; Eliminação; Sono; Energia;
            Percepção do padrão habitual e confiança histórica.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {c2RevisionsInfo.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground italic text-xs">
              Esta interagente ainda não iniciou este capítulo.
            </div>
          ) : (
            <>
              {/* Barra de Revisões */}
              {renderRevisionToolbar(
                'Capítulo 2',
                c2RevisionsInfo,
                c2SelectedRev,
                (r) => setC2SelectedRev(r),
                c2LatestCompletedRev,
                c2DraftRev,
                c2QuestionsData.filter((q) => q.epistemicStatus !== 'unanswered').length,
              )}

              {/* Aviso se o capítulo estiver em andamento sem revisão concluída */}
              {c2RevisionsInfo.some(
                (revision) => revision.revisionNumber === c2SelectedRev && !revision.isCompleted,
              ) && (
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-950 dark:text-blue-200 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    Este capítulo está em andamento. As respostas abaixo ainda podem ser alteradas
                    pela interagente.
                  </span>
                </div>
              )}

              {/* Grid das respostas literais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {c2QuestionsData.map(renderQuestionCard)}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-none">
        <CardHeader className="space-y-1 border-b border-border/40 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-serif text-sm font-semibold">
              Capítulo 3 — O que está diferente agora
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {c3DerivedStatus.status === 'completed'
                ? 'Concluído'
                : c3DerivedStatus.status === 'ready_to_complete'
                  ? 'Pronto para concluir'
                  : c3DerivedStatus.status === 'in_progress'
                    ? 'Em andamento'
                    : 'Não iniciado'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Mudanças atuais preservadas separadamente das características e dos ritmos habituais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 text-xs">
          {c3AvailableRevisionNumbers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
              <History className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold">Histórico de Versões:</span>
              {c3AvailableRevisionNumbers.map((revision) => (
                <Button
                  key={revision}
                  size="sm"
                  variant={c3SelectedRevision === revision ? 'default' : 'outline'}
                  className="h-7 gap-1.5 px-2.5 text-xs"
                  onClick={() => setC3SelectedRevision(revision)}
                >
                  Revisão {revision}
                  {revision === c3DefaultRevision && (
                    <Badge variant="secondary" className="h-3.5 px-1 py-0 text-[9px] font-normal">
                      Mais recente
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
          {c3DerivedStatus.status === 'not_started' ? (
            <div className="py-8 text-center italic text-muted-foreground">
              Esta interagente ainda não iniciou este capítulo.
            </div>
          ) : (
            <>
              {c3DerivedStatus.status !== 'completed' && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-blue-950 dark:text-blue-200">
                  <Info className="h-4 w-4 shrink-0" />
                  Estas respostas ainda podem ser alteradas pela interagente.
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/60 p-3">
                  <span className="mb-1 block text-[10px] uppercase text-muted-foreground">
                    Áreas com mudança percebida
                  </span>
                  <p>
                    {(c3DerivedStatus.state.changed_domains || [])
                      .map((id) => chapter3Label(AYV_C3_DOMAIN_OPTIONS, id))
                      .join('; ') || 'Ainda não respondido.'}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 p-3">
                  <span className="mb-1 block text-[10px] uppercase text-muted-foreground">
                    Início percebido
                  </span>
                  <p>
                    {chapter3Label(AYV_C3_STARTED_OPTIONS, c3DerivedStatus.state.started_change_at)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 p-3 md:col-span-2">
                  <span className="mb-1 block text-[10px] uppercase text-muted-foreground">
                    Direção literal das mudanças
                  </span>
                  {(c3DerivedStatus.state.changed_domains || [])
                    .filter((domain) => c3DerivedStatus.state.change_directions?.[domain])
                    .map((domain) => (
                      <p key={domain} className="mt-1">
                        <strong>{chapter3Label(AYV_C3_DOMAIN_OPTIONS, domain)}:</strong>{' '}
                        {chapter3Label(
                          chapter3DirectionOptions(domain),
                          c3DerivedStatus.state.change_directions?.[domain],
                        )}
                      </p>
                    ))}
                </div>
                <div className="rounded-xl border border-border/60 p-3 md:col-span-2">
                  <span className="mb-1 block text-[10px] uppercase text-muted-foreground">
                    Contextos relacionados pela interagente
                  </span>
                  <p>
                    {(c3DerivedStatus.state.change_contexts || [])
                      .map((id) => chapter3Label(AYV_C3_CONTEXT_OPTIONS, id))
                      .join('; ') || 'Ainda não respondido.'}
                  </p>
                </div>
                {c3DerivedStatus.state.medication_status && (
                  <div className="space-y-3 rounded-xl border border-border/60 p-3 md:col-span-2">
                    <div>
                      <span className="mb-1 block text-[10px] uppercase text-muted-foreground">
                        Medicamentos e suplementos informados
                      </span>
                      <p>
                        {chapter3Label(
                          AYV_C3_MEDICATION_STATUS_OPTIONS,
                          c3DerivedStatus.state.medication_status,
                        )}
                      </p>
                    </div>
                    {(c3DerivedStatus.state.medication_items || []).map((item) => (
                      <div key={item.id} className="rounded-lg border border-border/50 p-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 text-muted-foreground">
                          {item.kind === 'supplement' ? 'Suplemento' : 'Medicamento'}
                          {item.dose ? ` • ${item.dose}` : ''}
                          {item.frequency ? ` • ${item.frequency}` : ''}
                        </p>
                        {item.timing && (
                          <p className="mt-1 text-muted-foreground">
                            {chapter3Label(AYV_C3_MEDICATION_TIMING_OPTIONS, item.timing)}
                            {item.started_or_changed_at ? ` • ${item.started_or_changed_at}` : ''}
                          </p>
                        )}
                        {item.purpose && (
                          <p className="mt-1 text-muted-foreground">
                            <strong>Uso informado:</strong> {item.purpose}
                          </p>
                        )}
                        {item.perceived_changes && (
                          <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                            <strong>
                              Percepção da interagente após começar, parar ou alterar:
                            </strong>{' '}
                            {item.perceived_changes}
                          </div>
                        )}
                      </div>
                    ))}
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Registro factual da interagente. Qualquer associação com sintomas precisa ser
                      verificada separadamente; este painel não estabelece causalidade nem orienta
                      alteração do tratamento.
                    </p>
                  </div>
                )}
                {c3DerivedStatus.state.optional_note && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 md:col-span-2">
                    <span className="mb-1 block text-[10px] uppercase text-primary">
                      Registro espontâneo
                    </span>
                    <p className="italic">“{c3DerivedStatus.state.optional_note}”</p>
                  </div>
                )}

                {/* Bloco Factual Profissional: Como meu corpo está agora (últimos 14 dias) */}
                {(() => {
                  const currentBodyBlock = buildAyurvedaCurrentBodyFactualBlock(
                    c3DerivedStatus.state,
                  )
                  return (
                    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3.5 md:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-primary/15 pb-2">
                        <span className="text-xs font-semibold text-foreground">
                          {currentBodyBlock.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Referência temporal: {currentBodyBlock.referenceText}
                        </span>
                      </div>
                      {currentBodyBlock.hasAnyData ? (
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {currentBodyBlock.items.map((item) => (
                            <div
                              key={item.areaId}
                              className="space-y-1 rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs"
                            >
                              <span className="block font-semibold text-foreground">
                                {item.title}
                              </span>
                              {item.summaryLines.map((line, lIdx) => (
                                <p key={lIdx} className="text-muted-foreground">
                                  <strong className="text-foreground/90">{line.label}:</strong>{' '}
                                  {line.value}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">
                          Nenhum registro específico preenchido para este bloco nesta revisão.
                        </p>
                      )}
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Registro factual da percepção atual da interagente (últimos 14 dias),
                        preservado separadamente da base habitual e sem presunção de causalidade.
                      </p>
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfessionalAyurvedaCorpoFisiologiaView
