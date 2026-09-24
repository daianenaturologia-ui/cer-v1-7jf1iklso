import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import { AYV_TELA4_TEMPERATURE_OPTIONS } from '@/services/ayurvedaChapter1'

export interface AyurvedaTela4TemperatureProps {
  temperatureChoice?: string
  onSave: (choice: string) => void
  disabled?: boolean
}

export const AyurvedaTela4Temperature: React.FC<AyurvedaTela4TemperatureProps> = ({
  temperatureChoice: initialChoice,
  onSave,
  disabled = false,
}) => {
  const [selected, setSelected] = useState<string | undefined>(initialChoice)

  const handleSelect = (optId: string) => {
    if (disabled) return
    setSelected(optId)
    onSave(optId)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
          Tela 4 de 5 • Temperatura habitual
        </Badge>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          Ao longo dos anos, como seu corpo costuma lidar com a temperatura?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Selecione a opção que melhor descreve sua relação habitual com frio e calor.
        </p>
      </div>

      <div className="space-y-2.5 pt-2">
        {AYV_TELA4_TEMPERATURE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => handleSelect(opt.id)}
              className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground shadow-xs'
                  : 'border-border/60 hover:border-border hover:bg-muted/20 text-muted-foreground bg-card'
              }`}
            >
              <span className="leading-relaxed text-foreground">{opt.label}</span>
              <div className="shrink-0">
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border/80" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
export default AyurvedaTela4Temperature
