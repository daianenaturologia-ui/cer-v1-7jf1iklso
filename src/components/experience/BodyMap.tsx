import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BodyRegion {
  id: string
  label: string
}

export interface BodyMapConfig {
  regions: BodyRegion[]
  maxSelect?: number
}

export interface BodyMapProps {
  config: BodyMapConfig
  value?: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export const BodyMap: React.FC<BodyMapProps> = ({
  config,
  value = [],
  onChange,
  disabled = false,
}) => {
  const regions = config?.regions || []
  const maxSelect = config?.maxSelect || regions.length
  const currentSelection = Array.isArray(value) ? value : []

  const toggleRegion = (id: string) => {
    if (disabled) return

    if (currentSelection.includes(id)) {
      onChange(currentSelection.filter((item) => item !== id))
    } else {
      if (currentSelection.length < maxSelect) {
        onChange([...currentSelection, id])
      }
    }
  }

  // Região ARIA informativa para leitores de tela
  const ariaStatusMessage = `${currentSelection.length} de ${maxSelect} ${
    maxSelect === 1 ? 'região selecionada' : 'regiões selecionadas'
  }.`

  return (
    <div
      className="flex flex-col md:flex-row items-center gap-6 max-w-2xl mx-auto py-2 motion-reduce:transition-none"
      role="group"
      aria-label="Mapa de Localização Corporal"
    >
      {/* Região ao vivo para Screen Readers */}
      <div className="sr-only" aria-live="polite" role="status">
        {ariaStatusMessage}
      </div>

      {/* Representação Corporal Visual Minimalista (SVG Acolhedor com áreas interativas sincronizadas) */}
      <div
        className="relative w-48 h-72 flex items-center justify-center p-3 bg-muted/20 border border-border/60 rounded-2xl shrink-0"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 160"
          className="w-full h-full text-muted-foreground/30 stroke-current motion-reduce:transition-none"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Cabeça */}
          <circle
            cx="50"
            cy="22"
            r="14"
            className={cn(
              currentSelection.some((id) => id.includes('head'))
                ? 'fill-primary/20 stroke-primary'
                : 'fill-transparent',
            )}
          />
          {/* Tronco */}
          <path
            d="M35 40 L65 40 L60 85 L40 85 Z"
            className={cn(
              currentSelection.some(
                (id) => id.includes('chest') || id.includes('abdomen') || id.includes('back'),
              )
                ? 'fill-primary/20 stroke-primary'
                : 'fill-transparent',
            )}
          />
          {/* Braços */}
          <path
            d="M35 42 L20 80 L16 100"
            className={cn(
              currentSelection.some((id) => id.includes('arm') || id.includes('neck'))
                ? 'stroke-primary'
                : '',
            )}
          />
          <path
            d="M65 42 L80 80 L84 100"
            className={cn(
              currentSelection.some((id) => id.includes('arm') || id.includes('neck'))
                ? 'stroke-primary'
                : '',
            )}
          />
          {/* Pernas */}
          <path
            d="M42 85 L38 145 L32 150"
            className={cn(
              currentSelection.some((id) => id.includes('leg') || id.includes('lumbar'))
                ? 'stroke-primary'
                : '',
            )}
          />
          <path
            d="M58 85 L62 145 L68 150"
            className={cn(
              currentSelection.some((id) => id.includes('leg') || id.includes('lumbar'))
                ? 'stroke-primary'
                : '',
            )}
          />
        </svg>

        {/* Indicadores Visuais sobre o mapa */}
        <div className="absolute inset-0 flex flex-col justify-between py-6 items-center pointer-events-none">
          <span className="text-[10px] text-muted-foreground font-mono bg-background/80 px-2 py-0.5 rounded-full border border-border/40">
            {currentSelection.length} {currentSelection.length === 1 ? 'região' : 'regiões'}
          </span>
        </div>
      </div>

      {/* Regiões Selecionáveis Configuradas (Lista Estruturada 100% acessível via Teclado) */}
      <div className="flex-1 w-full space-y-2">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs text-muted-foreground">
            Selecione as regiões na lista ou teclado:
          </span>
          {maxSelect < regions.length && (
            <span className="text-xs text-muted-foreground">Máximo: {maxSelect}</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="list">
          {regions.map((reg) => {
            const isSelected = currentSelection.includes(reg.id)
            const isLimitReached = !isSelected && currentSelection.length >= maxSelect

            return (
              <button
                key={reg.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${reg.label}: ${isSelected ? 'selecionada' : 'não selecionada'}`}
                disabled={disabled || isLimitReached}
                onClick={() => toggleRegion(reg.id)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30 shadow-xs'
                    : 'border-border/70 hover:border-border hover:bg-muted/40 text-foreground bg-card/60',
                  (disabled || isLimitReached) && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span>{reg.label}</span>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-primary font-normal">
                      (marcado)
                    </span>
                  )}
                </span>
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-background',
                  )}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
