import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Zap, ShieldCheck } from 'lucide-react'
import {
  AYV_C2_P10_ENERGY_OPTIONS,
  AYV_C2_P11_BODY_PACE_OPTIONS,
  AYV_C2_P12_CONFIDENCE_OPTIONS,
} from '@/services/ayurvedaChapter2'

export interface AyurvedaC2Momento5EnergyProps {
  energyDistributionChoice?: string
  bodyPaceChoice?: string
  historicalConfidenceChoice?: string
  onSaveEnergyDistribution: (choice: string) => void
  onSaveBodyPace: (choice: string) => void
  onSaveHistoricalConfidence: (choice: string) => void
  disabled?: boolean
}

export const AyurvedaC2Momento5Energy: React.FC<AyurvedaC2Momento5EnergyProps> = ({
  energyDistributionChoice: initialP10 = '',
  bodyPaceChoice: initialP11 = '',
  historicalConfidenceChoice: initialP12 = '',
  onSaveEnergyDistribution,
  onSaveBodyPace,
  onSaveHistoricalConfidence,
  disabled = false,
}) => {
  const [selectedP10, setSelectedP10] = useState<string>(initialP10)
  const [selectedP11, setSelectedP11] = useState<string>(initialP11)
  const [selectedP12, setSelectedP12] = useState<string>(initialP12)

  const handleSelectP10 = (optId: string) => {
    if (disabled) return
    const next = selectedP10 === optId ? '' : optId
    setSelectedP10(next)
    onSaveEnergyDistribution(next)
  }

  const handleSelectP11 = (optId: string) => {
    if (disabled) return
    const next = selectedP11 === optId ? '' : optId
    setSelectedP11(next)
    onSaveBodyPace(next)
  }

  const handleSelectP12 = (optId: string) => {
    if (disabled) return
    const next = selectedP12 === optId ? '' : optId
    setSelectedP12(next)
    onSaveHistoricalConfidence(next)
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Cabeçalho do Momento */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
            Momento 5 de 5 — Energia
          </Badge>
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          O ritmo da sua energia e do seu ritmo corporal
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Como sua vitalidade se distribui durante o dia, seu ritmo de ação e a segurança da sua
          lembrança sobre esses padrões.
        </p>
      </div>

      {/* BLOCO 1: Pergunta 10 — Distribuição de energia (escolha única) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            10. Como a sua energia costuma se distribuir durante o dia?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">Escolha única</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P10_ENERGY_OPTIONS.map((opt) => {
            const isSelected = selectedP10 === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleSelectP10(opt.id)}
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

      {/* BLOCO 2: Pergunta 11 — Ritmo corporal (escolha única) */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            11. Qual ritmo corporal mais se aproxima de você?
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">Escolha única</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P11_BODY_PACE_OPTIONS.map((opt) => {
            const isSelected = selectedP11 === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleSelectP11(opt.id)}
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

      {/* BLOCO 3: Pergunta 12 — Confiança histórica (segurança temporal) */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              12. Pensando em tudo o que respondeu, essas características representam:
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Escolha única</span>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Esta resposta registra a segurança histórica da memória sobre este capítulo e auxilia a
          compreensão do contexto pelo profissional.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AYV_C2_P12_CONFIDENCE_OPTIONS.map((opt) => {
            const isSelected = selectedP12 === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={disabled ? 'true' : undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleSelectP12(opt.id)}
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

export default AyurvedaC2Momento5Energy
