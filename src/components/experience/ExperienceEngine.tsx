import React, { useState, useEffect, useMemo } from 'react'
import {
  experienceCatalogService,
  enrollmentExperienceService,
  experienceResponseService,
  resolveExperienceId,
} from '@/services/experienceEngine'
import type {
  CerExperienceRecord,
  CerExperienceMomentRecord,
  CerPromptRecord,
  EnrollmentExperienceRecord,
  ExperienceResponseRecord,
} from '@/types/cer'
import {
  ChoiceCards,
  MultiSelectCards,
  SimpleScale,
  Ordering,
  BodyMap,
  RelationalOrbitMap,
  ScenarioChoice,
  Timeline,
  FreeReflection,
  ProtectionPatternsChart,
  MindEmotionsReport,
} from '@/components/experience'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookmarkCheck,
  RotateCcw,
  Clock,
  ShieldCheck,
  ChevronRight,
  Save,
  AlertTriangle,
  AlertCircle,
  Lock,
} from 'lucide-react'
import {
  resolveExperienceOrchestration,
  FAILSAFE_MICROCOPY,
  auditRuntimeInvalid,
  getPromptKey,
  getPromptOrchestration,
} from '@/services/orchestrationResolver'
import { contextReuseService } from '@/services/contextReuseService'
import { personService } from '@/services/cer'
import { AvatarCustomizationFlow, AvatarCustomizationResult } from './AvatarCustomizationFlow'

export interface ExperienceEngineProps {
  experienceId: string
  enrollmentId: string
  respondentUserId: string
  personId?: string
  initialResponses?: ExperienceResponseRecord[]
  treatmentVariant?: 'feminino' | 'masculino' | 'neutro' | 'outro'
  onClose?: () => void
  onCompleted?: () => void
}

export const EMOTION_ID_TO_LABEL: Record<string, string> = {
  medo: 'medo',
  ansiedade_apreensao: 'ansiedade ou apreensão',
  tristeza: 'tristeza',
  apatia_desanimo: 'apatia ou desânimo',
  raiva: 'raiva',
  alegria: 'alegria',
  calma: 'calma',
  culpa: 'culpa',
  vergonha: 'vergonha',
}

export function formatSelectedEmotionsPhrase(selectedLabels: string[]): string {
  const filtered = selectedLabels.map((s) => s.trim()).filter(Boolean)
  if (filtered.length === 0) return ''
  if (filtered.length === 1) {
    return `Você selecionou: ${filtered[0]}.`
  }
  const last = filtered[filtered.length - 1]
  const initial = filtered.slice(0, -1).join(', ')
  return `Você selecionou: ${initial} e ${last}.`
}

export function formatSelectedEmotionsNatural(selectedLabels: string[]): string {
  const filtered = selectedLabels.map((s) => s.trim()).filter(Boolean)
  if (filtered.length === 0) return ''
  if (filtered.length === 1) return filtered[0]
  if (filtered.length === 2) return `${filtered[0]} e ${filtered[1]}`
  const last = filtered[filtered.length - 1]
  const initial = filtered.slice(0, -1).join(', ')
  return `${initial} e ${last}`
}

type EngineStage = 'opening' | 'moments' | 'closing'

