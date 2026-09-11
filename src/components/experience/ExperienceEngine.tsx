import React, { useState, useEffect } from 'react'
import {
  experienceCatalogService,
  enrollmentExperienceService,
  experienceResponseService,
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
  ScenarioChoice,
  Timeline,
  FreeReflection,
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

export interface ExperienceEngineProps {
  experienceId: string
  enrollmentId: string
  respondentUserId: string
  onClose?: () => void
  onCompleted?: () => void
}

type EngineStage = 'opening' | 'moments' | 'closing'

export const ExperienceEngine: React.FC<ExperienceEngineProps> = ({
  experienceId,
  enrollmentId,
  respondentUserId,
  onClose,
  onCompleted,
}) => {
  const [experience, setExperience] = useState<CerExperienceRecord | null>(null)
  const [moments, setMoments] = useState<CerExperienceMomentRecord[]>([])
  const [prompts, setPrompts] = useState<CerPromptRecord[]>([])
  const [enrollmentExp, setEnrollmentExp] = useState<EnrollmentExperienceRecord | null>(null)
  const [responsesMap, setResponsesMap] = useState<Record<string, ExperienceResponseRecord>>({})
  const [orderingInteracted, setOrderingInteracted] = useState(false)

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [engineStage, setEngineStage] = useState<EngineStage>('opening')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  // Carregar metadados da experiência, prompts e respostas salvas
  useEffect(() => {
    let isMounted = true

    const loadEngineData = async () => {
      setLoading(true)
      try {
        const [exp, momentList, promptList, enrExp, existingResponses] = await Promise.all([
          experienceCatalogService.getExperienceById(experienceId),
          experienceCatalogService.listMomentsByExperience(experienceId),
          experienceCatalogService.listPromptsByExperience(experienceId),
          enrollmentExperienceService.getByEnrollmentAndExperience(enrollmentId, experienceId),
          experienceResponseService.listResponsesByExperience(enrollmentId, experienceId),
        ])

        if (!isMounted) return

        setExperience(exp)
        setMoments(momentList)
        setPrompts(promptList)
        setEnrollmentExp(enrExp)

        const map: Record<string, ExperienceResponseRecord> = {}
        for (const resp of existingResponses) {
          map[resp.prompt_id] = resp
        }
        setResponsesMap(map)

        // Retomada inteligente de progresso via OrchestrationResolver:
        const orchResult = resolveExperienceOrchestration({
          prompts: promptList,
          responses: existingResponses,
          currentStepOrder: enrExp?.current_step_order || 1,
        })

        if (orchResult.status === 'ORCHESTRATION_UNAVAILABLE') {
          setOrchestrationFailed(true)
          setOrchestrationFailMessage(orchResult.displayMessage || FAILSAFE_MICROCOPY)
          // Auditoria técnica mínima do erro runtime
          auditRuntimeInvalid({
            actorUserId: respondentUserId,
            enrollmentId,
            experienceId,
            reasonCode: orchResult.reasonCode || 'RUNTIME_INVALID',
          })
        } else {
          setOrchestrationFailed(false)
          if (enrExp?.progress_status === 'completed') {
            setEngineStage('closing')
          } else {
            setCurrentStepIndex(orchResult.currentStepIndex)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Experience Engine:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadEngineData()

    return () => {
      isMounted = false
    }
  }, [experienceId, enrollmentId, respondentUserId])

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

  const saveCurrentStepResponse = async () => {
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

      // Anexar proveniência (collection_origin e naming_origin) se for objeto estruturado ou envolver
      let structToSave: any = valToSave
      if (typeof structToSave === 'object' && structToSave !== null) {
        if (!structToSave.collection_origin) {
          structToSave.collection_origin = 'newly_collected'
        }
        if (pSchema.open_first?.enabled) {
          structToSave.naming_origin = currentNamingOrigin
        }
      } else if (typeof structToSave === 'string' || typeof structToSave === 'number') {
        structToSave = {
          value: structToSave,
          collection_origin: 'newly_collected',
          ...(pSchema.open_first?.enabled ? { naming_origin: currentNamingOrigin } : {}),
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
        freeText:
          currentPrompt.component_type === 'FreeReflection'
            ? (currentDraftValue as string) || currentDraftText
            : currentDraftText,
        accessClass: targetAccessClass,
        changeReason: responsesMap[currentPrompt.id]
          ? 'Atualização pelo interagente durante a experiência'
          : 'Primeiro registro de resposta',
      })

      setResponsesMap((prev) => ({ ...prev, [currentPrompt.id]: saved }))
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
    await saveCurrentStepResponse()

    // Recalcular orquestração com as respostas atualizadas
    const currentResponses = Object.values(responsesMap)
    // Incluir temporariamente a resposta do passo atual caso o state responsesMap ainda não tenha sido atualizado
    const currentPrompt = prompts[currentStepIndex]
    const updatedResponses = [...currentResponses.filter((r) => r.prompt_id !== currentPrompt.id)]
    updatedResponses.push({
      id: 'temp_resp',
      enrollment_id: enrollmentId,
      experience_id: experienceId,
      prompt_id: currentPrompt.id,
      respondent_user_id: respondentUserId,
      response_type: currentPrompt.component_type,
      access_class: (currentPrompt.schema_config as any)?.access_destination || 'shared_care',
      structured_value: currentDraftValue,
      prompt_version: currentPrompt.version,
      version: 1,
      status: 'saved',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    })

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

    if (orch.isCompleted || !orch.nextPrompt) {
      handleCompleteExperience()
    } else {
      const nextIdx = prompts.findIndex((p) => p.id === orch.nextPrompt!.id)
      if (nextIdx >= 0) {
        setCurrentStepIndex(nextIdx)
      } else {
        handleCompleteExperience()
      }
    }
  }

  const handleLegitimateSkip = async (reason: 'nao_sei' | 'prefiro_nao_responder') => {
    const currentPrompt = prompts[currentStepIndex]
    if (!currentPrompt) return

    setSaving(true)
    try {
      const pSchema = (currentPrompt.schema_config || {}) as any
      const targetAccessClass = pSchema.access_destination || 'shared_care'

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
        },
        freeText: reason === 'nao_sei' ? 'Não sei' : 'Prefiro não responder',
        accessClass: targetAccessClass,
        changeReason: 'Declaração legítima de resposta não punitiva (' + reason + ')',
      })

      setResponsesMap((prev) => ({ ...prev, [currentPrompt.id]: saved }))
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
    }
  }

  const handleCompleteExperience = async () => {
    if (enrollmentExp) {
      const updated = await enrollmentExperienceService.updateProgress(enrollmentExp.id, {
        completed: true,
      })
      setEnrollmentExp(updated)
    }
    setEngineStage('closing')
    onCompleted?.()
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Preparando sua experiência...</p>
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
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Nenhuma experiência encontrada.</p>
        <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
          Voltar
        </Button>
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
  if (engineStage === 'closing') {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 space-y-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <BookmarkCheck className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-medium text-foreground">Momento Concluído</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {experience.closing_text ||
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
            onChange={(e) => setClosingReflection(e.target.value)}
            placeholder="Escreva livremente aqui se quiser complementar..."
            rows={3}
            className="w-full text-xs p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

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

  const eligibleList = orchDerived.status === 'AVAILABLE' ? orchDerived.eligiblePrompts : prompts
  const currentEligibleIndex = eligibleList.findIndex((p) => p.id === currentPrompt.id)
  const displayStepNumber =
    currentEligibleIndex >= 0 ? currentEligibleIndex + 1 : currentStepIndex + 1
  const displayTotalCount = eligibleList.length
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentEligibleIndex === eligibleList.length - 1

  const pSchema = (currentPrompt.schema_config || {}) as any
  const accessDestination = pSchema.access_destination || 'shared_care'

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

    switch (componentType) {
      case 'ChoiceCards':
        return (
          <ChoiceCards
            config={schema as any}
            value={
              typeof currentDraftValue === 'object' && currentDraftValue !== null
                ? (currentDraftValue as any).value || (currentDraftValue as any).selectedOptionId
                : (currentDraftValue as string)
            }
            onChange={(val) => setCurrentDraftValue(val)}
            allowSkip={true}
            onSkip={handleLegitimateSkip}
          />
        )
      case 'MultiSelectCards':
        return (
          <MultiSelectCards
            config={schema as any}
            value={Array.isArray(currentDraftValue) ? (currentDraftValue as string[]) : []}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'SimpleScale':
        return (
          <SimpleScale
            config={schema as any}
            value={typeof currentDraftValue === 'number' ? (currentDraftValue as number) : null}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'Ordering':
        return (
          <Ordering
            config={schema as any}
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
            config={schema as any}
            value={currentDraftValue as string[]}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'ScenarioChoice':
        return (
          <ScenarioChoice
            config={schema as any}
            value={currentDraftValue as string}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'Timeline':
        return (
          <Timeline
            config={schema as any}
            value={currentDraftValue as any}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'FreeReflection':
        return (
          <FreeReflection
            config={schema as any}
            value={
              typeof currentDraftValue === 'object' && currentDraftValue !== null
                ? (currentDraftValue as any).value || currentDraftText
                : (currentDraftValue as string) || currentDraftText
            }
            onChange={(val) => {
              setCurrentDraftValue(val)
              setCurrentDraftText(val)
            }}
            openFirstConfig={
              pSchema.open_first?.enabled
                ? {
                    enabled: true,
                    helpLabel: pSchema.open_first.help_label || 'Ver opções de apoio',
                    optionSetRef: pSchema.open_first.option_set_ref,
                  }
                : undefined
            }
            showSuggestions={showOpenFirstSuggestions}
            onHelpRequested={() => {
              setShowOpenFirstSuggestions(!showOpenFirstSuggestions)
              setCurrentNamingOrigin('selected_after_prompting')
            }}
            namingOrigin={currentNamingOrigin}
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
      {/* Topo: Progresso Humanizado Sem Gamificação */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Pausar e Salvar</span>
          </Button>
          <span
            className="text-xs text-muted-foreground font-mono"
            aria-live="polite"
            role="status"
          >
            Momento {displayStepNumber} de {displayTotalCount}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {saving ? (
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
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
                  {currentPrompt.prompt_text}
                </h2>
                {momentSubtitle && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{momentSubtitle}</p>
                )}
              </>
            )
          })()}
        </div>
        {currentPrompt.helper_text && (
          <p className="text-[11px] text-muted-foreground/80 italic">{currentPrompt.helper_text}</p>
        )}

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
      </div>

      {/* Renderização do Componente de Interação */}
      <div className="py-2">{renderDynamicComponent()}</div>

      {/* Barra de Ações de Navegação */}
      <div className="flex items-center justify-between pt-6 border-t border-border/50 gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={isFirstStep || saving}
          onClick={handlePreviousStep}
          className="text-xs gap-1.5 h-9"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={saveCurrentStepResponse}
            className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar rascunho</span>
          </Button>

          <Button
            size="sm"
            disabled={saving}
            onClick={handleNextStep}
            className="text-xs gap-1.5 h-9 px-4"
          >
            <span>{isLastStep ? 'Concluir momento' : 'Avançar'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
