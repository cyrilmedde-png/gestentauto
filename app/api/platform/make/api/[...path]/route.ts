import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkMakeConfig, proxyMakeRequest } from '@/lib/services/make'

const MAKE_URL = process.env.NEXT_PUBLIC_MAKE_URL || process.env.MAKE_URL || 'https://www.make.com/en/login'

/**
 * Fonction pour créer les headers CORS
 */
function getCorsHeaders(origin?: string | null): HeadersInit {
  const allowedOrigin = origin || 'https://www.talosprimes.com'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth-Token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  }
}

/**
 * Route catch-all pour /api/platform/make/api/*
 * Fait directement le proxy vers Make.com pour éviter les 404
 * Cette route gère les requêtes que Make.com fait directement vers /api/platform/make/api/*
 */
async function handleRequest(
  request: NextRequest,
  method: string,
  params: Promise<{ path: string[] }>
) {
  const resolvedParams = await params
  const makePath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/api/${resolvedParams.path.join('/')}` 
    : '/api'
  
  console.log('[Make API Proxy] ========== Request received ==========')
  console.log('[Make API Proxy] Method:', method)
  console.log('[Make API Proxy] Path:', makePath)
  console.log('[Make API Proxy] Full URL:', request.url)
  
  // Construire l'URL Make AVANT toute vérification pour déterminer si c'est une page publique
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  
  let makeUrl: string
  try {
    const makeUrlObj = new URL(MAKE_URL)
    makeUrl = `${makeUrlObj.origin}${makePath}${queryString ? `?${queryString}` : ''}`
    console.log('[Make API Proxy] Proxying to Make URL:', makeUrl)
  } catch (error) {
    console.error('[Make API Proxy] Error building URL:', error)
    makeUrl = `${MAKE_URL}${makePath}${queryString ? `?${queryString}` : ''}`
  }
  
  // Vérifier si c'est une page publique Make.com (détection améliorée)
  // Pour les routes API, on considère qu'elles sont publiques si MAKE_URL pointe vers une page publique
  // Vérifier d'abord MAKE_URL lui-même, puis makeUrl
  const isMakeUrlBasePublic = MAKE_URL.includes('www.make.com/en') || 
                              MAKE_URL.includes('make.com/en') ||
                              MAKE_URL.includes('/en/login') ||
                              MAKE_URL.includes('/en/signup') ||
                              MAKE_URL.includes('/en/')
  
  const isMakeUrlPathPublic = makeUrl.includes('www.make.com/en') || 
                              makeUrl.includes('make.com/en') ||
                              makeUrl.includes('/en/login') ||
                              makeUrl.includes('/en/signup') ||
                              makeUrl.includes('/en/')
  
  const isPublicPage = isMakeUrlBasePublic || isMakeUrlPathPublic
  
  console.log('[Make API Proxy] makeUrl:', makeUrl)
  console.log('[Make API Proxy] MAKE_URL:', MAKE_URL)
  console.log('[Make API Proxy] isMakeUrlBasePublic:', isMakeUrlBasePublic)
  console.log('[Make API Proxy] isMakeUrlPathPublic:', isMakeUrlPathPublic)
  console.log('[Make API Proxy] isPublicPage:', isPublicPage)
  
  // Pour les pages publiques, ne pas vérifier l'authentification (permet de tester)
  if (!isPublicPage) {
    console.log('[Make API Proxy] Page privée détectée - vérification de l\'authentification...')
    const { isPlatform, error } = await verifyPlatformUser(request)
    console.log('[Make API Proxy] Platform user verification result:', { isPlatform, error })
    
    if (!isPlatform || error) {
      console.log('[Make API Proxy] Unauthorized:', error)
      // Si c'est une erreur d'authentification (pas de session), retourner 401 au lieu de 403
      if (error?.includes('Not authenticated') || error?.includes('Please log in')) {
        return NextResponse.json(
          { error: 'Authentication required. Please log in.', details: error },
          { status: 401, headers: getCorsHeaders(request.headers.get('origin')) }
        )
      }
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }
  } else {
    console.log('[Make API Proxy] ✅ Page publique détectée - vérification d\'authentification ignorée pour test')
  }

  // Vérifier la configuration Make
  const configCheck = checkMakeConfig()
  if (!configCheck.valid) {
    console.error('[Make API Proxy] Invalid Make config:', configCheck.error)
    return NextResponse.json(
      { error: 'Configuration Make invalide', details: configCheck.error },
      { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
    )
  }
  
  // Pour les pages publiques Make.com, ne pas envoyer de cookies de session
  // Les cookies de notre application ne sont pas valides pour Make.com
  const requestCookies = isPublicPage ? undefined : (request.headers.get('cookie') || '')
  
  if (isPublicPage) {
    console.log('[Make API Proxy] Public page detected - not sending cookies')
  } else {
    const cookieCount = requestCookies ? requestCookies.split(';').length : 0
    console.log('[Make API Proxy] Cookies:', cookieCount, 'cookies')
  }
  
  try {
    const body = method !== 'GET' && method !== 'HEAD' 
      ? await request.text() 
      : undefined
    
    if (body) {
      console.log('[Make API Proxy] Request body length:', body.length)
    }
    
    const response = await proxyMakeRequest(makeUrl, {
      method: method as any,
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9',
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body: body,
    }, requestCookies || undefined)

    console.log('[Make API Proxy] Response status:', response.status, response.statusText)
    
    const contentType = response.headers.get('content-type') || 'application/json'
    const data = await response.text()
    
    console.log('[Make API Proxy] Response data length:', data.length)
    
    const nextResponse = new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...getCorsHeaders(request.headers.get('origin')),
      },
    })
    
    // Filtrer et transmettre uniquement les cookies Set-Cookie compatibles avec notre domaine
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      const filteredSetCookieHeaders = setCookieHeaders.filter(cookie => {
        const domainMatch = cookie.match(/Domain=([^;]+)/i)
        if (domainMatch) {
          const domain = domainMatch[1].toLowerCase()
          if (domain.includes('.make.com')) {
            console.log(`[Make API Proxy] 🚫 Filtering Set-Cookie with incompatible domain: ${cookie}`)
            return false
          }
        }
        return true
      })
      
      if (filteredSetCookieHeaders.length > 0) {
        console.log('[Make API Proxy] Setting', filteredSetCookieHeaders.length, 'filtered cookies (out of', setCookieHeaders.length, 'total)')
        filteredSetCookieHeaders.forEach(cookie => {
          nextResponse.headers.append('Set-Cookie', cookie)
        })
      } else {
        console.log('[Make API Proxy] All cookies filtered out (incompatible domains)')
      }
    }
    
    return nextResponse
  } catch (error) {
    console.error('[Make API Proxy] Error:', error)
    console.error('[Make API Proxy] Error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      makeUrl,
      makePath,
    })
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à Make.com',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        url: makeUrl,
      },
      { status: 503 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, 'GET', params)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, 'POST', params)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, 'PUT', params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, 'PATCH', params)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, 'DELETE', params)
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request.headers.get('origin')),
  })
}



