import React from 'react'
import { lifeTimeLabel, type LifeEvent } from '@/services/lifeTimeline'
import { LIFE_HORIZONS, type LifeDirection } from '@/services/lifeDirections'

/** Live participant-owned projection. Kept separate from professional published snapshots. */
export function LifeMapTrail({ events, directions }: { events: LifeEvent[]; directions: LifeDirection[] }) {
  if (!events.length && !directions.length) return null
  return (
    <section className="rounded-xl border p-5 space-y-4" aria-label="Minha história no Mapa CER">
      <h3 className="font-serif text-lg text-primary">Minha história em movimento</h3>
      <p className="text-sm text-muted-foreground">Esta parte acompanha seus registros da Linha da Vida. Histórias particulares ficam apenas na sua visão; a leitura profissional compartilhada mantém a data e a versão em que foi revisada.</p>
      {events.length > 0 && <div className="space-y-3"><h4 className="font-medium text-sm">Marcos da minha história</h4>{events.map(event => <details key={event.id} className="rounded-lg bg-muted/30 p-3">
        <summary className="cursor-pointer text-sm"><span className="font-medium">{event.title}</span> · {lifeTimeLabel(event)}</summary>
        <div className="mt-3 space-y-2 text-sm"><p className="text-xs text-muted-foreground">{event.access_class === 'participant_private' ? 'Só para mim' : 'Compartilhado com minha profissional'}</p><p>{event.emotions.join(' · ')}</p><p className="whitespace-pre-wrap leading-relaxed">{event.narrative}</p></div>
      </details>)}</div>}
      {directions.length > 0 && <div className="space-y-3"><h4 className="font-medium text-sm">Presente e direções futuras</h4>{directions.map(value => <details key={value.id} className="rounded-lg bg-muted/30 p-3">
        <summary className="cursor-pointer text-sm"><span className="font-medium">{value.title}</span> · {LIFE_HORIZONS[value.horizon]}</summary><div className="mt-3 space-y-2 text-sm"><p className="text-xs text-muted-foreground">{value.access_class === 'participant_private' ? 'Só para mim' : 'Compartilhado com minha profissional'}</p><p className="whitespace-pre-wrap">{value.narrative}</p>{value.first_step && <p className="whitespace-pre-wrap"><strong>Próximo passo: </strong>{value.first_step}</p>}</div>
      </details>)}</div>}
    </section>
  )
}
