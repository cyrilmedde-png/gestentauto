import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, proxyN8NRequest } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route pour intercepter les requêtes vers /assets/* depuis N8N
 * Proxy vers N8N avec authentification plateforme
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const assetPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? resolvedParams.path.join('/')
    : ''
  
  // Pour certains assets publics, permettre l'accès sans auth
  const publicAssets = ['favicon.ico', 'logo.png', 'icon.svg']
  const isPublicAsset = publicAssets.some(asset => assetPath.includes(asset))
  
  if (!isPublicAsset) {
    // Vérifier que l'utilisateur est un admin plateforme
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403 }
      )
    }
  }

  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration N8N invalide', details: configCheck.error },
      { status: 500 }
    )
  }

  const n8nUrl = `${N8N_URL}/assets/${assetPath}`
  const requestCookies = request.headers.get('cookie') || ''
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
      },
    }, requestCookies || undefined)

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
    console.error('[N8N /assets] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return new NextResponse(null, { status: 404 })
    }
    
    return NextResponse.json(
      { 
        error: 'Échec de la récupération de l\'asset N8N',
        details: errorMessage,
      },
      { status: 503 }
    )
  }
}





