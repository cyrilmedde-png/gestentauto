/**
 * Service pour gérer la connexion et les interactions avec Make.com
 */

import https from 'https'
import { URL } from 'url'

const MAKE_URL = process.env.NEXT_PUBLIC_MAKE_URL || process.env.MAKE_URL || 'https://www.make.com/en'

export interface MakeConnectionStatus {
  connected: boolean
  error?: string
  details?: {
    url: string
    responseTime?: number
    statusCode?: number
  }
}

/**
 * Vérifie que la configuration Make est valide
 */
export function checkMakeConfig(): { valid: boolean; error?: string } {
  if (!MAKE_URL) {
    return {
      valid: false,
      error: 'MAKE_URL n\'est pas configuré dans les variables d\'environnement',
    }
  }

  return { valid: true }
}

/**
 * Proxie une requête vers Make.com
 * @param url - URL Make.com cible
 * @param options - Options de requête
 * @param cookies - Cookies de session Make à transmettre (optionnel)
 */
export async function proxyMakeRequest(
  url: string,
  options: RequestInit = {},
  cookies?: string
): Promise<Response> {
  console.log('[proxyMakeRequest] Starting proxy request to:', url)
  
  const configCheck = checkMakeConfig()
  if (!configCheck.valid) {
    console.error('[proxyMakeRequest] Config check failed:', configCheck.error)
    throw new Error(configCheck.error || 'Configuration Make invalide')
  }

  // Construire les headers - utiliser un User-Agent de navigateur pour éviter la détection de proxy
  // IMPORTANT: Ne pas demander de compression (gzip, br) car on ne décompresse pas le contenu
  // Le navigateur client décompressera automatiquement si nécessaire
  const headersRecord: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    // Ne pas demander de compression - on laisse le navigateur gérer
    // 'Accept-Encoding': 'gzip, deflate, br', // RETIRÉ - cause du contenu binaire non décompressé
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
  }

  // Ajouter les headers existants
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headersRecord[key] = value
      })
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headersRecord[key] = value
      })
    } else {
      Object.assign(headersRecord, options.headers)
    }
  }

  // Ajouter les cookies de session Make si fournis
  if (cookies) {
    headersRecord['Cookie'] = cookies
    console.log('[proxyMakeRequest] Cookies added, length:', cookies.length)
  } else {
    console.log('[proxyMakeRequest] No cookies provided')
  }

  // Parser l'URL
  let urlObj: URL
  try {
    urlObj = new URL(url)
    console.log('[proxyMakeRequest] Parsed URL:', {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
    })
  } catch (error) {
    console.error('[proxyMakeRequest] URL parsing failed:', error)
    throw new Error(`URL Make invalide: ${url} - ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  const method = options.method || 'GET'
  const timeout = 30000 // 30 secondes pour les requêtes proxy
  console.log('[proxyMakeRequest] Request config:', { method, timeout, hasCookies: !!cookies })

  // Créer un agent HTTPS
  const agent = new https.Agent({
    rejectUnauthorized: true, // Make.com utilise des certificats valides
  })
  console.log('[proxyMakeRequest] HTTPS agent created')

  const requestMethod = options.method || 'GET'
  
  // Fonction récursive pour suivre les redirections
  const followRedirects = async (
    currentUrl: string,
    currentHeaders: Record<string, string>,
    redirectCount: number = 0,
    maxRedirects: number = 5
  ): Promise<{
    statusCode: number
    statusMessage: string
    headers: Record<string, string>
    body: Buffer
  }> => {
    if (redirectCount > maxRedirects) {
      throw new Error(`Too many redirects (max ${maxRedirects})`)
    }

    const parsedUrl = new URL(currentUrl)
    
    return new Promise<{
      statusCode: number
      statusMessage: string
      headers: Record<string, string>
      body: Buffer
    }>((resolve, reject) => {
      const req = https.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 443,
          path: parsedUrl.pathname + parsedUrl.search,
          method: redirectCount > 0 ? 'GET' : requestMethod, // Toujours GET pour les redirections
          agent,
          headers: currentHeaders,
          timeout,
        },
        (res) => {
          console.log('[proxyMakeRequest] Response received:', {
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headersCount: Object.keys(res.headers).length,
            redirectCount,
          })
          
          // Suivre les redirections 301, 302, 303, 307, 308
          if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode)) {
            const location = res.headers.location
            if (location) {
              try {
                const redirectUrl = new URL(location, currentUrl).href
                console.log('[proxyMakeRequest] Following redirect:', res.statusCode, '->', redirectUrl)
                // Copier les cookies pour la redirection
                const redirectHeaders = { ...currentHeaders }
                const setCookie = res.headers['set-cookie']
                if (setCookie) {
                  redirectHeaders['Cookie'] = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie
                }
                req.destroy()
                return followRedirects(redirectUrl, redirectHeaders, redirectCount + 1, maxRedirects)
                  .then(resolve)
                  .catch(reject)
              } catch (error) {
                console.error('[proxyMakeRequest] Error following redirect:', error)
                reject(error)
                return
              }
            }
          }
          
          const chunks: Buffer[] = []
          const responseHeaders: Record<string, string> = {}
          
          // Collecter les headers (gérer Set-Cookie spécialement)
          Object.keys(res.headers).forEach((key) => {
            const value = res.headers[key]
            const lowerKey = key.toLowerCase()
            
            if (value) {
              // Set-Cookie est toujours un tableau dans Node.js
              if (lowerKey === 'set-cookie') {
                responseHeaders[lowerKey] = Array.isArray(value) ? value.join('\n') : value
              } else {
                responseHeaders[lowerKey] = Array.isArray(value) ? value.join(', ') : value
              }
            }
          })

          // Collecter le body
          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk)
          })

          res.on('end', () => {
            console.log('[proxyMakeRequest] Response end, body size:', Buffer.concat(chunks).length)
            resolve({
              statusCode: res.statusCode || 200,
              statusMessage: res.statusMessage || '',
              headers: responseHeaders,
              body: Buffer.concat(chunks),
            })
          })

          res.on('error', (error) => {
            console.error('[proxyMakeRequest] Response error:', error)
            reject(error)
          })
        }
      )

      req.on('error', (error) => {
        console.error('[proxyMakeRequest] Request error:', error)
        reject(error)
      })

      req.on('timeout', () => {
        console.error('[proxyMakeRequest] Request timeout after', timeout, 'ms')
        req.destroy()
        reject(new Error('Timeout'))
      })

      // Envoyer le body si présent (POST, PUT, etc.) - seulement pour la requête initiale
      if (redirectCount === 0 && options.body) {
        if (typeof options.body === 'string') {
          req.write(options.body)
        } else if (options.body instanceof Buffer) {
          req.write(options.body)
        } else if (options.body instanceof ArrayBuffer) {
          req.write(Buffer.from(options.body))
        } else {
          req.write(String(options.body))
        }
      }

      req.setTimeout(timeout)
      console.log('[proxyMakeRequest] Sending request...')
      req.end()
    })
  }

  try {
    console.log('[proxyMakeRequest] Starting request with redirect following...')
    const responseData = await followRedirects(url, headersRecord)
    console.log('[proxyMakeRequest] Request completed, processing response...')

    // Convertir la réponse en objet Response compatible
    console.log('[proxyMakeRequest] Converting response to Response object...')
    const bufferCopy = Buffer.from(responseData.body)
    const arrayBuffer = bufferCopy.buffer.slice(
      bufferCopy.byteOffset,
      bufferCopy.byteOffset + bufferCopy.byteLength
    ) as ArrayBuffer
    
    // Créer un objet Headers pour gérer Set-Cookie correctement
    const responseHeaders = new Headers()
    
    // Ajouter tous les headers sauf Set-Cookie, Content-Encoding et Content-Security-Policy
    // Content-Encoding est retiré car on ne décompresse pas le contenu
    Object.keys(responseData.headers).forEach((key) => {
      const lowerKey = key.toLowerCase()
      if (lowerKey !== 'set-cookie' && 
          lowerKey !== 'content-security-policy' && 
          lowerKey !== 'content-encoding') {
        responseHeaders.set(key, responseData.headers[key])
      }
    })
    
    // Gérer Set-Cookie spécialement (peut être multiple)
    const setCookieValue = responseData.headers['set-cookie']
    if (setCookieValue) {
      const setCookieArray = typeof setCookieValue === 'string' 
        ? setCookieValue.split('\n')
        : (Array.isArray(setCookieValue) ? setCookieValue : [setCookieValue])
      
      setCookieArray.forEach((cookie: string) => {
        if (cookie) {
          responseHeaders.append('Set-Cookie', cookie.trim())
        }
      })
    }
    
    // Supprimer complètement Content-Security-Policy de Make.com et le remplacer
    // On doit TOUJOURS définir notre propre CSP qui autorise le framing
    // Chercher le CSP dans les headers (peut être en minuscules ou majuscules)
    const cspKeys = Object.keys(responseData.headers).filter(key => 
      key.toLowerCase() === 'content-security-policy'
    )
    
    // Le CSP est déjà exclu car nous ne l'ajoutons pas dans la boucle ci-dessus
    // Maintenant, TOUJOURS définir notre propre CSP qui autorise le framing
    const originalCSP = responseData.headers['content-security-policy'] || 
                       responseData.headers['Content-Security-Policy'] ||
                       responseData.headers[cspKeys[0]]
    
    if (originalCSP) {
      // Supprimer frame-ancestors de l'ancien CSP et ajouter le nôtre
      const modifiedCSP = String(originalCSP)
        .replace(/frame-ancestors[^;]*;?/gi, '')
        .trim()
        .replace(/;;+/g, ';')
        .replace(/^;|;$/g, '')
      const newCSP = modifiedCSP 
        ? `${modifiedCSP}; frame-ancestors 'self' https://www.talosprimes.com`
        : `frame-ancestors 'self' https://www.talosprimes.com`
      responseHeaders.set('Content-Security-Policy', newCSP)
    } else {
      // Si Make.com n'a pas de CSP, on en ajoute un minimal qui autorise le framing
      responseHeaders.set('Content-Security-Policy', "frame-ancestors 'self' https://www.talosprimes.com")
    }
    
    // Supprimer X-Frame-Options si présent (déjà exclu car nous ne l'ajoutons pas depuis responseData.headers)
    
    const response = new Response(arrayBuffer, {
      status: responseData.statusCode,
      statusText: responseData.statusMessage,
      headers: responseHeaders,
    })

    console.log('[proxyMakeRequest] Response created successfully, status:', response.status)
    return response
  } catch (error) {
    console.error('[proxyMakeRequest] Exception caught:', error)
    if (error instanceof Error) {
      const msg = error.message
      if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
        throw new Error(
          `Impossible de se connecter à Make.com (${MAKE_URL}). Vérifiez que l'URL est correcte.`
        )
      }
      if (msg === 'Timeout') {
        throw new Error(`Timeout: Make.com n'a pas répondu dans les ${timeout}ms`)
      }
      throw new Error(`Erreur lors de la requête vers Make.com: ${msg}`)
    }
    throw new Error('Erreur inconnue lors de la requête vers Make.com')
  }
}

