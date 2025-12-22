'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else {
        // Vérifier si l'utilisateur est plateforme ou client
        fetch('/api/auth/check-user-type')
          .then((res) => res.json())
          .then((data) => {
            if (data.isPlatform) {
              router.push('/platform/dashboard')
            } else {
              router.push('/dashboard')
            }
          })
          .catch(() => {
            // En cas d'erreur, rediriger par défaut vers le dashboard client
            router.push('/dashboard')
          })
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground">Chargement...</div>
    </div>
  )
}
