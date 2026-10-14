import React, { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import pb from '@/lib/pocketbase/client'
import { demoAdapter } from '@/services/demoAdapter'
import { validateLifeDirection, type LifeDirectionInput } from '@/services/lifeDirections'

const STEPS = ['Meu momento', 'Minha direção', 'Meu começo']

export function clearMyNextStepDraft(enrollmentId: string, recordId?: string) {
  const owner = demoAdapter.isEnabled() ? 'demo-interagente' : pb.authStore.record?.id
  if (owner) {
    try {
      localStorage.removeItem(
        `cer-next-step-draft-v1:${owner}:${enrollmentId}:${recordId || 'new'}`,
      )
    } catch {
      /* The server record is already saved. */
    }
  }
}

export function MyNextStepWizard({
  value,
  recordId,
  busy,
  strategies,
  onChange,
  onSave,
  onPause,
}: {
  value: LifeDirectionInput
  recordId?: string
  busy: boolean
  strategies: string[]
  onChange: (value: LifeDirectionInput) => void
  onSave: () => void
  onPause: () => void
}) {
  const [step, setStep] = useState(0)
  const [message, setMessage] = useState('')
  const [draftReady, setDraftReady] = useState<string | null>(null)
  const [draftAvailable, setDraftAvailable] = useState(true)
  const owner = demoAdapter.isEnabled() ? 'demo-interagente' : pb.authStore.record?.id
  const draftKey = owner
    ? `cer-next-step-draft-v1:${owner}:${value.enrollment_id}:${recordId || 'new'}`
    : null
  useEffect(() => {
    if (draftKey) {
      try {
        const raw = localStorage.getItem(draftKey)
        if (raw) {
          const draft = JSON.parse(raw)
          validateLifeDirection({ ...draft.value, title: draft.value?.title || 'Direção inicial' })
          if (
            draft.value.enrollment_id === value.enrollment_id &&
            draft.value.kind === 'future' &&
            Number.isInteger(draft.step) &&
            draft.step >= 0 &&
            draft.step <= 2
          ) {
            // A restored draft always requires a fresh deliberate sharing choice.
            onChange({ ...draft.value, access_class: 'participant_private' })
            setStep(draft.step)
            setMessage('Seu rascunho foi retomado. Confira antes de salvar ou compartilhar.')
          }
        }
      } catch {
        setMessage(
          'Não foi possível retomar o rascunho. Seus registros salvos continuam preservados.',
        )
      }
    }
    setDraftReady(draftKey)
  }, [draftKey, value.enrollment_id, onChange])
  useEffect(() => {
    if (!draftKey || draftReady !== draftKey) return
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ value: { ...value, access_class: 'participant_private' }, step }),
      )
      setDraftAvailable(true)
    } catch {
      setDraftAvailable(false)
    }
  }, [value, step, draftReady, draftKey])
  function append(field: 'resources' | 'limits', text: string) {
    const lines = value[field].split('\n').filter(Boolean)
    if (!lines.includes(text)) {
      const next = [...lines, text].join('\n')
      if (next.length > 5000) {
        setMessage('Este campo já está cheio. Edite o texto para acrescentar outra informação.')
        return
      }
      onChange({ ...value, [field]: next })
    }
  }
  return (
    <form
      className="cer-reading-panel rounded-2xl border bg-card p-5 sm:p-7 space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (step < 2) {
          setStep(step + 1)

          setMessage('')
          return
        }
        onSave()
      }}
      aria-label="Meu próximo passo"
    >
      <div className="flex items-center gap-3">
        <Sprout className="text-primary shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs text-muted-foreground">Um começo possível</p>
          <h3 className="font-serif text-2xl">Meu próximo passo</h3>
        </div>
      </div>
      <ol className="grid grid-cols-3 gap-2" aria-label="Etapas da minha direção">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={`rounded-xl px-2 py-3 text-center text-xs border ${i === step ? 'bg-primary/10 border-primary text-primary font-semibold' : 'border-border text-muted-foreground'}`}
          >
            <span className="block font-serif text-lg">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {step === 0 && (
        <div className="space-y-4">
          <h4 className="font-serif text-xl">O que merece cuidado agora</h4>
          <p className="text-sm text-muted-foreground">
            Você não precisa resolver tudo de uma vez. Vamos encontrar aquilo que merece atenção
            primeiro.
          </p>

          <label className="block text-sm space-y-2">
            <span>Conte uma situação que mostre como isso aparece na sua vida hoje.</span>
            <Textarea
              rows={4}
              maxLength={5000}
              value={value.narrative}
              onChange={(e) => onChange({ ...value, narrative: e.target.value })}
            />
          </label>
          {value.narrative && (
            <p className="text-xs text-muted-foreground">
              Este relato pode ser ajustado. Aproveite o que já contou, sem precisar começar de
              novo.
            </p>
          )}
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="font-serif text-xl">A mudança que faria diferença</h4>
          <p className="text-sm text-muted-foreground">
            Pode ser descansar melhor, ter uma conversa, estabelecer um limite ou voltar a fazer
            algo importante. Vamos dar uma direção a esse cuidado.
          </p>
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs text-primary font-semibold mb-2">Hoje está difícil…</p>
            <p className="text-sm whitespace-pre-wrap">
              {value.narrative || 'Ainda estou encontrando palavras para o meu momento.'}
            </p>
          </div>
          <label className="block text-sm space-y-2">
            <span>O que gostaria de conseguir viver ou fazer de maneira diferente?</span>
            <Textarea
              rows={3}
              maxLength={160}
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="Uma diferença que eu gostaria de perceber na minha vida…"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            className="h-auto whitespace-normal"
            onClick={() => onChange({ ...value, title: 'Ainda não sei o que desejo mudar' })}
          >
            Ainda não tenho clareza da mudança
          </Button>
          <p className="text-xs text-muted-foreground">
            Esta é uma direção inicial. Você e sua profissional poderão aprofundá-la juntas.
          </p>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <h4 className="font-serif text-xl">Minhas possibilidades e necessidades</h4>
          <p className="text-sm text-muted-foreground">
            Seu cuidado precisa considerar seu tempo, sua energia e suas condições de vida. Escolher
            menos também é válido.
          </p>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Quais recursos e apoios tenho?</legend>

            <label className="block text-sm space-y-1">
              <span>Recursos e apoios que podem ajudar</span>
              <Textarea
                rows={2}
                maxLength={5000}
                value={value.resources}
                onChange={(e) => onChange({ ...value, resources: e.target.value })}
                placeholder="Conte com suas palavras. Pode deixar em aberto."
              />
            </label>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              O que precisamos respeitar para esse começo funcionar?
            </legend>

            <label className="block text-sm space-y-1">
              <span>O que precisamos respeitar</span>
              <Textarea
                rows={3}
                maxLength={5000}
                value={value.limits}
                onChange={(e) => onChange({ ...value, limits: e.target.value })}
                placeholder="O que cabe agora? O que ainda não cabe?"
              />
            </label>
          </fieldset>
          {strategies.length > 0 && (
            <details className="rounded-xl border p-3">
              <summary className="cursor-pointer text-sm">
                Aproveitar meus recursos do jogo de potencialidades
              </summary>
              <div className="flex flex-col items-start gap-2 mt-3">
                {strategies.map((text) => (
                  <Button
                    type="button"
                    key={text}
                    variant="outline"
                    className="h-auto whitespace-normal text-left"
                    onClick={() => append('resources', text)}
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </details>
          )}
          <div
            className="rounded-xl bg-primary/5 p-4 space-y-2"
            aria-label="Minha direção para o futuro"
          >
            <h4 className="font-serif text-lg">Minha direção de cuidado</h4>
            <p className="text-sm whitespace-pre-wrap">
              <strong>Quero caminhar para: </strong>
              {value.title || 'Compreender o que está pesando e encontrar uma direção.'}
            </p>
            <p className="text-sm whitespace-pre-wrap">
              <strong>Meu começo: </strong>
              {value.resources || 'Vamos escolher um começo juntas.'}
            </p>
            <p className="text-sm whitespace-pre-wrap">
              <strong>Meu plano precisa respeitar: </strong>
              {value.limits || 'Minhas condições serão consideradas na conversa.'}
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.access_class === 'participant_shared'}
              onChange={(e) =>
                onChange({
                  ...value,
                  access_class: e.target.checked ? 'participant_shared' : 'participant_private',
                })
              }
            />
            Compartilhar esta direção com minha profissional.
          </label>
          <p className="text-xs text-muted-foreground">
            Desmarcado: só você acessa. Esta direção poderá orientar o objetivo combinado; você pode
            voltar e ajustá-la.
          </p>
        </div>
      )}

      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setStep(step - 1)
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? 'Salvando…' : step === 2 ? 'Salvar minha direção' : 'Continuar'}
          {step < 2 && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onPause}>
          Continuar depois
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {draftKey && draftAvailable
          ? 'Rascunho guardado automaticamente neste navegador, só para você. Para guardar sua direção no CER, use “Salvar minha direção”.'
          : 'O rascunho automático não está disponível neste navegador. Salve sua direção antes de sair.'}
      </p>
    </form>
  )
}
