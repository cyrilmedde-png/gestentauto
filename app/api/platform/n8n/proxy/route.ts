import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'
const N8N_USERNAME = process.env.N8N_BASIC_AUTH_USER
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD

/**
 * Route API proxy pour la racine N8N (sans chemin)
 * Gère les requêtes vers /api/platform/n8n/proxy
 * Redirige vers N8N avec authentification automatique
 */
export async function GET(request: NextRequest) {
  // Récupérer l'ID utilisateur depuis les query params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  // Log pour déboguer
  console.log('[N8N Proxy Root] Request:', {
    url: request.url,
    userId: userId,
    hasCookies: !!request.headers.get('cookie'),
  })
  
  // Vérifier que l'utilisateur est de la plateforme
  // Si userId n'est pas dans query params, verifyPlatformUser essaiera de le récupérer depuis les cookies
  const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
  
  if (!isPlatform || error) {
    console.error('[N8N Proxy Root] Auth failed:', {
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

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  // Construire l'URL N8N (racine)
  const queryString = searchParams.toString()
    .replace(/userId=[^&]*&?/g, '')
    .replace(/&$/, '')
  const n8nUrl = `${N8N_URL}/${queryString ? `?${queryString}` : ''}`
  
  // Créer l'en-tête d'authentification basique
  const auth = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString('base64')
  
  try {
    const response = await fetch(n8nUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
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
      
      // Remplacer les URLs relatives par des URLs proxy
      const modifiedHtml = htmlData.replace(
        /(src|href|action)=["']([^"']+)["']/g,
        (match, attr, url) => {
          // Ignorer les URLs absolues externes
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('#')) {
            return match
          }
          
          // Si l'URL commence par /, la faire passer par le proxy
          if (url.startsWith('/')) {
            const cleanPath = url.substring(1)
            return `${attr}="${baseUrl}${proxyBase}/${cleanPath}${userIdParam}"`
          }
          
          // URLs relatives - utiliser le proxy racine
          return `${attr}="${baseUrl}${proxyBase}/${url}${userIdParam}"`
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
    console.error('Error proxying N8N request:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request to N8N' },
      { status: 500 }
    )
  }
}

/**
 * Proxy pour les requêtes POST (webhooks, API calls, etc.)
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
  
  if (!isPlatform || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Plateforme uniquement', details: error },
      { status: 403 }
    )
  }

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  const n8nUrl = `${N8N_URL}/`
  const auth = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString('base64')
  const body = await request.text()
  
  try {
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
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
    console.error('Error proxying N8N POST request:', error)
    return NextResponse.json(
      { error: 'Failed to proxy request to N8N' },
      { status: 500 }
    )
  }
}

