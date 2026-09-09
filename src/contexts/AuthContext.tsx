import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordAuthResponse, RecordModel } from 'pocketbase'
import type { ProfileRecord } from '@/types/cer'

interface AuthContextType {
  user: RecordModel | null
  profile: ProfileRecord | null
  isLoading: boolean
  isAuthenticated: boolean
  isInteragente: boolean
  isProfissional: boolean
  login: (email: string, pass: string) => Promise<RecordAuthResponse<RecordModel>>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchProfile = async (userId: string) => {
    try {
      const records = await pb.collection('profiles').getList<ProfileRecord>(1, 1, {
        filter: `user = "${userId}"`,
      })
      if (records.items.length > 0) {
        setProfile(records.items[0])
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    // Initial check
    const currentUser = pb.authStore.record
    setUser(currentUser)

    if (currentUser?.id) {
      fetchProfile(currentUser.id).finally(() => {
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }

    // Subscribe to auth state changes
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(model)
      if (model?.id) {
        fetchProfile(model.id)
      } else {
        setProfile(null)
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
      await fetchProfile(authData.record.id)
    }
    return authData
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: Boolean(user),
      isInteragente: profile?.profile_type === 'interagente',
      isProfissional: profile?.profile_type === 'profissional',
      login,
      logout,
      refreshProfile,
    }),
    [user, profile, isLoading],
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
