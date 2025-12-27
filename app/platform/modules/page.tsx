'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { Package, Search, ToggleLeft, ToggleRight, CheckCircle, XCircle, Building2, Filter } from 'lucide-react'

interface AvailableModule {
  id: string
  name: string
  description: string
  icon: string
  category: string
}

interface ClientModule {
  id: string
  company_id: string
  module_name: string
  is_active: boolean
  config: any
  created_at: string
  updated_at: string
  companies: {
    id: string
    name: string
  }
}

interface Client {
  id: string
  name: string
}

export default function PlatformModulesPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Gestion des Modules
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Activer et gérer les modules pour chaque client
            </p>
          </div>

          <ModulesManagement />
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

function ModulesManagement() {
  const { user } = useAuth()
  const [availableModules, setAvailableModules] = useState<AvailableModule[]>([])
  const [clientModules, setClientModules] = useState<ClientModule[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      // Charger les modules disponibles
      const modulesResponse = await fetch('/api/platform/modules/available', {
        credentials: 'include',
        headers,
      })
      const modulesData = await modulesResponse.json()
      setAvailableModules(modulesData.modules || [])

      // Charger les modules activés par client
      const url = selectedClient !== 'all' 
        ? `/api/platform/modules?company_id=${selectedClient}`
        : '/api/platform/modules'
      
      const response = await fetch(url, {
        credentials: 'include',
        headers,
      })
      const data = await response.json()
      setClientModules(data.modules || [])

      // Charger la liste des clients
      const clientsResponse = await fetch('/api/settings/clients', {
        credentials: 'include',
        headers,
      })
      const clientsData = await clientsResponse.json()
      setClients(clientsData.clients || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClient) {
      loadData()
    }
  }, [selectedClient])

  const handleToggleModule = async (clientId: string, moduleName: string, isActive: boolean) => {
    try {
      setError(null)
      setSuccess(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      if (isActive) {
        // Activer le module
        const response = await fetch('/api/platform/modules', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            company_id: clientId,
            module_name: moduleName,
            config: {},
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erreur lors de l\'activation')
        }

        setSuccess(`Module "${moduleName}" activé avec succès`)
      } else {
        // Désactiver le module
        const module = clientModules.find(
          m => m.company_id === clientId && m.module_name === moduleName
        )

        if (module) {
          const response = await fetch(`/api/platform/modules/${module.id}`, {
            method: 'PATCH',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              is_active: false,
            }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Erreur lors de la désactivation')
          }

          setSuccess(`Module "${moduleName}" désactivé avec succès`)
        }
      }

      setTimeout(() => setSuccess(null), 3000)
      loadData()
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification')
      setTimeout(() => setError(null), 5000)
    }
  }

  const isModuleActive = (clientId: string, moduleName: string): boolean => {
    return clientModules.some(
      m => m.company_id === clientId && m.module_name === moduleName && m.is_active
    )
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement des modules...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Tous les clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des clients avec leurs modules */}
      {filteredClients.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 sm:p-12 text-center">
          <Building2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchTerm ? 'Aucun client ne correspond à votre recherche' : 'Aucun client pour le moment'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {clientModules.filter(m => m.company_id === client.id && m.is_active).length} module(s) activé(s)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {availableModules.map((module) => {
                  const isActive = isModuleActive(client.id, module.id)
                  return (
                    <div
                      key={module.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isActive
                          ? 'border-green-500/50 bg-green-500/5'
                          : 'border-border/50 bg-background/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-primary" />
                            <h4 className="font-medium text-foreground text-sm">{module.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {module.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                        <span className={`text-xs ${
                          isActive ? 'text-green-400' : 'text-muted-foreground'
                        }`}>
                          {isActive ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Actif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Inactif
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => handleToggleModule(client.id, module.id, !isActive)}
                          className="text-primary hover:opacity-80 transition-opacity"
                          title={isActive ? 'Désactiver' : 'Activer'}
                        >
                          {isActive ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}





