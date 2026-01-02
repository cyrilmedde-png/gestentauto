'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, ChevronDown, ChevronRight, LogOut, type LucideIcon } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { useAuth } from '@/components/auth/AuthProvider'
import * as Icons from 'lucide-react'

interface Module {
  id: string
  module_name: string
  display_name: string
  description: string
  icon: string
  route: string
  is_active: boolean
  status: string
}

interface Category {
  id: string
  name: string
  display_name: string
  description: string
  icon: string
  color: string
  order_index: number
  is_platform_only: boolean
  is_core: boolean
  modules: Module[]
  modules_count: number
  active_modules_count: number
}

export function SidebarModular() {
  const { signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { setIsSidebarExpanded } = useSidebar()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Informer le contexte de l'état de la sidebar
  useEffect(() => {
    setIsSidebarExpanded(isExpanded || isMobileOpen)
  }, [isExpanded, isMobileOpen, setIsSidebarExpanded])

  // Charger les modules groupés par catégorie
  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    try {
      setLoading(true)
      
      // Charger modules disponibles pour l'utilisateur
      const response = await fetch('/api/modules/available')
      const data = await response.json()

      if (data.success && data.categories) {
        setCategories(data.categories.map((cat: any) => ({
          ...cat.category,
          modules: cat.modules,
          modules_count: cat.modules.length,
          active_modules_count: cat.modules.filter((m: Module) => m.is_active).length,
        })))
      }
    } catch (error) {
      console.error('Error loading modules:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fermer le menu mobile au changement de route
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Toggle collapse section
  const toggleSection = (categoryName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  // Obtenir l'icône depuis le nom
  const getIcon = (iconName: string): LucideIcon => {
    const IconComponent = (Icons as any)[iconName] as LucideIcon
    return IconComponent || Icons.Package
  }

  // Vérifier si route est active
  const isRouteActive = (route: string) => {
    return pathname === route || pathname.startsWith(route + '/')
  }

  return (
    <>
      {/* Mobile: Bouton hamburger */}
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
          fixed left-0 top-0 h-full transition-all duration-300 overflow-hidden
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
        <div className="h-full bg-background/50 backdrop-blur-sm border-r border-border/50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-center">
              {(isExpanded || isMobileOpen) ? (
                <button 
                  onClick={async () => {
                    await signOut()
                    router.push('/auth/login')
                  }}
                  className="text-foreground font-semibold text-lg hover:opacity-80 transition-opacity text-center w-full"
                >
                  Talos Prime
                </button>
              ) : (
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                  T
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {loading ? (
              <div className="px-4 text-muted-foreground text-sm">
                Chargement...
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id}>
                    {/* En-tête de section */}
                    <button
                      onClick={() => toggleSection(category.name)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors
                        ${(isExpanded || isMobileOpen) ? 'justify-between' : 'justify-center'}
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {(() => {
                          const CategoryIcon = getIcon(category.icon)
                          return <CategoryIcon className="w-5 h-5 flex-shrink-0" style={{ color: category.color }} />
                        })()}
                        {(isExpanded || isMobileOpen) && (
                          <span className="font-medium text-sm truncate">
                            {category.display_name}
                          </span>
                        )}
                      </div>
                      {(isExpanded || isMobileOpen) && (
                        <>
                          {collapsedSections.has(category.name) ? (
                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Modules de la section */}
                    {!collapsedSections.has(category.name) && (
                      <div className={`${(isExpanded || isMobileOpen) ? 'ml-4' : ''}`}>
                        {category.modules.map((module) => {
                          const ModuleIcon = getIcon(module.icon)
                          const isActive = isRouteActive(module.route)

                          return (
                            <Link
                              key={module.id}
                              href={module.route}
                              className={`
                                flex items-center gap-3 px-4 py-2 transition-colors
                                ${isActive 
                                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }
                                ${(isExpanded || isMobileOpen) ? '' : 'justify-center'}
                              `}
                              title={(isExpanded || isMobileOpen) ? '' : module.display_name}
                            >
                              <ModuleIcon className="w-5 h-5 flex-shrink-0" />
                              {(isExpanded || isMobileOpen) && (
                                <span className="text-sm truncate">{module.display_name}</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </nav>

          {/* Footer - Déconnexion */}
          <div className="p-4 border-t border-border/50">
            <button
              onClick={async () => {
                await signOut()
                router.push('/auth/login')
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors
                ${(isExpanded || isMobileOpen) ? '' : 'justify-center'}
              `}
              title={(isExpanded || isMobileOpen) ? '' : 'Déconnexion'}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {(isExpanded || isMobileOpen) && (
                <span className="text-sm">Déconnexion</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

