/**
 * Module Core - Authentification
 * Gestion de l'authentification via Supabase Auth
 */

import { supabase } from '@/lib/supabase'
import { addTimestamps, generateId } from '@/lib/supabase-helpers'
import { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  companyId?: string
  roleId?: string
  firstName?: string
  lastName?: string
}

/**
 * Connexion utilisateur
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Récupérer les informations utilisateur depuis notre table users
  const userData = await getUserData(data.user.id)
  
  return {
    user: data.user,
    session: data.session,
    userData,
  }
}

/**
 * Inscription utilisateur
 */
export async function signUp(email: string, password: string, companyName: string) {
  // 1. Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/confirm`,
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Erreur lors de la création de l\'utilisateur')

  // 2. Générer un ID pour l'entreprise
  const companyId = generateId()

  // 3. Créer l'entreprise avec l'ID généré et les timestamps
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert(
      addTimestamps({
        id: companyId,
        name: companyName,
        country: 'FR',
        currency: 'EUR',
        timezone: 'Europe/Paris',
      })
    )
    .select()
    .single()

  if (companyError) {
    console.error('Erreur création entreprise:', companyError)
    throw new Error(`Erreur lors de la création de l'entreprise: ${companyError.message}`)
  }

  // 4. Créer l'utilisateur dans notre table users avec les timestamps
  const { error: userError } = await supabase
    .from('users')
    .insert(
      addTimestamps({
        id: authData.user.id,
        email: authData.user.email!,
        companyId: company.id,
        isActive: true,
      })
    )

  if (userError) {
    console.error('Erreur création utilisateur:', userError)
    // Si l'utilisateur n'a pas pu être créé, supprimer l'entreprise créée
    await supabase.from('companies').delete().eq('id', company.id)
    throw new Error(`Erreur lors de la création de l'utilisateur: ${userError.message}`)
  }

  return {
    user: authData.user,
    session: authData.session,
    company,
  }
}

/**
 * Déconnexion
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Récupérer l'utilisateur actuel
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return null
    }

    // Essayer de récupérer les données depuis notre table
    // Si ça échoue (utilisateur n'existe pas dans la table), on utilise les infos de base de Supabase Auth
    const userData = await getUserData(user.id)
  
    // Si l'utilisateur n'existe pas dans notre table mais a une session Supabase,
    // on retourne quand même les infos de base depuis Supabase Auth
    if (!userData) {
      return {
        id: user.id,
        email: user.email || '',
      }
    }
  
    return userData
  } catch (error: any) {
    // En cas d'erreur, essayer au moins de récupérer l'utilisateur Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        return {
          id: user.id,
          email: user.email || '',
        }
      }
    } catch {
      // Ignorer les erreurs secondaires
    }
    return null
  }
}

/**
 * Récupérer les données utilisateur depuis notre table
 */
async function getUserData(userId: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, companyId, roleId, firstName, lastName')
      .eq('id', userId)
      .maybeSingle() // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs si aucun résultat

    // Si erreur 406 (Not Acceptable) ou PGRST116 (no rows), c'est normal si l'utilisateur n'existe pas dans la table
    // On ne logue pas ces erreurs car c'est un cas attendu
    if (error) {
      // Erreurs attendues (utilisateur n'existe pas dans la table users)
      if (
        error.code === 'PGRST116' || 
        error.message?.includes('JSON object') ||
        error.message?.includes('Cannot coerce') ||
        error.status === 406 ||
        error.statusCode === 406
      ) {
        // Pas de résultat, ce n'est pas une erreur critique
        return null
      }
      // Pour les autres erreurs inattendues, on logue en mode debug seulement
      if (process.env.NODE_ENV === 'development') {
        console.debug('Error fetching user data:', error.message)
      }
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      email: data.email,
      companyId: data.companyId,
      roleId: data.roleId || undefined,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
    }
  } catch (error: any) {
    // Gérer les erreurs inattendues sans polluer les logs
    if (process.env.NODE_ENV === 'development') {
      console.debug('Unexpected error fetching user data:', error?.message || error)
    }
    return null
  }
}

/**
 * Vérifier si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Obtenir la session actuelle
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

