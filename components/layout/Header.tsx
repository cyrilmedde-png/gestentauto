'use client'

import { useState, useEffect } from 'react'
import { Search, Bell } from 'lucide-react'
import { useHeader } from './HeaderContext'

export function Header() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { setIsHeaderVisible } = useHeader()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Sur mobile, le header est toujours visible mais se rétracte
      if (mobile) {
        setIsVisible(true)
        setIsHeaderVisible(true)
      } else {
        // Sur desktop, réinitialiser l'état au survol
        setIsVisible(false)
        setIsHeaderVisible(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsHeaderVisible])

  // Mettre à jour le contexte quand la visibilité change (desktop seulement)
  useEffect(() => {
    if (!isMobile) {
      setIsHeaderVisible(isVisible)
    }
  }, [isVisible, isMobile, setIsHeaderVisible])

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsVisible(true)
      setIsHeaderVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsVisible(false)
      setIsHeaderVisible(false)
    }
  }

  return (
    <>
      {/* Trigger zone (desktop seulement) */}
      {!isMobile && (
        <div
          className="hidden lg:block fixed top-0 left-20 right-0 h-1 z-30 bg-transparent"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* Header */}
      <header
        className={`
          fixed top-0 z-20 transition-transform duration-300
          ${isMobile ? 'left-0 right-0' : 'left-20 right-0'}
          ${isMobile ? 'translate-y-0' : (isVisible ? 'translate-y-0' : '-translate-y-full')}
        `}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-background/50 backdrop-blur-sm">
          <div className={`${isMobile ? 'container mx-auto' : ''} px-6 py-4`}>
            <div className="flex items-center justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button 
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

