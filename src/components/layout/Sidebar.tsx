'use client'

/**
 * Sidebar - Navigation latérale
 * Design sobre et moderne, sans traits apparents
 * Cachée par défaut, apparaît au survol du bord gauche ou de la sidebar
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  DollarSign,
  Settings,
  Building2,
  Menu
} from 'lucide-react'
import { useAuth } from '@/modules/core/components/AuthProvider'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Facturation', href: '/billing', icon: DollarSign },
  { name: 'CRM', href: '/crm', icon: Users },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Entreprise', href: '/company', icon: Building2 },
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isHovered, setIsHovered] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <div 
      className="fixed left-0 top-0 h-full flex flex-col transition-all duration-300 ease-in-out relative z-20"
      style={{ 
        width: isHovered ? '256px' : '80px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sidebar avec icônes seulement quand minimisée - complètement fondue */}
      <div className="h-full bg-transparent flex flex-col overflow-hidden relative z-20">
        {/* Logo / Header - Bouton de déconnexion */}
        <div className="h-16 flex items-center justify-center px-4">
          <button
            onClick={handleLogout}
            className="hover:opacity-80 transition-opacity cursor-pointer"
            title="Déconnexion"
          >
            {isHovered ? (
              <h1 className="text-xl font-bold text-white">
                Gestion
              </h1>
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isHovered ? item.name : ''}
                className="flex items-center"
              >
                <div
                  className={`
                    flex items-center rounded-lg
                    transition-all duration-200
                    px-4 py-1 justify-center
                    ${
                      isActive
                        ? 'bg-white/5 text-white border border-white/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                </div>
                {isHovered && (
                  <span className="ml-3 text-sm font-medium text-white">
                    {item.name}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

      </div>
    </div>
  )
}

