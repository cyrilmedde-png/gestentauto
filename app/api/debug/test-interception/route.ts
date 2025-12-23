import { NextRequest, NextResponse } from 'next/server'

/**
 * Route de test pour vérifier que le script d'interception fonctionne
 * Cette route simule une requête N8N et vérifie que les cookies sont transmis
 */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''
  const authHeader = request.headers.get('authorization') || ''
  const tokenHeader = request.headers.get('x-supabase-auth-token') || ''
  
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
  
  return NextResponse.json({
    success: true,
    message: 'Test interception - Si vous voyez ce message, la requête a bien été interceptée',
    headers: {
      hasCookies: !!cookieHeader,
      cookieCount: cookieKeys.length,
      cookieKeys: cookieKeys,
      hasAuthHeader: !!authHeader,
      hasTokenHeader: !!tokenHeader,
      cookieLength: cookieHeader.length,
    },
    timestamp: new Date().toISOString(),
  })
}

