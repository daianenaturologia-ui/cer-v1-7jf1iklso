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
        <Button
          onClick={() => change(buildCerMapReadings(responses, enrollmentId, participantName))}
        >
          Preparar as duas versões
        </Button>
      ) : (
        <>
          <Button
            variant="outline"
            onClick={() => {
              const updated = buildCerMapReadings(responses, enrollmentId, participantName)
              change({
                ...snapshot,
                generatedAt: updated.generatedAt,
                sourceResponseIds: updated.sourceResponseIds,
                dimensions: updated.dimensions.map((d) => ({
                  ...d,
                  summary:
                    snapshot.dimensions.find((previous) => previous.id === d.id)?.summary || '',
                  interpretation:
                    snapshot.dimensions.find((previous) => previous.id === d.id)?.interpretation ||
                    '',
                })),
              })
            }}
          >
            Atualizar respostas do rascunho
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
            <span>Como as dimensões se relacionam</span>
            <Textarea
              value={snapshot.integration}
              onChange={(e) => change({ ...snapshot, integration: e.target.value })}
            />
          </label>
          <label className="block text-sm space-y-1">
            <span>História de vida · apenas relações exploradas em conversa</span>
            <Textarea
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
