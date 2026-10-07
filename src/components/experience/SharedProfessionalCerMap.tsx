import React, { useEffect, useState } from 'react'
import type { CerMapRecord, CerMapItemRecord, ExperienceResponseRecord } from '@/types/cer'
import { cerMapService } from '@/services/cerMapService'
import { buildCerMapReadings } from '@/services/cerMapReadings'
import { ParticipantMapDisplay } from '@/components/ParticipantMapDisplay'
import { CerMapReadingsView } from './CerMapReadingsView'

/** Both roles read the same published document. Drafts never replace it. */
export function SharedProfessionalCerMap({
  enrollmentId,
  participantName,
  responses,
}: {
  enrollmentId: string
  participantName: string
  responses: ExperienceResponseRecord[]
}) {
  const [state, setState] = useState<{
    enrollmentId: string
    map: (CerMapRecord & { items: CerMapItemRecord[] }) | null
    loading: boolean
    error: boolean
  }>({ enrollmentId: '', map: null, loading: true, error: false })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    let generation = 0
    const refresh = async () => {
      const request = ++generation
      setState({ enrollmentId, map: null, loading: true, error: false })
      try {
        const map = await cerMapService.getCurrentPublishedMap(enrollmentId)
        if (!active || request !== generation) return
        setState({
          enrollmentId,
          map: map?.enrollment_id === enrollmentId && map.status === 'published' ? map : null,
          loading: false,
          error: false,
        })
      } catch {
        if (active && request === generation)
          setState({ enrollmentId, map: null, loading: false, error: true })
      }
    }
    void refresh()
    const published = (event: Event) => {
      if ((event as CustomEvent).detail?.enrollmentId === enrollmentId) void refresh()
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('cer-map-published', published)
    return () => {
      active = false
      window.removeEventListener('focus', refresh)
      window.removeEventListener('cer-map-published', published)
    }
  }, [enrollmentId, retry])
  if (state.enrollmentId !== enrollmentId || state.loading)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Organizando o Mapa CER…
      </p>
    )
  if (state.error)
    return (
      <p role="alert" className="text-sm">
        Não foi possível atualizar o mapa.{' '}
        <button className="text-primary underline" onClick={() => setRetry((n) => n + 1)}>
          Tentar novamente
        </button>
      </p>
    )
  if (state.map) return <ParticipantMapDisplay map={state.map} participantName={participantName} />
  return (
    <CerMapReadingsView
      snapshot={buildCerMapReadings(responses, enrollmentId, participantName, {
        literalOnly: true,
      })}
      initial
    />
  )
}
