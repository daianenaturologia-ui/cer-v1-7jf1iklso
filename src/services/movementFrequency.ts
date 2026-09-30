// The existing five choices are authored in build07cPrompts; no rating is inferred.
export function readMovementRatings(value: any): Record<string, string> {
  const source = value?.structured_value ?? value
  const ratings = source?.ratings ?? source
  if (!ratings || typeof ratings !== 'object' || Array.isArray(ratings)) return {}
  return Object.fromEntries(
    Object.entries(ratings).filter(
      ([key, val]) =>
        (key.startsWith('cartao_') ||
          [
            'insistente',
            'prestativo',
            'hiper_realizador',
            'vitima',
            'hiper_racional',
            'hipervigilante',
            'inquieto',
            'comandante',
            'evitativo',
            'critico',
          ].includes(key)) &&
        typeof val === 'string',
    ),
  ) as Record<string, string>
}

export function readSelectedIds(value: any): string[] {
  const source = value?.structured_value ?? value
  const ids = Array.isArray(source)
    ? source
    : (source?.selectedOptionIds ?? source?.value ?? source?.choice ?? source?.legacy_selected_ids)
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []
}

export function movementFrequencyComplete(
  value: any,
  options: { id: string }[],
  choices: string[],
): boolean {
  const ratings = readMovementRatings(value)
  return options.length > 0 && options.every((option) => choices.includes(ratings[option.id]))
}

export function movementReportValues(value: any): Record<string, string> {
  const ratings = readMovementRatings(value)
  // A historical checkbox identifies a movement; it says nothing about frequency.
  for (const id of readSelectedIds(value)) {
    if (id.startsWith('cartao_') && !ratings[id]) ratings[id] = 'Informação ainda não disponível'
  }
  return ratings
}

export function frequentMovementCount(value: any): number {
  return Object.values(readMovementRatings(value)).filter((v) =>
    /frequente|frequência|muita força|sob pressão/i.test(v),
  ).length
}
