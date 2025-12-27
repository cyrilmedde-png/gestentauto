'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export function ProtectedPlatformRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isPlatform, setIsPlatform] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Vérifier si l'utilisateur est de la plateforme
    // Envoyer l'ID utilisateur dans le header
    fetch('/api/auth/check-user-type', {
      method: 'GET',
      headers: {
        'X-User-Id': user.id,
      },
      credentials: 'include', // Important : envoyer les cookies de session
    })
      .then((res) => {
        if (!res.ok) {
          // Si erreur, essayer la route de debug
          console.error('Failed to check user type, trying debug route...')
          return fetch('/api/auth/debug-user-type', {
            headers: {
              'X-User-Id': user.id,
            },
            credentials: 'include', // Important : envoyer les cookies de session
          }).then(res => res.json())
        }
        return res.json()
      })
      .then((data) => {
        // Logs détaillés pour debug
        console.log('User type check result:', data)
        
        // Vérifier si isPlatform existe (route normale) ou result.isPlatform (route debug)
        const isPlatformUser = data.isPlatform !== undefined 
          ? data.isPlatform 
          : (data.result?.isPlatform || false)
        
        if (!isPlatformUser) {
          console.warn('User is not platform, redirecting to client dashboard', {
            userCompanyId: data.companyId || data.user?.company_id,
            platformId: data.platformId || data.platform?.extracted_platform_id,
            comparison: data.comparison,
          })
          // Si ce n'est pas un utilisateur plateforme, rediriger vers le dashboard client
          router.push('/dashboard')
          return
        }
        setIsPlatform(true)
        setLoading(false)
        setError(null)
      })
      .catch((error) => {
        console.error('Error checking user type:', error)
        setError(error instanceof Error ? error.message : 'Erreur inconnue')
        setLoading(false)
        // Ne pas rediriger immédiatement, afficher l'erreur
      })
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Vérification de l'authentification...</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Vérification des permissions...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-destructive mb-4">Erreur: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!user || !isPlatform) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-muted-foreground">Redirection...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
