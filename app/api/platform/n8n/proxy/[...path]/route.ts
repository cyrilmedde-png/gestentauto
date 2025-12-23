import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticatedUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, getN8NAuthHeaders, proxyN8NRequest } from '@/lib/services/n8n'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route API proxy catch-all pour N8N avec authentification automatique
 * Capture tous les chemins : /api/platform/n8n/proxy/assets/... /api/platform/n8n/proxy/api/... etc.
 * Accessible à tous les utilisateurs authentifiés (plateforme et clients)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // NE PAS récupérer userId depuis query params
  // Utiliser uniquement la session Supabase pour identifier l'utilisateur
  // verifyAuthenticatedUser récupérera automatiquement l'utilisateur depuis la session
  
  // Attendre les params (Next.js 16)
  const resolvedParams = await params
  
  // Construire le chemin N8N depuis les paramètres de route
  const n8nPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/${resolvedParams.path.join('/')}` 
    : '/'
  
  // Pour /rest/login, on permet l'accès SANS vérification d'authentification
  // N8N gère sa propre authentification via cette route
  const isRestLogin = n8nPath === '/rest/login' || n8nPath.startsWith('/rest/login')
  
  // Log pour déboguer
  console.log('[N8N Proxy Catch-all] Request:', {
    url: request.url,
    hasCookies: !!request.headers.get('cookie'),
    path: resolvedParams.path,
    n8nPath,
    isRestLogin,
  })
  
  // Vérifier que l'utilisateur est authentifié (plateforme ou client) SAUF pour /rest/login
  if (!isRestLogin) {
    const { isAuthenticated, error } = await verifyAuthenticatedUser(request)
    
    if (!isAuthenticated || error) {
      console.error('[N8N Proxy Catch-all] Auth failed:', {
        isAuthenticated,
        error,
        hasCookies: !!request.headers.get('cookie'),
        url: request.url,
        n8nPath,
      })
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required', details: error },
        { status: 401 }
      )
    }
  } else {
    console.log('[N8N Proxy Catch-all] Allowing /rest/login WITHOUT auth check - N8N will handle authentication')
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error('[N8N Proxy Catch-all] Configuration invalide:', configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error,
        hint: 'Vérifiez que N8N_URL, N8N_BASIC_AUTH_USER et N8N_BASIC_AUTH_PASSWORD sont configurés'
      },
      { status: 500 }
    )
  }

  // Récupérer les query params de l'URL (pour les passer à N8N, mais sans userId)
  const { searchParams } = new URL(request.url)
  
  // Construire l'URL N8N complète (enlever userId des query params si présent)
  const queryString = searchParams.toString()
    .replace(/userId=[^&]*&?/g, '')
    .replace(/&$/, '')
  const n8nUrl = `${N8N_URL}${n8nPath}${queryString ? `?${queryString}` : ''}`
  
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
      
      // Calculer les valeurs AVANT de les utiliser dans le template string
      const n8nHostValue = new URL(N8N_URL).hostname
      const proxyBaseValue = `${baseUrl}${proxyBase}`
      
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
          
          // URLs relatives - construire le chemin complet
          const currentPath = resolvedParams.path && resolvedParams.path.length > 0 ? resolvedParams.path.join('/') : ''
          const relativePath = currentPath ? `${currentPath}/${url}` : url
          return `${attr}="${baseUrl}${proxyBase}/${relativePath}"`
        }
      )
      
      // Injecter un script pour intercepter les requêtes fetch et XMLHttpRequest
      // CORRECTION: Créer le script JavaScript en utilisant une concaténation de chaînes pour éviter tous les problèmes d'échappement
      const interceptScript = '<script>\n' +
        '(function() {\n' +
        '  var proxyBase = ' + JSON.stringify(proxyBaseValue) + ';\n' +
        '  var n8nHost = ' + JSON.stringify(n8nHostValue) + ';\n' +
        '  console.log("[N8N Proxy] Script interception charge");\n' +
        '  \n' +
        '  function shouldProxy(url) {\n' +
        '    if (url.indexOf("/api/platform/n8n/proxy") !== -1) return false;\n' +
        '    if (url.indexOf("/rest/") !== -1 || url.indexOf("/assets/") !== -1) return true;\n' +
        '    if (url.indexOf("/rest") === 0 || url.indexOf("/assets") === 0) return true;\n' +
        '    try {\n' +
        '      var urlObj = new URL(url, window.location.href);\n' +
        '      var currentHost = window.location.hostname;\n' +
        '      if (urlObj.hostname === currentHost || urlObj.hostname === n8nHost || \n' +
        '          urlObj.hostname === "www.talosprimes.com" || urlObj.hostname === "talosprimes.com" ||\n' +
        '          urlObj.hostname.indexOf(".talosprimes.com") === urlObj.hostname.length - 17) {\n' +
        '        if (urlObj.pathname.indexOf("/rest") === 0 || urlObj.pathname.indexOf("/assets") === 0) return true;\n' +
        '        return url.indexOf("/") === 0 || urlObj.hostname === currentHost;\n' +
        '      }\n' +
        '      return url.indexOf("/") === 0;\n' +
        '    } catch(e) {\n' +
        '      return url.indexOf("/rest") === 0 || url.indexOf("/assets") === 0 || url.indexOf("/") === 0;\n' +
        '    }\n' +
        '  }\n' +
        '  \n' +
        '  function toProxyUrl(url) {\n' +
        '    try {\n' +
        '      if (url.indexOf("/") === 0) return proxyBase + url;\n' +
        '      var urlObj = new URL(url, window.location.href);\n' +
        '      return proxyBase + urlObj.pathname + urlObj.search;\n' +
        '    } catch(e) { return url; }\n' +
        '  }\n' +
        '  \n' +
        '  var originalFetch = window.fetch;\n' +
        '  window.fetch = function(url, options) {\n' +
        '    options = options || {};\n' +
        '    if (typeof url === "string" && shouldProxy(url)) {\n' +
        '      var proxyUrl = toProxyUrl(url);\n' +
        '      var modifiedOptions = {\n' +
        '        credentials: "include",\n' +
        '        headers: options.headers || {}\n' +
        '      };\n' +
        '      for (var key in options) {\n' +
        '        if (key !== "headers" && key !== "credentials") modifiedOptions[key] = options[key];\n' +
        '      }\n' +
        '      if (window.__N8N_AUTH_TOKEN__) {\n' +
        '        modifiedOptions.headers["Authorization"] = "Bearer " + window.__N8N_AUTH_TOKEN__;\n' +
        '        modifiedOptions.headers["X-Supabase-Auth-Token"] = window.__N8N_AUTH_TOKEN__;\n' +
        '      }\n' +
        '      return originalFetch.call(this, proxyUrl, modifiedOptions);\n' +
        '    }\n' +
        '    return originalFetch.call(this, url, options);\n' +
        '  };\n' +
        '  \n' +
        '  var originalOpen = XMLHttpRequest.prototype.open;\n' +
        '  var originalSend = XMLHttpRequest.prototype.send;\n' +
        '  var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;\n' +
        '  XMLHttpRequest.prototype.open = function(method, url) {\n' +
        '    var args = Array.prototype.slice.call(arguments, 2);\n' +
        '    if (typeof url === "string" && shouldProxy(url)) {\n' +
        '      this._n8nProxyUrl = toProxyUrl(url);\n' +
        '      return originalOpen.apply(this, [method, this._n8nProxyUrl].concat(args));\n' +
        '    }\n' +
        '    return originalOpen.apply(this, arguments);\n' +
        '  };\n' +
        '  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {\n' +
        '    if (!this._n8nHeaders) this._n8nHeaders = {};\n' +
        '    this._n8nHeaders[header] = value;\n' +
        '    return originalSetRequestHeader.call(this, header, value);\n' +
        '  };\n' +
        '  XMLHttpRequest.prototype.send = function() {\n' +
        '    var args = Array.prototype.slice.call(arguments);\n' +
        '    if (this._n8nProxyUrl) {\n' +
        '      this.withCredentials = true;\n' +
        '      if (window.__N8N_AUTH_TOKEN__) {\n' +
        '        var existingAuth = (this._n8nHeaders && this._n8nHeaders["Authorization"]) || \n' +
        '                          (this._n8nHeaders && this._n8nHeaders["authorization"]);\n' +
        '        if (!existingAuth) {\n' +
        '          this.setRequestHeader("Authorization", "Bearer " + window.__N8N_AUTH_TOKEN__);\n' +
        '          this.setRequestHeader("X-Supabase-Auth-Token", window.__N8N_AUTH_TOKEN__);\n' +
        '        }\n' +
        '      }\n' +
        '      delete this._n8nProxyUrl;\n' +
        '      delete this._n8nHeaders;\n' +
        '    }\n' +
        '    return originalSend.apply(this, args);\n' +
        '  };\n' +
        '})();\n' +
        '</script>\n'
      
      // Injecter le script de manière synchrone AVANT tout autre script
      // Utiliser une injection plus agressive pour s'assurer qu'il s'exécute en premier
      if (modifiedHtml.includes('</head>')) {
        // Injecter juste avant </head> pour s'assurer qu'il est chargé tôt
        modifiedHtml = modifiedHtml.replace(
          /(<\/head>)/i,
          `${interceptScript}$1`
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
    console.error('[N8N Proxy Catch-all] Error proxying N8N request:', error)
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // NE PAS récupérer userId depuis query params
  // Utiliser uniquement la session Supabase pour identifier l'utilisateur
  
  // Attendre les params (Next.js 16)
  const resolvedParams = await params

  const n8nPath = resolvedParams.path && resolvedParams.path.length > 0 
    ? `/${resolvedParams.path.join('/')}` 
    : '/'
  
  // Pour /rest/login, on permet l'accès SANS vérification d'authentification
  const isRestLogin = n8nPath === '/rest/login' || n8nPath.startsWith('/rest/login')
  
  // Vérifier que l'utilisateur est authentifié (plateforme ou client) SAUF pour /rest/login
  if (!isRestLogin) {
    const { isAuthenticated, error } = await verifyAuthenticatedUser(request)
    
    if (!isAuthenticated || error) {
      console.error('[N8N Proxy Catch-all POST] Auth failed:', {
        isAuthenticated,
        error,
        hasCookies: !!request.headers.get('cookie'),
        url: request.url,
        n8nPath,
      })
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required', details: error },
        { status: 401 }
      )
    }
  } else {
    console.log('[N8N Proxy Catch-all POST] Allowing /rest/login WITHOUT auth check - N8N will handle authentication')
  }

  // Vérifier la configuration N8N
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error('[N8N Proxy Catch-all POST] Configuration invalide:', configCheck.error)
    return NextResponse.json(
      { 
        error: 'Configuration N8N invalide',
        details: configCheck.error
      },
      { status: 500 }
    )
  }
  const n8nUrl = `${N8N_URL}${n8nPath}`
  
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
    console.error('[N8N Proxy Catch-all POST] Error proxying N8N request:', error)
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

