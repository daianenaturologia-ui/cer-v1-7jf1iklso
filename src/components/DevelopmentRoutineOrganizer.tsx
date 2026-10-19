import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { developmentPlanService } from '@/services/developmentPlanService'
import {
  dayInZone,
  routineEvents,
  validateRoutine,
  type PlanVersion,
  type PlanRoutine,
  type RoutineSchedule,
} from '@/services/developmentPlanDocument'
import { sundayOf } from '@/services/weeklyAgenda'

export const PLAN_TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Rio_Branco',
  'America/Noronha',
  'Europe/Lisbon',
  'UTC',
]
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
interface Choice {
  selected: boolean
  schedule: RoutineSchedule
  effectiveDay: string
  command: string
}
export function DevelopmentRoutineOrganizer({
  version,
  routines,
  versions,
  onSaved,
}: {
  version: PlanVersion
  routines: PlanRoutine[]
  versions: PlanVersion[]
  onSaved: () => Promise<void>
}) {
  const actions = version.document.goals.flatMap((g) =>
    g.actions.map((a) => ({ goal: g, action: a })),
  )
  const latest = useMemo(() => {
    const result = new Map<string, PlanRoutine>()
    for (const routine of [...routines].sort(
      (a, b) =>
        b.effective_day.localeCompare(a.effective_day) || b.created.localeCompare(a.created),
    ))
      if (!result.has(routine.action_id)) result.set(routine.action_id, routine)
    return result
  }, [routines])
  const [choices, setChoices] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(
      actions.map(({ action }) => {
        const current = [...routines]
          .filter((r) => r.action_id === action.id)
          .sort(
            (a, b) =>
              b.effective_day.localeCompare(a.effective_day) || b.created.localeCompare(a.created),
          )[0]
        const schedule = current?.schedule || {
          days: [],
          time: '09:00',
          duration: 30,
          timezone: 'America/Sao_Paulo',
        }
        return [
          action.id,
          {
            selected: false,
            schedule,
            effectiveDay: dayInZone(new Date(), schedule.timezone),
            command: crypto.randomUUID(),
          },
        ]
      }),
    ),
  )
  const [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [completed, setCompleted] = useState<string[]>([])
  const selected = actions.filter(({ action }) => choices[action.id]?.selected)
  function update(id: string, patch: Partial<Choice>) {
    setChoices((old) => ({ ...old, [id]: { ...old[id], ...patch, command: crypto.randomUUID() } }))
    setPreview(false)
    setCompleted([])
    setError('')
    setNotice('')
  }
  function prepare() {
    setError('')
    try {
      if (!selected.length) throw new Error('Escolha ao menos uma ação para organizar.')
      for (const { action } of selected) {
        const c = choices[action.id]
        validateRoutine(c.schedule, c.effectiveDay)
        if (c.effectiveDay < dayInZone(new Date(), c.schedule.timezone))
          throw new Error('As mudanças começam hoje ou em uma data futura.')
      }
      setPreview(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confira os horários.')
    }
  }
  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    const done = [...completed]
    try {
      for (const { action } of selected) {
        if (done.includes(action.id)) continue
        const c = choices[action.id]
        await developmentPlanService.schedule(
          version,
          action.id,
          c.schedule,
          c.effectiveDay,
          true,
          c.command,
        )
        done.push(action.id)
        setCompleted([...done])
      }
      await onSaved()
      setNotice('Rotina organizada. Os horários estão no Planner.')
      setPreview(false)
      setChoices((old) =>
        Object.fromEntries(
          Object.entries(old).map(([id, c]) => [
            id,
            { ...c, selected: false, command: crypto.randomUUID() },
          ]),
        ),
      )
      setCompleted([])
    } catch (e) {
      setError(
        `${done.length ? `${done.length} ação(ões) já salva(s). ` : ''}${e instanceof Error ? e.message : 'Não foi possível completar.'} Você pode tentar novamente; o que foi salvo será preservado.`,
      )
    } finally {
      setBusy(false)
    }
  }
  async function pause(routine: PlanRoutine) {
    const source = versions.find((v) => v.id === routine.version_id)
    if (!source) return
    setBusy(true)
    setError('')
    try {
      const today = dayInZone(new Date(), routine.schedule.timezone)
      const dates = new Set([
        today,
        ...routines
          .filter((r) => r.action_id === routine.action_id && r.effective_day > today)
          .map((r) => r.effective_day),
      ])
      for (const day of [...dates].sort())
        await developmentPlanService.schedule(
          source,
          routine.action_id,
          routine.schedule,
          day,
          false,
          crypto.randomUUID(),
        )
      await onSaved()
      setNotice('Rotina pausada a partir de hoje. As semanas anteriores foram preservadas.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível pausar.')
    } finally {
      setBusy(false)
    }
  }
  const proposed: PlanRoutine[] = selected.map(({ goal, action }) => ({
    id: `preview-${action.id}`,
    enrollment_id: version.enrollment_id,
    version_id: version.id,
    action_id: action.id,
    effective_day: choices[action.id].effectiveDay,
    enabled: true,
    schedule: choices[action.id].schedule,
    snapshot: { goal: goal.title, progress: goal.progress, action },
    command_key: choices[action.id].command,
    created: '9999',
  }))
  const firstDay = selected.map(({ action }) => choices[action.id].effectiveDay).sort()[0]
  const previewWeek = sundayOf(firstDay ? new Date(firstDay + 'T12:00:00') : new Date())
  const events = preview ? routineEvents([...routines, ...proposed], previewWeek) : []
  return (
    <section
      aria-label="Organizar minha rotina"
      className="space-y-5 rounded-2xl border p-4 sm:p-6"
    >
      <div>
        <h3 className="font-serif text-xl">Organizar minha rotina</h3>
        <p className="text-sm text-muted-foreground">
          Escolham as ações que cabem agora. A rotina se repete semanalmente a partir da data
          escolhida; vocês podem pausar ou reorganizar depois.
        </p>
      </div>
      {version.stage === 'agreed' && (
        <>
          {actions.map(({ goal, action }) => {
            const c = choices[action.id]
            return (
              <fieldset key={action.id} disabled={busy} className="border rounded-xl p-4 space-y-3">
                <legend className="sr-only">{action.title}</legend>
                <label className="flex gap-2 items-start">
                  <input
                    type="checkbox"
                    checked={c.selected}
                    onChange={(e) => update(action.id, { selected: e.target.checked })}
                  />
                  <span>
                    <strong>{action.title}</strong>
                    <span className="block text-xs text-muted-foreground">Para: {goal.title}</span>
                  </span>
                </label>
                {c.selected && (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{action.context}</p>
                    <div className="flex flex-wrap gap-2">
                      {dayNames.map((name, index) => (
                        <label key={name} className="rounded-lg border p-2 text-sm">
                          <input
                            type="checkbox"
                            className="mr-1"
                            checked={c.schedule.days.includes(index)}
                            onChange={(e) =>
                              update(action.id, {
                                schedule: {
                                  ...c.schedule,
                                  days: e.target.checked
                                    ? [...c.schedule.days, index].sort()
                                    : c.schedule.days.filter((d) => d !== index),
                                },
                              })
                            }
                          />
                          {name}
                        </label>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="text-sm">
                        Horário
                        <Input
                          type="time"
                          value={c.schedule.time}
                          onChange={(e) =>
                            update(action.id, { schedule: { ...c.schedule, time: e.target.value } })
                          }
                        />
                      </label>
                      <label className="text-sm">
                        Duração em minutos
                        <Input
                          type="number"
                          min={5}
                          max={240}
                          value={c.schedule.duration}
                          onChange={(e) =>
                            update(action.id, {
                              schedule: { ...c.schedule, duration: Number(e.target.value) },
                            })
                          }
                        />
                      </label>
                      <label className="text-sm">
                        A partir de
                        <Input
                          type="date"
                          min={dayInZone(new Date(), c.schedule.timezone)}
                          value={c.effectiveDay}
                          onChange={(e) => update(action.id, { effectiveDay: e.target.value })}
                        />
                      </label>
                      <label className="text-sm">
                        Fuso horário
                        <select
                          className="block w-full border rounded-lg p-2 bg-background"
                          value={c.schedule.timezone}
                          onChange={(e) =>
                            update(action.id, {
                              schedule: { ...c.schedule, timezone: e.target.value },
                            })
                          }
                        >
                          {PLAN_TIMEZONES.map((z) => (
                            <option key={z}>{z}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </>
                )}
              </fieldset>
            )
          })}
          {!preview ? (
            <Button disabled={busy} onClick={prepare}>
              Conferir minha semana
            </Button>
          ) : (
            <div className="rounded-xl bg-primary/5 p-4 space-y-3">
              <h4 className="font-semibold">Antes de confirmar</h4>
              <p className="text-sm">
                {selected.length} ação(ões) selecionada(s). Ações com datas diferentes começam em
                suas próprias semanas. Os horários abaixo são exibidos no fuso deste dispositivo.
              </p>
              <ul className="text-sm space-y-2">
                {selected.map(({ action }) => {
                  const c = choices[action.id]
                  return (
                    <li key={action.id}>
                      <strong>{action.title}</strong>:{' '}
                      {c.schedule.days.map((d) => dayNames[d]).join(', ')} às {c.schedule.time},{' '}
                      {c.schedule.duration} min · {c.schedule.timezone} · a partir de{' '}
                      {c.effectiveDay.split('-').reverse().join('/')}
                    </li>
                  )
                })}
              </ul>
              <details>
                <summary className="cursor-pointer text-sm">
                  Ver a primeira semana com as rotinas existentes
                </summary>
                <ul className="text-sm mt-2">
                  {events.map((event) => (
                    <li key={event.id}>
                      {new Date(event.start).toLocaleString('pt-BR')} · {event.title}
                    </li>
                  ))}
                </ul>
              </details>
              <p className="text-xs">
                Outros compromissos continuam no Planner. Confiram possíveis sobreposições antes de
                reservar novos horários.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={() => void confirm()}>
                  {busy ? 'Organizando…' : 'Confirmar rotina no Planner'}
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => setPreview(false)}>
                  Ajustar escolhas
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      {[...latest.values()].some((r) => r.enabled) && (
        <details>
          <summary className="cursor-pointer font-medium">Rotinas já organizadas</summary>
          <p className="text-xs mt-2">
            Revisar o plano não altera a agenda automaticamente. Pause aqui o que deixou de fazer
            sentido.
          </p>
          {[...latest.values()]
            .filter((r) => r.enabled)
            .map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap gap-2 justify-between border-b py-3 text-sm"
              >
                <span>
                  {r.snapshot.action.title} · {r.schedule.days.map((d) => dayNames[d]).join(', ')} ·{' '}
                  {r.schedule.time} ({r.schedule.timezone})
                </span>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void pause(r)}>
                  Pausar rotina
                </Button>
              </div>
            ))}
        </details>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-primary">
          {notice}{' '}
          <Link to="/planner" className="underline">
            Abrir Planner
          </Link>
        </p>
      )}
    </section>
  )
}
