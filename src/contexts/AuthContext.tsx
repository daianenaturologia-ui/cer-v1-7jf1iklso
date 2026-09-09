import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordAuthResponse, RecordModel } from 'pocketbase'
import type { UserAccountRecord, PersonRecord, UserRoleRecord, UserRoleType } from '@/types/cer'

interface AuthContextType {
  user: UserAccountRecord | RecordModel | null
  person: PersonRecord | null
  roles: UserRoleType[]
  isLoading: boolean
  isAuthenticated: boolean
  isInteragente: boolean
  isProfissional: boolean
  isAdmin: boolean
  login: (email: string, pass: string) => Promise<RecordAuthResponse<RecordModel>>
  logout: () => void
  refreshAuthData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [person, setPerson] = useState<PersonRecord | null>(null)
  const [roles, setRoles] = useState<UserRoleType[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchUserData = async (userId: string) => {
    try {
      // 1. Obter usuário com expand ou dados atualizados
      const freshUser = await pb.collection('users').getOne(userId)
      setUser(freshUser)

      // 2. Buscar PERSON associada
      if (freshUser.person_id) {
        try {
          const personRec = await pb.collection('persons').getOne<PersonRecord>(freshUser.person_id)
          setPerson(personRec)
        } catch {
          setPerson(null)
        }
      } else {
        // Tentar buscar por e-mail se person_id não estiver setado
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
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword(email, pass)
    setUser(authData.record)
    if (authData.record?.id) {
      await fetchUserData(authData.record.id)
    }
    return authData
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setPerson(null)
    setRoles([])
  }

  const refreshAuthData = async () => {
    if (user?.id) {
      await fetchUserData(user.id)
    }
  }

  const value = useMemo(
    () => ({
      user,
      person,
      roles,
      isLoading,
      isAuthenticated: Boolean(user),
      isInteragente: roles.includes('interagente'),
      isProfissional: roles.includes('profissional'),
      isAdmin: roles.includes('admin'),
      login,
      logout,
      refreshAuthData,
    }),
    [user, person, roles, isLoading],
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
