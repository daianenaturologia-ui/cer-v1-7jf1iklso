import React, { useState } from 'react'
import { demoPracticeFlow } from '@/services/demoPracticeFlow'
import { Button } from '@/components/ui/button'
import { QuickResponseFlow } from './QuickResponseFlow'
import type { CerPracticeAssignmentRecord, CapacityResponseValue } from '@/types/cer'

const capacity: Array<{ value: CapacityResponseValue; label: string }> = [
  { value: 'cabe_bem', label: 'Cabe bem' },
  { value: 'cabe_se_adaptar', label: 'Cabe se adaptar' },
  { value: 'parece_demais', label: 'Parece demais' },
  { value: 'nao_cabe_agora', label: 'Não cabe agora' },
  { value: 'ainda_nao_sei', label: 'Ainda não sei' },
]
const states = {
  draft: 'Proposta para você conferir',
  active: 'Em andamento',
  paused: 'Pausado',
  stopped: 'Interrompido',
  completed: 'Concluído',
  superseded: 'Substituído',
}
export function DemoExperimentCard({
  assignment,
  onUpdated,
  readOnly = false,
}: {
  assignment: CerPracticeAssignmentRecord
  onUpdated?: () => void
  readOnly?: boolean
}) {
  const [revision, setRevision] = useState(0)
  const [understanding, setUnderstanding] = useState<
    'understood' | 'want_to_ask' | 'did_not_understand'
  >('want_to_ask')
  const [responseOpen, setResponseOpen] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const consent = demoPracticeFlow.latestConsent(assignment.id)
  const valid =
    consent?.record_status === 'current' &&
    consent.decision === 'accepted' &&
    consent.understanding_response === 'understood' &&
    !demoPracticeFlow.pendingQuestion(assignment.id)
  async function run(action: () => unknown) {
    setError('')
    setBusy(true)
    try {
      action()
      setRevision(revision + 1)
      onUpdated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível registrar sua escolha.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <article className="rounded-xl border bg-card p-4 space-y-3">
      <h3 className="font-medium">{assignment.participant_safe_title}</h3>
      <p className="text-xs text-muted-foreground">{states[assignment.status]}</p>
      <p className="text-sm whitespace-pre-wrap">{assignment.participant_safe_summary}</p>
      {assignment.assigned_duration && (
        <p className="text-xs">Tempo combinado: {assignment.assigned_duration}</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!readOnly && ['draft', 'active', 'paused'].includes(assignment.status) && (
        <>
          {!valid ? (
            <div className="space-y-2 border-t pt-3">
              <p className="text-sm">
                Você pode perguntar, adaptar ou recusar. Aceitar este convite não obriga você a
                realizá-lo.
              </p>
              <label className="block text-sm" htmlFor={`understanding-${assignment.id}`}>
                As orientações estão claras?
              </label>
              <select
                id={`understanding-${assignment.id}`}
                className="w-full rounded border bg-background p-2 text-sm"
                value={understanding}
                onChange={(e) => setUnderstanding(e.target.value as typeof understanding)}
              >
                <option value="want_to_ask">Quero perguntar antes</option>
                <option value="did_not_understand">Ainda não compreendi</option>
                <option value="understood">Compreendi as orientações e os cuidados</option>
              </select>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      understanding === 'understood'
                        ? demoPracticeFlow.consent(assignment.id, 'accepted', understanding)
                        : demoPracticeFlow.question(assignment.id, understanding),
                    )
                  }
                >
                  {understanding === 'understood'
                    ? 'Aceitar este convite'
                    : 'Compartilhar minha dúvida'}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    run(() => demoPracticeFlow.consent(assignment.id, 'declined', understanding))
                  }
                >
                  Prefiro não aceitar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <p className="text-xs">Seu consentimento foi registrado para esta versão.</p>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => run(() => demoPracticeFlow.withdraw(assignment.id))}
              >
                Retirar consentimento
              </Button>
            </div>
          )}
          <p className="text-sm">Como isso cabe no seu momento?</p>
          <div className="flex flex-wrap gap-2">
            {capacity.map((c) => (
              <Button
                variant={assignment.capacity_response === c.value ? 'default' : 'outline'}
                size="sm"
                disabled={busy}
                key={c.value}
                onClick={() => run(() => demoPracticeFlow.confirm(assignment.id, c.value))}
              >
                {c.label}
              </Button>
            ))}
          </div>
          {valid && assignment.status === 'active' && (
            <Button variant="outline" onClick={() => setResponseOpen(true)}>
              Como foi isso para você?
            </Button>
          )}
          {assignment.status === 'draft' && (
            <p className="text-xs text-muted-foreground">
              Sua profissional conferirá este retorno antes de ativar a prática.
            </p>
          )}
        </>
      )}
      {responseOpen && (
        <QuickResponseFlow
          assignment={assignment}
          isOpen
          onClose={() => setResponseOpen(false)}
          onSuccess={() => {
            setResponseOpen(false)
            onUpdated?.()
          }}
        />
      )}
    </article>
  )
}
