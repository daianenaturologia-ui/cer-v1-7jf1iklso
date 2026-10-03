import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown, HeartHandshake } from 'lucide-react'

/** Reception approved by Daiane. Static copy; no participant data or workflow mutation. */
export function CerWelcome() {
  return (
    <Collapsible defaultOpen className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-5 flex items-start justify-between gap-3 text-left whitespace-normal rounded-none"
        >
          <span className="flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="font-serif text-lg font-semibold">
              Comece aqui — Parabéns por escolher iniciar essa jornada
            </span>
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 mt-1" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/40 px-5 py-5 space-y-4 text-sm leading-7 text-foreground/90">
        <p>
          Às vezes, uma jornada de encontro consigo começa com um desencontro. Uma perda, uma
          relação que mudou, um modo de viver que deixou de fazer sentido. Às vezes, começa com uma
          vontade silenciosa: compreender melhor quem somos e encontrar novas possibilidades.
        </p>
        <p>
          Não escolhemos tudo o que nos acontece. Mas podemos, aos poucos, entender como nos
          relacionamos com a vida e descobrir o que desejamos transformar.
        </p>
        <p>
          Tudo começa com uma decisão. Ela não resolve tudo de uma vez, mas pode abrir um novo
          caminho.
        </p>
        <p>Minha jornada começou com uma perda. E, ao atravessá-la, pude começar a me encontrar.</p>
        <p>
          Naquele momento, percebi que muitas das minhas escolhas aconteciam sem que eu
          compreendesse o que me fazia escolher. Reconhecer isso não apagou o sofrimento, mas
          despertou em mim um desejo imenso de olhar para minha história e entender a forma como eu
          havia aprendido a viver.
        </p>
        <p>
          Também compreendi que tomar consciência, por si só, não era suficiente. Eu precisava ter
          condições de transformar o que descobria em atitudes reais.
        </p>
        <p>
          Comecei, então, a cuidar do meu equilíbrio. Aprendi a me regular e a encontrar mais
          coerência entre o meu pensar, sentir e agir. Foi quando consegui colocar aquela
          consciência em prática, respeitando meu momento e aprendendo com cada tentativa.
        </p>
        <p>
          Desse caminho, somado à minha formação e ao acompanhamento de outras pessoas, nasceu o
          Método CER: <strong>Consciência, Equilíbrio e Realização.</strong>
        </p>
        <p>
          Este espaço é um convite para você conhecer seu próprio funcionamento, reconhecer seus
          potenciais, cuidar do que precisa de atenção e construir uma vida com mais autonomia e
          sentido.
        </p>
        <p>
          Ao longo dessa jornada, você aprenderá a reconhecer seus recursos, compreender suas
          dificuldades e construir caminhos em direção ao que deseja. Vamos trabalhar para que foco,
          produtividade e realização possam caminhar junto com qualidade de vida.
        </p>
        <p>
          Quando falo em viver gostosamente, falo de encontrar mais presença, prazer e sentido na
          vida que você constrói. De ter espaço para seus desejos, suas responsabilidades, seus
          vínculos e seu descanso. De aprender a atravessar os desafios sem perder de vista aquilo
          que torna a vida valiosa para você.
        </p>
        <p>
          O percurso será organizado em etapas, com momentos para aprender, experimentar e
          reconhecer o que mudou. Seu ritmo, suas condições de vida e suas necessidades serão
          considerados ao longo do processo. Em cada etapa, vamos conversar sobre os próximos passos
          e sobre o acompanhamento que faz sentido para você.
        </p>
        <p>
          Você não precisa chegar sabendo por onde seguir. Podemos descobrir esse caminho em
          conjunto.
        </p>
        <p className="font-semibold text-primary">Bora começar?</p>
      </CollapsibleContent>
    </Collapsible>
  )
}
