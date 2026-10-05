import React, { useEffect, useState } from 'react'
import { LifeMapTrail } from './LifeMapTrail'
import { lifeTimelineService, type LifeEvent } from '@/services/lifeTimeline'
import { lifeDirectionsService, type LifeDirection } from '@/services/lifeDirections'
import type {
  CerMapRecord,
  CerMapItemRecord,
  ExperienceResponseRecord,
  EnrollmentExperienceRecord,
} from '@/types/cer'
import { ParticipantMapDisplay } from '@/components/ParticipantMapDisplay'
import { CerMapReadingsView } from './CerMapReadingsView'
import { buildCerMapReadings, consciousnessCoverage } from '@/services/cerMapReadings'

interface Props {
  responses: ExperienceResponseRecord[]
  progress?: EnrollmentExperienceRecord[]
  onClose?: () => void
  participantName: string
  enrollmentId?: string
  currentMap?: (CerMapRecord & { items: CerMapItemRecord[] }) | null
}

export function ParticipantIntegrativeMapView({
  responses,
  progress = [],
  currentMap,
  participantName,
  enrollmentId,
  onClose,
}: Props) {
  const [life, setLife] = useState<{id: string; events: LifeEvent[]; directions: LifeDirection[]; error: boolean}>({id: '', events: [], directions: [], error: false})
  useEffect(() => {
    let active = true
    let generation = 0
    setLife({id: '', events: [], directions: [], error: false})
    if (!enrollmentId) return
    const refresh = async () => {
      const current = ++generation
      const [history, directions] = await Promise.allSettled([lifeTimelineService.list(enrollmentId), lifeDirectionsService.list(enrollmentId)])
      if (!active || current !== generation) return
      setLife({id: enrollmentId,
        events: history.status === 'fulfilled' ? history.value.filter(e => e.enrollment_id === enrollmentId) : [],
        directions: directions.status === 'fulfilled' ? directions.value.filter(e => e.enrollment_id === enrollmentId) : [],
        error: history.status === 'rejected' || directions.status === 'rejected'})
    }
    const changed = (event: Event) => { if ((event as CustomEvent).detail?.enrollmentId === enrollmentId) void refresh() }
    const stored = (event: StorageEvent) => { if (event.key === `cer-demo-life-events-v1:${enrollmentId}` || event.key === `cer-demo-life-directions-v1:${enrollmentId}`) void refresh() }
    void refresh()
    window.addEventListener('cer-life-records-changed', changed)
    window.addEventListener('storage', stored)
    return () => { active = false; window.removeEventListener('cer-life-records-changed', changed); window.removeEventListener('storage', stored) }
  }, [enrollmentId])
  const ownLife = life.id === enrollmentId ? life : {events: [], directions: [], error: false}
  const trail = <><LifeMapTrail events={ownLife.events} directions={ownLife.directions}/>{ownLife.error && <p role="alert" className="text-sm text-destructive">Não foi possível atualizar os registros da Linha da Vida neste mapa. Feche e abra o mapa para tentar novamente.</p>}</>
  if (currentMap?.status === 'published') return <div className="space-y-5"><ParticipantMapDisplay map={currentMap} />{trail}</div>
  const initial = enrollmentId
    ? buildCerMapReadings(responses, enrollmentId, participantName, { literalOnly: true })
    : null
  if (initial && (initial.sourceResponseIds.length || ownLife.events.length || ownLife.directions.length)) {
    return (
      <div className="space-y-4 p-4" data-testid="participant-initial-map">
        {onClose && <button className="text-sm text-primary" onClick={onClose}>Voltar à Consciência</button>}
        <p className="text-xs font-semibold text-primary">Mapa inicial · a partir das suas respostas</p>
        <CerMapReadingsView snapshot={initial} initial />
        {trail}
      </div>
    )
  }
  const coverage = consciousnessCoverage(responses, progress)
  const started = coverage.filter((dimension) => dimension.started).length
  return (
    <div
      className="space-y-4 p-4"
      data-testid={
        started
          ? 'participant-integrative-map-awaiting-publication'
          : 'participant-integrative-map-empty'
      }
    >
      {onClose && (
        <button className="text-sm text-primary" onClick={onClose}>
          Voltar à Consciência
        </button>
      )}
      <h2 className="font-serif text-xl">Meu Mapa CER</h2>
      <p className="text-sm text-muted-foreground">
        {started
          ? 'Suas descobertas estão registradas. O mapa inicial aparece assim que suas respostas estiverem disponíveis aqui, sem esperar pelo primeiro encontro.'
          : 'Você ainda não iniciou as descobertas das dimensões.'}
      </p>
      <h3 className="text-sm font-semibold">Cobertura das dimensões ({started} de 6)</h3>
      <ul className="space-y-2 text-sm">
        {coverage.map((dimension) => (
          <li key={dimension.id} className="flex justify-between gap-4">
            <span>{dimension.title}</span>
            <span className="text-muted-foreground">
              {dimension.completed
                ? 'Concluída'
                : dimension.started
                  ? 'Iniciada'
                  : 'Ainda não iniciada'}
            </span>
          </li>
        ))}
      </ul>
      {trail}
      <p className="text-sm text-muted-foreground">
        O mapa terá uma versão resumida e outra aprofundada, ambas com explicações e referências.
        Enquanto as respostas são carregadas, você pode consultá-las nos panoramas de cada dimensão.
      </p>
    </div>
  )
}
export default ParticipantIntegrativeMapView
