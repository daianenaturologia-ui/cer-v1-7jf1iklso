import { expect, it } from 'vitest'
import {
  mondayOf,
  moveDay,
  eventsOnDay,
  eventLanes,
  weekIcs,
  type AgendaEvent,
} from './weeklyAgenda'
it('domingo pertence à semana anterior e navegação cruza meses sem alterar a origem', () => {
  const sunday = new Date(2026, 9, 11, 15)
  const monday = mondayOf(sunday)
  expect(monday.getDate()).toBe(5)
  expect(monday.getDay()).toBe(1)
  expect(sunday.getHours()).toBe(15)
  expect(moveDay(new Date(2026, 11, 28), 7).getFullYear()).toBe(2027)
})
it('evento atravessando meia-noite aparece nos dois dias e simultâneos ocupam faixas distintas', () => {
  const events: AgendaEvent[] = [
    {
      id: 'a',
      title: 'A',
      start: new Date(2026, 9, 5, 23, 30).toISOString(),
      end: new Date(2026, 9, 6, 1).toISOString(),
      kind: 'rest',
    },
    { id: 'b', title: 'B', start: new Date(2026, 9, 6, 0, 30).toISOString(), kind: 'life' },
  ]
  expect(eventsOnDay(events, new Date(2026, 9, 5))).toHaveLength(1)
  const next = eventsOnDay(events, new Date(2026, 9, 6))
  expect(next).toHaveLength(2)
  expect(eventLanes(next).map((r) => r.lane)).toEqual([0, 1])
})
it('exportação da semana usa UTC, escapa títulos e omite registros fora do intervalo', () => {
  const week = new Date(2026, 9, 5)
  const events: AgendaEvent[] = [
    {
      id: 'a',
      title: 'Pausa; café, vida\nnova',
      start: new Date(2026, 9, 5, 9).toISOString(),
      kind: 'rest',
    },
    {
      id: 'sat',
      title: 'Fim de semana',
      start: new Date(2026, 9, 10, 9).toISOString(),
      kind: 'life',
    },
  ]
  const text = weekIcs(events, week)
  expect(text).toContain('Pausa\\; café\\, vida\\nnova')
  expect(text).toContain('DTSTART:')
  expect(text).not.toContain('Fim de semana')
  expect(text).not.toContain('DESCRIPTION:')
  expect(weekIcs(events, week, 7)).toContain('Fim de semana')
})
it('linhas ICS com acentos respeitam limite em bytes sem dividir caracteres', () => {
  const week = new Date(2026, 9, 5)
  const text = weekIcs(
    [{ id: 'x', title: 'é'.repeat(160), start: week.toISOString(), kind: 'focus' }],
    week,
  )
  for (const line of text.split('\r\n'))
    expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  expect(text.replace(/\r\n /g, '')).toContain('SUMMARY:' + 'é'.repeat(160))
})
