import { lifeDirectionsService, sharedLifeDirections } from '@/services/lifeDirections'
import { LifeConnectionsEditor } from './LifeConnectionsEditor'
import { lifeTimelineService, sharedLifeEvents, lifeTimeLabel } from '@/services/lifeTimeline'
import React, { useState } from 'react'
import type { CerMapReadingSnapshot } from '@/types/cerMapReadings'
import type { ExperienceResponseRecord } from '@/types/cer'
import { buildCerMapReadings, unreviewedMapReadings } from '@/services/cerMapReadings'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CerMapReadingsView } from './CerMapReadingsView'

export function CerMapReadingsEditor({
  initial,
  responses,
  enrollmentId,
  participantName,
  onSave,
  onDirty,
}: {
  initial?: CerMapReadingSnapshot | null
  responses: ExperienceResponseRecord[]
  enrollmentId: string
  participantName: string
  onSave: (snapshot: CerMapReadingSnapshot, reviewed: boolean) => Promise<void>
  onDirty: (dirty: boolean) => void
}) {
  const [snapshot, setSnapshot] = useState(initial || null)
  const [reviewed, setReviewed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')
  function change(next: CerMapReadingSnapshot) {
    setSnapshot(unreviewedMapReadings(next))
    setReviewed(false)
    onDirty(true)
  }
  async function prepare(refresh = false) {
    setBusy(true)
    setError('')
    try {
      const lifeEvents = sharedLifeEvents(
        await lifeTimelineService.list(enrollmentId),
        enrollmentId,
      )
      const lifeDirections = sharedLifeDirections(
        await lifeDirectionsService.list(enrollmentId),
        enrollmentId,
      )
      const updated = buildCerMapReadings(responses, enrollmentId, participantName)
      change(
        refresh && snapshot
          ? {
              ...snapshot,
              generatedAt: updated.generatedAt,
              sourceResponseIds: updated.sourceResponseIds,
              lifeEvents,
              lifeDirections,
              lifeConnections: [],
              dimensions: updated.dimensions.map((d) => ({
                ...d,
                summary:
                  snapshot.dimensions.find((previous) => previous.id === d.id)?.summary || '',
                interpretation:
                  snapshot.dimensions.find((previous) => previous.id === d.id)?.interpretation ||
                  '',
              })),
            }
          : { ...updated, lifeEvents, lifeDirections },
      )
    } catch {
      setError(
        'Não foi possível carregar as histórias e direções compartilhadas. O rascunho anterior foi preservado. Tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function save() {
    if (!snapshot) return
    setBusy(true)
    setError('')
    try {
      await onSave(snapshot, reviewed)
      onDirty(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="border rounded-xl p-4 space-y-4" aria-label="Duas versões do Mapa CER">
      <div className="space-y-2">
        <h3 className="font-serif text-lg">Versões resumida e aprofundada</h3>
        <p className="text-sm text-muted-foreground">
          Organize as respostas compartilhadas e redija sua leitura. Confira as duas versões na
          prévia antes de marcar a revisão. Respostas privadas não entram neste documento.
        </p>
      </div>
      {!snapshot ? (
        <Button disabled={busy} onClick={() => void prepare()}>
          Preparar as duas versões
        </Button>
      ) : (
        <>
          <Button variant="outline" disabled={busy} onClick={() => void prepare(true)}>
            Atualizar respostas e histórias do rascunho
          </Button>
          <label className="block text-sm space-y-2">
            <span>Apresentação do mapa</span>
            <Textarea
              value={snapshot.overview}
              onChange={(e) => change({ ...snapshot, overview: e.target.value })}
            />
          </label>
          {snapshot.dimensions.map((dimension, index) => (
            <fieldset key={dimension.id} className="border rounded-lg p-3 space-y-3">
              <legend className="text-sm font-semibold px-1">{dimension.title}</legend>
              <label className="block text-sm space-y-1">
                <span>Síntese em linguagem simples · ambas as versões</span>
                <Textarea
                  value={dimension.summary}
                  onChange={(e) =>
                    change({
                      ...snapshot,
                      dimensions: snapshot.dimensions.map((d, i) =>
                        i === index ? { ...d, summary: e.target.value } : d,
                      ),
                    })
                  }
                />
              </label>
              <label className="block text-sm space-y-1">
                <span>Interpretação e contexto · versão aprofundada</span>
                <Textarea
                  value={dimension.interpretation}
                  onChange={(e) =>
                    change({
                      ...snapshot,
                      dimensions: snapshot.dimensions.map((d, i) =>
                        i === index ? { ...d, interpretation: e.target.value } : d,
                      ),
                    })
                  }
                />
              </label>
            </fieldset>
          ))}
          <label className="block text-sm space-y-1">
            <span>Leitura integrada · o que ajuda a construir o próximo caminho</span>
            <p className="text-xs text-muted-foreground">
              Relacione ritmos e concentração, interesses e desgastes, respostas à sobrecarga,
              vínculos e condições da rotina, recursos e habilidades a desenvolver. Use as respostas
              disponíveis; registre o que ainda precisa ser conversado. Separe relatos e hipóteses.
              A direção será escolhida junto com a pessoa na Evolução.
            </p>
            <Textarea
              placeholder="Como esta pessoa funciona hoje? O que a sustenta? O que pede atenção? Que condições e habilidades podem favorecer a vida que deseja?"
              value={snapshot.integration}
              onChange={(e) => change({ ...snapshot, integration: e.target.value })}
            />
          </label>
          <section className="border rounded-lg p-3 space-y-3">
            <h4 className="font-medium">Histórias compartilhadas que sustentam esta versão</h4>
            <p className="text-sm text-muted-foreground">
              Relatos da pessoa, sem interpretação automática. Atualizar as fontes retira as
              hipóteses com fontes selecionadas para nova revisão. Confira também o texto sobre a
              história: ele pode precisar mudar.
            </p>
            {snapshot.lifeEvents?.map((event) => (
              <details key={event.id}>
                <summary>
                  {event.title} · {lifeTimeLabel(event)}
                </summary>
                <p className="text-sm">{event.emotions.join(' · ')}</p>
                <p className="text-sm whitespace-pre-wrap">{event.narrative}</p>
              </details>
            ))}
            {!snapshot.lifeEvents?.length && (
              <p className="text-sm">Nenhuma história compartilhada nesta versão.</p>
            )}
          </section>
          <LifeConnectionsEditor snapshot={snapshot} onChange={change} />
          <label className="block text-sm space-y-1">
            <span>
              História de vida · relações exploradas em conversa, recursos e perguntas em aberto
            </span>
            <Textarea
              placeholder="Cite o acontecimento e a resposta atual que sustentam cada hipótese. Explique o que a pessoa reconhece, outras explicações possíveis e o que ainda precisa ser investigado. Evite afirmar uma causa única."
              value={snapshot.history}
              onChange={(e) => change({ ...snapshot, history: e.target.value })}
            />
          </label>
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            {preview ? 'Fechar prévia das duas versões' : 'Conferir as duas versões'}
          </Button>
          {preview && <CerMapReadingsView snapshot={snapshot} />}
          <label className="flex gap-2 items-start text-sm">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => {
                setReviewed(e.target.checked)
                onDirty(true)
              }}
            />
            <span>
              Revisei as duas versões, suas explicações e referências para esta interagente.
            </span>
          </label>
          <Button disabled={busy} onClick={save}>
            {busy
              ? 'Salvando...'
              : reviewed
                ? 'Revisar e salvar as duas versões'
                : 'Salvar as duas versões como rascunho'}
          </Button>
          {initial?.reviewedAt && (
            <p className="text-xs text-muted-foreground">
              Revisão salva. Qualquer nova edição exige outra revisão antes da publicação.
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
