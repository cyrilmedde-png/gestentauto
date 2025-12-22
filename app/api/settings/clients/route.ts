import { NextResponse } from 'next/server'
// ⚠️ DEPRECATED: Cette route est dépréciée, utiliser /api/platform/companies à la place
// Conservée pour compatibilité temporaire avec le frontend
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'

export async function GET() {
  try {
    // Redirection vers la nouvelle API plateforme
    const supabase = createPlatformClient()
    const platformId = await getPlatformCompanyId()

    if (!platformId) {
      return NextResponse.json({ clients: [] })
    }

    // Récupérer toutes les entreprises SAUF la plateforme elle-même
    // La plateforme voit tous ses clients (entreprises abonnées)
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, email, phone, created_at')
      .neq('id', platformId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Éviter les doublons : garder uniquement la plus ancienne entreprise par nom
    const uniqueCompanies = new Map<string, typeof companies[0]>()
    if (companies) {
      // Trier par date de création (plus ancienne en premier)
      const sortedCompanies = [...companies].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      for (const company of sortedCompanies) {
        const key = company.name.toLowerCase().trim()
        if (!uniqueCompanies.has(key)) {
          uniqueCompanies.set(key, company)
        }
      }
    }

    // NOTE IMPORTANTE : 
    // La plateforme voit ici TOUS ses clients (entreprises abonnées)
    // Mais elle ne doit PAS voir les "clients des clients" (ex: clients CRM de chaque entreprise)
    // Ces données seront filtrées au niveau des APIs spécifiques des modules (CRM, etc.)

    // Pour chaque entreprise unique, récupérer le statut d'abonnement depuis settings
    const clients = await Promise.all(
      Array.from(uniqueCompanies.values()).map(async (company) => {
        const { data: subscriptionSetting } = await supabase
          .from('settings')
          .select('value')
          .eq('company_id', company.id)
          .eq('key', 'subscription_status')
          .single()

        return {
          ...company,
          subscription_status: subscriptionSetting?.value as string | undefined
        }
      })
    )

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Erreur API clients:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}

