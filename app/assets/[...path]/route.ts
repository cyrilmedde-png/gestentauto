import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticatedUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, proxyN8NRequest } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route pour intercepter les requêtes vers /assets/* depuis N8N
 * Redirige vers le proxy N8N avec authentification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Construire le chemin N8N
  const resolvedParams = await params
  const assetPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? resolvedParams.path.join('/')
    : ''
  
  // Pour certains assets publics (comme les icônes, logos), permettre l'accès sans auth
  // Mais pour la plupart des assets, l'authentification est requise
  const publicAssets = ['favicon.ico', 'logo.png', 'icon.svg']
  const isPublicAsset = publicAssets.some(asset => assetPath.includes(asset))
  
  if (!isPublicAsset) {
    // Vérifier que l'utilisateur est authentifié (plateforme ou client)
    // Utiliser uniquement la session Supabase (pas de n8n_userId)
    const { isAuthenticated, error } = await verifyAuthenticatedUser(request)
    
    if (!isAuthenticated || error) {
      console.error('[N8N /assets] Auth failed:', {
        isAuthenticated,
        error,
        assetPath,
        hasCookies: !!request.headers.get('cookie'),
        hasAuthHeader: !!request.headers.get('authorization'),
        hasXAuthToken: !!request.headers.get('x-supabase-auth-token'),
        url: request.url,
      })
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required', details: error },
        { status: 403 }
      )
    }
    
    console.log('[N8N /assets] Auth successful:', {
      assetPath,
      hasCookies: !!request.headers.get('cookie'),
    })
  } else {
    console.log('[N8N /assets] Allowing public asset:', assetPath)
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error('[N8N /assets] Configuration invalide:', configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error
      },
      { status: 500 }
    )
  }

  const n8nUrl = `${N8N_URL}/assets/${assetPath}`
  
  console.log('[N8N /assets] Proxying asset:', {
    assetPath,
    n8nUrl,
    requestUrl: request.url,
  })
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
      },
    })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const data = await response.arrayBuffer()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': contentType.includes('javascript') || contentType.includes('css') || contentType.includes('font')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[N8N /assets] Error proxying N8N asset:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      assetPath,
      n8nUrl,
      requestUrl: request.url,
    })
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    // Si c'est une erreur 404, retourner 404 au lieu de 503
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return new NextResponse(null, { status: 404 })
    }
    
    return NextResponse.json(
      { 
        error: 'Échec de la récupération de l\'asset N8N',
        details: errorMessage,
        hint: 'Vérifiez que N8N est démarré et accessible',
        assetPath,
      },
      { status: 503 }
    )
  }
}

