import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Sparkles, Info } from 'lucide-react'
import {
  getAyvC2P3Options,
  AYV_C2_P4_HUNGER_RETURN_OPTIONS,
  AYV_C2_P5_FOOD_DEMANDS_OPTIONS,
  AYV_C2_TEXTS,
  Chapter2TreatmentVariant,
} from '@/services/ayurvedaChapter2'

export interface AyurvedaC2Momento2DigestionProps {
  postMealChoices?: string[]
  hungerReturnChoice?: string
  foodDemandsChoices?: string[]
  treatmentVariant?: Chapter2TreatmentVariant
  onSavePostMeal: (choices: string[]) => void
  onSaveHungerReturn: (choice: string) => void
  onSaveFoodDemands: (choices: string[]) => void
  disabled?: boolean
}

export const AyurvedaC2Momento2Digestion: React.FC<AyurvedaC2Momento2DigestionProps> = ({
  postMealChoices: initialP3 = [],
  hungerReturnChoice: initialP4 = '',
  foodDemandsChoices: initialP5 = [],
  treatmentVariant = 'neutro',
  onSavePostMeal,
  onSaveHungerReturn,
  onSaveFoodDemands,
  disabled = false,
}) => {
  const [selectedP3, setSelectedP3] = useState<string[]>(initialP3)
  const [selectedP4, setSelectedP4] = useState<string>(initialP4)
  const [selectedP5, setSelectedP5] = useState<string[]>(initialP5)

  const p3Options = getAyvC2P3Options(treatmentVariant)

  // Toggle P3: até duas escolhas, 'dont_know' e 'refusal' exclusivos
  const handleToggleP3 = (optId: string) => {
    if (disabled) return
    const opt = p3Options.find((o) => o.id === optId)
    if (!opt) return

    let next: string[] = []
    if (opt.exclusive) {
      next = selectedP3.includes(optId) ? [] : [optId]
    } else {
      const cleanSelected = selectedP3.filter(
        (id) => !p3Options.find((o) => o.id === id)?.exclusive,
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
    setSelectedP3(next)
    onSavePostMeal(next)
  }

  // Seleção única P4
  const handleSelectP4 = (optId: string) => {
    if (disabled) return
    const next = selectedP4 === optId ? '' : optId
    setSelectedP4(next)
    onSaveHungerReturn(next)
  }

  // Seleção múltipla P5: 3 opções exclusivas
  const handleToggleP5 = (optId: string) => {
    if (disabled) return
    const opt = AYV_C2_P5_FOOD_DEMANDS_OPTIONS.find((o) => o.id === optId)
    if (!opt) return

    let next: string[] = []
    if (opt.exclusive) {
      next = selectedP5.includes(optId) ? [] : [optId]
    } else {
      const cleanSelected = selectedP5.filter(
        (id) => !AYV_C2_P5_FOOD_DEMANDS_OPTIONS.find((o) => o.id === id)?.exclusive,
      )
      if (cleanSelected.includes(optId)) {
        next = cleanSelected.filter((id) => id !== optId)
      } else {
        next = [...cleanSelected, optId]
      }
    }
    setSelectedP5(next)
    onSaveFoodDemands(next)
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Cabeçalho do Momento */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
            Momento 2 de 5 — Digestão
          </Badge>
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          O ritmo da sua digestão
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Como seu estômago e seu corpo respondem após as refeições habituais da maior parte da sua
          vida adulta.
        </p>
      </div>

      {/* BLOCO 1: Pergunta 3 — Depois de uma refeição habitual (até 2) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            3. Depois de uma refeição habitual, como você costuma se sentir?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">
            Até 2 escolhas • {selectedP3.length}/2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {p3Options.map((opt) => {
            const isSelected = selectedP3.includes(opt.id)

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleToggleP3(opt.id)}
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

      {/* BLOCO 2: Pergunta 4 — Retorno da fome (escolha única) */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            4. Quanto tempo o seu corpo costuma levar para pedir comida novamente?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">Escolha única</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P4_HUNGER_RETURN_OPTIONS.map((opt) => {
            const isSelected = selectedP4 === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleSelectP4(opt.id)}
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

      {/* BLOCO 3: Pergunta 5 — Alimentos exigentes (múltipla escolha) */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            5. Que tipos de alimento costumam exigir mais da sua digestão?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">Seleção múltipla</span>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>{AYV_C2_TEXTS.FOOD_DEMANDS_NOTE}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P5_FOOD_DEMANDS_OPTIONS.map((opt) => {
            const isSelected = selectedP5.includes(opt.id)

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleToggleP5(opt.id)}
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

export default AyurvedaC2Momento2Digestion
