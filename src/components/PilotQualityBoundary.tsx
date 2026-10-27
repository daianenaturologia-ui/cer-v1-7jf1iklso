import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { reportIncident, readQuality, setQualityEnrollment, type FeedbackContext, type IncidentArea } from '@/services/pilotQuality'
import { Button } from './ui/button'

export class PilotQualityBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { reportIncident('ui_exception', 'other') }
  render() {
    if (this.state.failed) return <section className="mx-auto max-w-lg p-6 space-y-4" role="alert">
      <h1 className="text-xl font-semibold">Vamos retomar com cuidado</h1>
      <p>Esta tela encontrou uma falha. O que já foi salvo continua no seu acompanhamento. O que ainda não foi enviado pode precisar ser preenchido novamente.</p>
      <Button onClick={() => this.setState({ failed: false })}>Tentar abrir a tela novamente</Button>
      <p><a className="underline" href="/feedback">Relatar uma dificuldade</a></p>
    </section>
    return this.props.children
  }
}
export function PilotQualityTools() {
  const { user, isAuthenticated, isProfissional, isInteragente, isDemo } = useAuth()
  const { pathname } = useLocation()
  const area: IncidentArea = pathname.startsWith('/profissional') ? 'professional' : pathname === '/feedback' ? 'feedback' : 'journey'
  useEffect(() => {
    setQualityEnrollment('')
    let active = true
    if (isAuthenticated && isInteragente && !isDemo) void readQuality<FeedbackContext[]>('context').then((rows) => { if (active) setQualityEnrollment(rows.length === 1 ? rows[0].id : '') }).catch(() => {})
    return () => { active = false; setQualityEnrollment('') }
  }, [user?.id, isAuthenticated, isInteragente, isDemo])
  useEffect(() => {
    if (!isAuthenticated || isDemo) return
    const onError = () => reportIncident('ui_exception', area)
    const onRejection = () => reportIncident('unhandled_rejection', area)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection) }
  }, [isAuthenticated, isDemo, area])
  if (!isAuthenticated || isDemo) return null
  return <aside aria-label="Cuidado com a experiência" className="border-b bg-background px-4 py-2 text-sm flex flex-wrap justify-end gap-4">
    {isInteragente && <Link className="underline underline-offset-4" to="/feedback">Sua experiência no CER</Link>}
    {isProfissional && <Link className="underline underline-offset-4" to="/profissional/qualidade">Feedbacks e qualidade</Link>}
  </aside>
}
