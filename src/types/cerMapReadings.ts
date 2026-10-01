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

export interface CerMapReadingDimension {
  id: string
  title: string
  explanation: string
  summary: string
  interpretation: string
  summaryRows: CerMapReadingRow[]
  detailedRows: CerMapReadingRow[]
  referenceIds: string[]
}

/** A reviewed, versioned document; never re-derived when the participant opens it. */
export interface CerMapReadingSnapshot {
  schemaVersion: 1
  enrollmentId: string
  participantName: string
  generatedAt: string
  sourceResponseIds: string[]
  overview: string
  integration: string
  history: string
  dimensions: CerMapReadingDimension[]
  references: CerMapReference[]
  reviewedBy?: string
  reviewedAt?: string
}
