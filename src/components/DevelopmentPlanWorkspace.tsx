import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IntegrativeCareComposer } from './IntegrativeCareComposer'
import { LifeGoalImport } from './LifeGoalImport'
import {
  isCareChapter,
  goalFromLifeDirection,
  addCareAction,
  updateCareAction,
} from '@/services/integrativePlan'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { DevelopmentPlanDocument } from './DevelopmentPlanDocument'
import { DevelopmentRoutineOrganizer } from './DevelopmentRoutineOrganizer'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import type { DevelopmentResource } from '@/services/developmentCatalog'
import { developmentPlanService } from '@/services/developmentPlanService'
import {
  emptyPlanDocument,
  newPlanAction,
  newPlanGoal,
  type PlanDocument,
  type PlanDraft,
  type PlanGoal,
  type PlanVersion,
  type PlanRoutine,
} from '@/services/developmentPlanDocument'

export function DevelopmentPlanWorkspace({
  enrollmentId,
  professional = false,
  participantName = 'você',
  resourceToAdd,
  onResourceAdded,
}: {
  enrollmentId: string
  professional?: boolean
  participantName?: string
  resourceToAdd?: DevelopmentResource
  onResourceAdded?: () => void
}) {
  const [draft, setDraft] = useState<PlanDraft | null>(null),
    [document, setDocument] = useState<PlanDocument>(emptyPlanDocument),
    [notes, setNotes] = useState('')
  const [versions, setVersions] = useState<PlanVersion[]>([]),
    [routines, setRoutines] = useState<PlanRoutine[]>([]),
    [resources, setResources] = useState<DevelopmentResource[]>([])
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [saveState, setSaveState] = useState(''),
    [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [retry, setRetry] = useState(0)
  const currentDraft = useRef<PlanDraft | null>(null),
    content = useRef({ document, notes }),
    savedSignature = useRef(''),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    mounted = useRef(true),
    ready = useRef(false)
  const professionalRef = useRef(professional)
  const addedResource = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (
      !professional ||
      loading ||
      !ready.current ||
      !resourceToAdd ||
      addedResource.current === resourceToAdd.id
    )
      return
    addedResource.current = resourceToAdd.id
    const currentCare = content.current.document.goals.find(isCareChapter)
    if (currentCare?.actions.some((a) => a.resource?.id === resourceToAdd.id)) {
      setNotice(
        'Este recurso já está no rascunho do cuidado. Você pode revisar sua orientação ali.',
      )
      onResourceAdded?.()
      return
    }
    if ((currentCare?.actions.length || 0) >= 12) {
      setError(
        'O capítulo de cuidado já tem 12 orientações. Revise o que cabe neste ciclo antes de acrescentar outra.',
      )
      onResourceAdded?.()
      return
    }
    setDocument((old) => {
      const next = addCareAction(old, resourceToAdd.title)
      const action = next.goals.find(isCareChapter)!.actions.at(-1)!
      return updateCareAction(next, action.id, {
        resource: resourceToAdd,
        context: resourceToAdd.instructions.join('\n'),
      })
    })
    onResourceAdded?.()
    setNotice(
      'Recurso acrescentado ao rascunho do cuidado. Revise a orientação e combine a prática antes de organizar no Planner.',
    )
  }, [resourceToAdd, professional, loading, onResourceAdded])
  content.current = { document, notes }
  useEffect(() => {
    mounted.current = true
    ready.current = false
    Promise.all([
      professional ? developmentPlanService.draft(enrollmentId) : Promise.resolve(null),
      developmentPlanService.versions(enrollmentId),
      developmentPlanService.routines(enrollmentId),
    ])
      .then(([d, v, r]) => {
        if (!mounted.current) return
        currentDraft.current = d
        setDraft(d)
        const value = d?.document || emptyPlanDocument()
        setDocument(value)
        setNotes(d?.private_notes || '')
        savedSignature.current = JSON.stringify({ document: value, notes: d?.private_notes || '' })
        setVersions(v)
        setRoutines(r)
        ready.current = true
        setError('')
      })
      .catch(() => {
        if (mounted.current)
          setError(
            'Não foi possível carregar o Plano de Desenvolvimento. Tente novamente; os registros existentes foram preservados.',
          )
      })
      .finally(() => {
        if (mounted.current) setLoading(false)
      })
    return () => {
      mounted.current = false
    }
  }, [enrollmentId, professional, retry])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (professionalRef.current && JSON.stringify(content.current) !== savedSignature.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  const persist = useCallback(async (): Promise<PlanDraft> => {
    const snapshot = JSON.parse(JSON.stringify(content.current)) as typeof content.current
    const signature = JSON.stringify(snapshot)
    const work = queue.current
      .catch(() => undefined)
      .then(async () => {
        if (signature === savedSignature.current && currentDraft.current)
          return currentDraft.current
        if (mounted.current) {
          setSaveState('Salvando rascunho privado…')
          setError('')
        }
        const value = await developmentPlanService.save(
          enrollmentId,
          snapshot.document,
          snapshot.notes,
          currentDraft.current,
        )
        currentDraft.current = value
        savedSignature.current = signature
        if (mounted.current) {
          setDraft(value)
          setSaveState('Rascunho privado salvo. Você pode continuar depois.')
        }
        return value
      })
    queue.current = work
    try {
      return await work
    } catch (e) {
      if (mounted.current) {
        setSaveState('Não salvo')
        setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
      }
      throw e
    }
  }, [enrollmentId])
  useEffect(() => {
    if (
      !professional ||
      !ready.current ||
      JSON.stringify({ document, notes }) === savedSignature.current
    )
      return
    setSaveState('Alterações aguardando salvamento…')
    setConfirmed(false)
    const timer = setTimeout(() => {
      void persist().catch(() => undefined)
    }, 900)
    return () => clearTimeout(timer)
  }, [document, notes, professional, persist])
  useEffect(
    () => () => {
      if (
        professional &&
        ready.current &&
        JSON.stringify(content.current) !== savedSignature.current
      )
        void persist().catch(() => undefined)
    },
    [professional, persist],
  )
  async function refreshShared() {
    const [v, r] = await Promise.all([
      developmentPlanService.versions(enrollmentId),
      developmentPlanService.routines(enrollmentId),
    ])
    if (mounted.current) {
      setVersions(v)
      setRoutines(r)
    }
  }
  async function share(stage: PlanVersion['stage']) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (stage === 'agreed' && !confirmed)
        throw new Error('Confirmem a leitura e as ações antes de combinar esta versão.')
      const saved = await persist()
      // A stage change is a new document revision, even when its text is unchanged.
      let value = saved
      if (versions.some((v) => v.draft_id === saved.id && v.revision === saved.revision)) {
        value = await developmentPlanService.save(
          enrollmentId,
          saved.document,
          saved.private_notes,
          saved,
        )
        currentDraft.current = value
        setDraft(value)
      }
      await developmentPlanService.share(value, stage)
      await refreshShared()
      setReading(true)
      setConfirmed(false)
      setNotice(
        stage === 'agreed'
          ? 'Plano combinado. Agora vocês podem organizar a rotina.'
          : 'Versão compartilhada para construir nas sessões. As próximas edições continuam privadas até compartilhar novamente.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível compartilhar.')
    } finally {
      setBusy(false)
    }
  }
  function updateGoal(id: string, patch: Partial<PlanGoal>) {
    setDocument((old) => ({
      ...old,
      goals: old.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))
  }
  async function loadResources() {
    setError('')
    try {
      const result = await selfDevelopmentService.catalog()
      setResources(result.resources)
      if (result.warning) setError(result.warning)
    } catch {
      setError('Não foi possível carregar a Biblioteca. Você pode continuar escrevendo o plano.')
    }
  }
  const latest = versions[0]
  if (loading) return <p role="status">Carregando Plano de Desenvolvimento…</p>
  if (!ready.current)
    return (
      <div role="alert" className="border rounded-xl p-4 space-y-3">
        <p>{error}</p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true)
            setRetry((r) => r + 1)
          }}
        >
          Tentar novamente
        </Button>
      </div>
    )
  return (
    <section
      aria-label={
        professional ? 'Construção do Plano de Desenvolvimento' : 'Meu Plano de Desenvolvimento'
      }
      className="space-y-5"
    >
      <header className="rounded-2xl border bg-primary/5 p-5 sm:p-7 space-y-3">
        <p className="text-xs uppercase tracking-widest text-primary">
          Compreender · combinar · experimentar
        </p>
        <h2 className="font-serif text-2xl">
          {professional
            ? `Plano de Desenvolvimento · ${participantName}`
            : 'Meu Plano de Desenvolvimento'}
        </h2>
        <p className="text-sm leading-relaxed">
          {professional
            ? 'Prepare o plano de cuidado com base no Mapa CER e nas avaliações. Depois, conversem sobre a meta principal, ajustem os cuidados e combinem as ações que entrarão no Planner.'
            : 'Daiane prepara os cuidados para sustentar seu equilíbrio e a meta que você escolheu. Nas sessões, vocês ajustam a proposta, combinam o que faz sentido e organizam a rotina no Planner.'}
        </p>
        <ol className="flex flex-wrap gap-2 text-xs">
          <li className="rounded-full border bg-background px-3 py-2">
            1. Preparação profissional
          </li>
          <li className="rounded-full border bg-background px-3 py-2">2. Construção nas sessões</li>
          <li className="rounded-full border bg-background px-3 py-2">3. Rotina no Planner</li>
        </ol>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm">
          {notice}
        </p>
      )}
      {professional ? (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">
              {draft
                ? `Rascunho privado · revisão ${draft.revision}`
                : 'Seu primeiro rascunho privado'}
            </span>
            <Button variant="outline" disabled={busy} onClick={() => setReading((v) => !v)}>
              {reading ? 'Continuar editando' : 'Ler juntas'}
            </Button>
            <Button disabled={busy} onClick={() => void persist().catch(() => undefined)}>
              Salvar e continuar depois
            </Button>
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {saveState || 'O rascunho é salvo durante a edição. Somente você tem acesso a ele.'}
          </p>
          {reading ? (
            <div className="rounded-2xl border bg-card p-5 sm:p-8">
              <p className="text-xs mb-5 text-muted-foreground">
                Leitura do rascunho para a sessão. A interagente vê somente a última versão que você
                compartilhar.
              </p>
              <DevelopmentPlanDocument document={document} />
            </div>
          ) : (
            <fieldset
              disabled={busy}
              className="rounded-2xl border bg-card p-4 sm:p-7 space-y-7 min-w-0"
            >
              <label className="block space-y-2 text-sm font-medium">
                Título do plano
                <Input
                  maxLength={160}
                  value={document.title}
                  onChange={(e) => setDocument({ ...document, title: e.target.value })}
                />
              </label>
              <label className="block space-y-2">
                <span className="font-serif text-lg">Seu momento atual</span>
                <span className="block text-xs text-muted-foreground">
                  Sintetize o Mapa CER e o que foi compartilhado: dificuldades, forças e recursos.
                  Escreva apenas o que poderá ser lido juntas.
                </span>
                <Textarea
                  className="min-h-36"
                  maxLength={10000}
                  value={document.moment}
                  onChange={(e) => setDocument({ ...document, moment: e.target.value })}
                  placeholder="A partir do que você compartilhou, compreendemos que…"
                />
              </label>
              <label className="block space-y-2">
                <span className="font-serif text-lg">Prioridades de equilíbrio e cuidado</span>
                <span className="block text-xs text-muted-foreground">
                  Defina as necessidades de cuidado e tratamento que emergem do mapa, seus objetivos
                  e o que acompanhar. Apresente uma proposta individualizada para conversar na
                  sessão.
                </span>
                <Textarea
                  maxLength={10000}
                  value={document.priorities}
                  onChange={(e) => setDocument({ ...document, priorities: e.target.value })}
                />
              </label>
              <IntegrativeCareComposer
                document={document}
                onChange={setDocument}
                resources={resources}
                onLoadResources={() => {
                  if (!resources.length) void loadResources()
                }}
              />
              <section className="space-y-4">
                <h3 className="font-serif text-xl">2. Uma meta principal, ações combinadas</h3>
                <LifeGoalImport
                  key={enrollmentId}
                  enrollmentId={enrollmentId}
                  onChoose={(value) => {
                    if (
                      document.goals.some((g) => !isCareChapter(g)) &&
                      !window.confirm(
                        'Usar esta meta como foco do rascunho? As versões já compartilhadas e rotinas existentes ficam preservadas.',
                      )
                    )
                      return
                    setDocument({
                      ...document,
                      goals: [
                        ...document.goals.filter(isCareChapter),
                        goalFromLifeDirection(value),
                      ],
                    })
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Uma meta principal concentra o esforço deste ciclo. Os cuidados sustentam o
                  equilíbrio; estas ações aproximam a pessoa da conquista. Combinem possibilidades
                  reais e organizem os horários depois.
                </p>
                {document.goals
                  .filter((g) => !isCareChapter(g))
                  .map((goal, index) => (
                    <fieldset key={goal.id} className="border rounded-2xl p-4 sm:p-5 space-y-4">
                      <legend className="font-semibold px-2">Meta {index + 1}</legend>
                      <label className="block space-y-1 text-sm">
                        Mudança que queremos alcançar
                        <Input
                          maxLength={5000}
                          value={goal.title}
                          onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
                          placeholder="Ex.: ter espaço para descanso durante a semana"
                        />
                      </label>
                      <label className="block space-y-1 text-sm">
                        Como perceberemos avanço
                        <Textarea
                          maxLength={5000}
                          value={goal.progress}
                          onChange={(e) => updateGoal(goal.id, { progress: e.target.value })}
                          placeholder="Que sinais concretos vamos observar, sem cobrar perfeição?"
                        />
                      </label>
                      {goal.actions.map((action, ai) => (
                        <div
                          key={action.id}
                          className="border-l-2 pl-4 border-primary/30 space-y-3"
                        >
                          <h4 className="text-sm font-semibold">Ação {ai + 1}</h4>
                          <label className="block space-y-1 text-sm">
                            O que vamos experimentar
                            <Input
                              maxLength={5000}
                              value={action.title}
                              onChange={(e) =>
                                updateGoal(goal.id, {
                                  actions: goal.actions.map((a) =>
                                    a.id === action.id ? { ...a, title: e.target.value } : a,
                                  ),
                                })
                              }
                              placeholder="Ex.: preparar o encerramento do trabalho"
                            />
                          </label>
                          <label className="block space-y-1 text-sm">
                            Como isso pode acontecer na vida prática
                            <Textarea
                              maxLength={5000}
                              value={action.context}
                              onChange={(e) =>
                                updateGoal(goal.id, {
                                  actions: goal.actions.map((a) =>
                                    a.id === action.id ? { ...a, context: e.target.value } : a,
                                  ),
                                })
                              }
                              placeholder="Descrevam o passo, o apoio necessário e as condições que precisam ser respeitadas."
                            />
                          </label>
                          <label className="block space-y-1 text-sm">
                            Se ficar difícil (opcional)
                            <Textarea
                              maxLength={5000}
                              value={action.fallback}
                              onChange={(e) =>
                                updateGoal(goal.id, {
                                  actions: goal.actions.map((a) =>
                                    a.id === action.id ? { ...a, fallback: e.target.value } : a,
                                  ),
                                })
                              }
                            />
                          </label>
                          <details className="text-sm">
                            <summary
                              className="cursor-pointer text-primary"
                              onClick={() => {
                                if (!resources.length) void loadResources()
                              }}
                            >
                              Vincular apoio da Biblioteca (opcional)
                            </summary>
                            <label className="block mt-2">
                              Recurso para esta ação
                              <select
                                className="block w-full border rounded-lg p-2 bg-background"
                                value={action.resource?.id || ''}
                                onChange={(e) => {
                                  const resource = resources.find((r) => r.id === e.target.value)
                                  updateGoal(goal.id, {
                                    actions: goal.actions.map((a) =>
                                      a.id === action.id ? { ...a, resource } : a,
                                    ),
                                  })
                                }}
                              >
                                <option value="">Sem recurso vinculado</option>
                                {action.resource &&
                                  !resources.some((r) => r.id === action.resource?.id) && (
                                    <option value={action.resource.id}>
                                      {action.resource.title}
                                    </option>
                                  )}
                                {resources.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </details>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Retirar esta ação do rascunho? As versões compartilhadas e rotinas existentes serão preservadas.',
                                )
                              )
                                updateGoal(goal.id, {
                                  actions: goal.actions.filter((a) => a.id !== action.id),
                                })
                            }}
                          >
                            Retirar ação do rascunho
                          </Button>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={goal.actions.length >= 12}
                          onClick={() =>
                            updateGoal(goal.id, { actions: [...goal.actions, newPlanAction()] })
                          }
                        >
                          Acrescentar ação
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              window.confirm(
                                'Retirar esta meta do rascunho? As versões compartilhadas e rotinas existentes serão preservadas.',
                              )
                            )
                              setDocument({
                                ...document,
                                goals: document.goals.filter((g) => g.id !== goal.id),
                              })
                          }}
                        >
                          Retirar meta do rascunho
                        </Button>
                      </div>
                    </fieldset>
                  ))}
                <Button
                  variant="outline"
                  disabled={document.goals.some((g) => !isCareChapter(g))}
                  onClick={() =>
                    setDocument({ ...document, goals: [...document.goals, newPlanGoal()] })
                  }
                >
                  Definir meta principal
                </Button>
              </section>
              <label className="block space-y-2">
                <span className="font-serif text-lg">Nosso próximo encontro</span>
                <span className="block text-xs text-muted-foreground">
                  O que experimentar, observar e conversar na próxima sessão? Inclua a data se já
                  estiver combinada.
                </span>
                <Textarea
                  maxLength={10000}
                  value={document.next_session}
                  onChange={(e) => setDocument({ ...document, next_session: e.target.value })}
                />
              </label>
            </fieldset>
          )}
          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Minhas anotações profissionais · privadas
            </summary>
            <label className="block text-sm mt-3">
              Anotações que não entram no documento compartilhado
              <Textarea
                className="mt-2"
                disabled={busy}
                maxLength={20000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </details>
          <div className="rounded-2xl border p-5 space-y-4">
            <h3 className="font-serif text-lg">Compartilhar no ritmo das sessões</h3>
            <p className="text-sm">
              Compartilhe a proposta de cuidado para conversar na sessão. Quando os cuidados, a meta
              principal e as ações estiverem combinados, disponibilize a organização da rotina. Você
              pode retomar e revisar o plano depois.
            </p>
            <Button disabled={busy} variant="outline" onClick={() => void share('building')}>
              Compartilhar para construir nas sessões
            </Button>
            <label className="flex gap-2 text-sm items-start">
              <input
                type="checkbox"
                disabled={busy}
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>
                Lemos juntas esta versão e combinamos os cuidados, a meta principal e as ações para
                experimentar.
              </span>
            </label>
            <Button disabled={busy || !confirmed} onClick={() => void share('agreed')}>
              {busy ? 'Salvando…' : 'Compartilhar plano combinado'}
            </Button>
          </div>
        </>
      ) : latest ? (
        <div className="border rounded-2xl p-5 sm:p-8 bg-card space-y-5">
          <div className="flex flex-wrap gap-2 text-xs text-primary">
            <span>
              {latest.stage === 'building'
                ? 'Em construção nas sessões'
                : 'Combinado para experimentar'}
            </span>
            <span>
              · revisão {latest.revision} · {new Date(latest.created).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <DevelopmentPlanDocument document={latest.document} />
        </div>
      ) : (
        <div className="rounded-2xl border p-6 space-y-2">
          <h3 className="font-serif text-lg">Vamos construir seu plano juntas</h3>
          <p className="text-sm">
            Daiane está preparando a proposta a partir do seu percurso. Vocês vão conversar sobre
            cuidados, sua meta principal e as ações possíveis nas sessões. Quando ela compartilhar,
            o plano aparecerá aqui.
          </p>
          <Link className="text-sm underline text-primary" to="/?etapa=evolucao">
            Voltar à minha trajetória
          </Link>
        </div>
      )}
      {latest && (
        <>
          {professional && (
            <details className="rounded-xl border p-4">
              <summary className="cursor-pointer text-sm">
                Conferir o que está visível para {participantName}
              </summary>
              <div className="mt-5">
                <DevelopmentPlanDocument document={latest.document} />
              </div>
            </details>
          )}
          {latest.stage === 'building' && (
            <p className="text-sm rounded-xl bg-muted/30 p-4">
              O plano está em construção. Os novos horários serão organizados quando vocês
              combinarem as ações. Rotinas anteriores continuam como estavam até serem revistas.
            </p>
          )}
          <DevelopmentRoutineOrganizer
            key={latest.id}
            version={latest}
            versions={versions}
            routines={routines}
            onSaved={refreshShared}
          />
        </>
      )}
      {versions.length > 1 && (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer text-sm">
            Versões compartilhadas anteriores ({versions.length - 1})
          </summary>
          <div className="mt-4 space-y-3">
            {versions.slice(1).map((version) => (
              <details key={version.id} className="border rounded-xl p-4">
                <summary className="cursor-pointer">
                  Revisão {version.revision} · {new Date(version.created).toLocaleString('pt-BR')} ·{' '}
                  {version.stage === 'agreed' ? 'Combinado' : 'Em construção'}
                </summary>
                <div className="mt-5">
                  <DevelopmentPlanDocument document={version.document} />
                </div>
              </details>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
