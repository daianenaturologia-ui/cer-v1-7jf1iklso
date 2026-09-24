import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, Clock, Sparkles } from 'lucide-react'
import { AYV_C2_TEXTS } from '@/services/ayurvedaChapter2'

export interface AyurvedaChapter2OpeningProps {
  onStartQuestions: () => void
  onBackToHub: () => void
}

export const AyurvedaChapter2Opening: React.FC<AyurvedaChapter2OpeningProps> = ({
  onStartQuestions,
  onBackToHub,
}) => {
  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-mono">
          Capítulo 2 • Avaliação Ayurveda
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBackToHub}
          className="text-xs text-muted-foreground h-8 px-2 gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar aos Capítulos</span>
        </Button>
      </div>

      <div className="space-y-3 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
          {AYV_C2_TEXTS.OPENING_TITLE}
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>{AYV_C2_TEXTS.OPENING_ESTIMATED_DURATION}</span>
        </div>
      </div>

      {/* Carta de Acolhimento Canônica de Daiane */}
      <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/70 space-y-4 shadow-xs">
        <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-serif whitespace-pre-line">
          {AYV_C2_TEXTS.OPENING_BODY}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Cinco momentos de observação:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 pl-1 leading-relaxed">
          <li>1. Fome — como surge e como você lida com atrasos nas refeições</li>
          <li>2. Digestão — sensações após comer e alimentos mais exigentes</li>
          <li>3. Eliminação — ritmo e regularidade do funcionamento intestinal</li>
          <li>4. Sono — adormecer, repouso e disposição ao acordar</li>
          <li>5. Energia — distribuição da vitalidade ao longo do dia</li>
        </ul>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBackToHub}
          className="w-full sm:w-auto text-xs h-10 px-4"
        >
          Voltar ao percurso
        </Button>
        <Button
          type="button"
          onClick={onStartQuestions}
          className="w-full sm:w-auto text-xs h-10 px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span>{AYV_C2_TEXTS.OPENING_START_BTN}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default AyurvedaChapter2Opening
