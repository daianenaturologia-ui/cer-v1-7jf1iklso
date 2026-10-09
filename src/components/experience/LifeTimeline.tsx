import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
import {
  validateLifeEvent,
  lifeTimelineService,
  lifeTimeLabel,
  LIFE_EMOTIONS,
  type LifeEvent,
  type LifeEventInput,
} from '@/services/lifeTimeline'

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
  const [selectedId, setSelectedId] = useState<string>()
  const load = () => {
    setLoading(true)
    setError('')
    const request = lifeTimelineService.list(enrollmentId)
    return request
      .then((data) =>
        setEvents(
          data.filter(
            (e) =>
              e.enrollment_id === enrollmentId &&
              (!readOnly || e.access_class === 'participant_shared'),
          ),
        ),
      )
      .catch(() => setError('Não foi possível carregar sua Linha da Vida. Tente novamente.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    let active = true
    setEditing(null)
    setSelectedId(undefined)
    setLoading(true)
    setError('')
    setEvents([])
    const request = lifeTimelineService.list(enrollmentId)
    request
      .then((data) => {
        if (active)
          setEvents(
            data.filter(
              (e) =>
                e.enrollment_id === enrollmentId &&
                (!readOnly || e.access_class === 'participant_shared'),
            ),
          )
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
      const event = await lifeTimelineService.save(editing, editingId)
      const next = editingId
        ? events.map((e) => (e.id === editingId ? event : e))
        : [...events, event]
      setEvents(next)
      setEditing(null)
      setVoice(false)
      setSelectedId(event.id)
      setSaved(
        'Acontecimento salvo. Sua história foi registrada; a interpretação do Mapa CER será atualizada em uma nova versão.',
      )
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
  const birthEvent = ordered.find((e) => e.title.toLocaleLowerCase() === 'nascimento')
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
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/10 border p-4 sm:p-6">
            <div className="overflow-x-auto pb-3" aria-label="Marcos da minha história">
              <div className="relative flex items-start gap-4 min-w-max pt-5 px-2">
                <div
                  aria-hidden="true"
                  className="absolute left-5 right-3 top-12 border-t-2 border-primary/50"
                />
                <button
                  type="button"
                  className="relative flex flex-col items-center gap-3 w-32 text-center"
                  disabled={!unlocked || (readOnly && !birthEvent) || Boolean(error)}
                  onClick={() => {
                    if (birthEvent) setSelectedId(birthEvent.id)
                    else {
                      open()
                      setEditing({
                        enrollment_id: enrollmentId,
                        title: 'Nascimento',
                        time_kind: 'age',
                        time_value: '0',
                        emotions: [],
                        narrative: '',
                        access_class: 'participant_private',
                      })
                    }
                  }}
                >
                  <span className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary bg-background text-primary text-2xl shadow-sm">
                    ✧
                  </span>
                  <span className="text-sm font-semibold text-primary">Nascimento</span>
                  <span className="text-xs text-muted-foreground">O ponto de partida</span>
                </button>
                {ordered
                  .filter((e) => e.title.toLocaleLowerCase() !== 'nascimento')
                  .map((event, index) => (
                    <button
                      type="button"
                      key={event.id}
                      onClick={() => setSelectedId(event.id)}
                      aria-label={`Abrir marco: ${event.title}`}
                      aria-pressed={selectedId === event.id}
                      className="relative flex flex-col items-center gap-3 w-36 text-center group"
                    >
                      <span
                        className={`flex items-center justify-center w-14 h-14 rounded-full border-2 bg-background text-xl shadow-sm group-hover:border-primary ${selectedId === event.id ? 'border-primary text-primary' : 'border-primary/35 text-primary/80'}`}
                      >
                        {['❋', '◇', '◉'][index % 3]}
                      </span>
                      <span className="text-sm font-medium break-words w-full">{event.title}</span>
                      <span className="text-xs text-muted-foreground">{lifeTimeLabel(event)}</span>
                      {event.emotions.length > 0 && (
                        <span className="text-xs text-primary break-words">
                          {event.emotions.join(' · ')}
                        </span>
                      )}
                    </button>
                  ))}
                {!readOnly && unlocked && !error && (
                  <button
                    type="button"
                    onClick={() => open()}
                    aria-label="Adicionar marco na linha"
                    className="relative flex flex-col items-center gap-3 w-32 text-center group"
                  >
                    <span className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-dashed border-primary/50 bg-background text-primary text-2xl group-hover:border-primary">
                      +
                    </span>
                    <span className="text-sm text-primary">Adicionar marco</span>
                  </button>
                )}
                <div className="relative flex flex-col items-center gap-3 w-28 text-center">
                  <span className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary bg-primary text-primary-foreground text-2xl">
                    ◎
                  </span>
                  <span className="text-sm font-semibold">Hoje</span>
                  <span className="text-xs text-muted-foreground">Sua história continua</span>
                </div>
              </div>
            </div>
            {!readOnly && unlocked && !error && (
              <button
                type="button"
                className="w-full border-t border-dashed border-primary/35 pt-4 mt-3 text-sm text-primary text-left"
                onClick={() => open()}
              >
                ＋ Clique na linha para adicionar um acontecimento
              </button>
            )}
          </div>
          {ordered
            .filter((event) => event.id === selectedId)
            .map((event) => (
              <article key={event.id} className="rounded-xl border p-5 space-y-3 bg-card">
                <h3 className="font-serif text-lg text-primary">{event.title}</h3>
                <p className="text-sm">
                  {lifeTimeLabel(event)} ·{' '}
                  {event.access_class === 'participant_private'
                    ? 'Só para mim'
                    : 'Compartilhado com minha profissional'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.emotions.join(' · ') || 'Emoção não informada'}
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{event.narrative}</p>
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
                : 'Comece pelo nascimento ou por um momento que queira contar. Você pode incluir encontros, conquistas e apoios.'}
            </p>
          )}
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
          {editing.emotions.length > 1 && (
            <label className="block text-sm space-y-1">
              Qual emoção mais marcou esse acontecimento?
              <select
                aria-label="Qual emoção mais marcou esse acontecimento?"
                className="block w-full rounded border p-2 bg-background"
                value={editing.emotions[0]}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    emotions: [
                      e.target.value,
                      ...editing.emotions.filter((emotion) => emotion !== e.target.value),
                    ],
                  })
                }
              >
                {editing.emotions.map((emotion) => (
                  <option key={emotion} value={emotion}>
                    {emotion}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Ela aparecerá primeiro junto ao marco; as outras emoções continuarão no seu
                registro.
              </p>
            </label>
          )}
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
            Compartilhar esta história com minha profissional.
          </label>
          <p className="text-xs text-muted-foreground">
            Seu mapa inicial acompanha esta história. Desmarcado: ela aparece apenas para você.
            Compartilhar permite que sua profissional a considere na leitura conjunta. Mapas
            profissionais já publicados preservam sua versão. O ditado precisa da sua confirmação;
            não guardamos o áudio.
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
