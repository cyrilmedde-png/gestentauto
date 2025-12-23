import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, proxyN8NRequest } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route pour intercepter les requêtes vers /rest/* depuis N8N
 * Proxy vers N8N avec authentification plateforme
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const restPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? resolvedParams.path.join('/')
    : ''
  
  // Pour /rest/login, on permet l'accès sans vérification (N8N gère sa propre auth)
  const isLoginRoute = restPath === 'login'
  
  if (!isLoginRoute) {
    // Vérifier que l'utilisateur est un admin plateforme
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      const publicRestRoutes = ['login', 'owner', 'settings']
      if (publicRestRoutes.includes(restPath)) {
        // Permettre les routes publiques
      } else {
        return NextResponse.json(
          { error: 'Unauthorized - Platform admin access required', details: error },
          { status: 403 }
        )
      }
    }
  }

  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration N8N invalide', details: configCheck.error },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const n8nUrl = `${N8N_URL}/rest/${restPath}${queryString ? `?${queryString}` : ''}`
  const requestCookies = request.headers.get('cookie') || ''

  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || 'application/json',
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
    }, requestCookies || undefined)
    
    // Pour /rest/login GET, transformer 401 en 200 (normal si pas de session)
    if (isLoginRoute && response.status === 401) {
      const contentType = response.headers.get('content-type') || 'application/json'
      const data = await response.text()
      
      const nextResponse = new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
      
      // Transmettre les cookies Set-Cookie de N8N
      const setCookieHeaders = response.headers.getSetCookie()
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          const [nameValue] = cookie.split(';')
          const [name, ...valueParts] = nameValue.split('=')
          if (name && valueParts.length > 0) {
            const value = valueParts.join('=')
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
            const domainMatch = cookie.match(/Domain=([^;]+)/)
            if (domainMatch) options.domain = domainMatch[1]
            
            nextResponse.cookies.set(name.trim(), value, options)
          }
        })
      }
      
      return nextResponse
    }

    const contentType = response.headers.get('content-type') || 'application/json'
    const data = await response.text()

    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
    
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
          const domainMatch = cookie.match(/Domain=([^;]+)/)
          if (domainMatch) options.domain = domainMatch[1]
          
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
    console.error('[N8N /rest] Error:', error)
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 503 }
    )
  }
}

/**
 * POST, PUT, PATCH, DELETE pour /rest/*
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
  const resolvedParams = await params
  const restPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? resolvedParams.path.join('/')
    : ''
  
  const isLoginRoute = restPath === 'login'
  
  if (!isLoginRoute) {
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      const publicRestRoutes = ['login', 'owner', 'settings']
      if (publicRestRoutes.includes(restPath)) {
        // Permettre les routes publiques
      } else {
        return NextResponse.json(
          { error: 'Unauthorized - Platform admin access required', details: error },
          { status: 403 }
        )
      }
    }
  }

  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration N8N invalide', details: configCheck.error },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const n8nUrl = `${N8N_URL}/rest/${restPath}${queryString ? `?${queryString}` : ''}`
  const body = await request.text()
  const requestCookies = request.headers.get('cookie') || ''
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || 'application/json',
      },
      body: body,
    }, requestCookies || undefined)
    
    const contentType = response.headers.get('content-type') || 'application/json'
    const data = await response.text()
    
    const nextResponse = new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
    
    // Transmettre les cookies Set-Cookie de N8N
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        const [nameValue] = cookie.split(';')
        const [name, ...valueParts] = nameValue.split('=')
        if (name && valueParts.length > 0) {
          const value = valueParts.join('=')
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
          const domainMatch = cookie.match(/Domain=([^;]+)/)
          if (domainMatch) options.domain = domainMatch[1]
          
          nextResponse.cookies.set(name.trim(), value, options)
        }
      })
    }
    
    return nextResponse
  } catch (error) {
    console.error(`[N8N /rest ${method}] Error:`, error)
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 503 }
    )
  }
}

