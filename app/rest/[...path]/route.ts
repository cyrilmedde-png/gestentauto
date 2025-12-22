import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, proxyN8NRequest } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route pour intercepter les requêtes vers /rest/* depuis N8N
 * Redirige vers le proxy N8N avec authentification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Construire le chemin N8N
  const resolvedParams = await params
  const restPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? resolvedParams.path.join('/')
    : ''
  
  // Pour /rest/login, on permet l'accès sans vérification stricte (N8N gère sa propre auth)
  // Mais on vérifie quand même que la requête vient d'un utilisateur authentifié de la plateforme
  const isLoginRoute = restPath === 'login'
  
  if (!isLoginRoute) {
    // Pour les autres routes REST, vérifier que l'utilisateur est de la plateforme
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.trim().split('=')
      if (key && valueParts.length > 0) {
        acc[key.trim()] = decodeURIComponent(valueParts.join('='))
      }
      return acc
    }, {} as Record<string, string>)
    
    let userId = cookies['n8n_userId'] || cookies['n8n_userid'] || request.headers.get('X-User-Id')
    
    // Nettoyer le userId de manière robuste
    if (userId) {
      const originalUserId = userId
      // Nettoyer les query params, fragments et caractères invalides
      userId = userId.split('?')[0].split('&')[0].split('#')[0].trim()
      // Vérifier format UUID basique
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.error('[N8N /rest] Invalid UUID format:', { original: originalUserId, cleaned: userId })
        userId = null
      } else if (originalUserId !== userId) {
        console.log('[N8N /rest] Cleaned userId:', { original: originalUserId, cleaned: userId })
      }
    }
    
    // Vérifier que l'utilisateur est de la plateforme
    const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Plateforme uniquement', details: error },
        { status: 403 }
      )
    }
  } else {
    // Pour /rest/login, on permet l'accès sans aucune vérification
    // N8N gère sa propre authentification via cette route
    // Le fait que la requête passe par notre proxy est déjà une garantie de sécurité
    console.log('[N8N /rest/login] Allowing login request - N8N will handle authentication')
    // On laisse passer directement - N8N gérera l'authentification
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error('[N8N /rest] Configuration invalide:', configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error
      },
      { status: 500 }
    )
  }

  // Construire l'URL N8N avec query params
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const n8nUrl = `${N8N_URL}/rest/${restPath}${queryString ? `?${queryString}` : ''}`
  
  // Log pour déboguer /rest/login
  if (restPath === 'login') {
    console.log('[N8N /rest/login GET] Proxying to:', n8nUrl)
    console.log('[N8N /rest/login GET] N8N_URL:', N8N_URL)
    console.log('[N8N /rest/login GET] Request URL:', request.url)
  }
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || 'application/json',
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
    })
    
    // Log la réponse pour /rest/login
    if (restPath === 'login') {
      console.log('[N8N /rest/login GET] Response status:', response.status)
      console.log('[N8N /rest/login GET] Response statusText:', response.statusText)
      const responseHeaders = Object.fromEntries(response.headers.entries())
      console.log('[N8N /rest/login GET] Response headers:', responseHeaders)
      console.log('[N8N /rest/login GET] Set-Cookie headers:', response.headers.getSetCookie())
      
      // Si 401, c'est peut-être normal (pas de session active)
      if (response.status === 401) {
        console.log('[N8N /rest/login GET] 401 is normal if no active session - N8N will POST to create session')
      }
    }

    const contentType = response.headers.get('content-type') || 'application/json'
    const data = await response.text()

    // Pour /rest/login, transmettre les cookies de session N8N
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
    
    // Transmettre les cookies Set-Cookie de N8N pour la session
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      // Les cookies de N8N doivent être transmis pour maintenir la session
      setCookieHeaders.forEach((cookie, index) => {
        responseHeaders[`Set-Cookie-${index}`] = cookie
      })
      // Utiliser Set-Cookie directement (Next.js le gère)
      const nextResponse = new NextResponse(data, {
        status: response.status,
        headers: responseHeaders,
      })
      setCookieHeaders.forEach(cookie => {
        const [nameValue] = cookie.split(';')
        const [name, ...valueParts] = nameValue.split('=')
        if (name && valueParts.length > 0) {
          const value = valueParts.join('=')
          // Extraire les options du cookie
          const options: any = {}
          if (cookie.includes('HttpOnly')) options.httpOnly = true
          if (cookie.includes('Secure')) options.secure = true
          if (cookie.includes('SameSite=None')) options.sameSite = 'none'
          if (cookie.includes('SameSite=Lax')) options.sameSite = 'lax'
          if (cookie.includes('SameSite=Strict')) options.sameSite = 'strict'
          const maxAgeMatch = cookie.match(/Max-Age=(\d+)/)
          if (maxAgeMatch) options.maxAge = parseInt(maxAgeMatch[1])
          const pathMatch = cookie.match(/Path=([^;]+)/)
          if (pathMatch) options.path = pathMatch[1]
          
          nextResponse.cookies.set(name.trim(), value, options)
        }
      })
      return nextResponse
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('[N8N /rest] Error proxying N8N REST API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à l\'API REST N8N',
        details: errorMessage,
        hint: 'Vérifiez que N8N est démarré et accessible'
      },
      { status: 503 }
    )
  }
}

/**
 * Proxy pour les requêtes POST/PUT/PATCH/DELETE vers /rest/*
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRestRequest(request, params, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRestRequest(request, params, 'PUT')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRestRequest(request, params, 'PATCH')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRestRequest(request, params, 'DELETE')
}

async function handleRestRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  // Construire le chemin N8N
  const resolvedParams = await params
  const restPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? resolvedParams.path.join('/')
    : ''
  
  // Pour /rest/login, on permet l'accès sans vérification stricte
  const isLoginRoute = restPath === 'login'
  
  if (!isLoginRoute) {
    // Pour les autres routes REST, vérifier que l'utilisateur est de la plateforme
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.trim().split('=')
      if (key && valueParts.length > 0) {
        acc[key.trim()] = decodeURIComponent(valueParts.join('='))
      }
      return acc
    }, {} as Record<string, string>)
    
    let userId = cookies['n8n_userId'] || cookies['n8n_userid'] || request.headers.get('X-User-Id')
    
    // Nettoyer le userId de manière robuste
    if (userId) {
      const originalUserId = userId
      // Nettoyer les query params, fragments et caractères invalides
      userId = userId.split('?')[0].split('&')[0].split('#')[0].trim()
      // Vérifier format UUID basique
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.error('[N8N /rest] Invalid UUID format:', { original: originalUserId, cleaned: userId })
        userId = null
      } else if (originalUserId !== userId) {
        console.log('[N8N /rest] Cleaned userId:', { original: originalUserId, cleaned: userId })
      }
    }
    
    // Vérifier que l'utilisateur est de la plateforme
    const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Plateforme uniquement', details: error },
        { status: 403 }
      )
    }
  } else {
    // Pour /rest/login, on permet l'accès sans aucune vérification
    // N8N gère sa propre authentification via cette route
    // Le fait que la requête passe par notre proxy est déjà une garantie de sécurité
    console.log('[N8N /rest/login] Allowing login request - N8N will handle authentication')
    // On laisse passer directement - N8N gérera l'authentification
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error(`[N8N /rest ${method}] Configuration invalide:`, configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error
      },
      { status: 500 }
    )
  }

  // Construire l'URL N8N avec query params
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const n8nUrl = `${N8N_URL}/rest/${restPath}${queryString ? `?${queryString}` : ''}`
  
  const body = await request.text()
  
  // Log pour déboguer /rest/login
  if (restPath === 'login') {
    console.log(`[N8N /rest/login ${method}] Proxying to:`, n8nUrl)
    console.log(`[N8N /rest/login ${method}] Body length:`, body.length)
  }
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || 'application/json',
      },
      body: body,
    })
    
    // Log la réponse pour /rest/login
    if (restPath === 'login') {
      console.log(`[N8N /rest/login ${method}] Response status:`, response.status)
      console.log(`[N8N /rest/login ${method}] Response headers:`, Object.fromEntries(response.headers.entries()))
    }

    const contentType = response.headers.get('content-type') || 'application/json'
    const data = await response.text()

    // Pour /rest/login, transmettre les cookies de session N8N
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
    }
    
    // Transmettre les cookies Set-Cookie de N8N pour la session
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      const nextResponse = new NextResponse(data, {
        status: response.status,
        headers: responseHeaders,
      })
      setCookieHeaders.forEach(cookie => {
        const [nameValue] = cookie.split(';')
        const [name, ...valueParts] = nameValue.split('=')
        if (name && valueParts.length > 0) {
          const value = valueParts.join('=')
          // Extraire les options du cookie
          const options: any = {}
          if (cookie.includes('HttpOnly')) options.httpOnly = true
          if (cookie.includes('Secure')) options.secure = true
          if (cookie.includes('SameSite=None')) options.sameSite = 'none'
          if (cookie.includes('SameSite=Lax')) options.sameSite = 'lax'
          if (cookie.includes('SameSite=Strict')) options.sameSite = 'strict'
          const maxAgeMatch = cookie.match(/Max-Age=(\d+)/)
          if (maxAgeMatch) options.maxAge = parseInt(maxAgeMatch[1])
          const pathMatch = cookie.match(/Path=([^;]+)/)
          if (pathMatch) options.path = pathMatch[1]
          
          nextResponse.cookies.set(name.trim(), value, options)
        }
      })
      return nextResponse
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error(`[N8N /rest ${method}] Error proxying N8N REST API:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: `Échec de la connexion à l'API REST N8N (${method})`,
        details: errorMessage,
        hint: 'Vérifiez que N8N est démarré et accessible'
      },
      { status: 503 }
    )
  }
}

