import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticatedUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, getN8NAuthHeaders, proxyN8NRequest } from '@/lib/services/n8n'
import { createServerClient } from '@/lib/supabase/server'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route API proxy pour la racine N8N (sans chemin)
 * Gère les requêtes vers /api/platform/n8n/proxy
 * Redirige vers N8N avec authentification automatique
 */
export async function GET(request: NextRequest) {
  // NE PAS récupérer userId depuis query params
  // Utiliser uniquement la session Supabase pour identifier l'utilisateur
  // verifyAuthenticatedUser récupérera automatiquement l'utilisateur depuis la session
  
  // Log pour déboguer
  console.log('[N8N Proxy Root] Request:', {
    url: request.url,
    hasCookies: !!request.headers.get('cookie'),
  })
  
  // Vérifier que l'utilisateur est authentifié (plateforme ou client)
  const { isAuthenticated, error } = await verifyAuthenticatedUser(request)
  
  if (!isAuthenticated || error) {
    console.error('[N8N Proxy Root] Auth failed:', {
      isAuthenticated,
      error,
      hasCookies: !!request.headers.get('cookie'),
      url: request.url,
    })
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required', details: error },
      { status: 403 }
    )
  }

  // Récupérer le token JWT depuis la session Supabase pour l'injecter dans le HTML
  let jwtToken: string | null = null
  try {
    const supabase = await createServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      jwtToken = session.access_token
      console.log('[N8N Proxy Root] ✅ JWT token retrieved from session')
    } else {
      console.warn('[N8N Proxy Root] ⚠️ No JWT token in session')
    }
  } catch (tokenError) {
    console.error('[N8N Proxy Root] ❌ Error retrieving JWT token:', tokenError)
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

  // Récupérer les query params de l'URL (pour les passer à N8N, mais sans userId)
  const { searchParams } = new URL(request.url)

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
      
      // Injecter le token JWT dans le HTML pour que le script d'interception puisse l'utiliser
      const tokenScript = jwtToken ? `
<script>
  // Stocker le token JWT pour l'utiliser dans les requêtes proxy
  window.__N8N_AUTH_TOKEN__ = ${JSON.stringify(jwtToken)};
  console.log('[N8N Proxy] JWT token stored for proxy requests');
</script>
` : `
<script>
  console.warn('[N8N Proxy] No JWT token available - will rely on cookies only');
</script>
`

      // Injecter un script pour intercepter les requêtes fetch et XMLHttpRequest
      // Ne pas passer userId - utiliser uniquement la session Supabase
      const interceptScript = `
<script>
// SCRIPT D'INTERCEPTION N8N - DOIT S'EXÉCUTER IMMÉDIATEMENT
// Injection synchrone pour capturer toutes les requêtes dès le chargement
(function() {
  console.log('[N8N Proxy] 🚀 Script d\'interception chargé');
  const proxyBase = '${baseUrl}${proxyBase}';
  const n8nHost = '${new URL(N8N_URL).hostname}';
  
  // Fonction pour déterminer si une URL doit être proxifiée
  function shouldProxy(url) {
    // Si c'est déjà une URL proxy, ne pas la proxifier à nouveau
    if (url.includes('/api/platform/n8n/proxy')) {
      return false;
    }
    
    // Toujours proxifier /rest/* et /assets/* (même avec URLs absolues)
    if (url.includes('/rest/') || url.includes('/assets/')) {
      return true;
    }
    
    // Proxifier les URLs relatives qui commencent par /rest ou /assets
    if (url.startsWith('/rest') || url.startsWith('/assets')) {
      return true;
    }
    
    try {
      const urlObj = new URL(url, window.location.href);
      const currentHost = window.location.hostname;
      
      // Proxifier si c'est le même domaine ou un sous-domaine talosprimes.com
      if (urlObj.hostname === currentHost || 
          urlObj.hostname === n8nHost || 
          urlObj.hostname === 'www.talosprimes.com' || 
          urlObj.hostname === 'talosprimes.com' ||
          urlObj.hostname.endsWith('.talosprimes.com')) {
        // Vérifier aussi le chemin
        if (urlObj.pathname.startsWith('/rest') || urlObj.pathname.startsWith('/assets')) {
          return true;
        }
        // Proxifier toutes les URLs du même domaine
        return url.startsWith('/') || urlObj.hostname === currentHost;
      }
      
      return url.startsWith('/');
    } catch {
      // Si l'URL est invalide, proxifier si elle commence par /rest ou /assets
      return url.startsWith('/rest') || url.startsWith('/assets') || url.startsWith('/');
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
  
  // Intercepter fetch - FORCER credentials: 'include' et ajouter token JWT si disponible
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    if (typeof url === 'string' && shouldProxy(url)) {
      const proxyUrl = toProxyUrl(url);
      console.log('[N8N Proxy] Intercepting fetch:', url, '->', proxyUrl);
      // FORCER credentials: 'include' pour envoyer les cookies de session Supabase
      // ET ajouter le token JWT dans les headers si disponible (contourne SameSite)
      const modifiedOptions = {
        ...options,
        credentials: 'include',  // ✅ Toujours inclure les cookies
        headers: {
          ...(options.headers || {}),
          // Ajouter le token JWT si disponible (depuis window.__N8N_AUTH_TOKEN__)
          ...(window.__N8N_AUTH_TOKEN__ ? {
            'Authorization': 'Bearer ' + window.__N8N_AUTH_TOKEN__,
            'X-Supabase-Auth-Token': window.__N8N_AUTH_TOKEN__
          } : {}),
        },
      };
      return originalFetch.call(this, proxyUrl, modifiedOptions);
    }
    return originalFetch.call(this, url, options);
  };
  
  // Intercepter XMLHttpRequest - FORCER withCredentials et ajouter token JWT si disponible
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (typeof url === 'string' && shouldProxy(url)) {
      const proxyUrl = toProxyUrl(url);
      console.log('[N8N Proxy] Intercepting XHR:', url, '->', proxyUrl);
      // Marquer cette requête pour ajouter withCredentials et token dans send
      this._n8nProxyUrl = proxyUrl;
      return originalOpen.call(this, method, proxyUrl, ...args);
    }
    return originalOpen.call(this, method, url, ...args);
  };
  // Intercepter setRequestHeader pour capturer les headers existants
  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    if (!this._n8nHeaders) {
      this._n8nHeaders = {};
    }
    this._n8nHeaders[header] = value;
    return originalSetRequestHeader.call(this, header, value);
  };
  // Intercepter send pour ajouter withCredentials et token JWT
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._n8nProxyUrl) {
      this.withCredentials = true;  // ✅ Forcer l'envoi des cookies
      // Ajouter le token JWT si disponible
      if (window.__N8N_AUTH_TOKEN__) {
        const existingAuth = this._n8nHeaders?.['Authorization'] || this._n8nHeaders?.['authorization'];
        if (!existingAuth) {
          this.setRequestHeader('Authorization', 'Bearer ' + window.__N8N_AUTH_TOKEN__);
          this.setRequestHeader('X-Supabase-Auth-Token', window.__N8N_AUTH_TOKEN__);
        }
      }
      delete this._n8nProxyUrl;
      delete this._n8nHeaders;
    }
    return originalSend.apply(this, args);
  };
})();
</script>
`
      
      // Injecter le token JWT et le script d'interception de manière synchrone AVANT tout autre script
      // Utiliser une injection plus agressive pour s'assurer qu'il s'exécute en premier
      if (modifiedHtml.includes('</head>')) {
        // Injecter le token JWT et le script d'interception juste avant </head> pour s'assurer qu'ils sont chargés tôt
        modifiedHtml = modifiedHtml.replace(
          /(<\/head>)/i,
          `${tokenScript}${interceptScript}$1`
        )
      } else {
        // Fallback : injecter après <head>
        modifiedHtml = modifiedHtml.replace(
          /(<head[^>]*>)/i,
          `$1${interceptScript}`
        )
      }
      
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
  
  const { isAuthenticated, error } = await verifyAuthenticatedUser(request)
  
  if (!isAuthenticated || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required', details: error },
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

