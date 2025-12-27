import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

export interface Module {
  id: string
  name: string
  display_name: string
  description: string | null
  price_monthly: number
  icon: string
  route_slug: string | null
}

export function useModules() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
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
      
      // Convertir les modules disponibles en format simplifié
      const availableModules: Module[] = (data.available || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        display_name: m.display_name,
        description: m.description,
        price_monthly: m.price_monthly,
        icon: m.icon,
        route_slug: m.route_slug,
      }))

      setModules(availableModules)
      setActiveModuleNames(new Set(data.activeModuleNames || []))
    } catch (err) {
      console.error('Erreur lors du chargement des modules:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const hasModule = (moduleName: string): boolean => {
    return activeModuleNames.has(moduleName)
  }

  return {
    modules,
    activeModuleNames,
    hasModule,
    loading,
    error,
    refresh: loadModules,
  }
}


