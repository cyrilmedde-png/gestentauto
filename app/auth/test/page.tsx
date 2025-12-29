'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * Page de test pour déboguer l'authentification
 * À supprimer en production
 */
export default function TestAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Test en cours...\n')

    try {
      // 1. Tester la connexion Supabase
      setResult(prev => prev + '1. Test connexion Supabase...\n')
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      setResult(prev => prev + `   Session initiale: ${initialSession ? 'OUI' : 'NON'}\n\n`)

      // 2. Tester la connexion avec email/password
      setResult(prev => prev + '2. Tentative de connexion...\n')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setResult(prev => prev + `   ❌ Erreur: ${error.message}\n`)
        setResult(prev => prev + `   Code: ${error.status}\n\n`)
        return
      }

      setResult(prev => prev + `   ✅ Connexion réussie!\n`)
      setResult(prev => prev + `   User ID: ${data.user?.id}\n`)
      setResult(prev => prev + `   Email: ${data.user?.email}\n\n`)

      // 3. Vérifier la session
      const { data: { session } } = await supabase.auth.getSession()
      setResult(prev => prev + `3. Session après connexion: ${session ? 'OUI' : 'NON'}\n\n`)

      // 4. Vérifier l'entrée dans la table users
      setResult(prev => prev + '4. Vérification table users...\n')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user!.id)
        .single()

      if (userError) {
        setResult(prev => prev + `   ❌ Erreur: ${userError.message}\n`)
        setResult(prev => prev + `   Code: ${userError.code}\n`)
      } else {
        setResult(prev => prev + `   ✅ Utilisateur trouvé dans users\n`)
        setResult(prev => prev + `   Company ID: ${userData.company_id}\n`)
      }

      // 5. Vérifier l'entreprise
      if (userData) {
        setResult(prev => prev + `\n5. Vérification entreprise...\n`)
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single()

        if (companyError) {
          setResult(prev => prev + `   ❌ Erreur: ${companyError.message}\n`)
        } else {
          setResult(prev => prev + `   ✅ Entreprise trouvée: ${companyData.name}\n`)
        }
      }

    } catch (err) {
      setResult(prev => prev + `\n❌ Erreur inattendue: ${err}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testCheckUsers = async () => {
    setLoading(true)
    setResult('Vérification des utilisateurs...\n\n')

    try {
      // Vérifier dans auth.users (nécessite Service Role, donc on ne peut pas directement)
      setResult(prev => prev + 'Note: Pour voir auth.users, allez dans Supabase Dashboard > Authentication > Users\n\n')

      // Vérifier dans public.users
      setResult(prev => prev + 'Utilisateurs dans public.users:\n')
      const { data, error } = await supabase
        .from('users')
        .select('id, email, company_id')

      if (error) {
        setResult(prev => prev + `❌ Erreur: ${error.message}\n`)
      } else {
        setResult(prev => prev + `✅ ${data?.length || 0} utilisateur(s) trouvé(s)\n`)
        data?.forEach((user, index) => {
          setResult(prev => prev + `   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)\n`)
        })
      }
    } catch (err) {
      setResult(prev => prev + `❌ Erreur: ${err}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Authentification</h1>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-card/50 p-4 rounded-lg">
            <h2 className="font-semibold mb-4">Test Connexion</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded"
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={testConnection}
                disabled={loading || !email || !password}
                className="w-full py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
              >
                Tester la connexion
              </button>
            </div>
          </div>

          <div className="bg-card/50 p-4 rounded-lg">
            <h2 className="font-semibold mb-4">Vérifications</h2>
            <button
              onClick={testCheckUsers}
              disabled={loading}
              className="w-full py-2 bg-secondary text-secondary-foreground rounded disabled:opacity-50"
            >
              Vérifier les utilisateurs
            </button>
          </div>
        </div>

        <div className="bg-card/50 p-4 rounded-lg">
          <h2 className="font-semibold mb-4">Résultats</h2>
          <pre className="bg-background p-4 rounded text-sm whitespace-pre-wrap font-mono">
            {result || 'Aucun test effectué'}
          </pre>
        </div>
      </div>
    </div>
  )
}








