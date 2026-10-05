import { NavLink } from 'react-router-dom'
export function JourneyNavigation() {
  return (
    <nav
      aria-label="Meu cotidiano"
      className="flex gap-1 rounded-full bg-muted/50 p-1 text-[11px] sm:text-xs"
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
            `rounded-full px-2 sm:px-3 py-2 transition-colors ${isActive ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
