import type { CerMapReadingSnapshot, CerResourceInsight } from '@/types/cerMapReadings'
import { CER_PROTECTION_PATTERNS } from './cerProtectionPatterns'
import { patternResources } from './cerPersonalReadings'

const doshaResources = {
  Vata: ['Criatividade', 'Flexibilidade', 'Sensibilidade', 'Enxergar alternativas'],
  Pitta: ['Discernimento', 'Foco', 'Iniciativa', 'Transformar intenção em ação'],
  Kapha: ['Constância', 'Paciência', 'Sustentação', 'Construir continuidade'],
}
const doshaCosts = {
  Vata: [
    'Dispersão diante de muitos estímulos',
    'A mobilidade de Vata pode precisar de regularidade para sustentar atenção e recuperação.',
  ],
  Pitta: [
    'Exigência que reduz a flexibilidade',
    'A intensidade de Pitta pode precisar de medida para que foco e iniciativa não se tornem cobrança.',
  ],
  Kapha: [
    'Dificuldade de mudar um ritmo conhecido',
    'A continuidade de Kapha pode precisar de apoio para incorporar mudanças e mobilização.',
  ],
}
const normalized = (label: string) =>
  label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
export const resourceId = (kind: string, label: string) => `${kind}:${normalized(label)}`

/** Reads this document only. Never loads a private questionnaire or re-scores a published map. */
export function integratedResources(snapshot: CerMapReadingSnapshot): CerResourceInsight[] {
  const pool: CerResourceInsight[] = []
  const put = (item: CerResourceInsight) => {
    const id = resourceId(item.kind, item.label)
    const existing = pool.find((i) => i.id === id)
    if (existing) {
      for (const origin of item.origins)
        if (!existing.origins.some((o) => JSON.stringify(o) === JSON.stringify(origin)))
          existing.origins.push({ ...origin, sourceResponseIds: [...origin.sourceResponseIds] })
    } else
      pool.push({
        ...item,
        id,
        origins: item.origins.map((o) => ({ ...o, sourceResponseIds: [...o.sourceResponseIds] })),
      })
  }
  for (const dimension of snapshot.dimensions)
    for (const insight of dimension.insights || []) put(insight)
  const body = snapshot.dimensions.find((d) => d.id === 'corpo')
  for (const dosha of body?.ayurvedaConstitution || [])
    for (const label of doshaResources[dosha] || [])
      put({
        id: resourceId('strength', label),
        kind: 'strength',
        label,
        description: `Potencialidade associada a ${dosha} no referencial ayurvédico. Você pode reconhecer se e como ela aparece na sua experiência.`,
        origins: [
          {
            dimensionId: 'corpo',
            label: `Constituição ${dosha}`,
            basis: 'reference',
            sourceResponseIds: [],
          },
        ],
      })
  for (const dosha of body?.ayurvedaConstitution || []) {
    const [label, description] = doshaCosts[dosha]
    put({
      id: resourceId('difficulty', label),
      kind: 'difficulty',
      label,
      description,
      origins: [
        {
          dimensionId: 'corpo',
          label: `Constituição ${dosha}`,
          basis: 'reference',
          sourceResponseIds: [],
        },
      ],
    })
  }
  if (body?.ayurvedaReading?.currentFacts.length)
    put({
      id: 'difficulty:corpo-momento',
      kind: 'difficulty',
      label: 'Cuidar das mudanças do meu corpo',
      description: body.ayurvedaReading.currentFacts.join(' '),
      origins: [
        {
          dimensionId: 'corpo',
          label: 'Momento atual · Vikriti',
          basis: 'response',
          sourceResponseIds: body.detailedRows.flatMap((r) =>
            r.sourceResponseId ? [r.sourceResponseId] : [],
          ),
        },
      ],
    })
  // Legacy documents retain their reviewed content. Only a recognized, reported movement adds
  // catalog potentialities; unknown/rare patterns never turn into personal weaknesses.
  const mind = snapshot.dimensions.find((d) => d.id === 'mente')
  if (!mind?.insights?.length)
    for (const row of mind?.detailedRows || []) {
      if (!/algumas situações|frequência|frequencia|sob pressão|muita força/i.test(row.text))
        continue
      const pattern = Object.values(CER_PROTECTION_PATTERNS).find(
        (p) => p.canonicalKey === row.label || p.movementDescription === row.label,
      )
      const profile = pattern && patternResources[pattern.canonicalKey]
      if (!profile) continue
      for (const [kind, value] of [
        ['strength', profile.strength],
        ['difficulty', profile.difficulty],
      ] as const)
        put({
          id: resourceId(kind, value[0]),
          kind,
          label: value[0],
          description: value[1],
          origins: [
            {
              dimensionId: 'mente',
              label: pattern.movementDescription,
              basis: 'reference',
              sourceResponseIds: row.sourceResponseId ? [row.sourceResponseId] : [],
            },
          ],
        })
    }
  if (snapshot.reviewedAt && snapshot.reviewedBy)
    for (const dimension of snapshot.dimensions) {
      const reading = snapshot.elementReadings?.[dimension.id]
      if (!reading || dimension.insights?.length) continue
      for (const kind of ['strength', 'difficulty'] as const)
        for (const label of (kind === 'strength' ? reading.resources : reading.costs) || []) {
          if (/não há|ainda não|não estabelecid|não registrad/i.test(label)) continue
          put({
            id: resourceId(kind, label),
            kind,
            label,
            description: 'Leitura registrada na versão revisada do mapa.',
            origins: [
              {
                dimensionId: dimension.id,
                label: dimension.title,
                basis: 'professional',
                sourceResponseIds: reading.sourceResponseIds || [],
              },
            ],
          })
        }
    }
  return pool
}

export function resourceMapFingerprint(items: CerResourceInsight[]): string {
  let hash = 2166136261
  for (const char of JSON.stringify(items.map((i) => [i.id, i.description, i.origins])))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `resources-v1-${(hash >>> 0).toString(16)}`
}
