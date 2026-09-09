import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
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

  const fetchUserData = async (userId: string) => {
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
    const currentUser = pb.authStore.record
    setUser(currentUser)

    if (currentUser?.id) {
      fetchUserData(currentUser.id).finally(() => {
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }

    const unsubscribe = pb.authStore.onChange((_token, model) => {
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
      unsubscribe()
    }
  }, [])

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
      isAuthenticated: Boolean(user) && accountStatus === 'active',
      isInteragente: roles.includes('interagente'),
      isProfissional: isProf,
      isAdmin: isAdm,
      mfaStatus: 'NOT_IMPLEMENTED' as const,
      login,
      logout,
      refreshAuthData,
      requestPasswordReset,
    }),
    [user, person, roles, accountStatus, isLoading, isProf, isAdm],
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
