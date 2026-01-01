'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

interface Stats {
  totalLogs: number
  byStatus: {
    success: number
    error: number
    warning: number
    info: number
  }
  byEventType: Record<string, number>
  successRate: number
  errorRate: number
}

export default function LogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const limit = 50

  // Charger les stats
  useEffect(() => {
    fetchStats()
  }, [])

  // Charger les logs
  useEffect(() => {
    fetchLogs()
  }, [selectedTab, selectedStatus, page])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/logs/stats?days=7')
      const data = await res.json()
      if (data.success) {
        setStats(data)
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
        offset: (page * limit).toString()
      })

      if (selectedTab !== 'all') {
        params.append('event_type', selectedTab)
      }

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
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
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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

  const eventTypes = [
    { value: 'all', label: 'Tous les événements', icon: '📊' },
    { value: 'subscription_created', label: 'Créations', icon: '✨' },
    { value: 'payment_succeeded', label: 'Paiements réussis', icon: '💳' },
    { value: 'payment_failed', label: 'Échecs paiement', icon: '❌' },
    { value: 'plan_upgraded', label: 'Upgrades', icon: '⬆️' },
    { value: 'plan_downgraded', label: 'Downgrades', icon: '⬇️' },
    { value: 'subscription_canceled', label: 'Annulations', icon: '🚫' },
    { value: 'reminder_sent', label: 'Rappels', icon: '⏰' },
    { value: 'account_suspended', label: 'Suspensions', icon: '🔒' }
  ]

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📊 Logs Système
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Traçabilité complète des événements d'abonnements
              </p>
            </div>
            <button
              onClick={() => fetchLogs()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🔄 Actualiser
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
                <div className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                  Total Logs (7j)
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                  {stats.totalLogs}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                <div className="text-green-600 dark:text-green-300 text-sm font-medium">
                  Succès
                </div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                  {stats.byStatus.success}
                  <span className="text-sm ml-2">({stats.successRate}%)</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 p-4 rounded-lg">
                <div className="text-red-600 dark:text-red-300 text-sm font-medium">
                  Erreurs
                </div>
                <div className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">
                  {stats.byStatus.error}
                  <span className="text-sm ml-2">({stats.errorRate}%)</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 p-4 rounded-lg">
                <div className="text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                  Warnings
                </div>
                <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">
                  {stats.byStatus.warning}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Onglets Type d'événement */}
        <div className="flex flex-wrap gap-2 mb-4">
          {eventTypes.map(type => (
            <button
              key={type.value}
              onClick={() => {
                setSelectedTab(type.value)
                setPage(0)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTab === type.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>

        {/* Filtres Statut + Recherche */}
        <div className="flex gap-4 mb-6">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(0)
            }}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="success">✅ Succès</option>
            <option value="error">❌ Erreur</option>
            <option value="warning">⚠️ Warning</option>
            <option value="info">ℹ️ Info</option>
          </select>

          <input
            type="text"
            placeholder="Rechercher (subscription_id, type, message...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>

        {/* Tableau Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Chargement...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Aucun log trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Événement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subscription ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLogs.map((log) => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                            {getStatusIcon(log.status)} {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                            {log.event_type}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {log.subscription_id || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {log.error_message || log.details?.message || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            {expandedLog === log.id ? '▼ Masquer' : '▶ Détails'}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  Détails JSON
                                </h4>
                                <pre className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto text-xs">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                              {log.error_message && (
                                <div>
                                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                                    Message d'erreur
                                  </h4>
                                  <p className="text-sm text-red-900 dark:text-red-200 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                                    {log.error_message}
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Company ID:</span>
                                  <br />
                                  <code className="text-gray-900 dark:text-gray-100">{log.company_id || '-'}</code>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">User ID:</span>
                                  <br />
                                  <code className="text-gray-900 dark:text-gray-100">{log.user_id || '-'}</code>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">IP Address:</span>
                                  <br />
                                  <code className="text-gray-900 dark:text-gray-100">{log.ip_address || '-'}</code>
                                </div>
                              </div>
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
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                ← Précédent
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page + 1}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Suivant →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

