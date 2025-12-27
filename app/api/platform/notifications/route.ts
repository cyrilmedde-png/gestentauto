import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { verifyPlatformUser, createForbiddenResponse } from '@/lib/middleware/platform-auth'

/**
 * GET /api/platform/notifications
 * Liste toutes les notifications (non lues en priorité)
 * Query params: ?unread=true pour uniquement les non lues
 */
export async function GET(request: NextRequest) {
  try {
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

    const supabase = createPlatformClient()
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    let query = supabase
      .from('platform_notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    console.error('Error in GET /api/platform/notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/platform/notifications
 * Marquer une ou plusieurs notifications comme lues
 * Body: { notificationIds: string[] } ou { markAllAsRead: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    const supabase = createPlatformClient()

    if (markAllAsRead) {
      const { error } = await supabase
        .from('platform_notifications')
        .update({ read: true })
        .eq('read', false)

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      const { error } = await supabase
        .from('platform_notifications')
        .update({ read: true })
        .in('id', notificationIds)

      if (error) {
        throw error
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'notificationIds or markAllAsRead required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/platform/notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}






