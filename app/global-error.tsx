'use client'

/**
 * Composant d'erreur global pour les erreurs critiques
 * Utilisé pour les erreurs qui se produisent dans le root layout
 * NOTE: Ce composant DOIT être un composant client ('use client')
 */

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur critique
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#080808', color: '#fff' }}>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{ 
            maxWidth: '28rem', 
            width: '100%', 
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{
              margin: '0 auto 1rem',
              width: '4rem',
              height: '4rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '2rem', height: '2rem', color: '#f87171' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#fff' }}>
              Erreur critique
            </h2>
            
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              {error.message || 'Une erreur critique s\'est produite. Veuillez rafraîchir la page.'}
            </p>
            
            <button
              onClick={() => reset()}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '0.5rem',
                color: '#fff',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

