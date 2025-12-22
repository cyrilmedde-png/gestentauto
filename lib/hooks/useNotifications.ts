'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  read: boolean
  created_at: string
  updated_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {
        'X-User-Id': user.id,
      }

      const response = await fetch('/api/platform/notifications', {
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des notifications')
      }

      const data = await response.json()
      const loadedNotifications = data.notifications || []
      setNotifications(loadedNotifications)
      setUnreadCount(loadedNotifications.filter((n: Notification) => !n.read).length)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    loadNotifications()

    // Abonnement Supabase Realtime pour les nouvelles notifications
    const channel = supabase
      .channel('platform_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'platform_notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
          
          // Afficher une notification toast
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(
              new CustomEvent('new-notification', { detail: newNotification })
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'platform_notifications',
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications((prev) => {
            const updated = prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            // Recalculer le nombre de non lues
            const unread = updated.filter((n) => !n.read).length
            setUnreadCount(unread)
            return updated
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
      }

      const response = await fetch(`/api/platform/notifications/${notificationId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Erreur:', err)
    }
  }, [user?.id])

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
      }

      const response = await fetch('/api/platform/notifications', {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }, [user?.id])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  }
}

