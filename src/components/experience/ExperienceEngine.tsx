import React, { useState, useEffect } from 'react'
import {
  experienceCatalogService,
  enrollmentExperienceService,
  experienceResponseService,
} from '@/services/experienceEngine'
import type {
  CerExperienceRecord,
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
} from 'lucide-react'

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
  const [prompts, setPrompts] = useState<CerPromptRecord[]>([])
  const [enrollmentExp, setEnrollmentExp] = useState<EnrollmentExperienceRecord | null>(null)
  const [responsesMap, setResponsesMap] = useState<Record<string, ExperienceResponseRecord>>({})

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [engineStage, setEngineStage] = useState<EngineStage>('opening')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)
  const [closingReflection, setClosingReflection] = useState('')

  // Resposta em edição do momento atual
  const [currentDraftValue, setCurrentDraftValue] = useState<unknown>(null)
  const [currentDraftText, setCurrentDraftText] = useState('')

  // Carregar metadados da experiência, prompts e respostas salvas
  useEffect(() => {
    let isMounted = true

    const loadEngineData = async () => {
      setLoading(true)
      try {
        const [exp, promptList, enrExp, existingResponses] = await Promise.all([
          experienceCatalogService.getExperienceById(experienceId),
          experienceCatalogService.listPromptsByExperience(experienceId),
          enrollmentExperienceService.getByEnrollmentAndExperience(enrollmentId, experienceId),
          experienceResponseService.listResponsesByExperience(enrollmentId, experienceId),
        ])

        if (!isMounted) return

        setExperience(exp)
        setPrompts(promptList)
        setEnrollmentExp(enrExp)

        const map: Record<string, ExperienceResponseRecord> = {}
        for (const resp of existingResponses) {
          map[resp.prompt_id] = resp
        }
        setResponsesMap(map)

        // Retomada inteligente de progresso:
        // Se já estava em andamento ou completada, direciona para o step adequado
        if (enrExp?.progress_status === 'completed') {
          setEngineStage('closing')
        } else if (enrExp?.current_step_order && enrExp.current_step_order > 1) {
          const targetIndex = promptList.findIndex(
            (p) => p.step_order === enrExp.current_step_order,
          )
          if (targetIndex >= 0) {
            setCurrentStepIndex(targetIndex)
            // Se o usuário já iniciou previamente, abre a tela de abertura ou vai direto
            // Deixar em 'opening' permitindo retomar
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
  }, [experienceId, enrollmentId])

  // Atualizar rascunho sempre que o prompt atual mudar
  useEffect(() => {
    const currentPrompt = prompts[currentStepIndex]
    if (currentPrompt) {
      const existing = responsesMap[currentPrompt.id]
      if (existing) {
        setCurrentDraftValue(existing.structured_value)
        setCurrentDraftText(existing.free_text || '')
      } else {
        // Valores default conforme o componente
        if (currentPrompt.component_type === 'SimpleScale') {
          const cfg = currentPrompt.schema_config as {
            defaultValue?: number
            min?: number
            max?: number
          }
          setCurrentDraftValue(cfg?.defaultValue ?? 3)
        } else if (
          currentPrompt.component_type === 'MultiSelectCards' ||
          currentPrompt.component_type === 'BodyMap'
        ) {
          setCurrentDraftValue([])
        } else if (currentPrompt.component_type === 'Ordering') {
          const cfg = currentPrompt.schema_config as { items?: { id: string }[] }
          setCurrentDraftValue(cfg?.items?.map((i) => i.id) || [])
        } else {
          setCurrentDraftValue(null)
        }
        setCurrentDraftText('')
      }
    }
  }, [currentStepIndex, prompts, responsesMap])

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

    setSaving(true)
    try {
      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: currentPrompt.id,
        respondentUserId,
        responseType: currentPrompt.component_type,
        promptVersion: currentPrompt.version,
        structuredValue: currentDraftValue,
        freeText:
          currentPrompt.component_type === 'FreeReflection'
            ? (currentDraftValue as string) || currentDraftText
            : currentDraftText,
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

    if (currentStepIndex < prompts.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      // Conclusão da experiência
      handleCompleteExperience()
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
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === prompts.length - 1
  const existingSaved = responsesMap[currentPrompt.id]

  // Renderizador dinâmico de componente conforme o schema
  const renderDynamicComponent = () => {
    const componentType = currentPrompt.component_type
    const schema = (currentPrompt.schema_config || {}) as Record<string, any>

    switch (componentType) {
      case 'ChoiceCards':
        return (
          <ChoiceCards
            config={schema as any}
            value={currentDraftValue as string}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'MultiSelectCards':
        return (
          <MultiSelectCards
            config={schema as any}
            value={currentDraftValue as string[]}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'SimpleScale':
        return (
          <SimpleScale
            config={schema as any}
            value={currentDraftValue as number}
            onChange={(val) => setCurrentDraftValue(val)}
          />
        )
      case 'Ordering':
        return (
          <Ordering
            config={schema as any}
            value={currentDraftValue as string[]}
            onChange={(val) => setCurrentDraftValue(val)}
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
            value={(currentDraftValue as string) || currentDraftText}
            onChange={(val) => {
              setCurrentDraftValue(val)
              setCurrentDraftText(val)
            }}
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
          <span className="text-xs text-muted-foreground font-mono">
            Momento {currentStepIndex + 1} de {prompts.length}
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

      {/* Bloco do Prompt Atual */}
      <div className="space-y-3 pt-2">
        <div className="space-y-1">
          <Badge variant="outline" className="text-[10px] font-normal tracking-wide">
            {currentPrompt.step_title}
          </Badge>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
            {currentPrompt.prompt_text}
          </h2>
          {currentPrompt.step_subtitle && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentPrompt.step_subtitle}
            </p>
          )}
        </div>
        {currentPrompt.helper_text && (
          <p className="text-[11px] text-muted-foreground/80 italic">{currentPrompt.helper_text}</p>
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
