import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { InteragenteHome } from './InteragenteHome'
import { ProfissionalHome } from './ProfissionalHome'

export const HomeDispatcher: React.FC = () => {
  const { isAuthenticated, isLoading, isProfissional, isInteragente, roles } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-wide">Carregando painel...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Despacha conforme o papel ativo
  if (isProfissional || roles.includes('profissional')) {
    return <ProfissionalHome />
  }

  if (isInteragente || roles.includes('interagente')) {
    return <InteragenteHome />
  }

  // Fallback se autenticado mas sem papel atribuído (ex: admin puro ou conta em configuração)
  return <InteragenteHome />
}

export default HomeDispatcher
