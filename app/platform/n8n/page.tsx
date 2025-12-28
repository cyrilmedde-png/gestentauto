'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { getN8NIframe } from '@/lib/n8n-iframe'

export default function N8NPage() {
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeInitializedRef = useRef(false)

  useEffect(() => {
    // Timeout de sécurité pour le chargement
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!containerRef.current || loading || iframeInitializedRef.current) return

    // Récupérer l'iframe globale (créée une seule fois)
    const iframe = getN8NIframe()

    // Si l'iframe est déjà dans un autre container, la déplacer
    if (iframe.parentNode && iframe.parentNode !== containerRef.current) {
      iframe.parentNode.removeChild(iframe)
      containerRef.current.appendChild(iframe)
    } else if (!containerRef.current.contains(iframe)) {
      // Si l'iframe n'est nulle part, l'ajouter
      containerRef.current.appendChild(iframe)
    }

    iframeInitializedRef.current = true

    // Ne jamais supprimer l'iframe dans le cleanup
    return () => {
      // Ne rien faire - l'iframe doit persister
    }
  }, [loading])

  if (loading) {
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
        <div 
          ref={containerRef}
          className="w-full h-[calc(100vh-4rem)]"
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedRoute>
  )
}
