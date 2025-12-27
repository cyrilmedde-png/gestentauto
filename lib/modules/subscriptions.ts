import { createAdminClient } from '@/lib/supabase/server'

export interface AvailableModule {
  id: string
  name: string
  display_name: string
  description: string | null
  price_monthly: number
  price_yearly: number | null
  icon: string
  category: string
  features: any
  is_n8n_created: boolean
  n8n_workflow_id: string | null
  route_slug: string | null
  table_name: string | null
  is_active: boolean
}

export interface CompanyModule {
  id: string
  company_id: string
  module_id: string
  subscription_id: string | null
  stripe_price_id: string | null
  is_active: boolean
  activated_at: string
  expires_at: string | null
  module: AvailableModule
}

/**
 * Vérifie si une entreprise a accès à un module spécifique
 */
export async function hasModuleAccess(companyId: string, moduleName: string): Promise<boolean> {
  const supabase = createAdminClient()

  // Récupérer le module
  const { data: module, error: moduleError } = await supabase
    .from('available_modules')
    .select('id, name, category')
    .eq('name', moduleName)
    .eq('is_active', true)
    .single()

  if (moduleError || !module) {
    return false
  }

  // Le module "starter" est toujours accessible (pack de base)
  if (module.category === 'base') {
    return true
  }

  // Vérifier si l'entreprise a le module activé
  const { data: companyModule, error } = await supabase
    .from('company_modules')
    .select('is_active, expires_at')
    .eq('company_id', companyId)
    .eq('module_id', module.id)
    .eq('is_active', true)
    .single()

  if (error || !companyModule) {
    return false
  }

  // Vérifier si l'abonnement n'a pas expiré
  if (companyModule.expires_at) {
    const expiresAt = new Date(companyModule.expires_at)
    if (expiresAt < new Date()) {
      return false
    }
  }

  return true
}

/**
 * Récupère tous les modules activés pour une entreprise
 */
export async function getActiveModules(companyId: string): Promise<CompanyModule[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('company_modules')
    .select(`
      id,
      company_id,
      module_id,
      subscription_id,
      stripe_price_id,
      is_active,
      activated_at,
      expires_at,
      module:available_modules(*)
    `)
    .eq('company_id', companyId)
    .eq('is_active', true)

  if (error || !data) {
    return []
  }

  // Filtrer les modules expirés
  const now = new Date()
  return data
    .filter((cm: any) => {
      if (!cm.expires_at) return true
      return new Date(cm.expires_at) > now
    })
    .map((cm: any) => ({
      ...cm,
      module: cm.module as AvailableModule,
    })) as CompanyModule[]
}

/**
 * Récupère tous les modules disponibles
 */
export async function getAvailableModules(): Promise<AvailableModule[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('available_modules')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('price_monthly', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as AvailableModule[]
}

/**
 * Active un module pour une entreprise
 */
export async function activateModule(
  companyId: string,
  moduleId: string,
  subscriptionId: string | null = null,
  stripePriceId: string | null = null,
  expiresAt: Date | null = null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Vérifier si le module existe
  const { data: module, error: moduleError } = await supabase
    .from('available_modules')
    .select('id')
    .eq('id', moduleId)
    .eq('is_active', true)
    .single()

  if (moduleError || !module) {
    return { success: false, error: 'Module non trouvé ou inactif' }
  }

  // Insérer ou mettre à jour company_modules
  const { error: upsertError } = await supabase
    .from('company_modules')
    .upsert({
      company_id: companyId,
      module_id: moduleId,
      subscription_id: subscriptionId,
      stripe_price_id: stripePriceId,
      is_active: true,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    }, {
      onConflict: 'company_id,module_id',
    })

  if (upsertError) {
    return { success: false, error: upsertError.message }
  }

  return { success: true }
}

/**
 * Désactive un module pour une entreprise
 */
export async function deactivateModule(
  companyId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('company_modules')
    .update({ is_active: false })
    .eq('company_id', companyId)
    .eq('module_id', moduleId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}


