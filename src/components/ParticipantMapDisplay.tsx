/**
 * Build 06: Participant Display — Visualização do Mapa CER da Participante
 *
 * Princípios Congelados:
 * - Participante vê somente o current published Map do próprio enrollment.
 * - BACKEND PRECISO. FRONTEND HUMANO.
 * - item_text é exibido com organização humana e acolhedora das seções.
 * - ZERO IDs técnicos, ZERO status epistemológicos, ZERO terminologia de Knowledge,
 *   ZERO referências a Evidências / Associações / Sinais, ZERO scores ou números de teste.
 * - Não obrigar UI a mostrar as 11 seções vazias: priorizar seções com conteúdo;
 *   placeholder com microcopy centralizado ("Ainda estou descobrindo isso.") onde aplicável.
 */

import React from 'react'
import { isCerMapReadingSnapshot, adaptLegacyMapItemsToReadings } from '@/services/cerMapReadings'
import { CerMapReadingsView } from './experience/CerMapReadingsView'
import type { CerMapRecord, CerMapItemRecord } from '@/types/cer'

interface ParticipantMapDisplayProps {
  map: CerMapRecord & { items: CerMapItemRecord[] }
  participantName?: string
}

export const ParticipantMapDisplay: React.FC<ParticipantMapDisplayProps> = ({
  map,
  participantName = 'você',
}) => {
  if (isCerMapReadingSnapshot(map.reading_snapshot)) {
    return <CerMapReadingsView snapshot={map.reading_snapshot} />
  }

  // Adaptador puro para mapas legados:
  // Renderiza no novo layout de CerMapReadingsView com todo texto longo sob clique em Dialog
  // com rótulo explícito "Conteúdo do mapa publicado anteriormente" / "Versão anterior do mapa".
  const adaptedSnapshot = adaptLegacyMapItemsToReadings(
    map.items || [],
    map.enrollment_id,
    participantName,
    map.version_number || 1,
  )

  return (
    <div className="space-y-3">
      <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/5 text-xs text-muted-foreground flex items-center justify-between">
        <span className="font-medium text-foreground">
          Versão anterior do mapa (v{map.version_number || 1})
        </span>
        <span className="text-[11px]">Conteúdo do mapa publicado anteriormente</span>
      </div>
      <CerMapReadingsView snapshot={adaptedSnapshot} />
    </div>
  )
}
export default ParticipantMapDisplay
