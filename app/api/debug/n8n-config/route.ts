import { NextRequest, NextResponse } from 'next/server'
import { checkN8NConfig, testN8NConnection, getN8NAuthHeaders } from '@/lib/services/n8n'
import { verifyAuthenticatedUser } from '@/lib/middleware/platform-auth'

/**
 * Route de diagnostic pour vérifier la configuration N8N et l'authentification
 * Accessible uniquement pour le débogage
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier les variables d'environnement
    const config = checkN8NConfig()
    
    // 2. Vérifier la connexion N8N
    const connection = await testN8NConnection(5000)
    
    // 3. Vérifier l'authentification
    const auth = await verifyAuthenticatedUser(request)
    
    // 4. Vérifier les headers d'auth N8N
    const n8nAuthHeaders = getN8NAuthHeaders()
    
    // 5. Récupérer les headers de la requête
    const requestHeaders = {
      cookie: request.headers.get('cookie') ? 'PRESENT' : 'MISSING',
      authorization: request.headers.get('authorization') ? 'PRESENT' : 'MISSING',
      'x-supabase-auth-token': request.headers.get('x-supabase-auth-token') ? 'PRESENT' : 'MISSING',
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      config: {
        ...config,
        env: {
          hasN8N_URL: !!process.env.N8N_URL,
          hasN8N_USER: !!process.env.N8N_BASIC_AUTH_USER,
          hasN8N_PASSWORD: !!process.env.N8N_BASIC_AUTH_PASSWORD,
          n8nUrl: process.env.N8N_URL || 'NOT SET',
          n8nUser: process.env.N8N_BASIC_AUTH_USER ? 'SET (length: ' + process.env.N8N_BASIC_AUTH_USER.length + ')' : 'NOT SET',
          n8nPassword: process.env.N8N_BASIC_AUTH_PASSWORD ? 'SET (length: ' + process.env.N8N_BASIC_AUTH_PASSWORD.length + ')' : 'NOT SET',
        },
      },
      connection,
      authentication: {
        isAuthenticated: auth.isAuthenticated,
        userId: auth.userId,
        error: auth.error,
        requestHeaders,
      },
      n8nAuth: {
        hasHeaders: !!n8nAuthHeaders,
        headerPreview: n8nAuthHeaders ? 'Basic ***' : null,
      },
      summary: {
        configValid: config.valid,
        n8nConnected: connection.connected,
        userAuthenticated: auth.isAuthenticated,
        allGood: config.valid && connection.connected && auth.isAuthenticated,
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

