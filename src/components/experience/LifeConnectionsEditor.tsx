import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { CerMapReadingSnapshot } from '@/types/cerMapReadings'
export function LifeConnectionsEditor({
  snapshot,
  onChange,
}: {
  snapshot: CerMapReadingSnapshot
  onChange: (next: CerMapReadingSnapshot) => void
}) {
  const connections = snapshot.lifeConnections || []
  const rows = snapshot.dimensions.flatMap((d) =>
    d.detailedRows
      .filter((row) => row.sourceResponseId)
      .map((row) => ({ ...row, dimension: d.title })),
  )
  const update = (
    index: number,
    patch: Partial<NonNullable<CerMapReadingSnapshot['lifeConnections']>[number]>,
  ) =>
    onChange({
      ...snapshot,
      lifeConnections: connections.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    })
  return (
    <fieldset className="border rounded-lg p-3 space-y-4">
      <legend className="font-medium px-1">Relações entre história e funcionamento atual</legend>
      <p className="text-sm text-muted-foreground">
        Registre hipóteses para conversar com a pessoa, incluindo outras explicações e recursos. Ser
        prestativa, controlar ou se afastar não comprova negligência ou uma origem única.
      </p>
      {connections.map((connection, index) => (
        <div key={index} className="border rounded-lg p-3 space-y-3">
          <label className="block text-sm">
            Acontecimento compartilhado
            <select
              className="block w-full border rounded p-2 bg-background"
              value={connection.eventId}
              onChange={(e) => update(index, { eventId: e.target.value })}
            >
              <option value="">Selecione o acontecimento</option>
              {snapshot.lifeEvents?.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Resposta atual que sustenta a hipótese
            <select
              className="block w-full border rounded p-2 bg-background"
              value={connection.responseId}
              onChange={(e) => update(index, { responseId: e.target.value })}
            >
              <option value="">Selecione a resposta</option>
              {rows.map((row, i) => (
                <option key={i} value={row.sourceResponseId}>
                  {row.dimension} · {row.label} · {row.text.slice(0, 100)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Relação possível e explicações alternativas
            <Textarea
              value={connection.text}
              onChange={(e) => update(index, { text: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            O que ainda precisamos investigar em conversa?
            <Textarea
              value={connection.question}
              onChange={(e) => update(index, { question: e.target.value })}
            />
          </label>
          <Button
            variant="outline"
            onClick={() =>
              onChange({ ...snapshot, lifeConnections: connections.filter((_, i) => i !== index) })
            }
          >
            Retirar hipótese do rascunho
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        disabled={!snapshot.lifeEvents?.length || !rows.length}
        onClick={() =>
          onChange({
            ...snapshot,
            lifeConnections: [
              ...connections,
              { eventId: '', responseId: '', text: '', question: '' },
            ],
          })
        }
      >
        Adicionar relação para revisão
      </Button>
      <p className="text-xs text-muted-foreground">
        A interpretação por IA ainda não está disponível. Estas relações são redigidas e revisadas
        pela profissional antes da publicação.
      </p>
    </fieldset>
  )
}
