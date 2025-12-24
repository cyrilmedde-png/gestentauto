/**
 * Service pour gérer la connexion et les interactions avec N8N
 */

import https from 'https'
import { URL } from 'url'

const N8N_URL = process.env.N8N_URL || 'https://n8n.talosprimes.com'
const N8N_USERNAME = process.env.N8N_BASIC_AUTH_USER
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD

export interface N8NConnectionStatus {
  connected: boolean
  error?: string
  details?: {
    url: string
    hasAuth: boolean
    responseTime?: number
    statusCode?: number
  }
}

/**
 * Vérifie que les variables d'environnement N8N sont configurées
 */
export function checkN8NConfig(): { valid: boolean; error?: string } {
  if (!N8N_URL) {
    return {
      valid: false,
      error: 'N8N_URL n\'est pas configuré dans les variables d\'environnement',
    }
  }

  if (!N8N_USERNAME || !N8N_PASSWORD) {
    return {
      valid: false,
      error: 'N8N_BASIC_AUTH_USER ou N8N_BASIC_AUTH_PASSWORD n\'est pas configuré',
    }
  }

  return { valid: true }
}

/**
 * Teste la connexion à N8N
 */
export async function testN8NConnection(timeout: number = 5000): Promise<N8NConnectionStatus> {
  // Log pour déboguer (seulement en production pour voir les valeurs)
  if (process.env.NODE_ENV === 'production') {
    console.log('[testN8NConnection] Configuration:', {
      hasUrl: !!N8N_URL,
      url: N8N_URL,
      hasUsername: !!N8N_USERNAME,
      hasPassword: !!N8N_PASSWORD,
    })
  }

  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    console.error('[testN8NConnection] Configuration invalide:', configCheck.error)
    return {
      connected: false,
      error: configCheck.error,
      details: {
        url: N8N_URL,
        hasAuth: !!(N8N_USERNAME && N8N_PASSWORD),
      },
    }
  }

  const auth = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString('base64')
  const startTime = Date.now()

  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('[testN8NConnection] Tentative de connexion à:', N8N_URL)
    }

    // Utiliser https de Node.js directement pour éviter les problèmes avec fetch()
    const url = new URL(N8N_URL)
    const responseTime = Date.now() - startTime

    // Créer un agent HTTPS qui ignore les erreurs de certificat (pour les certificats auto-signés)
    const agent = new https.Agent({
      rejectUnauthorized: false, // Ignorer les erreurs de certificat SSL
    })

    const response = await new Promise<{ statusCode: number; statusMessage: string }>((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname || '/',
          method: 'GET',
          agent,
          headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': 'TalosPrime-Platform-HealthCheck',
          },
          timeout,
        },
        (res) => {
          resolve({
            statusCode: res.statusCode || 0,
            statusMessage: res.statusMessage || '',
          })
          res.on('data', () => {}) // Consommer les données
          res.on('end', () => {})
        }
      )

      req.on('error', (error) => {
        reject(error)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Timeout'))
      })

      req.setTimeout(timeout)
      req.end()
    })

    const finalResponseTime = Date.now() - startTime

    if (response.statusCode === 200 || response.statusCode === 401 || response.statusCode === 302) {
      return {
        connected: true,
        details: {
          url: N8N_URL,
          hasAuth: true,
          responseTime: finalResponseTime,
          statusCode: response.statusCode,
        },
      }
    }

    return {
      connected: false,
      error: `N8N a répondu avec le statut ${response.statusCode}: ${response.statusMessage}`,
      details: {
        url: N8N_URL,
        hasAuth: true,
        responseTime: finalResponseTime,
        statusCode: response.statusCode,
      },
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Log détaillé de l'erreur en production
    if (process.env.NODE_ENV === 'production' && error instanceof Error) {
      const errorDetails: any = {
        message: error.message,
        name: error.name,
        url: N8N_URL,
        hasAuth: !!(N8N_USERNAME && N8N_PASSWORD),
      }
      
      // Ajouter le code d'erreur si disponible
      if ((error as any).code) {
        errorDetails.code = (error as any).code
      }
      
      // Ajouter la stack trace pour déboguer
      if (error.stack) {
        errorDetails.stack = error.stack.split('\n').slice(0, 3).join('\n')
      }
      
      console.error('[testN8NConnection] Erreur de connexion:', errorDetails)
    }

    if (error instanceof Error) {
      if (error.message === 'Timeout' || error.name === 'AbortError') {
        return {
          connected: false,
          error: `Timeout: N8N n'a pas répondu dans les ${timeout}ms`,
          details: {
            url: N8N_URL,
            hasAuth: true,
            responseTime,
          },
        }
      }

      const msg = error.message
      const msgLower = msg.toLowerCase()
      
      if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
        return {
          connected: false,
          error: `Impossible de se connecter à N8N: ${msg}. Vérifiez que N8N est démarré et que l'URL est correcte.`,
          details: {
            url: N8N_URL,
            hasAuth: true,
            responseTime,
          },
        }
      }

      // Gérer les erreurs SSL/TLS
      if (msgLower.includes('certificate') || msgLower.includes('ssl') || msgLower.includes('tls')) {
        return {
          connected: false,
          error: `Erreur SSL lors de la connexion à N8N: ${msg}. Vérifiez le certificat SSL de N8N.`,
          details: {
            url: N8N_URL,
            hasAuth: true,
            responseTime,
          },
        }
      }

      // Améliorer le message d'erreur pour "fetch failed"
      let errorMessage = msg
      if (msg === 'fetch failed' || msg.includes('fetch failed')) {
        errorMessage = `Impossible de se connecter à N8N (${N8N_URL}). Vérifiez que N8N est démarré et accessible. Erreur réseau: ${msg}`
      }

      return {
        connected: false,
        error: errorMessage,
        details: {
          url: N8N_URL,
          hasAuth: true,
          responseTime,
        },
      }
    }

    return {
      connected: false,
      error: 'Erreur inconnue lors de la connexion à N8N',
      details: {
        url: N8N_URL,
        hasAuth: true,
        responseTime,
      },
    }
  }
}

