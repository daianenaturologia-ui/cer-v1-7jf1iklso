import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Moon } from 'lucide-react'
import { AYV_C2_P8_SLEEP_OPTIONS, AYV_C2_P9_WAKING_OPTIONS } from '@/services/ayurvedaChapter2'

export interface AyurvedaC2Momento4SleepProps {
  sleepPatternChoices?: string[]
  wakingChoice?: string
  onSaveSleepPattern: (choices: string[]) => void
  onSaveWaking: (choice: string) => void
  disabled?: boolean
}

export const AyurvedaC2Momento4Sleep: React.FC<AyurvedaC2Momento4SleepProps> = ({
  sleepPatternChoices: initialP8 = [],
  wakingChoice: initialP9 = '',
  onSaveSleepPattern,
  onSaveWaking,
  disabled = false,
}) => {
  const [selectedP8, setSelectedP8] = useState<string[]>(initialP8)
  const [selectedP9, setSelectedP9] = useState<string>(initialP9)

  // Toggle P8: até 2 escolhas, 'dont_know' e 'refusal' exclusivos
  const handleToggleP8 = (optId: string) => {
    if (disabled) return
    const opt = AYV_C2_P8_SLEEP_OPTIONS.find((o) => o.id === optId)
    if (!opt) return

    let next: string[] = []
    if (opt.exclusive) {
      next = selectedP8.includes(optId) ? [] : [optId]
    } else {
      const cleanSelected = selectedP8.filter(
        (id) => !AYV_C2_P8_SLEEP_OPTIONS.find((o) => o.id === id)?.exclusive,
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
    setSelectedP8(next)
    onSaveSleepPattern(next)
  }

  // Seleção única P9
  const handleSelectP9 = (optId: string) => {
    if (disabled) return
    const next = selectedP9 === optId ? '' : optId
    setSelectedP9(next)
    onSaveWaking(next)
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Cabeçalho do Momento */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
            Momento 4 de 5 — Sono
          </Badge>
          <Moon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          O ritmo do seu sono e do despertar
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Como seu corpo adormece, sustenta o repouso e reage ao acordar na maior parte da sua vida
          adulta.
        </p>
      </div>

      {/* BLOCO 1: Pergunta 8 — Como o seu sono costuma acontecer? (até 2 escolhas) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            8. Como o seu sono costuma acontecer?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">
            Até 2 escolhas • {selectedP8.length}/2
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P8_SLEEP_OPTIONS.map((opt) => {
            const isSelected = selectedP8.includes(opt.id)

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleToggleP8(opt.id)}
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

      {/* BLOCO 2: Pergunta 9 — Como você costuma acordar? (escolha única) */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">9. Como você costuma acordar?</h3>
          <span className="text-[11px] text-muted-foreground font-mono">Escolha única</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P9_WAKING_OPTIONS.map((opt) => {
            const isSelected = selectedP9 === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleSelectP9(opt.id)}
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
    </div>
  )
}

export default AyurvedaC2Momento4Sleep
