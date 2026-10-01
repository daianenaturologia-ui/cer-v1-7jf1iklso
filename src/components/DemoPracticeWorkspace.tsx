import React, { useEffect, useState } from 'react'
import { demoAdapter } from '@/services/demoAdapter'
import { demoPracticeFlow, DEMO_PRACTICE_CATALOG } from '@/services/demoPracticeFlow'
import { cerCarePlanService } from '@/services/cerCarePlanService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CerPracticeAssignmentRecord } from '@/types/cer'

const states = {
  draft: 'Proposta compartilhada',
  active: 'Em andamento',
  paused: 'Pausado',
  stopped: 'Interrompido',
  completed: 'Concluído',
  superseded: 'Substituído',
}
export function DemoPracticeWorkspace({ enrollmentId }: { enrollmentId: string }) {
  const [previousAssignmentId, setPreviousAssignmentId] = useState<string | undefined>()
  const [revision, setRevision] = useState(0)
  const [assignments, setAssignments] = useState<CerPracticeAssignmentRecord[]>([])
  const [priorityId, setPriorityId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [versionId, setVersionId] = useState<string>(DEMO_PRACTICE_CATALOG[0].id)
  const [title, setTitle] = useState('Meu pequeno passo combinado')
  const [summary, setSummary] = useState('')
  const [duration, setDuration] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [outcome, setOutcome] = useState('insufficient_information')
  const [cautions, setCautions] = useState('')
  const [rationale, setRationale] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const plan = demoAdapter.listPlans(enrollmentId).find((p) => p.status === 'active')
  const priorities = plan ? demoAdapter.listPriorities(plan.id) : []
  const cycles = demoAdapter
    .readCareStore()
    .cycles.filter(
      (c) => c.enrollment_id === enrollmentId && c.plan_id === plan?.id && c.status === 'active',
    )
  useEffect(() => {
    try {
      setAssignments(demoPracticeFlow.list(enrollmentId))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os experimentos.')
    }
  }, [enrollmentId, revision])
  async function run(action: () => unknown | Promise<unknown>, success: string) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      setRevision((v) => v + 1)
      setMessage(success)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="space-y-5" aria-label="Experimentos da demonstração">
      <h2 className="font-serif text-xl">Práticas, recursos e experimentos</h2>
      {previousAssignmentId && (
        <p className="text-sm">
          Adaptação de uma proposta existente. Confira novamente as orientações e a checagem.{' '}
          <Button variant="ghost" onClick={() => setPreviousAssignmentId(undefined)}>
            Cancelar adaptação
          </Button>
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Acervo fictício para experimentar o fluxo de cuidado. A checagem, o aceite do foco e o
        consentimento são registrados em etapas distintas.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <Button variant="outline" disabled={busy} onClick={() => setRevision((v) => v + 1)}>
        Atualizar experimentos
      </Button>
      {!plan ? (
        <p>Crie e ative o plano de cuidado na aba Plano para começar.</p>
      ) : (
        <div className="rounded-xl border p-4 space-y-3">
          <label htmlFor="demo-priority" className="block text-sm">
            Prioridade de cuidado
          </label>
          <select
            id="demo-priority"
            className="w-full rounded-md border bg-background p-2"
            value={priorityId}
            onChange={(e) => setPriorityId(e.target.value)}
          >
            <option value="">Selecione um foco</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} · {p.status === 'candidate' ? 'Em formulação' : 'Ativa'}
              </option>
            ))}
          </select>
          {priorities.find((p) => p.id === priorityId)?.status === 'candidate' && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(
                  () => cerCarePlanService.updatePriorityStatus(priorityId, 'active'),
                  'Prioridade ativada. Apresente este foco na aba Plano e aguarde o retorno de Mariana.',
                )
              }
            >
              Ativar prioridade escolhida
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            O foco precisa estar ativo, apresentado e aceito por Mariana. Esse aceite não substitui
            o consentimento da prática.
          </p>
          <label htmlFor="demo-cycle" className="block text-sm">
            Ciclo em andamento
          </label>
          <select
            id="demo-cycle"
            className="w-full rounded-md border bg-background p-2"
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
          >
            <option value="">Selecione o ciclo</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                Ciclo {c.cycle_number}
              </option>
            ))}
          </select>
          <label htmlFor="demo-version" className="block text-sm">
            Prática ou recurso do acervo fictício
          </label>
          <select
            id="demo-version"
            className="w-full rounded-md border bg-background p-2"
            value={versionId}
            onChange={(e) => {
              setVersionId(e.target.value)
              const v = DEMO_PRACTICE_CATALOG.find((v) => v.id === e.target.value)
              setTitle(v?.title || '')
              setOutcome('insufficient_information')
              if (v?.nature === 'resource') setFrequency('as_needed')
            }}
          >
            {DEMO_PRACTICE_CATALOG.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} · versão {v.version}
              </option>
            ))}
          </select>
          <p className="text-xs">
            {DEMO_PRACTICE_CATALOG.find((v) => v.id === versionId)?.summary}
          </p>
          <label htmlFor="demo-safe-title" className="block text-sm">
            Título que Mariana verá
          </label>
          <Input
            id="demo-safe-title"
            value={title}
            maxLength={160}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label htmlFor="demo-safe-summary" className="block text-sm">
            Orientações compartilhadas
          </label>
          <Textarea
            id="demo-safe-summary"
            value={summary}
            maxLength={5000}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Descreva o pequeno passo combinado e os limites para adaptar ou pausar."
          />
          <label htmlFor="demo-duration" className="block text-sm">
            Tempo combinado (opcional)
          </label>
          <Input
            id="demo-duration"
            value={duration}
            maxLength={100}
            onChange={(e) => setDuration(e.target.value)}
          />
          <label htmlFor="demo-frequency" className="block text-sm">
            Ritmo combinado
          </label>
          <select
            id="demo-frequency"
            className="w-full rounded-md border bg-background p-2"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="daily">Diário, com flexibilidade</option>
            <option value="twice_a_week">Duas vezes por semana</option>
            <option value="as_needed">Recurso para quando fizer sentido</option>
          </select>
          <label htmlFor="demo-safety" className="block text-sm">
            Checagem profissional desta versão
          </label>
          <select
            id="demo-safety"
            className="w-full rounded-md border bg-background p-2"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          >
            <option value="insufficient_information">Informações insuficientes</option>
            <option value="eligible">Possível neste momento</option>
            <option value="eligible_with_caution">Possível com cuidados explicitados</option>
            <option value="requires_professional_review">Precisa de revisão</option>
            <option value="requires_supervision">Precisa de supervisão</option>
            <option value="not_currently_indicated">Não indicada neste momento</option>
          </select>
          {outcome === 'eligible_with_caution' && (
            <>
              <label htmlFor="demo-cautions" className="block text-sm">
                Cuidados que Mariana verá
              </label>
              <Textarea
                id="demo-cautions"
                value={cautions}
                onChange={(e) => setCautions(e.target.value)}
                maxLength={2000}
              />
            </>
          )}
          <label htmlFor="demo-rationale" className="block text-sm">
            Registro profissional da checagem (interno)
          </label>
          <Textarea
            id="demo-rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            maxLength={5000}
          />
          <Button
            disabled={busy || !priorityId || !cycleId || !summary.trim() || !rationale.trim()}
            onClick={() =>
              run(() => {
                const proposed = demoPracticeFlow.prepare({
                  enrollmentId,
                  priorityId,
                  cycleId,
                  versionId,
                  safeTitle: title,
                  safeSummary: summary,
                  duration,
                  frequency,
                  safetyOutcome: outcome,
                  rationale,
                  sharedCautions: cautions,
                  previousAssignmentId,
                })
                setPreviousAssignmentId(undefined)
                setOutcome('insufficient_information')
                setRationale('')
                return proposed
              }, 'Proposta compartilhada. Mariana poderá conferir, consentir e dizer o que cabe agora.')
            }
          >
            Conferir e compartilhar proposta
          </Button>
        </div>
      )}
      <ul className="space-y-3">
        {assignments.map((a) => (
          <li className="rounded-xl border p-4 space-y-2" key={a.id}>
            <h3 className="font-medium">
              {a.participant_safe_title} · {states[a.status]}
            </h3>
            <p className="text-sm">{a.participant_safe_summary}</p>
            {demoPracticeFlow.pendingQuestion(a.id) && (
              <p className="text-sm">Mariana pediu esclarecimentos antes de prosseguir.</p>
            )}
            <p className="text-xs text-muted-foreground">
              {a.capacity_response
                ? `Capacidade informada: ${a.capacity_response.replaceAll('_', ' ')}`
                : 'Aguardando a percepção de capacidade de Mariana.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {['draft', 'paused'].includes(a.status) && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => demoPracticeFlow.activate(a.id),
                      'Prática ativada. O Planner respeitará a capacidade informada por Mariana.',
                    )
                  }
                >
                  {a.status === 'paused' ? 'Retomar com checagens' : 'Ativar após consentimento'}
                </Button>
              )}
              {a.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => demoPracticeFlow.pause(a.id),
                        'Prática pausada; histórico preservado.',
                      )
                    }
                  >
                    Pausar experimento
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => demoPracticeFlow.project(a.id),
                        'Janela do Planner atualizada, sem duplicar momentos.',
                      )
                    }
                  >
                    Atualizar janela do Planner
                  </Button>
                </>
              )}
              {['draft', 'active', 'paused'].includes(a.status) && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setPreviousAssignmentId(a.id)
                    setPriorityId(a.care_plan_priority_id)
                    setCycleId(a.care_cycle_id)
                    setVersionId(a.practice_version_id)
                    setTitle(a.participant_safe_title)
                    setSummary(a.participant_safe_summary || '')
                    setDuration(a.assigned_duration || '')
                    setFrequency(a.assigned_frequency || 'daily')
                    setOutcome('insufficient_information')
                    setRationale('')
                    setCautions('')
                    setMessage(
                      'Confira a adaptação no formulário acima. O histórico anterior será preservado.',
                    )
                  }}
                >
                  Adaptar proposta
                </Button>
              )}
              {['active', 'paused'].includes(a.status) && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => demoPracticeFlow.complete(a.id),
                      'Experimento concluído por decisão explícita; histórico preservado.',
                    )
                  }
                >
                  Concluir experimento
                </Button>
              )}
              {['draft', 'active', 'paused'].includes(a.status) && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => demoPracticeFlow.pause(a.id, true),
                      'Experimento interrompido; histórico preservado.',
                    )
                  }
                >
                  Interromper experimento
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
