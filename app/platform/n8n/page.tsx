'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

export default function N8NPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Attendre que l'utilisateur soit chargé
    if (user) {
      setLoading(false)
      // Tester la connexion à N8N
      testN8NConnection()
    }
  }, [user])

  // Fonction pour tester la connexion à N8N
  const testN8NConnection = async () => {
    try {
      setConnectionStatus('checking')
      setError(null)
      
      const response = await fetch('/api/platform/n8n/health', {
        method: 'GET',
      })
      
      const data = await response.json()
      
      if (data.connected) {
        setConnectionStatus('connected')
        setError(null)
      } else {
        setConnectionStatus('error')
        setError(data.error || 'N8N n\'est pas accessible')
      }
    } catch (err) {
      setConnectionStatus('error')
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(`Impossible de vérifier la connexion à N8N: ${errorMessage}`)
    }
  }

  // Fonction pour gérer les messages depuis l'iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Vérifier l'origine pour la sécurité
      const n8nOrigin = process.env.NEXT_PUBLIC_N8N_URL || 'https://n8n.talosprimes.com'
      if (event.origin !== n8nOrigin && !event.origin.includes('talosprimes.com')) {
        return
      }
      
      // Gérer les messages de l'iframe N8N si nécessaire
      console.log('Message from N8N iframe:', event.data)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (loading) {
    return (
      <ProtectedPlatformRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-muted-foreground">Chargement de N8N...</div>
          </div>
        </MainLayout>
      </ProtectedPlatformRoute>
    )
  }

  if (error || connectionStatus === 'error') {
    return (
      <ProtectedPlatformRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="max-w-md p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h2 className="text-xl font-bold text-destructive mb-2">Erreur de connexion à N8N</h2>
              <p className="text-destructive mb-4">{error || 'Impossible de se connecter à N8N'}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Vérifications à effectuer :</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>N8N est démarré et accessible</li>
                  <li>Les variables d'environnement sont configurées (N8N_URL, N8N_BASIC_AUTH_USER, N8N_BASIC_AUTH_PASSWORD)</li>
                  <li>Le service N8N répond aux requêtes</li>
                </ul>
              </div>
              <button
                onClick={testN8NConnection}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Réessayer
              </button>
            </div>
          </div>
        </MainLayout>
      </ProtectedPlatformRoute>
    )
  }

  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="border-b border-border/50 p-4 bg-background/50 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-foreground">N8N - Automatisation</h1>
            <p className="text-sm text-muted-foreground">Gérez vos workflows et automatisations</p>
          </div>

          {/* Iframe N8N avec authentification automatique */}
          <div className="flex-1 relative">
            <iframe
              ref={iframeRef}
              src="/platform/n8n/view"
              className="w-full h-full border-0"
              title="N8N Workflows"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
              onError={() => {
                setError('Erreur lors du chargement de N8N. Vérifiez que N8N est accessible et que la configuration est correcte.')
                setConnectionStatus('error')
              }}
              onLoad={() => {
                // Si l'iframe se charge, la connexion est OK
                if (connectionStatus === 'checking') {
                  setConnectionStatus('connected')
                }
              }}
            />
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

