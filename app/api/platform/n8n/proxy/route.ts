import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'
const N8N_USERNAME = process.env.N8N_BASIC_AUTH_USER
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD

/**
 * Route API proxy pour N8N avec authentification automatique
 * Accessible uniquement aux utilisateurs de la plateforme
 */
export async function GET(request: NextRequest) {
  // Récupérer l'ID utilisateur depuis les query params si disponible
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  // Vérifier que l'utilisateur est de la plateforme
  // Passer l'ID utilisateur si disponible pour faciliter l'authentification
  const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
  
  if (!isPlatform || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Plateforme uniquement', details: error },
      { status: 403 }
    )
  }

  // Vérifier que les identifiants N8N sont configurés
  if (!N8N_USERNAME || !N8N_PASSWORD) {
    console.error('N8N credentials not configured')
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  // Récupérer le chemin demandé depuis les query params
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''
  const fullPath = path ? `/${path}` : ''

  // Construire l'URL N8N complète
  const n8nUrl = `${N8N_URL}${fullPath}${request.url.includes('?') ? '&' : '?'}${searchParams.toString().replace('path=', '')}`
  
  // Créer l'en-tête d'authentification basique
  const auth = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString('base64')
  
  try {
    // Faire la requête vers N8N avec authentification
    const response = await fetch(n8nUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9',
      },
    })

    // Récupérer le contenu
    const contentType = response.headers.get('content-type') || 'text/html'
    const data = await response.text()

    // Retourner la réponse avec les headers appropriés
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
 * Proxy pour les requêtes POST (webhooks, etc.)
 */
export async function POST(request: NextRequest) {
  // Récupérer l'ID utilisateur depuis les query params ou le body si disponible
  const { searchParams } = new URL(request.url)
  let userId = searchParams.get('userId')
  
  // Essayer aussi depuis le body
  if (!userId) {
    try {
      const body = await request.clone().json()
      userId = body.userId
    } catch {
      // Body n'est pas JSON ou vide
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

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''
  const fullPath = path ? `/${path}` : ''
  const n8nUrl = `${N8N_URL}${fullPath}`
  
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

