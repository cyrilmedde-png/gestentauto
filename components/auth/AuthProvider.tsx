'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
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

  const loadUser = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (isLoadingUserRef.current) {
      return
    }
    
    isLoadingUserRef.current = true
    try {
      setLoading(true)
      
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
        try {
          // Timeout de 3 secondes pour getCurrentUser
          const fullUserPromise = getCurrentUser()
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 3000)
          })
          
          const fullUser = await Promise.race([fullUserPromise, timeoutPromise])
          setUser(fullUser)
        } catch (userError) {
          console.error('Error loading full user data:', userError)
          setUser(null)
        }
      } else {
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

    // Timeout de sécurité : si le chargement prend plus de 5 secondes, arrêter le loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('AuthProvider: Timeout - arrêt du loading après 5 secondes')
        setLoading(false)
      }
    }, 5000)

    // Récupérer l'utilisateur initial
    loadUser().finally(() => {
      clearTimeout(timeoutId)
    })

    // Écouter les changements d'authentification
    let subscription: { unsubscribe: () => void } | null = null
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
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
      subscription = authSubscription
    } catch (error) {
      console.error('Error setting up auth state change listener:', error)
      setLoading(false)
    }

    return () => {
      clearTimeout(timeoutId)
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [loadUser])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        signOut: handleSignOut,
      }}
    >
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


