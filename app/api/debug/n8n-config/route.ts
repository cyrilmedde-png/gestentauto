import { NextRequest, NextResponse } from 'next/server'
import { checkN8NConfig, testN8NConnection, getN8NAuthHeaders } from '@/lib/services/n8n'
import { verifyPlatformUser } from '@/lib/middleware/platform-auth'

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
    
    // 3. Vérifier l'authentification plateforme
    const auth = await verifyPlatformUser(request)
    
    // 4. Vérifier les headers d'auth N8N
    const n8nAuthHeaders = getN8NAuthHeaders()
    
    // 5. Récupérer les headers de la requête et analyser les cookies
    const cookieHeader = request.headers.get('cookie') || ''
    const cookieKeys: string[] = []
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const trimmed = cookie.trim()
        const equalIndex = trimmed.indexOf('=')
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim()
          if (key) cookieKeys.push(key)
        }
      })
    }
    
    // Chercher les cookies Supabase spécifiques
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseProjectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
    const supabaseCookieNames = supabaseProjectRef 
      ? [
          `sb-${supabaseProjectRef}-auth-token`,
          `sb-${supabaseProjectRef}-auth-token-code-verifier`,
        ]
      : []
    
    const requestHeaders = {
      cookie: cookieHeader ? 'PRESENT (length: ' + cookieHeader.length + ')' : 'MISSING',
      authorization: request.headers.get('authorization') ? 'PRESENT' : 'MISSING',
      'x-supabase-auth-token': request.headers.get('x-supabase-auth-token') ? 'PRESENT' : 'MISSING',
      cookieKeys: cookieKeys,
      supabaseCookieNames: supabaseCookieNames,
      hasSupabaseCookies: supabaseCookieNames.some(name => cookieKeys.includes(name)),
      allCookies: cookieKeys,
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
        isPlatform: auth.isPlatform,
        error: auth.error,
        requestHeaders,
        debug: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
          supabaseProjectRef: supabaseProjectRef || 'NOT FOUND',
          cookieHeaderLength: cookieHeader.length,
          cookieCount: cookieKeys.length,
        },
      },
      n8nAuth: {
        hasHeaders: !!n8nAuthHeaders,
        headerPreview: n8nAuthHeaders ? 'Basic ***' : null,
      },
      summary: {
        configValid: config.valid,
        n8nConnected: connection.connected,
        isPlatformUser: auth.isPlatform,
        allGood: config.valid && connection.connected && auth.isPlatform,
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

