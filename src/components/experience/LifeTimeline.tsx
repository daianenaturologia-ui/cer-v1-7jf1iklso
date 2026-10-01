import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
import {
  validateLifeEvent,
  demoLifeEvents,
  lifeTimelineService,
  lifeTimeLabel,
  LIFE_EMOTIONS,
  type LifeEvent,
  type LifeEventInput,
} from '@/services/lifeTimeline'
import { demoAdapter } from '@/services/demoAdapter'

export function LifeTimeline({
  enrollmentId,
  readOnly = false,
  unlocked = true,
}: {
  enrollmentId: string
  readOnly?: boolean
  unlocked?: boolean
}) {
  const [events, setEvents] = useState<LifeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<LifeEventInput | null>(null)
  const [editingId, setEditingId] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [voice, setVoice] = useState(false)
  const [saved, setSaved] = useState('')
  const load = () => {
    setLoading(true)
    setError('')
    const request = demoAdapter.isEnabled()
      ? Promise.resolve(demoLifeEvents.get(enrollmentId) || [])
      : lifeTimelineService.list(enrollmentId)
    return request
      .then((data) =>
        setEvents(readOnly ? data.filter((e) => e.access_class === 'participant_shared') : data),
      )
      .catch(() => setError('Não foi possível carregar sua Linha da Vida. Tente novamente.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    let active = true
    setEditing(null)
    setLoading(true)
    setError('')
    setEvents([])
    const request = demoAdapter.isEnabled()
      ? Promise.resolve(demoLifeEvents.get(enrollmentId) || [])
      : lifeTimelineService.list(enrollmentId)
    request
      .then((data) => {
        if (active)
          setEvents(readOnly ? data.filter((e) => e.access_class === 'participant_shared') : data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar sua Linha da Vida. Tente novamente.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, readOnly])
  function open(event?: LifeEvent) {
    setEditingId(event?.id)
    setVoice(false)
    setSaved('')
    setEditing(
      event || {
        enrollment_id: enrollmentId,
        title: '',
        time_kind: 'unknown',
        time_value: '',
        emotions: [],
        narrative: '',
        access_class: 'participant_private',
      },
    )
  }
  async function save() {
    if (!editing) return
    setBusy(true)
    setError('')
    try {
      validateLifeEvent(editing)
      const event = demoAdapter.isEnabled()
        ? {
            ...editing,
            id: editingId || `demo-life-${crypto.randomUUID()}`,
            updated: new Date().toISOString(),
          }
        : await lifeTimelineService.save(editing, editingId)
      const next = editingId
        ? events.map((e) => (e.id === editingId ? event : e))
        : [...events, event]
      if (demoAdapter.isEnabled()) demoLifeEvents.set(enrollmentId, next)
      setEvents(next)
      setEditing(null)
      setVoice(false)
      setSaved('Acontecimento salvo.')
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível salvar. Seu texto continua aberto para tentar novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  const ordered = [...events].sort((a, b) => {
    const group = { date: 0, year: 0, age: 1, unknown: 2 }
    return (
      group[a.time_kind] - group[b.time_kind] ||
      (a.time_kind === 'age'
        ? +a.time_value - +b.time_value
        : a.time_value.localeCompare(b.time_value))
    )
  })
  return (
    <section className="border rounded-xl p-5 space-y-5" aria-label="Linha da Vida">
      <h2 className="font-serif text-xl">Linha da Vida · Minha história</h2>
      <p className="text-sm text-muted-foreground">
        Do nascimento até hoje, registre momentos que ajudam a contar sua história. Inclua também
        encontros, conquistas e apoios. Você pode preencher aos poucos e não precisa lembrar de
        todas as fases.
      </p>
      {!unlocked && (
        <p className="text-sm">
          Conclua as seis dimensões da Consciência para começar sua Linha da Vida.
        </p>
      )}
      {loading ? (
        <p role="status">Carregando acontecimentos…</p>
      ) : (
        <>
          <div className="relative border-l-4 border-primary/70 pl-6 ml-2 space-y-5">
            <p className="font-medium">Nascimento · início da sua história</p>
            {!readOnly && unlocked && !error && (
              <Button variant="outline" onClick={() => open()}>
                ＋ Clique na linha para adicionar um acontecimento
              </Button>
            )}
            {ordered.map((event) => (
              <article key={event.id} className="rounded-lg border p-3 space-y-2 bg-background">
                <h3 className="font-medium">{event.title}</h3>
                <p className="text-sm">
                  {lifeTimeLabel(event)} ·{' '}
                  {event.access_class === 'participant_private'
                    ? 'Só para mim'
                    : 'Compartilhado com minha profissional'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.emotions.join(' · ') || 'Emoção não informada'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{event.narrative}</p>
                {!readOnly && (
                  <Button variant="outline" size="sm" onClick={() => open(event)}>
                    Editar acontecimento
                  </Button>
                )}
              </article>
            ))}
            {!events.length && (
              <p className="text-sm text-muted-foreground">
                {readOnly
                  ? 'Ainda não há histórias compartilhadas.'
                  : 'Sua linha está pronta para receber o primeiro acontecimento.'}
              </p>
            )}
            <p className="font-medium">Hoje</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Datas e anos aparecem em ordem. Idades aproximadas e épocas não informadas ficam em
            grupos separados, sem inventar uma data.
          </p>
        </>
      )}
      {error && (
        <div role="alert" className="text-sm text-destructive">
          {error}
          {!editing && (
            <Button variant="outline" onClick={load}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}
      {saved && (
        <p role="status" className="text-sm">
          {saved}
        </p>
      )}
      {editing && (
        <form
          className="border rounded-xl p-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <h3 className="font-medium">{editingId ? 'Editar' : 'Novo'} acontecimento</h3>
          <label className="block text-sm space-y-1">
            Nome do acontecimento
            <Input
              value={editing.title}
              maxLength={160}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
          </label>
          <label className="block text-sm space-y-1">
            Quando aconteceu?
            <select
              className="block w-full rounded border p-2 bg-background"
              value={editing.time_kind}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  time_kind: e.target.value as LifeEvent['time_kind'],
                  time_value: '',
                })
              }
            >
              <option value="unknown">Não sei a época</option>
              <option value="date">Sei a data</option>
              <option value="year">Lembro do ano aproximado</option>
              <option value="age">Lembro da idade aproximada</option>
            </select>
          </label>
          {editing.time_kind !== 'unknown' && (
            <label className="block text-sm space-y-1">
              {editing.time_kind === 'date'
                ? 'Data'
                : editing.time_kind === 'year'
                  ? 'Ano aproximado'
                  : 'Idade aproximada (anos)'}
              <Input
                type={editing.time_kind === 'date' ? 'date' : 'number'}
                value={editing.time_value}
                onChange={(e) => setEditing({ ...editing, time_value: e.target.value })}
              />
            </label>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm">
              O que você sentiu? Pode escolher mais de uma emoção.
            </legend>
            <div className="flex flex-wrap gap-3">
              {LIFE_EMOTIONS.map((emotion) => (
                <label key={emotion} className="text-sm flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={editing.emotions.includes(emotion)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        emotions: e.target.checked
                          ? [...editing.emotions, emotion]
                          : editing.emotions.filter((x) => x !== emotion),
                      })
                    }
                  />
                  {emotion}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm space-y-1">
            Conte a história como você se lembra
            <Textarea
              value={editing.narrative}
              maxLength={20000}
              rows={6}
              onChange={(e) => setEditing({ ...editing, narrative: e.target.value })}
            />
          </label>
          <Button type="button" variant="outline" onClick={() => setVoice(!voice)}>
            {voice ? 'Fechar ditado' : 'Contar por voz'}
          </Button>
          {voice && (
            <VoiceInputCapture
              targetLabel="história"
              onCancel={() => setVoice(false)}
              onConfirmText={(text) => {
                setEditing({
                  ...editing,
                  narrative: [editing.narrative, text].filter(Boolean).join('\n\n'),
                })
                setVoice(false)
              }}
            />
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.access_class === 'participant_shared'}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  access_class: e.target.checked ? 'participant_shared' : 'participant_private',
                })
              }
            />
            Compartilhar esta história com minha profissional e permitir que seja considerada no
            Mapa CER.
          </label>
          <p className="text-xs text-muted-foreground">
            Desmarcado: só você pode acessar. Compartilhar não altera mapas já publicados. O ditado
            precisa da sua confirmação; não guardamos o áudio.
          </p>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar acontecimento'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEditing(null)
                setVoice(false)
                setError('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
