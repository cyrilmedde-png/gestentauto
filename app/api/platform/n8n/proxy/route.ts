import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, getN8NAuthHeaders, proxyN8NRequest } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route API proxy pour la racine N8N (sans chemin)
 * Gère les requêtes vers /api/platform/n8n/proxy
 * Redirige vers N8N avec authentification automatique
 */
export async function GET(request: NextRequest) {
  // NE PAS récupérer userId depuis query params
  // Utiliser uniquement la session Supabase pour identifier l'utilisateur
  // verifyPlatformUser récupérera automatiquement l'utilisateur depuis la session
  
  // Log pour déboguer
  console.log('[N8N Proxy Root] Request:', {
    url: request.url,
    hasCookies: !!request.headers.get('cookie'),
  })
  
  // Vérifier que l'utilisateur est de la plateforme
  // Utiliser uniquement la session Supabase (pas de userId dans query params)
  const { isPlatform, error } = await verifyPlatformUser(request)
  
  if (!isPlatform || error) {
    console.error('[N8N Proxy Root] Auth failed:', {
      isPlatform,
      error,
      hasCookies: !!request.headers.get('cookie'),
      url: request.url,
    })
    return NextResponse.json(
      { error: 'Unauthorized - Plateforme uniquement', details: error },
      { status: 403 }
    )
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error('[N8N Proxy Root] Configuration invalide:', configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error,
        hint: 'Vérifiez que N8N_URL, N8N_BASIC_AUTH_USER et N8N_BASIC_AUTH_PASSWORD sont configurés dans les variables d\'environnement'
      },
      { status: 500 }
    )
  }

  // Construire l'URL N8N (racine)
  const queryString = searchParams.toString()
    .replace(/userId=[^&]*&?/g, '')
    .replace(/&$/, '')
  const n8nUrl = `${N8N_URL}/${queryString ? `?${queryString}` : ''}`
  
  // Obtenir les en-têtes d'authentification
  const authHeaders = getN8NAuthHeaders()
  if (!authHeaders) {
    return NextResponse.json(
      { error: 'Impossible de créer les en-têtes d\'authentification N8N' },
      { status: 500 }
    )
  }
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9',
      },
    })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // Pour le HTML, on doit réécrire les URLs. Pour les autres, on peut utiliser arrayBuffer
    if (contentType.includes('text/html')) {
      const htmlData = await response.text()
      
      // Utiliser le domaine public depuis les headers
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const baseUrl = host 
        ? `${protocol}://${host}`
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com')
      
      const proxyBase = `/api/platform/n8n/proxy`
      // Ne pas passer userId dans les URLs - utiliser uniquement la session Supabase
      
      // Remplacer les URLs par des URLs proxy
      let modifiedHtml = htmlData.replace(
        /(src|href|action)=["']([^"']+)["']/g,
        (match, attr, url) => {
          // Ignorer les URLs data:, mailto:, #, et externes (autres domaines)
          if (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('#')) {
            return match
          }
          
          // URLs absolues vers le même domaine ou vers N8N - les réécrire pour passer par le proxy
          if (url.startsWith('http://') || url.startsWith('https://')) {
            try {
              const urlObj = new URL(url)
              const currentHost = host || new URL(baseUrl).hostname
              const n8nHost = new URL(N8N_URL).hostname
              
              // Si c'est le même domaine, le domaine N8N, ou un sous-domaine talosprimes, réécrire pour passer par le proxy
              if (urlObj.hostname === currentHost || 
                  urlObj.hostname === n8nHost || 
                  urlObj.hostname === 'www.talosprimes.com' || 
                  urlObj.hostname === 'talosprimes.com' ||
                  urlObj.hostname.endsWith('.talosprimes.com')) {
                const path = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname
                return `${attr}="${baseUrl}${proxyBase}/${path}${urlObj.search}"`
              }
              // Sinon, c'est un domaine externe, laisser tel quel
              return match
            } catch {
              // Si l'URL est invalide, laisser tel quel
              return match
            }
          }
          
          // Si l'URL commence par /, la faire passer par le proxy
          if (url.startsWith('/')) {
            const cleanPath = url.substring(1)
            return `${attr}="${baseUrl}${proxyBase}/${cleanPath}"`
          }
          
          // URLs relatives - utiliser le proxy racine
          return `${attr}="${baseUrl}${proxyBase}/${url}"`
        }
      )
      
      // Injecter un script pour intercepter les requêtes fetch et XMLHttpRequest
      // Ne pas passer userId - utiliser uniquement la session Supabase
      const interceptScript = `
<script>
(function() {
  const proxyBase = '${baseUrl}${proxyBase}';
  const n8nHost = '${new URL(N8N_URL).hostname}';
  
  // Fonction pour déterminer si une URL doit être proxifiée
  function shouldProxy(url) {
    // Si c'est déjà une URL proxy, ne pas la proxifier à nouveau
    if (url.includes('/api/platform/n8n/proxy')) {
      return false;
    }
    
    try {
      const urlObj = new URL(url, window.location.href);
      const currentHost = window.location.hostname;
      
      return urlObj.hostname === currentHost || 
             urlObj.hostname === n8nHost || 
             urlObj.hostname === 'www.talosprimes.com' || 
             urlObj.hostname === 'talosprimes.com' ||
             urlObj.hostname.endsWith('.talosprimes.com') ||
             url.startsWith('/');
    } catch {
      // Si l'URL est invalide, proxifier si elle commence par /
      return url.startsWith('/');
    }
  }
  
  // Fonction pour convertir une URL en URL proxy
  function toProxyUrl(url) {
    try {
      if (url.startsWith('/')) {
        return proxyBase + url;
      }
      
      const urlObj = new URL(url, window.location.href);
      const path = urlObj.pathname + urlObj.search;
      return proxyBase + path;
    } catch {
      return url;
    }
  }
  
  // Intercepter fetch
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    if (typeof url === 'string' && shouldProxy(url)) {
      const proxyUrl = toProxyUrl(url);
      console.log('[N8N Proxy] Intercepting fetch:', url, '->', proxyUrl);
      return originalFetch.call(this, proxyUrl, options);
    }
    return originalFetch.call(this, url, options);
  };
  
  // Intercepter XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (typeof url === 'string' && shouldProxy(url)) {
      const proxyUrl = toProxyUrl(url);
      console.log('[N8N Proxy] Intercepting XHR:', url, '->', proxyUrl);
      return originalOpen.call(this, method, proxyUrl, ...args);
    }
    return originalOpen.call(this, method, url, ...args);
  };
})();
</script>
`
      
      // Injecter le script juste après <head>
      modifiedHtml = modifiedHtml.replace(
        /(<head[^>]*>)/i,
        `$1${interceptScript}`
      )
      
      return new NextResponse(modifiedHtml, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } else {
      // Pour les autres types (JS, CSS, images, etc.), utiliser arrayBuffer
      const data = await response.arrayBuffer()

      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': contentType.includes('javascript') || contentType.includes('css')
            ? 'public, max-age=31536000, immutable'
            : 'no-cache, no-store, must-revalidate',
        },
      })
    }
  } catch (error) {
    console.error('[N8N Proxy Root] Error proxying N8N request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: errorMessage,
        hint: 'Vérifiez que N8N est démarré et accessible à l\'adresse ' + N8N_URL
      },
      { status: 503 }
    )
  }
}

/**
 * Proxy pour les requêtes POST (webhooks, API calls, etc.)
 */
export async function POST(request: NextRequest) {
  // NE PAS récupérer userId depuis query params
  // Utiliser uniquement la session Supabase pour identifier l'utilisateur
  
  const { isPlatform, error } = await verifyPlatformUser(request)
  
  if (!isPlatform || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Plateforme uniquement', details: error },
      { status: 403 }
    )
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error('[N8N Proxy Root POST] Configuration invalide:', configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error
      },
      { status: 500 }
    )
  }

  const n8nUrl = `${N8N_URL}/`
  const body = await request.text()
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'POST',
      headers: {
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
    console.error('[N8N Proxy Root POST] Error proxying N8N request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: errorMessage,
        hint: 'Vérifiez que N8N est démarré et accessible'
      },
      { status: 503 }
    )
  }
}

