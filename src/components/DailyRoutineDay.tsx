import React, { useEffect, useState } from 'react'
import {
  dailyRoutineService,
  type DailyRoutine,
  type DailyRoutineInput,
} from '@/services/dailyRoutine'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'

const blank = (enrollmentId: string): DailyRoutineInput => ({
  enrollment_id: enrollmentId,
  day_label: '',
  moments: [{ time: '', activity: '' }],
  access_class: 'participant_private',
})
export function DailyRoutineDay({
  enrollmentId,
  readOnly = false,
}: {
  enrollmentId: string
  readOnly?: boolean
}) {
  // A new identity discards pending UI work and prevents stale saves from crossing people.
  return (
    <RoutineDay
      key={`${enrollmentId}:${readOnly}`}
      enrollmentId={enrollmentId}
      readOnly={readOnly}
    />
  )
}
function RoutineDay({ enrollmentId, readOnly }: { enrollmentId: string; readOnly: boolean }) {
  const draftKey = `cer-current-day-draft-v1:${enrollmentId}`
  const [value, setValue] = useState(() => blank(enrollmentId))
  const [record, setRecord] = useState<DailyRoutine | null>(null)
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false)
  const [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [retry, setRetry] = useState(0),
    [loadError, setLoadError] = useState(false)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setLoadError(false)
    dailyRoutineService
      .load(enrollmentId, readOnly)
      .then((saved) => {
        if (!active) return
        setRecord(saved)
        let next = saved || blank(enrollmentId)
        if (!readOnly) {
          try {
            const raw = localStorage.getItem(draftKey)
            const draft = raw ? JSON.parse(raw) : null
            if (
              draft?.enrollment_id === enrollmentId &&
              Array.isArray(draft.moments) &&
              draft.moments.length <= 64 &&
              draft.moments.every(
                (m: { time?: unknown; activity?: unknown }) =>
                  typeof m?.time === 'string' && typeof m?.activity === 'string',
              ) &&
              typeof draft.day_label === 'string' &&
              ['participant_private', 'participant_shared'].includes(draft.access_class)
            ) {
              next = draft
              setMessage('Seu rascunho foi retomado. Salve para atualizar o registro no CER.')
            }
          } catch {
            setMessage(
              'O rascunho deste navegador não pôde ser lido. Seu registro salvo foi mantido.',
            )
          }
        }
        setValue(next)
      })
      .catch(() => {
        if (active) {
          setLoadError(true)
          setError(
            'Não foi possível carregar a rotina. Tente novamente; seus registros foram preservados.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, readOnly, draftKey, retry])
  function change(next: DailyRoutineInput) {
    setValue(next)
    setMessage('')
    try {
      localStorage.setItem(draftKey, JSON.stringify(next))
    } catch {
      setError('O navegador não guardou o rascunho. Use Salvar minha rotina antes de sair.')
    }
  }
  async function save() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const saved = await dailyRoutineService.save(value, record?.id)
      setRecord(saved)
      setValue(saved)
      try {
        localStorage.removeItem(draftKey)
      } catch {
        /* Server record remains saved. */
      }
      setMessage(
        saved.access_class === 'participant_shared'
          ? 'Rotina salva e compartilhada para os encontros.'
          : 'Rotina salva. Por enquanto, só você pode acessá-la.',
      )
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível salvar. Seu rascunho continua aqui.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      aria-label={readOnly ? 'Rotina atual compartilhada' : 'Minha rotina atual'}
      className="rounded-2xl border bg-card p-4 sm:p-6 space-y-5"
    >
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-primary">
          Antes de planejar, conhecer seu dia
        </p>
        <h2 className="font-serif text-2xl">
          {readOnly ? 'Um dia na vida da pessoa' : 'Minha rotina atual'}
        </h2>
        <p className="text-sm leading-relaxed">
          {readOnly
            ? 'Este é o dia que a pessoa escolheu compartilhar. Use-o como base para preparar os cuidados e conversar sobre uma rotina possível nos encontros.'
            : 'Como é um dia seu, de verdade? Conte do despertar até a hora de dormir: refeições, trabalho, deslocamentos, atividade física, cuidados, pausas e compromissos. Não precisa ser um dia ideal. Esse retrato será a base para o plano de cuidado; a nova rotina será combinada depois, no Planner.'}
        </p>
      </header>
      {loading ? (
        <p role="status">Carregando sua rotina…</p>
      ) : loadError && readOnly ? null : readOnly ? (
        record ? (
          <>
            <p className="font-medium">{record.day_label || 'Um dia da rotina atual'}</p>
            <ol aria-label="Momentos do dia compartilhado" className="space-y-3">
              {record.moments.map((m, i) => (
                <li key={i} className="flex gap-4 rounded-xl border p-3">
                  <span className="font-mono text-primary shrink-0">{m.time || 'Sem horário'}</span>
                  <p className="text-sm whitespace-pre-wrap break-words">{m.activity}</p>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="text-sm">A pessoa ainda não compartilhou um dia da sua rotina.</p>
        )
      ) : loadError ? (
        <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
          Tentar novamente
        </Button>
      ) : (
        <form
          aria-label="Um dia da minha vida"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <label className="block text-sm space-y-2">
              Qual dia você quer contar? <span className="text-muted-foreground">(opcional)</span>
              <Input
                maxLength={100}
                value={value.day_label}
                onChange={(e) => change({ ...value, day_label: e.target.value })}
                placeholder="Por exemplo: uma segunda-feira de trabalho"
              />
            </label>
            <details className="rounded-xl bg-primary/5 p-4 text-sm">
              <summary className="cursor-pointer">Ver um exemplo de dia</summary>
              <p className="my-2">Apenas uma inspiração para descrever o que você já faz.</p>
              <p>
                07:00 · Acordo e preparo o café
                <br />
                08:00 · Levo as crianças à escola
                <br />
                09:00 · Começo a trabalhar
                <br />
                12:30 · Almoço
                <br />
                14:00 · Retomo o trabalho
                <br />
                18:00 · Caminho por 20 minutos
                <br />
                19:30 · Janto
                <br />
                22:30 · Vou dormir
              </p>
            </details>
            <ol aria-label="Momentos do meu dia" className="space-y-3">
              {value.moments.map((moment, index) => (
                <li
                  key={index}
                  className="rounded-xl border-l-4 border-primary/30 bg-primary/5 p-3 sm:p-4 space-y-2"
                >
                  <div className="grid sm:grid-cols-[9rem_1fr] gap-3">
                    <label className="block text-sm space-y-2">
                      Horário {index + 1}
                      <Input
                        type="time"
                        value={moment.time}
                        onChange={(e) =>
                          change({
                            ...value,
                            moments: value.moments.map((m, i) =>
                              i === index ? { ...m, time: e.target.value } : m,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="block text-sm space-y-2">
                      O que faço nesse momento {index + 1}
                      <Textarea
                        maxLength={500}
                        value={moment.activity}
                        onChange={(e) =>
                          change({
                            ...value,
                            moments: value.moments.map((m, i) =>
                              i === index ? { ...m, activity: e.target.value } : m,
                            ),
                          })
                        }
                        placeholder={
                          index === 0
                            ? 'Como começa o seu dia?'
                            : 'Conte o que costuma acontecer neste momento.'
                        }
                      />
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      change({ ...value, moments: value.moments.filter((_, i) => i !== index) })
                    }
                  >
                    Retirar momento {index + 1}
                  </Button>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">
              Os horários podem ser aproximados ou ficar em branco. Mantenha a ordem do seu dia,
              mesmo se ele terminar depois da meia-noite.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={value.moments.length >= 64}
              onClick={() =>
                change({ ...value, moments: [...value.moments, { time: '', activity: '' }] })
              }
            >
              Adicionar momento do dia
            </Button>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.access_class === 'participant_shared'}
                onChange={(e) =>
                  change({
                    ...value,
                    access_class: e.target.checked ? 'participant_shared' : 'participant_private',
                  })
                }
              />
              Compartilhar minha rotina para os encontros.
            </label>
            <p className="text-xs text-muted-foreground">
              Só este registro será compartilhado. Os relatos privados de outras áreas continuam
              privados.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">{busy ? 'Salvando…' : 'Salvar minha rotina'}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  try {
                    localStorage.setItem(draftKey, JSON.stringify(value))
                    setMessage(
                      'Rascunho guardado neste navegador, só para você. Pode continuar depois.',
                    )
                  } catch {
                    setError('Não foi possível guardar o rascunho. Salve sua rotina antes de sair.')
                  }
                }}
              >
                Continuar depois
              </Button>
            </div>
          </fieldset>
        </form>
      )}
      {error && (
        <p role="alert">
          {error}
          {readOnly && (
            <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
              Tentar novamente
            </Button>
          )}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  )
}
