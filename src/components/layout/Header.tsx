'use client'

/**
 * Header - En-tête de l'application
 * Design sobre et moderne, rétractable vers le haut
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/modules/core/components/AuthProvider'
import { Bell, Search, User } from 'lucide-react'
import { useHeader } from './HeaderContext'

export function Header() {
  const { user } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const { setIsHeaderVisible } = useHeader()

  useEffect(() => {
    setIsHeaderVisible(isHovered)
  }, [isHovered, setIsHeaderVisible])

  return (
    <>
      {/* Zone de déclenchement invisible en haut (4px) */}
      <div 
        className="fixed top-0 left-20 right-0 h-4 z-30"
        onMouseEnter={() => setIsHovered(true)}
      />
      
      {/* Header fixe qui se rétracte vers le haut - complètement fondu */}
      <header 
        className="fixed top-0 left-20 right-0 h-16 bg-transparent flex items-center justify-between px-6 backdrop-blur-sm transition-transform duration-300 z-20"
        style={{
          transform: isHovered ? 'translateY(0)' : 'translateY(-100%)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
                    {/* Search */}
                    <div className="flex-1 max-w-xl">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          className="w-full pl-10 pr-4 py-2 bg-transparent border border-white/5 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all"
                        />
                      </div>
                    </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/3 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-purple-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {user?.firstName || 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

