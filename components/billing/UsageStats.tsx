'use client'

import { BarChart3, Users, Database, Zap } from 'lucide-react'

interface UsageStatsProps {
  subscription: any
}

export default function UsageStats({ subscription }: UsageStatsProps) {
  if (!subscription || !subscription.plan) {
    return null
  }

  const { plan } = subscription
  const quotas = plan.quotas || {}

  const stats = [
    {
      icon: Users,
      label: 'Utilisateurs',
      current: 1, // TODO: Récupérer depuis la BDD
      max: quotas.maxUsers,
      color: 'blue',
    },
    {
      icon: Database,
      label: 'Stockage',
      current: 0.5, // TODO: Récupérer depuis la BDD
      max: quotas.maxStorageGb,
      unit: 'GB',
      color: 'green',
    },
    {
      icon: Zap,
      label: 'Workflows N8N',
      current: 0, // TODO: Récupérer depuis la BDD
      max: quotas.maxWorkflows,
      color: 'purple',
    },
  ]

  const getPercentage = (current: number, max: number | null) => {
    if (!max) return 0 // Illimité
    return Math.min((current / max) * 100, 100)
  }

  const getColorClasses = (color: string, percentage: number) => {
    const intensity = percentage > 80 ? 'high' : percentage > 50 ? 'medium' : 'low'
    
    const colors = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        bar: percentage > 80 ? 'bg-orange-500' : 'bg-blue-600',
        text: 'text-blue-600 dark:text-blue-400',
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        bar: percentage > 80 ? 'bg-orange-500' : 'bg-green-600',
        text: 'text-green-600 dark:text-green-400',
      },
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        bar: percentage > 80 ? 'bg-orange-500' : 'bg-purple-600',
        text: 'text-purple-600 dark:text-purple-400',
      },
    }

    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2" />
        Utilisation de vos Quotas
      </h3>

      <div className="space-y-4">
        {stats.map((stat, index) => {
          const percentage = getPercentage(stat.current, stat.max)
          const colors = getColorClasses(stat.color, percentage)
          const Icon = stat.icon
          const isUnlimited = !stat.max

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stat.label}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isUnlimited ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      ✨ Illimité
                    </span>
                  ) : (
                    <>
                      {stat.current} / {stat.max} {stat.unit || ''}
                    </>
                  )}
                </span>
              </div>
              {!isUnlimited && (
                <div className={`w-full h-2 rounded-full overflow-hidden ${colors.bg}`}>
                  <div
                    className={`h-full ${colors.bar} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 Passez à une formule supérieure pour augmenter vos quotas
        </p>
      </div>
    </div>
  )
}

