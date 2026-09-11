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

  if (roles.includes('admin')) {
    // Admin puro: direcionar para painel profissional com visão de governança e auditoria
    return <ProfissionalHome />
  }

  // Item 26: unknown/no valid role -> safe error "Sua conta está sendo configurada. Fale com sua profissional."
  // NUNCA fallback genérico para InteragenteHome!
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full p-6 text-center space-y-4 border rounded-xl bg-card shadow-sm">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <span className="font-serif font-bold text-lg">!</span>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-serif font-semibold text-foreground">
            Sua conta está sendo configurada
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ainda não identificamos um papel de acesso ativo vinculado ao seu perfil. Fale com sua
            profissional para concluir a liberação do seu espaço.
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomeDispatcher
