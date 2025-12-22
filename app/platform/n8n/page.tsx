'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useState, useEffect, useRef } from 'react'

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Utiliser le proxy pour charger N8N avec authentification automatique
    const proxyUrl = '/api/platform/n8n/proxy?path='
    
    // Attendre un peu pour que le composant soit monté
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }, [])

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

  if (error) {
    return (
      <ProtectedPlatformRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-destructive">{error}</div>
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
                setError('Erreur lors du chargement de N8N. Vérifiez la configuration.')
              }}
            />
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

