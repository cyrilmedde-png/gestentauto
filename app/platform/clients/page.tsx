'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { Users, Search, Filter, Plus, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  created_at: string
  subscription_status?: string
}

export default function PlatformClientsPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Gestion des Clients
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Liste et gestion de tous les clients de la plateforme
            </p>
          </div>

          <ClientsList />
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

function ClientsList() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/settings/clients', {
        method: 'GET',
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des clients')
      }

      const data = await response.json()
      setClients(data.clients || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && client.subscription_status === 'active') ||
      (filterStatus === 'inactive' && client.subscription_status !== 'active')

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement des clients...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Barre de recherche et filtres */}
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>

        <button
          onClick={() => {/* TODO: Ouvrir modal création client */}}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau client</span>
        </button>
      </div>

      {/* Liste des clients */}
      {filteredClients.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 sm:p-12 text-center">
          <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">
            {searchTerm || filterStatus !== 'all' 
              ? 'Aucun client ne correspond à votre recherche'
              : 'Aucun client pour le moment'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => {/* TODO: Ouvrir modal création client */}}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Créer le premier client
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Version Desktop (tableau) */}
          <div className="hidden md:block bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-background/30">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Nom
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Téléphone
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Date d'inscription
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="border-b border-border/30 hover:bg-background/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-foreground font-medium">
                      {client.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {client.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {client.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        client.subscription_status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {client.subscription_status === 'active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {client.subscription_status || 'Non défini'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(client.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <button
                        onClick={() => {/* TODO: Voir détails client */}}
                        className="px-3 py-1 text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version Mobile (cartes) */}
          <div className="md:hidden space-y-3">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-base mb-1 truncate">
                      {client.name}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ml-2 ${
                    client.subscription_status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {client.subscription_status === 'active' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(client.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <button
                    onClick={() => {/* TODO: Voir détails client */}}
                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Statistiques */}
          <div className="mt-6 p-4 bg-background/30 border border-border/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} 
              {searchTerm || filterStatus !== 'all' ? ' trouvé(s)' : ' au total'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

