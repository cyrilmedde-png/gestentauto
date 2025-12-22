'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedPlatformRoute } from '@/components/auth/ProtectedPlatformRoute'
import { useState, useEffect } from 'react'

export default function N8NPage() {
  const [n8nUrl, setN8nUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer l'URL N8N depuis les variables d'environnement
    const url = process.env.NEXT_PUBLIC_N8N_URL || 'https://n8n.talosprimes.com'
    setN8nUrl(url)
    setLoading(false)
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

  return (
    <ProtectedPlatformRoute>
      <MainLayout>
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="border-b border-border/50 p-4 bg-background/50 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-foreground">N8N - Automatisation</h1>
            <p className="text-sm text-muted-foreground">Gérez vos workflows et automatisations</p>
          </div>

          {/* Iframe N8N */}
          <div className="flex-1 relative">
            <iframe
              src={n8nUrl}
              className="w-full h-full border-0"
              title="N8N Workflows"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>
      </MainLayout>
    </ProtectedPlatformRoute>
  )
}

