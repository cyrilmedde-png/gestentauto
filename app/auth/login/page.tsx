'use client'

/**
 * Page de connexion
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/modules/core/lib/auth'
import { useAuth } from '@/modules/core/components/AuthProvider'
import { AnimatedNetwork } from '@/components/background/AnimatedNetwork'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading, refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      // Attendre un peu pour que la session soit bien établie
      await new Promise(resolve => setTimeout(resolve, 500))
      // Rafraîchir l'état d'authentification
      await refresh()
      // Rediriger vers le dashboard
      router.push('/dashboard')
      router.refresh() // Forcer le rafraîchissement
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion')
      setLoading(false)
    }
  }

  // Afficher un loader pendant le chargement initial
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808] relative overflow-hidden">
        <AnimatedNetwork />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  // Ne rien afficher si redirection en cours
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] relative overflow-hidden">
      <AnimatedNetwork />
      <div className="max-w-md w-full space-y-8 p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Gestion Entreprise</h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Connexion
          </h2>
          <p className="text-gray-400">
            Accédez à votre espace de gestion
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="votre@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary py-3 px-4 rounded-lg text-sm font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
          
          <div className="text-center">
            <a href="/auth/register" className="text-sm text-gray-400 hover:text-white transition-colors">
              Créer un compte
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

