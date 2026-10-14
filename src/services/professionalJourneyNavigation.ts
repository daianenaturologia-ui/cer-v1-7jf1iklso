export type ProfessionalJourneyTab =
  | 'resumo'
  | 'sessoes'
  | 'consciencia'
  | 'equilibrio'
  | 'evolucao'

/** Old bookmarks keep leading to the same care tool after the journey is reorganized. */
export function professionalJourneyTab(
  tab: string | null,
  tool: string | null,
): ProfessionalJourneyTab {
  if (tab === 'consciencia' || tab === 'sessoes') return tab
  if (
    ['plano', 'experimentos', 'equilibrio'].includes(tab || '') ||
    (tab === 'evolucao' && ['plano', 'planner'].includes(tool || ''))
  )
    return 'equilibrio'
  if (tab === 'revisao' || tab === 'evolucao') return 'evolucao'
  return 'resumo'
}