/**
 * Crée les en-têtes d'authentification pour N8N
 */
export function getN8NAuthHeaders(): { Authorization: string } | null {
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    return null
  }

  const auth = Buffer.from(`${N8N_USERNAME}:${N8N_PASSWORD}`).toString('base64')
  return {
    Authorization: `Basic ${auth}`,
  }
}

/**
 * Proxie une requête vers N8N avec gestion d'erreurs améliorée
 * @param url - URL N8N cible
 * @param options - Options de requête
 * @param cookies - Cookies de session N8N à transmettre (optionnel)
 */
export async function proxyN8NRequest(
  url: string,
  options: RequestInit = {},
  cookies?: string
): Promise<Response> {
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    throw new Error(configCheck.error || 'Configuration N8N invalide')
  }

  const authHeaders = getN8NAuthHeaders()
  if (!authHeaders) {
    throw new Error('Impossible de créer les en-têtes d\'authentification N8N')
  }

  // Construire les headers avec les cookies de session N8N si fournis
  const headersRecord: Record<string, string> = {
    ...authHeaders,
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

  // Ajouter les cookies de session N8N si fournis
  if (cookies) {
    headersRecord['Cookie'] = cookies
  }

  // Convertir en HeadersInit
  const headers: HeadersInit = headersRecord

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    return response
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        throw new Error(
          `Impossible de se connecter à N8N (${N8N_URL}). Vérifiez que N8N est démarré et accessible.`
        )
      }
      throw new Error(`Erreur lors de la requête vers N8N: ${error.message}`)
    }
    throw new Error('Erreur inconnue lors de la requête vers N8N')
  }
}

