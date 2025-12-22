'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'

export default function PlatformDashboardPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Tableau de bord Plateforme
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Administration de la plateforme TalosPrime
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Statistiques plateforme */}
            <div className="border border-border/50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Clients actifs
                </h3>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-2">Total</p>
            </div>

            <div className="border border-border/50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Leads
                </h3>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-2">En attente</p>
            </div>

            <div className="border border-border/50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Essais actifs
                </h3>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-2">En cours</p>
            </div>

            <div className="border border-border/50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Chiffre d'affaires
                </h3>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">0 €</div>
              <p className="text-xs text-muted-foreground mt-2">Ce mois</p>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="border border-border/50 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
                Actions rapides
              </h2>
              <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
                <p>• Gérer les leads</p>
                <p>• Voir les clients</p>
                <p>• Paramètres plateforme</p>
              </div>
            </div>
            <div className="border border-border/50 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
                Activité récente
              </h2>
              <div className="text-sm sm:text-base text-muted-foreground text-center py-8 sm:py-12">
                Aucune activité récente
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

