'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/components/auth/AuthProvider'

interface WorkflowData {
  id: string
  [key: string]: any
}

export default function WorkflowPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { user } = useAuth()
  const [module, setModule] = useState<any>(null)
  const [data, setData] = useState<WorkflowData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      loadModule()
      loadData()
    }
  }, [slug])

  const loadModule = async () => {
    try {
      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/platform/subscriptions/modules', {
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du module')
      }

      const result = await response.json()
      const foundModule = result.available.find((m: any) => m.route_slug === slug)

      if (!foundModule) {
        setError('Module non trouvé')
        return
      }

      // Vérifier si l'utilisateur a accès à ce module
      if (!result.activeModuleNames.includes(foundModule.name)) {
        setError('Vous n\'avez pas accès à ce module. Veuillez souscrire à un abonnement.')
        return
      }

      setModule(foundModule)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Si le module a une table_name, charger les données depuis cette table
      if (module?.table_name) {
        const headers: HeadersInit = {}
        if (user?.id) {
          headers['X-User-Id'] = user.id
        }

        // TODO: Créer une API pour charger les données depuis la table dynamique
        // Pour l'instant, on affiche juste un message
        setData([])
      } else {
        setData([])
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (module) {
      loadData()
    }
  }, [module])

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Erreur
              </h1>
            </div>
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-red-400">
              {error}
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  if (!module) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Module non trouvé
              </h1>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {module.display_name}
            </h1>
            {module.description && (
              <p className="text-sm sm:text-base text-muted-foreground">
                {module.description}
              </p>
            )}
          </div>

          {module.table_name ? (
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 sm:p-12">
              <div className="text-center">
                <p className="text-lg text-muted-foreground mb-4">
                  Module créé par N8N
                </p>
                <p className="text-sm text-muted-foreground">
                  Table: <code className="bg-background/50 px-2 py-1 rounded">{module.table_name}</code>
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  L'intégration complète des données sera disponible prochainement.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 sm:p-12">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">
                  Ce module n'a pas encore de données configurées.
                </p>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}


