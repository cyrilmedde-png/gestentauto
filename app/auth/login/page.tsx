'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Erreur de connexion:', signInError)
        setError(signInError.message || 'Erreur lors de la connexion')
        return
      }

      if (data.user) {
        console.log('✅ Connexion Supabase Auth réussie, User ID:', data.user.id)
        
        // Attendre un peu pour que la session soit bien établie
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Vérifier que l'utilisateur a bien une entrée dans la table users
        console.log('🔍 Vérification de l\'utilisateur dans la table users...')
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, company_id, email')
          .eq('id', data.user.id)
          .single()

        if (userError) {
          console.error('❌ Erreur lors de la vérification:', userError)
          console.error('Détails:', {
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
            code: userError.code
          })
          setError(`Compte utilisateur non trouvé dans la base de données. Veuillez exécuter le script SQL dans Supabase pour créer votre compte. (Erreur: ${userError.message})`)
          // Déconnecter l'utilisateur de Supabase Auth
          await supabase.auth.signOut()
          return
        }

        if (!userData) {
          console.error('❌ userData est null')
          setError('Compte utilisateur incomplet. Veuillez exécuter le script SQL dans Supabase.')
          await supabase.auth.signOut()
          return
        }

        console.log('✅ Utilisateur trouvé dans la table users:', userData)
        
        // Vérifier si l'utilisateur est plateforme ou client
        try {
          const checkResponse = await fetch('/api/auth/check-user-type')
          if (checkResponse.ok) {
            const { isPlatform } = await checkResponse.json()
            if (isPlatform) {
              console.log('🚀 Redirection vers le dashboard plateforme...')
              router.push('/platform/dashboard')
            } else {
              console.log('🚀 Redirection vers le dashboard client...')
              router.push('/dashboard')
            }
          } else {
            // En cas d'erreur, rediriger par défaut vers le dashboard client
            console.log('⚠️ Impossible de déterminer le type d\'utilisateur, redirection par défaut vers /dashboard')
            router.push('/dashboard')
          }
        } catch (checkError) {
          console.error('Erreur lors de la vérification du type d\'utilisateur:', checkError)
          // En cas d'erreur, rediriger par défaut vers le dashboard client
          router.push('/dashboard')
        }
        
        router.refresh()
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="w-full max-w-md p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          Connexion
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}
