import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Activity } from 'lucide-react'
import {
  AYV_C2_P6_BOWEL_RHYTHM_OPTIONS,
  AYV_C2_P7_STOOL_OPTIONS,
} from '@/services/ayurvedaChapter2'

export interface AyurvedaC2Momento3EliminationProps {
  bowelRhythmChoice?: string
  stoolPatternChoices?: string[]
  onSaveBowelRhythm: (choice: string) => void
  onSaveStoolPattern: (choices: string[]) => void
  disabled?: boolean
}

export const AyurvedaC2Momento3Elimination: React.FC<AyurvedaC2Momento3EliminationProps> = ({
  bowelRhythmChoice: initialP6 = '',
  stoolPatternChoices: initialP7 = [],
  onSaveBowelRhythm,
  onSaveStoolPattern,
  disabled = false,
}) => {
  const [selectedP6, setSelectedP6] = useState<string>(initialP6)
  const [selectedP7, setSelectedP7] = useState<string[]>(initialP7)

  // Seleção única P6
  const handleSelectP6 = (optId: string) => {
    if (disabled) return
    const next = selectedP6 === optId ? '' : optId
    setSelectedP6(next)
    onSaveBowelRhythm(next)
  }

  // Toggle P7: até 2 escolhas, 'dont_know' e 'refusal' exclusivos
  const handleToggleP7 = (optId: string) => {
    if (disabled) return
    const opt = AYV_C2_P7_STOOL_OPTIONS.find((o) => o.id === optId)
    if (!opt) return

    let next: string[] = []
    if (opt.exclusive) {
      next = selectedP7.includes(optId) ? [] : [optId]
    } else {
      const cleanSelected = selectedP7.filter(
        (id) => !AYV_C2_P7_STOOL_OPTIONS.find((o) => o.id === id)?.exclusive,
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
    setSelectedP7(next)
    onSaveStoolPattern(next)
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Cabeçalho do Momento */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
            Momento 3 de 5 — Eliminação
          </Badge>
          <Activity className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          O ritmo da sua eliminação intestinal
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A frequência e a forma das evacuações revelam o ritmo de esvaziamento e trânsito do seu
          corpo. Lembre-se do seu padrão na maior parte da vida adulta.
        </p>
      </div>

      {/* BLOCO 1: Pergunta 6 — Ritmo do intestino (escolha única) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            6. Como o seu intestino costuma funcionar?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">Escolha única</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P6_BOWEL_RHYTHM_OPTIONS.map((opt) => {
            const isSelected = selectedP6 === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleSelectP6(opt.id)}
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

      {/* BLOCO 2: Pergunta 7 — Apresentação das fezes (até 2 escolhas) */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            7. Como as fezes costumam se apresentar?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">
            Até 2 escolhas • {selectedP7.length}/2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P7_STOOL_OPTIONS.map((opt) => {
            const isSelected = selectedP7.includes(opt.id)

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleToggleP7(opt.id)}
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

export default AyurvedaC2Momento3Elimination
