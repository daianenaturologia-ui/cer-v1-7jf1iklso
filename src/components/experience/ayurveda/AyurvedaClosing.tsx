import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import {
  AyurvedaChapter1State,
  AYV_TEXTS,
  categorizeChapter1Responses,
} from '@/services/ayurvedaChapter1'

export interface AyurvedaClosingProps {
  state: AyurvedaChapter1State
  isCompleted: boolean
  onSaveAndContinueLater: () => void
  onCompleteChapter: () => void
  onReviewResponses: () => void
  onStartCorrection: () => void
  onBackToHub?: () => void
  loading?: boolean
  correctionError?: string | null
  onClearCorrectionError?: () => void
}

export const AyurvedaClosing: React.FC<AyurvedaClosingProps> = ({
  state,
  isCompleted,
  onSaveAndContinueLater,
  onCompleteChapter,
  onReviewResponses,
  onStartCorrection,
  onBackToHub,
  loading = false,
  correctionError = null,
  onClearCorrectionError,
}) => {
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const { longerTerm, contextVariable, pointsToClarify } = categorizeChapter1Responses(state)

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
              {AYV_TEXTS.COMPLETED_TITLE}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {AYV_TEXTS.COMPLETED_BODY}
            </p>
          </div>

          {/* Mensagem explícita de erro com botão Tentar novamente se a correção falhar */}
          {correctionError && (
            <div
              role="alert"
              data-testid="c1-correction-error-banner"
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
            {onBackToHub && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={onBackToHub}
                className="w-full sm:w-auto text-xs h-9 px-4 gap-1.5"
              >
                <span>Voltar aos capítulos</span>
              </Button>
            )}
          </div>

          {/* Diálogo explícito de confirmação de correção */}
          {showCorrectionDialog && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="correction-dialog-title"
              className="p-4 sm:p-5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 space-y-3"
            >
              <h3 id="correction-dialog-title" className="font-serif font-semibold text-sm">
                Confirmar abertura de correção
              </h3>
              <p className="text-xs leading-relaxed">{AYV_TEXTS.CORRECTION_CONFIRMATION_PROMPT}</p>
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
            Síntese literal do Capítulo 1
          </Badge>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground">
            O que você observou sobre o seu corpo
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aqui estão reunidas suas respostas literais, organizadas de forma respeitosa e sem
            rótulos ou pontuações artificiais.
          </p>
        </div>

        {/* 1. Características que você reconhece há mais tempo */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-xs sm:text-sm font-semibold font-serif text-foreground">
                Características que você reconhece há mais tempo
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {longerTerm.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {longerTerm.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{item.promptLabel}: </span>
                      <span className="text-muted-foreground">{item.optionLabel}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma característica prolongada destacada.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 2. Características que parecem variar conforme o contexto */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <CardTitle className="text-xs sm:text-sm font-semibold font-serif text-foreground">
                Características que parecem variar conforme o contexto
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {contextVariable.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {contextVariable.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{item.promptLabel}: </span>
                      <span className="text-muted-foreground">{item.optionLabel}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma oscilação expressiva registrada.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 3. Pontos que ainda precisam ser compreendidos */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/40">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-xs sm:text-sm font-semibold font-serif text-foreground">
                Pontos que ainda precisam ser compreendidos
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {pointsToClarify.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {pointsToClarify.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{item.promptLabel}: </span>
                      <span className="text-muted-foreground">{item.optionLabel}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma dúvida, recusa ou incerteza declarada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nota ética final obrigatória */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs sm:text-sm text-foreground/90 leading-relaxed font-serif italic text-center">
        “{AYV_TEXTS.CLOSING_FINAL_NOTE}”
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
            className="w-full sm:w-auto text-xs h-10 px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span>Concluir este capítulo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
export default AyurvedaClosing
