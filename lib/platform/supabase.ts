import { createPlatformClient } from '@/lib/supabase/platform'

/**
 * Récupère l'ID de la plateforme depuis les settings
 * Utilise la fonction RPC platform_company_id() qui extrait correctement la valeur avec value#>>'{}'
 */
export async function getPlatformCompanyId(): Promise<string | null> {
  const supabase = createPlatformClient()
  
  // MÉTHODE 1 : Utiliser la fonction RPC platform_company_id() qui existe dans la base de données
  // Cette fonction extrait correctement la valeur avec value#>>'{}' comme dans is_platform_user()
  try {
    const { data, error } = await supabase.rpc('platform_company_id')
    
    if (!error && data) {
      // La fonction RPC retourne directement l'UUID
      const platformId = String(data).trim()
      console.log('[getPlatformCompanyId] ✅ Récupéré via RPC:', platformId)
      return platformId
    }
    
    if (error) {
      console.warn('[getPlatformCompanyId] RPC error, falling back to direct query:', error)
    }
  } catch (rpcErr) {
    console.warn('[getPlatformCompanyId] RPC exception, falling back to direct query:', rpcErr)
  }
  
  // MÉTHODE 2 : Fallback - récupérer depuis settings et extraire manuellement
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'platform_company_id')
    .limit(1)
    .single()

  if (error || !data) {
    console.error('[getPlatformCompanyId] ❌ Error fetching platform_company_id:', error)
    return null
  }

  // Extraire la valeur du JSONB
  const value = data.value
  
  // Si c'est déjà une string, la retourner directement
  if (typeof value === 'string') {
    const platformId = value.trim()
    console.log('[getPlatformCompanyId] ✅ Récupéré depuis settings (string):', platformId)
    return platformId
  }
  
  // Si c'est un JSONB, essayer différentes méthodes d'extraction
  if (typeof value === 'object' && value !== null) {
    // Si c'est un tableau avec un élément
    if (Array.isArray(value) && value.length > 0) {
      const platformId = String(value[0]).trim()
      console.log('[getPlatformCompanyId] ✅ Récupéré depuis settings (array):', platformId)
      return platformId
    }
    
    // Si c'est un objet, essayer de récupérer la première valeur
    const keys = Object.keys(value)
    if (keys.length > 0) {
      const firstValue = value[keys[0]]
      if (typeof firstValue === 'string') {
        const platformId = firstValue.trim()
        console.log('[getPlatformCompanyId] ✅ Récupéré depuis settings (object):', platformId)
        return platformId
      }
    }
    
    // Dernier recours : convertir en string JSON et nettoyer
    try {
      const jsonString = JSON.stringify(value)
      // Enlever les guillemets JSON si présents
      const cleaned = jsonString.replace(/^"|"$/g, '').trim()
      console.log('[getPlatformCompanyId] ✅ Récupéré depuis settings (JSON):', cleaned)
      return cleaned
    } catch (e) {
      const platformId = String(value).trim()
      console.log('[getPlatformCompanyId] ✅ Récupéré depuis settings (String):', platformId)
      return platformId
    }
  }
  
  console.error('[getPlatformCompanyId] ❌ Impossible d\'extraire la valeur')
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

