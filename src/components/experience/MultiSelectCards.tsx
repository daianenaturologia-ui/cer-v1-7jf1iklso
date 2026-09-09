import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  id: string
  title: string
  description?: string
}

export interface MultiSelectCardsConfig {
  options: MultiSelectOption[]
  minSelect?: number
  maxSelect?: number
}

export interface MultiSelectCardsProps {
  config: MultiSelectCardsConfig
  value?: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export const MultiSelectCards: React.FC<MultiSelectCardsProps> = ({
  config,
  value = [],
  onChange,
  disabled = false,
}) => {
  const options = config?.options || []
  const maxSelect = config?.maxSelect || options.length
  const currentSelection = Array.isArray(value) ? value : []

  const toggleOption = (id: string) => {
    if (disabled) return

    if (currentSelection.includes(id)) {
      onChange(currentSelection.filter((item) => item !== id))
    } else {
      if (currentSelection.length < maxSelect) {
        onChange([...currentSelection, id])
      }
    }
  }

  return (
    <div className="space-y-3">
      {maxSelect && maxSelect < options.length && (
        <p className="text-xs text-muted-foreground text-right">
          Selecionados: {currentSelection.length} de {maxSelect}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = currentSelection.includes(opt.id)
          const isLimitReached = !isSelected && currentSelection.length >= maxSelect

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled || isLimitReached}
              onClick={() => toggleOption(opt.id)}
              className={cn(
                'text-left transition-all duration-200 rounded-xl p-4 border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm'
                  : 'border-border/70 hover:border-border hover:bg-muted/30 bg-card/60',
                (disabled || isLimitReached) && 'opacity-60 cursor-not-allowed',
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
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-background',
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
