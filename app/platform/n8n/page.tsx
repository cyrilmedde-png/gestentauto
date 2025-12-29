'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import React from 'react'

// Mémoriser le composant pour éviter les remontages inutiles
const N8NPageContent = React.memo(() => {
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Si l'iframe a déjà été chargé, ne pas recharger
    if (hasLoadedRef.current) {
      setLoading(false)
      return
    }

    // Timeout de sécurité pour le chargement
    const timeout = setTimeout(() => {
      setLoading(false)
      hasLoadedRef.current = true
    }, 2000)

    return () => clearTimeout(timeout)
  }, [])

  // Mémoriser l'iframe pour éviter les recréations
  const iframe = useMemo(() => (
    <iframe
      ref={iframeRef}
      key="n8n-iframe-stable" // Key stable pour éviter la recréation
      src="https://n8n.talosprimes.com"
      className="w-full h-full border-0 rounded-lg"
      title="N8N - Automatisation"
      allow="clipboard-read; clipboard-write; fullscreen"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      onLoad={() => {
        setLoading(false)
        hasLoadedRef.current = true
      }}
    />
  ), [])

  if (loading && !hasLoadedRef.current) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement de N8N...</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="w-full h-[calc(100vh-4rem)]">
          {iframe}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
})

N8NPageContent.displayName = 'N8NPageContent'

export default function N8NPage() {
  return <N8NPageContent />
}
