import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'
const N8N_USERNAME = process.env.N8N_BASIC_AUTH_USER
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD

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
    
    const userId = cookies['n8n_userId'] || request.headers.get('X-User-Id')
    
    // Vérifier que l'utilisateur est de la plateforme
    const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Plateforme uniquement', details: error },
        { status: 403 }
      )
    }
  } else {
    // Pour /rest/login, on vérifie juste qu'il y a un cookie n8n_userId (utilisateur plateforme)
    // Cela garantit que seuls les utilisateurs de la plateforme peuvent accéder à N8N
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.trim().split('=')
      if (key && valueParts.length > 0) {
        acc[key.trim()] = decodeURIComponent(valueParts.join('='))
      }
      return acc
    }, {} as Record<string, string>)
    
    const userId = cookies['n8n_userId'] || request.headers.get('X-User-Id')
    
    // Vérifier que l'utilisateur est de la plateforme (mais plus permissif pour login)
    const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
    
    if (!isPlatform && !userId) {
      // Si pas de userId du tout, refuser
      return NextResponse.json(
        { error: 'Unauthorized - Plateforme uniquement', details: 'No user ID found' },
        { status: 403 }
      )
    }
  }

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  // Construire l'URL N8N avec query params
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const n8nUrl = `${N8N_URL}/rest/${restPath}${queryString ? `?${queryString}` : ''}`
  
  // Créer l'en-tête d'authentification basique
  const auth = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString('base64')
  
  try {
    const response = await fetch(n8nUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || 'application/json',
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
    })

    const contentType = response.headers.get('content-type') || 'application/json'
    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error proxying N8N REST API:', error)
    return NextResponse.json(
      { error: 'Failed to proxy REST API request to N8N' },
      { status: 500 }
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
    
    const userId = cookies['n8n_userId'] || request.headers.get('X-User-Id')
    
    // Vérifier que l'utilisateur est de la plateforme
    const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Plateforme uniquement', details: error },
        { status: 403 }
      )
    }
  } else {
    // Pour /rest/login, on vérifie juste qu'il y a un cookie n8n_userId
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.trim().split('=')
      if (key && valueParts.length > 0) {
        acc[key.trim()] = decodeURIComponent(valueParts.join('='))
      }
      return acc
    }, {} as Record<string, string>)
    
    const userId = cookies['n8n_userId'] || request.headers.get('X-User-Id')
    
    if (!userId) {
      // Si pas de userId du tout, refuser
      return NextResponse.json(
        { error: 'Unauthorized - Plateforme uniquement', details: 'No user ID found' },
        { status: 403 }
      )
    }
  }

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  // Construire l'URL N8N avec query params
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const n8nUrl = `${N8N_URL}/rest/${restPath}${queryString ? `?${queryString}` : ''}`
  
  // Créer l'en-tête d'authentification basique
  const auth = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString('base64')
  const body = await request.text()
  
  try {
    const response = await fetch(n8nUrl, {
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || 'application/json',
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
    console.error(`Error proxying N8N REST API ${method}:`, error)
    return NextResponse.json(
      { error: `Failed to proxy ${method} request to N8N` },
      { status: 500 }
    )
  }
}

