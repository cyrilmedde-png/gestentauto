'use client'

/**
 * Provider d'authentification
 * Gère l'état d'authentification global de l'application
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthUser, getCurrentUser } from '../lib/auth'

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    
    // Vérifier si Supabase est configuré
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      // Si Supabase n'est pas configuré, arrêter le chargement sans erreur
      if (isMounted) {
        setLoading(false)
        setUser(null)
        setSession(null)
      }
      return
    }
    let subscription: { unsubscribe: () => void } | null = null

    // Vérifier immédiatement la session depuis localStorage
    const initializeAuth = async () => {
      try {
        // Vérifier d'abord si on est côté client
        if (typeof window === 'undefined') {
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        // Récupérer la session depuis le stockage de manière synchrone d'abord
        // Supabase stocke la session dans localStorage, on peut la récupérer directement
        let initialSession = null
        let sessionError = null
        try {
          const result = await supabase.auth.getSession()
          initialSession = result.data?.session || null
          sessionError = result.error || null
        } catch (error) {
          // Si Supabase n'est pas configuré, ignorer l'erreur
          sessionError = error as any
          if (process.env.NODE_ENV === 'development') {
            console.warn('Supabase not configured, skipping session check')
          }
        }
        
        if (sessionError) {
          console.error('Error getting initial session:', sessionError)
          // Si erreur, nettoyer et continuer
          if (isMounted) {
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (initialSession && initialSession.user) {
          // On a une session, la définir immédiatement pour débloquer l'UI
          if (isMounted) {
            setSession(initialSession)
            setUser({
              id: initialSession.user.id,
              email: initialSession.user.email || '',
            })
            setLoading(false)
            if (timeoutId) clearTimeout(timeoutId)
          }

          // Ensuite, vérifier et enrichir en arrière-plan (sans bloquer)
          try {
            const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
            
            if (!userError && authUser && isMounted) {
              // Essayer de récupérer les données complètes
              try {
                const userData = await getCurrentUser()
                if (isMounted && userData) {
                  setUser(userData)
                }
              } catch (error) {
                // Ignorer les erreurs, on garde les infos de base
                if (process.env.NODE_ENV === 'development') {
                  console.debug('Could not fetch full user data:', error)
                }
              }
            } else if (isMounted && userError) {
              // Token invalide, nettoyer
              console.warn('Invalid or expired token, clearing session')
              await supabase.auth.signOut()
              setSession(null)
              setUser(null)
            }
          } catch (error) {
            // Ignorer les erreurs de validation, on a déjà défini la session
            if (process.env.NODE_ENV === 'development') {
              console.debug('Error validating session:', error)
            }
          }
        } else if (isMounted) {
          // Pas de session
          setSession(null)
          setUser(null)
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
        }
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    // Timeout de sécurité pour éviter un chargement infini (réduit à 2 secondes)
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check timeout, setting loading to false')
        setLoading(false)
      }
    }, 2000) // 2 secondes max

    // Initialiser l'authentification
    initializeAuth()

    // Écouter les changements d'authentification
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return

        setSession(session)
        
        if (session?.user) {
          try {
            const userData = await getCurrentUser()
            if (isMounted) {
              setUser(userData)
            }
          } catch (error) {
            console.error('Error getting user data:', error)
            if (isMounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
              })
            }
          }
        } else {
          if (isMounted) {
            setUser(null)
          }
        }
        
        if (timeoutId && isMounted) {
          clearTimeout(timeoutId)
        }
        if (isMounted) {
          setLoading(false)
        }
      })
      
      subscription = authSubscription
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      if (isMounted) {
        setLoading(false)
      }
    }

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  async function checkSession() {
    try {
      // Vérifier qu'on est côté client
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      // Récupérer la session depuis localStorage
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      
      if (!session) {
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      
      // Vérifier que le token est toujours valide
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        // Token invalide, nettoyer la session
        console.warn('Invalid session token, clearing session')
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      
      setSession(session)
      
      if (session.user) {
        try {
          const userData = await getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Error getting user data:', error)
          // Si erreur, on utilise quand même les infos de base de Supabase
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          })
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setSession(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  async function refresh() {
    await checkSession()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        refresh,
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

