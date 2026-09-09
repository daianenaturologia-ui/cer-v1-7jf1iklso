import React from 'react'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ScenarioOption {
  id: string
  title: string
  detail?: string
}

export interface ScenarioChoiceConfig {
  scenarioDescription: string
  options: ScenarioOption[]
}

export interface ScenarioChoiceProps {
  config: ScenarioChoiceConfig
  value?: string | null
  onChange: (value: string) => void
  disabled?: boolean
}

export const ScenarioChoice: React.FC<ScenarioChoiceProps> = ({
  config,
  value,
  onChange,
  disabled = false,
}) => {
  const options = config?.options || []

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Descrição do Cenário / Situação Cotidiana */}
      {config?.scenarioDescription && (
        <div className="p-4 rounded-xl bg-muted/30 border border-border/70 text-sm leading-relaxed text-foreground/90 font-serif italic">
          “{config.scenarioDescription}”
        </div>
      )}

      {/* Opções de Resposta Espontânea */}
      <div className="space-y-2.5">
        {options.map((opt) => {
          const isSelected = value === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={cn(
                'w-full text-left transition-all duration-200 rounded-xl p-4 border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm'
                  : 'border-border/70 hover:border-border hover:bg-muted/30 bg-card/60',
                disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-sm text-foreground leading-snug">{opt.title}</p>
                  {opt.detail && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{opt.detail}</p>
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
    </div>
  )
}
