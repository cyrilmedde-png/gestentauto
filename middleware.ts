import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si l'utilisateur est connecté
  if (user) {
    // Récupérer les infos de l'utilisateur depuis la table users
    const { data: userData } = await supabase
      .from('users')
      .select('password_change_required')
      .eq('id', user.id)
      .single()

    // Si l'utilisateur doit changer son mot de passe
    if (userData?.password_change_required) {
      // Autoriser l'accès à la page de changement de mot de passe
      if (request.nextUrl.pathname === '/auth/change-password-required') {
        return response
      }

      // Autoriser l'accès à l'API de changement de mot de passe
      if (request.nextUrl.pathname === '/api/auth/change-password') {
        return response
      }

      // Autoriser la déconnexion
      if (request.nextUrl.pathname === '/auth/logout') {
        return response
      }

      // Rediriger vers la page de changement de mot de passe pour toutes les autres routes
      return NextResponse.redirect(
        new URL('/auth/change-password-required', request.url)
      )
    }

    // Si l'utilisateur est sur la page de changement de mot de passe mais n'en a plus besoin
    if (
      !userData?.password_change_required &&
      request.nextUrl.pathname === '/auth/change-password-required'
    ) {
      return NextResponse.redirect(new URL('/platform', request.url))
    }

    // Ne pas permettre l'accès aux pages d'authentification si déjà connecté
    if (
      request.nextUrl.pathname.startsWith('/auth/login') ||
      request.nextUrl.pathname.startsWith('/auth/register')
    ) {
      return NextResponse.redirect(new URL('/platform', request.url))
    }
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/platform') ||
      request.nextUrl.pathname.startsWith('/api/platform'))
  ) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

