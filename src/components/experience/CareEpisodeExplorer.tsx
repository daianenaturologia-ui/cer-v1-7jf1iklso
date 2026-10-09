import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
import { ResourceAgendaForm } from './ResourceAgendaForm'
import pb from '@/lib/pocketbase/client'
import { demoAdapter } from '@/services/demoAdapter'
import type { LifeDirection } from '@/services/lifeDirections'
import { selfDevelopmentService, type DevelopmentExperiment } from '@/services/selfDevelopment'
import {
  EPISODE_RESPONSES,
  emptyCareEpisode,
  careEpisodeInput,
  careEpisodeReading,
  isCareEpisode,
  readCareEpisode,
  validateCareEpisode,
  type CareEpisode,
  type EpisodeResponse,
} from '@/services/careEpisode'

const labels: Record<keyof Omit<CareEpisode, 'version' | 'response'>, string> = {
  facts: 'O que aconteceu nessa situação?',
  thought: 'O que isso pareceu significar para mim?',
  emotion: 'Que emoção reconheço?',
  body: 'O que percebi no meu corpo?',
  behavior: 'O que fiz ou deixei de fazer?',
  relief: 'O que minha reação ajudou ou aliviou?',
  cost: 'Que dificuldade ela trouxe ou manteve?',
  need: 'Do que eu precisava naquele momento?',
  alternative: 'Que resposta quero experimentar?',
  support: 'Que recurso ou apoio pode me ajudar?',
}
type TextField = keyof typeof labels
function draftKey(source: LifeDirection, record?: DevelopmentExperiment) {
  const owner = demoAdapter.isEnabled() ? 'demo-interagente' : pb.authStore.record?.id
  return owner
    ? `cer-care-episode-draft-v1:${owner}:${source.enrollment_id}:${source.id}:${record?.id || 'new'}`
    : null
}
function EpisodeForm({
  source,
  record,
  strategies,
  onSaved,
  onPause,
}: {
  source: LifeDirection
  record?: DevelopmentExperiment
  strategies: string[]
  onSaved: (record: DevelopmentExperiment) => void
  onPause: () => void
}) {
  const [value, setValue] = useState<CareEpisode>(() =>
    record ? readCareEpisode(record) || emptyCareEpisode() : emptyCareEpisode(),
  )
  const [step, setStep] = useState(0)
  const [shared, setShared] = useState(record?.access_class === 'participant_shared')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState<string | null>(null)
  const [draftAvailable, setDraftAvailable] = useState(true)
  const [voice, setVoice] = useState(false)
  const [voiceField, setVoiceField] = useState<TextField>('facts')
  const key = draftKey(source, record)
  useEffect(() => {
    setValue(record ? readCareEpisode(record) || emptyCareEpisode() : emptyCareEpisode())
    setStep(0)
    setShared(record?.access_class === 'participant_shared')
    if (key) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const draft = JSON.parse(raw)
          validateCareEpisode(draft.value)
          if (!Number.isInteger(draft.step) || draft.step < 0 || draft.step > 2) throw new Error()
          setValue(draft.value)
          setStep(draft.step)
          setShared(false)
          setMessage('Seu rascunho foi retomado. Confira antes de salvar ou compartilhar.')
        }
      } catch {
        setMessage(
          'Não conseguimos retomar o rascunho. Os registros já salvos continuam preservados.',
        )
      }
    }
    setReady(key)
  }, [key, record])
  useEffect(() => {
    if (!key || ready !== key) return
    try {
      localStorage.setItem(key, JSON.stringify({ value, step }))
      setDraftAvailable(true)
    } catch {
      setDraftAvailable(false)
    }
  }, [key, ready, value, step])
  function patch(field: TextField, text: string) {
    setValue((v) => ({ ...v, [field]: text.slice(0, 300) }))
  }
  function field(name: TextField, hint?: string) {
    return (
      <label className="block space-y-1 text-sm" key={name}>
        <span>{labels[name]}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        <Textarea
          rows={2}
          maxLength={300}
          value={value[name]}
          onFocus={() => setVoiceField(name)}
          onChange={(e) => patch(name, e.target.value)}
        />
      </label>
    )
  }
  async function save() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const saved = await selfDevelopmentService.save(
        careEpisodeInput(source, value, shared),
        record?.id,
      )
      if (key) {
        try {
          localStorage.removeItem(key)
        } catch {
          /* Server record already saved. */
        }
      }
      onSaved(saved)
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
  const steps = ['A situação', 'Minha reação', 'Minha escolha']
  return (
    <form
      className="space-y-4"
      aria-label="Explorar uma situação"
      onSubmit={(e) => {
        e.preventDefault()
        if (step < 2) {
          setStep(step + 1)
          setVoice(false)
          setVoiceField(step === 0 ? 'behavior' : 'alternative')
        } else void save()
      }}
    >
      <h3 className="font-serif text-xl">Uma situação, um novo caminho</h3>
      <p className="text-sm text-muted-foreground">
        Escolha um episódio cotidiano que consiga olhar agora. Não precisa começar pela lembrança
        mais difícil; você pode pausar e conversar sobre ele no encontro.
      </p>
      <ol aria-label="Etapas da situação" className="grid grid-cols-3 gap-2">
        {steps.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={`rounded-xl border p-3 text-center text-xs ${i === step ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'}`}
          >
            <span className="block font-serif text-lg">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <p className="rounded-xl bg-primary/5 p-3 text-sm">
        <strong>Minha direção: </strong>
        {source.title}
      </p>
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm">
            Primeiro, separe a cena do significado: “interromperam minha fala” descreve um
            acontecimento; “não se importam comigo” descreve uma interpretação. Essa diferença ajuda
            a perceber como a reação começa.
          </p>
          {field(
            'facts',
            'Conte o que foi dito ou feito, sem precisar explicar as intenções de outra pessoa.',
          )}
          {source.narrative && (
            <Button
              type="button"
              variant="outline"
              className="h-auto whitespace-normal"
              onClick={() => patch('facts', source.narrative)}
            >
              Aproveitar a situação que já contei nesta direção
            </Button>
          )}
          {field('thought')}
          <div className="grid sm:grid-cols-2 gap-3">
            {field('emotion', 'Pode haver mais de uma emoção, ou ainda ser difícil nomear.')}
            {field('body', 'Por exemplo: tensão, aceleração, cansaço ou vontade de se recolher.')}
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-3">
          <h4 className="font-serif text-lg">O caminho da minha reação</h4>
          <p className="text-sm">
            Observe a reação neste episódio. Ela pode ser diferente em outra relação ou outro
            momento.
          </p>
          <fieldset>
            <legend className="text-sm mb-2">Qual movimento reconheço nesta situação?</legend>
            <div className="grid sm:grid-cols-2 gap-2">
              {Object.entries(EPISODE_RESPONSES).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  variant="outline"
                  className={`h-auto whitespace-normal text-left ${value.response === id ? 'border-primary bg-primary/10' : ''}`}
                  aria-pressed={value.response === id}
                  onClick={() => setValue((v) => ({ ...v, response: id as EpisodeResponse }))}
                >
                  {label}
                </Button>
              ))}
            </div>
          </fieldset>
          {field('behavior')}
          <div className="grid sm:grid-cols-2 gap-3">
            {field(
              'relief',
              'Uma reação pode ter ajudado em algo, mesmo que também tenha trazido dificuldades.',
            )}
            {field('cost', 'Observe o que aconteceu depois, sem transformar isso em culpa.')}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <h4 className="font-serif text-lg">Cuidar da necessidade, ampliar a escolha</h4>
          <p className="text-sm leading-relaxed">{careEpisodeReading(value)}</p>
          {field('need', 'Pode ser tempo, respeito, descanso, segurança, espaço ou outro cuidado.')}
          {field(
            'alternative',
            'Escolha algo pequeno e possível: uma frase, uma pausa, um pedido ou uma conversa.',
          )}
          <Button
            type="button"
            variant="outline"
            className="h-auto whitespace-normal"
            onClick={() =>
              patch(
                'alternative',
                'Quero compreender esta situação com minha profissional antes de escolher uma ação.',
              )
            }
          >
            Quero compreender melhor antes de escolher
          </Button>
          {field('support')}
          {(source.resources || strategies.length > 0) && (
            <details className="rounded-xl border p-3">
              <summary className="cursor-pointer text-sm">
                Aproveitar meus recursos e apoios
              </summary>
              <div className="space-y-2 mt-3">
                {[...new Set([source.resources, ...strategies].filter(Boolean))].map((text) => (
                  <Button
                    key={text}
                    type="button"
                    variant="outline"
                    className="h-auto whitespace-normal text-left"
                    onClick={() =>
                      patch('support', [value.support, text].filter(Boolean).join('\n'))
                    }
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </details>
          )}
          <div
            className="rounded-xl bg-primary/5 p-4 text-sm space-y-2"
            aria-label="Minha nova escolha"
          >
            <h4 className="font-serif text-lg">Meu próximo movimento</h4>
            <p>
              <strong>Em direção a: </strong>
              {source.title}
            </p>
            <p>
              <strong>Quero experimentar: </strong>
              {value.alternative || 'Ainda estou escolhendo meu começo.'}
            </p>
            <p>
              <strong>Com apoio de: </strong>
              {value.support || 'Posso reconhecer os apoios na conversa.'}
            </p>
          </div>
          <label className="flex gap-2 text-sm items-start">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            Compartilhar esta situação e minha escolha com minha profissional.
          </label>
          <p className="text-xs text-muted-foreground">
            A situação tem sua própria escolha de compartilhamento. Compartilhar a direção não
            compartilha este exercício automaticamente.
          </p>
        </div>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={() => setVoice(!voice)}>
        {voice ? 'Fechar ditado' : 'Contar por voz'}
      </Button>
      {voice && (
        <VoiceInputCapture
          targetLabel={labels[voiceField]}
          onCancel={() => setVoice(false)}
          onConfirmText={(text) => {
            patch(voiceField, [value[voiceField], text].filter(Boolean).join('\n'))
            setVoice(false)
          }}
        />
      )}
      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setStep(step - 1)
              setVoice(false)
            }}
          >
            Voltar
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? 'Salvando…' : step === 2 ? 'Salvar minha situação' : 'Continuar'}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onPause}>
          Continuar depois
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {key && draftAvailable
          ? 'Rascunho guardado neste navegador, só para você. Use Salvar minha situação para guardar no CER.'
          : 'Não foi possível guardar um rascunho neste navegador. Mantenha esta tela aberta ou salve no CER.'}
      </p>
    </form>
  )
}

