import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Lock, ArrowRight, Sparkles, Clock, AlertCircle } from 'lucide-react'
import {
  AYURVEDA_FOUR_CHAPTERS,
  AYV_TEXTS,
  AyurvedaChapterDefinition,
  AyurvedaChapter1Status,
} from '@/services/ayurvedaChapter1'
import { AyurvedaChapter2Status } from '@/services/ayurvedaChapter2'
import { AyurvedaChapter3Status } from '@/services/ayurvedaChapter3'

export interface AyurvedaChaptersHubProps {
  onStartChapter1?: () => void
  onStartChapter2?: () => void
  onStartChapter3?: () => void
  onStartChapter4?: () => void
  onOpenCustomization?: () => void
  onCorrectChapter1?: () => void
  onCorrectChapter2?: () => void
  isChapter1Completed?: boolean
  chapter1Status?: AyurvedaChapter1Status
  chapter1Progress?: number
  chapter1StepOrder?: number
  answeredStepsCount?: number
  totalSteps?: number
  chapter1ActiveRevision?: number
  chapter1LastCompletedRevision?: number | null
  chapter1HasCorrectionInProgress?: boolean
  // Props canônicas do Capítulo 2
  chapter2Status?: AyurvedaChapter2Status
  chapter2Progress?: number
  answeredMomentsCountC2?: number
  totalMomentsC2?: number
  chapter2ActiveRevision?: number
  chapter2LastCompletedRevision?: number | null
  chapter2HasCorrectionInProgress?: boolean
  chapter3Status?: AyurvedaChapter3Status
  chapter3AnsweredSteps?: number
  chapter3TotalSteps?: number
  chapter4Completed?: boolean
  avatarDeferred?: boolean
  onClose?: () => void
}

export type HubCanonicalStateId =
  | 'locked'
  | 'not_started'
  | 'in_progress'
  | 'ready_to_complete'
  | 'correcting_in_progress'
  | 'correcting_ready_to_complete'
  | 'completed'

