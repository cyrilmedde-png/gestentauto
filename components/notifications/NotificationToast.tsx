'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, Bell, UserPlus } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  read: boolean
  created_at: string
}

export function NotificationToast() {
  const { user } = useAuth()
  const [isPlatform, setIsPlatform] = useState<boolean | null>(null)
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Vérifier si l'utilisateur est plateforme
  useEffect(() => {
    if (!user?.id) {
      setIsPlatform(false)
      return
    }

    fetch('/api/auth/check-user-type', {
      method: 'GET',
      headers: {
        'X-User-Id': user.id,
      },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setIsPlatform(data.isPlatform || false)
      })
      .catch(() => {
        setIsPlatform(false)
      })
  }, [user?.id])

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      setCurrentNotification(event.detail)
      setIsVisible(true)

      // Auto-fermer après 5 secondes
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setCurrentNotification(null), 300)
      }, 5000)

      return () => clearTimeout(timer)
    }

    window.addEventListener('new-notification', handleNewNotification as EventListener)

    return () => {
      window.removeEventListener('new-notification', handleNewNotification as EventListener)
    }
  }, [])

  // Ne pas afficher si l'utilisateur n'est pas plateforme
  if (!isPlatform || !currentNotification || !isVisible) return null

  const getIcon = () => {
    switch (currentNotification.type) {
      case 'new_registration':
        return <UserPlus className="w-5 h-5 text-green-400" />
      case 'new_lead':
        return <Bell className="w-5 h-5 text-blue-400" />
      default:
        return <Info className="w-5 h-5 text-primary" />
    }
  }

  const getBgColor = () => {
    switch (currentNotification.type) {
      case 'new_registration':
        return 'bg-green-500/10 border-green-500/50'
      case 'new_lead':
        return 'bg-blue-500/10 border-blue-500/50'
      default:
        return 'bg-primary/10 border-primary/50'
    }
  }

  return (
    <div
      className={`fixed top-20 right-4 z-50 min-w-[320px] max-w-md ${getBgColor()} border rounded-lg shadow-lg p-4 animate-slide-in-right`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm mb-1">
            {currentNotification.title}
          </h4>
          <p className="text-sm text-muted-foreground">
            {currentNotification.message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => setCurrentNotification(null), 300)
          }}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

