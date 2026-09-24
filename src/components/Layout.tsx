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
    <div className="flex flex-col min-h-screen">
      {isDemo && (
        <aside
          role="region"
          aria-label="Controles do modo de demonstração"
          className="sticky top-0 z-50 bg-amber-500/15 border-b border-amber-500/30 text-amber-950 dark:text-amber-100 backdrop-blur-md px-3 py-1.5 shadow-xs"
        >
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-semibold text-amber-900 dark:text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Modo demonstração — dados fictícios</span>
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-background/80 border-amber-500/40 text-foreground font-mono px-1.5 py-0"
              >
                Visão atual:{' '}
                {persona === 'daiane' ? 'Daiane (Profissional)' : 'Mariana (Interagente)'}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/bancada-ayurveda')}
                className="h-7 text-xs gap-1.5 bg-background/90 hover:bg-background border-amber-500/40 text-foreground px-2.5"
              >
                <Sparkles className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                <span>Bancada Ayurveda</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleTogglePersona}
                className="h-7 text-xs gap-1.5 bg-background/90 hover:bg-background border-amber-500/40 text-foreground px-2.5"
              >
                <ArrowRightLeft className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                <span>
                  {persona === 'mariana'
                    ? 'Alternar para Daiane (Profissional)'
                    : 'Alternar para Mariana (Interagente)'}
                </span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleExitDemo}
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
              >
                <LogOut className="w-3 h-3" />
                <span>Sair da demonstração</span>
              </Button>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
