import { useEffect, useState } from 'react'
import { lifeDirectionsService, type LifeDirection } from '@/services/lifeDirections'
import { selfDevelopmentService, type DevelopmentExperiment } from '@/services/selfDevelopment'
import { sharedFutureDirections } from '@/services/developmentPlanning'
import { carePlanChoices } from '@/services/carePlanStartingPoint'
import { REVIEW_OUTCOMES } from '@/services/careEpisodeReview'
import { GoalRoadmapPlanner } from './GoalRoadmapPlanner'
import { Button } from '@/components/ui/button'

export function CarePlanStartingPoint({
  enrollmentId,
  directionId,
  onPrepare,
}: {
  enrollmentId: string
  directionId?: string
  onPrepare: (choice: { title: string; description: string }) => void
}) {
  const [source, setSource] = useState<LifeDirection | null>(null)
  const [records, setRecords] = useState<DevelopmentExperiment[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setSource(null)
    setRecords([])
    if (!directionId) {
      setState('ready')
      return
    }
    setState('loading')
    Promise.all([
      lifeDirectionsService.list(enrollmentId),
      selfDevelopmentService.list(enrollmentId),
    ])
      .then(([directions, experiences]) => {
        if (!active) return
        setSource(
          sharedFutureDirections(directions, enrollmentId).find((d) => d.id === directionId) ||
            null,
        )
        setRecords(experiences)
        setState('ready')
      })
      .catch(() => {
        if (active) setState('error')
      })
    return () => {
      active = false
    }
  }, [enrollmentId, directionId, retry])
  return (
    <section
      className="rounded-lg border p-4 space-y-3 text-sm"
      aria-label="O que sustenta este plano"
    >
      <h3 className="font-semibold">O que sustenta este plano</h3>
      <p className="text-muted-foreground">
        O objetivo dá a direção. Os recursos, os limites e o que a pessoa experimentou ajudam a
        escolher um cuidado que ela queira e consiga sustentar.
      </p>
      {state === 'loading' && <p role="status">Reunindo as escolhas compartilhadas…</p>}
      {state === 'error' && (
        <div role="alert">
          <p>
            Não foi possível reunir essas escolhas. Tente novamente antes de preparar uma
            prioridade.
          </p>
          <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      )}
      {state === 'ready' && !source && (
        <p>
          {directionId
            ? 'A direção vinculada não está disponível entre os registros compartilhados. Reveja o objetivo junto com a pessoa antes de retomar as ações.'
            : 'Este plano nasceu de uma conversa em sessão. Registre, no contexto do plano, os recursos e os limites que vocês combinaram.'}
        </p>
      )}
      {state === 'ready' && source && (
        <>
          <p>
            <strong>O que deseja transformar:</strong> {source.title}
          </p>
          {source.resources && (
            <p className="whitespace-pre-wrap">
              <strong>Recursos e apoios:</strong> {source.resources}
            </p>
          )}
          {source.limits && (
            <p className="whitespace-pre-wrap">
              <strong>O que cabe agora:</strong> {source.limits}
            </p>
          )}
          <GoalRoadmapPlanner source={source} readOnly />
          <details className="space-y-3">
            <summary className="cursor-pointer font-medium">
              Escolhas e ajustes para conversar
            </summary>
            <p className="text-muted-foreground">
              Use estes passos como ponto de partida. Confirme a disposição atual antes de incluir
              qualquer um no plano; preparar uma prioridade abre um rascunho para sua revisão.
            </p>
            {carePlanChoices(source, records).length === 0 && (
              <p>Ainda não há escolhas de situações compartilhadas ligadas a este objetivo.</p>
            )}
            {carePlanChoices(source, records).map((choice) => (
              <div key={choice.id} className="rounded border p-3 space-y-2">
                {choice.outcome && (
                  <p className="text-xs text-muted-foreground">{REVIEW_OUTCOMES[choice.outcome]}</p>
                )}
                <p className="whitespace-pre-wrap">{choice.action}</p>
                {choice.observation && (
                  <p className="whitespace-pre-wrap">
                    <strong>O que percebeu:</strong> {choice.observation}
                  </p>
                )}
                {choice.support && (
                  <p className="whitespace-pre-wrap">
                    <strong>Apoio escolhido:</strong> {choice.support}
                  </p>
                )}
                {choice.needsConversation ? (
                  <p>
                    O próximo cuidado é conversar e respeitar a pausa, antes de propor uma ação.
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      onPrepare({
                        title: choice.action,
                        description: [
                          `Em direção a: ${source.title}`,
                          choice.support && `Recurso ou apoio: ${choice.support}`,
                        ]
                          .filter(Boolean)
                          .join('\n'),
                      })
                    }
                  >
                    Preparar prioridade a partir desta escolha
                  </Button>
                )}
              </div>
            ))}
          </details>
        </>
      )}
    </section>
  )
}