export function CareEpisodeExplorer({
  source,
  readOnly = false,
  strategies = [],
}: {
  source: LifeDirection
  readOnly?: boolean
  strategies?: string[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [records, setRecords] = useState<DevelopmentExperiment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<DevelopmentExperiment | 'new' | null>(null)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!expanded) return
    let active = true
    setLoading(true)
    setError('')
    setRecords([])
    setEditing(null)
    selfDevelopmentService
      .list(source.enrollment_id)
      .then((values) => {
        if (active)
          setRecords(
            values.filter(
              (v) =>
                isCareEpisode(v) &&
                v.enrollment_id === source.enrollment_id &&
                v.direction_id === source.id &&
                (!readOnly || v.access_class === 'participant_shared'),
            ),
          )
      })
      .catch(() => {
        if (active)
          setError(
            'Não conseguimos carregar as situações. Tente novamente; seus registros continuam preservados.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [expanded, source.enrollment_id, source.id, readOnly, retry])
  return (
    <details
      className="rounded-xl border p-3"
      open={expanded}
      onToggle={(e) => {
        if (e.target === e.currentTarget) setExpanded(e.currentTarget.open)
      }}
    >
      <summary className="cursor-pointer text-sm font-medium">
        {readOnly ? 'Situações e escolhas compartilhadas' : 'Explorar uma situação desta direção'}
      </summary>
      {expanded && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <p role="status">Carregando situações…</p>
          ) : error ? (
            <div role="alert">
              <p>{error}</p>
              <Button onClick={() => setRetry((v) => v + 1)}>Tentar novamente</Button>
            </div>
          ) : editing ? (
            <EpisodeForm
              key={`${source.enrollment_id}:${source.id}:${editing === 'new' ? 'new' : editing.id}`}
              source={source}
              record={editing === 'new' ? undefined : editing}
              strategies={strategies}
              onPause={() => setEditing(null)}
              onSaved={(saved) => {
                setRecords((old) => [saved, ...old.filter((v) => v.id !== saved.id)])
                setEditing(null)
              }}
            />
          ) : (
            <>
              {!readOnly && (
                <Button variant="outline" onClick={() => setEditing('new')}>
                  Olhar uma situação
                </Button>
              )}
              {!records.length && (
                <p className="text-sm text-muted-foreground">
                  {readOnly
                    ? 'Ainda não há situações compartilhadas para esta direção.'
                    : 'Um episódio da vida cotidiana pode ajudar a perceber onde sua nova escolha começa.'}
                </p>
              )}
              {records.map((record) => {
                const episode = readCareEpisode(record)
                if (!episode)
                  return (
                    <p key={record.id} role="alert">
                      Não conseguimos interpretar este registro. Ele foi preservado para revisão.
                    </p>
                  )
                return (
                  <article key={record.id} className="rounded-xl bg-primary/5 p-4 space-y-3">
                    <h4 className="font-serif text-lg">Uma situação, um novo caminho</h4>
                    <p className="text-xs text-muted-foreground">
                      {record.access_class === 'participant_shared'
                        ? 'Compartilhada com minha profissional'
                        : 'Só para mim'}{' '}
                      ·{' '}
                      {record.created
                        ? new Date(record.created).toLocaleDateString('pt-BR')
                        : 'Registro atual'}
                    </p>
                    <p className="text-sm leading-relaxed">{careEpisodeReading(episode)}</p>
                    <p className="text-sm">
                      <strong>Escolha para experimentar: </strong>
                      {episode.alternative}
                    </p>
                    {episode.support && (
                      <p className="text-sm">
                        <strong>Recursos e apoios: </strong>
                        {episode.support}
                      </p>
                    )}
                    <details className="text-sm">
                      <summary className="cursor-pointer">
                        {readOnly ? 'Ver o episódio relatado' : 'Revisitar minha situação'}
                      </summary>
                      <dl className="grid sm:grid-cols-2 gap-3 mt-3">
                        {EPISODE_FIELDS_FOR_DETAILS.map(
                          (name) =>
                            episode[name] && (
                              <div key={name}>
                                <dt className="font-medium">{labels[name]}</dt>
                                <dd className="whitespace-pre-wrap">{episode[name]}</dd>
                              </div>
                            ),
                        )}
                      </dl>
                    </details>
                    {!readOnly && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setEditing(record)}>
                          Revisar esta situação
                        </Button>
                        <ResourceAgendaForm
                          enrollmentId={source.enrollment_id}
                          strength={episode.support || 'Reconhecer um apoio na conversa'}
                          difficulty={episode.facts}
                          strategy={episode.alternative}
                          initialGoal={source.title}
                        />
                      </>
                    )}
                  </article>
                )
              })}
            </>
          )}
        </div>
      )}
    </details>
  )
}
const EPISODE_FIELDS_FOR_DETAILS: TextField[] = [
  'facts',
  'thought',
  'emotion',
  'body',
  'behavior',
  'relief',
  'cost',
  'need',
]
