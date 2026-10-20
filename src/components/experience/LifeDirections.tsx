import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { resourceExerciseService } from '@/services/cerResourceExercise'
import { GoalRoadmapPlanner } from './GoalRoadmapPlanner'
import { ResourceAgendaForm } from './ResourceAgendaForm'
import { MyNextStepWizard, clearMyNextStepDraft } from './MyNextStepWizard'
import { CareEpisodeExplorer } from './CareEpisodeExplorer'
import {
  lifeDirectionsService,
  LIFE_HORIZONS,
  principalLifeDirection,
  type LifeDirection,
  type LifeDirectionInput,
} from '@/services/lifeDirections'

export function LifeDirections({
  enrollmentId,
  readOnly = false,
  unlocked = true,
  perspective,
  planning = false,
  enableActions = true,
  allowEditing = true,
}: {
  enrollmentId: string
  readOnly?: boolean
  unlocked?: boolean
  perspective?: LifeDirection['kind']
  planning?: boolean
  enableActions?: boolean
  allowEditing?: boolean
}) {
  const [records, setRecords] = useState<LifeDirection[]>([])
  const [archivedRecords, setArchivedRecords] = useState<LifeDirection[]>([])
  const [deleting, setDeleting] = useState<LifeDirection | null>(null)
  const enrollmentRef = useRef(enrollmentId)
  enrollmentRef.current = enrollmentId
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<LifeDirectionInput | null>(null)
  const [editingId, setEditingId] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState('')
  const [retry, setRetry] = useState(0)
  const [strategies, setStrategies] = useState<string[]>([])
  const [resourceError, setResourceError] = useState('')
  const principal = principalLifeDirection(records)
  useEffect(() => {
    let active = true
    setStrategies([])
    setResourceError('')
    if (planning && !readOnly)
      resourceExerciseService
        .load(enrollmentId)
        .then((saved) => {
          if (active)
            setStrategies([
              ...new Set(
                (saved?.data.connections || []).map((c) => c.strategy.trim()).filter(Boolean),
              ),
            ])
        })
        .catch(() => {
          if (active)
            setResourceError(
              'Não conseguimos carregar o jogo agora. Você pode registrar seus recursos com suas palavras; o exercício salvo continua preservado.',
            )
        })
    return () => {
      active = false
    }
  }, [enrollmentId, planning, readOnly])
  useEffect(() => {
    let active = true
    setRecords([])
    setArchivedRecords([])
    setDeleting(null)
    setBusy(false)
    setEditing(null)
    setLoading(true)
    setError('')
    setSaved('')

    lifeDirectionsService
      .list(enrollmentId, !readOnly)
      .then((values) => {
        if (active) {
          setArchivedRecords(
            values.filter(
              (v) =>
                v.enrollment_id === enrollmentId && v.kind === 'future' && v.archived && !readOnly,
            ),
          )
          setRecords(
            values.filter(
              (v) =>
                v.enrollment_id === enrollmentId &&
                !v.archived &&
                (!readOnly || v.access_class === 'participant_shared'),
            ),
          )
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar presente e futuro. Tente novamente.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, readOnly, retry])
  function open(
    kind: LifeDirection['kind'],
    record?: LifeDirection,
    horizon?: LifeDirection['horizon'],
  ) {
    const current =
      planning && !record && kind === 'future'
        ? [...records]
            .filter((v) => v.kind === 'present')
            .sort((a, b) =>
              (a.updated || a.created || '').localeCompare(b.updated || b.created || ''),
            )
            .at(-1)
        : undefined
    setEditingId(record?.id)
    setError('')
    setSaved('')

    setEditing(
      record || {
        enrollment_id: enrollmentId,
        kind,
        horizon: kind === 'present' ? 'now' : horizon || 'open',
        title: '',
        narrative: current?.narrative || '',
        meaning: '',
        resources: current?.resources || '',
        limits: current?.limits || '',
        first_step: '',
        access_class: 'participant_private',
      },
    )
  }
  async function save() {
    if (!editing || busy) return
    setBusy(true)
    setError('')
    try {
      const record = await lifeDirectionsService.save(editing, editingId)
      if (planning && editing.kind === 'future') clearMyNextStepDraft(enrollmentId, editingId)
      setRecords((values) =>
        editingId ? values.map((v) => (v.id === editingId ? record : v)) : [...values, record],
      )
      setEditing(null)

      setSaved(
        planning
          ? 'Meta principal salva. Suas outras metas continuam na lista. Compartilhe esta escolha para levá-la à conversa sobre o plano.'
          : 'Registro salvo. Seu mapa inicial acompanha suas direções e momentos de agora.',
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
  async function changeArchive(record: LifeDirection, archived: boolean) {
    if (busy || readOnly || !allowEditing || record.enrollment_id !== enrollmentId) return
    setBusy(true)
    setError('')
    try {
      const changed = await lifeDirectionsService.archive(enrollmentId, record.id, archived)
      if (enrollmentRef.current !== enrollmentId) return
      if (archived) {
        clearMyNextStepDraft(enrollmentId, record.id)
        setRecords((values) => values.filter((value) => value.id !== record.id))
        setArchivedRecords((values) => [
          ...values.filter((value) => value.id !== record.id),
          changed,
        ])
      } else {
        setArchivedRecords((values) => values.filter((value) => value.id !== record.id))
        setRecords((values) => [...values, changed])
      }
      setDeleting(null)
      setSaved(
        archived
          ? 'Meta excluída da lista. Você pode restaurá-la em Metas excluídas. Planos e rotinas já combinados ficam preservados.'
          : 'Meta restaurada como escolha principal. Você pode rever e escolher outra meta quando quiser.',
      )
    } catch {
      if (enrollmentRef.current === enrollmentId)
        setError(
          archived
            ? 'Não foi possível confirmar a exclusão. Atualize a lista ou tente novamente.'
            : 'Não foi possível restaurar a meta. Tente novamente.',
        )
    } finally {
      if (enrollmentRef.current === enrollmentId) setBusy(false)
    }
  }
  return (
    <section
      className="border rounded-xl p-5 space-y-5"
      aria-label="Linha da Vida: presente e futuro"
    >
      <h2 className="font-serif text-xl">
        {planning
          ? readOnly
            ? 'Direção do cuidado'
            : 'Meu próximo passo'
          : perspective === 'present'
            ? 'Como estou vivendo agora'
            : perspective === 'future'
              ? 'O que desejo construir'
              : 'Linha da Vida · Presente e futuro'}
      </h2>
      {planning ? (
        <p className="text-sm text-muted-foreground">
          {readOnly
            ? 'A direção expressa pela interagente é o ponto de partida. Considerem seu funcionamento, seus apoios e suas condições para combinar o objetivo e um primeiro passo possível.'
            : 'Escolha uma meta principal e registre as ações que imagina praticar. Seus outros desejos continuam na lista; foco agora ajuda a transformar intenção em realização.'}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Registre seu momento e as mudanças que deseja construir. Seus registros podem orientar a
          conversa com sua profissional; os horizontes podem ser ajustados ao longo do caminho.
        </p>
      )}
      {!unlocked && !readOnly && (
        <p className="text-sm">Conclua as seis dimensões da Consciência para iniciar esta etapa.</p>
      )}
      {loading ? (
        <p role="status">Carregando registros…</p>
      ) : (
        <>
          {!planning &&
            perspective === 'future' &&
            !readOnly &&
            allowEditing &&
            unlocked &&
            !error && (
              <div className="relative grid grid-cols-3 gap-2 rounded-xl bg-primary/5 p-4">
                <div
                  aria-hidden="true"
                  className="absolute top-10 left-10 right-10 border-t-2 border-primary/30"
                />
                {(['short', 'medium', 'long'] as const).map((horizon) => (
                  <button
                    type="button"
                    key={horizon}
                    onClick={() => open('future', undefined, horizon)}
                    className="relative flex flex-col items-center gap-2 text-center text-sm text-primary"
                  >
                    <span className="rounded-full border border-primary/40 bg-background w-12 h-12 flex items-center justify-center text-xl">
                      +
                    </span>
                    <span>{LIFE_HORIZONS[horizon]}</span>
                  </button>
                ))}
              </div>
            )}
          {!readOnly && allowEditing && unlocked && !error && (
            <div className="flex flex-wrap gap-2">
              {planning && perspective !== 'present' && !editing && (
                <Button variant="outline" onClick={() => open('future')}>
                  {records.some((v) => v.kind === 'future')
                    ? 'Escolher outra meta'
                    : 'Escolher minha meta principal'}
                </Button>
              )}
              {!planning && perspective !== 'future' && (
                <Button variant="outline" onClick={() => open('present')}>
                  ＋ Como estou agora?
                </Button>
              )}
              {!planning && perspective !== 'present' && (
                <Button variant="outline" onClick={() => open('future')}>
                  ＋ Uma direção para o futuro
                </Button>
              )}
            </div>
          )}
          {!editing &&
            (['present', 'future'] as const)
              .filter((kind) => !perspective || kind === perspective)
              .map((kind) => (
                <div key={kind} className="border-l-4 border-primary/60 pl-4 space-y-3">
                  <h3 className="font-medium">
                    {kind === 'present'
                      ? 'Presente · meus momentos de agora'
                      : planning
                        ? 'Minha meta principal e outras possibilidades'
                        : 'Futuro · desejos e possibilidades'}
                  </h3>
                  {records
                    .filter((v) => v.kind === kind)
                    .sort((a, b) => Number(b.id === principal?.id) - Number(a.id === principal?.id))
                    .map((record) => (
                      <article key={record.id} className="border rounded-lg p-3 space-y-2">
                        <h4 className="font-medium">{record.title}</h4>
                        {planning && record.kind === 'future' && (
                          <p className="text-xs font-semibold text-primary">
                            {record.id === principal?.id
                              ? readOnly
                                ? 'Meta compartilhada mais recente'
                                : 'Meta principal deste ciclo'
                              : 'Na minha lista · para outro momento'}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {LIFE_HORIZONS[record.horizon]} ·{' '}
                          {record.created
                            ? new Date(record.created).toLocaleDateString('pt-BR')
                            : 'Registro atual'}{' '}
                          ·{' '}
                          {record.access_class === 'participant_shared'
                            ? 'Compartilhado com minha profissional'
                            : 'Só para mim'}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{record.narrative}</p>
                        {(
                          [
                            [
                              'meaning',
                              planning ? 'Áreas de cuidado e sentido' : 'Sentido e propósito',
                            ],
                            [
                              'resources',
                              planning
                                ? 'Por onde quero começar · recursos e apoios'
                                : 'Recursos e apoios',
                            ],
                            [
                              'limits',
                              planning
                                ? 'Condições que o plano precisa respeitar'
                                : 'Limites e necessidades',
                            ],
                            ['first_step', 'Pequeno passo possível'],
                          ] as const
                        ).map(
                          ([field, label]) =>
                            record[field] && (
                              <p key={field} className="text-sm whitespace-pre-wrap">
                                <strong>{label}: </strong>
                                {record[field]}
                              </p>
                            ),
                        )}
                        {enableActions &&
                          planning &&
                          record.kind === 'future' &&
                          record.first_step.trim() &&
                          !readOnly &&
                          unlocked && (
                            <ResourceAgendaForm
                              key={`${record.id}:${record.updated}`}
                              enrollmentId={enrollmentId}
                              strength={
                                record.resources ||
                                'Recursos que vou reconhecer com minha profissional'
                              }
                              difficulty={record.narrative || record.title}
                              strategy={record.first_step}
                              initialGoal={record.title}
                            />
                          )}
                        {record.kind === 'future' &&
                          (readOnly || (enableActions && planning && unlocked)) && (
                            <CareEpisodeExplorer
                              key={`episode:${record.id}:${readOnly}`}
                              source={record}
                              readOnly={readOnly}
                              strategies={strategies}
                            />
                          )}
                        {record.kind === 'future' &&
                          (readOnly || (enableActions && planning && unlocked)) && (
                            <GoalRoadmapPlanner
                              title="Metas e ações desta direção"
                              source={record}
                              readOnly={readOnly}
                              strategies={strategies}
                            />
                          )}
                        {!readOnly && allowEditing && unlocked && (
                          <Button size="sm" variant="outline" onClick={() => open(kind, record)}>
                            {planning && record.kind === 'future'
                              ? 'Rever e escolher esta meta'
                              : 'Editar registro'}
                          </Button>
                        )}
                        {record.kind === 'future' && !readOnly && allowEditing && unlocked && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => {
                              setDeleting(record)
                              setError('')
                            }}
                          >
                            Excluir meta
                          </Button>
                        )}
                      </article>
                    ))}
                  {!records.some((v) => v.kind === kind) && (
                    <p className="text-sm text-muted-foreground">
                      {readOnly
                        ? 'Ainda não há registros compartilhados deste momento.'
                        : 'Este espaço pode ser preenchido no seu tempo.'}
                    </p>
                  )}
                </div>
              ))}
        </>
      )}
      {deleting && (
        <div
          role="alertdialog"
          aria-modal="false"
          aria-label={`Excluir meta: ${deleting.title}`}
          className="rounded-xl border p-4 space-y-3"
        >
          <p>
            Excluir a meta “{deleting.title}” da sua lista? Você poderá restaurá-la depois. Planos e
            rotinas já combinados ficam preservados.
          </p>
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => void changeArchive(deleting, true)}>
              Confirmar exclusão
            </Button>
            <Button disabled={busy} variant="outline" onClick={() => setDeleting(null)}>
              Manter meta
            </Button>
          </div>
        </div>
      )}
      {!readOnly && allowEditing && perspective !== 'present' && archivedRecords.length > 0 && (
        <details className="rounded-xl border p-4 space-y-3">
          <summary className="cursor-pointer">Metas excluídas</summary>
          {archivedRecords.map((record) => (
            <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <span>{record.title}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void changeArchive(record, false)}
              >
                Restaurar meta: {record.title}
              </Button>
            </div>
          ))}
        </details>
      )}
      {error && !(editing && planning && editing.kind === 'future') && (
        <div role="alert" className="text-sm text-destructive">
          {error}
          {!editing && (
            <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
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
      {editing && planning && editing.kind === 'future' && !readOnly && unlocked && (
        <MyNextStepWizard
          key={`${enrollmentId}:${editingId || 'new'}`}
          value={editing}
          recordId={editingId}
          busy={busy}
          error={error}
          strategies={strategies}
          onChange={setEditing}
          onSave={() => void save()}
          onPause={() => {
            setEditing(null)

            setError('')
          }}
        />
      )}
      {editing && !(planning && editing.kind === 'future') && !readOnly && unlocked && (
        <form
          className="border rounded-xl p-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <h3 className="font-medium">
            {planning && editing.kind === 'future'
              ? 'Minha primeira direção'
              : editing.kind === 'present'
                ? 'Como estou agora?'
                : 'Minha direção para o futuro'}
          </h3>
          <label className="block text-sm space-y-1">
            {planning && editing.kind === 'future'
              ? 'A mudança que quero construir'
              : 'Nome deste registro'}
            <Input
              maxLength={160}
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
          </label>
          {editing.kind === 'future' && (
            <label className="block text-sm space-y-1">
              {planning ? 'Horizonte da primeira meta' : 'Horizonte'}
              <select
                className="block w-full rounded border p-2 bg-background"
                value={editing.horizon}
                onChange={(e) =>
                  setEditing({ ...editing, horizon: e.target.value as LifeDirection['horizon'] })
                }
              >
                {(['open', 'short', 'medium', 'long'] as const).map((h) => (
                  <option key={h} value={h}>
                    {LIFE_HORIZONS[h]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm space-y-1">
            {editing.kind === 'present'
              ? 'Como estão meu corpo, meus sentimentos e minha vida hoje?'
              : planning
                ? 'O que está pesando hoje e quero transformar?'
                : 'O que desejo viver, cultivar ou transformar?'}
            <Textarea
              rows={5}
              maxLength={5000}
              value={editing.narrative}
              onChange={(e) => setEditing({ ...editing, narrative: e.target.value })}
            />
          </label>

          {planning && editing.kind === 'future' && (
            <label className="block text-sm space-y-1">
              O que desejo e consigo sustentar neste momento?
              <p className="text-xs text-muted-foreground">
                Pode ser uma pequena mudança na alimentação, no sono, no movimento, nas pausas, nas
                relações ou na organização do trabalho e do dinheiro. Inclua frequência possível e o
                que ainda não cabe. Escolher menos também é válido.
              </p>
              <Textarea
                rows={3}
                maxLength={5000}
                value={editing.limits}
                onChange={(e) => setEditing({ ...editing, limits: e.target.value })}
              />
            </label>
          )}
          {planning && editing.kind === 'future' && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setEditing({
                  ...editing,
                  title: editing.title || 'Compreender o que está me causando angústia',
                })
              }
            >
              Ainda não tenho clareza da mudança
            </Button>
          )}
          <details className="rounded-lg bg-primary/5 p-3" open={planning ? undefined : true}>
            <summary className="cursor-pointer text-sm">
              {planning ? 'Meus recursos e o primeiro passo' : 'Aprofundar este registro'}
            </summary>
            {(
              [
                [
                  'meaning',
                  planning
                    ? 'Por que essa mudança importa para mim?'
                    : 'Que sentido isso tem para mim? Como se relaciona com meus valores e propósito?',
                ],
                ['resources', 'Recursos e apoios que quero usar'],
                ...(!planning || editing.kind === 'present'
                  ? [
                      [
                        'limits',
                        'O que preciso respeitar? O que quero menos ou não quero repetir?',
                      ] as const,
                    ]
                  : []),
                ['first_step', 'Qual pequeno passo parece possível?'],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="block text-sm space-y-1">
                {label}
                <Textarea
                  rows={2}
                  maxLength={5000}
                  value={editing[field]}
                  onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
                />
              </label>
            ))}
            {planning && strategies.length > 0 && (
              <div className="space-y-2 text-sm">
                <p>Estratégias que você salvou no jogo de potencialidades</p>
                {strategies.map((strategy) => (
                  <Button
                    key={strategy}
                    type="button"
                    variant="outline"
                    className="h-auto whitespace-normal text-left"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        resources: [...new Set([editing.resources, strategy].filter(Boolean))].join(
                          '\n',
                        ),
                      })
                    }
                  >
                    {strategy}
                  </Button>
                ))}
              </div>
            )}
            {planning && resourceError && (
              <p role="status" className="text-xs">
                {resourceError}
              </p>
            )}
          </details>
          <p className="text-xs text-muted-foreground">
            Só o nome do registro é obrigatório. Um desejo pode orientar conversas, a Mandala e o
            Planner; você e sua profissional decidem como transformá-lo em cuidado.
          </p>
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
            Compartilhar este registro com minha profissional e permitir sua consideração no Mapa
            CER.
          </label>
          <p className="text-xs text-muted-foreground">
            Desmarcado: só você pode acessar. A inclusão no Mapa exige revisão profissional. Mapas
            já publicados mantêm a versão compartilhada naquela ocasião.
          </p>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar registro'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEditing(null)

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
