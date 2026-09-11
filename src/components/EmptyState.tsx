import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Inbox, Compass, Calendar, Sparkles, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EmptyStateVariant = 'default' | 'waiting' | 'experiments' | 'planner' | 'mandala'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  nextStepText?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  description,
  nextStepText,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  // Configurações padrão conforme cada contexto solicitado no Build 09B
  const defaults = {
    default: {
      title: 'Nada por aqui no momento',
      description: 'As informações aparecerão assim que houver novos registros.',
      nextStep: 'Continue explorando ou converse com sua profissional.',
      icon: <Inbox className="w-8 h-8 text-muted-foreground/60" />,
    },
    waiting: {
      title: 'Aguardando próxima etapa',
      description: 'Sua profissional está preparando os próximos passos do seu cuidado.',
      nextStep: 'Na próxima etapa, vocês vão escolher juntas o que faz sentido cuidar agora.',
      icon: <Clock className="w-8 h-8 text-primary/70 animate-pulse" />,
    },
    experiments: {
      title: 'Experimentos combinados',
      description: 'Os experimentos aparecem depois que algo for combinado com sua profissional.',
      nextStep: 'Você não precisa escolher nada sozinha: cada prática é afinada no seu ritmo.',
      icon: <Sparkles className="w-8 h-8 text-primary/70" />,
    },
    planner: {
      title: 'Janela de práticas',
      description: 'Ainda não há nenhum experimento combinado para este momento.',
      nextStep: 'Quando combinarem uma prática, ela aparecerá organizada aqui com leveza.',
      icon: <Calendar className="w-8 h-8 text-primary/70" />,
    },
    mandala: {
      title: 'Sua Mandala em formação',
      description: 'Sua Mandala ganha forma à medida que o cuidado acontece.',
      nextStep: 'Prioridades, vivências e percepções se integram aqui sem cobranças de desempenho.',
      icon: <Compass className="w-8 h-8 text-primary/70" />,
    },
  }[variant]

  const finalTitle = title || defaults.title
  const finalDesc = description || defaults.description
  const finalNextStep = nextStepText !== undefined ? nextStepText : defaults.nextStep
  const finalIcon = icon || defaults.icon

  return (
    <Card
      className={cn('border-dashed border-border/80 bg-card/40 text-center p-6 sm:p-8', className)}
    >
      <CardContent className="flex flex-col items-center justify-center p-0 space-y-3 max-w-md mx-auto">
        <div className="p-3 rounded-full bg-muted/40 flex items-center justify-center">
          {finalIcon}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-serif font-semibold text-foreground">{finalTitle}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{finalDesc}</p>
        </div>

        {finalNextStep && (
          <div className="w-full pt-2">
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground block mb-0.5">
                O que acontece agora?
              </span>
              {finalNextStep}
            </div>
          </div>
        )}

        {actionLabel && onAction && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAction}
            className="text-xs h-8 gap-1.5 mt-2"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default EmptyState
