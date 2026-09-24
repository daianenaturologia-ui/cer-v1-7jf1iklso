import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import {
  AYV_TELA5_THIRST_OPTIONS,
  AYV_TELA5_DRINK_TEMP_OPTIONS,
  AYV_TELA5_SWEAT_OPTIONS,
} from '@/services/ayurvedaChapter1'

export interface AyurvedaTela5HabitsProps {
  thirstChoice?: string
  drinkTemperatureChoice?: string
  sweatChoice?: string
  onSave: (data: {
    thirstChoice?: string
    drinkTemperatureChoice?: string
    sweatChoice?: string
  }) => void
  disabled?: boolean
}

export const AyurvedaTela5Habits: React.FC<AyurvedaTela5HabitsProps> = ({
  thirstChoice: initialThirst,
  drinkTemperatureChoice: initialDrinkTemp,
  sweatChoice: initialSweat,
  onSave,
  disabled = false,
}) => {
  const [thirst, setThirst] = useState<string | undefined>(initialThirst)
  const [drinkTemp, setDrinkTemp] = useState<string | undefined>(initialDrinkTemp)
  const [sweat, setSweat] = useState<string | undefined>(initialSweat)

  const handleSelectThirst = (val: string) => {
    if (disabled) return
    setThirst(val)
    onSave({ thirstChoice: val, drinkTemperatureChoice: drinkTemp, sweatChoice: sweat })
  }

  const handleSelectDrinkTemp = (val: string) => {
    if (disabled) return
    setDrinkTemp(val)
    onSave({ thirstChoice: thirst, drinkTemperatureChoice: val, sweatChoice: sweat })
  }

  const handleSelectSweat = (val: string) => {
    if (disabled) return
    setSweat(val)
    onSave({ thirstChoice: thirst, drinkTemperatureChoice: drinkTemp, sweatChoice: val })
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
          Tela 5 de 5 • Sede, bebida e transpiração
        </Badge>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          Sede, temperatura de bebida e transpiração habitual
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Três blocos independentes que ajudam a entender como seu corpo lida com líquidos, calor
          interno e hidratação habitual.
        </p>
      </div>

      {/* BLOCO A: Sede */}
      <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
        <div className="space-y-1">
          <Badge variant="secondary" className="text-[10px] font-mono">
            Bloco A
          </Badge>
          <h3 className="text-sm font-medium text-foreground">
            Como costuma ser a sua sede quando você está bem?
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AYV_TELA5_THIRST_OPTIONS.map((opt) => {
            const isSelected = thirst === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => handleSelectThirst(opt.id)}
                className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground'
                    : 'border-border/60 hover:border-border hover:bg-muted/20 text-muted-foreground bg-card'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* BLOCO B: Conforto Térmico da Bebida */}
      <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
        <div className="space-y-1">
          <Badge variant="secondary" className="text-[10px] font-mono">
            Bloco B
          </Badge>
          <h3 className="text-sm font-medium text-foreground">
            Qual temperatura de bebida costuma ser mais confortável para você?
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AYV_TELA5_DRINK_TEMP_OPTIONS.map((opt) => {
            const isSelected = drinkTemp === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => handleSelectDrinkTemp(opt.id)}
                className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground'
                    : 'border-border/60 hover:border-border hover:bg-muted/20 text-muted-foreground bg-card'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* BLOCO C: Transpiração */}
      <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
        <div className="space-y-1">
          <Badge variant="secondary" className="text-[10px] font-mono">
            Bloco C
          </Badge>
          <h3 className="text-sm font-medium text-foreground">
            Como seu corpo costuma transpirar em situações comuns?
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AYV_TELA5_SWEAT_OPTIONS.map((opt) => {
            const isSelected = sweat === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => handleSelectSweat(opt.id)}
                className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground'
                    : 'border-border/60 hover:border-border hover:bg-muted/20 text-muted-foreground bg-card'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
export default AyurvedaTela5Habits
