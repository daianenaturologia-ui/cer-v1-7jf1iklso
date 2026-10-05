import { useAuth } from '@/contexts/AuthContext'
import { DEVELOPMENT_REVIEW_PROMPT } from '@/services/developmentPlanning'
import React, { useEffect, useState } from 'react'
import { cerCareCycleService } from '@/services/cerCareCycleService'
import {
  cerCycleInvitationService,
  type CycleInvitation,
} from '@/services/cerCycleInvitationService'
import { cerCarePlanService } from '@/services/cerCarePlanService'
import { demoAdapter } from '@/services/demoAdapter'
import type { CerCareCycleRecord } from '@/types/cer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CycleReviewView } from './CycleReviewView'

const labels = {
  planned: 'Planejado',
  active: 'Em andamento',
  paused: 'Pausado',
  closed: 'Encerrado',
}
export function CareCycleManager({ enrollmentId }: { enrollmentId: string }) {
  const { user } = useAuth()
  const [cycles, setCycles] = useState<CerCareCycleRecord[]>([])
  const [invitations, setInvitations] = useState<CycleInvitation[]>([])
  const [focus, setFocus] = useState('')
  const [date, setDate] = useState('')
  const [prompt, setPrompt] = useState(DEVELOPMENT_REVIEW_PROMPT)
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function load() {
    const [list, invites] = await Promise.all([
      cerCareCycleService.list(enrollmentId),
      cerCycleInvitationService.list(enrollmentId),
    ])
    setCycles(list)
    setInvitations(invites)
  }
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setSelected('')
    setCycles([])
    setInvitations([])
    Promise.all([
      cerCareCycleService.list(enrollmentId),
      cerCycleInvitationService.list(enrollmentId),
    ])
      .then(([list, invites]) => {
        if (active) {
          setCycles(list)
          setInvitations(invites)
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os ciclos. Tente atualizar.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId])
  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await action()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar esta ação.')
    } finally {
      setBusy(false)
    }
  }
  async function create() {
    const plan = demoAdapter.isEnabled()
      ? demoAdapter.listPlans(enrollmentId).find((p) => p.status === 'active')
      : await cerCarePlanService.getCurrentPlan(enrollmentId)
    if (!plan) throw new Error('Ative o plano de cuidado antes de criar um ciclo.')
    await cerCareCycleService.create({
      plan_id: plan.id,
      focus_summary: focus.trim(),
      planned_end_date: date ? new Date(date + 'T12:00:00').toISOString() : undefined,
    })
    setFocus('')
  }
  const invite = invitations.find((i) => i.care_cycle_id === selected)
  return (
    <section className="space-y-5" aria-label="Ciclos de cuidado">
      <h2 className="font-serif text-xl">Ciclos de cuidado</h2>
      <p className="text-sm text-muted-foreground">
        Cada ciclo acompanha o cuidado possível agora. A data é uma referência; a revisão e o
        encerramento dependem de uma decisão profissional.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="rounded-xl border p-4 space-y-3">
        <label htmlFor="cycle-focus" className="text-sm">
          Foco do próximo ciclo (registro profissional)
        </label>
        <Textarea
          id="cycle-focus"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          maxLength={5000}
        />
        <label htmlFor="cycle-date" className="block text-sm">
          Data de referência ou nova janela (opcional)
        </label>
        <Input id="cycle-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button disabled={busy || loading} onClick={() => run(create)}>
          Criar ciclo planejado
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => run(load)} className="ml-2">
          Atualizar
        </Button>
      </div>
      {loading ? (
        <p>Carregando ciclos...</p>
      ) : !cycles.length ? (
        <p className="text-sm">Ainda não há ciclos de cuidado para esta interagente.</p>
      ) : (
        <ul className="space-y-3">
          {cycles.map((c) => (
            <li key={c.id} className="rounded-xl border p-4 space-y-3">
              <h3 className="font-medium">
                Ciclo {c.cycle_number} · {labels[c.status]}
              </h3>
              {c.focus_summary && <p className="text-sm">{c.focus_summary}</p>}
              <p className="text-xs text-muted-foreground">
                {c.extended_until || c.planned_end_date
                  ? `Data de referência: ${new Date(c.extended_until || c.planned_end_date!).toLocaleDateString('pt-BR')}`
                  : 'Sem duração fixa'}
              </p>
              <div className="flex flex-wrap gap-2">
                {c.status === 'planned' && (
                  <Button
                    disabled={busy}
                    onClick={() => run(() => cerCareCycleService.act(c.id, 'start'))}
                  >
                    Iniciar ciclo
                  </Button>
                )}
                {c.status === 'active' && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => run(() => cerCareCycleService.act(c.id, 'pause'))}
                  >
                    Pausar
                  </Button>
                )}
                {c.status === 'paused' && (
                  <Button
                    disabled={busy}
                    onClick={() => run(() => cerCareCycleService.act(c.id, 'resume'))}
                  >
                    Retomar
                  </Button>
                )}
                {['active', 'paused'].includes(c.status) && (
                  <>
                    <Button
                      variant="outline"
                      disabled={busy || !date}
                      onClick={() =>
                        run(() =>
                          cerCareCycleService.act(
                            c.id,
                            'extend',
                            new Date(date + 'T12:00:00').toISOString(),
                          ),
                        )
                      }
                    >
                      Ajustar janela
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          if (
                            window.confirm(
                              'Encerrar este ciclo? O histórico será preservado e os itens futuros serão cancelados.',
                            )
                          )
                            await cerCareCycleService.act(c.id, 'close')
                        })
                      }
                    >
                      Encerrar ciclo
                    </Button>
                  </>
                )}
                {c.status !== 'planned' && (
                  <Button variant="outline" disabled={busy} onClick={() => setSelected(c.id)}>
                    Revisar ciclo {c.cycle_number}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <div className="space-y-4 border-t pt-5">
          <h3 className="font-medium">Convite e retorno da interagente</h3>
          {invite ? (
            <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
              <p>{invite.shared_prompt}</p>
              <p>
                {invite.completed_at
                  ? 'Percepção compartilhada pela interagente:'
                  : 'Convite enviado. Aguardando a percepção da interagente.'}
              </p>
              {invite.participant_reflection && (
                <p className="whitespace-pre-wrap">{invite.participant_reflection}</p>
              )}
            </div>
          ) : (
            <>
              <label htmlFor="cycle-prompt" className="block text-sm">
                Mensagem compartilhada no convite
              </label>
              <Textarea
                id="cycle-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={2000}
              />
              <Button
                disabled={busy || !prompt.trim()}
                onClick={() =>
                  run(() => cerCycleInvitationService.invite(enrollmentId, selected, prompt))
                }
              >
                Convidar para compartilhar percepções
              </Button>
            </>
          )}
          <CycleReviewView
            key={selected}
            cycleId={selected}
            enrollmentId={enrollmentId}
            userId={demoAdapter.isEnabled() ? demoAdapter.getCurrentUser().id : user?.id || ''}
            isProfessional
          />
        </div>
      )}
    </section>
  )
}
