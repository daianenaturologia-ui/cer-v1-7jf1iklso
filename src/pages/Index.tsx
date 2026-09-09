import { Sparkles, Compass, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="px-4 py-1.5 border-primary/30 text-primary bg-primary/5 text-sm tracking-wide font-medium rounded-full"
          >
            PROMPT 00 CONCLUÍDO • CER V1
          </Badge>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">CER V1</h1>
          <p className="text-xl sm:text-2xl text-primary font-medium italic">
            “O ser humano não funciona em partes.”
          </p>
          <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
            Metodologia de desenvolvimento humano integral apoiada por uma plataforma digital.
            Simples por fora. Complexo por dentro.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-4">
          <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Constituição</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Princípios estruturais, 6 dimensões de Consciência e governança registrados.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Base Pronta</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Schema inicial aplicado, classes de visibilidade e sementes idempotentes criadas.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Aguardando Build 01</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pronto para receber a especificação técnica de autenticação, papéis e matrícula.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Ambiente inicializado e aguardando a especificação do{' '}
            <strong className="text-foreground font-medium">
              BUILD 01 — Foundation + Auth + Roles + Enrollment
            </strong>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default Index
