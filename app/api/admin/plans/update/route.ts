import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

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

    // Vérifier que l'utilisateur est admin plateforme
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le rôle
    const roleName = (userData.roles as any)?.name || (userData.roles as any)?.[0]?.name
    if (roleName !== 'Administrateur Plateforme') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé. Réservé aux administrateurs.' },
        { status: 403 }
      )
    }

    // Récupérer les données
    const { planId, updates } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID requis' },
        { status: 400 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.displayName) updateData.display_name = updates.displayName
    if (updates.description) updateData.description = updates.description
    if (updates.price !== undefined) updateData.price_monthly = updates.price
    if (updates.quotas) {
      if (updates.quotas.maxUsers !== undefined) updateData.max_users = updates.quotas.maxUsers
      if (updates.quotas.maxLeads !== undefined) updateData.max_leads = updates.quotas.maxLeads
      if (updates.quotas.maxStorageGb !== undefined) updateData.max_storage_gb = updates.quotas.maxStorageGb
      if (updates.quotas.maxWorkflows !== undefined) updateData.max_workflows = updates.quotas.maxWorkflows
    }
    if (updates.features) updateData.features = updates.features
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    // Mettre à jour le plan
    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from('subscription_plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur mise à jour plan:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    // Déclencher le workflow N8N pour notifier les changements
    try {
      await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL + '/webhook/plan-modified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: updatedPlan.id,
          planName: updatedPlan.display_name,
          changes: updates,
          modifiedBy: user.email,
          modifiedAt: new Date().toISOString()
        })
      })
    } catch (webhookError) {
      console.error('Erreur webhook N8N:', webhookError)
      // Ne pas faire échouer la requête si le webhook échoue
    }

    console.log('✅ Plan modifié avec succès:', updatedPlan.display_name)

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'Plan modifié avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur modification plan:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

