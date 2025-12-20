import { supabase } from '@/lib/supabase/client'

export interface AuthUser {
  id: string
  company_id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role_id?: string | null
  company?: {
    id: string
    name: string
    email?: string | null
    siret?: string | null
    vat_number?: string | null
    address?: string | null
    city?: string | null
    postal_code?: string | null
    country: string
    phone?: string | null
  }
}

/**
 * Récupère l'utilisateur actuel avec ses données complètes
 * Utilise le client Supabase singleton pour éviter les multiples instances
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Vérifier si on est côté client
    if (typeof window === 'undefined') {
      return null
    }
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      // Ne pas logger AuthSessionMissingError, c'est normal quand l'utilisateur n'est pas connecté
      if (authError && authError.name !== 'AuthSessionMissingError' && authError.message !== 'Auth session missing!') {
        console.log('getCurrentUser: Auth error:', authError)
      }
      return null
    }

    console.log('getCurrentUser: User found in Auth, ID:', authUser.id)

    // Récupérer les données utilisateur depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        company_id,
        email,
        first_name,
        last_name,
        role_id,
        companies (
          id,
          name,
          email,
          siret,
          vat_number,
          address,
          city,
          postal_code,
          country,
          phone
        )
      `)
      .eq('id', authUser.id)
      .single()

    if (userError) {
      console.error('getCurrentUser: Error fetching user data:', userError)
      return null
    }

    if (!userData) {
      console.log('getCurrentUser: User data not found')
      return null
    }

    console.log('getCurrentUser: User data found:', userData)

    return {
      id: userData.id,
      company_id: userData.company_id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role_id: userData.role_id || null,
      company: (Array.isArray(userData.companies) && userData.companies[0]
        ? userData.companies[0]
        : (typeof userData.companies === 'object' && userData.companies !== null
          ? userData.companies
          : undefined)) as AuthUser['company'] | undefined,
    }
  } catch (error) {
    console.error('getCurrentUser: Unexpected error:', error)
    return null
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Vérifie si l'utilisateur actuel appartient à la plateforme
 */
export async function isPlatformUser(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      return false
    }
    
    const { data, error } = await supabase.rpc('is_platform_user')
    
    if (error) {
      console.error('isPlatformUser: Error:', error)
      return false
    }
    
    return data === true
  } catch (error) {
    console.error('isPlatformUser: Unexpected error:', error)
    return false
  }
}

/**
 * Déconnecte l'utilisateur
 */
export async function signOut(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }
  
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}
