import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
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
  // Récupérer l'ID utilisateur depuis les cookies (n8n_userId ou session)
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, ...valueParts] = cookie.trim().split('=')
    if (key && valueParts.length > 0) {
      acc[key.trim()] = decodeURIComponent(valueParts.join('='))
    }
    return acc
  }, {} as Record<string, string>)
  
  const userId = cookies['n8n_userId'] || request.headers.get('X-User-Id')
  
  // Vérifier que l'utilisateur est de la plateforme
  const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
  
  if (!isPlatform || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Plateforme uniquement', details: error },
      { status: 403 }
    )
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

  // Construire le chemin N8N
  const resolvedParams = await params
  const assetPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? resolvedParams.path.join('/')
    : ''
  
  const n8nUrl = `${N8N_URL}/assets/${assetPath}`
  
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
    console.error('[N8N /assets] Error proxying N8N asset:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: 'Échec de la récupération de l\'asset N8N',
        details: errorMessage,
        hint: 'Vérifiez que N8N est démarré et accessible'
      },
      { status: 503 }
    )
  }
}

