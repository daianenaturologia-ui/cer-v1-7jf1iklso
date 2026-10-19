import { ResourceMaterial } from '@/components/ResourceMaterial'
import { MATERIAL_FORMATS, filterLibrary } from '@/services/libraryMaterial'
import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { CerIntro } from '@/components/CerArtwork'
import {
  selfDevelopmentService,
  visibleDevelopment,
  type DevelopmentExperiment,
  type DevelopmentInput,
} from '@/services/selfDevelopment'
import type { DevelopmentResource } from '@/services/developmentCatalog'
import { lifeDirectionsService, type LifeDirection } from '@/services/lifeDirections'
import { isCareEpisode } from '@/services/careEpisode'
import { EPISODE_REVIEW_RESOURCE_ID } from '@/services/careEpisodeReview'

import {
  CARE_CATEGORIES,
  CARE_ORIGINS,
  isPersonalCare,
  personalCareResource,
  libraryCareResource,
  carePrioritySource,
} from '@/services/carePlanFlow'

const labels = {
  planned: 'Planejado',
  experimenting: 'Experimentando',
  paused: 'Pausado',
  completed: 'Pronto para revisar',
  reviewed: 'Aprendizado registrado',
}
export function SelfDevelopmentJourney({
  enrollmentId,
  mode = 'plan',
  readOnly = false,
  carePlan = false,
  libraryOnly = false,
  onPrepareCare,
  initialCareResource,
  onCareResourceOpened,
}: {
  enrollmentId: string
  mode?: 'plan' | 'play'
  readOnly?: boolean
  carePlan?: boolean
  libraryOnly?: boolean
  onPrepareCare?: (source: ReturnType<typeof carePrioritySource>) => void
  initialCareResource?: DevelopmentResource | null
  onCareResourceOpened?: () => void
}) {
  const canPrepareCare = !!onPrepareCare
  const [records, setRecords] = useState<DevelopmentExperiment[]>([])
  const [resources, setResources] = useState<DevelopmentResource[]>([])
  const [directions, setDirections] = useState<LifeDirection[]>([])
  const [editing, setEditing] = useState<DevelopmentInput | null>(null)
  const [editingId, setEditingId] = useState<string>()
  const [reviewing, setReviewing] = useState<string>()
  const [reflection, setReflection] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [message, setMessage] = useState('')
  const [revision, setRevision] = useState(0)
  const [showCatalog, setShowCatalog] = useState(libraryOnly)
  const [view, setView] = useState('plan')
  const [libraryQuery, setLibraryQuery] = useState('')
  const [libraryFormat, setLibraryFormat] = useState('all')
  const [libraryTheme, setLibraryTheme] = useState('all')
  useEffect(() => {
    let active = true
    setRecords([])
    setEditing(null)
    setReviewing(undefined)
    setLoading(true)
    setError('')
    setMessage('')
    selfDevelopmentService
      .list(enrollmentId)
      .then((values) => {
        if (active)
          setRecords(
            visibleDevelopment(values, enrollmentId, readOnly).filter(
              (v) =>
                !isCareEpisode(v) &&
                v.resource_snapshot?.id !== EPISODE_REVIEW_RESOURCE_ID &&
                (carePlan ? isPersonalCare(v) : true),
            ),
          )
      })
      .catch(() => {
        if (active)
          setError(
            'Não foi possível carregar seus passos. Tente novamente; seus registros não foram apagados.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    if (!readOnly || canPrepareCare)
      selfDevelopmentService.catalog().then((result) => {
        if (active) {
          setResources(result.resources)
          setWarning(result.warning || '')
        }
      })
    return () => {
      active = false
    }
  }, [enrollmentId, readOnly, revision, carePlan, canPrepareCare])
  const open = useCallback(
    async (resource: DevelopmentResource, previous?: DevelopmentExperiment) => {
      if (readOnly) {
        onPrepareCare?.(carePrioritySource(resource))
        setShowCatalog(false)
        return
      }
      setError('')
      setMessage('')
      setEditingId(undefined)
      setEditing({
        enrollment_id: enrollmentId,
        direction_id: previous?.direction_id || '',
        resource_snapshot: resource,
        goal: previous?.goal || '',
        action: previous?.next_step || '',
        context: '',
        fallback: resource.fallback,
        signal: '',
        scheduled_at: '',
        reflection: '',
        next_step: '',
        status: 'planned',
        access_class: 'participant_private',
      })
      setDirections([])
      try {
        setDirections(
          (await lifeDirectionsService.list(enrollmentId)).filter(
            (d) => d.kind === 'future' && d.enrollment_id === enrollmentId,
          ),
        )
      } catch {
        setWarning(
          'Você pode planejar sem vínculo. Seus registros de futuro não puderam ser carregados agora.',
        )
      }
    },
    [readOnly, onPrepareCare, enrollmentId],
  )
  useEffect(() => {
    if (initialCareResource && !readOnly) {
      void open(initialCareResource)
      onCareResourceOpened?.()
    }
  }, [initialCareResource, enrollmentId, readOnly, open, onCareResourceOpened])
  async function save(
    value: DevelopmentInput,
    id?: string,
    text = carePlan
      ? 'Prática pessoal salva e disponível no Planner. Sem horário, ele fica em “Sem horário”.'
      : 'Seu passo foi salvo. Ele já está disponível no Planner.',
  ) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const saved = await selfDevelopmentService.save(value, id)
      setRecords((old) => (id ? old.map((r) => (r.id === id ? saved : r)) : [saved, ...old]))
      setEditing(null)
      setShowCatalog(libraryOnly)
      if (value.status === 'reviewed') setView('learn')
      setReviewing(undefined)
      setMessage(text)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível salvar. Seu texto continua aqui para tentar novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  function patch<K extends keyof DevelopmentInput>(key: K, value: DevelopmentInput[K]) {
    setEditing((old) => (old ? { ...old, [key]: value } : old))
  }
  const visible = libraryOnly
    ? []
    : mode === 'play'
      ? records.filter((r) => !['reviewed', 'completed'].includes(r.status))
      : records.filter((r) =>
          view === 'learn'
            ? ['completed', 'reviewed'].includes(r.status)
            : !['completed', 'reviewed'].includes(r.status),
        )
  const readyToReview = records.filter((r) => r.status === 'completed').length
  return (
    <section
      className="rounded-xl border border-primary/30 p-4 sm:p-5 space-y-4"
      aria-label={
        libraryOnly
          ? 'Biblioteca CER'
          : carePlan
            ? readOnly
              ? 'Cuidados compartilhados pela pessoa'
              : 'Minhas práticas pessoais'
            : readOnly
              ? 'Desenvolvimento compartilhado'
              : 'Meu desenvolvimento'
      }
    >
      <CerIntro
        title={
          libraryOnly
            ? 'Biblioteca CER'
            : carePlan
              ? readOnly
                ? 'Cuidados que a pessoa compartilhou'
                : 'Minhas práticas pessoais'
              : readOnly
                ? 'Passos compartilhados'
                : mode === 'play'
                  ? 'Meus pequenos passos'
                  : 'Um desejo, um pequeno passo'
        }
        variant={mode === 'play' ? 'path' : 'seed'}
      >
        <p className="text-sm text-muted-foreground">
          {libraryOnly ? (
            'Um lugar para aprender, praticar e experimentar. Conheça os recursos para apoiar as ações combinadas com Daiane. Você também pode guardar uma prática pessoal.'
          ) : carePlan ? (
            readOnly ? (
              'Conheça a rotina que a pessoa compartilhou e revise o que fará parte da indicação profissional.'
            ) : (
              'Comece pelos cuidados que já fazem parte da sua vida. Escolha recursos da Biblioteca CER, ajuste ao seu ritmo e decida o que compartilhar com Daiane.'
            )
          ) : readOnly ? (
            <>
              Acompanhe o que a pessoa escolheu <strong>compartilhar.</strong>
            </>
          ) : (
            <>
              Escolha algo <strong>possível.</strong> Experimente, aprenda e ajuste{' '}
              <strong>ao seu ritmo.</strong>
            </>
          )}
        </p>
      </CerIntro>
      {mode === 'plan' && !libraryOnly && (
        <Tabs value={view} onValueChange={setView}>
          <TabsList aria-label="Meu desenvolvimento">
            <TabsTrigger value="plan">Planejar</TabsTrigger>
            <TabsTrigger value="learn">
              Aprendizados{readyToReview ? ` · ${readyToReview}` : ''}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      {error && (
        <div role="alert" className="text-sm text-destructive">
          {error}{' '}
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}
      {warning && <p className="text-xs text-muted-foreground">{warning}</p>}
      {message && (
        <p role="status" className="rounded-lg bg-primary/10 p-3 text-sm">
          {message}{' '}
          {mode === 'plan' && (
            <Link className="underline" to={libraryOnly ? '/?etapa=equilibrio' : '/planner'}>
              {libraryOnly ? 'Abrir Plano de Desenvolvimento' : 'Abrir Planner'}
            </Link>
          )}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando seus passos…</p>
      ) : (
        <>
          {carePlan && !libraryOnly && !readOnly && mode === 'plan' && !editing && (
            <Button onClick={() => open(personalCareResource())}>
              Adicionar cuidado que já faço
            </Button>
          )}
          {!libraryOnly &&
            (!readOnly || onPrepareCare) &&
            mode === 'plan' &&
            view === 'plan' &&
            !editing && (
              <Button variant="outline" onClick={() => setShowCatalog((v) => !v)}>
                {carePlan
                  ? showCatalog
                    ? 'Fechar Biblioteca CER'
                    : 'Escolher na Biblioteca CER'
                  : showCatalog
                    ? 'Fechar acervo'
                    : records.length
                      ? 'Escolher outro recurso'
                      : 'Escolher meu primeiro recurso'}
              </Button>
            )}
          {!readOnly && mode === 'play' && (
            <Link className="inline-block text-sm underline" to="/?etapa=evolucao">
              Planejar ou revisar na Evolução
            </Link>
          )}
          {!readOnly && mode === 'play' && readyToReview > 0 && (
            <p className="text-sm">
              Você tem {readyToReview} tentativa(s) pronta(s) para revisar.{' '}
              <Link className="underline" to="/?etapa=evolucao">
                Registrar meu aprendizado
              </Link>
            </p>
          )}
          {(!readOnly || onPrepareCare) && mode === 'plan' && showCatalog && !editing && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm space-y-1">
                  Buscar na Biblioteca
                  <Input value={libraryQuery} onChange={(e) => setLibraryQuery(e.target.value)} />
                </label>
                <label className="text-sm space-y-1">
                  Formato
                  <select
                    className="w-full rounded-md border bg-background p-2"
                    value={libraryFormat}
                    onChange={(e) => setLibraryFormat(e.target.value)}
                  >
                    <option value="all">Todos os formatos</option>
                    {Object.entries(MATERIAL_FORMATS).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm space-y-1">
                  Tema
                  <select
                    className="w-full rounded-md border bg-background p-2"
                    value={libraryTheme}
                    onChange={(e) => setLibraryTheme(e.target.value)}
                  >
                    <option value="all">Todos os temas</option>
                    {[...new Set(resources.map((r) => r.theme).filter(Boolean))]
                      .sort()
                      .map((theme) => (
                        <option key={theme}>{theme}</option>
                      ))}
                  </select>
                </label>
              </div>
              {!resources.length && (
                <p>
                  Novos materiais serão disponibilizados aos poucos. Você pode continuar pelo seu
                  plano de desenvolvimento.
                </p>
              )}
              {resources.length > 0 &&
                !filterLibrary(resources, libraryQuery, libraryFormat, libraryTheme).length && (
                  <p role="status">
                    Nenhum recurso encontrado. Experimente outro tema, formato ou busca.
                  </p>
                )}
              <div className="grid gap-3 sm:grid-cols-2">
                {filterLibrary(resources, libraryQuery, libraryFormat, libraryTheme).map(
                  (resource) => (
                    <article key={resource.id} className="rounded-lg border p-4 space-y-2">
                      <span className="text-xs text-primary">
                        {resource.theme} · {resource.duration}
                      </span>
                      <h3 className="font-semibold">{resource.title}</h3>
                      <details className="text-sm">
                        <summary className="cursor-pointer">Conhecer a proposta</summary>
                        <p className="mt-2">{resource.lesson}</p>
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                          {resource.instructions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                        {resource.fallback && (
                          <p className="mt-2">Em um dia difícil: {resource.fallback}</p>
                        )}
                        <ResourceMaterial material={resource.material} />
                      </details>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => open(carePlan ? libraryCareResource(resource) : resource)}
                      >
                        {readOnly
                          ? 'Revisar para o plano'
                          : carePlan
                            ? 'Guardar prática pessoal'
                            : 'Quero experimentar'}
                      </Button>
                    </article>
                  ),
                )}
              </div>
            </div>
          )}
          {!readOnly && editing && (
            <Dialog
              open
              onOpenChange={(open) => {
                if (!open && !busy) setEditing(null)
              }}
            >
              <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="font-serif">{editing.resource_snapshot.title}</DialogTitle>
                <DialogDescription>
                  {carePlan
                    ? 'Descreva seu cuidado e quando ele cabe na sua vida. A data é opcional; você pode ajustar depois no Planner.'
                    : 'Uma prática pessoal começa com três escolhas.'}
                </DialogDescription>
                <form
                  className="rounded-lg border p-4 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void save(editing, editingId)
                  }}
                >
                  {carePlan &&
                    editing.resource_snapshot.care_plan?.origin !== 'existing_routine' && (
                      <details className="text-sm rounded-lg bg-muted/30 p-3" open>
                        <summary>Recurso de origem</summary>
                        <p className="whitespace-pre-wrap mt-2">
                          {editing.resource_snapshot.lesson}
                        </p>
                        <ol className="list-decimal pl-5 mt-2">
                          {editing.resource_snapshot.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <ResourceMaterial material={editing.resource_snapshot.material} />
                      </details>
                    )}
                  {carePlan && editing.resource_snapshot.care_plan && (
                    <label className="block text-sm space-y-1">
                      <span>Categoria do cuidado</span>
                      <select
                        aria-label="Categoria do cuidado"
                        className="w-full rounded-md border bg-background p-2"
                        disabled={!!editingId}
                        value={editing.resource_snapshot.care_plan.category}
                        onChange={(e) =>
                          patch('resource_snapshot', {
                            ...editing.resource_snapshot,
                            care_plan: {
                              ...editing.resource_snapshot.care_plan!,
                              category: e.target.value as (typeof CARE_CATEGORIES)[number],
                            },
                          })
                        }
                      >
                        {CARE_CATEGORIES.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {CARE_ORIGINS[editing.resource_snapshot.care_plan.origin]}. Registrar um
                        cuidado não substitui a revisão da indicação por Daiane.
                      </p>
                    </label>
                  )}
                  <label className="block text-sm space-y-1">
                    <span>Vincular a um futuro da Linha da Vida (opcional)</span>
                    <select
                      disabled={!!editingId}
                      className="w-full rounded-md border bg-background p-2"
                      value={editing.direction_id}
                      onChange={(e) => {
                        const source = directions.find((d) => d.id === e.target.value)
                        setEditing((old) =>
                          old
                            ? {
                                ...old,
                                direction_id: source?.id || '',
                                goal: source?.title || old.goal,
                              }
                            : old,
                        )
                      }}
                    >
                      <option value="">Planejar sem vínculo</option>
                      {editingId && editing.direction_id && (
                        <option value={editing.direction_id}>
                          Origem desta tentativa preservada
                        </option>
                      )}
                      {directions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm space-y-1">
                    <span>
                      {carePlan
                        ? 'O que esse cuidado significa para mim?'
                        : 'Que vida quero cultivar?'}
                    </span>
                    <Textarea
                      required
                      maxLength={5000}
                      value={editing.goal}
                      onChange={(e) => patch('goal', e.target.value)}
                      placeholder="Ex.: manter minha renda e ter mais tempo livre"
                    />
                  </label>
                  <label className="block text-sm space-y-1">
                    <span>{carePlan ? 'Meu cuidado na prática' : 'Meu pequeno passo'}</span>
                    <Textarea
                      required
                      maxLength={5000}
                      value={editing.action}
                      onChange={(e) => patch('action', e.target.value)}
                      placeholder="Ex.: encerrar o trabalho no horário escolhido em um dia desta semana"
                    />
                  </label>
                  <label className="block text-sm space-y-1">
                    <span>Quando isso cabe na minha vida?</span>
                    <Textarea
                      required
                      maxLength={5000}
                      value={editing.context}
                      onChange={(e) => patch('context', e.target.value)}
                      placeholder="Ex.: segunda de manhã, depois do café"
                    />
                  </label>
                  <details className="space-y-3 text-sm">
                    <summary className="cursor-pointer text-primary">
                      Personalizar · horário, alternativa e sinais
                    </summary>
                    <label className="block text-sm space-y-1">
                      <span>Reservar data e horário (opcional)</span>
                      <Input
                        type="datetime-local"
                        value={editing.scheduled_at ? localDate(editing.scheduled_at) : ''}
                        onInput={(e) =>
                          patch(
                            'scheduled_at',
                            e.currentTarget.value
                              ? new Date(e.currentTarget.value).toISOString()
                              : '',
                          )
                        }
                        onChange={(e) =>
                          patch(
                            'scheduled_at',
                            e.target.value ? new Date(e.target.value).toISOString() : '',
                          )
                        }
                      />
                    </label>
                    <label className="block text-sm space-y-1">
                      <span>Minha alternativa para um dia difícil</span>
                      <Textarea
                        maxLength={5000}
                        value={editing.fallback}
                        onChange={(e) => patch('fallback', e.target.value)}
                      />
                    </label>
                    <label className="block text-sm space-y-1">
                      <span>Como vou perceber se essa tentativa ajudou? (opcional)</span>
                      <Textarea
                        maxLength={5000}
                        value={editing.signal}
                        onChange={(e) => patch('signal', e.target.value)}
                        placeholder="Ex.: consegui encerrar e tive tempo para algo de que gosto"
                      />
                    </label>
                  </details>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editing.access_class === 'participant_shared'}
                      onChange={(e) =>
                        patch(
                          'access_class',
                          e.target.checked ? 'participant_shared' : 'participant_private',
                        )
                      }
                    />
                    Compartilhar este passo e seus aprendizados com minha profissional
                  </label>
                  <p className="text-xs text-muted-foreground">
                    O compartilhamento inclui estes campos. Outros relatos privados da Linha da Vida
                    continuam privados.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={busy} type="submit">
                      {busy
                        ? 'Salvando…'
                        : carePlan
                          ? 'Salvar prática pessoal'
                          : 'Salvar meu passo'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setEditing(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {!libraryOnly && visible.length === 0 && !editing && (
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? carePlan
                  ? 'Nenhum cuidado foi compartilhado ainda. Os registros privados continuam com a pessoa.'
                  : 'Nenhum passo educativo foi compartilhado ainda.'
                : mode === 'play'
                  ? 'Seu próximo passo começa na Evolução. Escolha um recurso e planeje uma tentativa possível.'
                  : 'Você pode começar pequeno. Não precisa transformar a vida inteira de uma vez.'}
            </p>
          )}
          <div className="space-y-3">
            {visible.map((record) => (
              <article key={record.id} className="rounded-lg border p-4 space-y-3">
                <div>
                  <span className="text-xs text-primary">
                    {labels[record.status]} ·{' '}
                    {record.access_class === 'participant_shared' ? 'Compartilhado' : 'Só meu'}
                  </span>
                  <h3 className="font-semibold">{record.action}</h3>
                  {record.resource_snapshot.care_plan && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {record.resource_snapshot.care_plan.category} ·{' '}
                      {CARE_ORIGINS[record.resource_snapshot.care_plan.origin]}
                    </p>
                  )}

                  {record.scheduled_at && (
                    <p className="text-xs">
                      {new Date(record.scheduled_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer">Ver meu passo e recurso</summary>
                  <p className="mt-2">Direção: {record.goal}</p>
                  <p>Quando cabe: {record.context}</p>
                  <p className="mt-2">{record.resource_snapshot.lesson}</p>
                  <ol className="list-decimal pl-5 space-y-1 mt-2">
                    {record.resource_snapshot.instructions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  <ResourceMaterial material={record.resource_snapshot.material} />
                  {record.fallback && <p className="mt-2">Em um dia difícil: {record.fallback}</p>}
                  {record.signal && <p>Sinal que escolhi observar: {record.signal}</p>}
                </details>
                {record.reflection && (
                  <div className="rounded-md bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                    <strong>O que aprendi</strong>
                    <p>{record.reflection}</p>
                    {record.next_step && <p>Próximo ajuste: {record.next_step}</p>}
                  </div>
                )}
                {readOnly && onPrepareCare && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onPrepareCare(carePrioritySource(record.resource_snapshot, record))
                    }
                  >
                    Revisar este cuidado para o plano
                  </Button>
                )}
                {!readOnly && (
                  <>
                    <div className="flex flex-wrap gap-2 items-start">
                      {mode === 'plan' && record.status === 'reviewed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => open(record.resource_snapshot, record)}
                        >
                          Planejar uma nova tentativa
                        </Button>
                      )}
                      {mode === 'plan' && !['completed', 'reviewed'].includes(record.status) && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/planner">Levar para a agenda</Link>
                        </Button>
                      )}
                      {mode === 'plan' && record.status === 'completed' && (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setReviewing(record.id)
                            setReflection(record.reflection)
                            setNextStep(record.next_step)
                          }}
                        >
                          Revisar o que aprendi
                        </Button>
                      )}
                      <details className="text-sm">
                        <summary className="cursor-pointer rounded-md px-3 py-2 hover:bg-muted">
                          Mais opções
                        </summary>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {record.status === 'planned' && (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                save(
                                  { ...record, status: 'experimenting' },
                                  record.id,
                                  'Tentativa em andamento. Você pode ajustar seu ritmo.',
                                )
                              }
                            >
                              Começar
                            </Button>
                          )}
                          {['planned', 'experimenting', 'paused'].includes(record.status) && (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                save(
                                  { ...record, status: 'completed' },
                                  record.id,
                                  'Tentativa registrada. Revise o que aprendeu na Evolução.',
                                )
                              }
                            >
                              Experimentei
                            </Button>
                          )}
                          {['planned', 'experimenting'].includes(record.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                save(
                                  { ...record, status: 'paused' },
                                  record.id,
                                  'Passo pausado. Você pode retomar quando fizer sentido.',
                                )
                              }
                            >
                              Pausar
                            </Button>
                          )}
                          {record.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                save({ ...record, status: 'planned' }, record.id, 'Passo retomado.')
                              }
                            >
                              Retomar
                            </Button>
                          )}
                          {mode === 'plan' &&
                            !['reviewed', 'completed'].includes(record.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => {
                                  setReviewing(record.id)
                                  setReflection(record.reflection)
                                  setNextStep(record.next_step)
                                }}
                              >
                                Revisar o que aprendi
                              </Button>
                            )}
                          {mode === 'plan' &&
                            ['planned', 'experimenting', 'paused'].includes(record.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy}
                                onClick={() => {
                                  setEditing(record)
                                  setEditingId(record.id)
                                  setDirections([])
                                }}
                              >
                                Ajustar meu passo
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              save(
                                {
                                  ...record,
                                  access_class:
                                    record.access_class === 'participant_private'
                                      ? 'participant_shared'
                                      : 'participant_private',
                                },
                                record.id,
                                record.access_class === 'participant_private'
                                  ? 'Este passo e seus aprendizados foram compartilhados.'
                                  : 'Este passo ficou privado no app.',
                              )
                            }
                          >
                            {record.access_class === 'participant_private'
                              ? 'Compartilhar este passo'
                              : 'Deixar só para mim'}
                          </Button>
                        </div>
                      </details>
                    </div>
                    {reviewing === record.id && (
                      <form
                        className="space-y-3 border-t pt-3"
                        onSubmit={(e) => {
                          e.preventDefault()
                          void save(
                            { ...record, reflection, next_step: nextStep, status: 'reviewed' },
                            record.id,
                            'Aprendizado registrado. Você decide se quer manter, ajustar ou tentar outro caminho.',
                          )
                        }}
                      >
                        <p className="text-sm">
                          Uma tentativa também ensina quando fica difícil ou precisa ser
                          interrompida.
                        </p>
                        <label className="block text-sm space-y-1">
                          <span>O que percebi e aprendi?</span>
                          <Textarea
                            required
                            maxLength={5000}
                            value={reflection}
                            onChange={(e) => setReflection(e.target.value)}
                            placeholder={
                              record.resource_snapshot.reflection + ' O que ajudou ou dificultou?'
                            }
                          />
                        </label>
                        <label className="block text-sm space-y-1">
                          <span>O que quero manter ou ajustar? (opcional)</span>
                          <Textarea
                            maxLength={5000}
                            value={nextStep}
                            onChange={(e) => setNextStep(e.target.value)}
                            placeholder="O que já consigo fazer com autonomia? Que apoio ainda preciso?"
                          />
                        </label>
                        <Button size="sm" disabled={busy} type="submit">
                          Guardar meu aprendizado
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          disabled={busy}
                          onClick={() => setReviewing(undefined)}
                        >
                          Cancelar
                        </Button>
                      </form>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
function localDate(iso: string) {
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
