import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, getN8NAuthHeaders, proxyN8NRequest } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route API proxy catch-all pour N8N avec authentification automatique
 * Capture tous les chemins : /api/platform/n8n/proxy/assets/... /api/platform/n8n/proxy/api/... etc.
 * Accessible uniquement aux utilisateurs de la plateforme
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Récupérer l'ID utilisateur depuis les query params
  const { searchParams } = new URL(request.url)
  let userId = searchParams.get('userId')
  
  // Nettoyer le userId de manière robuste
  if (userId) {
    const originalUserId = userId
    // Nettoyer les query params, fragments et caractères invalides
    userId = userId.split('?')[0].split('&')[0].split('#')[0].trim()
    // Vérifier format UUID basique
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      console.error('[N8N Proxy Catch-all] Invalid UUID format:', { original: originalUserId, cleaned: userId })
      userId = null
    } else if (originalUserId !== userId) {
      console.log('[N8N Proxy Catch-all] Cleaned userId:', { original: originalUserId, cleaned: userId })
    }
  }
  
  // Log pour déboguer
  console.log('[N8N Proxy Catch-all] Request:', {
    url: request.url,
    userId: userId,
    hasCookies: !!request.headers.get('cookie'),
    path: (await params).path,
  })
  
  // Vérifier que l'utilisateur est de la plateforme
  // Si userId n'est pas dans query params, verifyPlatformUser essaiera de le récupérer depuis les cookies
  const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
  
  if (!isPlatform || error) {
    console.error('[N8N Proxy Catch-all] Auth failed:', {
      isPlatform,
      error,
      userId,
      hasCookies: !!request.headers.get('cookie'),
      url: request.url,
    })
    return NextResponse.json(
      { error: 'Unauthorized - Plateforme uniquement', details: error },
      { status: 403 }
    )
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error('[N8N Proxy Catch-all] Configuration invalide:', configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error,
        hint: 'Vérifiez que N8N_URL, N8N_BASIC_AUTH_USER et N8N_BASIC_AUTH_PASSWORD sont configurés'
      },
      { status: 500 }
    )
  }

  // Attendre les params (Next.js 16)
  const resolvedParams = await params

  // Construire le chemin N8N depuis les paramètres de route
  const n8nPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/${resolvedParams.path.join('/')}` 
    : '/'
  
  // Construire l'URL N8N complète (enlever userId des query params)
  const queryString = searchParams.toString()
    .replace(/userId=[^&]*&?/g, '')
    .replace(/&$/, '')
  const n8nUrl = `${N8N_URL}${n8nPath}${queryString ? `?${queryString}` : ''}`
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9',
      },
    })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // Pour le HTML, on doit réécrire les URLs. Pour les autres, on peut utiliser arrayBuffer
    if (contentType.includes('text/html')) {
      const htmlData = await response.text()
      
      // Utiliser le domaine public depuis les headers
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const baseUrl = host 
        ? `${protocol}://${host}`
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com')
      
      const proxyBase = `/api/platform/n8n/proxy`
      const userIdParam = userId ? `?userId=${encodeURIComponent(userId)}` : ''
      
      // Remplacer les URLs par des URLs proxy
      const modifiedHtml = htmlData.replace(
        /(src|href|action)=["']([^"']+)["']/g,
        (match, attr, url) => {
          // Ignorer les URLs data:, mailto:, #, et externes (autres domaines)
          if (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('#')) {
            return match
          }
          
          // URLs absolues vers le même domaine ou vers N8N - les réécrire pour passer par le proxy
          if (url.startsWith('http://') || url.startsWith('https://')) {
            try {
              const urlObj = new URL(url)
              const currentHost = host || new URL(baseUrl).hostname
              const n8nHost = new URL(N8N_URL).hostname
              
              // Si c'est le même domaine, le domaine N8N, ou un sous-domaine talosprimes, réécrire pour passer par le proxy
              if (urlObj.hostname === currentHost || 
                  urlObj.hostname === n8nHost || 
                  urlObj.hostname === 'www.talosprimes.com' || 
                  urlObj.hostname === 'talosprimes.com' ||
                  urlObj.hostname.endsWith('.talosprimes.com')) {
                const path = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname
                return `${attr}="${baseUrl}${proxyBase}/${path}${urlObj.search}${userIdParam ? (urlObj.search ? '&' : '?') + userIdParam.substring(1) : ''}"`
              }
              // Sinon, c'est un domaine externe, laisser tel quel
              return match
            } catch {
              // Si l'URL est invalide, laisser tel quel
              return match
            }
          }
          
          // Si l'URL commence par /, la faire passer par le proxy
          if (url.startsWith('/')) {
            const cleanPath = url.substring(1)
            return `${attr}="${baseUrl}${proxyBase}/${cleanPath}${userIdParam}"`
          }
          
          // URLs relatives - construire le chemin complet
          const currentPath = resolvedParams.path && resolvedParams.path.length > 0 ? resolvedParams.path.join('/') : ''
          const relativePath = currentPath ? `${currentPath}/${url}` : url
          return `${attr}="${baseUrl}${proxyBase}/${relativePath}${userIdParam}"`
        }
      )
      
      return new NextResponse(modifiedHtml, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } else {
      // Pour les autres types (JS, CSS, images, etc.), utiliser arrayBuffer
      const data = await response.arrayBuffer()

      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': contentType.includes('javascript') || contentType.includes('css')
            ? 'public, max-age=31536000, immutable'
            : 'no-cache, no-store, must-revalidate',
        },
      })
    }
  } catch (error) {
    console.error('[N8N Proxy Catch-all] Error proxying N8N request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: errorMessage,
        hint: 'Vérifiez que N8N est démarré et accessible à l\'adresse ' + N8N_URL
      },
      { status: 503 }
    )
  }
}

/**
 * Proxy pour les requêtes POST (webhooks, API calls, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
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
    console.error('[N8N Proxy Catch-all POST] Configuration invalide:', configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error
      },
      { status: 500 }
    )
  }

  // Attendre les params (Next.js 16)
  const resolvedParams = await params

  const n8nPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/${resolvedParams.path.join('/')}` 
    : '/'
  const n8nUrl = `${N8N_URL}${n8nPath}`
  
  const body = await request.text()
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
      },
      body: body,
    })

    const contentType = response.headers.get('content-type') || 'application/json'
    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    })
  } catch (error) {
    console.error('[N8N Proxy Catch-all POST] Error proxying N8N request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: errorMessage,
        hint: 'Vérifiez que N8N est démarré et accessible'
      },
      { status: 503 }
    )
  }
}

