'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function N8NPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Vérifier la santé de N8N
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/platform/n8n/health')
        const data = await response.json()
        
        if (!data.connected) {
          setError(data.error || 'N8N n\'est pas accessible')
        }
      } catch (err) {
        setError('Impossible de vérifier l\'état de N8N')
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de N8N...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Erreur de connexion à N8N</h1>
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => router.push('/platform/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <iframe
        src="/platform/n8n/view"
        className="w-full h-screen border-0"
        title="N8N - Automatisation"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

