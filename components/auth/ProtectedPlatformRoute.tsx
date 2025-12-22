'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export function ProtectedPlatformRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isPlatform, setIsPlatform] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Vérifier si l'utilisateur est de la plateforme
    fetch('/api/auth/check-user-type')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to check user type')
        }
        return res.json()
      })
      .then((data) => {
        if (!data.isPlatform) {
          // Si ce n'est pas un utilisateur plateforme, rediriger vers le dashboard client
          router.push('/dashboard')
          return
        }
        setIsPlatform(true)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error checking user type:', error)
        // En cas d'erreur, rediriger vers le dashboard client par sécurité
        router.push('/dashboard')
      })
  }, [user, authLoading, router])

  if (authLoading || loading || !user || !isPlatform) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  return <>{children}</>
}

