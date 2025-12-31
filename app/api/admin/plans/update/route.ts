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
    const { planId, updates } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID requis' },
        { status: 400 }
      )
    }

    // ============================================================================
    // RÉCUPÉRER LE PLAN AVANT MODIFICATION (pour historique)
    // ============================================================================
    const { data: currentPlan, error: fetchError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (fetchError || !currentPlan) {
      console.error('❌ Plan non trouvé:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Plan non trouvé' },
        { status: 404 }
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

    // ============================================================================
    // CONSTRUIRE L'OBJET CHANGES DÉTAILLÉ (old → new)
    // ============================================================================
    const detailedChanges: any = {}
    
    if (currentPlan.display_name !== updatedPlan.display_name) {
      detailedChanges.display_name = { old: currentPlan.display_name, new: updatedPlan.display_name }
    }
    if (currentPlan.description !== updatedPlan.description) {
      detailedChanges.description = { old: currentPlan.description, new: updatedPlan.description }
    }
    if (currentPlan.price_monthly !== updatedPlan.price_monthly) {
      detailedChanges.price_monthly = { old: currentPlan.price_monthly, new: updatedPlan.price_monthly }
    }
    if (currentPlan.max_users !== updatedPlan.max_users) {
      detailedChanges.max_users = { old: currentPlan.max_users, new: updatedPlan.max_users }
    }
    if (currentPlan.max_leads !== updatedPlan.max_leads) {
      detailedChanges.max_leads = { old: currentPlan.max_leads, new: updatedPlan.max_leads }
    }
    if (currentPlan.max_storage_gb !== updatedPlan.max_storage_gb) {
      detailedChanges.max_storage_gb = { old: currentPlan.max_storage_gb, new: updatedPlan.max_storage_gb }
    }
    if (currentPlan.max_workflows !== updatedPlan.max_workflows) {
      detailedChanges.max_workflows = { old: currentPlan.max_workflows, new: updatedPlan.max_workflows }
    }
    if (JSON.stringify(currentPlan.features) !== JSON.stringify(updatedPlan.features)) {
      detailedChanges.features = { old: currentPlan.features, new: updatedPlan.features }
    }

    // ============================================================================
    // DÉCLENCHER LE WORKFLOW N8N
    // ============================================================================
    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.talosprimes.com'
    
    try {
      console.log('🔔 Déclenchement workflow N8N: plan-modified')
      
      const n8nResponse = await fetch(`${n8nWebhookUrl}/webhook/plan-modified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'plan_updated',
          planId: updatedPlan.id,
          planName: updatedPlan.display_name,
          modifiedBy: user.email,
          modifiedAt: new Date().toISOString(),
          changes: detailedChanges,
          plan: {
            id: updatedPlan.id,
            name: updatedPlan.name,
            display_name: updatedPlan.display_name,
            price_monthly: updatedPlan.price_monthly,
            max_users: updatedPlan.max_users,
            max_leads: updatedPlan.max_leads,
            max_storage_gb: updatedPlan.max_storage_gb,
            max_workflows: updatedPlan.max_workflows
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

