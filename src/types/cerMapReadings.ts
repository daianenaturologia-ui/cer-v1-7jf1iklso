import type { LifeDirection } from '@/services/lifeDirections'
import type { LifeEvent } from '@/services/lifeTimeline'
export interface CerMapReference {
  id: string
  citation: string
  url?: string
  kind: 'pesquisa' | 'tradição' | 'institucional' | 'método'
  scope: string
}

export interface CerMapReadingRow {
  label: string
  text: string
  sourceResponseId?: string
  sourcePromptKey?: string
}

export interface AyurvedaBodyReading {
  currentDoshas: ('Vata' | 'Pitta' | 'Kapha')[]
  currentSummary: string
  currentFacts: string[]
  constitutionEvidence: string[]
  currentDigestive: boolean
  agniType: string
  amaPresence: string
  agniSummary: string
  agniEvidence: string[]
  amaSummary: string
  amaEvidence: string[]
  digestiveReference: string
}

export interface CerMapReadingDimension {
  id: string
  title: string
  explanation: string
  summary: string
  interpretation: string
  summaryRows: CerMapReadingRow[]
  detailedRows: CerMapReadingRow[]
  referenceIds: string[]
  /** Educational profile from the existing constitutional hypothesis; never inferred from chart percentages. */
  ayurvedaReading?: AyurvedaBodyReading
  ayurvedaConstitution?: ('Vata' | 'Pitta' | 'Kapha')[]
  personalSections?: CerPersonalSection[]
  insights?: CerResourceInsight[]
}

export interface CerPersonalSection {
  title: string
  text: string
  sourceResponseIds: string[]
}

export interface CerResourceInsight {
  id: string
  kind: 'strength' | 'difficulty'
  label: string
  description: string
  origins: {
    dimensionId: string
    label: string
    basis: 'response' | 'reference' | 'professional'
    sourceResponseIds: string[]
  }[]
}

/** A reviewed, versioned document; never re-derived when the participant opens it. */
export interface CerMapElementReading {
  summary: string
  observations: string[]
  interpretation: string
  sections?: { title: string; text: string }[]
  resources: string[]
  costs: string[]
  connections: string[]
  questions: string[]
  sourceResponseIds?: string[]
}

export interface CerMapReadingSnapshot {
  schemaVersion: 1
  enrollmentId: string
  participantName: string
  generatedAt: string
  sourceResponseIds: string[]
  overview: string
  integration: string
  history: string
  sessionUpdates?: {
    sessionId: string
    sessionDate: string
    summary: string
    preparedBy: string
    preparedAt: string
  }[]
  lifeDirections?: LifeDirection[]
  lifeEvents?: LifeEvent[]
  lifeConnections?: { eventId: string; responseId: string; text: string; question: string }[]
  elementReadings?: Record<string, CerMapElementReading>
  dimensions: CerMapReadingDimension[]
  references: CerMapReference[]
  reviewedBy?: string
  reviewedAt?: string
}
