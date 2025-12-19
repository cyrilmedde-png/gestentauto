'use client'

/**
 * Page 404 - Page non trouvée
 */

import Link from 'next/link'
import { AnimatedNetwork } from '@/components/background/AnimatedNetwork'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] relative overflow-hidden">
      <AnimatedNetwork />
      <div className="max-w-md w-full space-y-6 p-8 relative z-10 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-500/20 border border-yellow-500/50 mb-4">
          <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">
          Page non trouvée
        </h2>
        
        <p className="text-gray-400 mb-6">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full gradient-primary py-3 px-4 rounded-lg text-sm font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-center"
          >
            Retour au tableau de bord
          </Link>
          
          <Link
            href="/auth/login"
            className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-center"
          >
            Page de connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

