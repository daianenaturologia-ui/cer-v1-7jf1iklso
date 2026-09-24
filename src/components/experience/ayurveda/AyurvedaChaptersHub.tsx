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

export interface AyurvedaChaptersHubProps {
  onStartChapter1: () => void
  onOpenCustomization?: () => void
  onCorrectChapter1?: () => void
  isChapter1Completed?: boolean
  chapter1Status?: AyurvedaChapter1Status
  chapter1Progress?: number
  chapter1StepOrder?: number
  avatarDeferred?: boolean
  onClose?: () => void
}

export const AyurvedaChaptersHub: React.FC<AyurvedaChaptersHubProps> = ({
  onStartChapter1,
  onOpenCustomization,
  onCorrectChapter1,
  isChapter1Completed,
  chapter1Status,
  chapter1Progress,
  chapter1StepOrder = 1,
  avatarDeferred = false,
  onClose,
}) => {
  // Resolução canônica de status: prioriza chapter1Status explícito;
  // retrocompatibilidade com isChapter1Completed booleano se chapter1Status não for passado.
  const effectiveStatus: AyurvedaChapter1Status =
    chapter1Status || (isChapter1Completed ? 'completed' : 'not_started')

  const effectiveProgress: number =
    typeof chapter1Progress === 'number'
      ? Math.max(0, Math.min(100, chapter1Progress))
      : effectiveStatus === 'completed'
        ? 100
        : effectiveStatus === 'in_progress'
          ? Math.min(100, Math.max(15, (chapter1StepOrder / 5) * 100))
          : 0

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
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

      {/* Barra de Progresso Canônica: Foco exclusivo no Capítulo 1 */}
      <div className="p-4 rounded-xl bg-card border border-border/70 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Progresso do Capítulo 1</span>
          <span className="text-muted-foreground font-mono">
            {effectiveStatus === 'completed' && 'Concluído'}
            {effectiveStatus === 'in_progress' &&
              `Em andamento (${effectiveProgress}% • Etapa ${chapter1StepOrder} de 5)`}
            {effectiveStatus === 'not_started' && 'Não iniciado (0%)'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${effectiveProgress}%`,
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          O progresso exibido considera somente o Capítulo 1 ativo nesta etapa.
        </p>
      </div>

      {/* Grid com os Quatro Capítulos */}
      <div className="space-y-3">
        {AYURVEDA_FOUR_CHAPTERS.map((chap: AyurvedaChapterDefinition) => {
          const isChap1 = chap.number === 1

          return (
            <Card
              key={chap.id}
              className={`transition-all border ${
                isChap1
                  ? 'border-primary/50 shadow-xs bg-card'
                  : 'border-border/50 bg-muted/20 opacity-80'
              }`}
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

                  {isChap1 ? (
                    effectiveStatus === 'completed' ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] gap-1 text-emerald-700 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluído
                      </Badge>
                    ) : effectiveStatus === 'in_progress' ? (
                      <Badge variant="outline" className="text-[10px] gap-1 text-primary">
                        <Clock className="w-3 h-3" />
                        Em andamento
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Não iniciado
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                      <Lock className="w-2.5 h-2.5" />
                      Em breve
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs pt-1 leading-relaxed">
                  {chap.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-2">
                {isChap1 ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {effectiveStatus === 'completed' && 'Você já respondeu ao Capítulo 1.'}
                      {effectiveStatus === 'in_progress' &&
                        `Capítulo em andamento (${effectiveProgress}% concluído).`}
                      {effectiveStatus === 'not_started' && 'Você ainda não iniciou este capítulo.'}
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {effectiveStatus === 'completed' ? (
                        <>
                          {onCorrectChapter1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={onCorrectChapter1}
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
                      ) : effectiveStatus === 'in_progress' ? (
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
                ) : (
                  <div className="pt-1">
                    <span className="text-[11px] text-muted-foreground italic flex items-center gap-1.5">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>{chap.statusLabel}</span>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
export default AyurvedaChaptersHub
