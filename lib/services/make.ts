/**
 * Service pour gérer la connexion et les interactions avec Make.com
 */

import https from 'https'
import { URL } from 'url'

const MAKE_URL = process.env.NEXT_PUBLIC_MAKE_URL || process.env.MAKE_URL || 'https://eu1.make.com/organization/5837397/dashboard'

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

  // Construire les headers
  const headersRecord: Record<string, string> = {
    'User-Agent': 'TalosPrime-Platform',
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

  try {
    console.log('[proxyMakeRequest] Creating https.request...')
    // Utiliser https.request() au lieu de fetch()
    const responseData = await new Promise<{
      statusCode: number
      statusMessage: string
      headers: Record<string, string>
      body: Buffer
    }>((resolve, reject) => {
      const req = https.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.pathname + urlObj.search,
          method,
          agent,
          headers: headersRecord,
          timeout,
        },
        (res) => {
          console.log('[proxyMakeRequest] Response received:', {
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headersCount: Object.keys(res.headers).length,
          })
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

      // Envoyer le body si présent (POST, PUT, etc.)
      if (options.body) {
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
    console.log('[proxyMakeRequest] Promise created, waiting for response...')

    // Convertir la réponse en objet Response compatible
    console.log('[proxyMakeRequest] Converting response to Response object...')
    const bufferCopy = Buffer.from(responseData.body)
    const arrayBuffer = bufferCopy.buffer.slice(
      bufferCopy.byteOffset,
      bufferCopy.byteOffset + bufferCopy.byteLength
    ) as ArrayBuffer
    
    // Créer un objet Headers pour gérer Set-Cookie correctement
    const responseHeaders = new Headers()
    
    // Ajouter tous les headers sauf Set-Cookie (qui sera géré séparément)
    Object.keys(responseData.headers).forEach((key) => {
      if (key.toLowerCase() !== 'set-cookie' && key.toLowerCase() !== 'content-security-policy') {
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
    
    // Supprimer ou modifier Content-Security-Policy pour autoriser l'iframe
    // On remplace frame-ancestors pour autoriser notre domaine
    const cspHeader = responseData.headers['content-security-policy']
    if (cspHeader) {
      // Remplacer frame-ancestors pour autoriser notre domaine
      const modifiedCSP = cspHeader
        .replace(/frame-ancestors[^;]*;?/gi, '')
        .trim()
        .replace(/;;+/g, ';')
        .replace(/^;|;$/g, '')
      responseHeaders.set('Content-Security-Policy', `${modifiedCSP}; frame-ancestors 'self' https://www.talosprimes.com`)
    }
    
    // Supprimer X-Frame-Options si présent
    if (responseData.headers['x-frame-options']) {
      // Ne pas inclure X-Frame-Options dans les headers de réponse
    }
    
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

