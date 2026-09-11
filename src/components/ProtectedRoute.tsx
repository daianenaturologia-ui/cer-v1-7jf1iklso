import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRoleType } from '@/types/cer'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRoleType
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, roles, accountStatus } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-wide">Carregando autenticação...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se a usuária estiver autenticada com status 'invited', deve primeiro definir sua senha no Login
  if (accountStatus === 'invited') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (accountStatus !== 'active') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
