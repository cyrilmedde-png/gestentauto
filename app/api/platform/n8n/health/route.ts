import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { testN8NConnection } from '@/lib/services/n8n'

/**
 * Route pour vérifier l'état de santé de N8N
 * Accessible uniquement aux administrateurs plateforme
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est un admin plateforme
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403 }
      )
    }

    // Tester la connexion à N8N
    const status = await testN8NConnection(5000)

    return NextResponse.json(status, {
      status: status.connected ? 200 : 503,
    })
  } catch (error) {
    console.error('[N8N Health] Error:', error)
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

