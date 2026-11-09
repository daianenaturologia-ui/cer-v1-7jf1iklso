// @vitest-environment jsdom
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { UserRoleType } from '@/types/cer'
import App from './App'

const { session, loadWorkspace } = vi.hoisted(() => ({
  session: {
    isAuthenticated: true,
    isLoading: false,
    accountStatus: 'active',
    roles: [] as UserRoleType[],
  },
  loadWorkspace: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: React.PropsWithChildren) => children,
  useAuth: () => session,
}))
vi.mock('./components/ParticipantWorkspace', () => ({
  ParticipantWorkspace: () => {
    loadWorkspace()
    return <p>Ficha profissional</p>
  },
}))
vi.mock('./pages/HomeDispatcher', () => ({ default: () => <p>Página inicial</p> }))
vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }))
vi.mock('./components/Layout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: Outlet }
})

afterEach(() => {
  cleanup()
  loadWorkspace.mockClear()
})

describe.each(['/profissional/participantes/teste?tab=sessoes', '/profissional/teste'])(
  '%s',
  (path) => {
    it.each<UserRoleType>(['interagente', 'admin'])(
      'redireciona o papel %s sem montar a ficha',
      (role) => {
        session.roles = [role]
        window.history.replaceState({}, '', path)
        render(<App />)

        expect(screen.getByText('Página inicial')).toBeTruthy()
        expect(loadWorkspace).not.toHaveBeenCalled()
        expect(window.location.pathname).toBe('/')
      },
    )

    it('mantém a ficha disponível para o papel profissional', () => {
      session.roles = ['profissional']
      window.history.replaceState({}, '', path)
      render(<App />)

      expect(screen.getByText('Ficha profissional')).toBeTruthy()
      expect(loadWorkspace).toHaveBeenCalled()
    })
  },
)
