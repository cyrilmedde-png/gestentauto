import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkMakeConfig, proxyMakeRequest } from '@/lib/services/make'
import { createServerClient } from '@/lib/supabase/server'

const MAKE_URL = process.env.NEXT_PUBLIC_MAKE_URL || process.env.MAKE_URL || 'https://www.make.com/en/login'

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
  
  // Construire l'URL Make AVANT toute vérification pour déterminer si c'est une page publique
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
  
  // Vérifier si c'est une page publique Make.com (détection améliorée)
  // Vérifier d'abord MAKE_URL lui-même, puis makeUrl
  const isMakeUrlBasePublic = MAKE_URL.includes('www.make.com/en') || 
                              MAKE_URL.includes('make.com/en') ||
                              MAKE_URL.includes('/en/login') ||
                              MAKE_URL.includes('/en/signup') ||
                              MAKE_URL.includes('/en/')
  
  const isMakeUrlPathPublic = makeUrl.includes('www.make.com/en') || 
                              makeUrl.includes('make.com/en') ||
                              makeUrl.includes('/en/login') ||
                              makeUrl.includes('/en/signup') ||
                              makeUrl.includes('/en/')
  
  const isPublicPage = isMakeUrlBasePublic || isMakeUrlPathPublic
  
  console.log('[Make Proxy Catch-all] makeUrl:', makeUrl)
  console.log('[Make Proxy Catch-all] MAKE_URL:', MAKE_URL)
  console.log('[Make Proxy Catch-all] isMakeUrlBasePublic:', isMakeUrlBasePublic)
  console.log('[Make Proxy Catch-all] isMakeUrlPathPublic:', isMakeUrlPathPublic)
  console.log('[Make Proxy Catch-all] isPublicPage:', isPublicPage)
  
  // Pour les pages publiques, ne pas vérifier l'authentification (permet de tester)
  if (!isPublicPage) {
    console.log('[Make Proxy Catch-all] Page privée détectée - vérification de l\'authentification...')
    const { isPlatform, error } = await verifyPlatformUser(request)
    console.log('[Make Proxy Catch-all] Platform user verification result:', { isPlatform, error })
    
    if (!isPlatform || error) {
      console.error('[Make Proxy Catch-all] ❌ Unauthorized:', {
        isPlatform,
        error,
        hasCookies: !!request.headers.get('cookie'),
        url: request.url,
      })
      
      // Si c'est une erreur d'authentification (pas de session), retourner 401 au lieu de 403
      if (error?.includes('Not authenticated') || error?.includes('Please log in')) {
        return NextResponse.json(
          { error: 'Authentication required. Please log in.', details: error },
          { status: 401, headers: getCorsHeaders(request.headers.get('origin')) }
        )
      }
      
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }
  } else {
    console.log('[Make Proxy Catch-all] ✅ Page publique détectée - vérification d\'authentification ignorée pour test')
  }

  // Vérifier la configuration Make
  const configCheck = checkMakeConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration Make invalide', details: configCheck.error },
      { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
    )
  }
  
  // Pour les pages publiques Make.com, ne pas envoyer de cookies de session
  // Les cookies de notre application ne sont pas valides pour Make.com
  const requestCookies = isPublicPage ? undefined : (request.headers.get('cookie') || '')
  if (isPublicPage) {
    console.log('[Make Proxy Catch-all] Public page detected - not sending cookies')
  } else {
    console.log('[Make Proxy Catch-all] Private page - sending cookies')
    const cookieCount = requestCookies ? requestCookies.split(';').length : 0
    console.log('[Make Proxy Catch-all] Cookies:', cookieCount, 'cookies')
  }
  console.log('[Make Proxy Catch-all] Requesting URL:', makeUrl)
  console.log('[Make Proxy Catch-all] Path:', makePath)
  
  try {
    const response = await proxyMakeRequest(makeUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
        'Accept': request.headers.get('accept') || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.make.com/', // Ajouter Referer pour contourner Cloudflare
        'Origin': 'https://www.make.com', // Ajouter Origin pour contourner Cloudflare
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
      
      // DÉTECTION CRITIQUE: Vérifier si c'est un challenge Cloudflare
      const isCloudflareChallenge = htmlData.includes('Enable JavaScript and cookies to continue') ||
                                   htmlData.includes('challenges.cloudflare.com') ||
                                   htmlData.includes('/cdn-cgi/challenge-platform/') ||
                                   htmlData.includes('_cf_bm') ||
                                   htmlData.includes('__cf_bm') ||
                                   htmlData.includes('cf_clearance') ||
                                   htmlData.includes('Just a moment') ||
                                   htmlData.includes('Checking your browser')
      
      if (isCloudflareChallenge) {
        console.warn('[Make Proxy Catch-all] ⚠️⚠️⚠️ CHALLENGE CLOUDFLARE DÉTECTÉ!')
        console.warn('[Make Proxy Catch-all] Le HTML contient un challenge Cloudflare - JavaScript doit être autorisé')
      }
      
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
      
      // SUPPRIMER complètement les balises <base href>
      // Les balises <base> causent des problèmes de résolution d'URL et créent des duplications
      // Nous réécrivons déjà toutes les URLs dans le HTML, donc pas besoin de <base>
      let modifiedHtml = htmlData.replace(
        /<base\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
        (match, href) => {
          console.log('[Make Proxy Catch-all] 🔍 Balise <base> trouvée avec href:', href)
          console.log('[Make Proxy Catch-all] ✅ Suppression de <base> (les URLs sont déjà réécrites)')
          return '<!-- base href removed to prevent URL duplication -->'
        }
      )
      
      modifiedHtml = modifiedHtml.replace(
        /(src|href|action)=["']([^"']+)["']/g,
        (match, attr, url) => {
          if (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('#')) {
            return match
          }
          
          // CRITIQUE: Ne JAMAIS réécrire les URLs Cloudflare - elles doivent rester telles quelles
          // C'est la cause de l'erreur v1?ray=... 404
          if (url.includes('cdn-cgi') || 
              url.includes('challenges.cloudflare.com') ||
              url.includes('cloudflare.com') ||
              url.includes('/v1?ray=') ||
              url.includes('v1?ray=') ||
              url.includes('cf-chl') ||
              url.includes('cf-browser-verification') ||
              url.includes('challenge-platform')) {
            return match; // Laisser l'URL originale
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
      // Échapper correctement toutes les variables pour éviter les erreurs de syntaxe JavaScript
      const escapedProxyBase = (baseUrl + proxyBase).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      const escapedMakeHost = makeHost.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      const escapedAuthToken = (authToken || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      
      const interceptionScript = `
<script>
(function() {
  console.log('[Make Proxy Interception] 🚀 Script d\\'interception Make.com initialisé');
  console.log('[Make Proxy Interception] proxyBase:', '${escapedProxyBase}');
  const proxyBase = '${escapedProxyBase}';
  const makeHost = '${escapedMakeHost}';
  const authToken = '${escapedAuthToken}';
  
  function shouldProxy(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Ne pas proxifier les WebSockets
    if (url.includes('ws://') || url.includes('wss://')) {
      return false;
    }
    
    // CRITIQUE: Ne JAMAIS proxifier les URLs Cloudflare - elles doivent être chargées directement
    // C'est la cause de l'erreur v1?ray=... 404
    if (url.includes('cdn-cgi') || 
        url.includes('challenges.cloudflare.com') ||
        url.includes('cloudflare.com') ||
        url.includes('/v1?ray=') ||
        url.includes('v1?ray=') ||
        url.includes('cf-chl') ||
        url.includes('cf-browser-verification') ||
        url.includes('challenge-platform')) {
      return false; // Laisser passer directement sans proxy
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
    
    // NE PLUS proxifier /api/platform/make/api/... car nous avons maintenant une route dédiée
    // Ces URLs seront gérées directement par /api/platform/make/api/[...path]
    if (url.includes('/api/platform/make/api/')) {
      return false; // Laisser la requête passer directement sans transformation
    }
    
    // URLs relatives vers Make (sauf fichiers statiques et /api/platform/make/api/)
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }
    
    // URLs absolues vers Make.com (sauf fichiers statiques)
    try {
      const urlObj = new URL(url, window.location.origin);
      if (urlObj.hostname.endsWith('.make.com') || urlObj.hostname === makeHost) {
        // Mais ne pas proxifier si c'est /api/platform/make/api/
        if (urlObj.pathname.includes('/api/platform/make/api/')) {
          return false;
        }
        return true;
      }
    } catch {
      if (url.includes('.make.com') || url.includes(makeHost)) {
        if (url.includes('/api/platform/make/api/')) {
          return false;
        }
        return true;
      }
    }
    
    return false;
  }
  
  function toProxyUrl(url) {
    // NE PLUS transformer /api/platform/make/api/... car nous avons maintenant une route dédiée
    // Laisser ces URLs telles quelles pour utiliser /api/platform/make/api/[...path]
    
    // Si l'URL commence déjà par /api/platform/make/api/, la laisser telle quelle
    if (url.startsWith('/api/platform/make/api/')) {
      return url;
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        // Ne pas transformer si c'est déjà une URL vers /api/platform/make/api/
        if (urlObj.pathname.includes('/api/platform/make/api/')) {
          // Extraire juste le chemin pour utiliser la nouvelle route
          return urlObj.pathname + (urlObj.search || '');
        }
        return proxyBase + urlObj.pathname + (urlObj.search || '');
      } catch {
        // Ne pas transformer si c'est déjà vers /api/platform/make/api/
        if (url.includes('/api/platform/make/api/')) {
          const pathStart = url.indexOf('/api/platform/make/api/');
          return url.substring(pathStart);
        }
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
    if (typeof url === 'string') {
      // NE PLUS transformer /api/platform/make/api/... - laisser passer directement
      // Ces URLs seront gérées par /api/platform/make/api/[...path]
      if (url.includes('/api/platform/make/api/')) {
        // Laisser la requête passer directement sans interception
        return originalFetch.call(this, url, options);
      }
      if (shouldProxy(url)) {
        const proxyUrl = toProxyUrl(url);
        console.log('[Make Proxy Interception] ✅ fetch intercepté:', url, '->', proxyUrl);
        const modifiedOptions = { ...options, credentials: 'include', headers: { ...(options.headers || {}) } };
        if (authToken) {
          modifiedOptions.headers['Authorization'] = 'Bearer ' + authToken;
          modifiedOptions.headers['X-Supabase-Auth-Token'] = authToken;
        }
        return originalFetch.call(this, proxyUrl, modifiedOptions);
      }
    }
    return originalFetch.call(this, url, options);
  };
  
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    const args = Array.prototype.slice.call(arguments, 2);
    if (typeof url === 'string') {
      // NE PLUS transformer /api/platform/make/api/... - laisser passer directement
      // Ces URLs seront gérées par /api/platform/make/api/[...path]
      if (url.includes('/api/platform/make/api/')) {
        // Laisser la requête passer directement sans interception
        return originalOpen.apply(this, arguments);
      }
      if (shouldProxy(url)) {
        this._makeProxyUrl = toProxyUrl(url);
        console.log('[Make Proxy Interception] ✅ XHR intercepté:', url, '->', this._makeProxyUrl);
        return originalOpen.apply(this, [method, this._makeProxyUrl].concat(args));
      }
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
      
      // CSP complet qui autorise JavaScript, Cloudflare, et le framing
      // CRITIQUE: Autoriser JavaScript pour résoudre le challenge Cloudflare
      const cspHeader = [
        "frame-ancestors 'self' https://www.talosprimes.com",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.make.com https://*.cdn.make.com https://challenges.cloudflare.com https://*.cloudflare.com",
        "connect-src 'self' https://*.make.com https://*.eu1.make.com wss://*.make.com https://challenges.cloudflare.com https://*.cloudflare.com https://cdn-cgi.challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://*.make.com https://*.cdn.make.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https:",
        "frame-src 'self' https://*.make.com https://challenges.cloudflare.com"
      ].join('; ')
      responseHeaders.set('Content-Security-Policy', cspHeader)
      
      // Gérer les cookies Set-Cookie
      // CRITIQUE: Les cookies Cloudflare (__cf_bm, cf_clearance) doivent être transmis même avec domain Make.com
      const setCookieHeaders = response.headers.getSetCookie()
      const nextResponse = new NextResponse(modifiedHtml, {
        status: response.status,
        headers: responseHeaders,
      })
      
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          // Vérifier si c'est un cookie Cloudflare (nécessaire pour le challenge)
          // IMPORTANT: Cloudflare utilise _cf_bm (un underscore) et __cf_bm (deux underscores)
          const isCloudflareCookie = cookie.includes('_cf_bm') || 
                                    cookie.includes('__cf_bm') ||
                                    cookie.includes('cf_clearance') ||
                                    cookie.includes('cf_ob_info') ||
                                    cookie.includes('cf_use_ob')
          
          const domainMatch = cookie.match(/Domain=([^;]+)/i)
          const hasMakeDomain = domainMatch && (
            domainMatch[1].toLowerCase().includes('.make.com') ||
            domainMatch[1].toLowerCase().includes('make.com')
          )
          
          // Transmettre les cookies Cloudflare même avec domain Make.com
          if (isCloudflareCookie) {
            console.log(`[Make Proxy Catch-all] ✅ Cookie Cloudflare transmis: ${cookie.substring(0, 100)}`)
            // Modifier le cookie pour qu'il fonctionne sur notre domaine
            const modifiedCookie = cookie
              .replace(/;\s*Domain=\.?[^;]+/gi, '')
              .replace(/;\s*Domain=make\.com/gi, '')
              .replace(/;\s*Domain=eu1\.make\.com/gi, '')
            nextResponse.headers.append('Set-Cookie', modifiedCookie)
          } else if (!hasMakeDomain) {
            // Transmettre les autres cookies sans domaine Make.com
            nextResponse.headers.append('Set-Cookie', cookie)
          } else {
            console.log(`[Make Proxy Catch-all] 🚫 Filtering Set-Cookie with incompatible domain: ${cookie.substring(0, 100)}`)
          }
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
    
    // Gérer les cookies Set-Cookie (pour les réponses non-HTML aussi)
    // CRITIQUE: Les cookies Cloudflare doivent être transmis même avec domain Make.com
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        // Vérifier si c'est un cookie Cloudflare
        const isCloudflareCookie = cookie.includes('__cf_bm') || 
                                  cookie.includes('cf_clearance') ||
                                  cookie.includes('cf_ob_info') ||
                                  cookie.includes('cf_use_ob')
        
        const domainMatch = cookie.match(/Domain=([^;]+)/i)
        const hasMakeDomain = domainMatch && (
          domainMatch[1].toLowerCase().includes('.make.com') ||
          domainMatch[1].toLowerCase().includes('make.com')
        )
        
        // Transmettre les cookies Cloudflare même avec domain Make.com
        if (isCloudflareCookie) {
          console.log(`[Make Proxy Catch-all] ✅ Cookie Cloudflare transmis (non-HTML): ${cookie.substring(0, 100)}`)
          const modifiedCookie = cookie
            .replace(/;\s*Domain=\.?[^;]+/gi, '')
            .replace(/;\s*Domain=make\.com/gi, '')
            .replace(/;\s*Domain=eu1\.make\.com/gi, '')
          nextResponse.headers.append('Set-Cookie', modifiedCookie)
        } else if (!hasMakeDomain) {
          nextResponse.headers.append('Set-Cookie', cookie)
        } else {
          console.log(`[Make Proxy Catch-all] 🚫 Filtering Set-Cookie with incompatible domain: ${cookie.substring(0, 100)}`)
        }
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
  
  // Construire l'URL Make AVANT toute vérification pour déterminer si c'est une page publique
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  
  let makeUrl: string
  try {
    const makeUrlObj = new URL(MAKE_URL)
    if (makePath === '/') {
      makeUrl = MAKE_URL
    } else {
      const basePath = makeUrlObj.pathname
      makeUrl = `${makeUrlObj.origin}${basePath}${makePath}`
    }
    makeUrl += queryString ? `?${queryString}` : ''
  } catch {
    makeUrl = `${MAKE_URL}${makePath}${queryString ? `?${queryString}` : ''}`
  }
  
  // Vérifier si c'est une page publique Make.com
  const isPublicPage = makeUrl.includes('www.make.com/en') || 
                       makeUrl.includes('make.com/en') ||
                       makeUrl.includes('/en/login') ||
                       makeUrl.includes('/en/signup') ||
                       makeUrl.includes('/en/') ||
                       MAKE_URL.includes('www.make.com/en') ||
                       MAKE_URL.includes('/en/login')
  
  // Pour les pages publiques, ne pas vérifier l'authentification
  if (!isPublicPage) {
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      // Si c'est une erreur d'authentification (pas de session), retourner 401 au lieu de 403
      if (error?.includes('Not authenticated') || error?.includes('Please log in')) {
        return NextResponse.json(
          { error: 'Authentication required. Please log in.', details: error },
          { status: 401, headers: getCorsHeaders(request.headers.get('origin')) }
        )
      }
      
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }
  }

  const configCheck = checkMakeConfig()
  if (!configCheck.valid) {
    return NextResponse.json(
      { error: 'Configuration Make invalide', details: configCheck.error },
      { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
    )
  }
  
  const body = await request.text()
  // Pour les pages publiques Make.com, ne pas envoyer de cookies de session
  const requestCookies = isPublicPage ? undefined : (request.headers.get('cookie') || '')
  
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
    
    // Filtrer et transmettre uniquement les cookies Set-Cookie compatibles avec notre domaine
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      const filteredSetCookieHeaders = setCookieHeaders.filter(cookie => {
        const domainMatch = cookie.match(/Domain=([^;]+)/i)
        if (domainMatch) {
          const domain = domainMatch[1].toLowerCase()
          if (domain.includes('.make.com')) {
            console.log(`[Make Proxy Catch-all POST] 🚫 Filtering Set-Cookie with incompatible domain: ${cookie}`)
            return false
          }
        }
        return true
      })
      
      filteredSetCookieHeaders.forEach(cookie => {
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

