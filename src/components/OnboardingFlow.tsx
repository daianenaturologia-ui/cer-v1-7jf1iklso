import React, { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Heart,
  Clock,
  Shield,
  Bot,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'

interface OnboardingFlowProps {
  onComplete: () => void
  interagenteName?: string
  busy?: boolean
  error?: string
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  interagenteName,
  busy = false,
  error,
}) => {
  const [step, setStep] = useState(0)

  const moments = [
    {
      id: 'welcome',
      icon: <Heart className="w-8 h-8 text-primary" />,
      badge: 'Boas-vindas ao CER',
      title: `Olá${interagenteName ? `, ${interagenteName}` : ''}. Este é o seu espaço no Método CER.`,
      description:
        'O Método CER apoia suas escolhas e seus projetos, com atenção à energia e às condições que sustentam sua caminhada.',
      body: (
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            Aqui você pode reconhecer o que importa, registrar sua experiência e organizar os passos
            combinados com sua profissional. Este espaço também é para quem está bem e deseja
            crescer com mais consciência.{' '}
          </p>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-foreground italic">
            “Como você quer viver enquanto realiza?”{' '}
          </div>
        </div>
      ),
    },
    {
      id: 'rhythm',
      icon: <Clock className="w-8 h-8 text-primary" />,
      badge: 'Seu Ritmo',
      title: 'Um ritmo que caiba na sua vida',
      description:
        'Suas respostas ajudam a compreender seu momento. Objetivos, responsabilidades, recursos e pausas fazem parte dessa conversa.',
      body: (
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            Você pode pausar e retomar. As práticas e reflexões ajudam a perceber o que funciona na
            sua rotina e o que precisa de ajuste.{' '}
          </p>
          <p>
            O que ajudou você a avançar? O que dificultou? Compartilhar essas percepções ajuda a
            combinar um próximo passo possível.{' '}
          </p>
        </div>
      ),
    },
    {
      id: 'privacy',
      icon: <Shield className="w-8 h-8 text-primary" />,
      badge: 'Privacidade Consciente',
      title: 'Entenda o que você compartilha',
      description: 'Observe as indicações de privacidade antes de salvar ou enviar um registro.',
      body: (
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <div className="p-3 rounded-lg bg-card border border-border/60 text-foreground font-serif text-sm">
            “Algumas coisas podem ficar só para você. Outras são compartilhadas com sua profissional
            quando fazem parte do seu cuidado.”
          </div>
          <p>
            Em reflexões e anotações íntimas, você escolhe se deseja guardar para si ou trazer para
            o diálogo do acompanhamento. Nada é exposto publicamente.
          </p>
        </div>
      ),
    },
    {
      id: 'ai_role',
      icon: <Bot className="w-8 h-8 text-primary" />,
      badge: 'Papel da Tecnologia',
      title: 'A tecnologia apoia o olhar humano, nunca o substitui',
      description: 'O sistema ajuda a organizar informações para o acompanhamento.',
      body: (
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <div className="p-3 rounded-lg bg-card border border-border/60 text-foreground font-serif text-sm">
            “A IA ajuda a organizar e sugerir. Ela não diagnostica, não decide seu cuidado e não
            substitui sua profissional.”
          </div>
          <p>
            Todas as propostas, prioridades e adaptações de práticas passam pela curadoria cuidadosa
            da sua profissional e pelo seu próprio consentimento.
          </p>
        </div>
      ),
    },
    {
      id: 'limits',
      icon: <AlertTriangle className="w-8 h-8 text-primary" />,
      badge: 'Limites e Apoio',
      title: 'Como buscar apoio e limites deste espaço',
      description:
        'A plataforma apoia a continuidade do cuidado, mas não é um serviço de emergência imediata.',
      body: (
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            Em caso de urgência médica ou psicológica imediata, procure os serviços de saúde locais
            ou serviços de apoio como o CVV (ligue 188).
          </p>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-foreground space-y-1">
            <span className="font-semibold block text-xs">Precisa de ajuda com a plataforma?</span>
            <p className="text-[11px] text-muted-foreground">
              Fale com sua profissional durante seu próximo encontro ou envie uma mensagem pelos
              canais habituais de contato combinados entre vocês.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const current = moments[step]
  const isLast = step === moments.length - 1
  const progressPercent = Math.round(((step + 1) / moments.length) * 100)

  return (
    <Card className="border-border/80 shadow-lg max-w-lg w-full mx-auto overflow-hidden">
      <div className="p-4 bg-muted/20 border-b border-border/40 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px] font-normal">
            Momento {step + 1} de {moments.length}
          </Badge>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      <CardHeader className="space-y-2 pb-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
          {current.icon}
        </div>
        <Badge variant="secondary" className="w-fit text-[10px] uppercase font-mono tracking-wider">
          {current.badge}
        </Badge>
        <CardTitle className="text-xl font-serif font-semibold text-foreground leading-snug">
          {current.title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {current.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {current.body}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t border-border/40 bg-muted/10">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || busy}
          className="text-xs h-9 gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </Button>

        {isLast ? (
          <Button
            type="button"
            size="sm"
            onClick={onComplete}
            disabled={busy}
            className="text-xs h-9 px-5 gap-1.5 font-medium"
          >
            <span>{busy ? 'Salvando…' : 'Concluir e Começar'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => setStep((s) => Math.min(moments.length - 1, s + 1))}
            className="text-xs h-9 px-4 gap-1.5"
          >
            <span>Próximo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default OnboardingFlow