export const AyurvedaChaptersHub: React.FC<AyurvedaChaptersHubProps> = ({
  onStartChapter1,
  onStartChapter2,
  onStartChapter3,
  onStartChapter4,
  onOpenCustomization,
  onCorrectChapter1,
  onCorrectChapter2,
  isChapter1Completed,
  chapter1Status,
  chapter1StepOrder = 1,
  answeredStepsCount,
  totalSteps = 5,
  chapter1ActiveRevision = 1,
  chapter1LastCompletedRevision = null,
  chapter1HasCorrectionInProgress = false,
  chapter2Status = 'not_started',
  chapter2Progress = 0,
  answeredMomentsCountC2 = 0,
  totalMomentsC2 = 5,
  chapter2ActiveRevision = 1,
  chapter2LastCompletedRevision = null,
  chapter2HasCorrectionInProgress = false,
  chapter3Status = 'not_started',
  chapter3AnsweredSteps = 0,
  chapter3TotalSteps = 4,
  chapter4Completed = false,
  avatarDeferred = false,
  onClose,
}) => {
  const [showC1ConfirmDialog, setShowC1ConfirmDialog] = React.useState(false)
  const [showC2ConfirmDialog, setShowC2ConfirmDialog] = React.useState(false)

  // Resolução canônica de status do C1
  const rawStatusC1: AyurvedaChapter1Status =
    chapter1Status || (isChapter1Completed ? 'completed' : 'not_started')

  const effectiveAnsweredStepsC1 =
    typeof answeredStepsCount === 'number'
      ? answeredStepsCount
      : rawStatusC1 === 'completed' || rawStatusC1 === 'ready_to_complete'
        ? 5
        : rawStatusC1 === 'in_progress'
          ? Math.max(1, Math.min(4, chapter1StepOrder - 1 || 1))
          : 0

  // Determinação canônica dos 7 estados para o Capítulo 1
  // C1 nunca é Bloqueado (estado 1)
  const isC1CorrectionActive =
    chapter1HasCorrectionInProgress ||
    (chapter1ActiveRevision > 1 &&
      (chapter1LastCompletedRevision === null ||
        chapter1ActiveRevision > chapter1LastCompletedRevision) &&
      rawStatusC1 !== 'completed')

  let c1CanonicalState: HubCanonicalStateId = 'not_started'
  if (rawStatusC1 === 'completed') {
    c1CanonicalState = 'completed'
  } else if (isC1CorrectionActive) {
    if (rawStatusC1 === 'ready_to_complete' || effectiveAnsweredStepsC1 === totalSteps) {
      c1CanonicalState = 'correcting_ready_to_complete'
    } else {
      c1CanonicalState = 'correcting_in_progress'
    }
  } else if (rawStatusC1 === 'ready_to_complete' || effectiveAnsweredStepsC1 === totalSteps) {
    c1CanonicalState = 'ready_to_complete'
  } else if (rawStatusC1 === 'in_progress' || effectiveAnsweredStepsC1 > 0) {
    c1CanonicalState = 'in_progress'
  } else {
    c1CanonicalState = 'not_started'
  }

  // Capítulo 1 canonicamente concluído libera o Capítulo 2
  const isC1CanonicallyCompleted = c1CanonicalState === 'completed'

  // Determinação canônica dos 7 estados para o Capítulo 2
  const effectiveAnsweredMomentsC2 = answeredMomentsCountC2

  const isC2CorrectionActive =
    chapter2HasCorrectionInProgress ||
    (chapter2ActiveRevision > 1 &&
      (chapter2LastCompletedRevision === null ||
        chapter2ActiveRevision > chapter2LastCompletedRevision) &&
      chapter2Status !== 'completed')

  let c2CanonicalState: HubCanonicalStateId = 'locked'
  if (!isC1CanonicallyCompleted) {
    c2CanonicalState = 'locked'
  } else if (chapter2Status === 'completed') {
    c2CanonicalState = 'completed'
  } else if (isC2CorrectionActive) {
    if (chapter2Status === 'ready_to_complete' || effectiveAnsweredMomentsC2 === totalMomentsC2) {
      c2CanonicalState = 'correcting_ready_to_complete'
    } else {
      c2CanonicalState = 'correcting_in_progress'
    }
  } else if (
    chapter2Status === 'ready_to_complete' ||
    effectiveAnsweredMomentsC2 === totalMomentsC2
  ) {
    c2CanonicalState = 'ready_to_complete'
  } else if (chapter2Status === 'in_progress' || effectiveAnsweredMomentsC2 > 0) {
    c2CanonicalState = 'in_progress'
  } else {
    c2CanonicalState = 'not_started'
  }

  let c3CanonicalState: HubCanonicalStateId = 'locked'
  if (c2CanonicalState !== 'completed') c3CanonicalState = 'locked'
  else if (chapter3Status === 'completed') c3CanonicalState = 'completed'
  else if (chapter3Status === 'ready_to_complete') c3CanonicalState = 'ready_to_complete'
  else if (chapter3Status === 'in_progress') c3CanonicalState = 'in_progress'
  else c3CanonicalState = 'not_started'

  const currentJourneyLabel = chapter4Completed
    ? 'Percurso concluído'
    : c3CanonicalState === 'completed'
      ? 'Capítulo 4 disponível'
      : c2CanonicalState === 'completed'
        ? c3CanonicalState === 'not_started'
          ? 'Capítulo 3 disponível'
          : c3CanonicalState === 'ready_to_complete'
            ? 'Capítulo 3 pronto para concluir'
            : 'Capítulo 3 em andamento'
        : c1CanonicalState === 'completed'
          ? c2CanonicalState === 'not_started'
            ? 'Capítulo 2 disponível'
            : c2CanonicalState === 'correcting_ready_to_complete'
              ? 'Correção do Capítulo 2 pronta para concluir'
              : c2CanonicalState === 'correcting_in_progress'
                ? 'Correção do Capítulo 2 em andamento'
                : c2CanonicalState === 'ready_to_complete'
                  ? 'Capítulo 2 pronto para concluir'
                  : 'Capítulo 2 em andamento'
          : c1CanonicalState === 'correcting_ready_to_complete'
            ? 'Correção do Capítulo 1 pronta para concluir'
            : c1CanonicalState === 'correcting_in_progress'
              ? 'Correção do Capítulo 1 em andamento'
              : c1CanonicalState === 'ready_to_complete'
                ? 'Capítulo 1 pronto para concluir'
                : 'Capítulo 1 em andamento'

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6 px-4 py-6">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <Badge
          variant="outline"
          className="max-w-full whitespace-normal text-[10px] tracking-wider uppercase font-mono"
        >
          Corpo & Fisiologia • Avaliação Ayurveda
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

      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
          Percurso de Avaliação Corporal
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
          Nesta dimensão, observamos a inteligência e o ritmo do seu corpo em quatro capítulos
          integrados. O primeiro capítulo investiga sua estrutura e suas características habituais.
        </p>
      </div>

      {/* Alerta caso a personalização estética tenha sido postergada */}
      {avatarDeferred && (
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-start justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-medium text-foreground block">
              Personalização estética não definida
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Você pode responder ao Capítulo 1 normalmente. Nenhuma escolha clínica fictícia foi
              criada.
            </p>
          </div>
          {onOpenCustomization && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenCustomization}
              className="text-xs h-7 shrink-0"
            >
              Personalizar
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 rounded-xl border border-border/70 bg-card p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-foreground">Seu percurso em Corpo & Fisiologia</span>
        <span className="text-muted-foreground">{currentJourneyLabel}</span>
      </div>

      {/* Grid com os Quatro Capítulos */}
      <div className="space-y-3">
        {AYURVEDA_FOUR_CHAPTERS.map((chap: AyurvedaChapterDefinition) => {
          const isChap1 = chap.number === 1
          const isChap2 = chap.number === 2
          const isChap3 = chap.number === 3
          const isChap4 = chap.number === 4

          const chap2Title = isChap2 ? 'O ritmo do meu corpo' : chap.shortTitle
          const chap2Subtitle = isChap2
            ? 'Fome, digestão, eliminação, sono e energia'
            : chap.subtitle

          if (isChap1) {
            return (
              <Card
                key={chap.id}
                className="transition-all border border-primary/50 shadow-xs bg-card"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                        Capítulo 1
                      </span>
                      <CardTitle className="text-sm font-semibold font-serif text-foreground">
                        {chap.shortTitle}
                      </CardTitle>
                    </div>

                    {/* Badge Canônico C1 */}
                    {c1CanonicalState === 'completed' ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] gap-1 text-emerald-700 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluído
                      </Badge>
                    ) : c1CanonicalState === 'correcting_ready_to_complete' ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        Correção pronta para concluir
                      </Badge>
                    ) : c1CanonicalState === 'correcting_in_progress' ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        Correção em andamento
                      </Badge>
                    ) : c1CanonicalState === 'ready_to_complete' ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pronto para concluir
                      </Badge>
                    ) : c1CanonicalState === 'in_progress' ? (
                      <Badge variant="outline" className="text-[10px] gap-1 text-primary">
                        <Clock className="w-3 h-3" />
                        Em andamento
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Não iniciado
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs pt-1 leading-relaxed">
                    {chap.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {c1CanonicalState === 'completed' && '100% concluído'}
                      {c1CanonicalState === 'correcting_ready_to_complete' &&
                        'Suas correções estão preenchidas. Revise e confirme a nova versão.'}
                      {c1CanonicalState === 'correcting_in_progress' && (
                        <span>
                          {effectiveAnsweredStepsC1} de {totalSteps} etapas revisadas. Você iniciou
                          uma correção das suas respostas.
                        </span>
                      )}
                      {c1CanonicalState === 'ready_to_complete' &&
                        'Suas respostas estão preenchidas. Revise e confirme a conclusão deste capítulo.'}
                      {c1CanonicalState === 'in_progress' &&
                        `${effectiveAnsweredStepsC1} de ${totalSteps} etapas respondidas`}
                      {c1CanonicalState === 'not_started' &&
                        'Você ainda não iniciou este capítulo.'}
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {c1CanonicalState === 'completed' ? (
                        <>
                          {onCorrectChapter1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowC1ConfirmDialog(true)}
                              className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
                            >
                              Corrigir minhas respostas
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            onClick={onStartChapter1}
                            className="text-xs h-8 px-4 gap-1.5"
                          >
                            <span>Rever Capítulo 1</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : c1CanonicalState === 'correcting_ready_to_complete' ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={onStartChapter1}
                          className="text-xs h-8 px-4 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                        >
                          <span>Revisar e concluir correção</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : c1CanonicalState === 'correcting_in_progress' ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={onStartChapter1}
                          className="text-xs h-8 px-4 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                        >
                          <span>Retomar correção</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : c1CanonicalState === 'ready_to_complete' ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={onStartChapter1}
                          className="text-xs h-8 px-4 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                        >
                          <span>Revisar e concluir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : c1CanonicalState === 'in_progress' ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={onStartChapter1}
                          className="text-xs h-8 px-4 gap-1.5"
                        >
                          <span>Retomar Capítulo 1</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={onStartChapter1}
                          className="text-xs h-8 px-4 gap-1.5"
                        >
                          <span>Começar Capítulo 1</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Diálogo explícito de confirmação para C1 */}
                  {showC1ConfirmDialog && (
                    <div
                      role="alertdialog"
                      aria-modal="true"
                      aria-labelledby="c1-hub-correction-dialog-title"
                      className="mt-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 space-y-3"
                    >
                      <h3
                        id="c1-hub-correction-dialog-title"
                        className="font-serif font-semibold text-sm"
                      >
                        Confirmar abertura de correção do Capítulo 1
                      </h3>
                      <p className="text-xs leading-relaxed">
                        {AYV_TEXTS.CORRECTION_CONFIRMATION_PROMPT}
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowC1ConfirmDialog(false)}
                          className="text-xs h-8"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setShowC1ConfirmDialog(false)
                            onCorrectChapter1?.()
                          }}
                          className="text-xs h-8 bg-amber-700 hover:bg-amber-800 text-white"
                        >
                          Confirmar e corrigir
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }

          if (isChap2) {
            const isChap2Locked = c2CanonicalState === 'locked'
            return (
              <Card
                key={chap.id}
                aria-disabled={isChap2Locked ? 'true' : undefined}
                tabIndex={isChap2Locked ? -1 : undefined}
                className={`transition-all border ${
                  !isChap2Locked
                    ? 'border-primary/50 shadow-xs bg-card'
                    : 'border-border/50 bg-muted/20 opacity-80 pointer-events-none select-none'
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                        Capítulo 2
                      </span>
                      <CardTitle className="text-sm font-semibold font-serif text-foreground">
                        {chap2Title}
                      </CardTitle>
                    </div>

                    {/* Badge Canônico C2 */}
                    {c2CanonicalState === 'locked' ? (
                      <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                        <Lock className="w-2.5 h-2.5" />
                        Bloqueado
                      </Badge>
                    ) : c2CanonicalState === 'completed' ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] gap-1 text-emerald-700 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluído
                      </Badge>
                    ) : c2CanonicalState === 'correcting_ready_to_complete' ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        Correção pronta para concluir
                      </Badge>
                    ) : c2CanonicalState === 'correcting_in_progress' ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        Correção em andamento
                      </Badge>
                    ) : c2CanonicalState === 'ready_to_complete' ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pronto para concluir
                      </Badge>
                    ) : c2CanonicalState === 'in_progress' ? (
                      <Badge variant="outline" className="text-[10px] gap-1 text-primary">
                        <Clock className="w-3 h-3" />
                        Em andamento
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Não iniciado
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs pt-1 leading-relaxed">
                    {chap2Subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  {c2CanonicalState === 'locked' ? (
                    <div className="pt-1">
                      <span className="text-[11px] text-muted-foreground italic flex items-center gap-1.5">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>Conclua o Capítulo 1 para liberar este capítulo.</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {c2CanonicalState === 'completed' && '100% concluído'}
                        {c2CanonicalState === 'correcting_ready_to_complete' &&
                          'Suas correções estão preenchidas. Revise e confirme a nova versão.'}
                        {c2CanonicalState === 'correcting_in_progress' && (
                          <span>
                            {effectiveAnsweredMomentsC2} de {totalMomentsC2} momentos revisadas.
                            Você iniciou uma correção das suas respostas.
                          </span>
                        )}
                        {c2CanonicalState === 'ready_to_complete' &&
                          'Suas respostas estão preenchidas. Revise e confirme a conclusão deste capítulo.'}
                        {c2CanonicalState === 'in_progress' &&
                          `${effectiveAnsweredMomentsC2} de ${totalMomentsC2} momentos respondidas`}
                        {c2CanonicalState === 'not_started' &&
                          'Capítulo liberado. Observe o ritmo da sua fome, digestão, sono e energia.'}
                      </span>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {c2CanonicalState === 'completed' ? (
                          <>
                            {onCorrectChapter2 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowC2ConfirmDialog(true)}
                                className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground pointer-events-auto"
                              >
                                Corrigir minhas respostas
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              onClick={onStartChapter2}
                              className="text-xs h-8 px-4 gap-1.5 pointer-events-auto"
                            >
                              <span>Rever Capítulo 2</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : c2CanonicalState === 'correcting_ready_to_complete' ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={onStartChapter2}
                            className="text-xs h-8 px-4 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 pointer-events-auto"
                          >
                            <span>Revisar e concluir correção</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        ) : c2CanonicalState === 'correcting_in_progress' ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={onStartChapter2}
                            className="text-xs h-8 px-4 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 pointer-events-auto"
                          >
                            <span>Retomar correção</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        ) : c2CanonicalState === 'ready_to_complete' ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={onStartChapter2}
                            className="text-xs h-8 px-4 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 pointer-events-auto"
                          >
                            <span>Revisar e concluir</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        ) : c2CanonicalState === 'in_progress' ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={onStartChapter2}
                            className="text-xs h-8 px-4 gap-1.5 pointer-events-auto"
                          >
                            <span>Retomar Capítulo 2</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={onStartChapter2}
                            className="text-xs h-8 px-4 gap-1.5 pointer-events-auto"
                          >
                            <span>Começar Capítulo 2</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Diálogo explícito de confirmação para C2 */}
                  {showC2ConfirmDialog && (
                    <div
                      role="alertdialog"
                      aria-modal="true"
                      aria-labelledby="c2-hub-correction-dialog-title"
                      className="mt-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 space-y-3 pointer-events-auto"
                    >
                      <h3
                        id="c2-hub-correction-dialog-title"
                        className="font-serif font-semibold text-sm"
                      >
                        Confirmar abertura de correção do Capítulo 2
                      </h3>
                      <p className="text-xs leading-relaxed">
                        Ao confirmar, você poderá corrigir suas respostas. A versão anterior será
                        preservada no histórico profissional.
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowC2ConfirmDialog(false)}
                          className="text-xs h-8"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setShowC2ConfirmDialog(false)
                            onCorrectChapter2?.()
                          }}
                          className="text-xs h-8 bg-amber-700 hover:bg-amber-800 text-white"
                        >
                          Confirmar e corrigir
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }

          if (isChap3) {
            const locked = c3CanonicalState === 'locked'
            const completed = c3CanonicalState === 'completed'
            return (
              <Card
                key={chap.id}
                aria-disabled={locked ? 'true' : undefined}
                className={`transition-all border ${locked ? 'border-border/50 bg-muted/20 opacity-80' : 'border-primary/50 bg-card shadow-xs'}`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-primary">
                        Capítulo 3
                      </span>
                      <CardTitle className="text-sm font-semibold font-serif">
                        {chap.shortTitle}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={completed ? 'secondary' : 'outline'}
                      className="text-[10px] gap-1"
                    >
                      {locked ? (
                        <Lock className="h-3 w-3" />
                      ) : completed ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {locked
                        ? 'Bloqueado'
                        : completed
                          ? 'Concluído'
                          : c3CanonicalState === 'ready_to_complete'
                            ? 'Pronto para concluir'
                            : c3CanonicalState === 'in_progress'
                              ? 'Em andamento'
                              : 'Não iniciado'}
                    </Badge>
                  </div>
                  <CardDescription className="pt-1 text-xs">{chap.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {locked ? (
                    <p className="flex items-center gap-1.5 text-[11px] italic text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Conclua o Capítulo 2 para liberar este capítulo.
                    </p>
                  ) : (
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <span className="text-[11px] text-muted-foreground">
                        {completed
                          ? 'Mudanças atuais registradas.'
                          : c3CanonicalState === 'ready_to_complete'
                            ? 'Respostas prontas para revisão e conclusão.'
                            : c3CanonicalState === 'in_progress'
                              ? `${chapter3AnsweredSteps} de ${chapter3TotalSteps} etapas essenciais respondidas.`
                              : 'Observe somente o que está diferente no momento atual.'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={onStartChapter3}
                        className="h-8 px-4 text-xs"
                      >
                        {completed
                          ? 'Rever Capítulo 3'
                          : c3CanonicalState === 'not_started'
                            ? 'Começar Capítulo 3'
                            : 'Retomar Capítulo 3'}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }

          if (isChap4) {
            const locked = c3CanonicalState !== 'completed'
            return (
              <Card
                key={chap.id}
                aria-disabled={locked ? 'true' : undefined}
                className={`transition-all border ${locked ? 'border-border/50 bg-muted/20 opacity-80' : 'border-primary/50 bg-card shadow-xs'}`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-primary">
                        Capítulo 4
                      </span>
                      <CardTitle className="text-sm font-semibold font-serif">
                        {chap.shortTitle}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={chapter4Completed ? 'secondary' : 'outline'}
                      className="gap-1 text-[10px]"
                    >
                      {locked ? (
                        <Lock className="h-3 w-3" />
                      ) : chapter4Completed ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {locked ? 'Bloqueado' : chapter4Completed ? 'Concluído' : 'Disponível'}
                    </Badge>
                  </div>
                  <CardDescription className="pt-1 text-xs">{chap.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {locked ? (
                    <p className="flex items-center gap-1.5 text-[11px] italic text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Conclua o Capítulo 3 para liberar sua síntese.
                    </p>
                  ) : (
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <span className="text-[11px] text-muted-foreground">
                        {chapter4Completed
                          ? 'Sua síntese descritiva está disponível para rever.'
                          : 'Reúna características antigas, ritmos habituais e mudanças atuais.'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={onStartChapter4}
                        className="h-8 px-4 text-xs"
                      >
                        {chapter4Completed ? 'Rever síntese' : 'Ver minha síntese'}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          }

          // Segurança para futuras definições adicionadas ao catálogo.
          return (
            <Card
              key={chap.id}
              className="transition-all border border-border/50 bg-muted/20 opacity-80"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                      Capítulo {chap.number}
                    </span>
                    <CardTitle className="text-sm font-semibold font-serif text-foreground">
                      {chap.shortTitle}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                    <Lock className="w-2.5 h-2.5" />
                    Em breve
                  </Badge>
                </div>
                <CardDescription className="text-xs pt-1 leading-relaxed">
                  {chap.subtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="pt-1">
                  <span className="text-[11px] text-muted-foreground italic flex items-center gap-1.5">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>{chap.statusLabel}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
export default AyurvedaChaptersHub
