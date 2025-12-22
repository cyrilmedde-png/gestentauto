import { NextRequest, NextResponse } from 'next/server'
// ⚠️ Cette route utilise maintenant le client plateforme
import { createPlatformClient } from '@/lib/supabase/platform'
import { getPlatformCompanyId } from '@/lib/platform/supabase'
import { verifyPlatformUser, createForbiddenResponse } from '@/lib/middleware/platform-auth'

// ⚠️ Cette route utilise maintenant le client plateforme pour compatibilité avec le frontend
// ⚠️ Accès réservé aux utilisateurs plateforme uniquement

export async function GET(request: NextRequest) {
  try {
    // ✅ Vérifier que l'utilisateur est plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

    const supabase = createPlatformClient()
    
    // Récupérer l'ID de l'entreprise plateforme
    let platformCompanyId = await getPlatformCompanyId()

    // Si la plateforme n'existe pas, la créer
    if (!platformCompanyId) {
      // Créer l'entreprise plateforme
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'Plateforme SaaS',
          country: 'FR'
        })
        .select()
        .single()

      if (companyError) throw companyError

      platformCompanyId = newCompany.id

      // Sauvegarder l'ID dans les settings (en utilisant l'ID de la plateforme comme company_id)
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          company_id: newCompany.id,
          key: 'platform_company_id',
          value: newCompany.id as unknown // JSONB value - Supabase accepte string pour JSONB
        })

      if (settingsError) {
        console.error('Erreur lors de la sauvegarde du setting:', settingsError)
        // On continue quand même car la company est créée
      }
      
      platformCompanyId = newCompany.id
    }

    // Récupérer les informations de la plateforme
    const { data: platform, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', platformCompanyId)
      .single()

    if (error) throw error

    return NextResponse.json({ platform })
  } catch (error) {
    console.error('Erreur API platform:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ Vérifier que l'utilisateur est plateforme
    const { isPlatform, error: authError } = await verifyPlatformUser(request)
    
    if (!isPlatform) {
      return createForbiddenResponse(authError || 'Access denied. Platform user required.')
    }

    const supabase = createPlatformClient()
    const body = await request.json()

    // Récupérer l'ID de l'entreprise plateforme
    let platformCompanyId = await getPlatformCompanyId()

    // Si la plateforme n'existe pas, la créer d'abord
    if (!platformCompanyId) {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: body.name || 'Plateforme SaaS',
          country: body.country || 'FR'
        })
        .select()
        .single()

      if (companyError) throw companyError
      platformCompanyId = newCompany.id

      await supabase
        .from('settings')
        .upsert({
          company_id: newCompany.id,
          key: 'platform_company_id',
          value: newCompany.id as unknown // JSONB value - Supabase accepte string pour JSONB
        })
      
      platformCompanyId = newCompany.id
    }

    // Mettre à jour l'entreprise plateforme
    const { data: updated, error } = await supabase
      .from('companies')
      .update({
        name: body.name,
        siret: body.siret || null,
        vat_number: body.vat_number || null,
        address: body.address || null,
        city: body.city || null,
        postal_code: body.postal_code || null,
        country: body.country || 'FR',
        phone: body.phone || null,
        email: body.email || null
      })
      .eq('id', platformCompanyId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ platform: updated })
  } catch (error) {
    console.error('Erreur API platform:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}

