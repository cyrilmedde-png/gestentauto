'use client'

/**
 * Layout principal de l'application
 * Structure de base avec navigation et contenu
 */

import { useAuth } from '@/modules/core/components/AuthProvider'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AnimatedNetwork } from '@/components/background/AnimatedNetwork'
import { HeaderProvider, useHeader } from './HeaderContext'

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { isHeaderVisible } = useHeader()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-[#080808] text-white relative overflow-hidden">
      {/* Background animé */}
      <AnimatedNetwork />
      
      {/* Sidebar - invisible par défaut, apparaît au survol */}
      <Sidebar />
      
      {/* Header - rétractable vers le haut (fixed, ne prend pas de place dans le flux) */}
      <Header />
      
      {/* Main content - ajuste le padding top selon la visibilité du header */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 ml-20">
        {/* Page content */}
        <main 
          className="flex-1 overflow-y-auto px-6 pb-6 relative z-10 transition-all duration-300"
          style={{
            paddingTop: isHeaderVisible ? '6rem' : '1.5rem', // 96px (h-16 + padding) quand visible, 24px quand caché
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeaderProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </HeaderProvider>
  )
}

