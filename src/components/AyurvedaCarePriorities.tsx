import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { ExperienceResponseRecord } from '@/types/cer'
import {
  buildAyurvedaCarePriorities,
  type AyurvedaCarePriority,
} from '@/services/ayurvedaCarePriorities'
import { Button } from '@/components/ui/button'

export function AyurvedaCarePriorities({
  enrollmentId,
  participantName,
  canPrepare,
  onPrepare,
}: {
  enrollmentId: string
  participantName: string
  canPrepare: boolean
  onPrepare: (priority: AyurvedaCarePriority) => void
}) {
  const [result, setResult] = useState<ReturnType<typeof buildAyurvedaCarePriorities>>()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setResult(undefined)
    setError(false)
    setLoading(true)
    async function load() {
      try {
        const { demoAdapter } = await import('@/services/demoAdapter')
        const responses = demoAdapter.isEnabled()
          ? demoAdapter.listExperienceResponses(enrollmentId)
          : await pb.collection('experience_responses').getFullList<ExperienceResponseRecord>({
              filter: pb.filter('enrollment_id = {:enrollmentId}', { enrollmentId }),
              expand: 'prompt_id',
              sort: 'created',
            })
        if (active) setResult(buildAyurvedaCarePriorities(responses, enrollmentId, participantName))
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [enrollmentId, participantName, reload])
  const date = (value: string) =>
    new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  return (
    <section
      aria-label="Do mapa ao plano: Ayurveda"
      className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      <div className="flex flex-wrap justify-between gap-2 items-center">
        <h3 className="font-serif text-lg">Do mapa ao plano · Ayurveda</h3>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => setReload((n) => n + 1)}
        >
          Atualizar leitura
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Reúna estas prioridades às outras dimensões do CER e aos objetivos de {participantName}.
        Escolha o que merece atenção agora e ajuste com a pessoa o que cabe na sua rotina.
      </p>
      {loading ? (
        <p role="status">Carregando respostas do Ayurveda…</p>
      ) : error ? (
        <p role="alert">
          Não foi possível carregar as respostas. Use Atualizar leitura para tentar novamente.
        </p>
      ) : !result?.priorities.length ? (
        <p className="text-sm">
          Ainda não há respostas atuais suficientes para preparar prioridades de Ayurveda.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {result.priorities.map((priority) => (
              <details key={priority.id} className="rounded-xl border bg-background p-3">
                <summary className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring rounded-md">
                  <span className="font-medium text-sm">{priority.title}</span>
                  <span className="block text-xs text-primary mt-1">
                    {priority.directions.join(' · ')}
                  </span>
                </summary>
                <div className="space-y-3 mt-3 text-xs leading-relaxed">
                  <p>{priority.description}</p>
                  <div>
                    <h4 className="font-semibold">Respostas que sustentam esta prioridade</h4>
                    <ul className="list-disc pl-5">
                      {priority.evidence.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">O que acompanhar na reavaliação</h4>
                    <ul className="list-disc pl-5">
                      {priority.monitoring.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrepare}
                    onClick={() => onPrepare(priority)}
                  >
                    Revisar prioridade: {priority.title}
                  </Button>
                </div>
              </details>
            ))}
          </div>
          {!canPrepare && <p className="text-xs">Crie um plano para salvar estas prioridades.</p>}
          {result.review && (
            <p className="text-xs">
              Avaliação: {date(result.review.assessedAt)} · Reavaliar Ayurveda:{' '}
              {date(result.review.dueAt)}
              {result.review.due ? ' · Reavaliação disponível' : ''}.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Novas respostas atualizam esta leitura. As prioridades já salvas permanecem no plano até
            serem revistas; o histórico é preservado.
          </p>
        </>
      )}
    </section>
  )
}
