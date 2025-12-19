'use client'

/**
 * Page de confirmation d'email
 */

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { AnimatedNetwork } from '@/components/background/AnimatedNetwork'

function ConfirmEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Vérification de votre email en cours...')

  useEffect(() => {
    async function verifyEmail() {
      // Si Supabase n'est pas configuré, afficher une erreur immédiatement
      if (!isSupabaseConfigured) {
        setStatus('error')
        setMessage('Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement sur Vercel.')
        return
      }

      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (!token || type !== 'email') {
        setStatus('error')
        setMessage('Lien de confirmation invalide')
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        })

        if (error) {
          setStatus('error')
          setMessage(error.message || 'Erreur lors de la confirmation')
        } else {
          setStatus('success')
          setMessage('Votre email a été confirmé avec succès !')
          // Rediriger vers le dashboard après 2 secondes
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'Erreur lors de la confirmation')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] relative overflow-hidden">
      <AnimatedNetwork />
      <div className="max-w-md w-full space-y-8 p-8 relative z-10">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Confirmation en cours
              </h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/20 border border-green-500/50 mb-4">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Email confirmé !
              </h2>
              <p className="text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Redirection vers le tableau de bord...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 border border-red-500/50 mb-4">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Erreur de confirmation
              </h2>
              <p className="text-gray-400 mb-4">{message}</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-gray-400 hover:text-white underline transition-colors"
              >
                Retour à la connexion
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#080808] relative overflow-hidden">
        <AnimatedNetwork />
        <div className="max-w-md w-full space-y-8 p-8 relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Chargement...</h2>
        </div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}

