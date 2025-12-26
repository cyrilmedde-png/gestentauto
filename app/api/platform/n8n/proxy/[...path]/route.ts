import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, proxyN8NRequest } from '@/lib/services/n8n'
import { createServerClient } from '@/lib/supabase/server'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Fonction pour créer les headers CORS
 */
function getCorsHeaders(origin?: string | null): HeadersInit {
  const allowedOrigin = origin || 'https://www.talosprimes.com'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth-Token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  }
}

/**
 * Proxy catch-all pour N8N
 * Gère toutes les requêtes vers /api/platform/n8n/proxy/*
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const n8nPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/${resolvedParams.path.join('/')}` 
    : '/'
  
  // Pour /rest/login, on permet l'accès SANS vérification (N8N gère sa propre auth)
  const isRestLogin = n8nPath === '/rest/login' || n8nPath.startsWith('/rest/login')
  
  // Vérifier que l'utilisateur est un admin plateforme SAUF pour /rest/login
  if (!isRestLogin) {
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403 }
      )
    }
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration N8N invalide', details: configCheck.error },
      { status: 500 }
    )
  }

  // Construire l'URL N8N
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const n8nUrl = `${N8N_URL}${n8nPath}${queryString ? `?${queryString}` : ''}`
  
  // Extraire les cookies de session N8N
  const requestCookies = request.headers.get('cookie') || ''
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9',
      },
    }, requestCookies || undefined)

    // Pour /rest/login GET, un 401 est normal (pas de session active)
    // Transformer 401 en 200 pour éviter les erreurs console
    if (isRestLogin && response.status === 401) {
      const contentType = response.headers.get('content-type') || 'application/json'
      const data = await response.text()
      
      const nextResponse = new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...getCorsHeaders(request.headers.get('origin')),
        },
      })
      
      // Transmettre les cookies Set-Cookie de N8N
      const setCookieHeaders = response.headers.getSetCookie()
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          const [nameValue] = cookie.split(';')
          const [name, ...valueParts] = nameValue.split('=')
          if (name && valueParts.length > 0) {
            const value = valueParts.join('=')
            const options: any = {}
            if (cookie.includes('HttpOnly')) options.httpOnly = true
            if (cookie.includes('Secure')) options.secure = true
            if (cookie.includes('SameSite=None')) options.sameSite = 'none'
            if (cookie.includes('SameSite=Lax')) options.sameSite = 'lax'
            if (cookie.includes('SameSite=Strict')) options.sameSite = 'strict'
            const maxAgeMatch = cookie.match(/Max-Age=(\d+)/)
            if (maxAgeMatch) options.maxAge = parseInt(maxAgeMatch[1])
            const pathMatch = cookie.match(/Path=([^;]+)/)
            if (pathMatch) options.path = pathMatch[1]
            const domainMatch = cookie.match(/Domain=([^;]+)/)
            if (domainMatch) options.domain = domainMatch[1]
            
            nextResponse.cookies.set(name.trim(), value, options)
          }
        })
      }
      
      return nextResponse
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // Pour le HTML, réécrire les URLs
    if (contentType.includes('text/html')) {
      const htmlData = await response.text()
      
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const baseUrl = host 
        ? `${protocol}://${host}`
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com')
      
      const proxyBase = `/api/platform/n8n/proxy`
      const n8nHost = new URL(N8N_URL).hostname
      
      // Récupérer le token JWT depuis la session Supabase
      let authToken = ''
      try {
        const supabase = await createServerClient(request)
        const { data: { session } } = await supabase.auth.getSession()
        authToken = session?.access_token || ''
      } catch (error) {
        console.warn('[N8N Proxy] Failed to get session token:', error)
      }
      
      // Remplacer les URLs par des URLs proxy
      let modifiedHtml = htmlData.replace(
        /(src|href|action)=["']([^"']+)["']/g,
        (match, attr, url) => {
          if (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('#')) {
            return match
          }
          
          if (url.startsWith('http://') || url.startsWith('https://')) {
            try {
              const urlObj = new URL(url)
              const currentHost = host || new URL(baseUrl).hostname
              
              if (urlObj.hostname === currentHost || 
                  urlObj.hostname === n8nHost || 
                  urlObj.hostname.endsWith('.talosprimes.com')) {
                const path = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname
                return `${attr}="${baseUrl}${proxyBase}/${path}${urlObj.search}"`
              }
              return match
            } catch {
              return match
            }
          }
          
          // URLs relatives
          if (url.startsWith('/')) {
            return `${attr}="${baseUrl}${proxyBase}${url}"`
          }
          
          return match
        }
      )
      
      // Injecter le script d'interception dans le HTML (avant </body> ou avant </html>)
      // Échapper correctement les caractères spéciaux pour éviter les erreurs de syntaxe
      const escapedProxyBase = baseUrl + proxyBase
      const escapedN8nHost = n8nHost
      const escapedAuthToken = authToken.replace(/'/g, "\\'").replace(/\\/g, "\\\\")
      
      const interceptionScript = `
<script>
(function() {
  const proxyBase = '${escapedProxyBase}';
  const n8nHost = '${escapedN8nHost}';
  const authToken = '${escapedAuthToken}';
  
  // Domaines externes à ne PAS proxifier (liste exhaustive)
  const externalDomains = [
    'api.github.com', 
    'github.com', 
    'githubusercontent.com',
    'cdn.jsdelivr.net', 
    'unpkg.com',
    'googleapis.com',
    'gstatic.com',
    'google.com',
    'cloudflare.com',
    'jsdelivr.net'
  ];
  
  function shouldProxy(url) {
    if (!url || typeof url !== 'string') return false;
    
    // EXCLUSION CRITIQUE : Ne JAMAIS proxifier les WebSockets (/rest/push)
    // Les WebSockets doivent passer directement par Nginx, pas par Next.js
    if (url.includes('/rest/push') || url.includes('ws://') || url.includes('wss://')) {
      return false;
    }
    
    // EXCLUSION PRIORITAIRE : Ne JAMAIS proxifier les domaines externes
    // Vérifier d'abord par string pour éviter les erreurs de parsing
    const urlLower = url.toLowerCase();
    for (const domain of externalDomains) {
      if (urlLower.includes(domain.toLowerCase())) {
        return false;
      }
    }
    
    // URLs relatives vers N8N (inclut /rest/telemetry/..., /icons/...)
    // MAIS PAS /rest/push (exclu ci-dessus)
    if (url.startsWith('/rest/') || 
        url.startsWith('/assets/') || 
        url.startsWith('/types/') ||
        url.startsWith('/icons/') ||
        url.startsWith('/api/')) {
      return true;
    }
    
    // IMPORTANT: Capturer les requêtes vers localhost:5678 (N8N direct)
    if (url.includes('localhost:5678') || url.includes('127.0.0.1:5678')) {
      return true;
    }
    
    // URLs absolues - vérifier si c'est vers n8n.talosprimes.com
    try {
      const urlObj = new URL(url, window.location.origin);
      const hostname = urlObj.hostname;
      const port = urlObj.port;
      
      // Capturer localhost:5678 ou 127.0.0.1:5678
      if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '5678') {
        return true;
      }
      
      // Double vérification pour les domaines externes (sécurité)
      if (externalDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
        return false;
      }
      
      // Proxifier toutes les URLs vers n8n.talosprimes.com
      // SAUF /rest/push (WebSocket - doit passer par Nginx directement)
      if ((hostname === n8nHost || hostname === 'n8n.talosprimes.com') && !urlObj.pathname.includes('/rest/push')) {
        return true;
      }
      
      // Proxifier les sous-domaines talosprimes.com sauf les domaines externes
      // SAUF /rest/push (WebSocket - doit passer par Nginx directement)
      if (hostname.endsWith('.talosprimes.com') && !urlObj.pathname.includes('/rest/push')) {
        return !externalDomains.some(d => hostname.includes(d));
      }
      
      return false;
    } catch {
      // Si l'URL est invalide, vérifier si elle contient n8n.talosprimes.com ou localhost:5678
      if (url.includes('n8n.talosprimes.com') || url.includes('localhost:5678') || url.includes('127.0.0.1:5678')) {
        // Vérifier qu'elle ne contient pas de domaines externes
        return !externalDomains.some(d => url.includes(d));
      }
      return false;
    }
  }
  
  function toProxyUrl(url) {
    // Si c'est une URL vers localhost:5678, extraire le chemin
    if (url.includes('localhost:5678') || url.includes('127.0.0.1:5678')) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname || '/';
        const search = urlObj.search || '';
        return proxyBase + path + search;
      } catch {
        // Extraction manuelle si URL() échoue - utiliser new RegExp() pour éviter les problèmes d'échappement
        try {
          const localhostPattern = new RegExp('localhost:5678(\\/.*|$)');
          const localhostMatch = url.match(localhostPattern);
          if (localhostMatch && localhostMatch[1]) {
            return proxyBase + (localhostMatch[1] || '/');
          }
        } catch (e) {
          // Ignorer l'erreur de regex
        }
        
        try {
          const ipPattern = new RegExp('127\\.0\\.0\\.1:5678(\\/.*|$)');
          const ipMatch = url.match(ipPattern);
          if (ipMatch && ipMatch[1]) {
            return proxyBase + (ipMatch[1] || '/');
          }
        } catch (e) {
          // Ignorer l'erreur de regex
        }
        
        // Si pas de chemin trouvé, essayer d'extraire /rest/...
        try {
          const restPattern = new RegExp('(\\/rest\\/.*)');
          const restMatch = url.match(restPattern);
          if (restMatch && restMatch[1]) {
            return proxyBase + restMatch[1];
          }
        } catch (e) {
          // Ignorer l'erreur de regex
        }
        
        // Fallback : extraire manuellement après le port
        const portIndex = url.indexOf(':5678');
        if (portIndex !== -1) {
          const pathStart = url.indexOf('/', portIndex + 5);
          if (pathStart !== -1) {
            return proxyBase + url.substring(pathStart);
          }
        }
        
        return proxyBase + '/';
      }
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname || '/';
        const search = urlObj.search || '';
        return proxyBase + path + search;
      } catch {
        // Utiliser new RegExp() pour éviter les problèmes d'échappement dans template string
        try {
          const urlPattern = new RegExp('https?:\\/\\/[^\\/]+(\\/.*)');
          const match = url.match(urlPattern);
          if (match) return proxyBase + match[1];
        } catch (regexError) {
          // Fallback: extraire le chemin manuellement
          const httpsIndex = url.indexOf('://');
          if (httpsIndex !== -1) {
            const pathStart = url.indexOf('/', httpsIndex + 3);
            if (pathStart !== -1) {
              return proxyBase + url.substring(pathStart);
            }
          }
        }
        return proxyBase + url;
      }
    }
    return proxyBase + (url.startsWith('/') ? url : '/' + url);
  }
  
  // Intercepter WebSocket (Note: Next.js ne supporte pas les WebSockets nativement)
  // Les WebSockets doivent être proxifiés via Nginx directement vers N8N
  // Pour l'instant, on laisse les WebSockets se connecter directement à N8N
  // TODO: Configurer Nginx pour proxifier wss://www.talosprimes.com/rest/push vers wss://n8n.talosprimes.com/rest/push
  
  // Intercepter fetch
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    options = options || {};
    if (typeof url === 'string' && shouldProxy(url)) {
      const proxyUrl = toProxyUrl(url);
      const modifiedOptions = {
        ...options,
        credentials: 'include',
        headers: {
          ...(options.headers || {}),
        },
      };
      if (authToken) {
        modifiedOptions.headers['Authorization'] = 'Bearer ' + authToken;
        modifiedOptions.headers['X-Supabase-Auth-Token'] = authToken;
      }
      return originalFetch.call(this, proxyUrl, modifiedOptions);
    }
    return originalFetch.call(this, url, options);
  };
  
  // Intercepter XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    const args = Array.prototype.slice.call(arguments, 2);
    if (typeof url === 'string' && shouldProxy(url)) {
      this._n8nProxyUrl = toProxyUrl(url);
      return originalOpen.apply(this, [method, this._n8nProxyUrl].concat(args));
    }
    return originalOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    if (!this._n8nHeaders) this._n8nHeaders = {};
    this._n8nHeaders[header] = value;
    return originalSetRequestHeader.call(this, header, value);
  };
  
  XMLHttpRequest.prototype.send = function() {
    if (this._n8nProxyUrl) {
      this.withCredentials = true;
      if (authToken) {
        const existingAuth = (this._n8nHeaders && this._n8nHeaders['Authorization']) || 
                            (this._n8nHeaders && this._n8nHeaders['authorization']);
        if (!existingAuth) {
          this.setRequestHeader('Authorization', 'Bearer ' + authToken);
          this.setRequestHeader('X-Supabase-Auth-Token', authToken);
        }
      }
      delete this._n8nProxyUrl;
      delete this._n8nHeaders;
    }
    return originalSend.apply(this, arguments);
  };
})();
</script>`
      
      // Injecter le script IMMÉDIATEMENT après <head> pour qu'il soit exécuté en premier
      // Utiliser replace avec une fonction pour éviter les problèmes de remplacement multiple
      if (modifiedHtml.includes('<head>')) {
        modifiedHtml = modifiedHtml.replace(/<head>/i, '<head>' + interceptionScript);
      } else if (modifiedHtml.includes('</head>')) {
        modifiedHtml = modifiedHtml.replace('</head>', interceptionScript + '</head>');
      } else if (modifiedHtml.includes('</body>')) {
        modifiedHtml = modifiedHtml.replace('</body>', interceptionScript + '</body>');
      } else if (modifiedHtml.includes('</html>')) {
        modifiedHtml = modifiedHtml.replace('</html>', interceptionScript + '</html>');
      } else {
        // Si aucune balise trouvée, injecter au début du HTML
        modifiedHtml = interceptionScript + modifiedHtml;
      }
      
      return new NextResponse(modifiedHtml, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...getCorsHeaders(request.headers.get('origin')),
        },
      })
    }
    
    // Pour les autres types (JS, CSS, images, etc.)
    const data = await response.arrayBuffer()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': contentType.includes('javascript') || contentType.includes('css')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache, no-store, must-revalidate',
        ...getCorsHeaders(request.headers.get('origin')),
      },
    })
  } catch (error) {
    console.error('[N8N Proxy] Error:', error)
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 503 }
    )
  }
}

/**
 * Proxy POST pour N8N
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const n8nPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/${resolvedParams.path.join('/')}` 
    : '/'
  
  const isRestLogin = n8nPath === '/rest/login' || n8nPath.startsWith('/rest/login')
  
  if (!isRestLogin) {
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403 }
      )
    }
  }

  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration N8N invalide', details: configCheck.error },
      { status: 500 }
    )
  }

  const n8nUrl = `${N8N_URL}${n8nPath}`
  const body = await request.text()
  const requestCookies = request.headers.get('cookie') || ''
  
  try {
    const response = await proxyN8NRequest(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
      },
      body: body,
    }, requestCookies || undefined)
    
    const contentType = response.headers.get('content-type') || 'application/json'
    const data = await response.text()
    
    const nextResponse = new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...getCorsHeaders(request.headers.get('origin')),
      },
    })
    
    // Transmettre les cookies Set-Cookie de N8N
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        const [nameValue] = cookie.split(';')
        const [name, ...valueParts] = nameValue.split('=')
        if (name && valueParts.length > 0) {
          const value = valueParts.join('=')
          const options: any = {}
          if (cookie.includes('HttpOnly')) options.httpOnly = true
          if (cookie.includes('Secure')) options.secure = true
          if (cookie.includes('SameSite=None')) options.sameSite = 'none'
          if (cookie.includes('SameSite=Lax')) options.sameSite = 'lax'
          if (cookie.includes('SameSite=Strict')) options.sameSite = 'strict'
          const maxAgeMatch = cookie.match(/Max-Age=(\d+)/)
          if (maxAgeMatch) options.maxAge = parseInt(maxAgeMatch[1])
          const pathMatch = cookie.match(/Path=([^;]+)/)
          if (pathMatch) options.path = pathMatch[1]
          const domainMatch = cookie.match(/Domain=([^;]+)/)
          if (domainMatch) options.domain = domainMatch[1]
          
          nextResponse.cookies.set(name.trim(), value, options)
        }
      })
    }
    
    return nextResponse
  } catch (error) {
    console.error('[N8N Proxy POST] Error:', error)
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à N8N',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 503 }
    )
  }
}

