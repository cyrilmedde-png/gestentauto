import { NextRequest, NextResponse } from 'next/server'
import { createPlatformClient } from '@/lib/supabase/platform'
import { verifyPlatformUser, createForbiddenResponse } from '@/lib/middleware/platform-auth'

/**
 * PATCH /api/platform/notifications/[id]
 * Marquer une notification comme lue
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

    const { id } = await params
    const supabase = createPlatformClient()

    const { data, error } = await supabase
      .from('platform_notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ notification: data })
  } catch (error) {
    console.error('Error in PATCH /api/platform/notifications/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}




