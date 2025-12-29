import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, proxyN8NRequest } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

function getCorsHeaders(origin?: string | null): HeadersInit {
  const allowedOrigin = origin || 'https://www.talosprimes.com'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth-Token',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin')),
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { isPlatform, error } = await verifyPlatformUser(request)
  
  if (!isPlatform || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Platform admin access required', details: error },
      { 
        status: 403,
        headers: getCorsHeaders(request.headers.get('origin')),
      }
    )
  }

  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration N8N invalide', details: configCheck.error },
      { 
        status: 500,
        headers: getCorsHeaders(request.headers.get('origin')),
      }
    )
  }

  const resolvedParams = await params
  const iconsPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? resolvedParams.path.join('/')
    : ''
  
  const n8nUrl = `${N8N_URL}/icons/${iconsPath}`
  const requestCookies = request.headers.get('cookie') || ''
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
      },
    }, requestCookies || undefined)
    
    const contentType = response.headers.get('content-type') || 'image/svg+xml'
    const data = await response.arrayBuffer()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...getCorsHeaders(request.headers.get('origin')),
      },
    })
  } catch (error) {
    console.error('[N8N /icons] Error:', error)
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { 
        status: 503,
        headers: getCorsHeaders(request.headers.get('origin')),
      }
    )
  }
}






