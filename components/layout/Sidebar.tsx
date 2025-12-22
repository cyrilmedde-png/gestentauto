'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, FileText, Users, Settings, Menu, UserPlus, Package, UserCheck, BarChart, Workflow } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

export function Sidebar() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { setIsSidebarExpanded } = useSidebar()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setIsSidebarExpanded(isExpanded || isMobileOpen)
  }, [isExpanded, isMobileOpen, setIsSidebarExpanded])

  // Fermer le menu mobile au changement de route
  const handleLinkClick = () => {
    setIsMobileOpen(false)
  }

  // Navigation plateforme - tous les modules doivent suivre /platform/nom-du-module
  const navItems = [
    { icon: Home, label: 'Dashboard', href: '/platform/dashboard' },
    { icon: UserPlus, label: 'Leads', href: '/platform/leads' },
    { icon: UserCheck, label: 'Onboarding', href: '/platform/onboarding' },
    { icon: Users, label: 'Clients', href: '/platform/clients' },
    { icon: Users, label: 'Utilisateurs', href: '/platform/users' },
    { icon: Package, label: 'Modules', href: '/platform/modules' },
    { icon: Workflow, label: 'N8N', href: '/platform/n8n' },
    { icon: BarChart, label: 'Analytics', href: '/platform/analytics' },
    { icon: Settings, label: 'Paramètres', href: '/platform/settings' },
  ]

  return (
    <>
      {/* Mobile: Bouton hamburger (masqué sur desktop) */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 left-4 z-30 p-3 bg-background/50 backdrop-blur-sm rounded-lg text-foreground hover:bg-background/70 active:bg-background/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Mobile: Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full transition-all duration-300
          ${isMobile 
            ? (isMobileOpen ? 'w-64 translate-x-0 z-50' : '-translate-x-full z-20')
            : 'w-20 hover:w-64 translate-x-0 z-20'
          }
        `}
        onMouseEnter={() => {
          if (!isMobile) {
            setIsExpanded(true)
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsExpanded(false)
          }
        }}
      >
        <div className="h-full bg-background/50 backdrop-blur-sm border-r border-border/50">
          <div className="p-4">
            {/* Logo/Title avec déconnexion */}
            <div className="flex items-center justify-center mb-8">
              {(isExpanded || isMobileOpen) ? (
                <button 
                  onClick={async () => {
                    await signOut()
                    router.push('/auth/login')
                  }}
                  className="text-foreground font-semibold text-lg hover:opacity-80 transition-opacity text-center w-full"
                >
                  Gestion
                </button>
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center gap-4 px-4 rounded-lg text-foreground/70 
                      hover:bg-white/5 hover:text-foreground active:bg-white/10
                      transition-all group
                      ${isMobile ? 'py-4 min-h-[48px]' : 'py-2'}
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {(isExpanded || isMobileOpen) && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  )
}

