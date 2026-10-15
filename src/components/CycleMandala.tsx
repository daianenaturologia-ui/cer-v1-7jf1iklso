import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  cycleJournalService,
  CYCLE_CONTEXTS,
  EMOTIONS,
  SYMPTOMS,
  APPETITES,
  IMPACTS,
  localDay,
  dayDate,
  addDays,
  distanceDays,
  emptyCycleEntry,
  defaultCycleProfile,
  cyclePosition,
  lunarPhase,
  type CycleEntry,
  type CycleProfile,
} from '@/services/cycleJournal'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import { personalCareResource } from '@/services/carePlanFlow'
import './CycleMandala.css'

const emotionColors: Record<string, string> = {
  Tranquila: '#9bbeb8',
  Alegre: '#e5c778',
  Triste: '#9ca9c9',
  Irritada: '#cf9d85',
  Ansiosa: '#b0a0bf',
  Sensível: '#d5b2bd',
  Entusiasmada: '#d5b077',
  Introspectiva: '#afbc9b',
  Outra: '#bdb7af',
}
const energyLabels = ['Sem registro', 'Muito baixa', 'Baixa', 'Moderada', 'Alta', 'Muito alta']
const dateLabel = (day: string) =>
  dayDate(day).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
function Choice({
  label,
  values,
  value,
  onChange,
  multiple = false,
}: {
  label: string
  values: string[]
  value: string | string[]
  onChange: (v: string) => void
  multiple?: boolean
}) {
  return (
    <fieldset className="cycle-field">
      <legend>{label}</legend>
      <div className="cycle-choices">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={multiple ? (value as string[]).includes(v) : value === v}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
function Ring({
  days,
  entries,
  selected,
  onSelect,
}: {
  days: string[]
  entries: CycleEntry[]
  selected: string
  onSelect: (day: string) => void
}) {
  const n = days.length
  const point = (r: number, a: number) => `${250 + r * Math.cos(a)},${250 + r * Math.sin(a)}`
  const sector = (r: number, R: number, i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + 0.012
    const b = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n - 0.012
    return `M${point(r, a)} L${point(R, a)} A${R},${R} 0 ${b - a > Math.PI ? 1 : 0},1 ${point(R, b)} L${point(r, b)} A${r},${r} 0 ${b - a > Math.PI ? 1 : 0},0 ${point(r, a)} Z`
  }
  return (
    <svg
      viewBox="0 0 500 500"
      className="cycle-ring"
      role="group"
      aria-label="Mandala diária: energia, emoções e corpo"
    >
      <circle cx="250" cy="250" r="238" fill="none" stroke="#d9cdbb" strokeDasharray="2 6" />
      {days.map((day, i) => {
        const e = entries.find((v) => v.day === day)
        const future = day > localDay()
        const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n
        return (
          <g
            key={day}
            role="button"
            tabIndex={future ? -1 : 0}
            aria-disabled={future}
            aria-label={`${dateLabel(day)}: ${e ? `energia ${energyLabels[e.energy]}, ${e.emotions.join(', ') || 'emoções sem registro'}` : 'sem registro'}${day === selected ? ', selecionado' : ''}`}
            onClick={() => !future && onSelect(day)}
            onKeyDown={(event) => {
              if (!future && ['Enter', ' '].includes(event.key)) {
                event.preventDefault()
                onSelect(day)
              }
            }}
            className={`cycle-petal ${day === selected ? 'selected' : ''} ${future ? 'future' : ''}`}
          >
            <title>
              {dateLabel(day)} · {lunarPhase(day).name}
              {e ? ` · ${e.bleeding || 'fluxo não registrado'}` : ''}
            </title>
            <path
              d={sector(80, 130, i)}
              fill={e?.energy ? `hsl(39 45% ${90 - e.energy * 9}%)` : '#f1eee9'}
            />
            <path
              d={sector(132, e?.emotions.length === 2 ? 155 : 180, i)}
              fill={e?.emotions[0] ? emotionColors[e.emotions[0]] : '#f1eee9'}
            />
            {e?.emotions.length === 2 && (
              <path d={sector(157, 180, i)} fill={emotionColors[e.emotions[1]]} />
            )}
            <path
              d={sector(182, 215, i)}
              fill={
                !e?.symptoms.length
                  ? '#f1eee9'
                  : e.symptoms.includes('Sem desconforto')
                    ? '#c6d3c4'
                    : '#dca896'
              }
            />
            {e?.bleeding && ['Leve', 'Moderado', 'Intenso'].includes(e.bleeding) && (
              <circle
                cx={250 + 195 * Math.cos(a)}
                cy={250 + 195 * Math.sin(a)}
                r="3"
                fill="#9c4545"
              />
            )}
            {n < 45 && (
              <text
                x={250 + 226 * Math.cos(a)}
                y={254 + 226 * Math.sin(a)}
                textAnchor="middle"
                fontSize="11"
                fill="#5a554b"
              >
                {dayDate(day).getDate()}
              </text>
            )}
            {n < 45 && (
              <text
                x={250 + 245 * Math.cos(a)}
                y={254 + 245 * Math.sin(a)}
                textAnchor="middle"
                fontSize="10"
                aria-hidden="true"
              >
                {lunarPhase(day).symbol}
              </text>
            )}
          </g>
        )
      })}
      <circle cx="250" cy="250" r="75" fill="#faf7f1" />
      <text x="250" y="239" textAnchor="middle" fontFamily="serif" fontSize="20" fill="#6a5940">
        Meu ritmo
      </text>
      <text x="250" y="265" textAnchor="middle" fontSize="13" fill="#746c60">
        {dateLabel(selected)}
      </text>
    </svg>
  )
}
export function CycleMandala({
  enrollmentId,
  readOnly = false,
}: {
  enrollmentId: string
  readOnly?: boolean
}) {
  const [profile, setProfile] = useState<CycleProfile>(defaultCycleProfile(enrollmentId))
  const [entries, setEntries] = useState<CycleEntry[]>([])
  const [selected, setSelected] = useState(localDay())
  const [draft, setDraft] = useState<CycleEntry>(emptyCycleEntry(enrollmentId))
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [settings, setSettings] = useState(false)
  const [mode, setMode] = useState<'cycle' | 'month'>('cycle')
  const [month, setMonth] = useState(localDay().slice(0, 7))
  const [reflectionOpen, setReflectionOpen] = useState(false)
  const [schedule, setSchedule] = useState('')
  const [careAdded, setCareAdded] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(false)
    setError('')
    setEntries([])
    setDraft(emptyCycleEntry(enrollmentId))
    setProfile(defaultCycleProfile(enrollmentId))
    setSelected(localDay())
    setDirty(false)
    setMessage('')
    setReflectionOpen(false)
    setCareAdded(false)
    setSettings(false)
    Promise.all([
      cycleJournalService.list(enrollmentId),
      readOnly
        ? Promise.resolve(defaultCycleProfile(enrollmentId))
        : cycleJournalService.profile(enrollmentId),
    ])
      .then(([values, p]) => {
        if (active) {
          setEntries(values)
          setProfile(p)
          setDraft(values.find((v) => v.day === localDay()) || emptyCycleEntry(enrollmentId))
          setSettings(!p.id && !readOnly)
        }
      })
      .catch(() => {
        if (active) {
          setLoadError(true)
          setError(
            'Não foi possível carregar a mandala. Seus registros não foram substituídos. Tente novamente; se persistir, o acompanhamento pode precisar de atualização pela equipe.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, readOnly, retry])
  const choose = (day: string) => {
    if (busy) return
    if (dirty && !window.confirm('Há alterações ainda não salvas. Deseja sair deste registro?'))
      return
    if (day < start || day > end) {
      setMonth(day.slice(0, 7))
      setMode('month')
    }
    setSelected(day)
    setDraft(entries.find((v) => v.day === day) || emptyCycleEntry(enrollmentId, day))
    setDirty(false)
    setMessage('')
    setError('')
    setReflectionOpen(false)
    setCareAdded(false)
    setSchedule('')
  }
  function patch<K extends keyof CycleEntry>(key: K, value: CycleEntry[K]) {
    setDraft((v) => ({ ...v, [key]: value }))
    setDirty(true)
    setMessage('')
    setCareAdded(false)
  }
  async function save() {
    setBusy(true)
    setError('')
    try {
      const saved = await cycleJournalService.save(draft)
      setEntries((v) => [...v.filter((e) => e.day !== saved.day), saved])
      setDraft(saved)
      setDirty(false)
      setMessage(
        saved.access_class === 'participant_shared'
          ? 'Registro salvo e compartilhado com sua profissional.'
          : 'Registro salvo. Só você pode vê-lo.',
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível salvar. Seu preenchimento continua aqui.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function saveProfile() {
    setBusy(true)
    setError('')
    try {
      setProfile(await cycleJournalService.saveProfile(profile))
      setSettings(false)
      setMessage('Preferências salvas.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar suas preferências.')
    } finally {
      setBusy(false)
    }
  }
  async function addCare() {
    if (!draft.care.trim()) return
    setBusy(true)
    setError('')
    try {
      await selfDevelopmentService.save({
        enrollment_id: enrollmentId,
        direction_id: '',
        resource_snapshot: personalCareResource(),
        goal: draft.need.trim() || 'Respeitar meu ritmo',
        action: draft.care.trim(),
        context: `Cuidado escolhido ao observar meu ritmo em ${dateLabel(selected)}`,
        fallback: 'Adaptar conforme minha disposição no dia.',
        signal: 'Observar se o cuidado ajudou.',
        scheduled_at: schedule ? new Date(schedule).toISOString() : '',
        reflection: '',
        next_step: '',
        status: 'planned',
        access_class: 'participant_private',
      })
      setCareAdded(true)
      setMessage(
        schedule
          ? 'Cuidado adicionado ao seu plano e ao Planner.'
          : 'Cuidado adicionado ao seu plano. Você pode agendá-lo depois.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível organizar este cuidado.')
    } finally {
      setBusy(false)
    }
  }
  const anchors = entries
    .filter((v) => v.period_start && v.day <= localDay())
    .sort((a, b) => a.day.localeCompare(b.day))
  const anchor = anchors.at(-1)
  const canCycle =
    !readOnly &&
    anchor &&
    !['menopause', 'pregnancy', 'postpartum', 'hormonal'].includes(profile.context) &&
    distanceDays(anchor.day, localDay()) < 90
  const start = mode === 'cycle' && canCycle ? anchor.day : `${month}-01`
  const end =
    mode === 'cycle' && canCycle
      ? localDay()
      : localDay(new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0))
  const days = Array.from({ length: Math.max(1, distanceDays(start, end) + 1) }, (_, i) =>
    addDays(start, i),
  )
  const moon = lunarPhase(selected)
  const position = cyclePosition(entries, profile, selected)
  const scopedEntries = entries.filter((v) => v.day >= start && v.day <= end)
  if (loading) return <p role="status">Carregando seu ritmo…</p>
  if (loadError)
    return (
      <div role="alert" className="cycle-card">
        <p>{error}</p>
        <Button onClick={() => setRetry((v) => v + 1)}>Tentar novamente</Button>
      </div>
    )
  return (
    <section
      className="cycle-mandala"
      aria-label={readOnly ? 'Mandala compartilhada' : 'Meu ciclo, meu ritmo'}
    >
      <header className="cycle-heading">
        <div>
          <p className="cycle-eyebrow">Mandala CER</p>
          <h2>{readOnly ? 'Ritmo compartilhado' : 'Meu ciclo, meu ritmo'}</h2>
          <p>
            {readOnly
              ? 'Somente os dias que a pessoa escolheu compartilhar. Lacunas não significam ausência de sintomas.'
              : 'Um encontro com seu corpo, suas emoções e a natureza.'}
          </p>
        </div>
        {!readOnly && (
          <Button variant="outline" onClick={() => setSettings((v) => !v)} disabled={busy}>
            Meu momento de vida
          </Button>
        )}
      </header>
      {error && (
        <p role="alert" className="cycle-feedback">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="cycle-feedback">
          {message}
        </p>
      )}
      {settings && !readOnly && (
        <div className="cycle-card">
          <h3>Como você está vivendo seu ciclo?</h3>
          <label className="cycle-field">
            Meu momento
            <select
              value={profile.context}
              onChange={(e) =>
                setProfile((v) => ({ ...v, context: e.target.value as CycleProfile['context'] }))
              }
            >
              {Object.entries(CYCLE_CONTEXTS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {profile.context === 'natural' && (
            <label className="cycle-field">
              Duração habitual, se você souber
              <input
                type="number"
                min="21"
                max="45"
                placeholder="Não sei"
                value={profile.cycle_length || ''}
                onChange={(e) =>
                  setProfile((v) => ({ ...v, cycle_length: Number(e.target.value) }))
                }
              />
              <small>
                Do início de uma menstruação ao início da próxima. Pode deixar em branco.
              </small>
            </label>
          )}
          <label className="cycle-check">
            <input
              type="checkbox"
              checked={profile.lunar_reflections}
              onChange={(e) => setProfile((v) => ({ ...v, lunar_reflections: e.target.checked }))}
            />
            Quero convites simbólicos de conexão com a lua
          </label>
          <label className="cycle-check">
            <input
              type="checkbox"
              checked={profile.planner_reminders}
              onChange={(e) => setProfile((v) => ({ ...v, planner_reminders: e.target.checked }))}
            />
            Quero um lembrete de escuta do corpo no Planner
          </label>
          <p className="text-sm">
            Preferências privadas. Você pode acompanhar seu ritmo em qualquer momento da vida. Fases
            estimadas aparecem apenas em ciclos espontâneos com duração informada.
          </p>
          <Button onClick={saveProfile} disabled={busy}>
            Salvar preferências
          </Button>
        </div>
      )}
      <div className="cycle-layout">
        <div className="cycle-card cycle-visual">
          <div className="cycle-choices">
            <button
              aria-pressed={mode === 'cycle' && !!canCycle}
              onClick={() => setMode('cycle')}
              disabled={!canCycle}
            >
              Ciclo atual
            </button>
            <button aria-pressed={mode === 'month' || !canCycle} onClick={() => setMode('month')}>
              Por mês
            </button>
            <label>
              Mês
              <input
                aria-label="Mês da mandala"
                type="month"
                value={month}
                onChange={(e) => {
                  if (e.target.value) {
                    setMonth(e.target.value)
                    setMode('month')
                  }
                }}
              />
            </label>
          </div>
          <Ring days={days} entries={entries} selected={selected} onSelect={choose} />
          <p className="cycle-legend">
            <span>● Energia: intensidade do dourado</span>
            <span>● Emoções: uma cor para cada emoção percebida</span>
            <span>● Corpo: verde para “Sem desconforto” / terracota com sintomas</span>
            <span>• Ponto vinho: fluxo menstrual</span>
            <span>Cinza: sem registro. Toque em um dia para ver os detalhes.</span>
          </p>
          <details>
            <summary>Cores das emoções</summary>
            <div className="cycle-choices">
              {EMOTIONS.map((v) => (
                <span key={v} className="text-xs">
                  <span style={{ color: emotionColors[v] }}>●</span> {v}{' '}
                </span>
              ))}
            </div>
          </details>
          <p className="text-sm">
            {scopedEntries.length} dia(s) registrado(s) neste período.{' '}
            {mode === 'cycle' && canCycle
              ? 'Ciclo em andamento; o círculo cresce com seus registros.'
              : 'Visão por mês; seu ciclo pode atravessar meses.'}
          </p>
        </div>
        <div className="cycle-card">
          <label className="cycle-field">
            {readOnly ? 'Consultar dia' : 'Meu registro do dia'}
            <input
              aria-label="Dia do registro"
              type="date"
              value={selected}
              max={localDay()}
              disabled={busy}
              onChange={(e) => {
                if (e.target.value && e.target.value <= localDay()) choose(e.target.value)
              }}
            />
          </label>
          {!readOnly && (
            <p className="cycle-position">
              {position.day ? `Dia ${position.day} desde o início registrado · ` : ''}
              {position.label}
              {position.estimated && (
                <small>
                  Estimativa de calendário; não confirma ovulação e não serve como contracepção.
                </small>
              )}
            </p>
          )}
          {readOnly ? (
            <div className="space-y-3">
              {draft.id ? (
                <>
                  <p>Energia: {energyLabels[draft.energy]}</p>
                  <p>Emoções: {draft.emotions.join(', ') || 'Sem registro'}</p>
                  <p>
                    Corpo: {draft.symptoms.join(', ') || 'Sem sintomas marcados'}
                    {draft.intensity ? ` · intensidade ${draft.intensity}/3` : ''}
                  </p>
                  <p>Apetite: {draft.appetite || 'Sem registro'}</p>
                  <p>Impacto: {draft.impact || 'Sem registro'}</p>
                  <p>
                    Fluxo: {draft.bleeding || 'Sem registro'}
                    {draft.period_start ? ' · início da menstruação' : ''}
                  </p>
                  {[
                    ['Sono', draft.sleep],
                    ['Contexto', draft.context_note],
                    ['Reflexão', draft.reflection],
                    ['Necessidade', draft.need],
                    ['Cuidado', draft.care],
                    ['Resposta ao cuidado', draft.care_response],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <p className="whitespace-pre-wrap" key={label}>
                        <strong>{label}:</strong> {value}
                      </p>
                    ))}
                </>
              ) : (
                <p>Nenhum registro compartilhado neste dia.</p>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void save()
              }}
            >
              <fieldset disabled={busy} className="cycle-form">
                <Choice
                  label="Como está sua energia?"
                  values={energyLabels.slice(1)}
                  value={energyLabels[draft.energy]}
                  onChange={(v) =>
                    patch(
                      'energy',
                      draft.energy === energyLabels.indexOf(v) ? 0 : energyLabels.indexOf(v),
                    )
                  }
                />
                <Choice
                  label="Quais emoções percebe? Até duas"
                  values={EMOTIONS}
                  value={draft.emotions}
                  multiple
                  onChange={(v) =>
                    patch(
                      'emotions',
                      draft.emotions.includes(v)
                        ? draft.emotions.filter((s) => s !== v)
                        : draft.emotions.length < 2
                          ? [...draft.emotions, v]
                          : draft.emotions,
                    )
                  }
                />
                <Choice
                  label="Algum desconforto no corpo?"
                  values={SYMPTOMS}
                  value={draft.symptoms}
                  multiple
                  onChange={(v) => {
                    patch(
                      'symptoms',
                      draft.symptoms.includes(v)
                        ? draft.symptoms.filter((s) => s !== v)
                        : v === 'Sem desconforto'
                          ? [v]
                          : [...draft.symptoms.filter((s) => s !== 'Sem desconforto'), v],
                    )
                    if (v === 'Sem desconforto') patch('intensity', 0)
                  }}
                />
                {!!draft.symptoms.length && !draft.symptoms.includes('Sem desconforto') && (
                  <Choice
                    label="Intensidade do desconforto"
                    values={['Leve', 'Moderado', 'Forte']}
                    value={['', 'Leve', 'Moderado', 'Forte'][draft.intensity]}
                    onChange={(v) =>
                      patch('intensity', ['', 'Leve', 'Moderado', 'Forte'].indexOf(v))
                    }
                  />
                )}
                <Choice
                  label="Como está seu apetite?"
                  values={APPETITES}
                  value={draft.appetite}
                  onChange={(v) => patch('appetite', draft.appetite === v ? '' : v)}
                />
                <Choice
                  label="Isso interferiu no seu dia?"
                  values={IMPACTS}
                  value={draft.impact}
                  onChange={(v) => patch('impact', draft.impact === v ? '' : v)}
                />
                <Choice
                  label="Sangramento"
                  values={['Sem sangramento', 'Escape', 'Leve', 'Moderado', 'Intenso']}
                  value={draft.bleeding}
                  onChange={(v) => {
                    patch('bleeding', v)
                    if (!['Leve', 'Moderado', 'Intenso'].includes(v)) patch('period_start', false)
                  }}
                />
                {['Leve', 'Moderado', 'Intenso'].includes(draft.bleeding) && (
                  <label className="cycle-check">
                    <input
                      type="checkbox"
                      checked={draft.period_start}
                      onChange={(e) => patch('period_start', e.target.checked)}
                    />
                    Este foi o primeiro dia da menstruação
                  </label>
                )}
                <label className="cycle-field">
                  Do que preciso hoje? <small>Opcional</small>
                  <input
                    maxLength={5000}
                    value={draft.need}
                    onChange={(e) => patch('need', e.target.value)}
                    placeholder="Um intervalo, companhia, movimento…"
                  />
                </label>
                <details>
                  <summary>Quero aprofundar</summary>
                  {(
                    [
                      ['sleep', 'Como foi meu sono?'],
                      ['context_note', 'O que aconteceu no meu dia?'],
                      ['reflection', 'O que senti, aprendi ou me trouxe conexão?'],
                    ] as const
                  ).map(([key, label]) => (
                    <label className="cycle-field" key={key}>
                      {label}
                      <textarea
                        maxLength={5000}
                        rows={2}
                        value={draft[key]}
                        onChange={(e) => patch(key, e.target.value)}
                      />
                    </label>
                  ))}
                </details>
                <label className="cycle-field">
                  Um cuidado que escolho para mim <small>Opcional</small>
                  <textarea
                    maxLength={5000}
                    rows={2}
                    value={draft.care}
                    onChange={(e) => patch('care', e.target.value)}
                    placeholder="Uma ação possível para o meu momento"
                  />
                </label>
                {draft.care && (
                  <Choice
                    label="Se já experimentei, como foi?"
                    values={['Ajudou', 'Ajudou um pouco', 'Não percebi diferença', 'Me fez pior']}
                    value={draft.care_response}
                    onChange={(v) => patch('care_response', v)}
                  />
                )}
                <label className="cycle-check">
                  <input
                    type="checkbox"
                    checked={draft.access_class === 'participant_shared'}
                    onChange={(e) =>
                      patch(
                        'access_class',
                        e.target.checked ? 'participant_shared' : 'participant_private',
                      )
                    }
                  />
                  Compartilhar este dia com minha profissional
                </label>
                <small>
                  Inclui todos os campos deste dia. Desmarque e salve para retirar o
                  compartilhamento.
                </small>
                <div className="flex gap-2 flex-wrap">
                  <Button type="submit">{busy ? 'Salvando…' : 'Salvar meu registro'}</Button>
                  <Button type="submit" variant="outline">
                    Salvar e continuar depois
                  </Button>
                </div>
                <p className="text-xs">
                  Você pode pular campos. Alterações ficam salvas ao tocar em Salvar.
                </p>
                {draft.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          'Excluir este registro diário? Esta ação não pode ser desfeita.',
                        )
                      )
                        return
                      setBusy(true)
                      try {
                        await cycleJournalService.remove(draft)
                        setEntries((v) => v.filter((e) => e.id !== draft.id))
                        setDraft(emptyCycleEntry(enrollmentId, selected))
                        setDirty(false)
                        setMessage('Registro excluído.')
                      } catch {
                        setError('Não foi possível excluir. Tente novamente.')
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Excluir este dia
                  </Button>
                )}
              </fieldset>
            </form>
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="cycle-card">
          <h3>Meu corpo e a natureza</h3>
          <p>
            <span className="text-2xl" aria-hidden="true">
              {moon.symbol}
            </span>{' '}
            Lua {moon.name.toLowerCase()} · {dateLabel(selected)}
          </p>
          <p className="text-xs">Fase aproximada ao meio-dia no seu horário local.</p>
          <p>
            Observe a lua, escute seu corpo e descubra seu próprio ritmo. Seu ciclo não precisa
            coincidir com o céu para fazer parte da natureza.
          </p>
          {profile.lunar_reflections && (
            <>
              <Button variant="outline" onClick={() => setReflectionOpen((v) => !v)}>
                {reflectionOpen ? 'Fechar convite' : 'Já me observei · abrir convite da lua'}
              </Button>
              {reflectionOpen && (
                <div className="cycle-invitation">
                  <h4>{moon.theme.theme}</h4>
                  <p>{moon.theme.question}</p>
                  <p className="text-xs">
                    Um convite simbólico; não descreve como você deveria se sentir. Se quiser,
                    registre em “Quero aprofundar”.
                  </p>
                </div>
              )}
            </>
          )}
          <details>
            <summary>O que sabemos sobre lua e ciclo?</summary>
            <p>
              Alguns estudos encontraram associações pequenas ou temporárias, com alinhamentos
              diferentes entre populações. Menstruar na lua nova e ovular na cheia não é uma regra.
              A sincronização menstrual entre mulheres que convivem também não está estabelecida.
              Aqui, a lua é observação da natureza e simbolismo opcional.
            </p>
            <p className="text-sm">
              <a href="https://pubmed.ncbi.nlm.nih.gov/38598621/" target="_blank" rel="noreferrer">
                Pesquisa sobre ritmos menstruais (2024)
              </a>{' '}
              ·{' '}
              <a href="https://pubmed.ncbi.nlm.nih.gov/26181612/" target="_blank" rel="noreferrer">
                Pesquisa sobre convivência e ciclos
              </a>
            </p>
          </details>
          {anchors.length > 0 && (
            <details>
              <summary>Em que lua comecei a menstruar?</summary>
              <ul>
                {anchors.slice(-6).map((v) => (
                  <li key={v.day}>
                    {dateLabel(v.day)}: {lunarPhase(v.day).symbol} {lunarPhase(v.day).name}
                  </li>
                ))}
              </ul>
              <small>
                Coincidências observadas não demonstram causa nem permitem prever a ovulação.
              </small>
            </details>
          )}
        </div>
      )}
      {!readOnly && (
        <div className="cycle-card">
          <h3>Do que percebo ao cuidado possível</h3>
          <p>
            Escolha uma prática da Biblioteca CER ou leve o cuidado que escreveu para o seu plano.
            Você decide quando e como cabe na rotina.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/experimentos">Escolher na Biblioteca CER</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/?etapa=equilibrio">Meu plano de cuidado</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/planner">Abrir meu Planner</Link>
            </Button>
          </div>
          {draft.care.trim() && (
            <div className="cycle-invitation">
              <p className="whitespace-pre-wrap">{draft.care}</p>
              <label className="cycle-field">
                Quando quero experimentar? <small>Opcional</small>
                <input
                  type="datetime-local"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                />
              </label>
              <Button disabled={busy || dirty || careAdded} onClick={addCare}>
                {careAdded
                  ? 'Adicionado ao meu plano'
                  : schedule
                    ? 'Adicionar ao plano e ao Planner'
                    : 'Adicionar ao meu plano'}
              </Button>
              {dirty && <small>Salve o registro antes de levar este cuidado ao plano.</small>}
              <small>O cuidado entra privado; você escolhe o compartilhamento no plano.</small>
            </div>
          )}
        </div>
      )}
      <div className="cycle-card">
        <h3>Aprender com meu ritmo</h3>
        <p>
          {readOnly
            ? 'Converse sobre o contexto e o impacto dos dias compartilhados.'
            : 'Ao longo de dois ou três ciclos, observe repetições e diferenças. O que me ajudou? O que quero ajustar? Sono, estresse e acontecimentos também merecem atenção.'}
        </p>
        <details>
          <summary>Conhecer as quatro fases</summary>
          <p>
            Menstruação: sangramento após a queda hormonal. Folicular: desenvolvimento dos folículos
            e elevação do estradiol. Período ovulatório: liberação do óvulo após o pico de LH.
            Lútea: aumento de progesterona após a ovulação e queda hormonal antes da próxima
            menstruação, se não houver gestação.
          </p>
          <p>
            A menstruação faz parte do início da fase folicular; a divisão em quatro momentos
            facilita o aprendizado. Duração, energia, emoções e apetite variam. Nenhuma fase exige
            uma forma de sentir ou produzir.
          </p>
          <p>
            Na perimenopausa e em ciclos irregulares, priorizamos o que você registra. Na
            pós-menopausa, acompanhamos o ritmo de bem-estar sem atribuir fases ovarianas.
          </p>
          <a
            href="https://womenshealth.gov/menstrual-cycle/your-menstrual-cycle"
            target="_blank"
            rel="noreferrer"
          >
            Saiba mais sobre o ciclo menstrual
          </a>
        </details>
        <details>
          <summary>Prakriti, Vikriti e minha experiência</summary>
          <p>
            Sua profissional pode integrar a leitura tradicional ayurvédica ao que você vive. A
            constituição e a leitura do momento não determinam suas emoções nem permitem prever seus
            hormônios. Esta mandala não classifica doshas automaticamente.
          </p>
          <p>
            Que condições trouxeram estabilidade? Onde houve intensidade ou sobrecarga? Que descanso
            ou movimento foi confortável? Leve essas perguntas para sua conversa terapêutica.
          </p>
        </details>
        <p className="text-xs">
          Ferramenta de autopercepção e educação; não realiza diagnóstico. Dor ou sangramento que
          impeçam atividades merecem avaliação. Sangramento muito intenso com tontura ou falta de ar
          exige atendimento imediato.
        </p>
      </div>
    </section>
  )
}
