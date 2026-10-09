import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
import pb from '@/lib/pocketbase/client'
import { demoAdapter } from '@/services/demoAdapter'
import type { LifeDirection } from '@/services/lifeDirections'
import { selfDevelopmentService, type DevelopmentExperiment } from '@/services/selfDevelopment'
import {
  REVIEW_OUTCOMES,
  emptyEpisodeReview,
  episodeReviewInput,
  episodeReviewReading,
  readEpisodeReview,
  validateEpisodeReview,
  type EpisodeReview,
} from '@/services/careEpisodeReview'
import { ResourceAgendaForm } from './ResourceAgendaForm'

const labels = {
  observation: 'O que percebi na prática?',
  adjustment: 'Como quero seguir agora?',
  support: 'Que recurso ou apoio quero usar?',
}
type ReviewField = keyof typeof labels
function ReviewForm({
  source,
  parent,
  onSaved,
  onPause,
}: {
  source: LifeDirection
  parent: DevelopmentExperiment
  onSaved: (record: DevelopmentExperiment) => void
  onPause: () => void
}) {
  const owner = demoAdapter.isEnabled() ? 'demo-interagente' : pb.authStore.record?.id
  const key = owner
    ? `cer-episode-review-draft-v1:${owner}:${source.enrollment_id}:${source.id}:${parent.id}`
    : null
  const [value, setValue] = useState<EpisodeReview>(() => emptyEpisodeReview(parent.id))
  const [shared, setShared] = useState(false)
  const [ready, setReady] = useState<string | null>(null)
  const [draftAvailable, setDraftAvailable] = useState(true)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [voice, setVoice] = useState(false)
  const [voiceField, setVoiceField] = useState<ReviewField>('observation')
  useEffect(() => {
    setValue(emptyEpisodeReview(parent.id))
    setShared(false)
    if (key)
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const draft: unknown = JSON.parse(raw)
          validateEpisodeReview(draft)
          if (draft.episodeId !== parent.id) throw new Error()
          setValue(draft)
          setMessage(
            'Seu retorno em rascunho foi retomado. Confira antes de salvar ou compartilhar.',
          )
        }
      } catch {
        setMessage('Não conseguimos retomar o rascunho. Os retornos salvos continuam preservados.')
      }
    setReady(key)
  }, [key, parent.id])
  useEffect(() => {
    if (!key || ready !== key) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
      setDraftAvailable(true)
    } catch {
      setDraftAvailable(false)
    }
  }, [key, ready, value])
  function patch(field: ReviewField, text: string) {
    setValue((old) => ({ ...old, [field]: text.slice(0, 300) }))
  }
  async function save() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const record = await selfDevelopmentService.save(
        episodeReviewInput(source, parent, value, shared),
      )
      if (key)
        try {
          localStorage.removeItem(key)
        } catch {
          /* Saved record remains available. */
        }
      onSaved(record)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar. Seu texto continua aqui.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form
      aria-label="Contar como foi minha experiência"
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <h5 className="font-serif text-lg">Meu caminho na prática</h5>
      <p className="text-sm text-muted-foreground">
        Cada tentativa ajuda a conhecer o que funciona para você. Seu plano pode ganhar outro ritmo
        ou um passo menor, sem perder de vista o que deseja transformar.
      </p>
      <p className="rounded-xl border p-3 text-sm">
        <strong>A escolha que estou acompanhando: </strong>
        {parent.action}
      </p>
      <fieldset disabled={busy} className="space-y-3">
        <legend className="text-sm mb-2">Como foi desta vez?</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(REVIEW_OUTCOMES).map(([id, label]) => (
            <Button
              key={id}
              type="button"
              variant="outline"
              aria-pressed={value.outcome === id}
              className={`h-auto whitespace-normal ${value.outcome === id ? 'border-primary bg-primary/10' : ''}`}
              onClick={() =>
                setValue((old) => ({ ...old, outcome: id as EpisodeReview['outcome'] }))
              }
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="text-sm leading-relaxed">{episodeReviewReading(value)}</p>
        {(Object.keys(labels) as ReviewField[]).map((field) => (
          <label key={field} className="block space-y-1 text-sm">
            <span>
              {labels[field]}
              {field === 'support' ? ' (opcional)' : ''}
            </span>
            {field === 'observation' && (
              <span className="block text-xs text-muted-foreground">
                Conte o que ajudou, o que dificultou ou por que ainda não foi possível começar.
              </span>
            )}
            {field === 'adjustment' && (
              <span className="block text-xs text-muted-foreground">
                Pode manter a escolha, reduzir o passo, buscar apoio ou pausar para conversar.
              </span>
            )}
            <Textarea
              rows={2}
              maxLength={300}
              value={value[field]}
              onFocus={() => setVoiceField(field)}
              onChange={(e) => patch(field, e.target.value)}
            />
          </label>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => patch('adjustment', parent.action)}
          >
            Manter minha escolha
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              patch(
                'adjustment',
                'Quero pausar e conversar com minha profissional antes de combinar outro passo.',
              )
            }
          >
            Pausar e conversar
          </Button>
        </div>
        <label className="flex gap-2 text-sm items-start">
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
          Compartilhar este retorno com minha profissional.
        </label>
        {parent.access_class !== 'participant_shared' && (
          <p className="text-xs text-muted-foreground">
            Esta situação está só para você. Para sua profissional acompanhar o retorno junto dela,
            compartilhe primeiro a situação.
          </p>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => setVoice(!voice)}>
          {voice ? 'Fechar ditado' : 'Contar por voz'}
        </Button>
        {voice && (
          <VoiceInputCapture
            targetLabel={labels[voiceField]}
            onCancel={() => setVoice(false)}
            onConfirmText={(text) => {
              patch(voiceField, [value[voiceField], text].filter(Boolean).join('\n'))
              setVoice(false)
            }}
          />
        )}
      </fieldset>
      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar meu retorno'}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onPause}>
          Continuar depois
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {key && draftAvailable
          ? 'Rascunho guardado neste navegador, só para você. O compartilhamento é escolhido a cada retorno.'
          : 'O rascunho não pôde ser guardado neste navegador. Salve o retorno antes de sair.'}
      </p>
    </form>
  )
}

export function CareEpisodeFollowUp({
  source,
  parent,
  records,
  readOnly = false,
  onSaved,
}: {
  source: LifeDirection
  parent: DevelopmentExperiment
  records: DevelopmentExperiment[]
  readOnly?: boolean
  onSaved: (record: DevelopmentExperiment) => void
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const reviews = records
    .filter(
      (record) =>
        record.enrollment_id === source.enrollment_id &&
        record.direction_id === source.id &&
        (!readOnly || record.access_class === 'participant_shared') &&
        readEpisodeReview(record)?.episodeId === parent.id,
    )
    .sort((a, b) => (b.created || '').localeCompare(a.created || ''))
  const currentChoice = reviews[0]?.next_step || parent.action
  async function toggleSharing(record: DevelopmentExperiment) {
    if (busy || readOnly) return
    if (
      record.access_class !== 'participant_shared' &&
      parent.access_class !== 'participant_shared'
    ) {
      setError(
        'Compartilhe primeiro a situação para sua profissional acompanhar este retorno junto dela.',
      )
      return
    }
    setBusy(true)
    setError('')
    try {
      onSaved(
        await selfDevelopmentService.save(
          {
            ...record,
            access_class:
              record.access_class === 'participant_shared'
                ? 'participant_private'
                : 'participant_shared',
          },
          record.id,
        ),
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não conseguimos mudar o compartilhamento. Tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  const cards = reviews.map((record) => {
    const review = readEpisodeReview(record)!
    const pausing =
      review.outcome === 'paused' ||
      review.adjustment ===
        'Quero pausar e conversar com minha profissional antes de combinar outro passo.'
    return (
      <article key={record.id} className="border-l-2 border-primary/30 pl-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          {record.created ? new Date(record.created).toLocaleDateString('pt-BR') : 'Registro atual'}{' '}
          · {REVIEW_OUTCOMES[review.outcome]} ·{' '}
          {record.access_class === 'participant_shared'
            ? 'Compartilhado com minha profissional'
            : 'Só para mim'}
        </p>
        <p className="text-sm leading-relaxed">{episodeReviewReading(review)}</p>
        <p className="text-sm">
          <strong>O que ficou mais claro: </strong>
          {review.observation}
        </p>
        <p className="text-sm">
          <strong>Meu ajuste para seguir: </strong>
          {review.adjustment}
        </p>
        {review.support && (
          <p className="text-sm">
            <strong>Recursos e apoios: </strong>
            {review.support}
          </p>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer">Escolha acompanhada neste retorno</summary>
          <p className="mt-2">{record.action}</p>
        </details>
        {!readOnly && (
          <div className="space-y-2">
            <Button
              disabled={busy}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void toggleSharing(record)}
            >
              {record.access_class === 'participant_shared'
                ? 'Tornar este retorno privado'
                : 'Compartilhar este retorno com minha profissional'}
            </Button>
            {!pausing && (
              <ResourceAgendaForm
                enrollmentId={source.enrollment_id}
                strength={review.support || 'Apoio para meu próximo passo'}
                difficulty={parent.context}
                strategy={review.adjustment}
                initialGoal={record.goal}
              />
            )}
          </div>
        )}
      </article>
    )
  })
  return (
    <section className="border-t pt-3 space-y-3" aria-label="Acompanhar esta experiência">
      {editing ? (
        <ReviewForm
          key={`${source.enrollment_id}:${source.id}:${parent.id}`}
          source={source}
          parent={{ ...parent, action: currentChoice }}
          onPause={() => setEditing(false)}
          onSaved={(record) => {
            onSaved(record)
            setEditing(false)
          }}
        />
      ) : (
        <>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              Contar como foi
            </Button>
          )}
          {reviews.length > 0 && (
            <>
              <h5 className="font-serif text-lg">Meu caminho na prática</h5>
              {cards[0]}
              {reviews.length > 1 && (
                <details className="space-y-3 text-sm">
                  <summary className="cursor-pointer">
                    Retornos anteriores ({reviews.length - 1})
                  </summary>
                  <div className="mt-3 space-y-4">{cards.slice(1)}</div>
                </details>
              )}
            </>
          )}
          {readOnly && !reviews.length && (
            <p className="text-sm text-muted-foreground">
              Ainda não há retornos compartilhados desta experiência.
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
