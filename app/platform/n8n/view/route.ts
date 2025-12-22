import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'
const N8N_USERNAME = process.env.N8N_BASIC_AUTH_USER
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD

/**
 * Route qui sert une page HTML avec authentification automatique pour N8N
 * Cette page charge N8N dans un iframe avec authentification basique automatique
 */
export async function GET(request: NextRequest) {
  // Récupérer l'ID utilisateur depuis les query params (passé par la page client)
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  try {
    // Log pour debug
    console.log('[N8N View] UserId from params:', userId)
    console.log('[N8N View] Cookies:', request.headers.get('cookie'))
    
    // Vérifier que l'utilisateur est de la plateforme
    // Passer l'ID utilisateur si disponible
    const { isPlatform, error } = await verifyPlatformUser(request, userId || undefined)
    
    console.log('[N8N View] Auth result:', { isPlatform, error, userId })
    
    if (!isPlatform || error) {
      // Si l'authentification échoue, retourner une page HTML avec erreur détaillée
      const errorHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erreur - N8N</title>
  <style>
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000;
      color: #fff;
    }
    .error {
      text-align: center;
      padding: 20px;
      max-width: 600px;
    }
    .debug {
      margin-top: 20px;
      padding: 10px;
      background: #222;
      border-radius: 4px;
      font-size: 11px;
      text-align: left;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>Erreur d'authentification</h1>
    <p>Vous devez être un utilisateur de la plateforme pour accéder à N8N.</p>
    <p style="color: #888; font-size: 12px;">${error || 'Non autorisé'}</p>
    <div class="debug">
      <strong>Debug info:</strong><br>
      UserId: ${userId || 'Non fourni'}<br>
      Error: ${error || 'Aucune erreur détaillée'}
    </div>
  </div>
</body>
</html>
      `
      return new NextResponse(errorHtml, {
        status: 403,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
  } catch (err) {
    console.error('[N8N View] Error:', err)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  // Créer une page HTML qui charge N8N via le proxy
  // Le base href pointe vers le proxy, les cookies de session seront utilisés pour l'auth
  const proxyBaseUrl = `/api/platform/n8n/proxy`
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>N8N - Automatisation</title>
  <base href="${proxyBaseUrl}/">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }
    #n8n-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="loading" id="loading">Chargement de N8N...</div>
  <iframe 
    id="n8n-iframe"
    src="${proxyBaseUrl}"
    style="display: none;"
    allow="clipboard-read; clipboard-write"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
    onload="document.getElementById('loading').style.display='none'; this.style.display='block';"
    onerror="document.getElementById('loading').textContent='Erreur lors du chargement de N8N';"
  ></iframe>
</body>
</html>
  `

  // Créer la réponse avec le cookie n8n_userId si disponible
  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })

  // Ajouter un cookie pour le userId si disponible (pour les requêtes des assets)
  // Ce cookie sera utilisé par verifyPlatformUser si les cookies de session ne sont pas transmis
  if (userId) {
    response.cookies.set('n8n_userId', userId, {
      httpOnly: false, // Accessible depuis JS si nécessaire
      secure: true,
      sameSite: 'none', // Permet la transmission dans l'iframe
      path: '/',
      maxAge: 60 * 60, // 1 heure
    })
  }

  return response
}

