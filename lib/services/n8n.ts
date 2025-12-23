/**
 * Service pour gérer la connexion et les interactions avec N8N
 */

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
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
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
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(N8N_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'TalosPrime-Platform-HealthCheck',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (response.ok || response.status === 401) {
      return {
        connected: true,
        details: {
          url: N8N_URL,
          hasAuth: true,
          responseTime,
          statusCode: response.status,
        },
      }
    }

    return {
      connected: false,
      error: `N8N a répondu avec le statut ${response.status}: ${response.statusText}`,
      details: {
        url: N8N_URL,
        hasAuth: true,
        responseTime,
        statusCode: response.status,
      },
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
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

      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return {
          connected: false,
          error: `Impossible de se connecter à N8N: ${error.message}. Vérifiez que N8N est démarré et que l'URL est correcte.`,
          details: {
            url: N8N_URL,
            hasAuth: true,
            responseTime,
          },
        }
      }

      // Gérer les erreurs SSL/TLS
      if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
        return {
          connected: false,
          error: `Erreur SSL lors de la connexion à N8N: ${error.message}. Vérifiez le certificat SSL de N8N.`,
          details: {
            url: N8N_URL,
            hasAuth: true,
            responseTime,
          },
        }
      }

      // Améliorer le message d'erreur pour "fetch failed"
      let errorMessage = error.message
      if (error.message === 'fetch failed' || error.message.includes('fetch failed')) {
        errorMessage = `Impossible de se connecter à N8N (${N8N_URL}). Vérifiez que N8N est démarré et accessible. Erreur réseau: ${error.message}`
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

