import { NavLink } from 'react-router-dom'
export function JourneyNavigation() {
  return (
    <nav
      aria-label="Meu cotidiano"
      className="cer-journey-nav flex max-w-full flex-wrap gap-1 rounded-2xl bg-muted/50 p-1 text-sm"
    >
      {[
        ['/', 'Jornada'],
        ['/planner', 'Agenda'],
        ['/experimentos', 'Práticas'],
        ['/mandala', 'Mandala'],
      ].map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `inline-flex min-h-11 items-center rounded-full px-3 py-2 transition-colors ${isActive ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
