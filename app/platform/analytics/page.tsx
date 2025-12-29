'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useAuth } from '@/components/auth/AuthProvider'
import { BarChart, Users, TrendingUp, DollarSign, Package, RefreshCw } from 'lucide-react'

interface AnalyticsData {
  totalClients: number
  activeClients: number
  totalUsers: number
  totalLeads: number
  totalRevenue: number
  activeModules: number
}

export default function PlatformAnalyticsPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Analytics Plateforme
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Statistiques et métriques de la plateforme
            </p>
          </div>

          <AnalyticsDashboard />
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

function AnalyticsDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalClients: 0,
    activeClients: 0,
    totalUsers: 0,
    totalLeads: 0,
    totalRevenue: 0,
    activeModules: 0,
  })

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      // Charger les données depuis différentes sources
      const [clientsRes, usersRes, leadsRes, modulesRes] = await Promise.all([
        fetch('/api/settings/clients', { credentials: 'include', headers }),
        fetch('/api/platform/users', { credentials: 'include', headers }),
        fetch('/api/platform/leads', { credentials: 'include', headers }),
        fetch('/api/platform/modules', { credentials: 'include', headers }),
      ])

      const clientsData = await clientsRes.json()
      const usersData = await usersRes.json()
      const leadsData = await leadsRes.json()
      const modulesData = await modulesRes.json()

      const activeClients = (clientsData.clients || []).filter(
        (c: any) => c.subscription_status === 'active'
      ).length

      const activeModules = (modulesData.modules || []).filter(
        (m: any) => m.is_active
      ).length

      setAnalytics({
        totalClients: (clientsData.clients || []).length,
        activeClients,
        totalUsers: (usersData.users || []).length,
        totalLeads: (leadsData.leads || []).length,
        totalRevenue: 0, // TODO: Calculer depuis Stripe
        activeModules,
      })
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement des statistiques...
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
    <div className="space-y-6">
      {/* Bouton actualiser */}
      <div className="flex justify-end">
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground hover:bg-background/70 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <StatCard
          icon={Users}
          label="Clients totaux"
          value={analytics.totalClients}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Clients actifs"
          value={analytics.activeClients}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={analytics.totalUsers}
          color="purple"
        />
        <StatCard
          icon={BarChart}
          label="Leads"
          value={analytics.totalLeads}
          color="orange"
        />
        <StatCard
          icon={DollarSign}
          label="Revenus"
          value={`${analytics.totalRevenue.toLocaleString('fr-FR')} €`}
          color="green"
        />
        <StatCard
          icon={Package}
          label="Modules actifs"
          value={analytics.activeModules}
          color="indigo"
        />
      </div>

      {/* Graphiques (placeholder pour l'instant) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Évolution des clients
          </h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Graphique à venir</p>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Répartition des modules
          </h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Graphique à venir</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any
  label: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    green: 'bg-green-500/20 text-green-400 border-green-500/50',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
  }

  return (
    <div className={`border rounded-lg p-4 sm:p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
        {value}
      </div>
      <div className="text-xs sm:text-sm opacity-80">
        {label}
      </div>
    </div>
  )
}







