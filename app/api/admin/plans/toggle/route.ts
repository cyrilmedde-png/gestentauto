import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { isPlatformCompany } from '@/lib/platform/supabase'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const supabaseAdmin = createAdminClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est admin plateforme (même logique que check-user-type)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !userData.company_id) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Utiliser la même logique que ProtectedPlatformRoute
    const isAdmin = await isPlatformCompany(userData.company_id)
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé. Réservé aux administrateurs plateforme.' },
        { status: 403 }
      )
    }

    // Récupérer les données
    const { planId, isActive } = await request.json()

    if (!planId || isActive === undefined) {
      return NextResponse.json(
        { success: false, error: 'Plan ID et statut requis' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut
    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from('subscription_plans')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur toggle plan:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Plan ${isActive ? 'activé' : 'désactivé'}:`, updatedPlan.display_name)

    // ============================================================================
    // DÉCLENCHER LE WORKFLOW N8N
    // ============================================================================
    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.talosprimes.com'
    
    try {
      console.log('🔔 Déclenchement workflow N8N: plan-toggled')
      
      const n8nResponse = await fetch(`${n8nWebhookUrl}/webhook/plan-modified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'plan_toggled',
          planId: updatedPlan.id,
          planName: updatedPlan.display_name,
          modifiedBy: user.email,
          isActive: updatedPlan.is_active,
          action: isActive ? 'activated' : 'deactivated',
          modifiedAt: new Date().toISOString(),
          plan: {
            id: updatedPlan.id,
            name: updatedPlan.name,
            display_name: updatedPlan.display_name,
            price_monthly: updatedPlan.price_monthly
          }
        })
      })
      
      if (n8nResponse.ok) {
        console.log('✅ Workflow N8N déclenché avec succès')
      } else {
        console.warn('⚠️ Workflow N8N échoué (non bloquant):', n8nResponse.status)
      }
    } catch (webhookError) {
      console.error('⚠️ Erreur webhook N8N (non bloquant):', webhookError)
      // Ne pas faire échouer la requête si le webhook échoue
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: `Plan ${isActive ? 'activé' : 'désactivé'} avec succès`
    })

  } catch (error) {
    console.error('❌ Erreur toggle plan:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

