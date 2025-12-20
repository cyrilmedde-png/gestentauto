import { createPlatformClient } from '@/lib/supabase/platform'

/**
 * Récupère l'ID de la plateforme depuis les settings
 */
export async function getPlatformCompanyId(): Promise<string | null> {
  const supabase = createPlatformClient()
  
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'platform_company_id')
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  // Extraire la valeur du JSONB
  const value = data.value
  if (typeof value === 'string') {
    return value
  }
  
  // Si c'est un JSONB, extraire la valeur string
  if (typeof value === 'object' && value !== null) {
    return String(value)
  }
  
  return null
}

/**
 * Vérifie si une entreprise est la plateforme
 */
export async function isPlatformCompany(companyId: string): Promise<boolean> {
  const platformId = await getPlatformCompanyId()
  return platformId === companyId
}

/**
 * Récupère toutes les entreprises clientes (exclut la plateforme)
 */
export async function getAllClientCompanies() {
  const supabase = createPlatformClient()
  const platformId = await getPlatformCompanyId()
  
  if (!platformId) {
    return []
  }

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .neq('id', platformId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client companies:', error)
    return []
  }

  return data || []
}

