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
  maxSelect?: number
  exclusive_options?: string[]
}

export interface ChoiceCardsProps {
  config: ChoiceCardsConfig
  value?: string | string[] | null
  onChange: (value: string) => void
  onMultiChange?: (value: string[]) => void
  disabled?: boolean
  allowSkip?: boolean
  onSkip?: (reason: 'nao_sei' | 'prefiro_nao_responder') => void
  isReadOnly?: boolean
}

export const ChoiceCards: React.FC<ChoiceCardsProps> = ({
  config,
  value,
  onChange,
  onMultiChange,
  disabled = false,
  allowSkip = false,
  onSkip,
  isReadOnly = false,
}) => {
  const options = config?.options || []
  const multiple = (config.maxSelect || 1) > 1 && Boolean(onMultiChange)
  const selected = Array.isArray(value) ? value : value ? [value] : []
  const exclusive = config.exclusive_options || []
  const choose = (id: string) => {
    if (!multiple) return onChange(id)
    if (selected.includes(id)) return onMultiChange!(selected.filter((item) => item !== id))
    const next = exclusive.includes(id) ? [] : selected.filter((item) => !exclusive.includes(item))
    if (next.length < config.maxSelect!) onMultiChange!([...next, id])
  }

  return (
    <div
      className="space-y-3"
      role={multiple ? 'group' : 'radiogroup'}
      aria-label="Opções de escolha"
    >
      {multiple && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Escolha até {config.maxSelect} opções. Uma só também está bem. {selected.length}/
          {config.maxSelect} selecionadas.
          {selected.length >= config.maxSelect! &&
            ' Para trocar uma opção, desmarque uma das selecionadas.'}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.id)

          return (
            <button
              key={opt.id}
              type="button"
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={isSelected}
              aria-label={`${opt.title}${opt.description ? ': ' + opt.description : ''}`}
              disabled={
                disabled ||
                isReadOnly ||
                (multiple &&
                  !isSelected &&
                  selected.length >= config.maxSelect! &&
                  !exclusive.includes(opt.id))
              }
              onClick={() => !isReadOnly && choose(opt.id)}
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
