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
 * Gestion des requêtes OPTIONS (preflight CORS)
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin')),
  })
}

/**
 * Route proxy racine pour Make.com
 * Gère les requêtes vers /api/platform/make/proxy (sans chemin)
 */
export async function GET(request: NextRequest) {
  // Log immédiatement pour confirmer que la fonction est appelée
  try {
    console.log('[Make Proxy Root] ========== GET request received ==========')
    console.log('[Make Proxy Root] URL:', request.url)
    console.log('[Make Proxy Root] Method:', request.method)
    console.log('[Make Proxy Root] Headers:', {
      host: request.headers.get('host'),
      cookie: request.headers.get('cookie') ? 'present' : 'missing',
      authorization: request.headers.get('authorization') ? 'present' : 'missing',
    })
  } catch (logError) {
    // Même les logs peuvent échouer, donc on continue
    console.error('[Make Proxy Root] Error in initial logging:', logError)
  }
  
  try {
    // Vérifier que l'utilisateur est un admin plateforme
    console.log('[Make Proxy Root] Verifying platform user...')
    const { isPlatform, error } = await verifyPlatformUser(request)
    console.log('[Make Proxy Root] Platform user verification result:', { isPlatform, error })
    
    if (!isPlatform || error) {
      console.log('[Make Proxy Root] Unauthorized:', error)
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    // Vérifier la configuration Make
    console.log('[Make Proxy Root] Checking Make config...')
    const configCheck = checkMakeConfig()
    if (!configCheck.valid) {
      console.error('[Make Proxy Root] Invalid Make config:', configCheck.error)
      return NextResponse.json(
        { error: 'Configuration Make invalide', details: configCheck.error },
        { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    // Construire l'URL Make (racine)
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const makeUrl = `${MAKE_URL}${queryString ? `?${queryString}` : ''}`
    console.log('[Make Proxy Root] Proxying to Make URL:', makeUrl)
    
    // Extraire les cookies de session Make
    const requestCookies = request.headers.get('cookie') || ''
    
    try {
      console.log('[Make Proxy Root] Starting proxy request...')
      const response = await proxyMakeRequest(makeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
          'Accept': request.headers.get('accept') || '*/*',
          'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9',
        },
      }, requestCookies || undefined)
      
      // Log IMMÉDIATEMENT après le await pour s'assurer qu'on arrive ici
      console.log('[Make Proxy Root] ========== proxyMakeRequest RETURNED ==========')
      console.log('[Make Proxy Root] Response object:', {
        status: response?.status,
        statusText: response?.statusText,
        hasHeaders: !!response?.headers,
        hasBody: !!response?.body,
      })
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      console.log('[Make Proxy Root] Content-Type:', contentType)
      
      // Pour le HTML, réécrire les URLs
      if (contentType.includes('text/html')) {
        console.log('[Make Proxy Root] Processing HTML response...')
        let htmlData: string
        try {
          console.log('[Make Proxy Root] Reading response text...')
          htmlData = await response.text()
          console.log('[Make Proxy Root] HTML data read, length:', htmlData.length)
        
        // Vérifier si le HTML contient des redirections vers www.make.com
        if (htmlData.includes('www.make.com')) {
          console.warn('[Make Proxy Root] ⚠️ HTML contient des références à www.make.com')
          const wwwMakeMatches = htmlData.match(/www\.make\.com[^"'\s]*/g)
          if (wwwMakeMatches) {
            console.warn('[Make Proxy Root] Références trouvées:', wwwMakeMatches.slice(0, 5))
          }
        }
        
        // Vérifier les balises base
        const baseMatches = htmlData.match(/<base[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi)
        if (baseMatches) {
          console.warn('[Make Proxy Root] ⚠️ Balises <base> trouvées:', baseMatches)
        }
        
        // Vérifier les redirections JavaScript
        const jsRedirectMatches = htmlData.match(/window\.location\s*[=\.]|location\.href\s*=|location\.replace|location\.assign/gi)
        if (jsRedirectMatches) {
          console.warn('[Make Proxy Root] ⚠️ Redirections JavaScript trouvées:', jsRedirectMatches.slice(0, 5))
        }
        } catch (error) {
          console.error('[Make Proxy Root] Erreur lors de la lecture du HTML:', error)
          return NextResponse.json(
            { error: 'Erreur lors de la lecture de la réponse Make.com' },
            { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
          )
        }
        
        console.log('[Make Proxy Root] Building base URL and proxy config...')
        const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const baseUrl = host 
          ? `${protocol}://${host}`
          : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com')
        console.log('[Make Proxy Root] Base URL:', baseUrl)
        
        const proxyBase = `/api/platform/make/proxy`
        let makeHost: string
        try {
          makeHost = new URL(MAKE_URL).hostname
          console.log('[Make Proxy Root] Make host:', makeHost)
        } catch (error) {
          console.error('[Make Proxy Root] Erreur lors du parsing de MAKE_URL:', error, MAKE_URL)
          return NextResponse.json(
            { error: 'Configuration Make invalide: URL mal formée' },
            { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
          )
        }
        
        // Récupérer le token JWT depuis la session Supabase
        console.log('[Make Proxy Root] Getting auth token...')
        let authToken = ''
        try {
          console.log('[Make Proxy Root] Creating Supabase client...')
          const supabase = await createServerClient(request)
          console.log('[Make Proxy Root] Supabase client created, calling getSession()...')
          const { data: { session } } = await supabase.auth.getSession()
          console.log('[Make Proxy Root] getSession() completed, session:', session ? 'exists' : 'null')
          authToken = session?.access_token || ''
          console.log('[Make Proxy Root] Auth token retrieved:', authToken ? 'present' : 'missing')
        } catch (error) {
          console.error('[Make Proxy Root] Failed to get session token:', error)
          console.error('[Make Proxy Root] Error details:', error instanceof Error ? error.message : String(error))
        }
        
        console.log('[Make Proxy Root] Escaping auth token...')
        // Échapper le token pour le script (gérer le cas où authToken est vide)
        const escapedAuthToken = (authToken || '').replace(/'/g, "\\'").replace(/\\/g, "\\\\")
        console.log('[Make Proxy Root] Auth token escaped, length:', escapedAuthToken.length)
        
        // Remplacer les URLs par des URLs proxy (sauf fichiers statiques)
        console.log('[Make Proxy Root] Replacing URLs in HTML...')
        console.log('[Make Proxy Root] HTML length before replacement:', htmlData.length)
        const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp']
        
        // SUPPRIMER complètement les balises <base href>
        // Les balises <base> causent des problèmes de résolution d'URL et créent des duplications
        // Nous réécrivons déjà toutes les URLs dans le HTML, donc pas besoin de <base>
        let modifiedHtml = htmlData.replace(
          /<base\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
          (match, href) => {
            console.log('[Make Proxy Root] 🔍 Balise <base> trouvée avec href:', href)
            console.log('[Make Proxy Root] ✅ Suppression de <base> (les URLs sont déjà réécrites)')
            return '<!-- base href removed to prevent URL duplication -->'
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
        console.log('[Make Proxy Root] URLs replaced in HTML, new length:', modifiedHtml.length)
        
        // Injecter le script d'interception pour les requêtes fetch/XHR
        console.log('[Make Proxy Root] Creating interception script...')
        // Échapper correctement toutes les variables pour éviter les erreurs de syntaxe JavaScript
        const escapedProxyBase = (baseUrl + proxyBase).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
        const escapedMakeHost = makeHost.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
        
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
    
    // Corriger les URLs mal formées qui manquent /proxy
    // Par exemple: /api/platform/make/api/v2/... -> /api/platform/make/proxy/api/v2/...
    if (url.includes('/api/platform/make/api/')) {
      return true;
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
      // Corriger aussi les URLs absolues mal formées
      if (urlObj.pathname.includes('/api/platform/make/api/')) {
        return true;
      }
    } catch {
      if (url.includes('.make.com') || url.includes(makeHost)) {
        return true;
      }
      if (url.includes('/api/platform/make/api/')) {
        return true;
      }
    }
    
    return false;
  }
  
  function toProxyUrl(url) {
    // Corriger les URLs mal formées qui manquent /proxy
    // Par exemple: /api/platform/make/api/v2/... -> /api/platform/make/proxy/api/v2/...
    if (url.includes('/api/platform/make/api/')) {
      url = url.replace('/api/platform/make/api/', '/api/platform/make/proxy/api/');
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        // Corriger aussi dans le pathname si nécessaire
        if (urlObj.pathname.includes('/api/platform/make/api/')) {
          urlObj.pathname = urlObj.pathname.replace('/api/platform/make/api/', '/api/platform/make/proxy/api/');
        }
        return proxyBase + urlObj.pathname + (urlObj.search || '');
      } catch {
        // Corriger dans l'URL brute
        if (url.includes('/api/platform/make/api/')) {
          url = url.replace('/api/platform/make/api/', '/api/platform/make/proxy/api/');
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
      const originalUrl = url;
      // Corriger les URLs mal formées qui manquent /proxy AVANT shouldProxy
      if (url.includes('/api/platform/make/api/')) {
        url = url.replace('/api/platform/make/api/', '/api/platform/make/proxy/api/');
        console.log('[Make Proxy Interception] 🔧 URL corrigée (fetch):', originalUrl, '->', url);
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
      const originalUrl = url;
      // Corriger les URLs mal formées qui manquent /proxy AVANT shouldProxy
      if (url.includes('/api/platform/make/api/')) {
        url = url.replace('/api/platform/make/api/', '/api/platform/make/proxy/api/');
        console.log('[Make Proxy Interception] 🔧 URL corrigée (XHR):', originalUrl, '->', url);
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
        
        // Injecter le script juste avant </body> ou à la fin du HTML
        console.log('[Make Proxy Root] Injecting interception script...')
        modifiedHtml = modifiedHtml.replace('</body>', interceptionScript + '</body>')
        if (!modifiedHtml.includes(interceptionScript)) {
          modifiedHtml += interceptionScript
        }
        console.log('[Make Proxy Root] HTML modified, new length:', modifiedHtml.length)
        
        // Créer la réponse avec les headers modifiés
        console.log('[Make Proxy Root] Creating NextResponse...')
        
        // Ne copier que les headers nécessaires (comme dans N8N)
        // Ne pas copier tous les headers car certains peuvent être incompatibles (Content-Length, Transfer-Encoding, etc.)
        const setCookieHeaders = response.headers.getSetCookie()
        console.log('[Make Proxy Root] Set-Cookie headers count:', setCookieHeaders?.length || 0)
        
        const nextResponse = new NextResponse(modifiedHtml, {
          status: response.status,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Security-Policy': "frame-ancestors 'self' https://www.talosprimes.com",
            ...getCorsHeaders(request.headers.get('origin')),
          },
        })
        
        // Transmettre les cookies Set-Cookie de Make
        if (setCookieHeaders && setCookieHeaders.length > 0) {
          setCookieHeaders.forEach(cookie => {
            nextResponse.headers.append('Set-Cookie', cookie)
          })
        }
        
        console.log('[Make Proxy Root] Returning NextResponse with status:', nextResponse.status)
        return nextResponse
      }

      // Pour les autres types de contenu, retourner directement
      console.log('[Make Proxy Root] Non-HTML response, returning as-is...')
      
      // Ne copier que les headers nécessaires
      const setCookieHeaders = response.headers.getSetCookie()
      const nextResponse = new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...getCorsHeaders(request.headers.get('origin')),
        },
      })
      
      // Transmettre les cookies Set-Cookie
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          nextResponse.headers.append('Set-Cookie', cookie)
        })
      }
      
      console.log('[Make Proxy Root] Returning NextResponse (non-HTML) with status:', nextResponse.status)
      return nextResponse
    } catch (error) {
      console.error('[Make Proxy Root] Erreur:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined
      
      // Logger les détails pour le debug
      console.error('[Make Proxy Root] Détails erreur:', {
        message: errorMessage,
        stack: errorStack,
        url: makeUrl,
        hasCookies: !!requestCookies,
      })
      
      return NextResponse.json(
        { 
          error: 'Erreur lors du proxy vers Make.com',
          details: errorMessage,
          url: makeUrl,
        },
        { 
          status: 500,
          headers: getCorsHeaders(request.headers.get('origin')),
        }
      )
    }
  } catch (earlyError) {
    // Erreur dans verifyPlatformUser ou checkMakeConfig
    console.error('[Make Proxy Root] Erreur précoce:', earlyError)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification d\'autorisation',
        details: earlyError instanceof Error ? earlyError.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: getCorsHeaders(request.headers.get('origin'))
      }
    )
  }
}
