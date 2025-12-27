import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkMakeConfig, proxyMakeRequest } from '@/lib/services/make'

const MAKE_URL = process.env.NEXT_PUBLIC_MAKE_URL || process.env.MAKE_URL || 'https://eu1.make.com/organization/5837397/dashboard'

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
  
  // Vérifier que l'utilisateur est un admin plateforme
  const { isPlatform, error } = await verifyPlatformUser(request)
  
  if (!isPlatform || error) {
    console.log('[Make API Proxy] Unauthorized:', error)
    return NextResponse.json(
      { error: 'Unauthorized - Platform admin access required', details: error },
      { status: 403 }
    )
  }

  // Vérifier la configuration Make
  const configCheck = checkMakeConfig()
  if (!configCheck.valid) {
    console.error('[Make API Proxy] Invalid Make config:', configCheck.error)
    return NextResponse.json(
      { error: 'Configuration Make invalide', details: configCheck.error },
      { status: 500 }
    )
  }

  // Construire l'URL Make
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
  
  // Extraire les cookies de session Make
  const requestCookies = request.headers.get('cookie') || ''
  const cookieCount = requestCookies ? requestCookies.split(';').length : 0
  console.log('[Make API Proxy] Cookies:', cookieCount, 'cookies')
  
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
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
    
    // Transmettre les cookies Set-Cookie de Make
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      console.log('[Make API Proxy] Setting', setCookieHeaders.length, 'cookies')
      setCookieHeaders.forEach(cookie => {
        nextResponse.headers.append('Set-Cookie', cookie)
      })
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
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth-Token, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

