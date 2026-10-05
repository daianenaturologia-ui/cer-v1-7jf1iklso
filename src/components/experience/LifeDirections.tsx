import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
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
}: {
  enrollmentId: string
  readOnly?: boolean
  unlocked?: boolean
  perspective?: LifeDirection['kind']
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
            values.filter(v => v.enrollment_id === enrollmentId && (!readOnly || v.access_class === 'participant_shared')),
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
  function open(kind: LifeDirection['kind'], record?: LifeDirection, horizon?: LifeDirection['horizon']) {
    setEditingId(record?.id)
    setSaved('')
    setVoice(false)
    setEditing(
      record || {
        enrollment_id: enrollmentId,
        kind,
        horizon: kind === 'present' ? 'now' : horizon || 'open',
        title: '',
        narrative: '',
        meaning: '',
        resources: '',
        limits: '',
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
      const record = await lifeDirectionsService.save(editing, editingId)
      setRecords((values) =>
        editingId ? values.map((v) => (v.id === editingId ? record : v)) : [...values, record],
      )
      setEditing(null)
      setVoice(false)
      setSaved(
        'Registro salvo. Seu mapa inicial acompanha suas direções e momentos de agora.',
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
      <h2 className="font-serif text-xl">{perspective === 'present' ? 'Como estou vivendo agora' : perspective === 'future' ? 'O que desejo construir' : 'Linha da Vida · Presente e futuro'}</h2>
      <p className="text-sm text-muted-foreground">
        Como estou agora? Que vida desejo construir? Registre como se sente, o que faz sentido, o
        que quer cultivar e o que prefere não repetir. Você pode preencher aos poucos. Ao
        compartilhar, você e sua profissional poderão aprofundar a direção e o plano de ação. Na
        Evolução, você também pode planejar seus próprios passos educativos e revisá-los no seu
        ritmo.
      </p>
      <p className="text-sm text-muted-foreground">
        O futuro é uma direção que pode mudar. Se ainda não consegue imaginá-lo, comece pelo que
        precisa hoje ou por uma pequena mudança possível. Os horizontes são flexíveis, sem prazos
        obrigatórios.
      </p>
      {!unlocked && !readOnly && (
        <p className="text-sm">Conclua as seis dimensões da Consciência para iniciar esta etapa.</p>
      )}
      {loading ? (
        <p role="status">Carregando registros…</p>
      ) : (
        <>
          {perspective === 'future' && !readOnly && unlocked && !error && <div className="relative grid grid-cols-3 gap-2 rounded-xl bg-primary/5 p-4">
            <div aria-hidden="true" className="absolute top-10 left-10 right-10 border-t-2 border-primary/30"/>
            {(['short', 'medium', 'long'] as const).map(horizon => <button type="button" key={horizon} onClick={() => open('future', undefined, horizon)} className="relative flex flex-col items-center gap-2 text-center text-sm text-primary"><span className="rounded-full border border-primary/40 bg-background w-12 h-12 flex items-center justify-center text-xl">+</span><span>{LIFE_HORIZONS[horizon]}</span></button>)}
          </div>}
          {!readOnly && unlocked && !error && (
            <div className="flex flex-wrap gap-2">
              {perspective !== 'future' && <Button variant="outline" onClick={() => open('present')}>
                ＋ Como estou agora?
              </Button>}
              {perspective !== 'present' && <Button variant="outline" onClick={() => open('future')}>
                ＋ Uma direção para o futuro
              </Button>}
            </div>
          )}
          {(['present', 'future'] as const).filter(kind => !perspective || kind === perspective).map((kind) => (
            <div key={kind} className="border-l-4 border-primary/60 pl-4 space-y-3">
              <h3 className="font-medium">
                {kind === 'present'
                  ? 'Presente · meus momentos de agora'
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
                        ['meaning', 'Sentido e propósito'],
                        ['resources', 'Recursos e apoios'],
                        ['limits', 'Limites e necessidades'],
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
      {editing && !readOnly && unlocked && (
        <form
          className="border rounded-xl p-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <h3 className="font-medium">
            {editing.kind === 'present' ? 'Como estou agora?' : 'Minha direção para o futuro'}
          </h3>
          <label className="block text-sm space-y-1">
            Nome deste registro
            <Input
              maxLength={160}
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
          </label>
          {editing.kind === 'future' && (
            <label className="block text-sm space-y-1">
              Horizonte
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
          {(
            [
              [
                'meaning',
                'Que sentido isso tem para mim? Como se relaciona com meus valores e propósito?',
              ],
              ['resources', 'Que recursos, pessoas ou apoios podem ajudar?'],
              ['limits', 'O que preciso respeitar? O que quero menos ou não quero repetir?'],
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
