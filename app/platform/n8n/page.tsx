'use client'

import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import React from 'react'

// ============================================================================
// STOCKAGE GLOBAL - L'iframe survit même si le composant React est démonté
// ============================================================================
let globalIframeElement: HTMLIFrameElement | null = null
let globalIframeLoaded = false
let globalIframeContainer: HTMLDivElement | null = null

// Fonction pour créer l'iframe une seule fois
function createN8NIframe(): HTMLIFrameElement {
  console.log('🔧 Création de l\'iframe N8N globale (une seule fois)')
  
  const iframe = document.createElement('iframe')
  iframe.src = 'https://n8n.talosprimes.com'
  iframe.className = 'w-full h-full border-0 rounded-lg'
  iframe.title = 'N8N - Automatisation'
  iframe.allow = 'clipboard-read; clipboard-write; fullscreen'
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
  
  // Style inline pour s'assurer que l'iframe prend tout l'espace
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  iframe.style.display = 'block'
  
  iframe.onload = () => {
    console.log('✅ Iframe N8N chargée avec succès')
    globalIframeLoaded = true
  }
  
  iframe.onerror = () => {
    console.error('❌ Erreur lors du chargement de l\'iframe N8N')
  }
  
  return iframe
}

// Mémoriser le composant pour éviter les remontages inutiles
const N8NPageContent = React.memo(() => {
  const [loading, setLoading] = useState(!globalIframeLoaded)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Éviter les doubles montages en dev mode
    if (mountedRef.current) return
    mountedRef.current = true

    console.log('🚀 Montage du composant N8N')

    // Créer l'iframe globale si elle n'existe pas
    if (!globalIframeElement) {
      globalIframeElement = createN8NIframe()
      
      // Timeout de sécurité pour masquer le loader
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('⏱️ Timeout loader N8N')
        setLoading(false)
        globalIframeLoaded = true
      }, 3000)
    } else {
      console.log('♻️ Réutilisation de l\'iframe N8N existante')
      setLoading(false)
    }

    // Attacher l'iframe au container
    if (globalIframeElement && containerRef.current) {
      // Sauvegarder le container global
      globalIframeContainer = containerRef.current
      
      // Si l'iframe est déjà attachée ailleurs, la retirer
      if (globalIframeElement.parentNode) {
        globalIframeElement.parentNode.removeChild(globalIframeElement)
      }
      
      // Attacher l'iframe au nouveau container
      containerRef.current.appendChild(globalIframeElement)
      console.log('📎 Iframe attachée au container')
    }

    // Cleanup : NE PAS détruire l'iframe, juste nettoyer les refs
    return () => {
      console.log('🔄 Démontage du composant N8N (iframe préservée en mémoire)')
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      // On ne détruit pas globalIframeElement, elle sera réutilisée
    }
  }, [])

  // Gérer la visibilité de l'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Retour sur l\'onglet N8N - iframe préservée (stockage global)')
        
        // Réattacher l'iframe si nécessaire
        if (globalIframeElement && containerRef.current && !containerRef.current.contains(globalIframeElement)) {
          console.log('🔗 Réattachement de l\'iframe')
          containerRef.current.appendChild(globalIframeElement)
        }
      } else {
        console.log('🌙 Onglet N8N en arrière-plan - iframe reste en mémoire')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Empêcher le navigateur de décharger l'iframe (bfcache)
    const handlePageHide = (e: PageTransitionEvent) => {
      console.log('💾 Page hide - préservation de l\'iframe')
    }
    
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log('♻️ Page restaurée depuis bfcache')
        // Réattacher l'iframe si nécessaire
        if (globalIframeElement && containerRef.current && !containerRef.current.contains(globalIframeElement)) {
          containerRef.current.appendChild(globalIframeElement)
        }
      }
    }
    
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="relative w-full h-[calc(100vh-4rem)] bg-background">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-50 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement de N8N...</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Première connexion...</p>
              </div>
            </div>
          )}
          {/* Container pour l'iframe globale - attachée via useEffect */}
          <div 
            ref={containerRef} 
            className="w-full h-full overflow-hidden"
            style={{ 
              minHeight: '100%',
              position: 'relative'
            }}
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
