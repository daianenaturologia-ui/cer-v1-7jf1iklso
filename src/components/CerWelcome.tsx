import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown, HeartHandshake } from 'lucide-react'
import { CerArtStrip } from '@/components/CerArtwork'

/** Reception approved by Daiane. Static copy; no participant data or workflow mutation. */
export function CerWelcome() {
  return (
    <Collapsible
      defaultOpen
      className="cer-reading-panel rounded-xl border border-border/60 bg-card overflow-hidden"
    >
      <div className="px-5 pt-3">
        <CerArtStrip variant="flower" compact />
      </div>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-5 flex items-start justify-between gap-3 text-left whitespace-normal rounded-none"
        >
          <span className="flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="font-serif text-lg font-semibold">
              Comece aqui — Como você quer viver enquanto realiza?
            </span>
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 mt-1" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="cer-prose border-t border-border/40 px-5 py-5 space-y-4 text-foreground/90">
        <p className="cer-pullquote">Realize o que importa. Viva com mais sentido.</p>
        <p>
          O Método CER —{' '}
          <strong className="cer-emphasis">Consciência, Equilíbrio e Realização</strong> — apoia a
          construção de uma vida com sentido, presença e realização. Você pode estar bem e querer
          crescer, buscar uma mudança ou precisar de apoio para reorganizar o caminho.
        </p>
        <p>
          Seus projetos, sua produtividade e suas responsabilidades têm lugar aqui. Assim como sua
          energia, seus vínculos, seu descanso e o que torna a vida valiosa para você. Cuidar dessas
          condições pode ajudar a sustentar o que você deseja realizar, sem virar mais uma cobrança.
        </p>
        <p>
          No app, você encontra espaços para conhecer seu momento, registrar percepções e organizar
          os passos combinados no acompanhamento. As etapas ajudam a perceber o que importa,
          experimentar possibilidades e ajustar o que couber na sua realidade.
        </p>
        <p>
          Daiane Cenci é naturóloga especializada em neurociência, instrutora de Yoga e estudante de
          Tantra. Seu trabalho associa saberes ancestrais, especialmente Ayurveda e Yoga, a
          conhecimentos de neurociência, respeitando a singularidade de cada pessoa.
        </p>
        <p>
          Saberes tradicionais, referências científicas e experiências pessoais contribuem de formas
          diferentes. Ao longo do percurso, essas referências são apresentadas em seu contexto, sem
          atribuir comprovação científica a tudo.
        </p>
        <p>Qual próximo passo cabe na sua realidade?</p>
        <p className="font-medium">Daiane Cenci — Desenvolvimento com Consciência.</p>
      </CollapsibleContent>
    </Collapsible>
  )
}
