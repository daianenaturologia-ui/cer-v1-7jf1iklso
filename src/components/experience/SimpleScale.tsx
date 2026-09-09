import React from 'react'
import { cn } from '@/lib/utils'

export interface SimpleScaleConfig {
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  leftAnchor?: string
  centerAnchor?: string
  rightAnchor?: string
}

export interface SimpleScaleProps {
  config: SimpleScaleConfig
  value?: number | null
  onChange: (value: number) => void
  disabled?: boolean
}

export const SimpleScale: React.FC<SimpleScaleProps> = ({
  config,
  value,
  onChange,
  disabled = false,
}) => {
  const min = config?.min ?? 1
  const max = config?.max ?? 5
  const step = config?.step ?? 1

  const currentValue = typeof value === 'number' ? value : null

  const stepsCount = Math.round((max - min) / step) + 1
  const stepValues = Array.from({ length: stepsCount }, (_, i) => min + i * step)

  return (
    <div className="space-y-6 py-4">
      {/* Botões de Escolha Discreta */}
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {stepValues.map((v) => {
          const isSelected = currentValue === v
          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => onChange(v)}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center font-medium text-sm transition-all duration-200 border',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm scale-105 ring-2 ring-primary/20'
                  : 'border-border/70 bg-card hover:bg-muted/40 text-foreground',
                disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              {v}
            </button>
          )
        })}
      </div>

      {/* Slider Visual de Ajuste Fino */}
      <div className="max-w-md mx-auto px-2 space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue ?? Math.round((min + max) / 2)}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-opacity',
            currentValue === null
              ? 'opacity-40 accent-muted-foreground bg-muted/60'
              : 'opacity-100 accent-primary bg-muted',
          )}
        />
        {currentValue === null && (
          <p className="text-[11px] text-muted-foreground/80 text-center italic">
            Nenhum valor selecionado ainda. Clique em um número ou mova a barra para definir seu
            ritmo.
          </p>
        )}
      </div>

      {/* Âncoras Textuais Configuráveis */}
      <div className="flex items-start justify-between text-xs text-muted-foreground max-w-md mx-auto px-1 gap-2">
        <span className="w-1/3 text-left leading-relaxed">{config?.leftAnchor || 'Início'}</span>
        {config?.centerAnchor && (
          <span className="w-1/3 text-center leading-relaxed font-medium text-foreground/80">
            {config.centerAnchor}
          </span>
        )}
        <span className="w-1/3 text-right leading-relaxed">{config?.rightAnchor || 'Fim'}</span>
      </div>
    </div>
  )
}
