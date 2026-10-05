import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sun, Leaf, Sparkles, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  plannerNotesService,
  type PlannerNote,
  type PlannerNoteInput,
} from '@/services/plannerNotes'
import {
  selfDevelopmentService,
  visibleDevelopment,
  type DevelopmentExperiment,
} from '@/services/selfDevelopment'
import {
  mondayOf,
  moveDay,
  localDateInput,
  eventsOnDay,
  eventLanes,
  weekIcs,
  type AgendaEvent,
} from '@/services/weeklyAgenda'
import type { CerPlannerItemRecord } from '@/types/cer'

const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const colors = {
  focus: 'bg-sky-100 text-sky-950 border-sky-200',
  rest: 'bg-amber-100 text-amber-950 border-amber-200',
  life: 'bg-rose-100 text-rose-950 border-rose-200',
  development: 'bg-emerald-100 text-emerald-950 border-emerald-200',
  care: 'bg-violet-100 text-violet-950 border-violet-200',
}
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
/** Uma única projeção visual; as origens e permissões continuam independentes. */
export function WeeklyAgenda({
  enrollmentId,
  careItems = [],
  readOnly = false,
  onCompleteCare,
  onRescheduleCare,
}: {
  enrollmentId: string
  careItems?: CerPlannerItemRecord[]
  readOnly?: boolean
  onCompleteCare?: (id: string) => Promise<void>
  onRescheduleCare?: (id: string, iso: string) => Promise<void>
}) {
  const [week, setWeek] = useState(() => mondayOf(new Date()))
  const [weekend, setWeekend] = useState(false)
  const [allHours, setAllHours] = useState(false)
  const [mobileDay, setMobileDay] = useState(Math.min((new Date().getDay() + 6) % 7, 4))
  const [notes, setNotes] = useState<PlannerNote[]>([])
  const [steps, setSteps] = useState<DevelopmentExperiment[]>([])
  const [editing, setEditing] = useState<PlannerNoteInput | null>(null)
  const [editingId, setEditingId] = useState<string>()
  const [selected, setSelected] = useState<AgendaEvent | null>(null)
  const [moment, setMoment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    setNotes([])
    setSteps([])
    setEditing(null)
    setSelected(null)
    setError('')
    setLoading(true)
    Promise.all([
      readOnly ? Promise.resolve([]) : plannerNotesService.list(enrollmentId),
      selfDevelopmentService.list(enrollmentId),
    ])
      .then(([n, s]) => {
        if (active) {
          setNotes(n)
          setSteps(visibleDevelopment(s, enrollmentId, readOnly))
        }
      })
      .catch(() => {
        if (active)
          setError('Não foi possível carregar a agenda. Seus registros continuam preservados.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, readOnly, revision])
  const events = useMemo<AgendaEvent[]>(
    () => [
      ...notes
        .filter((n) => n.status !== 'archived')
        .map((n) => ({
          id: `note:${n.id}`,
          title: n.title,
          start: n.starts_at,
          end: n.ends_at,
          kind: n.kind,
          completed: n.status === 'completed',
        })),
      ...steps
        .filter((s) => s.scheduled_at && s.status !== 'paused')
        .map((s) => ({
          id: `step:${s.id}`,
          title: s.action,
          start: s.scheduled_at,
          kind: 'development' as const,
          completed: ['completed', 'reviewed'].includes(s.status),
        })),
      ...careItems
        .filter((c) => c.scheduled_at && !['cancelled', 'superseded'].includes(c.status))
        .map((c) => ({
          id: `care:${c.id}`,
          title: c.safe_title,
          start: c.scheduled_at!,
          kind: 'care' as const,
          completed: c.status === 'completed',
        })),
    ],
    [notes, steps, careItems],
  )
  const days = Array.from({ length: weekend ? 7 : 5 }, (_, i) => moveDay(week, i))
  const firstHour = allHours ? 0 : 6,
    lastHour = allHours ? 24 : 22
  const slots = Array.from(
    { length: (lastHour - firstHour) * 2 },
    (_, i) => firstHour * 60 + i * 30,
  )
  const height = slots.length * 32
  const note = selected?.id.startsWith('note:')
    ? notes.find((n) => `note:${n.id}` === selected.id)
    : undefined
  const step = selected?.id.startsWith('step:')
    ? steps.find((s) => `step:${s.id}` === selected.id)
    : undefined
  const care = selected?.id.startsWith('care:')
    ? careItems.find((c) => `care:${c.id}` === selected.id)
    : undefined
  const unscheduled = steps.filter(
    (s) =>
      (!s.scheduled_at || s.status === 'paused') && !['reviewed', 'completed'].includes(s.status),
  )
  const contextual = careItems.filter(
    (c) => !c.scheduled_at && !['cancelled', 'superseded', 'completed'].includes(c.status),
  )
  const outside =
    !allHours &&
    events.some(
      (e) =>
        days.some((d) => eventsOnDay([e], d).length) &&
        (new Date(e.start).getHours() < 6 ||
          new Date(e.start).getHours() >= 22 ||
          (e.end && new Date(e.end).getHours() > 22)),
    )
  function newNote(day: Date, minutes: number) {
    const start = new Date(day)
    start.setHours(0, minutes, 0, 0)
    setError('')
    setEditingId(undefined)
    setSelected(null)
    setEditing({
      enrollment_id: enrollmentId,
      title: '',
      note: '',
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + 1800000).toISOString(),
      kind: 'focus',
      status: 'planned',
    })
  }
  function openEvent(event: AgendaEvent) {
    setError('')
    setSelected(event)
    setMoment(localDateInput(event.start))
  }
  async function run(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await action()
      setEditing(null)
      setSelected(null)
      setNotice('Agenda atualizada. Há espaço para o seu ritmo.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  async function saveNote(value: PlannerNoteInput, id?: string) {
    const saved = await plannerNotesService.save(value, id)
    setNotes((old) => (id ? old.map((n) => (n.id === id ? saved : n)) : [...old, saved]))
  }
  async function saveStep(value: DevelopmentExperiment) {
    const saved = await selfDevelopmentService.save(value, value.id)
    setSteps((old) => old.map((s) => (s.id === saved.id ? saved : s)))
  }
  function updateTime(field: 'starts_at' | 'ends_at', raw: string) {
    if (!raw || !Number.isFinite(Date.parse(raw))) return
    const iso = new Date(raw).toISOString()
    setEditing((old) => {
      if (!old) return old
      const duration = Date.parse(old.ends_at) - Date.parse(old.starts_at)
      return {
        ...old,
        [field]: iso,
        ...(field === 'starts_at'
          ? { ends_at: new Date(Date.parse(iso) + duration).toISOString() }
          : {}),
      }
    })
  }
  function exportWeek() {
    const url = URL.createObjectURL(
      new Blob([weekIcs(events, week, days.length)], { type: 'text/calendar;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `minha-semana-${localDateInput(week).slice(0, 10)}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <section aria-label={readOnly ? 'Agenda compartilhada' : 'Minha agenda'} className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 via-amber-50/50 to-rose-50/60 px-5 py-4">
        <svg
          aria-hidden="true"
          className="absolute right-4 top-0 h-24 w-40 text-primary/15"
          viewBox="0 0 160 100"
          fill="none"
        >
          <path d="M8 80C25 18 72 110 95 46S141 19 150 58" stroke="currentColor" strokeWidth="2" />
          <circle cx="121" cy="26" r="15" stroke="currentColor" />
          <path d="M38 63Q11 15 66 36Q64 61 38 63Z" fill="currentColor" />
        </svg>
        <p className="relative font-serif text-xl">Uma semana que cabe na sua vida</p>
        <p className="relative text-sm text-muted-foreground mt-1">
          {readOnly
            ? 'Somente os passos que a pessoa escolheu compartilhar.'
            : 'Foco, descanso e tempo para viver gostosamente.'}
        </p>
      </div>
      <Tabs defaultValue="agenda">
        <TabsList aria-label="Visões do Planner" className="mb-3">
          <TabsTrigger value="agenda">Minha semana</TabsTrigger>
          <TabsTrigger value="loose">
            Sem horário
            {unscheduled.length + contextual.length
              ? ` · ${unscheduled.length + contextual.length}`
              : ''}
          </TabsTrigger>
          {!readOnly && <TabsTrigger value="google">Google Agenda</TabsTrigger>}
        </TabsList>
        <TabsContent value="agenda" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Semana anterior"
                onClick={() => setWeek(moveDay(week, -7))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-medium text-sm min-w-36 text-center">
                {week.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} –{' '}
                {days[days.length - 1].toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Próxima semana"
                onClick={() => setWeek(moveDay(week, 7))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWeek(mondayOf(new Date()))
                  setMobileDay(Math.min((new Date().getDay() + 6) % 7, weekend ? 6 : 4))
                }}
              >
                Hoje
              </Button>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer p-2 rounded-md hover:bg-muted">
                Visualização
              </summary>
              <div className="flex flex-wrap gap-3 p-2">
                <label>
                  <input
                    type="checkbox"
                    checked={weekend}
                    onChange={(e) => {
                      setWeekend(e.target.checked)
                      setMobileDay((v) => Math.min(v, e.target.checked ? 6 : 4))
                    }}
                  />{' '}
                  Fim de semana
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={allHours}
                    onChange={(e) => setAllHours(e.target.checked)}
                  />{' '}
                  Todos os horários
                </label>
              </div>
            </details>
          </div>
          {!readOnly && (
            <p className="text-xs text-muted-foreground">
              Clique em um horário para reservar um momento.
            </p>
          )}
          {outside && (
            <Button variant="link" size="sm" onClick={() => setAllHours(true)}>
              Há momentos fora das 6h–22h · mostrar todos
            </Button>
          )}
          <div className="flex gap-1 md:hidden" aria-label="Escolher dia">
            {days.map((d, i) => (
              <Button
                key={i}
                size="sm"
                variant={mobileDay === i ? 'default' : 'ghost'}
                className="flex-1 px-1"
                aria-pressed={mobileDay === i}
                onClick={() => setMobileDay(i)}
              >
                {dayNames[i]} {d.getDate()}
              </Button>
            ))}
          </div>
          {loading ? (
            <p role="status">Carregando sua semana…</p>
          ) : (
            <div className="rounded-2xl border overflow-hidden bg-card">
              <div
                className="grid sticky top-0 bg-card border-b"
                style={{ gridTemplateColumns: `48px repeat(${days.length},minmax(0,1fr))` }}
              >
                <div className="hidden md:block" />
                {days.map((d, i) => (
                  <div key={i} className="hidden md:block py-3 text-center text-sm border-l">
                    <span className="text-muted-foreground">{dayNames[i]}</span>
                    <span
                      className={`ml-2 inline-flex w-8 h-8 items-center justify-center rounded-full ${d.toDateString() === new Date().toDateString() ? 'bg-primary text-primary-foreground' : 'bg-muted/40'}`}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="max-h-[580px] overflow-y-auto overscroll-contain">
                <div className="flex" style={{ height }}>
                  <div className="w-12 shrink-0 text-[10px] text-muted-foreground">
                    {slots.map((m, i) => (
                      <div key={m} style={{ height: 32 }} className="pr-2 text-right">
                        {i % 2 === 0 ? `${String(Math.floor(m / 60)).padStart(2, '0')}:00` : ''}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-1 min-w-0">
                    {days.map((day, index) => (
                      <div
                        key={day.toISOString()}
                        className={`relative flex-1 min-w-0 border-l ${index === mobileDay ? 'block' : 'hidden md:block'}`}
                      >
                        {slots.map((minutes) => (
                          <button
                            key={minutes}
                            disabled={readOnly}
                            aria-label={`${day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 ? '30' : '00'}`}
                            className={`block w-full h-8 text-left hover:bg-primary/5 focus-visible:bg-primary/10 focus-visible:outline-primary ${minutes % 60 ? 'border-b border-dashed border-border/30' : 'border-b border-border/50'} disabled:hover:bg-transparent`}
                            onClick={() => newNote(day, minutes)}
                          />
                        ))}
                        {eventLanes(eventsOnDay(events, day)).map(({ event, lane, lanes }) => {
                          const begin = Math.max(
                            Date.parse(event.start),
                            day.getTime() + firstHour * 3600000,
                          )
                          const finish = Math.min(
                            event.end ? Date.parse(event.end) : Date.parse(event.start) + 1800000,
                            day.getTime() + lastHour * 3600000,
                          )
                          if (finish <= begin) return null
                          const top =
                            ((begin - day.getTime() - firstHour * 3600000) / 60000 / 30) * 32
                          return (
                            <button
                              key={event.id}
                              onClick={() => openEvent(event)}
                              aria-label={`${event.title}, ${clock(event.start)}${event.completed ? ', realizado' : ''}`}
                              className={`absolute z-10 rounded-lg border px-2 py-1 text-left text-xs overflow-hidden hover:brightness-95 focus-visible:ring-2 ring-primary ${colors[event.kind]} ${event.completed ? 'opacity-65' : ''}`}
                              style={{
                                top,
                                height: Math.max(30, ((finish - begin) / 60000 / 30) * 32),
                                left: `calc(${(lane / lanes) * 100}% + 2px)`,
                                width: `calc(${100 / lanes}% - 4px)`,
                              }}
                            >
                              <span className="font-medium block truncate">
                                {event.completed ? '✓ ' : ''}
                                {event.title}
                              </span>
                              <span className="text-[10px]">{clock(event.start)}</span>
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex gap-1 items-center">
              <Sparkles className="w-3 h-3 text-sky-600" />
              Foco
            </span>
            <span className="inline-flex gap-1 items-center">
              <Sun className="w-3 h-3 text-amber-600" />
              Descanso
            </span>
            <span className="inline-flex gap-1 items-center">
              <Leaf className="w-3 h-3 text-rose-600" />
              Vida
            </span>
            <span>● Passos CER</span>
            <span>● Cuidado individual</span>
          </div>
        </TabsContent>
        <TabsContent value="loose" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {readOnly
              ? 'Passos compartilhados sem horário definido.'
              : 'Nem tudo precisa de hora marcada. Abra um passo para reservar um horário quando fizer sentido.'}
          </p>
          {unscheduled.map((s) => (
            <button
              key={s.id}
              className="block w-full text-left rounded-xl border p-4 hover:bg-primary/5"
              onClick={() => {
                setSelected({ id: `step:${s.id}`, title: s.action, start: '', kind: 'development' })
                setMoment('')
              }}
            >
              <strong className="text-sm">{s.action}</strong>
              <span className="block text-xs text-muted-foreground mt-1">{s.context}</span>
            </button>
          ))}
          {contextual.map((c) => (
            <button
              key={c.id}
              className="block w-full text-left rounded-xl border p-4 hover:bg-primary/5"
              onClick={() => {
                setSelected({ id: `care:${c.id}`, title: c.safe_title, start: '', kind: 'care' })
                setMoment('')
              }}
            >
              <strong className="text-sm">{c.safe_title}</strong>
            </button>
          ))}
          {!unscheduled.length && !contextual.length && (
            <p className="text-sm">Tudo que tem horário está na sua semana.</p>
          )}
          {!readOnly && (
            <Link to="/?etapa=evolucao" className="text-sm text-primary underline">
              Planejar um novo passo na Evolução
            </Link>
          )}
          {!readOnly && notes.some((n) => n.status === 'archived') && (
            <details className="text-sm">
              <summary className="cursor-pointer">Momentos arquivados</summary>
              {notes
                .filter((n) => n.status === 'archived')
                .map((n) => (
                  <div className="flex items-center justify-between p-2" key={n.id}>
                    <span>{n.title}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => run(() => saveNote({ ...n, status: 'planned' }, n.id))}
                    >
                      Restaurar
                    </Button>
                  </div>
                ))}
            </details>
          )}
        </TabsContent>
        {!readOnly && (
          <TabsContent value="google" className="rounded-2xl border p-5 space-y-3 max-w-xl">
            <h3 className="font-serif text-lg">Sua semana também no Google Agenda</h3>
            <p className="text-sm text-muted-foreground">
              Baixe a semana e importe o arquivo .ics nas configurações do Google Agenda, em
              “Importar e exportar”. Os horários e títulos seguem juntos; suas anotações e reflexões
              ficam aqui.
            </p>
            <Button variant="outline" disabled={loading || !!error} onClick={exportWeek}>
              <Download className="w-4 h-4 mr-2" />
              Exportar esta semana (.ics)
            </Button>
            <p className="text-xs text-muted-foreground">
              É uma cópia da semana, sem sincronização automática. A conexão direta com a conta
              Google ainda precisa ser configurada.
            </p>
          </TabsContent>
        )}
      </Tabs>
      {notice && (
        <p role="status" className="text-sm text-primary">
          {notice}
        </p>
      )}
      {error && !editing && !selected && (
        <p role="alert" className="text-sm text-destructive">
          {error}{' '}
          <Button size="sm" variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </p>
      )}
      <Dialog
        open={!!editing || !!selected}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setEditing(null)
            setSelected(null)
            setError('')
          }
        }}
      >
        <DialogContent className="rounded-2xl max-h-[90vh]">
          <DialogTitle className="font-serif text-xl">
            {editing ? 'Um momento para mim' : selected?.title}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Visualização dos passos compartilhados.'
              : editing
                ? 'Uma anotação curta já basta. Só você vê este momento.'
                : 'Ajuste o momento ao seu ritmo.'}
          </DialogDescription>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                void run(() => saveNote(editing, editingId))
              }}
            >
              <label className="block text-sm">
                O que cabe aqui?
                <Input
                  autoFocus
                  required
                  maxLength={160}
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Uma tarefa, uma pausa, algo gostoso…"
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-sm">
                  Começa
                  <Input
                    required
                    type="datetime-local"
                    value={localDateInput(editing.starts_at)}
                    onChange={(e) => updateTime('starts_at', e.target.value)}
                    onInput={(e) => updateTime('starts_at', e.currentTarget.value)}
                  />
                </label>
                <label className="text-sm">
                  Termina
                  <Input
                    required
                    type="datetime-local"
                    value={localDateInput(editing.ends_at)}
                    onChange={(e) => updateTime('ends_at', e.target.value)}
                    onInput={(e) => updateTime('ends_at', e.currentTarget.value)}
                  />
                </label>
              </div>
              <fieldset className="flex gap-2">
                <legend className="sr-only">Tipo de momento</legend>
                {(
                  [
                    ['focus', 'Foco'],
                    ['rest', 'Descanso'],
                    ['life', 'Vida'],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-full px-3 py-2 text-sm border ${editing.kind === value ? colors[value] : 'border-border'}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="kind"
                      value={value}
                      checked={editing.kind === value}
                      onChange={() => setEditing({ ...editing, kind: value })}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <label className="block text-sm">
                Anotação (opcional)
                <Textarea
                  maxLength={5000}
                  value={editing.note}
                  onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                  placeholder="O que quero lembrar?"
                />
              </label>
              <Button type="submit" disabled={busy}>
                {busy ? 'Salvando…' : 'Guardar momento'}
              </Button>
            </form>
          )}
          {selected && !editing && (
            <div className="space-y-4 text-sm">
              {note && (
                <p className="whitespace-pre-wrap">
                  {note.note || 'Um espaço reservado na sua semana.'}
                </p>
              )}
              {step && (
                <>
                  <p>{step.context}</p>
                  <details>
                    <summary className="cursor-pointer text-primary">
                      Meu recurso · {step.resource_snapshot.title}
                    </summary>
                    <p className="mt-2">{step.resource_snapshot.lesson}</p>
                    <ol className="list-decimal pl-5 mt-2">
                      {step.resource_snapshot.instructions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                    {step.fallback && <p className="mt-2">Em um dia difícil: {step.fallback}</p>}
                  </details>
                </>
              )}
              {care?.safe_summary && <p>{care.safe_summary}</p>}
              {selected.start && (
                <p className="text-muted-foreground">
                  {new Date(selected.start).toLocaleString('pt-BR')}
                  {selected.end ? ` – ${clock(selected.end)}` : ''}
                </p>
              )}
              {selected.completed && <p className="text-primary">✓ Realizado</p>}
              {!readOnly && (
                <div className="flex flex-wrap gap-2">
                  {note && (
                    <>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          run(() =>
                            saveNote(
                              {
                                ...note,
                                status: note.status === 'completed' ? 'planned' : 'completed',
                              },
                              note.id,
                            ),
                          )
                        }
                      >
                        {note.status === 'completed' ? 'Reabrir' : 'Aconteceu'}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setEditing(note)
                          setEditingId(note.id)
                        }}
                      >
                        Editar
                      </Button>
                      <details className="p-2">
                        <summary className="cursor-pointer">Mais</summary>
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            run(() => saveNote({ ...note, status: 'archived' }, note.id))
                          }
                        >
                          Arquivar momento
                        </Button>
                      </details>
                    </>
                  )}
                  {step && !['completed', 'reviewed'].includes(step.status) && (
                    <Button
                      disabled={busy}
                      onClick={() => run(() => saveStep({ ...step, status: 'completed' }))}
                    >
                      Experimentei
                    </Button>
                  )}
                  {step && ['completed', 'reviewed'].includes(step.status) && (
                    <Link className="text-primary underline" to="/?etapa=evolucao">
                      Revisar na Evolução
                    </Link>
                  )}
                  {care &&
                    onCompleteCare &&
                    ['planned', 'active'].includes(care.status) &&
                    care.item_type !== 'contextual_resource' && (
                      <Button disabled={busy} onClick={() => run(() => onCompleteCare(care.id))}>
                        Aconteceu
                      </Button>
                    )}
                </div>
              )}
              {!readOnly &&
                ((step && !['completed', 'reviewed'].includes(step.status)) ||
                  (care &&
                    onRescheduleCare &&
                    ['planned', 'active'].includes(care.status) &&
                    care.item_type !== 'contextual_resource')) && (
                  <form
                    className="flex flex-wrap gap-2 items-end"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void run(async () => {
                        if (!moment || !Number.isFinite(Date.parse(moment)))
                          throw new Error('Escolha uma data e um horário.')
                        const iso = new Date(moment).toISOString()
                        if (step)
                          await saveStep({
                            ...step,
                            scheduled_at: iso,
                            status: step.status === 'paused' ? 'planned' : step.status,
                          })
                        else if (care && onRescheduleCare) await onRescheduleCare(care.id, iso)
                      })
                    }}
                  >
                    <label className="text-sm flex-1">
                      Reservar horário
                      <Input
                        required
                        type="datetime-local"
                        value={moment}
                        onChange={(e) => setMoment(e.target.value)}
                        onInput={(e) => setMoment(e.currentTarget.value)}
                      />
                    </label>
                    <Button variant="outline" type="submit" disabled={busy}>
                      Salvar horário
                    </Button>
                  </form>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
