import React from 'react'
import { Calendar, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TimelineMilestone {
  id: string
  label: string
  defaultNote?: string
}

export interface TimelineConfig {
  milestones: TimelineMilestone[]
}

export interface TimelineItemValue {
  milestoneId: string
  selected: boolean
  note?: string
}

export interface TimelineProps {
  config: TimelineConfig
  value?: TimelineItemValue[]
  onChange: (value: TimelineItemValue[]) => void
  disabled?: boolean
}

export const Timeline: React.FC<TimelineProps> = ({
  config,
  value,
  onChange,
  disabled = false,
}) => {
  const milestones = config?.milestones || []

  // Inicializa o valor se ainda não foi salvo
  const currentValues: TimelineItemValue[] =
    Array.isArray(value) && value.length > 0
      ? value
      : milestones.map((m) => ({
          milestoneId: m.id,
          selected: false,
          note: m.defaultNote || '',
        }))

  const toggleMilestone = (milestoneId: string) => {
    if (disabled) return
    const updated = currentValues.map((item) =>
      item.milestoneId === milestoneId ? { ...item, selected: !item.selected } : item,
    )
    onChange(updated)
  }

  const updateNote = (milestoneId: string, note: string) => {
    if (disabled) return
    const updated = currentValues.map((item) =>
      item.milestoneId === milestoneId ? { ...item, note } : item,
    )
    onChange(updated)
  }

  return (
    <div className="relative pl-6 space-y-6 max-w-xl mx-auto before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
      {milestones.map((m) => {
        const itemVal = currentValues.find((v) => v.milestoneId === m.id) || {
          milestoneId: m.id,
          selected: false,
          note: m.defaultNote || '',
        }

        return (
          <div key={m.id} className="relative group">
            {/* Ponto na linha temporal */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => toggleMilestone(m.id)}
              className={cn(
                'absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center',
                itemVal.selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/40 bg-background hover:border-primary',
                disabled && 'cursor-not-allowed opacity-60',
              )}
              aria-label={`Marcar marco ${m.label}`}
            >
              {itemVal.selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </button>

            {/* Conteúdo do Marco */}
            <div
              className={cn(
                'p-4 rounded-xl border transition-all duration-200',
                itemVal.selected
                  ? 'border-primary/60 bg-primary/5 shadow-xs'
                  : 'border-border/70 bg-card/60 hover:bg-muted/30',
              )}
            >
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="font-medium text-sm text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{m.label}</span>
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleMilestone(m.id)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
                >
                  {itemVal.selected ? 'Destacar' : 'Destacar marco'}
                </button>
              </div>

              <input
                type="text"
                disabled={disabled}
                placeholder="Adicione um breve detalhe sobre este marco (opcional)..."
                value={itemVal.note || ''}
                onChange={(e) => updateNote(m.id, e.target.value)}
                className="w-full mt-2 text-xs bg-background/60 border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
