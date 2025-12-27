import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkMakeConfig, proxyMakeRequest } from '@/lib/services/make'
import { createServerClient } from '@/lib/supabase/server'

const MAKE_URL = process.env.NEXT_PUBLIC_MAKE_URL || process.env.MAKE_URL || 'https://eu1.make.com/organization/5837397/dashboard'

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
 * Proxy catch-all pour Make.com
 * Gère toutes les requêtes vers /api/platform/make/proxy/*
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const makePath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/${resolvedParams.path.join('/')}` 
    : '/'
  
  console.log('[Make Proxy Catch-all] ========== GET request received ==========')
  console.log('[Make Proxy Catch-all] Path:', makePath)
  console.log('[Make Proxy Catch-all] Full URL:', request.url)
  
  // Vérifier que l'utilisateur est un admin plateforme
  const { isPlatform, error } = await verifyPlatformUser(request)
  
  if (!isPlatform || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Platform admin access required', details: error },
      { status: 403 }
    )
  }

  // Vérifier la configuration Make
  const configCheck = checkMakeConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration Make invalide', details: configCheck.error },
      { status: 500 }
    )
  }

  // Construire l'URL Make
  // MAKE_URL contient déjà un chemin, donc on doit construire l'URL correctement
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  
  // Si makePath est juste '/', utiliser MAKE_URL tel quel
  // Pour tous les autres chemins, utiliser l'origin directement (les fichiers statiques sont à la racine)
  let makeUrl: string
  try {
    const makeUrlObj = new URL(MAKE_URL)
    if (makePath === '/') {
      makeUrl = MAKE_URL
    } else {
      // Pour tous les chemins, utiliser directement l'origin (fichiers statiques à la racine de Make.com)
      // Les chemins relatifs à la page (comme /organization/5837397/dashboard/something) 
      // doivent être traités comme des chemins absolus depuis l'origin
      makeUrl = `${makeUrlObj.origin}${makePath}`
    }
    makeUrl += queryString ? `?${queryString}` : ''
  } catch (error) {
    console.error('[Make Proxy Catch-all] Error building URL:', error)
    // Fallback si MAKE_URL n'est pas une URL valide
    makeUrl = `${MAKE_URL}${makePath}${queryString ? `?${queryString}` : ''}`
  }
  
  // Extraire les cookies de session Make
  const requestCookies = request.headers.get('cookie') || ''
  const cookieCount = requestCookies ? requestCookies.split(';').length : 0
  console.log('[Make Proxy Catch-all] Requesting URL:', makeUrl)
  console.log('[Make Proxy Catch-all] Path:', makePath)
  console.log('[Make Proxy Catch-all] Cookies:', cookieCount, 'cookies')
  
  try {
    const response = await proxyMakeRequest(makeUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9',
      },
    }, requestCookies || undefined)

    console.log('[Make Proxy Catch-all] Response status:', response.status, response.statusText)
    console.log('[Make Proxy Catch-all] Response contentType:', response.headers.get('content-type'))
    console.log('[Make Proxy Catch-all] Response URL:', makeUrl)
    
    // Si le status est une erreur, logger les détails
    if (response.status >= 400) {
      console.error('[Make Proxy Catch-all] ❌ ERROR from Make.com - Status:', response.status)
      console.error('[Make Proxy Catch-all] ❌ Requested URL:', makeUrl)
      console.error('[Make Proxy Catch-all] ❌ Path:', makePath)
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
      
      const proxyBase = `/api/platform/make/proxy`
      const makeHost = new URL(MAKE_URL).hostname
      
      // Récupérer le token JWT depuis la session Supabase
      let authToken = ''
      try {
        const supabase = await createServerClient(request)
        const { data: { session } } = await supabase.auth.getSession()
        authToken = session?.access_token || ''
      } catch (error) {
        console.warn('[Make Proxy] Failed to get session token:', error)
      }
      
      // Remplacer les URLs par des URLs proxy (sauf fichiers statiques)
      const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp']
      
      // TOUJOURS remplacer les balises <base href> par notre proxy
      // Les balises <base> peuvent causer des problèmes de résolution d'URL
      let modifiedHtml = htmlData.replace(
        /<base\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
        (match, href) => {
          console.log('[Make Proxy Catch-all] 🔍 Balise <base> trouvée avec href:', href)
          // TOUJOURS remplacer par notre proxy pour éviter les problèmes de résolution d'URL
          const newBase = `${baseUrl}${proxyBase}/`
          console.log('[Make Proxy Catch-all] ✅ Remplacement de <base> par:', newBase)
          return `<!-- base href replaced with proxy --><base href="${newBase}">`
        }
      )
      
      modifiedHtml = modifiedHtml.replace(
        /(src|href|action)=["']([^"']+)["']/g,
        (match, attr, url) => {
          if (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('#')) {
            return match
          }
          
          // Ne pas réécrire les fichiers statiques (CSS, JS, images, etc.)
          const urlLower = url.toLowerCase()
          if (staticExtensions.some(ext => urlLower.endsWith(ext) || urlLower.includes(ext + '?'))) {
            return match
          }
          
          // Ne pas réécrire les fichiers dans /zone/... (fichiers statiques Make.com)
          if (url.includes('/zone/')) {
            return match
          }
          
          if (url.startsWith('http://') || url.startsWith('https://')) {
            try {
              const urlObj = new URL(url)
              const currentHost = host || new URL(baseUrl).hostname
              
              if (urlObj.hostname === currentHost || 
                  urlObj.hostname === makeHost || 
                  urlObj.hostname.endsWith('.make.com') ||
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
      
      // Injecter le script d'interception
      const escapedProxyBase = baseUrl + proxyBase
      const escapedMakeHost = makeHost
      const escapedAuthToken = authToken.replace(/'/g, "\\'").replace(/\\/g, "\\\\")
      
      const interceptionScript = `
<script>
(function() {
  const proxyBase = '${escapedProxyBase}';
  const makeHost = '${escapedMakeHost}';
  const authToken = '${escapedAuthToken}';
  
  function shouldProxy(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Ne pas proxifier les WebSockets
    if (url.includes('ws://') || url.includes('wss://')) {
      return false;
    }
    
    // Ne pas proxifier les fichiers statiques (CSS, JS, images, fonts, etc.)
    // Ces fichiers doivent être chargés directement depuis Make.com
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp'];
    const urlLower = url.toLowerCase();
    if (staticExtensions.some(ext => urlLower.endsWith(ext) || urlLower.includes(ext + '?'))) {
      return false;
    }
    
    // Ne pas proxifier les fichiers dans /zone/... (fichiers statiques Make.com)
    if (url.includes('/zone/')) {
      return false;
    }
    
    // URLs relatives vers Make (sauf fichiers statiques)
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }
    
    // URLs absolues vers Make.com (sauf fichiers statiques)
    try {
      const urlObj = new URL(url, window.location.origin);
      if (urlObj.hostname.endsWith('.make.com') || urlObj.hostname === makeHost) {
        return true;
      }
    } catch {
      if (url.includes('.make.com') || url.includes(makeHost)) {
        return true;
      }
    }
    
    return false;
  }
  
  function toProxyUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        return proxyBase + (urlObj.pathname || '/') + (urlObj.search || '');
      } catch {
        const httpsIndex = url.indexOf('://');
        if (httpsIndex !== -1) {
          const pathStart = url.indexOf('/', httpsIndex + 3);
          if (pathStart !== -1) {
            return proxyBase + url.substring(pathStart);
          }
        }
        return proxyBase + url;
      }
    }
    return proxyBase + (url.startsWith('/') ? url : '/' + url);
  }
  
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    options = options || {};
    if (typeof url === 'string' && shouldProxy(url)) {
      const proxyUrl = toProxyUrl(url);
      const modifiedOptions = { ...options, credentials: 'include', headers: { ...(options.headers || {}) } };
      if (authToken) {
        modifiedOptions.headers['Authorization'] = 'Bearer ' + authToken;
        modifiedOptions.headers['X-Supabase-Auth-Token'] = authToken;
      }
      return originalFetch.call(this, proxyUrl, modifiedOptions);
    }
    return originalFetch.call(this, url, options);
  };
  
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    const args = Array.prototype.slice.call(arguments, 2);
    if (typeof url === 'string' && shouldProxy(url)) {
      this._makeProxyUrl = toProxyUrl(url);
      return originalOpen.apply(this, [method, this._makeProxyUrl].concat(args));
    }
    return originalOpen.apply(this, arguments);
  };
  
  // Note: L'interception de window.location est problématique car c'est une propriété non-configurable
  // Le vrai problème est le CSP qui doit être géré côté serveur via le proxy
  // L'interception JavaScript est désactivée pour éviter les erreurs
})();
</script>`
      
      // Injecter le script
      if (modifiedHtml.includes('<head>')) {
        modifiedHtml = modifiedHtml.replace(/<head>/i, '<head>' + interceptionScript);
      } else if (modifiedHtml.includes('</head>')) {
        modifiedHtml = modifiedHtml.replace('</head>', interceptionScript + '</head>');
      } else if (modifiedHtml.includes('</body>')) {
        modifiedHtml = modifiedHtml.replace('</body>', interceptionScript + '</body>');
      } else {
        modifiedHtml = interceptionScript + modifiedHtml;
      }
      
      // Créer la réponse avec les headers modifiés
      const responseHeaders = new Headers(response.headers)
      responseHeaders.delete('content-security-policy')
      responseHeaders.delete('x-frame-options')
      responseHeaders.set('Content-Security-Policy', "frame-ancestors 'self' https://www.talosprimes.com")
      
      // Transmettre les cookies Set-Cookie de Make
      const setCookieHeaders = response.headers.getSetCookie()
      const nextResponse = new NextResponse(modifiedHtml, {
        status: response.status,
        headers: responseHeaders,
      })
      
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          nextResponse.headers.append('Set-Cookie', cookie)
        })
      }
      
      return nextResponse
    }

    // Pour les autres types de contenu
    // Ne copier que les headers nécessaires (comme dans la route racine)
    const setCookieHeaders = response.headers.getSetCookie()
    const nextResponse = new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...getCorsHeaders(request.headers.get('origin')),
      },
    })
    
    // Transmettre les cookies Set-Cookie de Make
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        nextResponse.headers.append('Set-Cookie', cookie)
      })
    }
    
    return nextResponse
  } catch (error) {
    console.error('[Make Proxy Catch-all] Erreur lors du proxy:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      makeUrl,
      makePath,
    })
    return NextResponse.json(
      { 
        error: 'Erreur lors du proxy vers Make.com', 
        details: error instanceof Error ? error.message : 'Unknown error',
        url: makeUrl,
      },
      { status: 502, headers: getCorsHeaders(request.headers.get('origin')) }
    )
  }
}

/**
 * Proxy POST pour Make.com
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const makePath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/${resolvedParams.path.join('/')}` 
    : '/'
  
  const { isPlatform, error } = await verifyPlatformUser(request)
  
  if (!isPlatform || error) {
    return NextResponse.json(
      { error: 'Unauthorized - Platform admin access required', details: error },
      { status: 403 }
    )
  }

  const configCheck = checkMakeConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration Make invalide', details: configCheck.error },
      { status: 500 }
    )
  }

  // Construire l'URL Make pour POST
  let makeUrl: string
  try {
    const makeUrlObj = new URL(MAKE_URL)
    if (makePath === '/') {
      makeUrl = MAKE_URL
    } else {
      const basePath = makeUrlObj.pathname
      makeUrl = `${makeUrlObj.origin}${basePath}${makePath}`
    }
  } catch {
    makeUrl = `${MAKE_URL}${makePath}`
  }
  const body = await request.text()
  const requestCookies = request.headers.get('cookie') || ''
  
  try {
    const response = await proxyMakeRequest(makeUrl, {
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
    
    // Transmettre les cookies Set-Cookie de Make
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        nextResponse.headers.append('Set-Cookie', cookie)
      })
    }
    
    return nextResponse
  } catch (error) {
    console.error('[Make Proxy POST] Error:', error)
    return NextResponse.json(
      { 
        error: 'Échec de la connexion à Make.com',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 503 }
    )
  }
}

