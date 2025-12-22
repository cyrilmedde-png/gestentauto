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
    // Si Supabase retourne un objet avec la valeur déjà extraite
    // (parfois Supabase transforme les JSONB simples en objets)
    if (value && typeof value === 'object') {
      // Essayer d'accéder directement à une propriété si c'est un objet simple
      const keys = Object.keys(value)
      if (keys.length === 0) {
        return null
      }
      // Si c'est un JSONB qui contient une string, elle peut être stockée comme objet
      // Essayer de récupérer la valeur première clé ou la valeur directement
      const firstValue = value[keys[0]]
      if (typeof firstValue === 'string') {
        return firstValue.trim()
      }
    }
    
    // Sinon, convertir en string JSON et nettoyer
    try {
      const jsonString = JSON.stringify(value)
      // Si c'est une string JSON entre guillemets, les enlever
      const cleaned = jsonString.replace(/^"|"$/g, '').trim()
      return cleaned
    } catch (e) {
      // Si ça échoue, essayer String()
      return String(value).trim()
    }
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

