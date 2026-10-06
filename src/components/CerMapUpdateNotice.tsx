import React, { useEffect, useState } from 'react'
import type { CerMapRecord, CerMapItemRecord } from '@/types/cer'
import { isCerMapReadingSnapshot } from '@/services/cerMapReadings'
import { Button } from '@/components/ui/button'
import { CerArtStrip } from '@/components/CerArtwork'

export function publishedMapNoticeKey(
  map: CerMapRecord | null,
  enrollmentId: string,
): string | null {
  if (
    !map ||
    map.enrollment_id !== enrollmentId ||
    map.status !== 'published' ||
    !map.id ||
    !isCerMapReadingSnapshot(map.reading_snapshot) ||
    map.reading_snapshot.enrollmentId !== enrollmentId
  )
    return null
  return `${map.id}:${map.version_number}:${map.reading_snapshot.generatedAt}`
}

/** Browser-local acknowledgement. Saving a life event does not announce a new report. */
export function CerMapUpdateNotice({
  map,
  enrollmentId,
  onOpen,
}: {
  map: (CerMapRecord & { items: CerMapItemRecord[] }) | null
  enrollmentId: string
  onOpen: () => void
}) {
  const version = publishedMapNoticeKey(map, enrollmentId)
  const storageKey = `cer-map-read-version:${enrollmentId}`
  const [acknowledged, setAcknowledged] = useState<string | null>(null)
  useEffect(() => {
    try {
      setAcknowledged(localStorage.getItem(storageKey))
    } catch {
      setAcknowledged(null)
    }
  }, [storageKey])
  if (!version || acknowledged === `${storageKey}:${version}`) return null
  const open = () => {
    const value = `${storageKey}:${version}`
    setAcknowledged(value)
    try {
      localStorage.setItem(storageKey, value)
    } catch {
      /* Reading remains available. */
    }
    onOpen()
  }
  return (
    <section
      role="status"
      aria-label="Atualização do Mapa CER"
      className="cer-reading-panel border bg-card p-5 space-y-3"
    >
      <CerArtStrip variant="path" compact />
      <h2 className="font-serif text-lg">
        {(map?.version_number || 0) > 1
          ? 'Seu Mapa CER foi atualizado'
          : 'Seu Mapa CER está disponível'}
      </h2>
      <p className="text-sm text-muted-foreground">
        Uma leitura para compreender seu funcionamento, nas versões resumida e detalhada.
      </p>
      <Button onClick={open}>Ver meu Mapa CER</Button>
    </section>
  )
}
