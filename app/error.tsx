'use client'

/**
 * Composant d'erreur global
 * Affiche les erreurs qui se produisent dans l'application
 */

import { useEffect } from 'react'
import { AnimatedNetwork } from '@/components/background/AnimatedNetwork'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur pour le débogage
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] relative overflow-hidden">
      <AnimatedNetwork />
      <div className="max-w-md w-full space-y-6 p-8 relative z-10 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 border border-red-500/50 mb-4">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Une erreur s'est produite
        </h2>
        
        <p className="text-gray-400 mb-6">
          {error.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full gradient-primary py-3 px-4 rounded-lg text-sm font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          >
            Réessayer
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}

