import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordAuthResponse, RecordModel } from 'pocketbase'
import type {
  UserAccountRecord,
  PersonRecord,
  UserRoleRecord,
  UserRoleType,
  UserAccountStatus,
} from '@/types/cer'
import { auditService } from '@/services/cer'
import { demoAdapter } from '@/services/demoAdapter'

interface AuthContextType {
  user: UserAccountRecord | RecordModel | null
  person: PersonRecord | null
  roles: UserRoleType[]
  accountStatus: UserAccountStatus | null
  isLoading: boolean
  isAuthenticated: boolean
  isInteragente: boolean
  isProfissional: boolean
  isAdmin: boolean
  isDemo: boolean
  mfaStatus: 'NOT_IMPLEMENTED'
  login: (email: string, pass: string) => Promise<RecordAuthResponse<RecordModel>>
  logout: () => void
  refreshAuthData: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [person, setPerson] = useState<PersonRecord | null>(null)
  const [roles, setRoles] = useState<UserRoleType[]>([])
  const [accountStatus, setAccountStatus] = useState<UserAccountStatus | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() => demoAdapter.isEnabled())

  const syncDemoState = useCallback(() => {
    const enabled = demoAdapter.isEnabled()
    setIsDemoActive(enabled)

    if (enabled) {
      const demoUser = demoAdapter.getCurrentUser()
      const demoPerson = demoAdapter.getCurrentPerson()
      const persona = demoAdapter.getActivePersona()

      setUser({
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        person_id: demoUser.person_id,
        status: demoUser.status,
      } as unknown as RecordModel)
      setPerson(demoPerson)
      setRoles([persona === 'daiane' ? 'profissional' : 'interagente'])
      setAccountStatus('active')
      setIsLoading(false)
      return true
    }
    return false
  }, [])

  const fetchUserData = async (userId: string) => {
    if (demoAdapter.isEnabled()) {
      syncDemoState()
      return
    }

    try {
      // 1. Obter usuário com dados atualizados
      const freshUser = await pb.collection('users').getOne(userId)
      setUser(freshUser)
      const status = (freshUser.status as UserAccountStatus) || 'active'
      setAccountStatus(status)

      // Se a conta for suspended ou disabled, invalidar sessão imediatamente
      if (status === 'suspended' || status === 'disabled') {
        pb.authStore.clear()
        setUser(null)
        setPerson(null)
        setRoles([])
        setAccountStatus(status)
        return
      }

      // 2. Buscar PERSON associada
      if (freshUser.person_id) {
        try {
          const personRec = await pb.collection('persons').getOne<PersonRecord>(freshUser.person_id)
          setPerson(personRec)
        } catch {
          setPerson(null)
        }
      } else {
        try {
          const personRec = await pb
            .collection('persons')
            .getFirstListItem<PersonRecord>(`email = "${freshUser.email}"`)
          setPerson(personRec)
        } catch {
          setPerson(null)
        }
      }

      // 3. Buscar USER_ROLES associados
      const roleRecords = await pb.collection('user_roles').getFullList<UserRoleRecord>({
        filter: `user_id = "${userId}" && is_active = true`,
      })

      const extractedRoles = roleRecords.map((r) => r.role)
      setRoles(extractedRoles)
    } catch {
      setPerson(null)
      setRoles([])
      setAccountStatus(null)
    }
  }

  useEffect(() => {
    // Inscrever para atualizações do demoAdapter (troca de persona, enable/disable)
    const unsubscribeDemo = demoAdapter.subscribe(() => {
      if (demoAdapter.isEnabled()) {
        syncDemoState()
      } else {
        setIsDemoActive(false)
        const currentUser = pb.authStore.record
        setUser(currentUser)
        if (currentUser?.id) {
          fetchUserData(currentUser.id).finally(() => setIsLoading(false))
        } else {
          setPerson(null)
          setRoles([])
          setAccountStatus(null)
          setIsLoading(false)
        }
      }
    })

    if (demoAdapter.isEnabled()) {
      syncDemoState()
    } else {
      const currentUser = pb.authStore.record
      setUser(currentUser)

      if (currentUser?.id) {
        fetchUserData(currentUser.id).finally(() => {
          setIsLoading(false)
        })
      } else {
        setIsLoading(false)
      }
    }

    const unsubscribePb = pb.authStore.onChange((_token, model) => {
      if (demoAdapter.isEnabled()) {
        return
      }
      setUser(model)
      if (model?.id) {
        fetchUserData(model.id)
      } else {
        setPerson(null)
        setRoles([])
        setAccountStatus(null)
      }
    })

    return () => {
      unsubscribeDemo()
      unsubscribePb()
    }
  }, [syncDemoState])

  const login = async (email: string, pass: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, pass)
      const userStatus = (authData.record.status as UserAccountStatus) || 'active'
      if (userStatus === 'suspended' || userStatus === 'disabled') {
        pb.authStore.clear()
        await auditService.log({
          actor_user_id: authData.record.id,
          action: 'LOGIN_FAILED',
          resource_type: 'user_account',
          resource_id: authData.record.id,
          result: 'denied',
          metadata: { reason: `Account status is ${userStatus}` },
        })
        throw new Error('Sua conta está suspensa ou desativada. Contate a administração.')
      }

      setUser(authData.record)
      setAccountStatus(userStatus)
      if (authData.record?.id) {
        // Se status for 'invited', ainda não busca papéis nem força 'active' no contexto
        await fetchUserData(authData.record.id)
      }
      return authData
    } catch (err) {
      await auditService.log({
        action: 'LOGIN_FAILED',
        resource_type: 'user_account',
        result: 'failure',
        metadata: { email },
      })
      throw err
    }
  }

  const logout = () => {
    if (demoAdapter.isEnabled()) {
      demoAdapter.disableDemo()
      setIsDemoActive(false)
      setUser(null)
      setPerson(null)
      setRoles([])
      setAccountStatus(null)
      return
    }

    if (user?.id) {
      auditService.log({
        actor_user_id: user.id,
        action: 'LOGOUT',
        resource_type: 'user_account',
        resource_id: user.id,
        result: 'success',
      })
    }
    pb.authStore.clear()
    setUser(null)
    setPerson(null)
    setRoles([])
    setAccountStatus(null)
  }

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      await auditService.log({
        action: 'PASSWORD_RESET_REQUESTED',
        resource_type: 'user_account',
        result: 'success',
        metadata: { email },
      })
      return true
    } catch {
      // Por segurança contra enumeração, não revelar erro
      return false
    }
  }

  const refreshAuthData = async () => {
    if (user?.id) {
      await fetchUserData(user.id)
    }
  }

  const isProf = roles.includes('profissional')
  const isAdm = roles.includes('admin')

  const value = useMemo(
    () => ({
      user,
      person,
      roles,
      accountStatus,
      isLoading,
      // Se status for 'invited', o usuário está autenticado para o fluxo FirstLoginPasswordChange
      isAuthenticated:
        isDemoActive ||
        (Boolean(user) && (accountStatus === 'active' || accountStatus === 'invited')),
      isInteragente: roles.includes('interagente'),
      isProfissional: isProf,
      isAdmin: isAdm,
      isDemo: isDemoActive,
      mfaStatus: 'NOT_IMPLEMENTED' as const,
      login,
      logout,
      refreshAuthData,
      requestPasswordReset,
    }),
    [user, person, roles, accountStatus, isLoading, isProf, isAdm, isDemoActive],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
