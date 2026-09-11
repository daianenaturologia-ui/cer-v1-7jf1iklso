import React from 'react'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChoiceOption {
  id: string
  title: string
  description?: string
  icon?: string
}

export interface ChoiceCardsConfig {
  options: ChoiceOption[]
}

export interface ChoiceCardsProps {
  config: ChoiceCardsConfig
  value?: string | null
  onChange: (value: string) => void
  disabled?: boolean
  allowSkip?: boolean
  onSkip?: (reason: 'nao_sei' | 'prefiro_nao_responder') => void
  isReadOnly?: boolean
}

export const ChoiceCards: React.FC<ChoiceCardsProps> = ({
  config,
  value,
  onChange,
  disabled = false,
  allowSkip = false,
  onSkip,
  isReadOnly = false,
}) => {
  const options = config?.options || []

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Opções de escolha">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = value === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${opt.title}${opt.description ? ': ' + opt.description : ''}`}
              disabled={disabled || isReadOnly}
              onClick={() => !isReadOnly && onChange(opt.id)}
              className={cn(
                'text-left transition-all duration-200 rounded-xl p-4 border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm'
                  : 'border-border/70 hover:border-border hover:bg-muted/30 bg-card/60',
                (disabled || isReadOnly) && 'opacity-70 cursor-default',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-sm text-foreground leading-snug">{opt.title}</p>
                  {opt.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {opt.description}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-background',
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {allowSkip && onSkip && !isReadOnly && (
        <div className="flex items-center gap-2 pt-2 text-xs">
          <button
            type="button"
            onClick={() => onSkip('nao_sei')}
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          >
            Não sei dizer agora
          </button>
          <span className="text-muted-foreground/40">•</span>
          <button
            type="button"
            onClick={() => onSkip('prefiro_nao_responder')}
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          >
            Prefiro não responder
          </button>
        </div>
      )}
    </div>
  )
}
