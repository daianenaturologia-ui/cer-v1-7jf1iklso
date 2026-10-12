import { cerCarePlanService } from '@/services/cerCarePlanService'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
import { consciousnessCoverage, CER_READING_DIMENSIONS } from '@/services/cerMapReadings'
import { professionalQuestionnaireResponses } from '@/services/professionalQuestionnaireRead'
import { lifeTimelineService, sharedLifeEvents } from '@/services/lifeTimeline'
import { lifeDirectionsService, sharedLifeDirections } from '@/services/lifeDirections'
import { selfDevelopmentService, visibleDevelopment } from '@/services/selfDevelopment'

export function ProfessionalJourneySummary({
  enrollmentId,
  name,
  onOpen,
}: {
  enrollmentId: string
  name: string
  onOpen: (tab: 'consciencia' | 'equilibrio' | 'evolucao' | 'sessoes', tool?: string) => void
}) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<any>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let current = true
    setState(null)
    setError(false)
    Promise.all([
      Promise.all(
        CER_READING_DIMENSIONS.map((d) =>
          experienceResponseService.listResponsesByExperience(enrollmentId, d.experienceId),
        ),
      ),
      enrollmentExperienceService.listByEnrollment(enrollmentId),
      lifeTimelineService.list(enrollmentId),
      lifeDirectionsService.list(enrollmentId),
      selfDevelopmentService.list(enrollmentId),
      cerCarePlanService.listAcceptancesByEnrollment(enrollmentId),
    ])
      .then(([responses, progress, history, directions, steps, returns]) => {
        if (!current) return
        const shared = professionalQuestionnaireResponses(responses.flat(), enrollmentId)
        setState({
          coverage: consciousnessCoverage(shared, progress),
          history: sharedLifeEvents(history, enrollmentId),
          directions: sharedLifeDirections(directions, enrollmentId),
          steps: visibleDevelopment(steps, enrollmentId, true),
          returns: returns.filter(
            (r) =>
              r.enrollment_id === enrollmentId &&
              r.record_status === 'current' &&
              r.access_class === 'shared_care',
          ),
        })
      })
      .catch(() => {
        if (current) setError(true)
      })
    return () => {
      current = false
    }
  }, [enrollmentId, revision])
  if (error)
    return (
      <div role="alert" className="rounded-xl border p-4 space-y-3">
        <p>Não foi possível atualizar o acompanhamento.</p>
        <Button onClick={() => setRevision((v) => v + 1)}>Tentar novamente</Button>
      </div>
    )
  if (!state) return <p role="status">Carregando os registros compartilhados…</p>
  const done = state.coverage.filter((d: any) => d.completed).length
  const experienced = state.steps.filter((s: any) =>
    ['completed', 'reviewed'].includes(s.status),
  ).length
  const direction = state.directions.at(-1)
  return (
    <section aria-label={`Acompanhamento de ${name}`} className="space-y-5">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="font-serif text-xl">O momento de {name}</h2>
          <p className="text-sm text-muted-foreground">O que chegou da jornada, em um só lugar.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setRevision((v) => v + 1)}>
          Atualizar
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto p-4 flex-col items-start gap-1 whitespace-normal"
          onClick={() => onOpen('consciencia')}
        >
          <strong>Consciência · {done}/6 concluídas</strong>
          <span>Mapa e respostas compartilhadas</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex-col items-start gap-1 whitespace-normal"
          onClick={() => onOpen('evolucao', 'linha')}
        >
          <strong>
            História · {state.history.length} {state.history.length === 1 ? 'marco' : 'marcos'}
          </strong>
          <span>Registros compartilhados da Linha da Vida</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex-col items-start gap-1 whitespace-normal"
          onClick={() => onOpen('evolucao', 'planner')}
        >
          <strong>
            Rotina · {state.steps.length} {state.steps.length === 1 ? 'passo' : 'passos'}
          </strong>
          <span>
            {experienced} {experienced === 1 ? 'experimentado' : 'experimentados'} · agenda e
            aprendizados
          </span>
        </Button>
      </div>
      <div className="rounded-2xl border bg-primary/5 p-5 space-y-3">
        <h3 className="font-semibold">A direção escolhida pela interagente</h3>
        {direction ? (
          <>
            <p>{direction.title}</p>
            {direction.resources && (
              <p className="text-sm">
                <strong>Apoios:</strong> {direction.resources}
              </p>
            )}
            {direction.limits && (
              <p className="text-sm">
                <strong>O que precisa respeitar:</strong> {direction.limits}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm">Ainda não há uma direção compartilhada.</p>
        )}
        <Button size="sm" onClick={() => onOpen('equilibrio')}>
          Revisar nosso plano
        </Button>
      </div>
      {state.returns.length > 0 && (
        <div className="rounded-xl border p-4 text-sm space-y-1">
          <h3 className="font-semibold">Retorno sobre nosso foco</h3>
          <p>
            {(
              {
                accepted: 'Consegui experimentar',
                wants_to_try: 'Quero tentar',
                too_much: 'Foi muito',
                wants_to_talk: 'Prefiro conversar',
                wants_to_adapt: 'Quero adaptar',
                not_now: 'Agora não',
                alternative_requested: 'Quero outra possibilidade',
              } as Record<string, string>
            )[state.returns[0].response_type] || 'Retorno compartilhado'}
          </p>
          {state.returns[0].shared_comment && <p>{state.returns[0].shared_comment}</p>}
        </div>
      )}
      {state.steps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Passos compartilhados</h3>
          {state.steps.map((s: any) => (
            <div key={s.id} className="rounded-xl border p-3 text-sm">
              <p>{s.action}</p>
              <p className="text-muted-foreground">
                {['completed', 'reviewed'].includes(s.status)
                  ? 'Experimentado'
                  : s.status === 'paused'
                    ? 'Pausado'
                    : 'Em percurso'}
              </p>
              {s.reflection && <p className="mt-1">{s.reflection}</p>}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Este resumo inclui somente conteúdo compartilhado. Os detalhes clínicos e os encontros
        continuam nas abas.
      </p>
      <Button variant="outline" onClick={() => onOpen('sessoes')}>
        Preparar encontro
      </Button>
    </section>
  )
}
