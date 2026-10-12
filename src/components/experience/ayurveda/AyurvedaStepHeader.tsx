import React from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface AyurvedaStepHeaderProps {
  chapterLabel: string
  stepLabel: string
  onSaveAndContinueLater: () => void
  disabled?: boolean
  isExiting?: boolean
  className?: string
}

export const AyurvedaStepHeader: React.FC<AyurvedaStepHeaderProps> = ({
  chapterLabel,
  stepLabel,
  onSaveAndContinueLater,
  disabled = false,
  isExiting = false,
  className = '',
}) => {
  return (
    <header
      data-testid="ayurveda-step-header"
      className={`w-full mb-4 pb-3 border-b border-border/50 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap ${className}`}
    >
      <div className="min-w-0 flex items-center gap-2">
        <span className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground truncate">
          {chapterLabel}
        </span>
        <span className="text-muted-foreground/40 text-xs hidden sm:inline">•</span>
        <span className="text-xs font-medium text-foreground truncate">{stepLabel}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isExiting}
        onClick={onSaveAndContinueLater}
        aria-label="Salvar e continuar depois"
        className="text-xs h-8 px-3 gap-1.5 shrink-0 bg-background/80 hover:bg-muted/50 border-border/70"
      >
        {isExiting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Salvando…</span>
          </>
        ) : (
          <>
            <Bookmark className="w-3.5 h-3.5 text-primary" />
            <span>Salvar e continuar depois</span>
          </>
        )}
      </Button>
    </header>
  )
}

export default AyurvedaStepHeader
