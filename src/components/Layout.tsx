/* Layout Component - A component that wraps the main content of the app
   - Use this file to add a header, footer, or other elements that should be present on every page
   - This component is used in the App.tsx file to wrap the main content of the app */

import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { demoAdapter } from '@/services/demoAdapter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRightLeft, LogOut } from 'lucide-react'

export default function Layout() {
  const [isDemo, setIsDemo] = useState(() => demoAdapter.isEnabled())
  const [persona, setPersona] = useState(() => demoAdapter.getActivePersona())
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = demoAdapter.subscribe(() => {
      setIsDemo(demoAdapter.isEnabled())
      setPersona(demoAdapter.getActivePersona())
    })
    return () => unsubscribe()
  }, [])

  const handleTogglePersona = () => {
    const next = persona === 'mariana' ? 'daiane' : 'mariana'
    demoAdapter.setActivePersona(next)
    // Redireciona para o root correspondente da persona
    if (next === 'daiane') {
      navigate('/profissional')
    } else {
      navigate('/')
    }
  }

  const handleExitDemo = () => {
    demoAdapter.disableDemo()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-clip">
      {isDemo && (
        <aside
          role="region"
          aria-label="Controles do modo de demonstração"
          className="sticky top-0 z-50 bg-amber-500/15 border-b border-amber-500/30 text-amber-950 dark:text-amber-100 backdrop-blur-md px-3 py-1.5 shadow-xs"
        >
          <div className="mx-auto flex max-w-6xl min-w-0 flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="flex min-w-0 items-center gap-1 font-semibold text-amber-900 dark:text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Modo demonstração — dados fictícios</span>
                <span className="sm:hidden">Demonstração</span>
              </span>
              <Badge
                variant="outline"
                className="max-w-full whitespace-normal text-[10px] bg-background/80 border-amber-500/40 text-foreground font-mono px-1.5 py-0"
              >
                Visão atual:{' '}
                {persona === 'daiane' ? 'Daiane (Profissional)' : 'Mariana (Interagente)'}
              </Badge>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/bancada-ayurveda')}
                className="h-7 text-xs gap-1.5 bg-background/90 hover:bg-background border-amber-500/40 text-foreground px-2.5"
              >
                <Sparkles className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                <span className="hidden sm:inline">Bancada Ayurveda</span>
                <span className="sm:hidden">Ayurveda</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleTogglePersona}
                className="h-7 text-xs gap-1.5 bg-background/90 hover:bg-background border-amber-500/40 text-foreground px-2.5"
              >
                <ArrowRightLeft className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                <span className="hidden sm:inline">
                  {persona === 'mariana'
                    ? 'Alternar para Daiane (Profissional)'
                    : 'Alternar para Mariana (Interagente)'}
                </span>
                <span className="sm:hidden">
                  {persona === 'mariana' ? 'Ver Daiane' : 'Ver Mariana'}
                </span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleExitDemo}
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Sair da demonstração</span>
                <span className="sm:hidden">Sair</span>
              </Button>
            </div>
          </div>
        </aside>
      )}

      <main className="flex min-w-0 max-w-full flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
