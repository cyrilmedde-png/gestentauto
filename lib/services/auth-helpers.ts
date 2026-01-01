/**
 * Helpers d'authentification et autorisation
 */

/**
 * ID de la company plateforme (admin)
 */
export const PLATFORM_COMPANY_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Vérifie si une company_id est celle de la plateforme (admin)
 */
export function isPlatformCompany(company_id: string | null | undefined): boolean {
  if (!company_id) return false
  return company_id === PLATFORM_COMPANY_ID
}

/**
 * Vérifie si un utilisateur est admin plateforme
 */
export async function isUserPlatformAdmin(userId: string, supabase: any): Promise<boolean> {
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single()

    return isPlatformCompany(userData?.company_id)
  } catch (error) {
    return false
  }
}

