import React from 'react'
import type {
  CerMapRecord,
  CerMapItemRecord,
  ExperienceResponseRecord,
  EnrollmentExperienceRecord,
} from '@/types/cer'
import { ParticipantMapDisplay } from '@/components/ParticipantMapDisplay'
import { consciousnessCoverage } from '@/services/cerMapReadings'

interface Props {
  responses: ExperienceResponseRecord[]
  progress?: EnrollmentExperienceRecord[]
  onClose?: () => void
  participantName: string
  currentMap?: (CerMapRecord & { items: CerMapItemRecord[] }) | null
}

export function ParticipantIntegrativeMapView({
  responses,
  progress = [],
  currentMap,
  onClose,
}: Props) {
  if (currentMap?.status === 'published') return <ParticipantMapDisplay map={currentMap} />
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
          ? 'Suas descobertas estão registradas. O Mapa CER será compartilhado após o primeiro encontro e a revisão da profissional.'
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
      <p className="text-sm text-muted-foreground">
        O mapa terá uma versão resumida e outra aprofundada, ambas com explicações e referências.
        Até a publicação, você pode consultar suas respostas nos panoramas de cada dimensão.
      </p>
    </div>
  )
}
export default ParticipantIntegrativeMapView
