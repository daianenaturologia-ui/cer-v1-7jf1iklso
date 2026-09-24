import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Lock, ArrowRight, Sparkles, Clock, AlertCircle } from 'lucide-react'
import {
  AYURVEDA_FOUR_CHAPTERS,
  AYV_TEXTS,
  AyurvedaChapterDefinition,
} from '@/services/ayurvedaChapter1'

export interface AyurvedaChaptersHubProps {
  onStartChapter1: () => void
  onOpenCustomization?: () => void
  isChapter1Completed?: boolean
  chapter1StepOrder?: number
  avatarDeferred?: boolean
  onClose?: () => void
}

export const AyurvedaChaptersHub: React.FC<AyurvedaChaptersHubProps> = ({
  onStartChapter1,
  onOpenCustomization,
  isChapter1Completed = false,
  chapter1StepOrder = 1,
  avatarDeferred = false,
  onClose,
}) => {
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
            {isChapter1Completed ? 'Concluído' : `Momento ${chapter1StepOrder} de 5`}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: isChapter1Completed
                ? '100%'
                : `${Math.min(100, Math.max(15, (chapter1StepOrder / 5) * 100))}%`,
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
                    isChapter1Completed ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] gap-1 text-emerald-700 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluído
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-primary">
                        <Clock className="w-3 h-3" />
                        Ativo agora
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
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {isChapter1Completed
                        ? 'Você já respondeu ao Capítulo 1.'
                        : 'Duração aproximada: 3 a 4 minutos.'}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onStartChapter1}
                      className="text-xs h-8 px-4 gap-1.5"
                    >
                      <span>
                        {isChapter1Completed
                          ? 'Rever Capítulo 1'
                          : chapter1StepOrder > 1
                            ? 'Retomar Capítulo 1'
                            : 'Iniciar Capítulo 1'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
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
