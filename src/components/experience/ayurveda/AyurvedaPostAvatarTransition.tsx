import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight } from 'lucide-react'
import { AYV_TEXTS } from '@/services/ayurvedaChapter1'

export interface AyurvedaPostAvatarTransitionProps {
  onStartChapter1: () => void
}

export const AyurvedaPostAvatarTransition: React.FC<AyurvedaPostAvatarTransitionProps> = ({
  onStartChapter1,
}) => {
  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
        <Sparkles className="w-7 h-7" />
      </div>

      <div className="space-y-3">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
          Representação concluída
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
          {AYV_TEXTS.AVATAR_CONFIRMATION_TITLE}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          {AYV_TEXTS.AVATAR_CONFIRMATION_BODY}
        </p>
      </div>

      <div className="pt-4 flex justify-center">
        <Button
          type="button"
          onClick={onStartChapter1}
          className="text-xs h-10 px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span>{AYV_TEXTS.START_CHAPTER_1_BTN}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
export default AyurvedaPostAvatarTransition
