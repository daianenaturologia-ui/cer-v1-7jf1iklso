import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  Activity,
  Moon,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import {
  AyurvedaChapter2State,
  AYV_C2_TEXTS,
  buildChapter2LiteralSummary,
  Chapter2TreatmentVariant,
} from '@/services/ayurvedaChapter2'

export interface AyurvedaChapter2ClosingProps {
  state: AyurvedaChapter2State
  isCompleted: boolean
  treatmentVariant?: Chapter2TreatmentVariant
  onSaveAndContinueLater: () => void
  onCompleteChapter: () => void
  onReviewResponses: () => void
  onStartCorrection: () => void
  loading?: boolean
  correctionError?: string | null
  onClearCorrectionError?: () => void
}

export const AyurvedaChapter2Closing: React.FC<AyurvedaChapter2ClosingProps> = ({
  state,
  isCompleted,
  treatmentVariant = 'neutro',
  onSaveAndContinueLater,
  onCompleteChapter,
  onReviewResponses,
  onStartCorrection,
  loading = false,
  correctionError = null,
  onClearCorrectionError,
}) => {
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const summarySections = buildChapter2LiteralSummary(state, treatmentVariant)

  const sectionIcons: Record<string, React.ReactNode> = {
    'Meu ritmo de fome': <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    'Como costumo digerir': <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    'Meu ritmo intestinal': <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
    'Como costumo dormir e acordar': (
      <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
    ),
    'Como minha energia se distribui': <Zap className="w-4 h-4 text-amber-500" />,
    'Segurança da memória sobre esse padrão': (
      <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
    ),
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-4">
      {/* Estado Pós-Conclusão */}
      {isCompleted ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground">
              {AYV_C2_TEXTS.COMPLETED_TITLE}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-foreground">
              {AYV_C2_TEXTS.COMPLETED_SUBTITLE}
            </p>
            <div className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed font-serif whitespace-pre-line text-left pt-2">
              {AYV_C2_TEXTS.COMPLETED_BODY}
            </div>
          </div>

          {/* Mensagem explícita de erro com botão Tentar novamente se a correção falhar */}
          {correctionError && (
            <div
              role="alert"
              data-testid="c2-correction-error-banner"
              className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            >
              <span className="font-medium text-center sm:text-left">{correctionError}</span>
              <div className="flex items-center gap-2 shrink-0">
                {onClearCorrectionError && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClearCorrectionError}
                    className="text-xs h-8 px-2 text-rose-800 dark:text-rose-300"
                  >
                    Fechar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onStartCorrection}
                  disabled={loading}
                  className="text-xs h-8 px-3 border-rose-500/40 text-rose-900 dark:text-rose-100 hover:bg-rose-500/20"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {/* Duas ações distintas pós-conclusão */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={onReviewResponses}
              className="w-full sm:w-auto text-xs h-9 px-4 gap-1.5"
            >
              <span>Rever respostas</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => setShowCorrectionDialog(true)}
              className="w-full sm:w-auto text-xs h-9 px-4 gap-1.5 border-amber-600/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Corrigir minhas respostas</span>
            </Button>
          </div>

          {/* Diálogo explícito de confirmação de correção */}
          {showCorrectionDialog && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="c2-correction-dialog-title"
              className="p-4 sm:p-5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 space-y-3"
            >
              <h3 id="c2-correction-dialog-title" className="font-serif font-semibold text-sm">
                Confirmar abertura de correção do Capítulo 2
              </h3>
              <p className="text-xs leading-relaxed">
                {AYV_C2_TEXTS.CORRECTION_CONFIRMATION_PROMPT}
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => setShowCorrectionDialog(false)}
                  className="text-xs h-8"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={loading}
                  onClick={() => {
                    setShowCorrectionDialog(false)
                    onStartCorrection()
                  }}
                  className="text-xs h-8 bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-50"
                >
                  {loading ? 'Criando correção...' : 'Confirmar e corrigir'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Retrato das escolhas literais organizadas determinística e eticamente */}
      <div className="space-y-4">
        <div className="space-y-1 text-center sm:text-left">
          <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
            Síntese literal do Capítulo 2
          </Badge>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground">
            O ritmo que você observou no seu corpo
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aqui estão reunidas suas respostas literais organizadas por momento, sem rótulos,
            doshas, diagnósticos ou pontuações artificiais.
          </p>
        </div>

        {/* 6 seções literais obrigatórias */}
        <div className="space-y-3">
          {summarySections.map((sec, idx) => (
            <Card key={idx} className="border-border/70 shadow-xs">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/40">
                <div className="flex items-center gap-2">
                  {sectionIcons[sec.title] || <Clock className="w-4 h-4 text-primary" />}
                  <CardTitle className="text-xs sm:text-sm font-semibold font-serif text-foreground">
                    {sec.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {sec.items.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {sec.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">{item.promptLabel}: </span>
                          <span className="text-muted-foreground">{item.optionLabel}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhuma resposta registrada para esta seção.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Botões do encerramento antes de concluir */}
      {!isCompleted && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onSaveAndContinueLater}
            className="w-full sm:w-auto text-xs h-10 px-4"
          >
            Salvar e continuar depois
          </Button>

          <Button
            type="button"
            disabled={loading}
            onClick={onCompleteChapter}
            className="w-full sm:w-auto text-xs h-10 px-6 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <span>Concluir Capítulo 2</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default AyurvedaChapter2Closing
