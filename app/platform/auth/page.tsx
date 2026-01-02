'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { Shield, Users, Key } from 'lucide-react'

export default function PlatformAuthPage() {
  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Gestion de l'authentification
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Administration des utilisateurs et des accès plateforme
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Gestion des utilisateurs */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Utilisateurs
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Gérez les utilisateurs de la plateforme, leurs rôles et leurs permissions.
              </p>
              <a
                href="/platform/users"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
              >
                Voir les utilisateurs
              </a>
            </div>

            {/* Gestion des admins */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Administrateurs
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Gérez les administrateurs de la plateforme et leurs droits d'accès.
              </p>
              <a
                href="/platform/admins"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
              >
                Voir les administrateurs
              </a>
            </div>

            {/* Paramètres d'authentification */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <Key className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Paramètres
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configurez les paramètres d'authentification et de sécurité de la plateforme.
              </p>
              <a
                href="/platform/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm"
              >
                Ouvrir les paramètres
              </a>
            </div>

            {/* Statistiques */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-500/20 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Statistiques
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Consultez les statistiques d'authentification et d'accès à la plateforme.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>• Utilisateurs actifs : 0</p>
                <p>• Connexions aujourd'hui : 0</p>
                <p>• Administrateurs : 0</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

