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
 * @param timeout - Timeout en millisecondes (défaut: 5000)
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
    // Créer un AbortController pour le timeout
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
      // 401 est acceptable car cela signifie que N8N répond (mais peut nécessiter une authentification différente)
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

      return {
        connected: false,
        error: `Erreur de connexion à N8N: ${error.message}`,
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
 */
export async function proxyN8NRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const configCheck = checkN8NConfig()
  if (!configCheck.valid) {
    throw new Error(configCheck.error || 'Configuration N8N invalide')
  }

  const authHeaders = getN8NAuthHeaders()
  if (!authHeaders) {
    throw new Error('Impossible de créer les en-têtes d\'authentification N8N')
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        'User-Agent': 'TalosPrime-Platform',
        ...options.headers,
      },
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


