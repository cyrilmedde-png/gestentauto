'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { Package, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import * as Icons from 'lucide-react'

interface Module {
  id: string
  name: string
  display_name: string
  description: string | null
  price_monthly: number
  price_yearly: number | null
  icon: string
  category: string
  features: any
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [availableModules, setAvailableModules] = useState<Module[]>([])
  const [activeModuleNames, setActiveModuleNames] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadModules()
  }, [user])

  const loadModules = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/platform/subscriptions/modules', {
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des modules')
      }

      const data = await response.json()
      setAvailableModules(data.available || [])
      setActiveModuleNames(new Set(data.activeModuleNames || []))
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent || Package
  }

  const isActive = (moduleName: string): boolean => {
    return activeModuleNames.has(moduleName)
  }

  const handleSubscribe = (module: Module) => {
    // TODO: Intégrer Stripe Checkout
    alert(`Souscription au module "${module.display_name}" pour ${module.price_monthly}€/mois\n\nL'intégration Stripe sera disponible prochainement.`)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des modules...</p>
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
              Abonnements et Modules
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gérez vos abonnements et activez de nouveaux modules
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Modules actifs */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Modules actifs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableModules
                .filter(m => isActive(m.name))
                .map((module) => {
                  const Icon = getIcon(module.icon)
                  return (
                    <div
                      key={module.id}
                      className="bg-green-500/10 border border-green-500/50 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6 text-green-400" />
                          <div>
                            <h3 className="font-semibold text-foreground">{module.display_name}</h3>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <span className="text-sm text-muted-foreground">
                          {module.price_monthly}€/mois
                        </span>
                        <span className="text-xs text-green-400 font-medium">Actif</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Modules disponibles */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Modules disponibles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableModules
                .filter(m => !isActive(m.name))
                .map((module) => {
                  const Icon = getIcon(module.icon)
                  const features = Array.isArray(module.features) ? module.features : []
                  
                  return (
                    <div
                      key={module.id}
                      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6 text-primary" />
                          <div>
                            <h3 className="font-semibold text-foreground">{module.display_name}</h3>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>

                      {features.length > 0 && (
                        <ul className="mb-4 space-y-2">
                          {features.slice(0, 3).map((feature: string, idx: number) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <div>
                          <span className="text-lg font-bold text-foreground">
                            {module.price_monthly}€
                          </span>
                          <span className="text-sm text-muted-foreground">/mois</span>
                        </div>
                        <button
                          onClick={() => handleSubscribe(module)}
                          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          <CreditCard className="w-4 h-4" />
                          Souscrire
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

