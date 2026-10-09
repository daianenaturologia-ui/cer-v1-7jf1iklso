import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { resourceExerciseService } from '@/services/cerResourceExercise'
import { GoalRoadmapPlanner } from './GoalRoadmapPlanner'
import { ResourceAgendaForm } from './ResourceAgendaForm'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
import { MyNextStepWizard, clearMyNextStepDraft } from './MyNextStepWizard'
import {
  lifeDirectionsService,
  LIFE_HORIZONS,
  type LifeDirection,
  type LifeDirectionInput,
} from '@/services/lifeDirections'

export function LifeDirections({
  enrollmentId,
  readOnly = false,
  unlocked = true,
  perspective,
  planning = false,
}: {
  enrollmentId: string
  readOnly?: boolean
  unlocked?: boolean
  perspective?: LifeDirection['kind']
  planning?: boolean
}) {
  const [records, setRecords] = useState<LifeDirection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<LifeDirectionInput | null>(null)
  const [editingId, setEditingId] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [voice, setVoice] = useState(false)
  const [saved, setSaved] = useState('')
  const [retry, setRetry] = useState(0)
  const [strategies, setStrategies] = useState<string[]>([])
  const [resourceError, setResourceError] = useState('')
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
    setEditing(null)
    setLoading(true)
    setError('')
    setSaved('')
    setVoice(false)
    lifeDirectionsService
      .list(enrollmentId)
      .then((values) => {
        if (active)
          setRecords(
            values.filter(
              (v) =>
                v.enrollment_id === enrollmentId &&
                (!readOnly || v.access_class === 'participant_shared'),
            ),
          )
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
    setSaved('')
    setVoice(false)
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
    if (!editing) return
    setBusy(true)
    setError('')
    try {
      const record = await lifeDirectionsService.save(
        planning && editing.kind === 'future' && !editing.title.trim()
          ? { ...editing, title: 'Compreender o que está me causando angústia' }
          : editing,
        editingId,
      )
      if (planning && editing.kind === 'future') clearMyNextStepDraft(enrollmentId, editingId)
      setRecords((values) =>
        editingId ? values.map((v) => (v.id === editingId ? record : v)) : [...values, record],
      )
      setEditing(null)
      setVoice(false)
      setSaved(
        planning
          ? 'Direção salva. Ela será a base da conversa sobre seu objetivo e os passos possíveis.'
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
            : 'Vamos aproximar seu mapa da sua vida: o que merece cuidado, a mudança que faria diferença e um começo que cabe no seu momento.'}
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
          {!planning && perspective === 'future' && !readOnly && unlocked && !error && (
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
          {!readOnly && unlocked && !error && (
            <div className="flex flex-wrap gap-2">
              {planning && !editing && (
                <Button variant="outline" onClick={() => open('future')}>
                  Escolher minha primeira direção
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
                        ? 'Direções e primeiras metas'
                        : 'Futuro · desejos e possibilidades'}
                  </h3>
                  {records
                    .filter((v) => v.kind === kind)
                    .map((record) => (
                      <article key={record.id} className="border rounded-lg p-3 space-y-2">
                        <h4 className="font-medium">{record.title}</h4>
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
                        {planning &&
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
                        {record.kind === 'future' && (readOnly || (planning && unlocked)) && (
                          <details className="rounded-lg border p-3">
                            <summary className="cursor-pointer text-sm font-medium">
                              Metas e ações desta direção
                            </summary>
                            <GoalRoadmapPlanner
                              source={record}
                              readOnly={readOnly}
                              strategies={strategies}
                            />
                          </details>
                        )}
                        {!readOnly && unlocked && (
                          <Button size="sm" variant="outline" onClick={() => open(kind, record)}>
                            Editar registro
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
      {error && (
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
          strategies={strategies}
          onChange={setEditing}
          onSave={() => void save()}
          onPause={() => {
            setEditing(null)
            setVoice(false)
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
          <Button type="button" variant="outline" onClick={() => setVoice(!voice)}>
            {voice ? 'Fechar ditado' : 'Contar por voz'}
          </Button>
          {voice && (
            <VoiceInputCapture
              targetLabel="presente e futuro"
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
            já publicados mantêm a versão compartilhada naquela ocasião. O ditado exige sua
            confirmação; não guardamos o áudio.
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
