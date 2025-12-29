'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import React from 'react'

// Variable globale pour persister l'iframe entre les remontages
// Stockée directement dans document.body pour éviter les remontages React
let globalIframe: HTMLIFrameElement | null = null
let iframeLoaded = false
let iframeContainer: HTMLDivElement | null = null
let renderCount = 0

// Fonction pour créer/mettre à jour l'iframe de manière persistante
function ensureIframeExists(targetContainer: HTMLDivElement) {
  renderCount++
  console.log(`[N8N Iframe] Render count: ${renderCount}, Iframe exists: ${!!globalIframe}, Loaded: ${iframeLoaded}`)
  
  // Si l'iframe existe déjà, juste la déplacer si nécessaire
  if (globalIframe && iframeContainer) {
    if (globalIframe.parentNode !== targetContainer) {
      console.log('[N8N Iframe] Moving iframe to new container')
      // Déplacer l'iframe vers le nouveau conteneur
      targetContainer.appendChild(globalIframe)
      iframeContainer = targetContainer
    } else {
      console.log('[N8N Iframe] Iframe already in correct container')
    }
    return globalIframe
  }

  // Créer le conteneur si nécessaire
  if (!iframeContainer) {
    iframeContainer = targetContainer
  }

  // Créer l'iframe une seule fois
  if (!globalIframe) {
    console.log('[N8N Iframe] Creating new iframe')
    const iframe = document.createElement('iframe')
    iframe.src = 'https://n8n.talosprimes.com'
    iframe.className = 'w-full h-full border-0 rounded-lg'
    iframe.title = 'N8N - Automatisation'
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen')
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
    iframe.style.display = 'block'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    
    iframe.onload = () => {
      iframeLoaded = true
      console.log('[N8N Iframe] Iframe loaded successfully')
      // Déclencher un événement personnalisé pour notifier le chargement
      window.dispatchEvent(new CustomEvent('n8n-iframe-loaded'))
    }

    iframe.onerror = () => {
      console.error('[N8N Iframe] Iframe load error')
    }

    globalIframe = iframe
    iframeContainer.appendChild(iframe)
    console.log('[N8N Iframe] Iframe appended to container')
  }

  return globalIframe
}

const N8NPageContent = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(!iframeLoaded)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const navigationBlockedRef = useRef(false)

  // Empêcher Next.js de naviguer lors du changement d'onglet
  useEffect(() => {
    // Intercepter les tentatives de navigation Next.js
    const originalPush = router.push
    const originalReplace = router.replace
    
    router.push = ((...args: Parameters<typeof router.push>) => {
      if (navigationBlockedRef.current) {
        console.log('[N8N Page] Blocked router.push during tab change')
        return Promise.resolve(false)
      }
      return originalPush.apply(router, args)
    }) as typeof router.push
    
    router.replace = ((...args: Parameters<typeof router.replace>) => {
      if (navigationBlockedRef.current) {
        console.log('[N8N Page] Blocked router.replace during tab change')
        return Promise.resolve(false)
      }
      return originalReplace.apply(router, args)
    }) as typeof router.replace

    return () => {
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [router])

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    console.log('[N8N Page] Component mounting')
    setMounted(true)
  }, [])

  // Gérer l'iframe de manière persistante
  useEffect(() => {
    if (!mounted || !containerRef.current) {
      console.log('[N8N Page] Not mounted or no container ref')
      return
    }

    console.log('[N8N Page] Setting up iframe')
    // Créer/mettre à jour l'iframe
    ensureIframeExists(containerRef.current)

    // Écouter l'événement de chargement
    const handleIframeLoaded = () => {
      console.log('[N8N Page] Received iframe loaded event')
      setLoading(false)
    }
    window.addEventListener('n8n-iframe-loaded', handleIframeLoaded)

    // Timeout de sécurité
    const timeout = setTimeout(() => {
      if (!iframeLoaded) {
        console.log('[N8N Page] Timeout - marking as loaded')
        iframeLoaded = true
        setLoading(false)
      }
    }, 5000)

    // Si l'iframe est déjà chargée, ne pas afficher le loader
    if (iframeLoaded) {
      console.log('[N8N Page] Iframe already loaded, hiding loader')
      setLoading(false)
    }

    return () => {
      console.log('[N8N Page] Cleanup effect')
      window.removeEventListener('n8n-iframe-loaded', handleIframeLoaded)
      clearTimeout(timeout)
      // NE JAMAIS supprimer l'iframe - elle reste en mémoire
    }
  }, [mounted])

  // Empêcher tout rechargement lors des événements de visibilité
  useEffect(() => {
    // Intercepter et empêcher les comportements par défaut
    const preventReload = (e: BeforeUnloadEvent) => {
      console.log('[N8N Page] Preventing reload event: beforeunload')
      // Ne pas empêcher complètement (pour permettre la fermeture normale)
      // Mais empêcher les rechargements automatiques
      if (navigationBlockedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    // Empêcher les rechargements lors du changement d'onglet
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      console.log(`[N8N Page] Visibility changed: ${isVisible ? 'visible' : 'hidden'}`)
      
      // Bloquer la navigation Next.js pendant le changement d'onglet
      if (!isVisible) {
        navigationBlockedRef.current = true
        console.log('[N8N Page] Blocking navigation (tab hidden)')
      } else {
        // Délai avant de débloquer pour éviter les navigations immédiates
        setTimeout(() => {
          navigationBlockedRef.current = false
          console.log('[N8N Page] Unblocking navigation (tab visible)')
        }, 100)
      }
      
      // Ne rien faire - l'iframe reste en mémoire
      if (globalIframe && !globalIframe.parentNode && containerRef.current) {
        console.log('[N8N Page] Iframe lost parent, reattaching')
        // Si l'iframe a été perdue, la remettre
        containerRef.current.appendChild(globalIframe)
      }
    }

    const handleFocus = () => {
      console.log('[N8N Page] Window focused')
      // Vérifier que l'iframe est toujours là
      if (globalIframe && !globalIframe.parentNode && containerRef.current) {
        console.log('[N8N Page] Iframe lost parent on focus, reattaching')
        containerRef.current.appendChild(globalIframe)
      }
    }

    const handleBlur = () => {
      console.log('[N8N Page] Window blurred')
      navigationBlockedRef.current = true
    }

    // Empêcher les popstate qui peuvent déclencher des navigations
    const handlePopState = (e: PopStateEvent) => {
      if (navigationBlockedRef.current) {
        console.log('[N8N Page] Blocked popstate navigation')
        e.preventDefault()
        e.stopPropagation()
        // Empêcher la navigation en restaurant l'état
        window.history.pushState(null, '', pathname)
      }
    }

    // Écouter les événements mais ne pas permettre de rechargement
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true })
    window.addEventListener('focus', handleFocus, { passive: true })
    window.addEventListener('blur', handleBlur, { passive: true })
    window.addEventListener('beforeunload', preventReload)
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      console.log('[N8N Page] Removing visibility event listeners')
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('beforeunload', preventReload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname])

  if (!mounted) {
    return null
  }

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
          suppressHydrationWarning
          style={{ position: 'relative' }}
        />
      </MainLayout>
    </ProtectedRoute>
  )
})

N8NPageContent.displayName = 'N8NPageContent'

export default function N8NPage() {
  return <N8NPageContent />
}