export const ExperienceEngine: React.FC<ExperienceEngineProps> = ({
  experienceId,
  enrollmentId,
  respondentUserId,
  initialResponses,
  treatmentVariant = 'neutro',
  personId,
  onClose,
  onCompleted,
}) => {
  const [experience, setExperience] = useState<CerExperienceRecord | null>(null)
  const [isAvatarCustomizing, setIsAvatarCustomizing] = useState(false)
  const [personAvatarData, setPersonAvatarData] = useState<any>(null)
  const [justConfirmedAvatar, setJustConfirmedAvatar] = useState(false)
  const [showPatternsChart, setShowPatternsChart] = useState(false)
  const [showMindEmotionsReport, setShowMindEmotionsReport] = useState(false)
  const [hasIncompatibleMenteDemo, setHasIncompatibleMenteDemo] = useState(false)
  const [menteEmocoesNeedsRedo, setMenteEmocoesNeedsRedo] = useState(false)
  const [moments, setMoments] = useState<CerExperienceMomentRecord[]>([])
  const [prompts, setPrompts] = useState<CerPromptRecord[]>([])
  const [enrollmentExp, setEnrollmentExp] = useState<EnrollmentExperienceRecord | null>(null)
  const [responsesMap, setResponsesMap] = useState<Record<string, ExperienceResponseRecord>>(() => {
    if (initialResponses && initialResponses.length > 0) {
      const map: Record<string, ExperienceResponseRecord> = {}
      for (const r of initialResponses) {
        const pKey =
          (r as any).prompt_key ||
          (r.structured_value as any)?.metadata?.prompt_key ||
          (r.structured_value as any)?.prompt_key
        if (r.prompt_id) {
          map[r.prompt_id] = r
        }
        if (pKey) {
          map[pKey] = r
        }
        if (r.id) {
          map[r.id] = r
        }
      }
      return map
    }
    return {}
  })
  const [orderingInteracted, setOrderingInteracted] = useState(false)

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [engineStage, setEngineStage] = useState<EngineStage>('opening')
  const [isReviewOnly, setIsReviewOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadAttempt, setReloadAttempt] = useState(0)
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)
  const [closingReflection, setClosingReflection] = useState('')

  // Build 07A — Estado de Orquestração, Fail-Safe e Open-First
  const [orchestrationFailed, setOrchestrationFailed] = useState(false)
  const [orchestrationFailMessage, setOrchestrationFailMessage] = useState(FAILSAFE_MICROCOPY)
  const [showOpenFirstSuggestions, setShowOpenFirstSuggestions] = useState(false)
  const [currentNamingOrigin, setCurrentNamingOrigin] = useState<
    'spontaneous' | 'selected_after_prompting' | 'not_applicable'
  >('spontaneous')
  const [reusedContextBinding, setReusedContextBinding] = useState<any>(null)

  // Resposta em edição do momento atual
  const [currentDraftValue, setCurrentDraftValue] = useState<unknown>(null)
  const [currentDraftText, setCurrentDraftText] = useState('')

  // Normalização universal de respostas para o MindEmotionsReport
  const normalizedResponsesForReport: Record<string, ExperienceResponseRecord> = useMemo(() => {
    const map: Record<string, ExperienceResponseRecord> = { ...responsesMap }
    for (const [key, resp] of Object.entries(responsesMap)) {
      if (!resp) continue
      const matchedPrompt = prompts.find((p) => p.id === resp.prompt_id || p.id === key)
      const promptKey =
        (matchedPrompt?.schema_config as any)?.prompt_key ||
        (resp as any).prompt_key ||
        (resp.structured_value as any)?.metadata?.prompt_key ||
        (resp.structured_value as any)?.prompt_key
      const stepOrder = matchedPrompt?.step_order || (resp as any).step_order
      const canonicalPromptId =
        matchedPrompt?.id || (resp as any).canonical_prompt_id || resp.prompt_id

      const enriched: ExperienceResponseRecord = {
        ...resp,
        ...(promptKey ? { prompt_key: promptKey } : {}),
        ...(stepOrder ? { step_order: stepOrder } : {}),
        ...(canonicalPromptId ? { canonical_prompt_id: canonicalPromptId } : {}),
      } as any

      map[key] = enriched
      if (resp.prompt_id) map[resp.prompt_id] = enriched
      if (promptKey) map[promptKey] = enriched
      if (canonicalPromptId) map[canonicalPromptId] = enriched
      if (stepOrder) {
        map[`p${stepOrder}`] = enriched
        map[`me_p${stepOrder}`] = enriched
        if (stepOrder === 14) {
          map['p13'] = enriched
          map['me_p13'] = enriched
          map['campo_final_opcional'] = enriched
        }
      }
    }
    return map
  }, [responsesMap, prompts])

  // Carregar metadados da experiência, prompts e respostas salvas
  useEffect(() => {
    let isMounted = true
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const loadEngineData = async () => {
      setLoading(true)
      setLoadError(null)

      // Timeout de guarda (8s) para que o loading nunca fique indefinido
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('TIMEOUT_LOADING_EXPERIENCE'))
        }, 8000)
      })

      const executeLoading = async () => {
        const canonicalId = resolveExperienceId(experienceId)
        const isCorpoExp = canonicalId === 'exp-corpo-fisiologia-07b'

        // 1. Em modo demo ou para Corpo & Fisiologia, avatar é resolvido localmente primeiro
        const { demoAdapter } = await import('@/services/demoAdapter')
        const isDemo = demoAdapter.isEnabled()

        let pRecord: any = null
        if (isCorpoExp) {
          try {
            if (isDemo) {
              pRecord =
                (personId ? demoAdapter.getPersonById(personId) : null) ||
                demoAdapter.getCurrentPerson()
            } else if (personId) {
              pRecord = await personService.getById(personId)
            }
            if (pRecord && isMounted) {
              setPersonAvatarData(pRecord)
              if (
                !pRecord.avatar_customization_status ||
                (pRecord.avatar_customization_status !== 'completed' &&
                  pRecord.avatar_customization_status !== 'deferred')
              ) {
                setIsAvatarCustomizing(true)
              }
            }
          } catch (pErr) {
            console.error('Erro ao verificar status de personalização estética do avatar:', pErr)
          }
        }

        // 2. Carregar catálogo, momentos, prompts, enrollmentExp e respostas com isolamento de falha
        const results = await Promise.allSettled([
          experienceCatalogService.getExperienceById(experienceId),
          experienceCatalogService.listMomentsByExperience(experienceId),
          experienceCatalogService.listPromptsByExperience(experienceId),
          enrollmentExperienceService.getByEnrollmentAndExperience(enrollmentId, experienceId),
          experienceResponseService.listResponsesByExperience(enrollmentId, experienceId),
        ])

        if (!isMounted) return

        let exp: CerExperienceRecord | null =
          results[0].status === 'fulfilled' ? results[0].value : null
        let momentList: CerExperienceMomentRecord[] =
          results[1].status === 'fulfilled' ? results[1].value : []
        let promptList: CerPromptRecord[] =
          results[2].status === 'fulfilled' ? results[2].value : []
        const enrExp: EnrollmentExperienceRecord | null =
          results[3].status === 'fulfilled' ? results[3].value : null
        const existingResponses: ExperienceResponseRecord[] =
          results[4].status === 'fulfilled' ? results[4].value : []

        // Resiliência obrigatória: deriva deterministicamente do catálogo local se nulo
        if (!exp) {
          if (canonicalId === 'exp-corpo-fisiologia-07b') {
            const mod = await import('@/services/build07bPrompts')
            exp = mod.CORPO_FISIOLOGIA_EXPERIENCE
          } else if (canonicalId === 'exp-mente-emocoes-07c') {
            const mod = await import('@/services/build07cPrompts')
            exp = mod.MENTE_EMOCOES_EXPERIENCE
          } else if (canonicalId === 'exp-regulacao-respostas-07c') {
            const mod = await import('@/services/build07cPrompts')
            exp = mod.REGULACAO_RESPOSTAS_EXPERIENCE
          } else if (canonicalId === 'exp-relacoes-07d') {
            const mod = await import('@/services/build07dPrompts')
            exp = mod.RELACOES_EXPERIENCE
          } else if (canonicalId === 'exp-sexualidade-07e') {
            const mod = await import('@/services/build07ePrompts')
            exp = mod.SEXUALIDADE_EXPERIENCE
          } else if (canonicalId === 'exp-sentido-conexao-07f') {
            const mod = await import('@/services/build07fPrompts')
            exp = mod.SENTIDO_CONEXAO_EXPERIENCE
          } else if (canonicalId === 'exp-integracao-consciencia-07g') {
            const mod = await import('@/services/build07gPrompts')
            exp = mod.INTEGRACAO_CONSCIENCIA_EXPERIENCE
          }
        }

        if (momentList.length === 0) {
          if (canonicalId === 'exp-corpo-fisiologia-07b') {
            const mod = await import('@/services/build07bPrompts')
            momentList = mod.CORPO_FISIOLOGIA_MOMENTS
          } else if (canonicalId === 'exp-mente-emocoes-07c') {
            const mod = await import('@/services/build07cPrompts')
            momentList = mod.MENTE_EMOCOES_MOMENTS
          } else if (canonicalId === 'exp-regulacao-respostas-07c') {
            const mod = await import('@/services/build07cPrompts')
            momentList = mod.REGULACAO_RESPOSTAS_MOMENTS
          } else if (canonicalId === 'exp-relacoes-07d') {
            const mod = await import('@/services/build07dPrompts')
            momentList = mod.RELACOES_MOMENTS
          } else if (canonicalId === 'exp-sexualidade-07e') {
            const mod = await import('@/services/build07ePrompts')
            momentList = mod.SEXUALIDADE_MOMENTS
          } else if (canonicalId === 'exp-sentido-conexao-07f') {
            const mod = await import('@/services/build07fPrompts')
            momentList = mod.SENTIDO_CONEXAO_MOMENTS
          } else if (canonicalId === 'exp-integracao-consciencia-07g') {
            const mod = await import('@/services/build07gPrompts')
            momentList = mod.INTEGRACAO_CONSCIENCIA_MOMENTS
          }
        }

        if (promptList.length === 0) {
          if (canonicalId === 'exp-corpo-fisiologia-07b') {
            const mod = await import('@/services/build07bPrompts')
            promptList = mod.BUILD_07B_PROMPTS
          } else if (canonicalId === 'exp-mente-emocoes-07c') {
            const mod = await import('@/services/build07cPrompts')
            promptList = mod.BUILD_07C_MENTE_PROMPTS
          } else if (canonicalId === 'exp-regulacao-respostas-07c') {
            const mod = await import('@/services/build07cPrompts')
            promptList = mod.BUILD_07C_REGULACAO_PROMPTS
          } else if (canonicalId === 'exp-relacoes-07d') {
            const mod = await import('@/services/build07dPrompts')
            promptList = mod.BUILD_07D_RELACOES_PROMPTS
          } else if (canonicalId === 'exp-sexualidade-07e') {
            const mod = await import('@/services/build07ePrompts')
            promptList = mod.BUILD_07E_SEXUALIDADE_PROMPTS
          } else if (canonicalId === 'exp-sentido-conexao-07f') {
            const mod = await import('@/services/build07fPrompts')
            promptList = mod.BUILD_07F_SENTIDO_PROMPTS
          } else if (canonicalId === 'exp-integracao-consciencia-07g') {
            const mod = await import('@/services/build07gPrompts')
            promptList = mod.BUILD_07G_INTEGRACAO_PROMPTS
          }
        }

        // Se mesmo com os fallbacks a experiência principal necessária for nula, lançar falha necessária
        if (!exp) {
          throw new Error('EXPERIENCE_RECORD_UNAVAILABLE')
        }

        setExperience(exp)
        setMoments(momentList)
        setPrompts(promptList)
        setEnrollmentExp(enrExp)

        const map: Record<string, ExperienceResponseRecord> = {}
        for (const resp of existingResponses) {
          const matchedPrompt = promptList.find((p) => p.id === resp.prompt_id)
          const promptKey =
            (matchedPrompt?.schema_config as any)?.prompt_key ||
            (resp as any).prompt_key ||
            (resp.structured_value as any)?.metadata?.prompt_key
          const enrichedResp: ExperienceResponseRecord = {
            ...resp,
            ...(promptKey ? { prompt_key: promptKey } : {}),
            ...(matchedPrompt?.step_order ? { step_order: matchedPrompt.step_order } : {}),
            canonical_prompt_id: resp.prompt_id,
          } as any
          map[resp.prompt_id] = enrichedResp
          if (promptKey) {
            map[promptKey] = enrichedResp
          }
          if (matchedPrompt?.step_order) {
            map[`p${matchedPrompt.step_order}`] = enrichedResp
            if (matchedPrompt.step_order === 14) {
              map['p13'] = enrichedResp
              map['me_p13'] = enrichedResp
              map['campo_final_opcional'] = enrichedResp
            }
          }
        }
        setResponsesMap(map)

        // Inicializar reflexão de fechamento a partir da P13 caso já preenchida
        const p13Existing =
          map['p-07c-pm5-p13-campo-final-opcional'] ||
          map['campo_final_opcional'] ||
          map['p13'] ||
          map['p14']
        if (p13Existing) {
          const sVal = p13Existing.structured_value as any
          const txt =
            p13Existing.free_text ||
            (typeof sVal === 'object' && sVal !== null ? sVal.value || sVal.text : sVal) ||
            ''
          if (typeof txt === 'string' && txt.trim()) {
            setClosingReflection(txt.trim())
          }
        }

        // Para o fluxo canônico de Corpo & Fisiologia (Capítulo 1), o hub e catálogo do Capítulo 1
        // têm ciclo próprio e não são governados pela orquestração dos 15 momentos legados.
        // O progresso legado permanece preservado em enrExp/existingResponses.
        if (isCorpoExp) {
          // Desacoplado: Capítulo 1 tem prioridade limpa
          setOrchestrationFailed(false)
          return
        }

        // Verificar se há registros incompatíveis da demo arquivados ou ativos
        const isMenteExp = canonicalId === 'exp-mente-emocoes-07c'
        if (isMenteExp) {
          if (isDemo) {
            if (demoAdapter.isMenteEmocoesRedoNeeded()) {
              setMenteEmocoesNeedsRedo(true)
            }
            if (demoAdapter.hasIncompatibleMenteEmocoesDemo()) {
              setHasIncompatibleMenteDemo(true)
            }
          }
        }

        // Retomada inteligente de progresso via OrchestrationResolver (experiências regulares):
        const orchResult = resolveExperienceOrchestration({
          prompts: promptList,
          responses: existingResponses,
          currentStepOrder: enrExp?.current_step_order || 1,
        })

        if (orchResult.status === 'ORCHESTRATION_UNAVAILABLE') {
          setOrchestrationFailed(true)
          setOrchestrationFailMessage(orchResult.displayMessage || FAILSAFE_MICROCOPY)
          auditRuntimeInvalid({
            actorUserId: respondentUserId,
            enrollmentId,
            experienceId,
            reasonCode: orchResult.reasonCode || 'RUNTIME_INVALID',
          })
        } else {
          setOrchestrationFailed(false)
          let isSafelyCompleted = enrExp?.progress_status === 'completed'
          if (isSafelyCompleted && isMenteExp) {
            if (isDemo) {
              const coverage = demoAdapter.checkMenteEmocoesCoverage(enrollmentId)
              if (!coverage.isCoverageComplete) {
                isSafelyCompleted = false
                setMenteEmocoesNeedsRedo(true)
                setHasIncompatibleMenteDemo(true)
                await enrollmentExperienceService.updateProgress(enrExp!.id, {
                  progressStatus: 'in_progress',
                  enrollmentId,
                })
              }
            }
          }

          if (isSafelyCompleted) {
            setEngineStage('closing')
          } else {
            setCurrentStepIndex(orchResult.currentStepIndex)
          }
        }
      }

      try {
        await Promise.race([executeLoading(), timeoutPromise])
      } catch (err) {
        console.error('Erro ao carregar dados do Experience Engine:', err)
        if (isMounted) {
          setLoadError('Não foi possível preparar esta experiência agora.')
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadEngineData()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [experienceId, enrollmentId, respondentUserId, personId, reloadAttempt])

  // Atualizar rascunho sempre que o prompt atual mudar
  useEffect(() => {
    const currentPrompt = prompts[currentStepIndex]
    setShowOpenFirstSuggestions(false)
    setCurrentNamingOrigin('spontaneous')
    setReusedContextBinding(null)

    if (currentPrompt) {
      const existing = responsesMap[currentPrompt.id]
      setOrderingInteracted(false)

      const schema = (currentPrompt.schema_config || {}) as any

      // Checar se há contexto reutilizado configurado (Registro Único puro)
      if (schema.context_reuse && schema.context_reuse.concept_key) {
        contextReuseService
          .findReusableContext({
            enrollmentId,
            conceptKey: schema.context_reuse.concept_key,
            temporality: schema.context_reuse.temporality,
            frameworkId: schema.context_reuse.framework_id,
            requestingAccessDestination: schema.access_destination || 'shared_care',
          })
          .then((res) => {
            if (res.hasMatch && res.isDisplayableToParticipant) {
              setReusedContextBinding(res)
              // Reuso puro audit
              contextReuseService.auditReusedContextPresented({
                actorUserId: respondentUserId,
                enrollmentId,
                promptKey: getPromptKey(currentPrompt),
                sourceConceptKey: res.conceptKey || schema.context_reuse.concept_key,
                sourceAccessClass: res.sourceAccessClass || 'shared_care',
              })
            }
          })
          .catch(() => {})
      }

      if (existing) {
        const sVal = existing.structured_value as any
        setCurrentDraftValue(existing.structured_value)
        setCurrentDraftText(existing.free_text || '')
        if (sVal && sVal.naming_origin) {
          setCurrentNamingOrigin(sVal.naming_origin)
        }
        if (currentPrompt.component_type === 'Ordering') {
          setOrderingInteracted(true)
        }
      } else {
        // Correção de defaults metodológicos:
        if (
          currentPrompt.component_type === 'MultiSelectCards' ||
          currentPrompt.component_type === 'BodyMap'
        ) {
          setCurrentDraftValue([])
        } else if (currentPrompt.component_type === 'Ordering') {
          const cfg = currentPrompt.schema_config as { items?: { id: string }[] }
          setCurrentDraftValue(cfg?.items?.map((i) => i.id) || [])
          setOrderingInteracted(false)
        } else {
          setCurrentDraftValue(null)
        }
        setCurrentDraftText('')
      }
    }
  }, [currentStepIndex, prompts, responsesMap, enrollmentId, respondentUserId])

  const handleStartExperience = async () => {
    setEngineStage('moments')
    if (enrollmentExp) {
      const updated = await enrollmentExperienceService.updateProgress(enrollmentExp.id, {
        progressStatus: 'in_progress',
        stepOrder: prompts[currentStepIndex]?.step_order || 1,
      })
      setEnrollmentExp(updated)
    }
  }

  const handleReturnToClosingFromReview = () => {
    setIsReviewOnly(false)
    setEngineStage('closing')
  }

  const saveCurrentStepResponse = async () => {
    if (isReviewOnly) return
    const currentPrompt = prompts[currentStepIndex]
    if (!currentPrompt) return

    // Se SimpleScale não teve valor selecionado e não é required, salvar null
    // Se for Ordering e o usuário não interagiu, preserva apenas se já salvo
    const valToSave = currentDraftValue

    setSaving(true)
    try {
      // Build 07A: Usar SEMPRE a configuração versionada access_destination do prompt (default seguro: shared_care)
      const pSchema = (currentPrompt.schema_config || {}) as any
      const targetAccessClass = pSchema.access_destination || 'shared_care'
      const pKey = pSchema.prompt_key
      const temporality = pSchema.temporality || 'recurring'
      const isFreeSpeech =
        currentPrompt.component_type === 'FreeReflection' || Boolean(currentDraftText)
      const isStructured = Boolean(valToSave !== null && valToSave !== undefined)

      const responseMetadata = {
        participant_free_speech: isFreeSpeech,
        structured_selection: isStructured,
        temporality,
        current_state_vs_habitual:
          pSchema.metadata_classification === 'current_state_only'
            ? 'current_state'
            : 'habitual_pattern',
        context: pKey === 'movimentos_sob_pressao' ? 'under_pressure' : 'general',
        resource: pKey === 'recursos_recuperar_espaco' || pKey === 'mente_movimento_ajuda',
        perceived_cost: pKey === 'mente_movimento_cansa' || pKey === 'efeito_da_cobranca',
        access_class: targetAccessClass,
        indicator_to_confirm:
          pKey === 'movimentos_sob_pressao' ? 'mental_movements_under_pressure' : null,
        absent_information: valToSave === null || valToSave === undefined,
        prompt_key: pKey,
        canonical_prompt_id: currentPrompt.id,
        step_order: currentPrompt.step_order,
      }

      // Envelopar SEMPRE em objeto plano (NUNCA anexar propriedades diretamente a instâncias de Array,
      // pois perdem-se em JSON.stringify).
      let structToSave: any
      if (Array.isArray(valToSave)) {
        // Para múltipla escolha ou coleções (MultiSelectCards, Ordering, BodyMap, etc.)
        structToSave = {
          selectedOptionIds: valToSave,
          value: valToSave,
          collection_origin: 'newly_collected',
          ...(pSchema.open_first?.enabled ? { naming_origin: currentNamingOrigin } : {}),
          prompt_key: pKey,
          canonical_prompt_id: currentPrompt.id,
          metadata: responseMetadata,
        }
      } else if (valToSave !== null && typeof valToSave === 'object') {
        const rawObj = valToSave as Record<string, any>
        // Verificar se é formato de escala ou mapa de ratings
        const isRatingsMap =
          pKey === 'movimentos_automaticos_frequencia_p1' ||
          pKey === 'movimentos_automaticos_frequencia_p2' ||
          'ratings' in rawObj

        if (isRatingsMap && !('ratings' in rawObj)) {
          structToSave = {
            ratings: { ...rawObj },
            collection_origin: rawObj.collection_origin || 'newly_collected',
            ...(pSchema.open_first?.enabled
              ? { naming_origin: rawObj.naming_origin || currentNamingOrigin }
              : {}),
            prompt_key: pKey,
            canonical_prompt_id: currentPrompt.id,
            metadata: responseMetadata,
          }
        } else {
          structToSave = {
            ...rawObj,
            collection_origin: rawObj.collection_origin || 'newly_collected',
            ...(pSchema.open_first?.enabled
              ? { naming_origin: rawObj.naming_origin || currentNamingOrigin }
              : {}),
            prompt_key: pKey || rawObj.prompt_key,
            canonical_prompt_id: currentPrompt.id || rawObj.canonical_prompt_id,
            metadata: responseMetadata,
          }
        }
      } else if (
        typeof valToSave === 'string' ||
        typeof valToSave === 'number' ||
        typeof valToSave === 'boolean'
      ) {
        // Escolha única ou valor escalar
        structToSave = {
          value: valToSave,
          choice: typeof valToSave === 'string' ? valToSave : undefined,
          collection_origin: 'newly_collected',
          ...(pSchema.open_first?.enabled ? { naming_origin: currentNamingOrigin } : {}),
          prompt_key: pKey,
          canonical_prompt_id: currentPrompt.id,
          metadata: responseMetadata,
        }
      } else {
        structToSave = valToSave
      }

      // Tratar texto livre privado em telas com privacy_split:
      // se share_private_text_with_professional for falso, o freeText NÃO é enviado ao campo compartilhado
      let effectiveFreeText =
        currentPrompt.component_type === 'FreeReflection'
          ? (currentDraftValue as string) || currentDraftText
          : currentDraftText

      if (pSchema.privacy_split?.enabled) {
        const canShareText = Boolean(structToSave?.share_private_text_with_professional)
        if (!canShareText) {
          effectiveFreeText = '' // Permanece estritamente privado, mantido apenas no structured_value com flag privada
        }
      }

      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: currentPrompt.id,
        respondentUserId,
        responseType: currentPrompt.component_type,
        promptVersion: currentPrompt.version,
        structuredValue: structToSave,
        freeText: effectiveFreeText,
        accessClass: targetAccessClass,
        changeReason: responsesMap[currentPrompt.id]
          ? 'Atualização pelo interagente durante a experiência'
          : 'Primeiro registro de resposta',
        promptKey: pKey,
        canonicalPromptId: currentPrompt.id,
        stepOrder: currentPrompt.step_order,
      })

      // Se for a P13 (campo final opcional), sincroniza reflexão de fechamento
      if (
        currentPrompt.id === 'p-07c-pm5-p13-campo-final-opcional' ||
        pKey === 'campo_final_opcional'
      ) {
        if (typeof effectiveFreeText === 'string') {
          setClosingReflection(effectiveFreeText)
        }
      }

      // Enriquecer registro local com chaves canônicas
      const enrichedSaved: ExperienceResponseRecord = {
        ...saved,
        ...(pKey ? { prompt_key: pKey } : {}),
        ...(currentPrompt.step_order ? { step_order: currentPrompt.step_order } : {}),
        canonical_prompt_id: currentPrompt.id,
      } as any

      setResponsesMap((prev) => ({
        ...prev,
        [currentPrompt.id]: enrichedSaved,
        ...(pKey ? { [pKey]: enrichedSaved } : {}),
        ...(currentPrompt.step_order ? { [`p${currentPrompt.step_order}`]: enrichedSaved } : {}),
        ...(currentPrompt.step_order === 14 ? { p13: enrichedSaved, me_p13: enrichedSaved } : {}),
      }))
      if (
        currentPrompt.id === 'p-07c-pm5-p13-campo-final-opcional' ||
        pKey === 'campo_final_opcional'
      ) {
        if (typeof effectiveFreeText === 'string') {
          setClosingReflection(effectiveFreeText)
        }
      }
      setLastSavedTime(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      )

      // Atualizar progresso no enrollment_experience
      if (enrollmentExp) {
        const nextOrder = currentPrompt.step_order
        const updated = await enrollmentExperienceService.updateProgress(enrollmentExp.id, {
          stepOrder: nextOrder,
          progressStatus: 'in_progress',
        })
        setEnrollmentExp(updated)
      }
    } catch (err) {
      console.error('Falha ao salvar resposta do prompt:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleNextStep = async () => {
    if (isReviewOnly) {
      if (isLastStep) {
        handleReturnToClosingFromReview()
      } else {
        // Na revisão somente-leitura, navegar linearmente pelos prompts elegíveis ou disponíveis
        const currentPrompt = prompts[currentStepIndex]
        const orch = resolveExperienceOrchestration({
          prompts,
          responses: Object.values(responsesMap),
          currentStepOrder: (currentPrompt.step_order || 0) + 1,
        })
        if (orch.nextPrompt) {
          const nextIdx = prompts.findIndex((p) => p.id === orch.nextPrompt!.id)
          if (nextIdx >= 0) {
            setCurrentStepIndex(nextIdx)
            return
          }
        }
        if (currentStepIndex + 1 < prompts.length) {
          setCurrentStepIndex(currentStepIndex + 1)
        } else {
          handleReturnToClosingFromReview()
        }
      }
      return
    }

    await saveCurrentStepResponse()

    // Recalcular orquestração com as respostas atualizadas
    const currentResponses = Object.values(responsesMap)
    // Incluir temporariamente a resposta do passo atual com metadados canônicos completos
    const currentPrompt = prompts[currentStepIndex]
    const pSchema = (currentPrompt.schema_config || {}) as any
    const pKey = pSchema.prompt_key
    const updatedResponses = [...currentResponses.filter((r) => r.prompt_id !== currentPrompt.id)]
    updatedResponses.push({
      id: 'temp_resp',
      enrollment_id: enrollmentId,
      experience_id: experienceId,
      prompt_id: currentPrompt.id,
      respondent_user_id: respondentUserId,
      response_type: currentPrompt.component_type,
      access_class: pSchema.access_destination || 'shared_care',
      structured_value: currentDraftValue,
      free_text: currentDraftText,
      prompt_version: currentPrompt.version,
      version: 1,
      status: 'saved',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      ...(pKey ? { prompt_key: pKey } : {}),
      ...(currentPrompt.id ? { canonical_prompt_id: currentPrompt.id } : {}),
      ...(currentPrompt.step_order ? { step_order: currentPrompt.step_order } : {}),
    } as any)

    const orch = resolveExperienceOrchestration({
      prompts,
      responses: updatedResponses,
      currentStepOrder: (currentPrompt.step_order || 0) + 1,
    })

    if (orch.status === 'ORCHESTRATION_UNAVAILABLE') {
      setOrchestrationFailed(true)
      setOrchestrationFailMessage(orch.displayMessage || FAILSAFE_MICROCOPY)
      auditRuntimeInvalid({
        actorUserId: respondentUserId,
        enrollmentId,
        experienceId,
        reasonCode: orch.reasonCode || 'RUNTIME_INVALID',
      })
      return
    }

    if (isLastStep || orch.isCompleted || !orch.nextPrompt) {
      await handleCompleteExperience()
    } else {
      const nextIdx = prompts.findIndex((p) => p.id === orch.nextPrompt!.id)
      if (nextIdx >= 0) {
        setCurrentStepIndex(nextIdx)
      } else {
        await handleCompleteExperience()
      }
    }
  }

  const handleLegitimateSkip = async (reason: 'nao_sei' | 'prefiro_nao_responder') => {
    if (isReviewOnly) return
    const currentPrompt = prompts[currentStepIndex]
    if (!currentPrompt) return

    setSaving(true)
    try {
      const pSchema = (currentPrompt.schema_config || {}) as any
      const targetAccessClass = pSchema.access_destination || 'shared_care'

      const pKey = pSchema.prompt_key
      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: currentPrompt.id,
        respondentUserId,
        responseType: currentPrompt.component_type,
        promptVersion: currentPrompt.version,
        structuredValue: {
          is_legitimate_skip: true,
          skip_reason: reason,
          collection_origin: 'newly_collected',
          prompt_key: pKey,
          canonical_prompt_id: currentPrompt.id,
          metadata: {
            prompt_key: pKey,
            canonical_prompt_id: currentPrompt.id,
            step_order: currentPrompt.step_order,
            absent_information: false,
            is_legitimate_skip: true,
            skip_reason: reason,
          },
        },
        freeText: reason === 'nao_sei' ? 'Não sei' : 'Prefiro não responder',
        accessClass: targetAccessClass,
        changeReason: 'Declaração legítima de resposta não punitiva (' + reason + ')',
        promptKey: pKey,
        canonicalPromptId: currentPrompt.id,
        stepOrder: currentPrompt.step_order,
      })

      const enrichedSaved: ExperienceResponseRecord = {
        ...saved,
        ...(pKey ? { prompt_key: pKey } : {}),
        ...(currentPrompt.step_order ? { step_order: currentPrompt.step_order } : {}),
        canonical_prompt_id: currentPrompt.id,
      } as any

      setResponsesMap((prev) => ({
        ...prev,
        [currentPrompt.id]: enrichedSaved,
        ...(pKey ? { [pKey]: enrichedSaved } : {}),
      }))
      handleNextStep()
    } catch (err) {
      console.error('Falha ao registrar recusa legítima:', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
      return
    }
    if (isReviewOnly) {
      handleReturnToClosingFromReview()
    }
  }

  const handleCompleteExperience = async () => {
    if (isReviewOnly) {
      handleReturnToClosingFromReview()
      return
    }
    // Validar se perguntas obrigatórias sem resposta impedem o status completed
    // Se for Mente & Emoções, verificar a cobertura canônica
    if (isMenteEmocoes) {
      const { demoAdapter } = await import('@/services/demoAdapter')
      if (demoAdapter.isEnabled()) {
        const coverage = demoAdapter.checkMenteEmocoesCoverage(enrollmentId)
        if (!coverage.isCoverageComplete) {
          // Bloqueia completed se faltarem obrigatórias sem escolha explícita nem resposta
          // Falha fechado: volta para moments no primeiro passo não respondido
          const missingKey = Object.entries(coverage.details).find(
            ([, val]) => val.status === 'missing_or_incompatible',
          )?.[0]
          if (missingKey) {
            const missingIdx = prompts.findIndex(
              (p) => (p.schema_config as any)?.prompt_key === missingKey || p.id === missingKey,
            )
            if (missingIdx >= 0) {
              setCurrentStepIndex(missingIdx)
            }
          }
          setEngineStage('moments')
          return
        }
      }
    }

    if (enrollmentExp) {
      const updated = await enrollmentExperienceService.updateProgress(enrollmentExp.id, {
        completed: true,
        progressStatus: 'completed',
        enrollmentId,
      })
      setEnrollmentExp(updated)
    }
    setEngineStage('closing')
    onCompleted?.()
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div
          data-testid="loading-spinner"
          className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
        />
        <p className="text-xs text-muted-foreground">Preparando sua experiência...</p>
      </div>
    )
  }

  // Rede de proteção: falha necessária com botão de nova tentativa real
  if (loadError) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
          <AlertCircle className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{loadError}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seus dados e respostas anteriores estão preservados com segurança.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            type="button"
            onClick={() => setReloadAttempt((prev) => prev + 1)}
            className="text-xs h-9 px-6 gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-9 px-4">
              Voltar
            </Button>
          )}
        </div>
      </div>
    )
  }

  // BUILD 07A — FAIL-SAFE DE RUNTIME: Interrupção Segura (Nunca Degradar para Caminho Linear)
  if (orchestrationFailed) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
          <AlertTriangle className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-medium text-foreground">
            Experiência em Pausa Segura
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {orchestrationFailMessage}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/70 text-xs text-muted-foreground space-y-2 text-left">
          <p className="text-foreground font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Integridade Preservada:</span>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Nenhuma resposta anterior foi apagada ou alterada.</li>
            <li>Seu progresso está seguro e nenhuma marcação incorreta foi feita.</li>
            <li>Quando o roteiro for normalizado, você poderá retomar exatamente daqui.</li>
          </ul>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button onClick={onClose} variant="outline" className="text-xs h-9 px-6">
            Voltar ao Início
          </Button>
        </div>
      </div>
    )
  }

  if (!experience || prompts.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <Sparkles className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground/90 leading-relaxed font-sans">
            Esta experiência está sendo preparada e estará disponível em breve.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-9 px-6">
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // CER V1 — LOTE 0B2: PERSONALIZAÇÃO ESTÉTICA DA INTERAGENTE
  // -------------------------------------------------------------
  if (isAvatarCustomizing && experience) {
    const handleAvatarConfirm = async (result: AvatarCustomizationResult) => {
      try {
        const targetId = personId || personAvatarData?.id || 'demo-person-mariana'
        const updated = await personService.updateAvatarCustomization(targetId, {
          avatar_presentation: result.presentation,
          avatar_skin_tone: result.skinTone,
          avatar_hair_color: result.hairColor,
          avatar_customization_status: 'completed',
        })
        setPersonAvatarData(updated)
        setJustConfirmedAvatar(true)
      } catch (err) {
        console.error('Erro ao persistir escolhas do avatar:', err)
      } finally {
        setIsAvatarCustomizing(false)
      }
    }

    const handleAvatarDefer = async () => {
      try {
        const targetId = personId || personAvatarData?.id || 'demo-person-mariana'
        const updated = await personService.updateAvatarCustomization(targetId, {
          avatar_customization_status: 'deferred',
        })
        setPersonAvatarData(updated)
      } catch (err) {
        console.error('Erro ao registrar postergação da personalização do avatar:', err)
      } finally {
        setIsAvatarCustomizing(false)
      }
    }

    return (
      <div className="py-6">
        <AvatarCustomizationFlow
          initialConfig={{
            presentation: personAvatarData?.avatar_presentation,
            skinTone: personAvatarData?.avatar_skin_tone,
            hairColor: personAvatarData?.avatar_hair_color,
          }}
          onConfirm={handleAvatarConfirm}
          onDefer={handleAvatarDefer}
          onCancel={() => setIsAvatarCustomizing(false)}
        />
      </div>
    )
  }

  // -------------------------------------------------------------
  // CER V1 — LOTE A: NOVA AVALIAÇÃO AYURVEDA + CAPÍTULO 1
  // (CORPO & FISIOLOGIA CANÔNICA)
  // -------------------------------------------------------------
  const isCorpoFisiologiaCanonical =
    experience?.id === 'exp-corpo-fisiologia-07b' ||
    resolveExperienceId(experienceId) === 'exp-corpo-fisiologia-07b'

  if (isCorpoFisiologiaCanonical && experience) {
    return (
      <div className="py-4">
        {/* Lazy import do navegador canônico de Corpo & Fisiologia com React.Suspense explícito */}
        <React.Suspense
          fallback={
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div
                data-testid="chapter1-loading-spinner"
                className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"
              />
              <p className="text-xs text-muted-foreground">Preparando sua experiência...</p>
            </div>
          }
        >
          {React.createElement(
            React.lazy(() => import('./ayurveda/AyurvedaChaptersNavigator')),
            {
              enrollmentId,
              experienceId: 'exp-corpo-fisiologia-07b',
              respondentUserId,
              userPresentation: personAvatarData?.avatar_presentation || 'feminine',
              avatarDeferred: personAvatarData?.avatar_customization_status === 'deferred',
              initialShowPostAvatarTransition: justConfirmedAvatar,
              onClose,
              onCompleted: () => {
                onCompleted?.()
              },
              onOpenAvatarCustomization: () => {
                setIsAvatarCustomizing(true)
              },
            },
          )}
        </React.Suspense>
      </div>
    )
  }

  // -------------------------------------------------------------
  // FASE 1: ABERTURA CURTA E ACOLHEDORA
  // -------------------------------------------------------------
  if (engineStage === 'opening') {
    const isResuming = (enrollmentExp?.current_step_order || 1) > 1

    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-normal">
            Momento de Consciência
          </Badge>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground h-8 px-2"
            >
              Fechar
            </Button>
          )}
        </div>

        <div className="space-y-3 text-center py-4">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
            {experience.title}
          </h1>
          {experience.subtitle && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {experience.subtitle}
            </p>
          )}
        </div>

        {/* Banner de Demonstração Atualizada / Mente & Emoções requer refazer */}
        {menteEmocoesNeedsRedo && (
          <div
            data-testid="banner-demo-mente-emocoes-redo"
            className="p-4 sm:p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-sm leading-relaxed space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1 text-left">
                <p className="font-medium text-foreground">
                  Esta demonstração foi atualizada. Para construir seu retrato com segurança,
                  responda novamente à experiência Mente & Emoções.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { demoAdapter } = await import('@/services/demoAdapter')
                    if (demoAdapter.isEnabled()) {
                      demoAdapter.resetMenteEmocoes(enrollmentId)
                    }
                    setMenteEmocoesNeedsRedo(false)
                    setHasIncompatibleMenteDemo(false)
                    setResponsesMap({})
                    setCurrentStepIndex(0)
                    setEngineStage('moments')
                  }}
                  className="border-amber-600/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10 font-medium text-xs h-8 gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Refazer Mente & Emoções
                </Button>
              </div>
            </div>
          </div>
        )}

        {experience.opening_text && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs sm:text-sm text-foreground/90 leading-relaxed font-serif italic text-center">
            “{experience.opening_text}”
          </div>
        )}

        <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Como funciona esta experiência:</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
            <li>Sem certo ou errado: apenas o retrato do seu funcionamento agora.</li>
            <li>Um momento por vez, respeitando o seu ritmo.</li>
            <li>Progresso salvo automaticamente — você pode pausar e retornar quando quiser.</li>
            <li>Nenhum teste de desempenho ou julgamento clínico.</li>
          </ul>
        </div>

        {isResuming && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-4 h-4" />
              <span>
                Você já iniciou esta experiência (Momento {enrollmentExp?.current_step_order}).
              </span>
            </div>
          </div>
        )}

        {/* Convite discreto para quem escolheu postergar ou deseja personalizar representação */}
        {(experience.id === 'exp-corpo-fisiologia-07b' ||
          resolveExperienceId(experienceId) === 'exp-corpo-fisiologia-07b') && (
          <div className="flex justify-center pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAvatarCustomizing(true)}
              className="text-xs text-primary/80 hover:text-primary gap-1.5 h-8 font-normal"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalizar minha representação</span>
            </Button>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Button onClick={handleStartExperience} className="w-full text-xs h-10 gap-2">
            <span>{isResuming ? 'Retomar de onde parei' : 'Iniciar este momento'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto text-xs h-10 px-4"
            >
              Fazer mais tarde
            </Button>
          )}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // FASE 3: FECHAMENTO SIMPLES (SEM SCORE, COM MENSAGEM ACOLHEDORA)
  // -------------------------------------------------------------
  const isClosingMenteEmocoes =
    experience?.id === 'exp-mente-emocoes-07c' ||
    resolveExperienceId(experienceId) === 'exp-mente-emocoes-07c'

  if (engineStage === 'closing') {
    // Se for Mente & Emoções com dados incompatíveis arquivados ou sem obrigatórias,
    // não apresentar o fechamento com retrato completo; exibir o banner seguro e opção de refazer.
    if (isClosingMenteEmocoes && menteEmocoesNeedsRedo) {
      return (
        <div className="max-w-xl mx-auto py-10 px-4 space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-medium text-foreground">
              Retrato Não Disponível
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Esta demonstração foi atualizada. Para construir seu retrato com segurança, responda
              novamente à experiência Mente & Emoções.
            </p>
          </div>
          <div
            data-testid="banner-demo-mente-emocoes-redo"
            className="p-4 sm:p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-sm leading-relaxed space-y-3 text-left"
          >
            <p className="font-medium text-foreground">
              Esta demonstração foi atualizada. Para construir seu retrato com segurança, responda
              novamente à experiência Mente & Emoções.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const { demoAdapter } = await import('@/services/demoAdapter')
                if (demoAdapter.isEnabled()) {
                  demoAdapter.resetMenteEmocoes(enrollmentId)
                }
                setMenteEmocoesNeedsRedo(false)
                setHasIncompatibleMenteDemo(false)
                setResponsesMap({})
                setCurrentStepIndex(0)
                setEngineStage('moments')
              }}
              className="border-amber-600/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10 font-medium text-xs h-8 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refazer Mente & Emoções
            </Button>
          </div>
          <div className="pt-2">
            <Button onClick={onClose} variant="outline" className="text-xs px-6 h-9">
              Voltar ao Início
            </Button>
          </div>
        </div>
      )
    }

    // Extração pura de respostas para o ProtectionPatternsChart a partir do responsesMap
    const p7aResp =
      responsesMap['p-07c-pm3-p7a-movimentos-1-5'] ||
      Object.values(responsesMap).find(
        (r) =>
          prompts.find((p) => p.id === r.prompt_id)?.schema_config &&
          (prompts.find((p) => p.id === r.prompt_id)?.schema_config as any)?.prompt_key ===
            'movimentos_automaticos_frequencia_p1',
      )
    const p7bResp =
      responsesMap['p-07c-pm3-p7b-movimentos-6-10'] ||
      Object.values(responsesMap).find(
        (r) =>
          prompts.find((p) => p.id === r.prompt_id)?.schema_config &&
          (prompts.find((p) => p.id === r.prompt_id)?.schema_config as any)?.prompt_key ===
            'movimentos_automaticos_frequencia_p2',
      )
    const p8Resp =
      responsesMap['p-07c-pm3-p8-interferencia-movimentos'] ||
      Object.values(responsesMap).find(
        (r) =>
          prompts.find((p) => p.id === r.prompt_id)?.schema_config &&
          (prompts.find((p) => p.id === r.prompt_id)?.schema_config as any)?.prompt_key ===
            'movimentos_interferencia_atual',
      )

    const consolidatedP7Responses: Record<string, string> = {}
    const extractP7Values = (resp: ExperienceResponseRecord | undefined) => {
      if (!resp) return
      let sVal = resp.structured_value as any
      if (!sVal) return
      if (sVal && typeof sVal === 'object' && sVal.ratings && typeof sVal.ratings === 'object') {
        sVal = sVal.ratings
      }
      if (typeof sVal === 'object' && !Array.isArray(sVal)) {
        for (const [k, v] of Object.entries(sVal)) {
          if (
            k === 'metadata' ||
            k === 'collection_origin' ||
            k === 'naming_origin' ||
            k === 'prompt_key' ||
            k === 'canonical_prompt_id'
          )
            continue
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
      if (!p8Resp) return []
      const sVal = p8Resp.structured_value as any
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
      if (typeof sVal === 'string') {
        return [sVal]
      }
      if (typeof sVal === 'object') {
        const keys = Object.keys(sVal).filter(
          (k) =>
            k !== 'metadata' &&
            k !== 'collection_origin' &&
            k !== 'naming_origin' &&
            Boolean(sVal[k]),
        )
        return keys
      }
      return []
    })()

    const handleSaveClosingReflection = async (text: string) => {
      setClosingReflection(text)
      const p13Prompt = prompts.find(
        (p) => (p.schema_config as any)?.prompt_key === 'campo_final_opcional',
      )
      if (p13Prompt) {
        const pKey = 'campo_final_opcional'
        const saved = await experienceResponseService.saveResponse({
          enrollmentId,
          experienceId,
          promptId: p13Prompt.id,
          respondentUserId,
          responseType: 'FreeReflection',
          promptVersion: p13Prompt.version,
          structuredValue: {
            value: text,
            collection_origin: 'newly_collected',
            prompt_key: pKey,
            canonical_prompt_id: p13Prompt.id,
            metadata: {
              participant_free_speech: true,
              structured_selection: false,
              prompt_key: pKey,
              canonical_prompt_id: p13Prompt.id,
              step_order: p13Prompt.step_order,
            },
          },
          freeText: text,
          accessClass: 'participant_shared',
          changeReason: 'Atualização no encerramento da experiência',
          promptKey: pKey,
          canonicalPromptId: p13Prompt.id,
          stepOrder: p13Prompt.step_order,
        })
        const enriched: ExperienceResponseRecord = {
          ...saved,
          prompt_key: pKey,
          step_order: p13Prompt.step_order,
          canonical_prompt_id: p13Prompt.id,
        } as any
        setResponsesMap((prev) => ({
          ...prev,
          [p13Prompt.id]: enriched,
          [pKey]: enriched,
          p13: enriched,
          p14: enriched,
        }))
      }
    }

    return (
      <div className="max-w-xl mx-auto py-10 px-4 space-y-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <BookmarkCheck className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-medium text-foreground">Momento Concluído</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {experience?.closing_text ||
              'Pronto. Esse registro passa a fazer parte da sua jornada. Obrigado por dedicar este momento a você.'}
          </p>
        </div>

        {/* Reflexão Opcional de Fechamento */}
        <div className="p-4 rounded-xl border border-border/70 bg-card text-left space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-foreground block">
              Algo mais apareceu para você ao concluir? (Opcional)
            </span>
            <span className="text-[11px] text-muted-foreground block">
              Se desejar, deixe uma anotação espontânea sobre como foi passar por este momento.
            </span>
          </div>

          <textarea
            value={closingReflection}
            onChange={(e) => handleSaveClosingReflection(e.target.value)}
            placeholder="Escreva livremente aqui se quiser complementar..."
            rows={3}
            className="w-full text-xs p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        {/* Botão e Retrato de Mente & Emoções (Somente Mente & Emoções) */}
        {isClosingMenteEmocoes && (
          <div className="py-2 space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMindEmotionsReport(true)}
              className="text-xs font-medium border-primary/40 text-primary hover:bg-primary/5 hover:text-primary gap-1.5 h-9"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ver meu retrato de Mente & Emoções</span>
            </Button>

            {showMindEmotionsReport && (
              <MindEmotionsReport
                isOpen={showMindEmotionsReport}
                onClose={() => setShowMindEmotionsReport(false)}
                responses={normalizedResponsesForReport}
                treatmentVariant={treatmentVariant}
                hasIncompatibleDemoData={hasIncompatibleMenteDemo}
                onRetakeExperience={async () => {
                  const { demoAdapter } = await import('@/services/demoAdapter')
                  if (demoAdapter.isEnabled()) {
                    demoAdapter.resetMenteEmocoesExperience(enrollmentId)
                  }
                  setShowMindEmotionsReport(false)
                  setResponsesMap({})
                  setCurrentStepIndex(0)
                  setEngineStage('opening')
                }}
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 py-2.5 px-4 rounded-xl border border-border/50">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>Suas respostas foram integradas de forma segura e autoral à sua jornada.</span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={onClose} className="w-full sm:w-auto text-xs px-6 h-9">
            Concluir e Voltar ao Início
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsReviewOnly(true)
              setCurrentStepIndex(0)
              setEngineStage('moments')
            }}
            className="w-full sm:w-auto text-xs px-4 h-9 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rever Minhas Respostas</span>
          </Button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // FASE 2: MOMENTOS (UM PROMPT POR VEZ, COMPONENTES DINÂMICOS)
  // -------------------------------------------------------------
  const currentPrompt = prompts[currentStepIndex]
  const existingSaved = responsesMap[currentPrompt.id]

  // Calcular contagem de prompts elegíveis reais (Progress humanizado Y = count(elegíveis))
  const orchDerived = resolveExperienceOrchestration({
    prompts,
    responses: Object.values(responsesMap),
    currentStepOrder: currentPrompt.step_order,
  })

  const isMenteEmocoes =
    experience?.id === 'exp-mente-emocoes-07c' ||
    resolveExperienceId(experienceId) === 'exp-mente-emocoes-07c'
  const eligibleList = orchDerived.status === 'AVAILABLE' ? orchDerived.eligiblePrompts : prompts
  const currentEligibleIndex = eligibleList.findIndex((p) => p.id === currentPrompt.id)
  const displayStepNumber =
    currentEligibleIndex >= 0 ? currentEligibleIndex + 1 : currentStepIndex + 1
  const displayTotalCount = eligibleList.length
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentEligibleIndex === eligibleList.length - 1

  // Determinar momento canônico (1 a 5 para Mente & Emoções)
  const currentMomentData =
    (currentPrompt.expand?.moment_id as CerExperienceMomentRecord) ||
    moments.find((m) => m.id === currentPrompt.moment_id)
  const currentMomentIndex = moments.findIndex((m) => m.id === currentPrompt.moment_id)
  const momentOrder =
    currentMomentData?.order_index || (currentMomentIndex >= 0 ? currentMomentIndex + 1 : 1)
  const totalMomentsCount = moments.length || 5

  // Etapas dentro do momento atual (excluindo adaptive da contagem total fixa para não inflar)
  const promptsInCurrentMoment = prompts.filter((p) => p.moment_id === currentPrompt.moment_id)
  const currentPromptInMomentIndex = promptsInCurrentMoment.findIndex(
    (p) => p.id === currentPrompt.id,
  )
  const isAdaptivePrompt =
    (currentPrompt.schema_config as any)?.orchestration?.path_role === 'adaptive'
  const essentialPromptsInMoment = promptsInCurrentMoment.filter(
    (p) => (p.schema_config as any)?.orchestration?.path_role !== 'adaptive',
  )
  const momentStepNumber = isAdaptivePrompt
    ? essentialPromptsInMoment.length
    : currentPromptInMomentIndex + 1
  const momentTotalSteps = essentialPromptsInMoment.length || promptsInCurrentMoment.length

  const pSchema = (currentPrompt.schema_config || {}) as any
  const accessDestination = pSchema.access_destination || 'shared_care'

  // Resolução dinâmica de emoções da P2 (emocoes_recorrentes) em tempo de render
  const emocoesRecPrompt = prompts.find(
    (p) => (p.schema_config as any)?.prompt_key === 'emocoes_recorrentes',
  )
  const emocoesResp = emocoesRecPrompt ? responsesMap[emocoesRecPrompt.id] : null
  const emocoesRespAny = emocoesResp as any
  const isPrefiroNaoResponderP2 =
    emocoesRespAny?.metadata_flags?.skip_reason === 'prefiro_nao_responder' ||
    emocoesRespAny?.structured_value?.skip_reason === 'prefiro_nao_responder' ||
    emocoesRespAny?.structured_value?.choice === 'prefiro_nao_responder' ||
    (emocoesRespAny?.response_type as string) === 'prefiro_nao_responder'

  const selectedEmotionLabels: string[] = (() => {
    if (!emocoesResp || isPrefiroNaoResponderP2) return []
    const sVal = emocoesResp.structured_value as any
    const rawList: any[] = Array.isArray(sVal)
      ? sVal
      : Array.isArray(sVal?.value)
        ? sVal.value
        : Array.isArray(sVal?.choice)
          ? sVal.choice
          : Array.isArray(sVal?.selectedOptionIds)
            ? sVal.selectedOptionIds
            : []

    const customText =
      (typeof sVal === 'object' &&
        sVal !== null &&
        (sVal.custom_text || sVal.outra_emocao_text || sVal.free_text)) ||
      emocoesResp.free_text ||
      ''

    const labels: string[] = []
    for (const item of rawList) {
      if (
        item === 'prefiro_nao_responder' ||
        (typeof item === 'object' && item?.id === 'prefiro_nao_responder')
      ) {
        continue
      }
      const id = typeof item === 'string' ? item : item?.id || String(item)
      if (id === 'outra_emocao') {
        const textFromItem = typeof item === 'object' && item !== null ? item.custom_text : null
        const label = (textFromItem || customText || '').trim()
        if (label) {
          labels.push(label)
        }
      } else if (EMOTION_ID_TO_LABEL[id]) {
        labels.push(EMOTION_ID_TO_LABEL[id])
      } else {
        // Fallback: se houver opção no schema do prompt, usar o title correspondente em minúsculas
        const opt = (emocoesRecPrompt?.schema_config as any)?.options?.find((o: any) => o.id === id)
        if (opt?.title) {
          labels.push(opt.title.toLowerCase())
        }
      }
    }
    return labels
  })()

  const emocoesTexto =
    !isPrefiroNaoResponderP2 && selectedEmotionLabels.length > 0
      ? formatSelectedEmotionsNatural(selectedEmotionLabels)
      : ''

  const emocoesTextoVirgulas =
    !isPrefiroNaoResponderP2 && selectedEmotionLabels.length > 0
      ? selectedEmotionLabels.join(', ')
      : ''

  const selectedEmotionsPhrase =
    !isPrefiroNaoResponderP2 && selectedEmotionLabels.length > 0
      ? formatSelectedEmotionsPhrase(selectedEmotionLabels)
      : ''

  const interpolateEmotionsMarker = (text: string | null | undefined): string => {
    if (!text) return ''
    if (!text.includes('{{emocoes_selecionadas}}')) return text

    if (emocoesTexto) {
      return text.replaceAll('{{emocoes_selecionadas}}', emocoesTexto)
    }

    // Sem emoções válidas (sem seleção ou "Prefiro não responder"):
    // Normalizar a frase sem vírgula órfã, sem espaço duplo, sem preposição solta.
    let cleaned = text
      .replaceAll(
        'Ao pensar nas emoções que escolheu — {{emocoes_selecionadas}} —',
        'Ao pensar no que está presente para você,',
      )
      .replaceAll('— {{emocoes_selecionadas}} —', '')
      .replaceAll('Ao sentir {{emocoes_selecionadas}},', 'Ao pensar sobre isso,')
      .replaceAll('ao sentir {{emocoes_selecionadas}},', 'ao pensar sobre isso,')
      .replaceAll('Ao sentir {{emocoes_selecionadas}}', 'Ao pensar sobre isso')
      .replaceAll('ao sentir {{emocoes_selecionadas}}', 'ao pensar sobre isso')
      .replaceAll('{{emocoes_selecionadas}}', '')
      .replaceAll(' ,', ',')
      .replaceAll('  ', ' ')
      .trim()

    // Normalização adicional para preposições soltas ou pontuação órfã
    cleaned = cleaned
      .replace(/\s+,/g, ',')
      .replace(/,\s*,+/g, ',')
      .replace(/\s{2,}/g, ' ')

    return cleaned
  }

  // Microcopy pré-expressão de privacidade
  const privacyMicrocopy =
    accessDestination === 'participant_private'
      ? 'Só para você. Ninguém mais vê isso.'
      : accessDestination === 'participant_shared'
        ? 'Compartilhado com sua profissional de referência.'
        : 'Cuidado compartilhado da sua jornada.'

  // Renderizador dinâmico de componente conforme o schema
  const renderDynamicComponent = () => {
    const componentType = currentPrompt.component_type
    const schema = (currentPrompt.schema_config || {}) as Record<string, any>

    // Interpolação dinâmica de emoções selecionadas para qualquer prompt com template
    let renderedPromptConfig = { ...schema }
    if (schema.dynamic_text_template) {
      renderedPromptConfig = {
        ...renderedPromptConfig,
        dynamic_text_template: interpolateEmotionsMarker(schema.dynamic_text_template),
        interpolatedEmotions: emocoesTexto || emocoesTextoVirgulas || 'suas emoções',
        selectedEmotionsPhrase,
      }
    }

    switch (componentType) {
      case 'FreeReflection': {
        const optionSet = schema.option_set?.items || []
        const freeVal =
          typeof currentDraftValue === 'object' && currentDraftValue !== null
            ? (currentDraftValue as any).value || currentDraftText
            : (currentDraftValue as string) || currentDraftText

        return (
          <div className="space-y-4 max-w-xl mx-auto">
            {/* Campo de texto livre PRIMEIRO */}
            <div className="space-y-2">
              {renderedPromptConfig.selectedEmotionsPhrase && (
                <div
                  data-testid="selected-emotions-label"
                  className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed"
                >
                  {renderedPromptConfig.selectedEmotionsPhrase}
                </div>
              )}
              <textarea
                value={freeVal}
                onChange={(e) => {
                  const txt = e.target.value
                  setCurrentDraftValue(txt)
                  setCurrentDraftText(txt)
                }}
                placeholder={schema.placeholder || 'Conte espontaneamente como você percebe...'}
                rows={5}
                className="w-full text-sm leading-relaxed p-4 rounded-xl border border-border/70 bg-card/60 resize-y focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-normal"
              />
            </div>

            {/* Expander colapsado de apoio com ideias opcionais */}
            {schema.open_first?.enabled && (
              <div className="pt-2 border-t border-border/40 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOpenFirstSuggestions(!showOpenFirstSuggestions)
                    if (!showOpenFirstSuggestions) {
                      setCurrentNamingOrigin('selected_after_prompting')
                    }
                  }}
                  className="text-xs text-primary hover:underline flex items-center gap-1.5 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {schema.open_first.help_label || 'Precisa de algumas ideias para começar?'}
                  </span>
                </button>

                {showOpenFirstSuggestions && optionSet.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-1 border-b border-border/40">
                      <span className="text-xs font-medium text-foreground">
                        Ideias que você pode usar ou adaptar:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowOpenFirstSuggestions(false)}
                        className="text-muted-foreground hover:text-foreground text-[11px]"
                      >
                        Ocultar ideias
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {optionSet.map((opt: any) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const newText = freeVal ? `${freeVal}\n${opt.label}` : opt.label
                            setCurrentDraftValue(newText)
                            setCurrentDraftText(newText)
                            setCurrentNamingOrigin('selected_after_prompting')
                          }}
                          className="w-full text-left p-2.5 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors text-xs text-foreground/90 flex items-start gap-2"
                        >
                          <span className="text-primary font-mono text-[10px] mt-0.5">•</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alternativas legítimas Não sei / Prefiro não responder */}
            <div className="flex items-center gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => handleLegitimateSkip('nao_sei')}
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
              >
                Não sei dizer agora
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={() => handleLegitimateSkip('prefiro_nao_responder')}
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
              >
                Prefiro não responder
              </button>
            </div>
          </div>
        )
      }
      case 'ChoiceCards': {
        const choiceVal =
          typeof currentDraftValue === 'object' && currentDraftValue !== null
            ? (currentDraftValue as any).choice ||
              (currentDraftValue as any).value ||
              (currentDraftValue as any).selectedOptionId
            : (currentDraftValue as string)

        const privacySplit = schema.privacy_split
        const isPrivacySplitActive = Boolean(privacySplit?.enabled)
        const structObj =
          typeof currentDraftValue === 'object' && currentDraftValue !== null
            ? (currentDraftValue as any)
            : {}
        const privateText = currentDraftText || structObj.free_text || structObj.private_text || ''
        const sharePrivateText = Boolean(structObj.share_private_text_with_professional)

        return (
          <div className="space-y-4">
            {isPrivacySplitActive && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground/90 space-y-1">
                <span className="font-medium block">
                  {privacySplit.shared_category_label ||
                    'Sua escolha de categoria acima será compartilhada com Daiane.'}
                </span>
              </div>
            )}

            <ChoiceCards
              config={renderedPromptConfig as any}
              value={choiceVal}
              onChange={(val) => {
                if (isPrivacySplitActive) {
                  setCurrentDraftValue({
                    ...structObj,
                    choice: val,
                    selectedOptionId: val,
                    free_text: privateText,
                    share_private_text_with_professional: sharePrivateText,
                  })
                } else {
                  setCurrentDraftValue(val)
                }
              }}
              allowSkip={true}
              onSkip={handleLegitimateSkip}
            />

            {/* Expander opcional por emoção (P3 Adaptativo) */}
            {schema.per_emotion_expander?.enabled && choiceVal && (
              <div className="pt-3 border-t border-border/40 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowOpenFirstSuggestions(!showOpenFirstSuggestions)}
                  className="text-xs text-primary hover:underline flex items-center gap-1.5 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {showOpenFirstSuggestions
                      ? 'Fechar anotação sobre o que parece estar relacionado'
                      : 'O que parece estar relacionado? (Opcional)'}
                  </span>
                </button>
                {showOpenFirstSuggestions && (
                  <div className="p-3 rounded-lg bg-card border border-border/70 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {schema.per_emotion_expander.helper_text ||
                        'Espaço opcional para você descrever do seu jeito.'}
                    </p>
                    <textarea
                      value={currentDraftText}
                      onChange={(e) => {
                        setCurrentDraftText(e.target.value)
                        if (typeof currentDraftValue === 'object' && currentDraftValue !== null) {
                          setCurrentDraftValue({ ...currentDraftValue, free_text: e.target.value })
                        }
                      }}
                      placeholder="Descreva o que parece estar relacionado..."
                      rows={3}
                      className="w-full text-xs p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Bloco de Privacidade Estrita nas telas sensíveis */}
            {isPrivacySplitActive && (
              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-foreground block">
                    Reflexão pessoal (opcional):
                  </span>
                  <p className="text-[11px] text-muted-foreground italic">
                    {privacySplit.private_text_note ||
                      'Este texto é só seu e não será compartilhado com Daiane.'}
                  </p>
                </div>
                <textarea
                  value={privateText}
                  onChange={(e) => {
                    const text = e.target.value
                    setCurrentDraftText(text)
                    setCurrentDraftValue({
                      ...structObj,
                      choice: choiceVal,
                      selectedOptionId: choiceVal,
                      free_text: text,
                      private_text: text,
                      share_private_text_with_professional: sharePrivateText,
                    })
                  }}
                  placeholder="Escreva livremente aqui se desejar registrar com suas palavras..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />

                <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-foreground/90 select-none">
                  <input
                    type="checkbox"
                    checked={sharePrivateText}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setCurrentDraftValue({
                        ...structObj,
                        choice: choiceVal,
                        selectedOptionId: choiceVal,
                        free_text: privateText,
                        private_text: privateText,
                        share_private_text_with_professional: checked,
                      })
                    }}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>
                    {privacySplit.share_checkbox_label ||
                      'Quero compartilhar também este texto com Daiane.'}
                  </span>
                </label>
              </div>
            )}
          </div>
        )
      }
      case 'MultiSelectCards':
        return (
          <div className="space-y-4">
            <MultiSelectCards
              config={renderedPromptConfig as any}
              value={Array.isArray(currentDraftValue) ? (currentDraftValue as string[]) : []}
              onChange={(val) => setCurrentDraftValue(val)}
            />

            {/* Texto livre opcional para recursos de recuperação ou outra coisa */}
            {schema.allow_free_text_addition && (
              <div className="pt-3 border-t border-border/40 space-y-2">
                <span className="text-xs font-medium text-foreground block">
                  Quer registrar algo do seu jeito? (Opcional)
                </span>
                <textarea
                  value={currentDraftText}
                  onChange={(e) => {
                    setCurrentDraftText(e.target.value)
                  }}
                  placeholder={
                    schema.free_text_addition_placeholder ||
                    'Escreva do seu jeito o que costuma ajudar...'
                  }
                  rows={2}
                  className="w-full text-xs p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            )}
          </div>
        )
      case 'SimpleScale':
        return (
          <SimpleScale
            config={renderedPromptConfig as any}
            value={typeof currentDraftValue === 'number' ? (currentDraftValue as number) : null}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'Ordering':
        return (
          <Ordering
            config={renderedPromptConfig as any}
            value={currentDraftValue as string[]}
            onChange={(val) => {
              setOrderingInteracted(true)
              setCurrentDraftValue(val)
            }}
          />
        )
      case 'BodyMap':
        return (
          <BodyMap
            config={renderedPromptConfig as any}
            value={currentDraftValue as string[]}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'RelationalOrbitMap':
        return (
          <RelationalOrbitMap
            config={renderedPromptConfig as any}
            value={Array.isArray(currentDraftValue) ? (currentDraftValue as any) : []}
            onChange={(val) => setCurrentDraftValue(val as any)}
          />
        )
      case 'ScenarioChoice':
        return (
          <ScenarioChoice
            config={renderedPromptConfig as any}
            value={currentDraftValue as string}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'Timeline':
        return (
          <Timeline
            config={renderedPromptConfig as any}
            value={currentDraftValue as any}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      default:
        return (
          <div className="p-4 text-xs text-muted-foreground border rounded-lg">
            Componente não identificado: {componentType}
          </div>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Banner de Revisão Somente-Leitura */}
      {isReviewOnly && (
        <div
          data-testid="banner-revisao-somente-leitura"
          className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-primary">Revisão das suas respostas</span>
              <span className="text-muted-foreground text-[11px] block">
                Modo de consulta somente-leitura. Suas respostas registradas estão preservadas sem
                alteração.
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReturnToClosingFromReview}
            className="h-8 text-xs px-3 self-start sm:self-auto border-primary/30 text-primary hover:bg-primary/10 shrink-0"
          >
            Voltar ao encerramento
          </Button>
        </div>
      )}

      {/* Topo: Progresso Humanizado Sem Gamificação */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          {!isReviewOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Pausar e Salvar</span>
            </Button>
          )}
          <span
            className="text-xs text-muted-foreground font-mono"
            aria-live="polite"
            role="status"
          >
            {isMenteEmocoes
              ? `Momento ${momentOrder} de ${totalMomentsCount} — ${currentMomentData?.title || 'Momento'} • Etapa ${momentStepNumber} de ${momentTotalSteps}`
              : `Momento ${displayStepNumber} de ${displayTotalCount}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {isReviewOnly ? (
            <span className="hidden sm:inline text-primary font-medium">
              Revisão somente-leitura
            </span>
          ) : saving ? (
            <span className="flex items-center gap-1 text-primary">
              <Save className="w-3 h-3 animate-spin" />
              <span>Salvando...</span>
            </span>
          ) : lastSavedTime ? (
            <span className="hidden sm:inline">Salvo às {lastSavedTime}</span>
          ) : existingSaved ? (
            <span className="hidden sm:inline">Salvo anteriormente (v{existingSaved.version})</span>
          ) : null}
        </div>
      </div>

      {/* Indicador sutil de posição (sem percentual nem barras competitivas) */}
      <div className="w-full flex gap-1.5 h-1">
        {prompts.map((p, idx) => (
          <div
            key={p.id}
            className={`flex-1 rounded-full transition-all duration-300 ${
              idx === currentStepIndex
                ? 'bg-primary'
                : idx < currentStepIndex
                  ? 'bg-primary/40'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Bloco do Momento & Prompt Atual */}
      <div className="space-y-3 pt-2">
        <div className="space-y-1">
          {(() => {
            const momentData =
              (currentPrompt.expand?.moment_id as CerExperienceMomentRecord) ||
              moments.find((m) => m.id === currentPrompt.moment_id)
            const momentTitle = momentData?.title || currentPrompt.step_title
            const momentSubtitle = momentData?.subtitle || currentPrompt.step_subtitle

            return (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-normal tracking-wide">
                    {momentTitle}
                  </Badge>
                  {currentPrompt.prompt_order && currentPrompt.prompt_order > 1 && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Pergunta {currentPrompt.prompt_order}
                    </span>
                  )}
                </div>
                {isAdaptivePrompt && (
                  <div className="p-2 rounded-md bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center gap-1.5 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {(currentPrompt.schema_config as any)?.adaptive_label ||
                        'Uma pergunta a mais para compreender melhor sua experiência'}
                    </span>
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
                  {interpolateEmotionsMarker(currentPrompt.prompt_text)}
                </h2>{' '}
                {momentSubtitle && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {interpolateEmotionsMarker(momentSubtitle)}
                  </p>
                )}
              </>
            )
          })()}
        </div>
        {currentPrompt.helper_text &&
          (() => {
            const displayedHelper = interpolateEmotionsMarker(currentPrompt.helper_text)
            return <p className="text-[11px] text-muted-foreground/80 italic">{displayedHelper}</p>
          })()}

        {/* Microcopy Pré-Expressão de Privacidade (Build 07A) */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/90 bg-muted/20 px-2.5 py-1 rounded-md border border-border/40 w-fit">
          <Lock className="w-3 h-3 text-primary/70 shrink-0" />
          <span>{privacyMicrocopy}</span>
        </div>

        {/* Registro Único — Contexto Reutilizado Puro Exibido Read-Only */}
        {reusedContextBinding && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-1">
            <span className="font-medium text-foreground block">
              Contexto já registrado anteriormente:
            </span>
            <span className="text-muted-foreground italic block">
              {typeof reusedContextBinding.readOnlyValue === 'object'
                ? JSON.stringify(reusedContextBinding.readOnlyValue)
                : String(reusedContextBinding.readOnlyValue)}
            </span>
            <span className="text-[10px] text-primary/80 font-mono block">
              Reuso do Registro Único (sem necessidade de preencher novamente)
            </span>
          </div>
        )}

        {/* Build 07C: Espelho Composto da Sequência (PR4) */}
        {pSchema.composite_mirror?.enabled && (
          <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Sua sequência percebida:</span>
            </div>
            <div className="space-y-2 text-xs">
              {(pSchema.composite_mirror.steps || []).map((st: any, sIdx: number) => {
                const targetPrompt = prompts.find(
                  (pr) => (pr.schema_config as any)?.prompt_key === st.prompt_ref,
                )
                const resp = targetPrompt ? responsesMap[targetPrompt.id] : null
                const sVal = resp?.structured_value as any
                let displayVal = 'Não registrado'
                if (sVal) {
                  displayVal =
                    sVal.choice ||
                    sVal.value ||
                    sVal.selectedOptionId ||
                    (typeof sVal === 'string' ? sVal : JSON.stringify(sVal))
                }
                return (
                  <div
                    key={sIdx}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <span className="text-[10px] font-mono font-medium text-primary uppercase shrink-0">
                      {st.label}:
                    </span>
                    <span className="text-foreground/90 italic">{displayVal}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Renderização do Componente de Interação */}
      <div className={`py-2 ${isReviewOnly ? 'pointer-events-none select-text opacity-95' : ''}`}>
        {renderDynamicComponent()}
      </div>

      {/* Barra de Ações de Navegação */}
      <div className="flex flex-wrap items-center justify-between pt-6 border-t border-border/50 gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!isReviewOnly && isFirstStep}
          onClick={handlePreviousStep}
          className="text-xs gap-1.5 h-9 shrink-0 whitespace-normal text-left"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>{isReviewOnly && isFirstStep ? 'Início' : 'Voltar'}</span>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {!isReviewOnly && (
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={saveCurrentStepResponse}
              className="text-xs h-9 px-2.5 sm:px-3 text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-1 whitespace-normal shrink-0"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              <span>Salvar rascunho</span>
            </Button>
          )}

          {isReviewOnly ? (
            // No modo de revisão, o comando canônico único "Voltar ao encerramento" já está no topo (banner).
            // A barra inferior navega entre as perguntas e, na última etapa, exibe "Voltar ao início" ou botão neutro sem duplicar "Voltar ao encerramento".
            !isLastStep ? (
              <Button
                size="sm"
                onClick={handleNextStep}
                className="text-xs gap-1.5 h-9 px-3 sm:px-4 whitespace-normal text-left shrink-0"
              >
                <span>Próxima pergunta</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReturnToClosingFromReview}
                className="text-xs gap-1.5 h-9 px-3 sm:px-4 whitespace-normal text-left shrink-0"
              >
                <span>Concluir revisão</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </Button>
            )
          ) : (
            <Button
              size="sm"
              disabled={saving}
              onClick={handleNextStep}
              className="text-xs gap-1.5 h-9 px-3 sm:px-4 whitespace-normal text-left shrink-0"
            >
              <span>{isLastStep ? 'Concluir momento' : 'Avançar'}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
