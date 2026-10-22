import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { selfDevelopmentService, type DevelopmentExperiment } from '@/services/selfDevelopment'
import type { PlanRoutine } from '@/services/developmentPlanDocument'

/** Personal experience, with a deliberate sharing choice; no public Library publication. */
export function RoutineReflection({
  enrollmentId,
  routine,
  occurrence,
  start,
  onSaved,
}: {
  enrollmentId: string
  routine: PlanRoutine
  occurrence: string
  start: string
  onSaved: () => void
}) {
  const [record, setRecord] = useState<DevelopmentExperiment | null>(null)
  const [outcome, setOutcome] = useState('Experimentei')
  const [reflection, setReflection] = useState('')
  const [shared, setShared] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  async function save() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      let current =
        record ||
        (await selfDevelopmentService.list(enrollmentId)).find(
          (r) => r.resource_snapshot.id === occurrence,
        )
      if (current?.status === 'reviewed') {
        setStatus('Esta experiência já está guardada no histórico de passos.')
        return
      }
      if (!current) {
        const action = routine.snapshot.action
        current = await selfDevelopmentService.save({
          enrollment_id: enrollmentId,
          direction_id: '',
          goal: routine.snapshot.goal,
          action: action.title,
          context: action.context,
          fallback: action.fallback,
          signal: routine.snapshot.progress,
          scheduled_at: start,
          reflection: '',
          next_step: '',
          status: 'planned',
          access_class: 'participant_private',
          resource_snapshot: {
            id: occurrence,
            title: action.title.slice(0, 160),
            theme: 'Plano de Desenvolvimento',
            duration: '',
            lesson: action.context,
            instructions: [action.context.slice(0, 1500)],
            fallback: action.fallback,
            reflection: 'Como foi experimentar esta ação?',
          },
        })
        setRecord(current)
      }
      const updated = await selfDevelopmentService.save(
        {
          ...current,
          status: 'reviewed',
          reflection: [outcome, reflection.trim()].filter(Boolean).join(' — '),
          access_class: shared ? 'participant_shared' : 'participant_private',
        },
        current.id,
      )
      setRecord(updated)
      setStatus(
        shared
          ? 'Experiência guardada e compartilhada com sua profissional.'
          : 'Experiência guardada só para você.',
      )
      onSaved()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível guardar. Seu relato continua aqui.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="space-y-3 border-t pt-3" aria-label="Minha experiência com esta ação">
      <h3 className="font-medium">Como foi para você?</h3>
      {status ? (
        <p role="status">{status}</p>
      ) : (
        <>
          <label className="block">
            Minha experiência
            <select
              className="block w-full rounded border bg-background p-2"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              {[
                'Experimentei',
                'Adaptei para o meu momento',
                'Não ajudou',
                'Não aconteceu desta vez',
                'Quero conversar com minha profissional',
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            O que gostaria de registrar? (opcional)
            <Textarea
              maxLength={5000 - outcome.length - 3}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </label>
          <label className="flex gap-2">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            Compartilhar este relato com minha profissional
          </label>
          <p className="text-xs text-muted-foreground">
            Seu registro fica privado até você escolher compartilhar. Ele será preservado no
            histórico de passos.
          </p>
          {error && <p role="alert">{error}</p>}
          <Button disabled={busy} onClick={save}>
            {busy ? 'Guardando…' : 'Guardar experiência'}
          </Button>
        </>
      )}
    </section>
  )
}
