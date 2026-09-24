import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Edit3 } from 'lucide-react'
import { PersonRecord } from '@/types/cer'
import {
  renderAvatarToCanvas,
  SKIN_TONES,
  HAIR_COLORS,
  AvatarConfiguration,
} from '@/services/avatarCompositor'

export interface AvatarRepresentationCardProps {
  person: PersonRecord | null
  onEdit: () => void
}

export const AvatarRepresentationCard: React.FC<AvatarRepresentationCardProps> = ({
  person,
  onEdit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [renderError, setRenderError] = useState(false)

  const isConfigured = Boolean(
    person?.avatar_presentation &&
    person?.avatar_skin_tone &&
    person?.avatar_hair_color &&
    person?.avatar_customization_status === 'completed',
  )

  const presentation = person?.avatar_presentation || 'feminine'
  const skinTone = person?.avatar_skin_tone || 'skin_02'
  const hairColor = person?.avatar_hair_color || 'hair_dark_brown'

  useEffect(() => {
    let active = true
    const render = async () => {
      if (!canvasRef.current) return
      setRenderError(false)
      const config: AvatarConfiguration = {
        presentation,
        structure: 'intermediate',
        skinTone,
        hairColor,
      }
      try {
        await renderAvatarToCanvas(config, canvasRef.current)
      } catch (e) {
        if (active) setRenderError(true)
      }
    }
    render()
    return () => {
      active = false
    }
  }, [presentation, skinTone, hairColor])

  const skinIdx = SKIN_TONES.findIndex((s) => s.id === skinTone) + 1
  const hairLabel =
    hairColor === 'hair_dark_brown'
      ? 'Castanho-escuro'
      : hairColor === 'hair_light_brown'
        ? 'Castanho-claro'
        : hairColor === 'hair_gray_white'
          ? 'Grisalho ou branco'
          : HAIR_COLORS.find((h) => h.id === hairColor)?.label || 'Padrão'

  return (
    <div
      data-testid="avatar-representation-card"
      className="p-3 rounded-xl bg-card border border-border/60 shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Minha representação
        </span>
        <Badge
          variant={isConfigured ? 'secondary' : 'outline'}
          className="text-[9px] h-4 px-1.5 capitalize font-normal"
        >
          {isConfigured ? 'Personalizada' : 'Padrão'}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Miniatura da Figura */}
        <div className="w-16 h-22 rounded-lg border border-border/70 bg-stone-100 dark:bg-stone-900 overflow-hidden shrink-0 flex items-center justify-center relative">
          <canvas
            ref={canvasRef}
            data-testid="avatar-mini-canvas"
            className="w-full h-full object-contain pointer-events-none"
            aria-label="Miniatura da representação da interagente"
          />
          {renderError && (
            <span className="text-[8px] text-destructive px-1 text-center">Asset indisponível</span>
          )}
        </div>

        {/* Detalhes Compactos */}
        <div className="space-y-1 text-xs text-muted-foreground flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {presentation === 'feminine' ? 'Figura Feminina' : 'Figura Masculina'}
          </p>
          <p className="text-[11px] truncate">Pele: Tom {skinIdx > 0 ? skinIdx : 2}</p>
          <p className="text-[11px] truncate">Cabelo: {hairLabel}</p>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onEdit}
        className="w-full text-xs h-7 gap-1.5 hover:bg-primary/5 hover:text-primary border-primary/30"
      >
        <Edit3 className="w-3 h-3" />
        <span>Editar minha representação</span>
      </Button>
    </div>
  )
}
export default AvatarRepresentationCard
