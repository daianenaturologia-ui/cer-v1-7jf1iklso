import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Info } from 'lucide-react'
import { AYV_TELA2_SKIN_OPTIONS } from '@/services/ayurvedaChapter1'
import { getAyurvedaClinicalCardImage } from '@/services/ayurvedaAssetsRegistry'

export interface AyurvedaTela2SkinProps {
  skinChoices?: string[]
  onSave: (choices: string[]) => void
  disabled?: boolean
}

export const AyurvedaTela2Skin: React.FC<AyurvedaTela2SkinProps> = ({
  skinChoices: initialChoices = [],
  onSave,
  disabled = false,
}) => {
  const [selected, setSelected] = useState<string[]>(initialChoices)

  const handleToggle = (optId: string) => {
    if (disabled) return
    const opt = AYV_TELA2_SKIN_OPTIONS.find((o) => o.id === optId)
    if (!opt) return

    let next: string[] = []

    // Mutuamente exclusivos: 'dont_know' e 'refusal'
    if (opt.exclusive) {
      if (selected.includes(optId)) {
        next = []
      } else {
        next = [optId]
      }
    } else {
      // Se estava com alguma opção exclusiva, limpa-a
      const cleanSelected = selected.filter(
        (id) => !AYV_TELA2_SKIN_OPTIONS.find((o) => o.id === id)?.exclusive,
      )

      if (cleanSelected.includes(optId)) {
        next = cleanSelected.filter((id) => id !== optId)
      } else {
        if (cleanSelected.length >= 2) {
          // Máximo 2 escolhas: substitui a mais antiga
          next = [cleanSelected[1], optId]
        } else {
          next = [...cleanSelected, optId]
        }
      }
    }

    setSelected(next)
    onSave(next)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
          Tela 2 de 5 • Pele habitual
        </Badge>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          Quando você pensa na sua pele ao longo dos anos, como ela costuma se apresentar quando
          você está bem?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Escolha até duas características. Considere o funcionamento habitual, não apenas as
          últimas semanas.
        </p>
      </div>

      {/* Aviso informativo de acessibilidade / Fallback textual */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          Cartões clínicos textuais estruturados. A cor de pele do seu avatar é puramente estética e
          não compõe nem pré-seleciona sua resposta clínica.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
        {AYV_TELA2_SKIN_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.id)
          const cardImg = getAyurvedaClinicalCardImage('skin', opt.id)

          return (
            <button
              key={opt.id}
              type="button"
              aria-disabled={disabled ? 'true' : undefined}
              aria-pressed={isSelected}
              tabIndex={disabled ? -1 : 0}
              onClick={() => {
                if (disabled) return
                handleToggle(opt.id)
              }}
              className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                disabled ? 'cursor-default select-text opacity-100' : 'cursor-pointer'
              } ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground shadow-xs'
                  : disabled
                    ? 'border-border/60 text-muted-foreground bg-card opacity-100'
                    : 'border-border/60 hover:border-border hover:bg-muted/20 text-muted-foreground bg-card'
              }`}
            >
              {cardImg && (
                <div className="w-full aspect-square max-h-44 rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center shrink-0 border border-border/40">
                  <img
                    src={cardImg}
                    alt={opt.label}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-100"
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-2 w-full flex-1">
                <div className="space-y-0.5">
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
              </div>
            </button>
          )
        })}
      </div>

      <div className="text-right text-[11px] text-muted-foreground pt-1">
        Selecionadas: {selected.length}/2
      </div>
    </div>
  )
}
export default AyurvedaTela2Skin
