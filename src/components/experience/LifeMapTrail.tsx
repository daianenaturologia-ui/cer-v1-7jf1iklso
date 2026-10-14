import React from 'react'
import type { CerMapReadingDimension } from '@/types/cerMapReadings'
import { lifeTimeLabel, type LifeEvent } from '@/services/lifeTimeline'
import { LIFE_HORIZONS, type LifeDirection } from '@/services/lifeDirections'

/** Live participant-owned projection. Kept separate from professional published snapshots. */
export function LifeMapTrail({
  events,
  directions,
  dimensions = [],
}: {
  events: LifeEvent[]
  directions: LifeDirection[]
  dimensions?: CerMapReadingDimension[]
}) {
  if (!events.length && !directions.length) return null
  return (
    <section className="rounded-xl border p-5 space-y-4" aria-label="Minha história no Mapa CER">
      <h3 className="font-serif text-lg text-primary">Minha história em movimento</h3>
      <p className="text-sm text-muted-foreground">
        Esta parte acompanha seus registros da Linha da Vida. Histórias particulares ficam apenas na
        sua visão; a leitura profissional compartilhada mantém a data e a versão em que foi
        revisada.
      </p>
      {events.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Marcos da minha história</h4>
          {events.map((event) => (
            <details key={event.id} className="rounded-lg bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm">
                <span className="font-medium">{event.title}</span> · {lifeTimeLabel(event)}
                {event.emotions.length > 0 && (
                  <span className="text-primary"> · {event.emotions.join(' · ')}</span>
                )}
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  {event.access_class === 'participant_private'
                    ? 'Só para mim'
                    : 'Compartilhado com minha profissional'}
                </p>
                <p>{event.emotions.join(' · ')}</p>
                <p className="whitespace-pre-wrap leading-relaxed">{event.narrative}</p>
              </div>
            </details>
          ))}
        </div>
      )}
      {events.length > 0 && (
        <div className="rounded-lg border border-primary/20 p-4 space-y-3">
          <h4 className="font-medium">O que minha história ajuda a compreender?</h4>
          <p className="text-sm">
            Ao olhar um marco, pergunte-se: como eu me sentia, do que precisava e como buscava me
            proteger? O que reconheço hoje e que apoios podem me ajudar?
          </p>
          <p className="text-sm text-muted-foreground">
            Você pode explorar essas relações com sua profissional, inclusive quando ainda não
            souber a resposta. Um acontecimento não define sozinho seu funcionamento.
          </p>
          {dimensions
            .filter(
              (dimension) =>
                ['mente', 'regulacao', 'relacoes'].includes(dimension.id) &&
                dimension.detailedRows.some((row) => row.sourceResponseId),
            )
            .map((dimension) => (
              <details key={dimension.id} className="text-sm">
                <summary className="cursor-pointer font-medium">
                  Minhas respostas atuais · {dimension.title}
                </summary>
                <ul className="mt-2 space-y-2">
                  {dimension.detailedRows
                    .filter((row) => row.sourceResponseId)
                    .map((row, index) => (
                      <li key={`${row.sourceResponseId}-${index}`}>
                        <strong>{row.label}: </strong>
                        {row.text}
                      </li>
                    ))}
                </ul>
              </details>
            ))}
          <p className="text-sm text-primary">
            Depois desta leitura, volte ao percurso para olhar seu presente e escolher o que deseja
            construir no futuro.
          </p>
        </div>
      )}
      {directions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Presente e direções futuras</h4>
          {directions.map((value) => (
            <details key={value.id} className="rounded-lg bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm">
                <span className="font-medium">{value.title}</span> · {LIFE_HORIZONS[value.horizon]}
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  {value.access_class === 'participant_private'
                    ? 'Só para mim'
                    : 'Compartilhado com minha profissional'}
                </p>
                <p className="whitespace-pre-wrap">{value.narrative}</p>
                {value.first_step && (
                  <p className="whitespace-pre-wrap">
                    <strong>Próximo passo: </strong>
                    {value.first_step}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}
