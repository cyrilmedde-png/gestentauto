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
    console.error('Error fetching platform_company_id:', error)
    return null
  }

  // Extraire la valeur du JSONB
  const value = data.value
  
  // Si c'est déjà une string, la retourner directement
  if (typeof value === 'string') {
    return value.trim()
  }
  
  // Si c'est un JSONB, essayer différentes méthodes d'extraction
  if (typeof value === 'object' && value !== null) {
    // Essayer value#>>'{}' équivalent (si Supabase le retourne déjà extrait)
    if (value && typeof value === 'object' && 'value' in value) {
      return String(value.value).trim()
    }
    // Sinon, convertir en string et nettoyer
    const stringValue = JSON.stringify(value).replace(/^"|"$/g, '')
    return stringValue.trim()
  }
  
  return null
}

/**
 * Vérifie si une entreprise est la plateforme
 */
export async function isPlatformCompany(companyId: string): Promise<boolean> {
  const platformId = await getPlatformCompanyId()
  if (!platformId) {
    return false
  }
  // Normaliser les UUIDs pour la comparaison
  const normalizedCompanyId = String(companyId).trim().toLowerCase()
  const normalizedPlatformId = String(platformId).trim().toLowerCase()
  return normalizedPlatformId === normalizedCompanyId
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

