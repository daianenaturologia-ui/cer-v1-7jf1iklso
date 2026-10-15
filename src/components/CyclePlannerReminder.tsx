import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cycleJournalService, cyclePosition, localDay } from '@/services/cycleJournal'
/** Opt-in reminder. Does not change commitments or disclose journal content. */
export function CyclePlannerReminder({ enrollmentId }: { enrollmentId: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const profile = await cycleJournalService.profile(enrollmentId)
        if (!active) return
        if (!profile.planner_reminders) {
          setLabel('')
          return
        }
        const entries = await cycleJournalService.list(enrollmentId)
        if (!active) return
        const position = cyclePosition(entries, profile, localDay())
        setLabel(
          position.label === 'Menstruação registrada'
            ? 'Você registrou menstruação hoje. Como está sua disposição?'
            : profile.context === 'natural' &&
                profile.cycle_length &&
                position.day >= profile.cycle_length - 5 &&
                position.day <= profile.cycle_length
              ? 'Você pode estar perto da próxima menstruação (estimativa). Como está hoje?'
              : 'Como estão seu corpo e sua disposição hoje?',
        )
      } catch {
        if (active) setLabel('')
      }
    }
    setLabel('')
    void load()
    window.addEventListener('cer-cycle-journal-changed', load)
    return () => {
      active = false
      window.removeEventListener('cer-cycle-journal-changed', load)
    }
  }, [enrollmentId])
  if (!label) return null
  return (
    <aside className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
      <span>{label} Você pode reservar um intervalo ou adaptar uma atividade. </span>
      <Link className="underline text-primary" to="/mandala">
        Escutar meu ritmo
      </Link>
    </aside>
  )
}
