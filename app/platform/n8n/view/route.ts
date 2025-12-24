import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'
import { checkN8NConfig, testN8NConnection } from '@/lib/services/n8n'
import { createServerClient } from '@/lib/supabase/server'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'

/**
 * Route qui sert une page HTML avec iframe N8N et authentification SSO automatique
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est un admin plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform || authError) {
      const errorHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accès refusé - N8N</title>
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
    h1 { color: #ef4444; margin-bottom: 20px; }
    p { color: #9ca3af; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="error">
    <h1>Accès refusé</h1>
    <p>Vous devez être un administrateur plateforme pour accéder à N8N.</p>
    <p>${authError || 'Authentification requise'}</p>
  </div>
</body>
</html>`
      return new NextResponse(errorHtml, {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Vérifier la configuration N8N
    const configCheck = checkN8NConfig()
    if (!configCheck.valid) {
      const errorHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Configuration N8N invalide</title>
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
    .error { text-align: center; padding: 20px; max-width: 600px; }
    h1 { color: #ef4444; }
  </style>
</head>
<body>
  <div class="error">
    <h1>Configuration N8N invalide</h1>
    <p>${configCheck.error}</p>
  </div>
</body>
</html>`
      return new NextResponse(errorHtml, {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Récupérer le token JWT depuis la session Supabase
    const supabase = await createServerClient(request)
    const { data: { session } } = await supabase.auth.getSession()
    const jwtToken = session?.access_token || null

    // Construire l'URL proxy pour N8N
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = host 
      ? `${protocol}://${host}`
      : (process.env.NEXT_PUBLIC_APP_URL || 'https://www.talosprimes.com')
    
    const proxyUrl = `${baseUrl}/api/platform/n8n/proxy`

    // HTML avec iframe et script d'interception
    const html = `
<!DOCTYPE html>
<html lang="fr">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>N8N - Automatisation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; }
    #n8n-iframe {
      width: 100%;
      height: 100vh;
      border: none;
    }
  </style>
  <script>
    // Injecter le token JWT pour l'authentification SSO
    ${jwtToken ? `window.__N8N_AUTH_TOKEN__ = '${jwtToken}';` : ''}
    
    // Script d'interception pour proxy les requêtes N8N
    // DOIT être dans <head> pour être exécuté avant que N8N ne charge
    (function() {
      const proxyBase = '${proxyUrl}';
      const n8nUrl = '${N8N_URL}';
      const n8nHost = new URL(n8nUrl).hostname;
      
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
        
        // EXCLUSION PRIORITAIRE : Ne JAMAIS proxifier les domaines externes
        // Vérifier d'abord par string pour éviter les erreurs de parsing
        const urlLower = url.toLowerCase();
        for (const domain of externalDomains) {
          if (urlLower.includes(domain.toLowerCase())) {
            return false;
          }
        }
        
        // URLs relatives vers N8N (inclut /rest/telemetry/..., /icons/...)
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
          if (hostname === n8nHost || hostname === 'n8n.talosprimes.com') {
            return true;
          }
          
          // Proxifier les sous-domaines talosprimes.com sauf les domaines externes
          if (hostname.endsWith('.talosprimes.com')) {
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
            // Utiliser new RegExp() au lieu d'une regex littérale pour éviter les problèmes d'échappement
            try {
              const urlPattern = new RegExp('https?:\\/\\/[^\\/]+(\\/.*)');
              const match = url.match(urlPattern);
              if (match) {
                return proxyBase + match[1];
              }
            } catch (regexError) {
              // Si la regex échoue, essayer d'extraire le chemin manuellement
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
        // URLs relatives
        return proxyBase + (url.startsWith('/') ? url : '/' + url);
      }
      
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
          if (window.__N8N_AUTH_TOKEN__) {
            modifiedOptions.headers['Authorization'] = 'Bearer ' + window.__N8N_AUTH_TOKEN__;
            modifiedOptions.headers['X-Supabase-Auth-Token'] = window.__N8N_AUTH_TOKEN__;
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
          if (window.__N8N_AUTH_TOKEN__) {
            const existingAuth = (this._n8nHeaders && this._n8nHeaders['Authorization']) || 
                                  (this._n8nHeaders && this._n8nHeaders['authorization']);
            if (!existingAuth) {
              this.setRequestHeader('Authorization', 'Bearer ' + window.__N8N_AUTH_TOKEN__);
              this.setRequestHeader('X-Supabase-Auth-Token', window.__N8N_AUTH_TOKEN__);
            }
          }
          delete this._n8nProxyUrl;
          delete this._n8nHeaders;
        }
        return originalSend.apply(this, arguments);
      };
      
      // Intercepter WebSocket
      const originalWebSocket = window.WebSocket;
      window.WebSocket = function(url, protocols) {
        if (typeof url === 'string') {
          // Si c'est une URL vers localhost:5678 ou wss://www.talosprimes.com/rest/push
          if (url.includes('localhost:5678') || 
              url.includes('127.0.0.1:5678') ||
              (url.includes('/rest/push') && shouldProxy(url))) {
            // Convertir en URL proxy
            let proxyWsUrl = url;
            if (url.startsWith('ws://localhost:5678') || url.startsWith('ws://127.0.0.1:5678')) {
              // Extraire le chemin
              const pathMatch = url.match(/(\/rest\/push[^\\s]*)/);
              if (pathMatch) {
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                proxyWsUrl = wsProtocol + '//' + window.location.host + pathMatch[1];
              } else {
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                proxyWsUrl = wsProtocol + '//' + window.location.host + '/rest/push';
              }
            } else if (url.includes('/rest/push')) {
              // Déjà une URL relative ou avec le bon domaine, utiliser telle quelle
              if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                proxyWsUrl = wsProtocol + '//' + window.location.host + (url.startsWith('/') ? url : '/' + url);
              }
            }
            
            if (protocols) {
              return new originalWebSocket(proxyWsUrl, protocols);
            } else {
              return new originalWebSocket(proxyWsUrl);
            }
          }
        }
        
        // WebSocket normal
        if (protocols) {
          return new originalWebSocket(url, protocols);
        } else {
          return new originalWebSocket(url);
        }
      };
    })();
  </script>
</head>
<body>
  <iframe
    id="n8n-iframe"
    src="${proxyUrl}"
    title="N8N - Automatisation"
    allow="clipboard-read; clipboard-write"
  ></iframe>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[N8N View] Error:', error)
    const errorHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
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
    .error { text-align: center; padding: 20px; max-width: 600px; }
    h1 { color: #ef4444; }
  </style>
</head>
<body>
  <div class="error">
    <h1>Erreur</h1>
    <p>Une erreur est survenue lors du chargement de N8N.</p>
  </div>
</body>
</html>`
    return new NextResponse(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

