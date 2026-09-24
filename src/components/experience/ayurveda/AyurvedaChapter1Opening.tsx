import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowRight } from 'lucide-react'
import { AYV_TEXTS } from '@/services/ayurvedaChapter1'

export interface AyurvedaChapter1OpeningProps {
  onStartQuestions: () => void
  onBackToHub?: () => void
}

export const AyurvedaChapter1Opening: React.FC<AyurvedaChapter1OpeningProps> = ({
  onStartQuestions,
  onBackToHub,
}) => {
  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
          Capítulo 1 • Abertura
        </Badge>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>{AYV_TEXTS.ESTIMATED_DURATION}</span>
        </div>
      </div>

      <div className="space-y-3 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
          {AYV_TEXTS.OPENING_TITLE}
        </h1>
      </div>

      {/* Texto Literal de Abertura */}
      <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed">
        {AYV_TEXTS.OPENING_BODY.split('\n\n').map((par, i) => (
          <p key={i}>{par}</p>
        ))}

        <div className="pt-2 font-serif text-right text-foreground">
          <p className="italic">{AYV_TEXTS.OPENING_SIGNATURE}</p>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        {onBackToHub ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToHub}
            className="w-full sm:w-auto text-xs h-10 px-4"
          >
            Voltar aos capítulos
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="button"
          onClick={onStartQuestions}
          className="w-full sm:w-auto text-xs h-10 px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span>Iniciar perguntas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
export default AyurvedaChapter1Opening
