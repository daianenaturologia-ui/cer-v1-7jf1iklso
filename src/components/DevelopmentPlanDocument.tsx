import { isCareChapter } from '@/services/integrativePlan'
import { ResourceMaterial } from './ResourceMaterial'
import type { PlanDocument } from '@/services/developmentPlanDocument'

export function DevelopmentPlanDocument({ document }: { document: PlanDocument }) {
  return (
    <article aria-label="Leitura do Plano de Desenvolvimento" className="space-y-7 leading-relaxed">
      <h2 className="font-serif text-2xl">{document.title}</h2>
      <section className="space-y-2">
        <h3 className="font-serif text-lg">Seu momento atual</h3>
        <p className="whitespace-pre-wrap">
          {document.moment || 'Vamos escrever nossa compreensão deste momento.'}
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-serif text-lg"> Prioridades de cuidado </h3>
        <p className="whitespace-pre-wrap">
          {document.priorities || 'As prioridades serão escolhidas em conjunto.'}
        </p>
      </section>
      <section className="space-y-4">
        <h3 className="font-serif text-lg">Cuidados e caminho para minha meta</h3>
        {!document.goals.length && (
          <p className="text-muted-foreground">
            Os cuidados e as ações para a meta principal serão combinados nos encontros.
          </p>
        )}
        {document.goals.map((goal, index) => (
          <section key={goal.id} className="rounded-2xl border p-4 sm:p-5 space-y-4">
            <h4 className="font-semibold">
              {isCareChapter(goal) ? 'Meu cuidado' : 'Minha meta'}.{' '}
              {goal.title || 'Meta em construção'}
            </h4>
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">
                {isCareChapter(goal) ? 'O que acompanhar no cuidado' : 'Como perceberemos avanço'}
              </p>
              <p className="whitespace-pre-wrap">
                {goal.progress || 'Vamos reconhecer juntas os sinais que fazem sentido.'}
              </p>
            </div>
            {goal.actions.map((action) => (
              <div key={action.id} className="border-l-2 border-primary/30 pl-4 space-y-2">
                <h5 className="font-medium">{action.title || 'Ação em construção'}</h5>
                <p className="whitespace-pre-wrap">{action.context}</p>
                {action.fallback && (
                  <p className="whitespace-pre-wrap text-sm">
                    <strong>Se ficar difícil: </strong>
                    {action.fallback}
                  </p>
                )}
                {action.resource && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary">
                      Apoio da Biblioteca · {action.resource.title}
                    </summary>
                    <p className="mt-2">{action.resource.lesson}</p>
                    <ResourceMaterial material={action.resource.material} />
                    <ol className="list-decimal pl-5">
                      {action.resource.instructions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </details>
                )}
              </div>
            ))}
          </section>
        ))}
      </section>
      <section className="rounded-2xl bg-primary/5 p-5 space-y-2">
        <h3 className="font-serif text-lg">Nosso próximo encontro</h3>
        <p className="whitespace-pre-wrap">
          {document.next_session || 'Vamos combinar o que observar e retomar no próximo encontro.'}
        </p>
      </section>
    </article>
  )
}
