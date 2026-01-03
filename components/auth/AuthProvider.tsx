'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser, type AuthUser } from '@/lib/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  user: AuthUser | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const isLoadingUserRef = useRef(false)
  const userIdRef = useRef<string | null>(null)

  const loadUser = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (isLoadingUserRef.current) {
      return
    }
    
    isLoadingUserRef.current = true
    try {
      // Ne pas mettre loading à true si on est déjà en train de charger
      // pour éviter les re-renders inutiles
      if (!loading) {
        setLoading(true)
      }
      
      // Vérifier si Supabase est configuré
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        console.warn('Supabase not configured, skipping user load')
        setUser(null)
        setSupabaseUser(null)
        setLoading(false)
        return
      }

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        // AuthSessionMissingError est normal quand l'utilisateur n'est pas connecté
        // Ne pas logger cette erreur pour éviter de polluer la console
        if (authError.name !== 'AuthSessionMissingError' && authError.message !== 'Auth session missing!') {
          console.error('Error getting user from Supabase:', authError)
        }
        setUser(null)
        setSupabaseUser(null)
        setLoading(false)
        return
      }

      setSupabaseUser(authUser)

      if (authUser) {
        // Ne recharger que si l'ID utilisateur change vraiment
        if (authUser.id !== userIdRef.current) {
          userIdRef.current = authUser.id
          try {
            const fullUser = await getCurrentUser()
            setUser(fullUser)
          } catch (userError) {
            console.error('Error loading full user data:', userError)
            setUser(null)
          }
        }
      } else {
        userIdRef.current = null
        setUser(null)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
      setSupabaseUser(null)
    } finally {
      setLoading(false)
      isLoadingUserRef.current = false
    }
  }, [])

  useEffect(() => {
    // Vérifier si Supabase est configuré avant de faire quoi que ce soit
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('Supabase not configured, AuthProvider will not work')
      setLoading(false)
      return
    }

    // Récupérer l'utilisateur initial
    loadUser()

    // Écouter les changements d'authentification
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Ignorer TOKEN_REFRESHED pour éviter les boucles, on ne recharge que sur SIGNED_IN
          if (event === 'SIGNED_IN') {
            await loadUser()
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setSupabaseUser(null)
          }
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up auth state change listener:', error)
      setLoading(false)
    }
  }, [loadUser])

  // Mémoriser handleSignOut pour éviter les changements de référence
  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }, [])

  // Mémoriser la valeur du contexte pour éviter les re-renders inutiles
  // Utiliser les IDs au lieu des objets complets pour la comparaison
  const contextValue = useMemo(() => ({
    user,
    supabaseUser,
    loading,
    signOut: handleSignOut,
  }), [user?.id, supabaseUser?.id, loading, handleSignOut])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
