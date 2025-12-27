import { redirect } from 'next/navigation'
import { unstable_noStore } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import MakePageClient from './make-page-client'

// Forcer le rendu dynamique - utiliser plusieurs méthodes pour être sûr
export const dynamic = 'force-dynamic'

/**
 * Page Make.com - Server Component
 * Vérifie l'authentification et les permissions côté serveur avant de rendre le client component
 */
export default async function MakePage() {
  try {
    // Forcer le rendu dynamique avec unstable_noStore
    unstable_noStore()
    
    // Vérifier l'authentification (sans request pour server components)
    // createServerClient() utilise cookies() en interne, ce qui force le rendu dynamique
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[MakePage] User not authenticated, redirecting to login', { error: authError?.message })
      redirect('/auth/login')
    }

    // Vérifier que l'utilisateur est plateforme
    const adminSupabase = createAdminClient()
    const { data: userData, error: userDataError } = await adminSupabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.company_id) {
      console.log('[MakePage] User data error or missing company_id', { error: userDataError?.message })
      redirect('/auth/login')
    }

    // Récupérer platform_company_id
    const { data: platformSetting, error: platformError } = await adminSupabase
      .from('settings')
      .select('value')
      .eq('key', 'platform_company_id')
      .single()

    if (platformError || !platformSetting) {
      console.log('[MakePage] Platform setting error', { error: platformError?.message })
      redirect('/auth/login')
    }

    // Comparer les company_id
    const userCompanyId = String(userData.company_id).trim().toLowerCase()
    let platformCompanyId: string
    
    if (typeof platformSetting.value === 'string') {
      platformCompanyId = platformSetting.value.trim().toLowerCase()
    } else {
      const jsonStr = JSON.stringify(platformSetting.value)
      platformCompanyId = jsonStr.replace(/^"|"$/g, '').trim().toLowerCase()
    }

    if (userCompanyId !== platformCompanyId) {
      console.log('[MakePage] User is not platform admin', { userCompanyId, platformCompanyId })
      redirect('/dashboard')
    }

    // Si l'utilisateur est plateforme, rendre le client component
    console.log('[MakePage] Rendering MakePageClient for platform user')
    return <MakePageClient />
  } catch (error) {
    console.error('[MakePage] Error in MakePage:', error)
    // En cas d'erreur, rediriger vers login plutôt que de retourner 404
    redirect('/auth/login')
  }
}

