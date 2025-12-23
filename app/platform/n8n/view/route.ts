import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, testN8NConnection } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route qui sert une page HTML avec authentification automatique pour N8N
 * Cette page charge N8N dans un iframe avec authentification basique automatique
 */
export async function GET(request: NextRequest) {
  // NE PAS récupérer userId depuis query params
  // Utiliser uniquement la session Supabase pour identifier l'utilisateur
  // verifyPlatformUser récupérera automatiquement l'utilisateur depuis la session
  
  try {
    // Log pour debug
    console.log('[N8N View] Cookies:', request.headers.get('cookie'))
    console.log('[N8N View] Using session-based authentication (no userId in URL)')
    
    // Vérifier que l'utilisateur est de la plateforme
    // Ne pas passer userId - laisser verifyPlatformUser utiliser uniquement la session Supabase
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    console.log('[N8N View] Auth result:', { isPlatform, error })
    
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
      Error: ${error || 'Aucune erreur détaillée'}<br>
      <small>L'authentification utilise la session Supabase (pas de userId dans l'URL)</small>
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

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    const errorHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erreur - Configuration N8N</title>
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
    .error h1 { color: #ef4444; }
    .error code {
      background: #222;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>Configuration N8N manquante</h1>
    <p>Les variables d'environnement N8N ne sont pas configurées correctement.</p>
    <p style="color: #888; font-size: 12px; margin-top: 20px;">
      ${configCheck.error || 'Vérifiez N8N_URL, N8N_BASIC_AUTH_USER et N8N_BASIC_AUTH_PASSWORD'}
    </p>
  </div>
</body>
</html>
    `
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  }

  // Tester la connexion à N8N (optionnel, mais utile pour le débogage)
  const connectionStatus = await testN8NConnection(3000)
  if (!connectionStatus.connected) {
    console.warn('[N8N View] N8N connection test failed:', connectionStatus.error)
    // On continue quand même car cela peut être un problème temporaire
  }

  // Créer une page HTML qui charge N8N via le proxy
  // Le base href pointe vers le proxy, les cookies de session seront utilisés pour l'auth
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = host 
    ? `${protocol}://${host}`
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com')
  
  const proxyBaseUrl = `/api/platform/n8n/proxy`
  const fullProxyBaseUrl = `${baseUrl}${proxyBaseUrl}`
  
  // Ne pas passer userId dans l'URL - utiliser uniquement la session Supabase
  const iframeSrc = proxyBaseUrl
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>N8N - Automatisation</title>
  <base href="${fullProxyBaseUrl}/">
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
    src="${iframeSrc}"
    style="display: none;"
    allow="clipboard-read; clipboard-write"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
    onload="document.getElementById('loading').style.display='none'; this.style.display='block';"
    onerror="document.getElementById('loading').textContent='Erreur lors du chargement de N8N';"
  ></iframe>
</body>
</html>
  `

  // Créer la réponse - utiliser uniquement la session Supabase (pas de cookie n8n_userId)
  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })

  // Ne pas créer de cookie n8n_userId
  // verifyPlatformUser utilisera uniquement la session Supabase pour identifier l'utilisateur
  // puis vérifiera si son company_id correspond au platform_company_id

  return response
}

