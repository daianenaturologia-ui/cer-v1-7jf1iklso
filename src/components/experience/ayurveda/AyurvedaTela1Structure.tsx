import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Eye, CheckCircle2, ChevronRight } from 'lucide-react'
import {
  AYV_TELA1_STRUCTURE_OPTIONS,
  AYV_TELA1_DURATION_OPTIONS,
} from '@/services/ayurvedaChapter1'
import { AvatarPresentation } from '@/services/avatarCompositor'

export interface AyurvedaTela1StructureProps {
  userPresentation?: AvatarPresentation
  structureChoice?: string
  secondaryStructureChoice?: string
  durationChoice?: string
  onSave: (data: {
    structureChoice?: string
    secondaryStructureChoice?: string
    durationChoice?: string
  }) => void
  disabled?: boolean
}

// Mapeamento dos 6 PNGs oficiais do Lote 0A
// As descrições humanas para acessibilidade (aria-label e alt) preservam a clareza de apresentação:
// "Figura feminina — estrutura leve ou estreita" e "Figura masculina — estrutura leve ou estreita"
const FIGURES_MAP = {
  female_light_narrow: {
    id: 'light_narrow',
    presentation: 'feminine',
    file: '/assets/ayurveda/ayv-feminino-leve.png',
    alt: 'Figura feminina — estrutura leve ou estreita',
    label: 'Estrutura leve ou estreita',
    accessibleLabel: 'Figura feminina — estrutura leve ou estreita',
  },
  female_intermediate: {
    id: 'intermediate',
    presentation: 'feminine',
    file: '/assets/ayurveda/ayv-feminino-intermediario.png',
    alt: 'Figura feminina — estrutura intermediária',
    label: 'Estrutura intermediária',
    accessibleLabel: 'Figura feminina — estrutura intermediária',
  },
  female_broad_solid: {
    id: 'broad_solid',
    presentation: 'feminine',
    file: '/assets/ayurveda/ayv-feminino-amplo.png',
    alt: 'Figura feminina — estrutura ampla ou sólida',
    label: 'Estrutura ampla ou sólida',
    accessibleLabel: 'Figura feminina — estrutura ampla ou sólida',
  },
  male_light_narrow: {
    id: 'light_narrow',
    presentation: 'masculine',
    file: '/assets/ayurveda/ayv-masculino-leve.png',
    alt: 'Figura masculina — estrutura leve ou estreita',
    label: 'Estrutura leve ou estreita',
    accessibleLabel: 'Figura masculina — estrutura leve ou estreita',
  },
  male_intermediate: {
    id: 'intermediate',
    presentation: 'masculine',
    file: '/assets/ayurveda/ayv-masculino-intermediario.png',
    alt: 'Figura masculina — estrutura intermediária',
    label: 'Estrutura intermediária',
    accessibleLabel: 'Figura masculina — estrutura intermediária',
  },
  male_broad_solid: {
    id: 'broad_solid',
    presentation: 'masculine',
    file: '/assets/ayurveda/ayv-masculino-amplo.png',
    alt: 'Figura masculina — estrutura ampla ou sólida',
    label: 'Estrutura ampla ou sólida',
    accessibleLabel: 'Figura masculina — estrutura ampla ou sólida',
  },
}

