import { RoutineReflection } from './RoutineReflection'
import { PrintablePlannerWeek } from './PrintablePlannerWeek'
import { developmentPlanService } from '@/services/developmentPlanService'
import { routineEvents, type PlanRoutine } from '@/services/developmentPlanDocument'
import { ResourceMaterial } from '@/components/ResourceMaterial'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sun, Leaf, Sparkles, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PlannerGentleGuide } from '@/components/PlannerGentleGuide'
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
  sundayOf,
  moveDay,
  localDateInput,
  eventsOnDay,
  eventLanes,
  weekIcs,
  type AgendaEvent,
} from '@/services/weeklyAgenda'
import type { CerPlannerItemRecord } from '@/types/cer'

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
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
  const [week, setWeek] = useState(() => sundayOf(new Date()))
  const [agendaView, setAgendaView] = useState('agenda')
  const [expanded, setExpanded] = useState(false)
  const agendaRef = useRef<HTMLDivElement>(null)
  const [notes, setNotes] = useState<PlannerNote[]>([])
  const [routines, setRoutines] = useState<PlanRoutine[]>([])
  const [routineError, setRoutineError] = useState('')
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
    setRoutines([])
    setRoutineError('')
    setEditing(null)
    setSelected(null)
    setError('')
    setLoading(true)
    Promise.all([
      readOnly ? Promise.resolve([]) : plannerNotesService.list(enrollmentId),
      selfDevelopmentService.list(enrollmentId),
      developmentPlanService.routines(enrollmentId).catch(() => {
        if (active)
          setRoutineError('Não foi possível carregar as rotinas do Plano de Desenvolvimento.')
        return []
      }),
    ])
      .then(([n, s, r]) => {
        if (active) {
          setNotes(n)
          setRoutines(r)
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
      ...routineEvents(routines, week).map((event) => ({
        ...event,
        completed: steps.some(
          (s) => s.resource_snapshot.id === event.id && s.status === 'reviewed',
        ),
      })),
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
        .filter(
          (s) =>
            s.scheduled_at &&
            s.status !== 'paused' &&
            !s.resource_snapshot.id.startsWith('routine:'),
        )
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
    [notes, steps, careItems, routines, week],
  )
  const days = Array.from({ length: 7 }, (_, i) => moveDay(week, i))
  const firstHour = 0,
    lastHour = 24
  const slots = Array.from(
    { length: (lastHour - firstHour) * 2 },
    (_, i) => firstHour * 60 + i * 30,
  )
  useEffect(() => {
    if (!loading && agendaRef.current) {
      const viewport = agendaRef.current
      const row = viewport.querySelector<HTMLElement>('[data-agenda-slot]')
      viewport.scrollTop = 12 * (row?.getBoundingClientRect().height || 12)
    }
  }, [loading, week, expanded, agendaView])
  const note = selected?.id.startsWith('note:')
    ? notes.find((n) => `note:${n.id}` === selected.id)
    : undefined
  const step = selected?.id.startsWith('step:')
    ? steps.find((s) => `step:${s.id}` === selected.id)
    : undefined
  const care = selected?.id.startsWith('care:')
    ? careItems.find((c) => `care:${c.id}` === selected.id)
    : undefined
  const routine = selected?.id.startsWith('routine:')
    ? routines.find((r) => selected.id.startsWith(`routine:${r.id}:`))
    : undefined
  const unscheduled = steps.filter(
    (s) =>
      (!s.scheduled_at || s.status === 'paused') && !['reviewed', 'completed'].includes(s.status),
  )
  const contextual = careItems.filter(
    (c) => !c.scheduled_at && !['cancelled', 'superseded', 'completed'].includes(c.status),
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
      <PrintablePlannerWeek days={days} events={events} />
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <h2 className="font-serif text-lg">Uma semana que cabe na sua vida</h2>
        <p className="text-xs text-muted-foreground">
          {readOnly
            ? 'Somente os passos que a pessoa escolheu compartilhar.'
            : 'Foco, descanso e tempo para viver gostosamente.'}
        </p>
      </div>
      {routineError && (
        <p role="alert" className="text-sm text-destructive">
          {routineError}{' '}
          <Button size="sm" variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </p>
      )}
      <Tabs value={agendaView} onValueChange={setAgendaView}>
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
                  setWeek(sundayOf(new Date()))
                }}
              >
                Hoje
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              aria-pressed={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? 'Ver semana compacta' : 'Ampliar agenda'}
            </Button>
            <Button
              variant="outline"
              disabled={loading || !!error || !!routineError}
              onClick={() => window.print()}
            >
              Imprimir minha semana
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Domingo a sábado · foco inicial das 6h às 23h. Role para outros horários e, em telas
            menores, para os lados.{!readOnly && ' Clique em um horário para reservar um momento.'}
          </p>
          {loading ? (
            <p role="status">Carregando sua semana…</p>
          ) : (
            <div
              ref={agendaRef}
              role="region"
              aria-label="Semana completa, domingo a sábado; role para outros horários"
              tabIndex={0}
              className="rounded-xl border overflow-auto overscroll-contain bg-card"
              style={
                {
                  '--agenda-focus-height': 'clamp(340px, calc(100dvh - 290px), 540px)',
                  '--agenda-slot': expanded ? '28px' : 'calc(var(--agenda-focus-height) / 36)',
                  height: 'calc(var(--agenda-focus-height) + 38px)',
                } as React.CSSProperties
              }
            >
              <div style={{ minWidth: 608 }}>
                <div
                  className="grid sticky top-0 z-30 bg-card border-b h-[38px]"
                  style={{ gridTemplateColumns: `48px repeat(${days.length},minmax(0,1fr))` }}
                >
                  <div className="sticky left-0 bg-card z-40" />
                  {days.map((d, i) => (
                    <div key={i} className="py-1 text-center text-xs border-l">
                      <span className="text-muted-foreground">{dayNames[i]}</span>
                      <span
                        className={`ml-1 inline-flex w-7 h-7 items-center justify-center rounded-full ${d.toDateString() === new Date().toDateString() ? 'bg-primary text-primary-foreground' : 'bg-muted/40'}`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex" style={{ height: 'calc(var(--agenda-slot) * 48)' }}>
                    <div className="sticky left-0 z-20 bg-card w-12 shrink-0 text-[10px] text-muted-foreground">
                      {slots.map((m, i) => (
                        <div
                          key={m}
                          style={{ height: 'var(--agenda-slot)' }}
                          className="pr-2 text-right"
                        >
                          {i % 2 === 0 ? `${String(Math.floor(m / 60)).padStart(2, '0')}:00` : ''}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-1 min-w-0">
                      {days.map((day) => (
                        <div key={day.toISOString()} className="relative flex-1 min-w-0 border-l">
                          {slots.map((minutes) => (
                            <button
                              key={minutes}
                              data-agenda-slot
                              disabled={readOnly}
                              aria-label={`${day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 ? '30' : '00'}`}
                              style={{ height: 'var(--agenda-slot)' }}
                              className={`block w-full text-left hover:bg-primary/5 focus-visible:bg-primary/10 focus-visible:outline-primary ${minutes % 60 ? 'border-b border-dashed border-border/30' : 'border-b border-border/50'} disabled:hover:bg-transparent`}
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
                            const top = ((begin - day.getTime()) / 86400000) * 100
                            return (
                              <button
                                key={event.id}
                                onClick={() => openEvent(event)}
                                title={`${clock(event.start)} · ${event.title}`}
                                aria-label={`${event.title}, ${clock(event.start)}${event.completed ? ', realizado' : ''}`}
                                className={`absolute z-10 rounded-sm border px-1 py-0 text-left text-[10px] leading-[11px] overflow-hidden hover:brightness-95 focus-visible:ring-2 ring-primary ${colors[event.kind]} ${event.completed ? 'opacity-65' : ''}`}
                                style={{
                                  top: `${top}%`,
                                  height: `${((finish - begin) / 86400000) * 100}%`,
                                  minHeight: 'var(--agenda-slot)',
                                  left: `calc(${(lane / lanes) * 100}% + 2px)`,
                                  width: `calc(${100 / lanes}% - 4px)`,
                                }}
                              >
                                <span className="font-medium block truncate">
                                  {event.completed ? '✓ ' : ''}
                                  {event.title}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
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
            <Link to="/?etapa=equilibrio" className="text-sm text-primary underline">
              Abrir meu Plano de Desenvolvimento
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
              {routine && (
                <div className="space-y-3">
                  <p className="text-xs text-primary">
                    Do Plano de Desenvolvimento · rotina semanal
                  </p>
                  <p>
                    <strong>Para: </strong>
                    {routine.snapshot.goal}
                  </p>
                  <p className="whitespace-pre-wrap">{routine.snapshot.action.context}</p>
                  {routine.snapshot.action.fallback && (
                    <p>Se ficar difícil: {routine.snapshot.action.fallback}</p>
                  )}
                  {routine.snapshot.action.resource && (
                    <details>
                      <summary className="cursor-pointer">
                        Apoio · {routine.snapshot.action.resource.title}
                      </summary>
                      <p>{routine.snapshot.action.resource.lesson}</p>
                      <ResourceMaterial material={routine.snapshot.action.resource.material} />
                    </details>
                  )}
                  <p className="text-xs">
                    Horário combinado no fuso {routine.schedule.timezone}. A agenda exibe os
                    horários deste dispositivo.
                  </p>
                  {!readOnly && selected.start && (
                    <RoutineReflection
                      key={selected.id}
                      enrollmentId={enrollmentId}
                      routine={routine}
                      occurrence={selected.id}
                      start={selected.start}
                      onSaved={() => setRevision((v) => v + 1)}
                    />
                  )}
                  <Link className="underline text-primary" to="/?etapa=equilibrio">
                    Rever o plano e organizar a rotina
                  </Link>
                </div>
              )}
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
                    <ResourceMaterial material={step.resource_snapshot.material} />
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
      {!readOnly && <PlannerGentleGuide />}
    </section>
  )
}
