import React from 'react'
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface OrderingItem {
  id: string
  label: string
}

export interface OrderingConfig {
  items: OrderingItem[]
}

export interface OrderingProps {
  config: OrderingConfig
  value?: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export const Ordering: React.FC<OrderingProps> = ({
  config,
  value,
  onChange,
  disabled = false,
}) => {
  const configuredItems = config?.items || []

  // Se o valor ainda não foi definido, inicializa com a ordem padrão dos IDs
  const currentOrder =
    Array.isArray(value) && value.length === configuredItems.length
      ? value
      : configuredItems.map((i) => i.id)

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (disabled) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return

    const newOrder = [...currentOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp

    onChange(newOrder)
  }

  return (
    <div className="space-y-2.5 max-w-xl mx-auto">
      {currentOrder.map((id, index) => {
        const item = configuredItems.find((i) => i.id === id) || { id, label: id }
        const isFirst = index === 0
        const isLast = index === currentOrder.length - 1

        return (
          <div
            key={id}
            className={cn(
              'flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/70 bg-card/70 transition-all duration-200',
              disabled && 'opacity-60',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isFirst}
                onClick={() => moveItem(index, 'up')}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label={`Mover ${item.label} para cima`}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isLast}
                onClick={() => moveItem(index, 'down')}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label={`Mover ${item.label} para baixo`}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
