import { MainLayout } from '@/components/layout/MainLayout'

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Tableau de bord
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Vue d'ensemble de votre entreprise
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Card 1 */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Chiffre d'affaires
              </h3>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">0 €</div>
            <p className="text-xs text-muted-foreground mt-2">Ce mois</p>
          </div>

          {/* Card 2 */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Clients
              </h3>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-2">Total</p>
          </div>

          {/* Card 3 */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Factures
              </h3>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-2">En attente</p>
          </div>

          {/* Card 4 */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Tâches
              </h3>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-2">À faire</p>
          </div>
        </div>

        {/* Graphiques et tableaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              Activité récente
            </h2>
            <div className="text-sm sm:text-base text-muted-foreground text-center py-8 sm:py-12">
              Aucune activité récente
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              Statistiques
            </h2>
            <div className="text-sm sm:text-base text-muted-foreground text-center py-8 sm:py-12">
              Aucune statistique disponible
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
