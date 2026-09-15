import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CerPracticeStepRecord } from '@/types/cer'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  RotateCcw,
  Sparkles,
  StopCircle,
  Wind,
} from 'lucide-react'

interface PracticeStepViewerProps {
  steps: CerPracticeStepRecord[]
  practiceTitle: string
  onComplete?: (actualPerformed?: { stepId: string; completedAmount: number }[]) => void
  onEarlyStop?: (reason?: string) => void
}

export const PracticeStepViewer: React.FC<PracticeStepViewerProps> = ({
  steps,
  practiceTitle,
  onComplete,
  onEarlyStop,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [performedCounts, setPerformedCounts] = useState<Record<string, number>>({})
  const [showStopConfirm, setShowStopConfirm] = useState(false)

  const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order)
  const currentStep = sortedSteps[currentStepIndex]
  const isLastStep = currentStepIndex === sortedSteps.length - 1

  if (!sortedSteps.length || !currentStep) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhum passo estruturado disponível para esta prática no momento.
        </CardContent>
      </Card>
    )
  }

  const handleNext = () => {
    if (isLastStep) {
      const summary = sortedSteps.map((s) => ({
        stepId: s.stable_step_id,
        completedAmount:
          performedCounts[s.stable_step_id] ??
          s.target_repetitions ??
          s.target_cycles ??
          s.target_series ??
          1,
      }))
      onComplete?.(summary)
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handleAdjustPerformed = (stepId: string, val: number) => {
    setPerformedCounts((prev) => ({
      ...prev,
      [stepId]: Math.max(0, val),
    }))
  }

  const handleStopEarly = () => {
    onEarlyStop?.('interrompido_pelo_participante')
  }

  return (
    <Card className="border border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Passo {currentStepIndex + 1} de {sortedSteps.length}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">
              {practiceTitle}
            </span>
          </div>
          {currentStep.allow_early_stop && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStopConfirm(true)}
              className="text-xs text-muted-foreground hover:text-foreground h-7"
            >
              <StopCircle className="w-3.5 h-3.5 mr-1" />
              <span>Concluir antes da meta</span>
            </Button>
          )}
        </div>
        <CardTitle className="text-lg font-serif mt-2">{currentStep.title}</CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Confirmação de encerramento precoce sem julgamento */}
        {showStopConfirm && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
            <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-semibold block">Interrupção consciente e acolhida</span>
                <span>
                  Respeitar o seu limite é parte essencial da prática. Não há penalidade ou falha em
                  parar quando o corpo pedir.
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStopConfirm(false)}
                className="h-7 text-xs"
              >
                Continuar prática
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopEarly}
                className="h-7 text-xs border-amber-500/40 text-amber-900 dark:text-amber-200"
              >
                Encerrar com calma
              </Button>
            </div>
          </div>
        )}

        {/* Instrução ao Interagente */}
        <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {currentStep.participant_instruction}
        </div>

        {/* Parâmetros e Dose (Repetições, Ciclos, Séries, Retenções, Duração) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
          {currentStep.target_repetitions !== undefined && currentStep.target_repetitions > 0 && (
            <div className="p-2.5 rounded-md bg-muted/40 border border-border/30">
              <span className="text-[11px] text-muted-foreground block">Repetições planejadas</span>
              <span className="text-sm font-semibold text-foreground">
                {currentStep.target_repetitions} repetições
              </span>
            </div>
          )}

          {currentStep.target_cycles !== undefined && currentStep.target_cycles > 0 && (
            <div className="p-2.5 rounded-md bg-muted/40 border border-border/30">
              <span className="text-[11px] text-muted-foreground block">Ciclos planejados</span>
              <span className="text-sm font-semibold text-foreground">
                {currentStep.target_cycles} ciclos
              </span>
            </div>
          )}

          {currentStep.target_series !== undefined && currentStep.target_series > 0 && (
            <div className="p-2.5 rounded-md bg-muted/40 border border-border/30">
              <span className="text-[11px] text-muted-foreground block">Séries</span>
              <span className="text-sm font-semibold text-foreground">
                {currentStep.target_series} séries
              </span>
            </div>
          )}

          {currentStep.duration_seconds !== undefined && currentStep.duration_seconds > 0 && (
            <div className="p-2.5 rounded-md bg-muted/40 border border-border/30 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-[11px] text-muted-foreground block">Duração</span>
                <span className="text-sm font-semibold text-foreground">
                  {currentStep.duration_seconds} segundos
                </span>
              </div>
            </div>
          )}

          {/* Retenção explícita */}
          <div className="p-2.5 rounded-md bg-muted/40 border border-border/30">
            <span className="text-[11px] text-muted-foreground block">Retenção de ar</span>
            <span className="text-sm font-semibold text-foreground">
              {currentStep.retention_type === 'none' && 'Sem retenção'}
              {currentStep.retention_type === 'antara' && 'Antara Kumbhaka (com ar)'}
              {currentStep.retention_type === 'bahya' && 'Bahya Kumbhaka (sem ar)'}
            </span>
          </div>

          {/* Pausa natural entre séries/ciclos */}
          {currentStep.break_type === 'natural_breathing' && (
            <div className="p-2.5 rounded-md bg-muted/40 border border-border/30 flex items-center gap-2">
              <Wind className="w-4 h-4 text-primary" />
              <div>
                <span className="text-[11px] text-muted-foreground block">Pausa</span>
                <span className="text-sm font-semibold text-foreground">Respiração natural</span>
              </div>
            </div>
          )}
        </div>

        {/* Quantidade efetivamente realizada (opcional, sem julgamento) */}
        {(currentStep.target_repetitions || currentStep.target_cycles) && (
          <div className="p-3.5 rounded-lg border border-border/50 bg-background/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Quantidade efetivamente realizada neste passo (se quiser registrar):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={
                    performedCounts[currentStep.stable_step_id] ??
                    currentStep.target_repetitions ??
                    currentStep.target_cycles ??
                    0
                  }
                  onChange={(e) =>
                    handleAdjustPerformed(
                      currentStep.stable_step_id,
                      parseInt(e.target.value, 10) || 0,
                    )
                  }
                  className="w-16 px-2 py-1 text-xs border rounded text-center bg-background"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sinais de Interrupção e Enraizamento */}
        {currentStep.stop_signs && (
          <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-semibold block mb-0.5">Sinais para interromper ou pausar:</span>
            <span>{currentStep.stop_signs}</span>
          </div>
        )}

        {currentStep.grounding_instruction && (
          <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-xs text-foreground">
            <span className="font-semibold block mb-0.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Instrução de Enraizamento / Retorno:</span>
            </span>
            <span>{currentStep.grounding_instruction}</span>
          </div>
        )}

        {/* Botão de avanço */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            className="text-xs h-8"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Passo anterior</span>
          </Button>

          <Button onClick={handleNext} size="sm" className="text-xs h-8 gap-1.5">
            {isLastStep ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Concluir passos e ir para reflexão</span>
              </>
            ) : (
              <>
                <span>Próximo passo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
