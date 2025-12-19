'use client'

/**
 * Composant de protection de route
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Attendre que le chargement soit terminé avant de vérifier
    if (loading) return

    // Ne rediriger que si vraiment pas de session et pas de user, et qu'on n'est pas déjà en train de rediriger
    if (!session && !user && !isRedirecting) {
      setIsRedirecting(true)
      router.push('/auth/login')
    }
  }, [user, session, loading, router, isRedirecting])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808] relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si on a une session Supabase mais pas encore de user dans notre table,
  // on permet quand même l'accès (l'utilisateur sera créé si nécessaire)
  if (!session && !user) {
    return null
  }

  return <>{children}</>
}

