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
  // Forcer le rendu dynamique avec unstable_noStore
  unstable_noStore()
  
  // Vérifier l'authentification (sans request pour server components)
  // createServerClient() utilise cookies() en interne, ce qui force le rendu dynamique
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('[MakePage] User not authenticated, redirecting to login')
    redirect('/auth/login')
  }

  // Vérifier que l'utilisateur est plateforme
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) {
    redirect('/auth/login')
  }

  // Récupérer platform_company_id
  const { data: platformSetting } = await adminSupabase
    .from('settings')
    .select('value')
    .eq('key', 'platform_company_id')
    .single()

  if (!platformSetting) {
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
    redirect('/dashboard')
  }

  // Si l'utilisateur est plateforme, rendre le client component
  return <MakePageClient />
}

