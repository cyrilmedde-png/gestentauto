'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import React from 'react'

// Mémoriser le composant pour éviter les remontages inutiles
const N8NPageContent = React.memo(() => {
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hasLoadedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Créer l'iframe une seule fois et la garder en mémoire
  const iframeElementRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    // Créer l'iframe une seule fois
    if (!iframeElementRef.current && containerRef.current) {
      const iframe = document.createElement('iframe')
      iframe.src = 'https://n8n.talosprimes.com'
      iframe.className = 'w-full h-full border-0 rounded-lg'
      iframe.title = 'N8N - Automatisation'
      iframe.allow = 'clipboard-read; clipboard-write; fullscreen'
      iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
      
      iframe.onload = () => {
        setLoading(false)
        hasLoadedRef.current = true
      }
      
      iframeElementRef.current = iframe
      containerRef.current.appendChild(iframe)
      
      // Timeout de sécurité pour le chargement
      const timeout = setTimeout(() => {
        setLoading(false)
        hasLoadedRef.current = true
      }, 3000)
      
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [])

  // Gérer la visibilité de l'onglet pour éviter le rechargement
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && iframeElementRef.current) {
        // L'utilisateur revient sur l'onglet
        // Ne rien faire, l'iframe reste en place
        console.log('Retour sur l\'onglet N8N - iframe préservée')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="relative w-full h-[calc(100vh-4rem)]">
          {loading && !hasLoadedRef.current && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement de N8N...</p>
              </div>
            </div>
          )}
          {/* Container pour l'iframe - créée via useEffect */}
          <div 
            ref={containerRef} 
            className="w-full h-full"
            style={{ minHeight: '100%' }}
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
})

N8NPageContent.displayName = 'N8NPageContent'

export default function N8NPage() {
  return <N8NPageContent />
}
