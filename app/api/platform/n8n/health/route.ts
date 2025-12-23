import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticatedUser } from '@/lib/middleware/platform-auth'
import { testN8NConnection } from '@/lib/services/n8n'

/**
 * Route pour vérifier l'état de santé de N8N
 * Accessible à tous les utilisateurs authentifiés (plateforme et clients)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié (plateforme ou client)
    const { isAuthenticated, error } = await verifyAuthenticatedUser(request)
    
    if (!isAuthenticated || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required', details: error },
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

