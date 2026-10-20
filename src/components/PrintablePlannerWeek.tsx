import React from 'react'
import type { AgendaEvent } from '@/services/weeklyAgenda'

/** Print only visible titles and schedules, never private notes or clinical narratives. */
export function PrintablePlannerWeek({ days, events }: { days: Date[]; events: AgendaEvent[] }) {
  const inDay = (date: Date) =>
    events
      .filter((e) => new Date(e.start).toDateString() === date.toDateString())
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  return (
    <>
      <style>{`@media print {
      @page { size: A4 landscape; margin: 10mm; }
      body * { visibility: hidden !important; }
      .cer-print-sheet, .cer-print-sheet * { visibility: visible !important; }
      .cer-print-sheet { display: block !important; position: absolute; left: 0; top: 0; width: 100%; background: white; color: #183b35; font-size: 11pt; }
      .cer-print-sheet table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .cer-print-sheet td, .cer-print-sheet th { border: 1px solid #b8c8c2; padding: 9px; vertical-align: top; overflow-wrap: anywhere; }
      .cer-print-sheet h1 { font-size: 20pt; margin-bottom: 4mm; }
      .cer-print-sheet li { margin: 0 0 5mm; break-inside: avoid; }
    }`}</style>
      <section className="cer-print-sheet hidden" aria-label="Painel semanal para impressão">
        <h1>Minha semana · CER</h1>
        <p>
          Rotina combinada, espaço para viver. {days[0].toLocaleDateString('pt-BR')} a{' '}
          {days[6].toLocaleDateString('pt-BR')}.
        </p>
        <table>
          <thead>
            <tr>
              {days.map((day) => (
                <th key={day.toISOString()}>
                  {day.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {days.map((day) => (
                <td key={day.toISOString()}>
                  <ul>
                    {inDay(day).map((event) => (
                      <li key={event.id}>
                        <strong>
                          {new Date(event.start).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {event.end &&
                            `–${new Date(event.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        </strong>
                        <br />
                        {event.title}
                      </li>
                    ))}
                  </ul>
                  {!inDay(day).length && <p>Espaço livre</p>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p>
          Use este painel para lembrar dos combinados. Consulte o Plano de Desenvolvimento para as
          orientações completas de cada cuidado.
        </p>
      </section>
    </>
  )
}
