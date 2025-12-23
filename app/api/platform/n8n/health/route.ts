import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { testN8NConnection } from '@/lib/services/n8n'

/**
 * Route pour vérifier l'état de santé de N8N
 * Accessible uniquement aux administrateurs plateforme
 */
export async function GET(request: NextRequest) {
  try {
    // Pendant le build Next.js, il n'y a pas de session utilisateur
    // On vérifie si on est en mode build (pas de cookies/auth)
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        !request.headers.get('cookie') && 
                        !request.headers.get('authorization') &&
                        !request.headers.get('x-supabase-auth-token')
    
    // Si c'est pendant le build, on retourne juste un statut basique sans vérifier l'auth
    if (isBuildTime) {
      return NextResponse.json(
        { 
          connected: true, 
          message: 'Health check endpoint available',
          buildTime: true 
        },
        { status: 200 }
      )
    }
    
    // Vérifier que l'utilisateur est un admin plateforme (seulement en runtime)
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403 }
      )
    }

    // Tester la connexion à N8N
    const status = await testN8NConnection(5000)

    // Toujours retourner 200, même si N8N n'est pas accessible
    // Cela évite de bloquer l'interface utilisateur
    return NextResponse.json(status, {
      status: 200,
    })
  } catch (error) {
    // Ne pas logger d'erreurs pendant le build
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
    if (!isBuildTime) {
      console.error('[N8N Health] Error:', error)
    }
    // Retourner 200 même en cas d'erreur pour ne pas bloquer l'interface
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 200 }
    )
  }
}

