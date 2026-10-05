export interface AgendaEvent {
  id: string
  title: string
  start: string
  end?: string
  kind: 'focus' | 'rest' | 'life' | 'development' | 'care'
  completed?: boolean
}
export function mondayOf(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}
export function moveDay(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
export function localDateInput(iso: string | Date) {
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
export function eventsOnDay(events: AgendaEvent[], day: Date) {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = moveDay(start, 1)
  return events
    .filter((e) => {
      const s = Date.parse(e.start),
        t = e.end ? Date.parse(e.end) : s + 1800000
      return Number.isFinite(s) && s < end.getTime() && t > start.getTime()
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
}
// Separar eventos simultâneos para que nenhum fique escondido atrás de outro.
export function eventLanes(events: AgendaEvent[]) {
  const ends: number[] = []
  const result = events.map((event) => {
    const start = Date.parse(event.start),
      end = event.end ? Date.parse(event.end) : start + 1800000
    let lane = ends.findIndex((last) => last <= start)
    if (lane < 0) lane = ends.length
    ends[lane] = end
    return { event, lane }
  })
  return result.map((r) => ({ ...r, lanes: Math.max(1, ends.length) }))
}
export function weekIcs(events: AgendaEvent[], week: Date, days = 5) {
  const finish = moveDay(week, days)
  const escape = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
  const stamp = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  const now = stamp(new Date().toISOString())
  // Sem notas, reflexões, contexto ou narrativa clínica no arquivo exportado.
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CER//Minha semana//PT',
    'CALSCALE:GREGORIAN',
    ...events
      .filter(
        (e) => Date.parse(e.start) >= week.getTime() && Date.parse(e.start) < finish.getTime(),
      )
      .flatMap((e) => [
        'BEGIN:VEVENT',
        `UID:${escape(e.id)}@cer`,
        `DTSTAMP:${now}`,
        `DTSTART:${stamp(e.start)}`,
        `DTEND:${stamp(e.end || new Date(Date.parse(e.start) + 1800000).toISOString())}`,
        `SUMMARY:${escape(e.title)}`,
        'END:VEVENT',
      ]),
    'END:VCALENDAR',
  ]
  // RFC 5545: folding counts UTF-8 octets, not characters; accents remain intact.
  return (
    lines
      .map((line) => {
        let out = '',
          row = '',
          bytes = 0
        for (const char of line) {
          const size = new TextEncoder().encode(char).length
          if (bytes + size > 73) {
            out += row + '\r\n '
            row = ''
            bytes = 1
          }
          row += char
          bytes += size
        }
        return out + row
      })
      .join('\r\n') + '\r\n'
  )
}
