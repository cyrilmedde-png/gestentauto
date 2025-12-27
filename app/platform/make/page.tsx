import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import MakePageClient from './make-page-client'

/**
 * Wrapper serveur pour vérifier l'authentification avant de rendre la page client
 * Cela évite que Next.js considère la page comme 404 pendant le chargement
 */
export default async function MakePage() {
  try {
    // Vérifier l'authentification côté serveur
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      redirect('/auth/login')
    }
    
    // Vérifier que l'utilisateur est un admin plateforme
    const adminSupabase = createAdminClient()
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData?.company_id) {
      redirect('/dashboard')
    }
    
    // Récupérer le platform_company_id
    const { data: platformSetting, error: platformError } = await adminSupabase
      .from('settings')
      .select('value')
      .eq('key', 'platform_company_id')
      .single()
    
    if (platformError || !platformSetting) {
      redirect('/dashboard')
    }
    
    // Extraire la valeur du JSONB
    let platformCompanyIdValue: string
    if (typeof platformSetting.value === 'string') {
      platformCompanyIdValue = platformSetting.value.trim().toLowerCase()
    } else {
      const jsonStr = JSON.stringify(platformSetting.value)
      platformCompanyIdValue = jsonStr.replace(/^"|"$/g, '').trim().toLowerCase()
    }
    
    const userCompanyId = String(userData.company_id).trim().toLowerCase()
    
    if (userCompanyId !== platformCompanyIdValue) {
      redirect('/dashboard')
    }
    
    // Si tout est OK, rendre le composant client
    return <MakePageClient />
  } catch (error) {
    // En cas d'erreur, rediriger vers le dashboard au lieu de retourner 404
    console.error('[MakePage] Error:', error)
    redirect('/dashboard')
  }
}

