import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { LifeDirection } from '@/services/lifeDirections'
import {
  GOAL_HORIZONS,
  emptyGoalRoadmap,
  goalRoadmapService,
  type GoalHorizon,
  type GoalRoadmapRecord,
} from '@/services/goalRoadmap'
import { ResourceAgendaForm } from './ResourceAgendaForm'

export function GoalRoadmapPlanner({
  source,
  readOnly = false,
  strategies = [],
}: {
  source: LifeDirection
  readOnly?: boolean
  strategies?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState<GoalRoadmapRecord | null>(null)
  const [draft, setDraft] = useState(() => emptyGoalRoadmap(source))
  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!open) return
    let active = true
    setLoaded(false)
    setError('')
    setEditing(false)
    setStatus('')
    goalRoadmapService
      .load(source.enrollment_id, source.id)
      .then((record) => {
        if (!active) return
        setSaved(record)
        setDraft(record?.roadmap || emptyGoalRoadmap(source))
        setSharing(record?.access_class === 'participant_shared')
        setLoaded(true)
      })
      .catch(() => {
        if (active)
          setError(
            'Não conseguimos abrir suas metas agora. Os registros guardados continuam preservados.',
          )
      })
    return () => {
      active = false
    }
  }, [open, source.id, source.enrollment_id, retry])
  const updateMilestone = (horizon: GoalHorizon, field: string, value: string) =>
    setDraft((d) => ({
      ...d,
      milestones: d.milestones.map((m) => (m.horizon === horizon ? { ...m, [field]: value } : m)),
    }))
  const updateAction = (id: string, field: string, value: string) =>
    setDraft((d) => ({
      ...d,
      actions: d.actions.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }))
  async function save() {
    if (busy || readOnly) return
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const record = await goalRoadmapService.save(
        source,
        draft,
        sharing && source.access_class === 'participant_shared'
          ? 'participant_shared'
          : 'participant_private',
        saved,
      )
      setSaved(record)
      setDraft(record.roadmap)
      setEditing(false)
      setStatus(
        'Metas e ações guardadas. Escolha os horários abaixo para levar seus passos à agenda.',
      )
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível guardar. Seus campos continuam aqui.',
      )
    } finally {
      setBusy(false)
    }
  }
  function edit() {
    setDraft(
      saved?.roadmap || {
        ...emptyGoalRoadmap(source),
        milestones: [{ horizon: 'short', title: '', targetDate: '', signal: '' }],
      },
    )
    setEditing(true)
    setStatus('')
    setError('')
  }
  const roadmap = saved?.roadmap
  return (
    <details
      className="rounded-lg border border-primary/25 bg-primary/5 p-3"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer font-medium">Metas, ações e meu ritmo</summary>
      {open && (
        <div className="space-y-4 pt-3">
          <p className="text-sm">
            Seu futuro começa com passos que cabem na sua vida. Aqui você organiza a transformação
            desejada em metas com prazos, escolhe suas forças e reserva momentos para agir. A
            constância nasce de um ritmo possível; quando a rotina mudar, você pode ajustar o
            caminho com Daiane.
          </p>
          <p className="text-xs text-muted-foreground">
            Este percurso ajuda a construir o objetivo terapêutico em conjunto. Alimentação e outros
            cuidados entram no plano conforme sua disposição e o que for combinado.
          </p>
          {!loaded && !error && <p role="status">Abrindo suas metas…</p>}
          {error && (
            <div role="alert" className="text-sm text-destructive">
              {error}
              {!loaded && (
                <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
                  Tentar novamente
                </Button>
              )}
            </div>
          )}
          {status && (
            <p role="status" className="text-sm text-primary">
              {status}
            </p>
          )}
          {loaded && !editing && (
            <>
              {roadmap ? (
                <>
                  <p className="text-sm">
                    <strong>Transformação que quero construir: </strong>
                    {roadmap.objective}
                  </p>
                  {roadmap.capacity && (
                    <p className="text-sm whitespace-pre-wrap">
                      <strong>Meu ritmo possível: </strong>
                      {roadmap.capacity}
                    </p>
                  )}
                  {roadmap.resources && (
                    <p className="text-sm whitespace-pre-wrap">
                      <strong>Forças e apoios que escolhi: </strong>
                      {roadmap.resources}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {saved?.access_class === 'participant_shared' &&
                    source.access_class === 'participant_shared'
                      ? 'Metas e ações compartilhadas com Daiane'
                      : 'Metas e ações só para mim'}
                  </p>
                  {[...roadmap.milestones]
                    .sort(
                      (a, b) =>
                        Object.keys(GOAL_HORIZONS).indexOf(a.horizon) -
                        Object.keys(GOAL_HORIZONS).indexOf(b.horizon),
                    )
                    .map((m) => (
                      <section
                        key={m.horizon}
                        className="rounded-lg bg-background border p-3 space-y-2"
                      >
                        <h5 className="font-medium">
                          {GOAL_HORIZONS[m.horizon]} · {m.title}
                        </h5>
                        <p className="text-xs">
                          Até {new Date(`${m.targetDate}T12:00:00`).toLocaleDateString('pt-BR')}
                        </p>
                        {m.signal && (
                          <p className="text-sm">
                            <strong>Como vou reconhecer meu avanço: </strong>
                            {m.signal}
                          </p>
                        )}
                        {roadmap.actions
                          .filter((a) => a.horizon === m.horizon)
                          .map((a) => (
                            <div key={a.id} className="border-l-2 border-primary/40 pl-3 space-y-2">
                              <p className="text-sm font-medium">{a.title}</p>
                              {a.frequency && <p className="text-sm">Meu ritmo: {a.frequency}</p>}
                              {a.resource && (
                                <p className="text-sm whitespace-pre-wrap">
                                  Força que vou usar: {a.resource}
                                </p>
                              )}
                              {a.fallback && (
                                <p className="text-sm">Em um dia difícil: {a.fallback}</p>
                              )}
                              {!readOnly && (
                                <ResourceAgendaForm
                                  key={`${a.id}:${saved?.revision}`}
                                  enrollmentId={source.enrollment_id}
                                  strength={
                                    a.resource || roadmap.resources || 'Meus recursos pessoais'
                                  }
                                  difficulty={m.title}
                                  strategy={a.title}
                                  initialGoal={roadmap.objective}
                                  planningContext={[
                                    `Meta: ${m.title} · até ${m.targetDate}`,
                                    a.frequency && `Ritmo combinado: ${a.frequency}`,
                                    a.fallback && `Em um dia difícil: ${a.fallback}`,
                                  ]
                                    .filter(Boolean)
                                    .join('\n')}
                                />
                              )}
                            </div>
                          ))}
                        {!roadmap.actions.some((a) => a.horizon === m.horizon) && (
                          <p className="text-xs text-muted-foreground">
                            Você pode acrescentar as ações desta meta quando definir seus próximos
                            passos.
                          </p>
                        )}
                      </section>
                    ))}
                  {!readOnly && (
                    <p className="text-xs text-muted-foreground">
                      Salvar uma meta não ocupa horários automaticamente. Cada confirmação cria um
                      momento privado na agenda; para repetir a ação, reserve os outros dias ou
                      ajuste os momentos já criados por lá.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm">
                  {readOnly
                    ? 'Ainda não há metas e ações compartilhadas para esta direção.'
                    : 'Comece por uma meta próxima. Médio e longo prazo podem ganhar forma conforme o caminho ficar mais claro.'}
                </p>
              )}
              {!readOnly && (
                <Button size="sm" variant="outline" onClick={edit}>
                  {saved ? 'Ajustar metas e ações' : 'Construir minhas metas'}
                </Button>
              )}
            </>
          )}
          {loaded && editing && !readOnly && (
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-sm">
                Transformação que quero construir
                <Input
                  aria-label="Transformação do meu planejamento"
                  value={draft.objective}
                  maxLength={160}
                  onChange={(e) => setDraft((d) => ({ ...d, objective: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                O que desejo e consigo sustentar
                <Textarea
                  aria-label="Meu ritmo possível"
                  value={draft.capacity}
                  maxLength={5000}
                  onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                Forças e apoios que escolho usar
                <Textarea
                  aria-label="Forças do meu planejamento"
                  value={draft.resources}
                  maxLength={5000}
                  onChange={(e) => setDraft((d) => ({ ...d, resources: e.target.value }))}
                />
              </label>
              {draft.milestones.map((m) => (
                <section key={m.horizon} className="space-y-2 rounded-lg bg-background p-3 border">
                  <h5 className="font-medium">{GOAL_HORIZONS[m.horizon]}</h5>
                  <label className="block text-sm">
                    Minha meta
                    <Input
                      aria-label={`Meta de ${GOAL_HORIZONS[m.horizon].toLowerCase()}`}
                      value={m.title}
                      maxLength={160}
                      onChange={(e) => updateMilestone(m.horizon, 'title', e.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    Prazo que faz sentido
                    <Input
                      type="date"
                      aria-label={`Prazo de ${GOAL_HORIZONS[m.horizon].toLowerCase()}`}
                      value={m.targetDate}
                      onInput={(e) =>
                        updateMilestone(m.horizon, 'targetDate', e.currentTarget.value)
                      }
                      onChange={(e) => updateMilestone(m.horizon, 'targetDate', e.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    Sinal concreto de avanço
                    <Textarea
                      aria-label={`Sinal de avanço de ${GOAL_HORIZONS[m.horizon].toLowerCase()}`}
                      value={m.signal}
                      maxLength={2000}
                      onChange={(e) => updateMilestone(m.horizon, 'signal', e.target.value)}
                    />
                  </label>
                  {draft.milestones.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          milestones: d.milestones.filter((x) => x.horizon !== m.horizon),
                          actions: d.actions.filter((a) => a.horizon !== m.horizon),
                        }))
                      }
                    >
                      Retirar {GOAL_HORIZONS[m.horizon].toLowerCase()} e suas ações
                    </Button>
                  )}
                </section>
              ))}
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(GOAL_HORIZONS) as GoalHorizon[])
                  .filter((h) => !draft.milestones.some((m) => m.horizon === h))
                  .map((h) => (
                    <Button
                      key={h}
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          milestones: [
                            ...d.milestones,
                            { horizon: h, title: '', targetDate: '', signal: '' },
                          ],
                        }))
                      }
                    >
                      Acrescentar {GOAL_HORIZONS[h].toLowerCase()}
                    </Button>
                  ))}
              </div>
              <div className="space-y-3">
                <h5 className="font-medium">Ações que aproximam minhas metas</h5>
                <p className="text-sm">
                  Use uma força de forma concreta: organização para reservar uma pausa,
                  sensibilidade para perceber seus limites ou coragem para pedir apoio. As
                  estratégias escolhidas no jogo podem ajudar a construir esses passos.
                </p>
                {draft.actions.map((a, index) => (
                  <section key={a.id} className="rounded-lg border bg-background p-3 space-y-2">
                    <label className="block text-sm">
                      Meu passo possível
                      <Input
                        aria-label={`Ação ${index + 1}`}
                        value={a.title}
                        maxLength={160}
                        onChange={(e) => updateAction(a.id, 'title', e.target.value)}
                      />
                    </label>
                    <label className="block text-sm">
                      Meta que esta ação ajuda a alcançar
                      <select
                        className="block w-full rounded-md border bg-background p-2"
                        aria-label={`Meta da ação ${index + 1}`}
                        value={a.horizon}
                        onChange={(e) => updateAction(a.id, 'horizon', e.target.value)}
                      >
                        {draft.milestones.map((m) => (
                          <option key={m.horizon} value={m.horizon}>
                            {GOAL_HORIZONS[m.horizon]} · {m.title || 'Minha meta'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      Ritmo que cabe na minha rotina
                      <Input
                        aria-label={`Ritmo da ação ${index + 1}`}
                        placeholder="Por exemplo: dez minutos, duas vezes por semana"
                        value={a.frequency}
                        maxLength={240}
                        onChange={(e) => updateAction(a.id, 'frequency', e.target.value)}
                      />
                    </label>
                    <label className="block text-sm">
                      Força e como vou usá-la
                      <Textarea
                        aria-label={`Força da ação ${index + 1}`}
                        value={a.resource}
                        maxLength={2000}
                        onChange={(e) => updateAction(a.id, 'resource', e.target.value)}
                      />
                    </label>
                    {strategies.length > 0 && (
                      <details>
                        <summary className="text-xs cursor-pointer">
                          Escolher uma estratégia do meu jogo
                        </summary>
                        <div className="space-y-2 pt-2">
                          {strategies.map((s, i) => (
                            <Button
                              key={i}
                              size="sm"
                              variant="outline"
                              className="h-auto whitespace-normal text-left"
                              onClick={() => updateAction(a.id, 'resource', s)}
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      </details>
                    )}
                    <label className="block text-sm">
                      Versão menor para um dia difícil
                      <Input
                        aria-label={`Alternativa da ação ${index + 1}`}
                        value={a.fallback}
                        maxLength={2000}
                        onChange={(e) => updateAction(a.id, 'fallback', e.target.value)}
                      />
                    </label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDraft((d) => ({ ...d, actions: d.actions.filter((x) => x.id !== a.id) }))
                      }
                    >
                      Retirar ação {index + 1}
                    </Button>
                  </section>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={draft.actions.length >= 24 || !draft.milestones.length}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      actions: [
                        ...d.actions,
                        {
                          id: crypto.randomUUID(),
                          title: '',
                          horizon: d.milestones[0].horizon,
                          frequency: '',
                          resource: '',
                          fallback: '',
                        },
                      ],
                    }))
                  }
                >
                  Acrescentar uma ação
                </Button>
              </div>
              <label className="flex gap-2 items-start text-sm">
                <input
                  type="checkbox"
                  checked={sharing && source.access_class === 'participant_shared'}
                  disabled={source.access_class !== 'participant_shared'}
                  onChange={(e) => setSharing(e.target.checked)}
                />
                Compartilhar estas metas e ações com Daiane
              </label>
              {source.access_class !== 'participant_shared' && (
                <p className="text-xs text-muted-foreground">
                  O percurso fica só para você. Para compartilhar, compartilhe primeiro a direção no
                  registro acima.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                O jogo completo e as anotações da agenda permanecem privados. Ao mudar estas metas,
                os momentos que você já guardou na agenda continuam como foram criados.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>
                  {busy ? 'Guardando…' : 'Guardar metas e ações'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false)
                    setError('')
                  }}
                >
                  Voltar sem guardar
                </Button>
              </div>
            </fieldset>
          )}
        </div>
      )}
    </details>
  )
}
