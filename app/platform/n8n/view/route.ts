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
  // Vérifier que l'utilisateur est de la plateforme
  const { isPlatform, error } = await verifyPlatformUser(request)
  
  if (!isPlatform || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Plateforme uniquement' },
      { status: 403 }
    )
  }

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return NextResponse.json(
      { error: 'N8N authentication not configured' },
      { status: 500 }
    )
  }

  // Créer une page HTML qui charge N8N via le proxy avec authentification
  // Le proxy gère l'authentification basique automatiquement
  const proxyBaseUrl = '/api/platform/n8n/proxy'
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>N8N - Automatisation</title>
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
    src="${proxyBaseUrl}?path="
    style="display: none;"
    allow="clipboard-read; clipboard-write"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
    onload="document.getElementById('loading').style.display='none'; this.style.display='block';"
    onerror="document.getElementById('loading').textContent='Erreur lors du chargement de N8N';"
  ></iframe>
</body>
</html>
  `

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