export const AyurvedaTela1Structure: React.FC<AyurvedaTela1StructureProps> = ({
  userPresentation = 'feminine',
  structureChoice: initialStructure,
  secondaryStructureChoice: initialSecondary,
  durationChoice: initialDuration,
  onSave,
  disabled = false,
}) => {
  const [selectedStructure, setSelectedStructure] = useState<string | undefined>(initialStructure)
  const [selectedSecondary, setSelectedSecondary] = useState<string | undefined>(initialSecondary)
  const [selectedDuration, setSelectedDuration] = useState<string | undefined>(initialDuration)
  const [showOtherFigures, setShowOtherFigures] = useState(false)
  const [twoSelectedStructures, setTwoSelectedStructures] = useState<string[]>(() => {
    const list: string[] = []
    if (initialStructure && initialStructure !== 'two_figures') list.push(initialStructure)
    if (initialSecondary) list.push(initialSecondary)
    return list.slice(0, 2)
  })

  // Figuras mostradas inicialmente conforme a apresentação do avatar, com opção de ver as outras
  const currentPresentationFigures =
    userPresentation === 'masculine'
      ? [FIGURES_MAP.male_light_narrow, FIGURES_MAP.male_intermediate, FIGURES_MAP.male_broad_solid]
      : [
          FIGURES_MAP.female_light_narrow,
          FIGURES_MAP.female_intermediate,
          FIGURES_MAP.female_broad_solid,
        ]

  const alternatePresentationFigures =
    userPresentation === 'masculine'
      ? [
          FIGURES_MAP.female_light_narrow,
          FIGURES_MAP.female_intermediate,
          FIGURES_MAP.female_broad_solid,
        ]
      : [FIGURES_MAP.male_light_narrow, FIGURES_MAP.male_intermediate, FIGURES_MAP.male_broad_solid]

  const displayedFigures = showOtherFigures
    ? [...currentPresentationFigures, ...alternatePresentationFigures]
    : currentPresentationFigures

  const handleStructureClick = (optId: string) => {
    if (disabled) return
    if (optId === 'two_figures') {
      setSelectedStructure('two_figures')
    } else {
      setSelectedStructure(optId)
      setSelectedSecondary(undefined)
      setTwoSelectedStructures([])
    }
  }

  const handleTwoFiguresToggle = (structureId: string) => {
    if (disabled) return
    let updated: string[] = []
    if (twoSelectedStructures.includes(structureId)) {
      updated = twoSelectedStructures.filter((s) => s !== structureId)
    } else {
      if (twoSelectedStructures.length >= 2) {
        updated = [twoSelectedStructures[1], structureId]
      } else {
        updated = [...twoSelectedStructures, structureId]
      }
    }
    setTwoSelectedStructures(updated)
    setSelectedStructure('two_figures')
    setSelectedSecondary(updated[1] || undefined)
  }

  const handleDurationClick = (durId: string) => {
    if (disabled) return
    setSelectedDuration(durId)
  }

  // Notificar pai quando houver alterações
  const triggerSave = (
    struct: string | undefined,
    sec: string | undefined,
    dur: string | undefined,
  ) => {
    onSave({
      structureChoice: struct,
      secondaryStructureChoice: sec,
      durationChoice: dur,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Pergunta Principal */}
      <div className="space-y-2">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
          Tela 1 de 5 • Estrutura habitual
        </Badge>
        <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
          Pensando na maior parte da sua vida adulta, especialmente antes de mudanças importantes de
          saúde, peso ou rotina, qual estrutura mais se aproxima do seu corpo?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Estas figuras servem como referência visual para a proporção óssea e compleição física
          habitual. Sexo, gênero ou aparência estética não definem sua resposta clínica.
        </p>
      </div>

      {/* Grid de Figuras Corporais Oficiais */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {displayedFigures.map((fig, idx) => {
            const isTwoActive =
              selectedStructure === 'two_figures' && twoSelectedStructures.includes(fig.id)
            const isSingleActive =
              selectedStructure === fig.id && selectedStructure !== 'two_figures'
            const isSelected = isTwoActive || isSingleActive

            return (
              <button
                key={`${fig.id}-${fig.presentation}-${idx}`}
                type="button"
                aria-disabled={disabled ? 'true' : undefined}
                aria-label={fig.accessibleLabel}
                aria-pressed={isSelected}
                tabIndex={disabled ? -1 : 0}
                onClick={() => {
                  if (disabled) return
                  if (selectedStructure === 'two_figures') {
                    handleTwoFiguresToggle(fig.id)
                    const updated = twoSelectedStructures.includes(fig.id)
                      ? twoSelectedStructures.filter((s) => s !== fig.id)
                      : twoSelectedStructures.length >= 2
                        ? [twoSelectedStructures[1], fig.id]
                        : [...twoSelectedStructures, fig.id]
                    triggerSave('two_figures', updated[1], selectedDuration)
                  } else {
                    handleStructureClick(fig.id)
                    triggerSave(fig.id, undefined, selectedDuration)
                  }
                }}
                className={`relative flex flex-col items-center p-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  disabled ? 'cursor-default select-text opacity-100' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-xs'
                    : disabled
                      ? 'border-border/70 bg-card'
                      : 'border-border/70 hover:border-border hover:bg-muted/30 bg-card'
                }`}
              >
                <div className="relative w-full aspect-2/3 max-h-56 overflow-hidden rounded-lg bg-muted/20 flex items-center justify-center mb-2">
                  <img
                    src={fig.file}
                    alt={fig.alt}
                    className="w-full h-full object-contain pointer-events-none opacity-100"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-sm z-10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-foreground text-center line-clamp-2">
                  {fig.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Botão de alternância / ver outras figuras */}
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOtherFigures((prev) => !prev)}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 font-normal"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showOtherFigures ? 'Ocultar outras figuras' : 'Ver as outras figuras'}</span>
          </Button>
        </div>
      </div>

      {/* Opções Textuais Complementares e Recusa/Dúvida */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-medium text-foreground block">
          Ou escolha uma destas alternativas:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AYV_TELA1_STRUCTURE_OPTIONS.filter(
            (o) => o.id !== 'light_narrow' && o.id !== 'intermediate' && o.id !== 'broad_solid',
          ).map((opt) => {
            const isSelected = selectedStructure === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                aria-disabled={disabled ? 'true' : undefined}
                aria-pressed={isSelected}
                tabIndex={disabled ? -1 : 0}
                onClick={() => {
                  if (disabled) return
                  handleStructureClick(opt.id)
                  triggerSave(
                    opt.id,
                    opt.id === 'two_figures' ? selectedSecondary : undefined,
                    selectedDuration,
                  )
                }}
                className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  disabled ? 'cursor-default select-text opacity-100' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground'
                    : disabled
                      ? 'border-border/60 text-muted-foreground bg-card'
                      : 'border-border/60 hover:border-border hover:bg-muted/20 text-muted-foreground bg-card'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>

        {/* Se selecionou 'Reconheço características de duas figuras' */}
        {selectedStructure === 'two_figures' && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 space-y-2 mt-2">
            <p className="font-medium">
              Selecione exatamente duas figuras corporais acima que melhor representam a combinação
              que você observa.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Selecionadas ({twoSelectedStructures.length}/2):{' '}
              {twoSelectedStructures.length > 0
                ? twoSelectedStructures
                    .map((s) => AYV_TELA1_STRUCTURE_OPTIONS.find((o) => o.id === s)?.label || s)
                    .join(' + ')
                : 'Nenhuma ainda'}
            </p>
          </div>
        )}
      </div>

      {/* Pergunta 2: Duração da estrutura habitual */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <h3 className="text-sm font-medium text-foreground">
          Essa estrutura acompanha você há quanto tempo?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AYV_TELA1_DURATION_OPTIONS.map((opt) => {
            const isSelected = selectedDuration === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                aria-disabled={disabled ? 'true' : undefined}
                aria-pressed={isSelected}
                tabIndex={disabled ? -1 : 0}
                onClick={() => {
                  if (disabled) return
                  handleDurationClick(opt.id)
                  triggerSave(selectedStructure, selectedSecondary, opt.id)
                }}
                className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  disabled ? 'cursor-default select-text opacity-100' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5 font-medium text-foreground'
                    : disabled
                      ? 'border-border/60 text-muted-foreground bg-card'
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
export default AyurvedaTela1Structure
