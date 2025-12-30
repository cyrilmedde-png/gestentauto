import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/stripe/subscriptions/current
 * Récupère l'abonnement actif de l'utilisateur connecté
 */
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les infos utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer l'abonnement avec la formule
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('company_id', userData.company_id)
      .single()

    if (subError || !subscription) {
      // Pas d'abonnement = mode essai ou gratuit
      return NextResponse.json({
        success: true,
        subscription: null,
        hasSubscription: false,
      })
    }

    // Formater les données
    const formattedSubscription = {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      canceledAt: subscription.canceled_at,
      cancelReason: subscription.cancel_reason,
      trialEnd: subscription.trial_end,
      amount: subscription.amount,
      currency: subscription.currency,
      nextPaymentAt: subscription.next_payment_at,
      lastPaymentAt: subscription.last_payment_at,
      plan: subscription.plan ? {
        id: subscription.plan.id,
        name: subscription.plan.name,
        displayName: subscription.plan.display_name,
        description: subscription.plan.description,
        price: subscription.plan.price_monthly,
        features: subscription.plan.features || [],
        modules: subscription.plan.modules || [],
        quotas: {
          maxUsers: subscription.plan.max_users,
          maxLeads: subscription.plan.max_leads,
          maxClients: subscription.plan.max_clients,
          maxStorageGb: subscription.plan.max_storage_gb,
          maxWorkflows: subscription.plan.max_workflows,
        },
      } : null,
    }

    return NextResponse.json({
      success: true,
      subscription: formattedSubscription,
      hasSubscription: true,
    })
  } catch (error) {
    console.error('❌ Erreur récupération abonnement:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

