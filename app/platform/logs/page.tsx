'use client'

import { useEffect, useState } from 'react'
import { FileText, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'

interface Log {
  id: string
  created_at: string
  event_type: string
  subscription_id: string | null
  company_id: string | null
  user_id: string | null
  status: 'success' | 'error' | 'warning' | 'info'
  details: Record<string, any>
  error_message: string | null
  source: string
  ip_address: string | null
  user_agent: string | null
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [statsByStatus, setStatsByStatus] = useState<{
    success: number
    error: number
    warning: number
    info: number
  }>({
    success: 0,
    error: 0,
    warning: 0,
    info: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const limit = 50

  // Définir les catégories et event_types
  const categories = [
    { value: 'all', label: 'Tous', icon: '📊' },
    { value: 'abonnements', label: 'Abonnements', icon: '💳' },
    { value: 'facturation', label: 'Facturation', icon: '📄' },
    { value: 'leads', label: 'Leads', icon: '🎯' }
  ]

  const eventTypes = [
    { value: 'all', label: 'Tous les événements', icon: '📊', category: 'all' },
    // Abonnements
    { value: 'subscription_created', label: 'Créations', icon: '✨', category: 'abonnements' },
    { value: 'payment_succeeded', label: 'Paiements réussis', icon: '💳', category: 'abonnements' },
    { value: 'payment_failed', label: 'Échecs paiement', icon: '❌', category: 'abonnements' },
    { value: 'plan_upgraded', label: 'Upgrades', icon: '⬆️', category: 'abonnements' },
    { value: 'plan_downgraded', label: 'Downgrades', icon: '⬇️', category: 'abonnements' },
    { value: 'subscription_canceled', label: 'Annulations', icon: '🚫', category: 'abonnements' },
    { value: 'reminder_sent', label: 'Rappels', icon: '⏰', category: 'abonnements' },
    { value: 'account_suspended', label: 'Suspensions', icon: '🔒', category: 'abonnements' },
    // Facturation
    { value: 'document_cree', label: 'Documents créés', icon: '📄', category: 'facturation' },
    { value: 'facture_envoyee', label: 'Factures envoyées', icon: '📧', category: 'facturation' },
    { value: 'devis_envoye', label: 'Devis envoyés', icon: '📋', category: 'facturation' },
    { value: 'facture_erreur', label: 'Erreurs facturation', icon: '⚠️', category: 'facturation' },
    { value: 'paiement_recu', label: 'Paiements reçus', icon: '💰', category: 'facturation' },
    { value: 'relance_facture', label: 'Relances factures', icon: '🔔', category: 'facturation' },
    // Leads
    { value: 'lead_cree', label: 'Leads créés', icon: '🎯', category: 'leads' },
    { value: 'lead_qualifie', label: 'Leads qualifiés', icon: '✅', category: 'leads' },
    { value: 'lead_erreur', label: 'Erreurs leads', icon: '❌', category: 'leads' }
  ]

  // Filtrer les event_types selon la catégorie sélectionnée
  const filteredEventTypes = selectedCategory === 'all' 
    ? eventTypes.filter(e => e.value !== 'all')
    : eventTypes.filter(e => e.category === selectedCategory || e.value === 'all')

  // Charger les stats
  useEffect(() => {
    fetchStats()
  }, [])

  // Charger les logs
  useEffect(() => {
    fetchLogs()
  }, [selectedCategory, selectedEventType, page])

  const fetchStats = async () => {
    try {
      // Récupérer les stats pour la semaine (pour afficher les 4 cards par statut)
      const res = await fetch('/api/admin/logs/stats?days=7')
      const data = await res.json()

      if (data.success && data.byStatus) {
        setStatsByStatus({
          success: data.byStatus.success || 0,
          error: data.byStatus.error || 0,
          warning: data.byStatus.warning || 0,
          info: data.byStatus.info || 0
        })
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
        // Par défaut, filtrer uniquement error + warning
        status: 'error,warning'
      })

      // Filtrer par event_type si sélectionné
      if (selectedEventType !== 'all') {
        params.append('event_type', selectedEventType)
      }

      const res = await fetch(`/api/admin/logs?${params}`)
      const data = await res.json()

      if (data.success) {
        setLogs(data.logs)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-500/20 text-green-300 border border-green-500/30',
      error: 'bg-red-500/20 text-red-300 border border-red-500/30',
      warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }
    return icons[status as keyof typeof icons] || '•'
  }

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        log.event_type.toLowerCase().includes(search) ||
        log.subscription_id?.toLowerCase().includes(search) ||
        log.error_message?.toLowerCase().includes(search) ||
        JSON.stringify(log.details).toLowerCase().includes(search)
      )
    }
    return true
  })

  // Réinitialiser selectedEventType quand on change de catégorie
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedEventType('all')
    setPage(0)
  }

  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Logs Système</h1>
                <p className="text-gray-400 text-sm">Traçabilité complète de tous les événements de l'application</p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchLogs()
                fetchStats()
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {/* Stats Cards - 4 cards par statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-xl p-4">
              <div className="text-green-400 text-sm font-medium flex items-center gap-2">
                ✅ Success
              </div>
              <div className="text-3xl font-bold text-green-300 mt-2">{statsByStatus.success.toLocaleString('fr-FR')}</div>
            </div>

            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-xl p-4">
              <div className="text-red-400 text-sm font-medium flex items-center gap-2">
                ❌ Error
              </div>
              <div className="text-3xl font-bold text-red-300 mt-2">{statsByStatus.error.toLocaleString('fr-FR')}</div>
            </div>

            <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4">
              <div className="text-yellow-400 text-sm font-medium flex items-center gap-2">
                ⚠️ Warning
              </div>
              <div className="text-3xl font-bold text-yellow-300 mt-2">{statsByStatus.warning.toLocaleString('fr-FR')}</div>
            </div>

            <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-400 text-sm font-medium flex items-center gap-2">
                ℹ️ Info
              </div>
              <div className="text-3xl font-bold text-blue-300 mt-2">{statsByStatus.info.toLocaleString('fr-FR')}</div>
            </div>
          </div>

          {/* Onglets par catégorie */}
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category.value
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>

          {/* Sous-filtres event_types selon la catégorie */}
          {selectedCategory !== 'all' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedEventType('all')
                  setPage(0)
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedEventType === 'all'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                Tous les {categories.find(c => c.value === selectedCategory)?.label}
              </button>
              {filteredEventTypes.filter(e => e.value !== 'all').map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    setSelectedEventType(type.value)
                    setPage(0)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedEventType === type.value
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          )}

          {/* Filtre recherche */}
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Rechercher (event_type, subscription_id, message...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Tableau */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Chargement des logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-lg font-medium">Aucun log trouvé</p>
                <p className="text-gray-500 text-sm mt-1">
                  Aucune erreur ou warning pour cette période
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Date/Heure
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Événement
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Subscription ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <>
                        <tr 
                          key={log.id} 
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                            index % 2 === 0 ? 'bg-black/20' : 'bg-transparent'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadge(log.status)}`}>
                              {getStatusIcon(log.status)} {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <code className="px-2 py-1 bg-black/40 text-purple-300 rounded text-xs">
                              {log.event_type}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 font-mono whitespace-nowrap">
                            {log.subscription_id ? (
                              <span className="text-blue-400">{log.subscription_id}</span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300 max-w-md truncate">
                            {log.error_message || log.details?.message || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            <span className="px-2 py-1 bg-white/5 rounded text-xs">
                              {log.source}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
                            >
                              {expandedLog === log.id ? (
                                <>
                                  <ChevronDown className="w-4 h-4" /> Masquer
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-4 h-4" /> Détails
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedLog === log.id && (
                          <tr>
                            <td colSpan={7} className="px-6 py-6 bg-black/40">
                              <div className="space-y-4">
                                {/* Détails JSON */}
                                <div>
                                  <h4 className="text-sm font-semibold text-purple-400 mb-2">
                                    📋 Détails JSON
                                  </h4>
                                  <pre className="bg-black/60 border border-white/10 p-4 rounded-lg overflow-x-auto text-xs text-gray-300 font-mono">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>

                                {/* Message d'erreur */}
                                {log.error_message && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-red-400 mb-2">
                                      ❌ Message d'erreur
                                    </h4>
                                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                                      <p className="text-sm text-red-300">{log.error_message}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Métadonnées */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 uppercase">Company ID</span>
                                    <p className="text-sm text-gray-300 font-mono mt-1 break-all">
                                      {log.company_id || '-'}
                                    </p>
                                  </div>
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 uppercase">User ID</span>
                                    <p className="text-sm text-gray-300 font-mono mt-1 break-all">
                                      {log.user_id || '-'}
                                    </p>
                                  </div>
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 uppercase">IP Address</span>
                                    <p className="text-sm text-gray-300 font-mono mt-1">
                                      {log.ip_address || '-'}
                                    </p>
                                  </div>
                                </div>

                                {/* User Agent */}
                                {log.user_agent && (
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 uppercase">User Agent</span>
                                    <p className="text-xs text-gray-400 mt-1 break-all">
                                      {log.user_agent}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredLogs.length > 0 && (
              <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                >
                  ← Précédent
                </button>
                <span className="text-sm text-gray-400 font-medium">
                  Page {page + 1}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                >
                  Suivant →
                </button>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}
