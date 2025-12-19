/**
 * Module Core - Gestion des permissions
 * Système de permissions basé sur les rôles
 */

import { supabase } from '@/lib/supabase'
import { APP_REGISTRY } from '@/core/registry'

export type Permission = keyof typeof APP_REGISTRY.permissions

/**
 * Récupérer les permissions d'un utilisateur
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const { data: user } = await supabase
    .from('users')
    .select('roleId')
    .eq('id', userId)
    .single()

  if (!user?.roleId) return []

  const { data: role } = await supabase
    .from('roles')
    .select('permissions')
    .eq('id', user.roleId)
    .single()

  if (!role?.permissions) return []

  // Les permissions sont stockées en JSON
  return role.permissions as Permission[]
}

/**
 * Vérifier si l'utilisateur a une permission spécifique
 */
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions.includes(permission)
}

/**
 * Vérifier si l'utilisateur a accès à un module
 */
export async function hasModuleAccess(
  userId: string,
  moduleId: string
): Promise<boolean> {
  // Récupérer l'entreprise de l'utilisateur
  const { data: user } = await supabase
    .from('users')
    .select('companyId')
    .eq('id', userId)
    .single()

  if (!user?.companyId) return false

  // Vérifier si le module est activé pour cette entreprise
  const { data: module } = await supabase
    .from('company_modules')
    .select('enabled')
    .eq('companyId', user.companyId)
    .eq('moduleId', moduleId)
    .single()

  return module?.enabled === true
}

/**
 * Vérifier plusieurs permissions à la fois
 */
export async function hasAnyPermission(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return permissions.some(permission => userPermissions.includes(permission))
}

export async function hasAllPermissions(
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId)
  return permissions.every(permission => userPermissions.includes(permission))
}

