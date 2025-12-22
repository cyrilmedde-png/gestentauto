import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'
const N8N_USERNAME = process.env.N8N_BASIC_AUTH_USER
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD

/**
 * Route API proxy catch-all pour N8N avec authentification automatique
 * Capture tous les chemins : /api/platform/n8n/proxy/assets/... /api/platform/n8n/proxy/api/... etc.
 * Accessible uniquement aux utilisateurs de la plateforme
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Récupérer l'ID utilisateur depuis les query params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  // Vérifier que l'utilisateur est de la plateforme
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

  // Construire le chemin N8N depuis les paramètres de route
  const n8nPath = params.path && params.path.length > 0 
    ? `/${params.path.join('/')}` 
    : '/'
  
  // Construire l'URL N8N complète (enlever userId des query params)
  const queryString = searchParams.toString()
    .replace(/userId=[^&]*&?/g, '')
    .replace(/&$/, '')
  const n8nUrl = `${N8N_URL}${n8nPath}${queryString ? `?${queryString}` : ''}`
  
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
    const data = await response.arrayBuffer()

    // Retourner la réponse avec les headers appropriés
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': contentType.includes('javascript') || contentType.includes('css')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache, no-store, must-revalidate',
      },
    })
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
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
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

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  const n8nPath = params.path && params.path.length > 0 
    ? `/${params.path.join('/')}` 
    : '/'
  const n8nUrl = `${N8N_URL}${n8nPath}`
  
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

