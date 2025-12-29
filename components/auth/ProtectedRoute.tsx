'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user?.id) {
      router.push('/auth/login')
    }
  }, [user?.id, loading, router])

  // Toujours retourner quelque chose, jamais null
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    // Retourner un état de chargement pendant la redirection au lieu de null
    // Cela évite que Next.js considère la page comme inexistante
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Redirection vers la connexion...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}






