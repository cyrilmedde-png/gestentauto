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
  try {
    // Vérifier que l'utilisateur est un admin plateforme
    const { isPlatform, error } = await verifyPlatformUser(request)
    
    if (!isPlatform || error) {
      return NextResponse.json(
        { error: 'Unauthorized - Platform admin access required', details: error },
        { status: 403, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    // Vérifier la configuration Make
    const configCheck = checkMakeConfig()
    if (!configCheck.valid) {
      return NextResponse.json(
        { error: 'Configuration Make invalide', details: configCheck.error },
        { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
      )
    }

    // Construire l'URL Make (racine)
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const makeUrl = `${MAKE_URL}${queryString ? `?${queryString}` : ''}`
    
    // Extraire les cookies de session Make
    const requestCookies = request.headers.get('cookie') || ''
    
    try {
      const response = await proxyMakeRequest(makeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': request.headers.get('user-agent') || 'TalosPrime-Platform',
          'Accept': request.headers.get('accept') || '*/*',
          'Accept-Language': request.headers.get('accept-language') || 'fr-FR,fr;q=0.9',
        },
      }, requestCookies || undefined)

      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      
      // Pour le HTML, réécrire les URLs
      if (contentType.includes('text/html')) {
        let htmlData: string
        try {
          htmlData = await response.text()
        } catch (error) {
          console.error('[Make Proxy Root] Erreur lors de la lecture du HTML:', error)
          return NextResponse.json(
            { error: 'Erreur lors de la lecture de la réponse Make.com' },
            { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
          )
        }
        
        const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const baseUrl = host 
          ? `${protocol}://${host}`
          : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com')
        
        const proxyBase = `/api/platform/make/proxy`
        let makeHost: string
        try {
          makeHost = new URL(MAKE_URL).hostname
        } catch (error) {
          console.error('[Make Proxy Root] Erreur lors du parsing de MAKE_URL:', error, MAKE_URL)
          return NextResponse.json(
            { error: 'Configuration Make invalide: URL mal formée' },
            { status: 500, headers: getCorsHeaders(request.headers.get('origin')) }
          )
        }
        
        // Récupérer le token JWT depuis la session Supabase
        let authToken = ''
        try {
          const supabase = await createServerClient(request)
          const { data: { session } } = await supabase.auth.getSession()
          authToken = session?.access_token || ''
        } catch (error) {
          console.warn('[Make Proxy Root] Failed to get session token:', error)
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
        
        // Injecter le script d'interception pour les requêtes fetch/XHR
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
    
    // URLs relatives vers Make
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }
    
    // URLs absolues vers Make.com
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
})();
</script>`
        
        // Injecter le script juste avant </body> ou à la fin du HTML
        modifiedHtml = modifiedHtml.replace('</body>', interceptionScript + '</body>')
        if (!modifiedHtml.includes(interceptionScript)) {
          modifiedHtml += interceptionScript
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

      // Pour les autres types de contenu, retourner directement
      const responseHeaders = new Headers(response.headers)
      responseHeaders.delete('content-security-policy')
      responseHeaders.delete('x-frame-options')
      
      // Transmettre les cookies Set-Cookie
      const setCookieHeaders = response.headers.getSetCookie()
      const nextResponse = new NextResponse(response.body, {
        status: response.status,
        headers: responseHeaders,
      })
      
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        setCookieHeaders.forEach(cookie => {
          nextResponse.headers.append('Set-Cookie', cookie)
        })
      }
      
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
