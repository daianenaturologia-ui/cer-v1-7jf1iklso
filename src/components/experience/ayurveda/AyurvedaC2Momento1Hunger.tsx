import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, UtensilsCrossed, AlertCircle } from 'lucide-react'
import {
  AYV_C2_P1_HUNGER_OPTIONS,
  getAyvC2P2Options,
  Chapter2TreatmentVariant,
} from '@/services/ayurvedaChapter2'

export interface AyurvedaC2Momento1HungerProps {
  hungerPatternChoices?: string[]
  delayedMealChoices?: string[]
  treatmentVariant?: Chapter2TreatmentVariant
  onSaveHungerPattern: (choices: string[]) => void
  onSaveDelayedMeal: (choices: string[]) => void
  disabled?: boolean
}

export const AyurvedaC2Momento1Hunger: React.FC<AyurvedaC2Momento1HungerProps> = ({
  hungerPatternChoices: initialP1 = [],
  delayedMealChoices: initialP2 = [],
  treatmentVariant = 'neutro',
  onSaveHungerPattern,
  onSaveDelayedMeal,
  disabled = false,
}) => {
  const [selectedP1, setSelectedP1] = useState<string[]>(initialP1)
  const [selectedP2, setSelectedP2] = useState<string[]>(initialP2)

  const p2Options = getAyvC2P2Options(treatmentVariant)

  // Toggle Pergunta 1: até duas escolhas, 'dont_know' e 'refusal' exclusivos
  const handleToggleP1 = (optId: string) => {
    if (disabled) return
    const opt = AYV_C2_P1_HUNGER_OPTIONS.find((o) => o.id === optId)
    if (!opt) return

    let next: string[] = []
    if (opt.exclusive) {
      next = selectedP1.includes(optId) ? [] : [optId]
    } else {
      const cleanSelected = selectedP1.filter(
        (id) => !AYV_C2_P1_HUNGER_OPTIONS.find((o) => o.id === id)?.exclusive,
      )
      if (cleanSelected.includes(optId)) {
        next = cleanSelected.filter((id) => id !== optId)
      } else {
        if (cleanSelected.length >= 2) {
          next = [cleanSelected[1], optId]
        } else {
          next = [...cleanSelected, optId]
        }
      }
    }
    setSelectedP1(next)
    onSaveHungerPattern(next)
  }

  // Toggle Pergunta 2: até duas escolhas, 'dont_know' e 'refusal' exclusivos
  const handleToggleP2 = (optId: string) => {
    if (disabled) return
    const opt = p2Options.find((o) => o.id === optId)
    if (!opt) return

    let next: string[] = []
    if (opt.exclusive) {
      next = selectedP2.includes(optId) ? [] : [optId]
    } else {
      const cleanSelected = selectedP2.filter(
        (id) => !p2Options.find((o) => o.id === id)?.exclusive,
      )
      if (cleanSelected.includes(optId)) {
        next = cleanSelected.filter((id) => id !== optId)
      } else {
        if (cleanSelected.length >= 2) {
          next = [cleanSelected[1], optId]
        } else {
          next = [...cleanSelected, optId]
        }
      }
    }
    setSelectedP2(next)
    onSaveDelayedMeal(next)
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Cabeçalho do Momento */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
            Momento 1 de 5 — Fome
          </Badge>
          <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          O ritmo da sua fome
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Pense no seu padrão habitual na maior parte da vida adulta, antes de períodos atípicos ou
          mudanças recentes. Em cada pergunta, você pode escolher até duas opções.
        </p>
      </div>

      {/* BLOCO 1: Pergunta 1 — Como a sua fome costuma funcionar? */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            1. Como a sua fome costuma funcionar?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">
            Até 2 escolhas • {selectedP1.length}/2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P1_HUNGER_OPTIONS.map((opt) => {
            const isSelected = selectedP1.includes(opt.id)

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleToggleP1(opt.id)}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  disabled ? 'cursor-default select-text opacity-100' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground shadow-xs'
                    : disabled
                      ? 'border-border/60 text-muted-foreground bg-card opacity-100'
                      : 'border-border/60 hover:border-border hover:bg-muted/20 text-muted-foreground bg-card'
                }`}
              >
                <div className="space-y-0.5 flex-1">
                  <span className="block text-foreground leading-relaxed">{opt.label}</span>
                  {opt.exclusive && (
                    <span className="text-[10px] text-muted-foreground italic block">
                      (Opção exclusiva)
                    </span>
                  )}
                </div>
                <div className="shrink-0 mt-0.5">
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border/80 shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* BLOCO 2: Pergunta 2 — O que costuma acontecer quando você demora para comer? */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            2. O que costuma acontecer quando você demora para comer?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">
            Até 2 escolhas • {selectedP2.length}/2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {p2Options.map((opt) => {
            const isSelected = selectedP2.includes(opt.id)

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleToggleP2(opt.id)}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  disabled ? 'cursor-default select-text opacity-100' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground shadow-xs'
                    : disabled
                      ? 'border-border/60 text-muted-foreground bg-card opacity-100'
                      : 'border-border/60 hover:border-border hover:bg-muted/20 text-muted-foreground bg-card'
                }`}
              >
                <div className="space-y-0.5 flex-1">
                  <span className="block text-foreground leading-relaxed">{opt.label}</span>
                  {opt.exclusive && (
                    <span className="text-[10px] text-muted-foreground italic block">
                      (Opção exclusiva)
                    </span>
                  )}
                </div>
                <div className="shrink-0 mt-0.5">
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border/80 shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AyurvedaC2Momento1Hunger
