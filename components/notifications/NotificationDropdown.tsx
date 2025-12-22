'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, ExternalLink } from 'lucide-react'
import { useNotifications, type Notification } from '@/lib/hooks/useNotifications'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'

export function NotificationDropdown() {
  const { user } = useAuth()
  const [isPlatform, setIsPlatform] = useState<boolean | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Vérifier si l'utilisateur est plateforme
  useEffect(() => {
    if (!user?.id) {
      setIsPlatform(false)
      return
    }

    let cancelled = false

    fetch('/api/auth/check-user-type', {
      method: 'GET',
      headers: {
        'X-User-Id': user.id,
      },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setIsPlatform(data.isPlatform || false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsPlatform(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Ne pas afficher si l'utilisateur n'est pas plateforme
  if (!isPlatform) {
    return null
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'new_registration' && notification.data?.lead_id) {
      return `/platform/leads/${notification.data.lead_id}`
    }
    if (notification.type === 'new_registration' && notification.data?.company_id) {
      return `/platform/clients/${notification.data.company_id}`
    }
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-2.5 text-muted-foreground hover:text-foreground active:text-foreground transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border/50 rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tout marquer comme lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notification) => {
                  const link = getNotificationLink(notification)
                  const content = (
                    <div
                      className={`p-4 hover:bg-background/30 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Marquer comme lu"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )

                  return link ? (
                    <Link 
                      key={notification.id} 
                      href={link} 
                      onClick={() => setIsOpen(false)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

