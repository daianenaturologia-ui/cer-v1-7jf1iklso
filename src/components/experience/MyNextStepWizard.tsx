import React, { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import pb from '@/lib/pocketbase/client'
import { demoAdapter } from '@/services/demoAdapter'
import { validateLifeDirection, type LifeDirectionInput } from '@/services/lifeDirections'

const STEPS = ['O que quero transformar', 'Minha meta principal', 'Como vou começar']

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
  error,
  onChange,
  onSave,
  onPause,
}: {
  value: LifeDirectionInput
  recordId?: string
  busy: boolean
  strategies: string[]
  error?: string
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
        if (step >= 1 && (!value.title.trim() || value.title.length > 160)) {
          setStep(1)
          setMessage(
            'Dê um nome à sua meta com até 160 caracteres antes de continuar. Você pode detalhá-la no relato.',
          )
          return
        }
        if (step < 2) {
          setStep(step + 1)

          setMessage('')
          return
        }
        onSave()
      }}
      aria-label="Minha meta principal"
    >
      <div className="flex items-center gap-3">
        <Sprout className="text-primary shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs text-muted-foreground">Um começo possível</p>
          <h3 className="font-serif text-2xl">Minha meta principal</h3>
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
          <h4 className="font-serif text-xl">O que você quer transformar na sua vida?</h4>
          <p className="text-sm text-muted-foreground">
            Olhe para seu presente: o que você deseja viver de outra maneira? Escolha uma mudança
            importante para começar, sem precisar resolver tudo agora.
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
          <h4 className="font-serif text-xl">Uma meta que tenha sentido para você</h4>
          <p className="text-sm text-muted-foreground">
            Sua meta pode envolver saúde, relações, trabalho ou outro projeto importante. Escreva
            uma mudança concreta que deseja alcançar. Ela será o foco deste ciclo do CER.{' '}
          </p>
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs text-primary font-semibold mb-2"> Hoje, minha realidade é… </p>
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
              aria-label="O que gostaria de conseguir viver ou fazer de maneira diferente?"
              aria-describedby="goal-title-count"
            />
            <span id="goal-title-count" className="text-xs text-muted-foreground">
              {value.title.length}/160 caracteres. Os detalhes podem ficar no relato da primeira
              etapa.
            </span>
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
          <h4 className="font-serif text-xl">Um primeiro passo que respeite sua vida</h4>
          <p className="text-sm text-muted-foreground">
            Sua meta ganha caminho quando encontra uma ação possível. O plano de cuidado preparado
            por Daiane ajudará a sustentar seu equilíbrio; nos encontros, vocês combinarão as ações
            e os horários.
          </p>
          <label className="block text-sm space-y-2">
            <span>Qual ação concreta posso começar a praticar para chegar à minha meta?</span>
            <Textarea
              rows={3}
              maxLength={5000}
              value={value.first_step}
              onChange={(e) => onChange({ ...value, first_step: e.target.value })}
              placeholder="Uma ação pequena, possível e que dependa de mim…"
            />
          </label>
          <label className="block text-sm space-y-2">
            <span>Por que essa conquista importa para mim?</span>
            <Textarea
              rows={2}
              maxLength={5000}
              value={value.meaning}
              onChange={(e) => onChange({ ...value, meaning: e.target.value })}
            />
          </label>
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
            aria-label="Minha meta para este ciclo"
          >
            <h4 className="font-serif text-lg">Minha meta para este ciclo</h4>
            <p className="text-sm whitespace-pre-wrap">
              <strong>Quero caminhar para: </strong>
              {value.title || 'Sua meta ainda precisa de um nome.'}
            </p>
            <p className="text-sm whitespace-pre-wrap">
              <strong>Minha primeira ação: </strong>
              {value.first_step || 'Vamos definir uma primeira ação na conversa.'}
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
            Compartilhar esta meta com minha profissional.
          </label>
          <p className="text-xs text-muted-foreground">
            Desmarcado: só você acessa. Esta meta poderá orientar o plano combinado; você pode
            voltar e ajustá-la.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error} Seu texto continua aqui; confira e tente salvar novamente.
        </p>
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
          {busy ? 'Salvando…' : step === 2 ? 'Salvar como meta principal' : 'Continuar'}
          {step < 2 && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onPause}>
          Continuar depois
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {draftKey && draftAvailable
          ? 'Rascunho guardado automaticamente neste navegador, só para você. Para guardar sua meta no CER, use “Salvar como meta principal”.'
          : 'O rascunho automático não está disponível neste navegador. Salve sua meta antes de sair.'}
      </p>
    </form>
  )
}
